"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  hasAnyTrigger,
  POPUP_OPEN_EVENT,
  popUpFrequencyStorageKey,
  resolveActivePopUp,
  type PopUp,
} from "@/lib/popup";
import { pageHrefFor, type SitePage } from "@/lib/pages";

import { PopUpDialog } from "./PopUpDialog";

/**
 * ============================================================================
 * HOST PUBLIC DES POP-UPS — déclencheurs, fréquence, résolution de cible
 * ----------------------------------------------------------------------------
 * Monté **dans** le wrapper de thème `display: contents` du layout front-office,
 * après le Footer (la pop-up n'ajoute aucun nœud de mise en page tant qu'elle
 * n'est pas ouverte). Il ne fait **aucun rendu serveur utile** : il rend `null`
 * jusqu'au montage, car la cible dépend de `usePathname()`, les déclencheurs
 * d'horloges/événements et la fréquence d'un stockage navigateur. Calculer tout
 * cela au rendu serveur produirait un désaccord d'hydratation (le HTML ne peut
 * pas connaître la page visitée ni l'historique local).
 *
 * Politique (voir `resolveActivePopUp`) : **au plus une pop-up par chargement**,
 * la pop-up de page l'emportant sur la pop-up globale ciblée. Aucun empilement.
 *
 * Fréquence et stockage :
 *   - `every`   : rien n'est mémorisé ;
 *   - `session` : `sessionStorage` (disparaît avec l'onglet) ;
 *   - `days`    : `localStorage` avec échéance horodatée ;
 *   - `once`    : `localStorage` définitif ;
 *   - `suppressAfterSubmit` : clé distincte, bloquante même en manuel (Lot C).
 * Tout accès au stockage est encapsulé : en navigation privée stricte, l'accès
 * peut lever — on dégrade alors en « une fois par chargement ».
 * ============================================================================
 */

/** Page minimale nécessaire au ciblage (issue du loader serveur). */
export type PublicPopUpPage = Pick<
  SitePage,
  "id" | "slug" | "isHome" | "popupId"
>;

type PublicPopUpHostProps = {
  popups: PopUp[];
  pages: PublicPopUpPage[];
  /** Préfixe de fréquence (photographe courant) — jamais un contenu. */
  photographerId: string;
};

/** Lecture défensive d'un stockage (navigation privée stricte, quota…). */
function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Écriture défensive — un échec laisse la pop-up « une fois par chargement ». */
function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Stockage indisponible : la fréquence ne sera pas mémorisée, c'est tout.
  }
}

/** true si la fréquence empêche l'ouverture **automatique** de cette pop-up. */
function isFrequencyBlocked(popup: PopUp, photographerId: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  switch (popup.frequency.mode) {
    case "every":
      return false;
    case "session":
      return (
        readStorage(
          window.sessionStorage,
          popUpFrequencyStorageKey(photographerId, popup.id, "seen")
        ) !== null
      );
    case "days": {
      const until = readStorage(
        window.localStorage,
        popUpFrequencyStorageKey(photographerId, popup.id, "until")
      );
      if (until === null) {
        return false;
      }
      const timestamp = Number.parseInt(until, 10);
      return Number.isFinite(timestamp) && timestamp > Date.now();
    }
    case "once":
      return (
        readStorage(
          window.localStorage,
          popUpFrequencyStorageKey(photographerId, popup.id, "seen")
        ) !== null
      );
    default:
      return false;
  }
}

/** true si une soumission interdit toute réaffichage, même manuel. */
function isSubmitBlocked(popup: PopUp, photographerId: string): boolean {
  if (typeof window === "undefined" || !popup.frequency.suppressAfterSubmit) {
    return false;
  }
  return (
    readStorage(
      window.localStorage,
      popUpFrequencyStorageKey(photographerId, popup.id, "submitted")
    ) !== null
  );
}

/** Mémorise l'affichage pour les modes `session` / `days` / `once`. */
function markSeen(popup: PopUp, photographerId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  switch (popup.frequency.mode) {
    case "session":
      writeStorage(
        window.sessionStorage,
        popUpFrequencyStorageKey(photographerId, popup.id, "seen"),
        "1"
      );
      return;
    case "days":
      writeStorage(
        window.localStorage,
        popUpFrequencyStorageKey(photographerId, popup.id, "until"),
        String(Date.now() + popup.frequency.days * 24 * 60 * 60 * 1000)
      );
      return;
    case "once":
      writeStorage(
        window.localStorage,
        popUpFrequencyStorageKey(photographerId, popup.id, "seen"),
        "1"
      );
      return;
    default:
      return;
  }
}

/** true si l'écran est tactile (le déclencheur exit-intent n'y a pas de sens). */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
  );
}

/**
 * Source « monté » stable (identités au niveau module) : un abonnement vide,
 * `true` côté client, `false` côté serveur. Des fonctions recréées à chaque
 * rendu feraient résouscrire `useSyncExternalStore` inutilement.
 */
const subscribeMounted = (): (() => void) => () => {};
const getMountedSnapshot = (): boolean => true;
const getMountedServerSnapshot = (): boolean => false;

export function PublicPopUpHost({
  popups,
  pages,
  photographerId,
}: PublicPopUpHostProps) {
  const pathname = usePathname();

  /**
   * « Monté » détecté sans `setState` dans un effet : `getServerSnapshot` rend
   * `false` (le HTML serveur reste vide), `getSnapshot` rend `true` côté client
   * après hydratation. C'est le seul moyen de ne lire ni `localStorage` ni la
   * page visitée au rendu serveur, sans provoquer de désaccord d'hydratation.
   */
  const mounted = React.useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getMountedServerSnapshot
  );

  /**
   * La pop-up ouverte est identifiée par **l'id de la cible** : la navigation
   * SPA change `active` sans effet de réinitialisation, et un `openId` qui ne
   * correspond plus referme mécaniquement la boîte (pas de `setState` dans un
   * effet, pas de course entre deux rendus).
   */
  const [openId, setOpenId] = React.useState<string | null>(null);
  /**
   * Un seul déclenchement automatique par pop-up et par chargement : sans ce
   * verrou, fermer une pop-up « à chaque visite » relancerait aussitôt son
   * minuteur, et la boîte se rouvrirait en boucle.
   */
  const [shownId, setShownId] = React.useState<string | null>(null);

  const page = React.useMemo<PublicPopUpPage | null>(
    () => pages.find((item) => pageHrefFor(item) === pathname) ?? null,
    [pages, pathname]
  );

  const active = React.useMemo(
    () =>
      resolveActivePopUp(popups, {
        pageId: page?.id ?? null,
        isHome: page?.isHome ?? false,
        pagePopUpId: page?.popupId ?? null,
      }),
    [popups, page]
  );

  const open = active !== null && openId === active.id;

  // Déclencheurs automatiques — seulement si la cible, les triggers et la
  // fréquence l'autorisent. Le tactile n'est jamais attaché à l'exit-intent.
  React.useEffect(() => {
    if (!mounted || active === null || open) {
      return;
    }
    if (shownId === active.id) {
      return;
    }
    if (isSubmitBlocked(active, photographerId)) {
      return;
    }

    const isMobileViewport =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    // `mobileAutoOpen === false` (défaut) désactive timer / scroll / exit-intent
    // sur mobile ; le clic manuel reste actif (effet séparé).
    const autoAllowed = !isMobileViewport || active.mobileAutoOpen;
    if (!autoAllowed || !hasAnyTrigger(active.triggers)) {
      return;
    }
    if (isFrequencyBlocked(active, photographerId)) {
      return;
    }

    const cleanups: Array<() => void> = [];

    if (active.triggers.timer.enabled) {
      const timer = window.setTimeout(() => {
        setShownId(active.id);
        setOpenId(active.id);
      }, active.triggers.timer.delaySeconds * 1000);
      cleanups.push(() => window.clearTimeout(timer));
    }

    if (active.triggers.scrollDepth.enabled) {
      const target = active.triggers.scrollDepth.percent;
      const onScroll = (): void => {
        const documentElement = document.documentElement;
        const scrollable = documentElement.scrollHeight - window.innerHeight;
        const percent =
          scrollable <= 0 ? 100 : (window.scrollY / scrollable) * 100;
        if (percent >= target) {
          setShownId(active.id);
          setOpenId(active.id);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    if (active.triggers.exitIntent.enabled && !isTouchDevice()) {
      const onMouseOut = (event: MouseEvent): void => {
        // Vers le haut de la fenêtre, souris sortant réellement du document :
        // c'est « l'intention de sortie ». Jamais attaché au tactile.
        if (event.clientY <= 0 && event.relatedTarget === null) {
          setShownId(active.id);
          setOpenId(active.id);
        }
      };
      document.addEventListener("mouseout", onMouseOut);
      cleanups.push(() => document.removeEventListener("mouseout", onMouseOut));
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [mounted, active, open, shownId, photographerId]);

  // Déclenchement manuel (`popup:<id>` émis par `NavLink`) : ignore la
  // fréquence `session`/`days`/`once` (un clic est une intention explicite),
  // mais respecte le blocage après soumission.
  React.useEffect(() => {
    if (!mounted || active === null || !active.triggers.click.enabled) {
      return;
    }
    const onOpenRequest = (event: Event): void => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== active.id) {
        return;
      }
      if (isSubmitBlocked(active, photographerId)) {
        return;
      }
      setShownId(active.id);
      setOpenId(active.id);
    };
    window.addEventListener(POPUP_OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(POPUP_OPEN_EVENT, onOpenRequest);
  }, [mounted, active, photographerId]);

  if (!mounted || active === null) {
    return null;
  }

  return (
    <PopUpDialog
      popup={active}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          markSeen(active, photographerId);
          setOpenId(null);
        } else {
          setOpenId(active.id);
        }
      }}
    />
  );
}
