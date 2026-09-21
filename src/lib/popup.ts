/**
 * ============================================================================
 * MODULE « POP-UP » — domaine pur
 * ----------------------------------------------------------------------------
 * Une pop-up est une **entité dédiée** (`site_popups`), jamais une famille
 * `PageModuleType`. Ce n'est pas un choix esthétique : `publicDescription`,
 * `publicOgImage` et `collectImageUrls` (`src/lib/public-page.ts`) itèrent
 * `page.modules` — une pop-up posée dans `page.modules` fuiterait dans la meta
 * description, l'image OpenGraph et la résolution EXIF, et il faudrait l'exclure
 * dans trois fonctions distinctes sans garantie d'exhaustivité. Elle entrerait
 * aussi dans l'ordre DnD, le calcul du `h1` unique et l'`anchorId`, alors qu'elle
 * n'appartient jamais au flux vertical. Enfin, une pop-up **globale** ne peut pas
 * vivre dans `pages` sans duplication, et une famille `PageModuleType` exigerait
 * en plus un `ALTER TYPE module_type` (voir `src/db/schema.ts`).
 *
 * Le patron exact existe déjà : `site_top_banner` (table, repository, API,
 * store, écrans). On le copie plutôt que d'en inventer un second.
 *
 * Ce fichier est **pur (aucun "use client", aucun React)** → importable côté
 * serveur (schéma BDD, repository/`normalizePopUp`) comme côté client (store
 * admin, rendu public). Les déclencheurs et la fréquence, eux, restent
 * **client-only** : ils sont calculés après montage, jamais au rendu serveur.
 *
 * Politique d'affichage : **au plus une pop-up par chargement** — la pop-up de
 * page (`pages.popup_id`) l'emporte sur la pop-up globale ciblée ; aucun
 * empilement. La règle est encodée dans `resolveActivePopUp`.
 *
 * Référence : .kilo/plans/1789854761291-popup-module-plan.md
 * ============================================================================
 */

import {
  moduleAnimationOrder,
  type HeroCtaStyle,
  type MediaField,
  type ModuleAnimation,
} from "./pages";

/** Portée : pop-up globale (réglage du site) ou rattachée à une page. */
export type PopUpScope = "global" | "page";

/** Ciblage d'une pop-up globale. */
export type PopUpTargetingMode = "all" | "home" | "pages";

/** Format d'affichage. */
export type PopUpLayout = "modal" | "slide-in" | "fullscreen";

/** Position du panneau latéral (`slide-in`). */
export type PopUpSlidePosition = "bottom-right" | "bottom-left";

/** Contrôle de fréquence. */
export type PopUpFrequencyMode = "every" | "session" | "days" | "once";

/** Nature du contenu (mode inertes tant que la décision produit n'est pas prise). */
export type PopUpContentKind = "message" | "promo" | "lead";

/** Déclencheurs d'ouverture automatique (le clic manuel est toujours possible). */
export interface PopUpTriggers {
  /** Minuterie en secondes — bornée 0..120 (défaut 5). */
  timer: { enabled: boolean; delaySeconds: number };
  /** Intention de sortie (souris vers le haut) — inopérant au tactile. */
  exitIntent: { enabled: boolean };
  /** Profondeur de défilement en pourcentage — bornée 10..100 (défaut 50). */
  scrollDepth: { enabled: boolean; percent: number };
  /** Ouverture manuelle : un lien `popup:<id>` déclenche la pop-up. */
  click: { enabled: boolean };
}

/** Règles de réapparition, stockées en `localStorage`/`sessionStorage`. */
export interface PopUpFrequency {
  mode: PopUpFrequencyMode;
  /** Nombre de jours pour `mode === "days"` — borné 1..365 (défaut 7). */
  days: number;
  /** Ne plus jamais réafficher après une soumission de formulaire (Lot C). */
  suppressAfterSubmit: boolean;
}

/** Ciblage d'une pop-up globale (ignoré pour une pop-up de page). */
export interface PopUpTargeting {
  mode: PopUpTargetingMode;
  /** Pages choisies pour `mode === "pages"`. */
  pageIds: string[];
}

/** Appel à l'action optionnel — `href` suit la convention du site (mode dérivé). */
export interface PopUpCta {
  show: boolean;
  label: string;
  href: string;
  style: HeroCtaStyle;
}

/** Configuration complète d'une pop-up. */
export interface PopUp {
  /** Identifiant stable (côté client : crypto.randomUUID()). */
  id: string;
  enabled: boolean;
  /** Libellé d'administration — jamais rendu publiquement. */
  name: string;
  scope: PopUpScope;
  /** Pertinent uniquement pour `scope === "global"`. */
  targeting: PopUpTargeting;
  contentKind: PopUpContentKind;
  heading: string;
  /** Texte simple (pas de rich text dans ce lot). */
  body: string;
  media: MediaField | null;
  cta: PopUpCta;
  /** `contentKind === "promo"` : code affiché avec un bouton « Copier ». */
  promoCode: string;
  /** `contentKind === "lead"` : vrai pour demander aussi le prénom. */
  leadCollectName: boolean;
  triggers: PopUpTriggers;
  frequency: PopUpFrequency;
  /** Défaut `false` : les déclencheurs auto sont désactivés sur mobile. */
  mobileAutoOpen: boolean;
  layout: PopUpLayout;
  slidePosition: PopUpSlidePosition;
  /** Voile assombri (modal / fullscreen uniquement). */
  overlay: boolean;
  /** Fermeture au clic sur le voile. */
  dismissOnOverlay: boolean;
  /** Réutilise l'énumération existante des animations de module. */
  animation: ModuleAnimation;
}

/** Configuration par défaut (l'`id` est fourni par `createDefaultPopUp`). */
export const DEFAULT_POPUP: PopUp = {
  id: "",
  enabled: false,
  name: "",
  scope: "global",
  targeting: { mode: "all", pageIds: [] },
  contentKind: "message",
  heading: "",
  body: "",
  media: null,
  cta: { show: false, label: "", href: "", style: "primary" },
  promoCode: "",
  leadCollectName: false,
  triggers: {
    timer: { enabled: false, delaySeconds: 5 },
    exitIntent: { enabled: false },
    scrollDepth: { enabled: false, percent: 50 },
    click: { enabled: false },
  },
  frequency: { mode: "session", days: 7, suppressAfterSubmit: true },
  mobileAutoOpen: false,
  layout: "modal",
  slidePosition: "bottom-right",
  overlay: true,
  dismissOnOverlay: true,
  // « Fade-in » plutôt que « Par défaut du thème » : une pop-up apparaît sans
  // déclencheur visuel propre, un fondu est le minimum qui la rende lisible.
  animation: "fade-in",
};

/** Bornes de saisie — partagées par l'éditeur et le résolveur. */
export const POPUP_LIMITS = {
  timerMin: 0,
  timerMax: 120,
  scrollMin: 10,
  scrollMax: 100,
  daysMin: 1,
  daysMax: 365,
} as const;

/* --------------------------------------------------------------------------
   ORDRES + LIBELLÉS FRANÇAIS (sélecteurs d'édition)
   -------------------------------------------------------------------------- */

export const popUpScopeOrder: PopUpScope[] = ["global", "page"];
export const popUpScopeLabels: Record<PopUpScope, string> = {
  global: "Pop-up du site (globale)",
  page: "Pop-up d’une page précise",
};

export const popUpTargetingModeOrder: PopUpTargetingMode[] = [
  "all",
  "home",
  "pages",
];
export const popUpTargetingModeLabels: Record<PopUpTargetingMode, string> = {
  all: "Toutes les pages",
  home: "Page d’accueil uniquement",
  pages: "Pages choisies",
};

export const popUpLayoutOrder: PopUpLayout[] = [
  "modal",
  "slide-in",
  "fullscreen",
];
export const popUpLayoutLabels: Record<PopUpLayout, string> = {
  modal: "Fenêtre centrée",
  "slide-in": "Panneau latéral",
  fullscreen: "Plein écran",
};

export const popUpSlidePositionOrder: PopUpSlidePosition[] = [
  "bottom-right",
  "bottom-left",
];
export const popUpSlidePositionLabels: Record<PopUpSlidePosition, string> = {
  "bottom-right": "En bas à droite",
  "bottom-left": "En bas à gauche",
};

export const popUpFrequencyOrder: PopUpFrequencyMode[] = [
  "every",
  "session",
  "days",
  "once",
];
export const popUpFrequencyLabels: Record<PopUpFrequencyMode, string> = {
  every: "À chaque chargement de page",
  session: "Une fois par session de navigation",
  days: "Une fois tous les X jours",
  once: "Une seule fois, définitivement",
};

export const popUpContentKindOrder: PopUpContentKind[] = [
  "message",
  "promo",
  "lead",
];
export const popUpContentKindLabels: Record<PopUpContentKind, string> = {
  message: "Message simple",
  promo: "Code promotionnel",
  lead: "Capture d’e-mail",
};

/* --------------------------------------------------------------------------
   HELPERS PURS
   -------------------------------------------------------------------------- */

/** Préfixe des clés de fréquence — sert aussi à purger un affichage. */
export const POPUP_FREQUENCY_PREFIX = "popup";

/**
 * Événement de fenêtre qui demande l'ouverture d'une pop-up en mode **manuel**
 * (`popup:<id>`). Un événement plutôt qu'un contexte React : le déclencheur vit
 * dans n'importe quel rendu de lien public (`NavLink`), potentiellement très
 * loin du host dans l'arbre — et un événement reste découplé du thème.
 */
export const POPUP_OPEN_EVENT = "popup:open";

/** `href` d'un déclencheur manuel : `popup:<id>`. */
export function popUpHref(id: string): string {
  return `popup:${id}`;
}

/** true si le `href` désigne une pop-up. */
export function isPopUpHref(href: string): boolean {
  return href.trim().toLowerCase().startsWith("popup:");
}

/** Identifiant extrait d'un `href` `popup:<id>`, ou `null`. */
export function popUpIdFromHref(href: string): string | null {
  const value = href.trim();
  if (!isPopUpHref(value)) {
    return null;
  }
  const id = value.slice("popup:".length).trim();
  return id === "" ? null : id;
}

/** true si au moins un déclencheur automatique est actif (sinon jamais d'auto). */
export function hasAnyTrigger(triggers: PopUpTriggers): boolean {
  return (
    triggers.timer.enabled ||
    triggers.exitIntent.enabled ||
    triggers.scrollDepth.enabled
  );
}

/** true si la pop-up porte du contenu affichable (sinon on ne l'ouvre pas). */
export function popUpHasContent(popup: PopUp): boolean {
  return (
    popup.heading.trim() !== "" ||
    popup.body.trim() !== "" ||
    (popup.media !== null && popup.media.url.trim() !== "") ||
    (popup.cta.show &&
      popup.cta.label.trim() !== "" &&
      popup.cta.href.trim() !== "") ||
    (popup.contentKind === "promo" && popup.promoCode.trim() !== "")
  );
}

/** Contexte de résolution : page courante + pop-up épinglée par la page. */
export interface PopUpResolutionContext {
  pageId: string | null;
  isHome: boolean;
  pagePopUpId: string | null;
}

/** true si une pop-up globale cible la page courante. */
export function popUpTargetingMatches(
  popup: PopUp,
  context: Pick<PopUpResolutionContext, "pageId" | "isHome">
): boolean {
  switch (popup.targeting.mode) {
    case "all":
      return true;
    case "home":
      return context.isHome;
    case "pages":
      return (
        context.pageId !== null && popup.targeting.pageIds.includes(context.pageId)
      );
    default:
      return false;
  }
}

/**
 * Pop-up à afficher, ou `null`.
 *
 * Priorité (décision assumée, aucun empilement) :
 *   1. la pop-up **de page** (`pages.popup_id`), si elle est activée et a du
 *      contenu — le choix explicite du photographe prime ;
 *   2. la **première** pop-up globale activée, dans l'ordre de la liste, dont le
 *      ciblage couvre la page courante.
 *
 * Une pop-up sans contenu est ignorée plutôt qu'ouverte sur une boîte vide.
 */
export function resolveActivePopUp(
  popups: readonly PopUp[],
  context: PopUpResolutionContext
): PopUp | null {
  if (context.pagePopUpId !== null) {
    const pinned = popups.find((popup) => popup.id === context.pagePopUpId);
    if (pinned !== undefined && pinned.enabled && popUpHasContent(pinned)) {
      return pinned;
    }
  }

  for (const popup of popups) {
    if (!popup.enabled || popup.scope !== "global") {
      continue;
    }
    if (!popUpHasContent(popup)) {
      continue;
    }
    if (popUpTargetingMatches(popup, context)) {
      return popup;
    }
  }

  return null;
}

/* --------------------------------------------------------------------------
   FRÉQUENCE (client-only — jamais au rendu serveur)
   -------------------------------------------------------------------------- */

/**
 * Clé de stockage d'un état de pop-up. Le préfixe `popup:<photographerId>`
 * évite qu'un futur multi-tenant partage l'état de deux sites sur un même
 * navigateur ; la clé n'est **jamais** lue au rendu serveur.
 */
export function popUpFrequencyStorageKey(
  photographerId: string,
  popupId: string,
  suffix: string
): string {
  return `${POPUP_FREQUENCY_PREFIX}:${photographerId}:${popupId}:${suffix}`;
}

/**
 * Purge les états mémorisés d'une pop-up (bouton « Réinitialiser l'affichage »
 * de l'éditeur). On balaie les deux stockages par **sous-chaîne d'id** plutôt
 * que de reconstruire les clés exactes : l'éditeur ne connaît pas le
 * `photographerId` côté client, et une clé orpheline (renommée) serait oubliée.
 * `localStorage` peut lever (navigation privée stricte) : on dégrade en silence.
 */
export function clearPopUpFrequencyStorage(popupId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const purge = (storage: Storage): void => {
    try {
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null && key.includes(popupId)) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        storage.removeItem(key);
      }
    } catch {
      // Stockage indisponible : rien à purger, l'affichage est déjà en mémoire.
    }
  };
  try {
    purge(window.localStorage);
    purge(window.sessionStorage);
  } catch {
    // `window.localStorage` peut lui-même lever à l'accès.
  }
}

/* --------------------------------------------------------------------------
   NORMALISATION TOLÉRANTE (JSONB) — champ par champ, jamais d'exception.
   Aucun texte n'est ressuscité : la *forme* est complétée, pas le *contenu*.
   -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readBoundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}

function isScope(value: unknown): value is PopUpScope {
  return value === "global" || value === "page";
}

function isLayout(value: unknown): value is PopUpLayout {
  return value === "modal" || value === "slide-in" || value === "fullscreen";
}

function isSlidePosition(value: unknown): value is PopUpSlidePosition {
  return value === "bottom-right" || value === "bottom-left";
}

function isFrequencyMode(value: unknown): value is PopUpFrequencyMode {
  return (
    value === "every" ||
    value === "session" ||
    value === "days" ||
    value === "once"
  );
}

function isContentKind(value: unknown): value is PopUpContentKind {
  return value === "message" || value === "promo" || value === "lead";
}

function isTargetingMode(value: unknown): value is PopUpTargetingMode {
  return value === "all" || value === "home" || value === "pages";
}

function isCtaStyle(value: unknown): value is HeroCtaStyle {
  return value === "primary" || value === "secondary" || value === "outline";
}

function isModuleAnimation(value: unknown): value is ModuleAnimation {
  return (
    typeof value === "string" &&
    (moduleAnimationOrder as string[]).includes(value)
  );
}

/** Lit un média optionnel : `null` si absent, sinon url + alt tolérants. */
function readMedia(raw: unknown): MediaField | null {
  if (!isRecord(raw)) {
    return null;
  }
  const url = typeof raw.url === "string" ? raw.url : "";
  const alt = typeof raw.alt === "string" ? raw.alt : "";
  if (url.trim() === "" && alt.trim() === "") {
    return null;
  }
  return { url, alt };
}

/** Lit le ciblage : les ids de page sont filtrés (chaînes non vides uniques). */
function readTargeting(raw: unknown): PopUpTargeting {
  const record = isRecord(raw) ? raw : {};
  const pageIdsRaw = Array.isArray(record.pageIds) ? record.pageIds : [];
  const pageIds = Array.from(
    new Set(
      pageIdsRaw.filter(
        (value): value is string => typeof value === "string" && value.trim() !== ""
      )
    )
  );
  return {
    mode: isTargetingMode(record.mode)
      ? record.mode
      : DEFAULT_POPUP.targeting.mode,
    pageIds,
  };
}

/** Lit les déclencheurs (chaque sous-bloc est borné indépendamment). */
function readTriggers(raw: unknown): PopUpTriggers {
  const record = isRecord(raw) ? raw : {};
  const timer = isRecord(record.timer) ? record.timer : {};
  const exitIntent = isRecord(record.exitIntent) ? record.exitIntent : {};
  const scrollDepth = isRecord(record.scrollDepth) ? record.scrollDepth : {};
  const click = isRecord(record.click) ? record.click : {};

  return {
    timer: {
      enabled: readBoolean(timer.enabled, false),
      delaySeconds: readBoundedNumber(
        timer.delaySeconds,
        DEFAULT_POPUP.triggers.timer.delaySeconds,
        POPUP_LIMITS.timerMin,
        POPUP_LIMITS.timerMax
      ),
    },
    exitIntent: {
      enabled: readBoolean(exitIntent.enabled, false),
    },
    scrollDepth: {
      enabled: readBoolean(scrollDepth.enabled, false),
      percent: readBoundedNumber(
        scrollDepth.percent,
        DEFAULT_POPUP.triggers.scrollDepth.percent,
        POPUP_LIMITS.scrollMin,
        POPUP_LIMITS.scrollMax
      ),
    },
    click: {
      enabled: readBoolean(click.enabled, false),
    },
  };
}

/** Lit la fréquence (les jours restent bornés même pour un autre mode). */
function readFrequency(raw: unknown): PopUpFrequency {
  const record = isRecord(raw) ? raw : {};
  return {
    mode: isFrequencyMode(record.mode)
      ? record.mode
      : DEFAULT_POPUP.frequency.mode,
    days: readBoundedNumber(
      record.days,
      DEFAULT_POPUP.frequency.days,
      POPUP_LIMITS.daysMin,
      POPUP_LIMITS.daysMax
    ),
    suppressAfterSubmit: readBoolean(
      record.suppressAfterSubmit,
      DEFAULT_POPUP.frequency.suppressAfterSubmit
    ),
  };
}

/** Lit le CTA (libellé/href libres, style validé). */
function readCta(raw: unknown): PopUpCta {
  const record = isRecord(raw) ? raw : {};
  return {
    show: readBoolean(record.show, DEFAULT_POPUP.cta.show),
    label: readString(record.label, DEFAULT_POPUP.cta.label),
    href: readString(record.href, DEFAULT_POPUP.cta.href),
    style: isCtaStyle(record.style) ? record.style : DEFAULT_POPUP.cta.style,
  };
}

/** Copie profonde des défauts (aucune référence partagée entre instances). */
function cloneDefaultPopUp(): PopUp {
  return {
    ...DEFAULT_POPUP,
    targeting: { ...DEFAULT_POPUP.targeting, pageIds: [] },
    cta: { ...DEFAULT_POPUP.cta },
    triggers: {
      timer: { ...DEFAULT_POPUP.triggers.timer },
      exitIntent: { ...DEFAULT_POPUP.triggers.exitIntent },
      scrollDepth: { ...DEFAULT_POPUP.triggers.scrollDepth },
      click: { ...DEFAULT_POPUP.triggers.click },
    },
    frequency: { ...DEFAULT_POPUP.frequency },
  };
}

/** Nouvelle configuration par défaut, **clonée** avec un id neuf. */
export function createDefaultPopUp(): PopUp {
  return { ...cloneDefaultPopUp(), id: crypto.randomUUID() };
}

/**
 * Normalise une valeur stockée (JSONB) vers une configuration complète.
 * L'`id` absent n'est **pas** inventé : sans identifiant, la pop-up est
 * inexploitable (impossible de la rattacher à une page ou de la cibler) et le
 * repository l'écarte — la forme est complétée, jamais l'identité.
 */
export function normalizePopUp(raw: unknown): PopUp {
  if (!isRecord(raw)) {
    return cloneDefaultPopUp();
  }

  return {
    id: readString(raw.id, ""),
    enabled: readBoolean(raw.enabled, DEFAULT_POPUP.enabled),
    name: readString(raw.name, DEFAULT_POPUP.name),
    scope: isScope(raw.scope) ? raw.scope : DEFAULT_POPUP.scope,
    targeting: readTargeting(raw.targeting),
    contentKind: isContentKind(raw.contentKind)
      ? raw.contentKind
      : DEFAULT_POPUP.contentKind,
    heading: readString(raw.heading, DEFAULT_POPUP.heading),
    body: readString(raw.body, DEFAULT_POPUP.body),
    media: readMedia(raw.media),
    cta: readCta(raw.cta),
    promoCode: readString(raw.promoCode, DEFAULT_POPUP.promoCode),
    leadCollectName: readBoolean(
      raw.leadCollectName,
      DEFAULT_POPUP.leadCollectName
    ),
    triggers: readTriggers(raw.triggers),
    frequency: readFrequency(raw.frequency),
    mobileAutoOpen: readBoolean(
      raw.mobileAutoOpen,
      DEFAULT_POPUP.mobileAutoOpen
    ),
    layout: isLayout(raw.layout) ? raw.layout : DEFAULT_POPUP.layout,
    slidePosition: isSlidePosition(raw.slidePosition)
      ? raw.slidePosition
      : DEFAULT_POPUP.slidePosition,
    overlay: readBoolean(raw.overlay, DEFAULT_POPUP.overlay),
    dismissOnOverlay: readBoolean(
      raw.dismissOnOverlay,
      DEFAULT_POPUP.dismissOnOverlay
    ),
    animation: isModuleAnimation(raw.animation)
      ? raw.animation
      : DEFAULT_POPUP.animation,
  };
}
