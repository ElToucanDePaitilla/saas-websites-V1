"use client";

import * as React from "react";

import { createDefaultPopUp, type PopUp } from "@/lib/popup";
import {
  persistDeletePopUp,
  persistPopUp,
} from "@/lib/persistence-client";

/**
 * ============================================================================
 * STORE PARTAGÉ — Pop-ups (Back-Office)
 * ----------------------------------------------------------------------------
 * Client Component (Provider) posé dans le layout `/admin` : porte la liste des
 * pop-ups consommée par la liste `/admin/popups`, l'éditeur `/admin/popups/[id]`
 * et le champ « Pop-up de cette page » (`PageMetadataForm`).
 *
 * La synchronisation BDD est **calquée sur `PagesStoreProvider`** (et non sur le
 * débounce simple de `TopBannerProvider`) : une pop-up est une **entité à id
 * client** qui se crée, se modifie et se supprime indépendamment, exactement
 * comme une page. Deux règles en découlent :
 *   - diff create / update / delete par comparaison (`JSON.stringify`) ;
 *   - **les références ne sont avancées qu'après un succès complet**, avec
 *     reprise à délai doublant (2 s → 30 s). Un débounce qui « oublie » une
 *     écriture refusée perdrait silencieusement une pop-up.
 *
 * Aucune pop-up n'est écrite hors BDD disponible (`persistenceEnabled`) : l'état
 * local reste alors la seule source de vérité (mode démo).
 * ============================================================================
 */

/** Délai d'inactivité avant d'écrire en base après une mutation (ms). */
const SYNC_DEBOUNCE_MS = 200;
/** Premier délai de reprise après une écriture refusée (ms). */
const RETRY_BASE_MS = 2000;
/** Délai de reprise maximal (ms) — le délai double à chaque échec. */
const RETRY_MAX_MS = 30000;

export type PopUpsStoreValue = {
  /** Liste des pop-ups (ordre d'affichage public = ordre de création). */
  popups: PopUp[];
  /** Recherche par id (`undefined` si absente). */
  getPopUp: (id: string) => PopUp | undefined;
  /** Crée une pop-up par défaut et la retourne (id neuf). */
  createPopUp: () => PopUp;
  /** Fusionne un patch dans une pop-up. */
  updatePopUp: (id: string, patch: Partial<PopUp>) => void;
  /** Supprime une pop-up (les pages rattachées sont détachées côté BDD). */
  deletePopUp: (id: string) => void;
};

const PopUpsStoreContext = React.createContext<PopUpsStoreValue | undefined>(
  undefined
);

export function PopUpProvider({
  children,
  initialPopUps,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /** Pop-ups chargées côté serveur — absentes : liste vide. */
  initialPopUps?: PopUp[];
  /** true quand la BDD est disponible : persistance des mutations. */
  persistenceEnabled?: boolean;
}) {
  const [popups, setPopups] = React.useState<PopUp[]>(
    () => initialPopUps ?? []
  );

  const previousRef = React.useRef<PopUp[] | null>(null);
  const popupsRef = React.useRef(popups);
  const runSyncRef = React.useRef<() => Promise<void>>(async () => {});
  const retryTimerRef = React.useRef<number | null>(null);
  const retryDelayRef = React.useRef(RETRY_BASE_MS);
  const syncRunningRef = React.useRef(false);
  const syncPendingRef = React.useRef(false);

  React.useEffect(() => {
    popupsRef.current = popups;
  }, [popups]);

  const runSync = React.useCallback(async (): Promise<void> => {
    if (syncRunningRef.current) {
      syncPendingRef.current = true;
      return;
    }
    syncRunningRef.current = true;

    const current = popupsRef.current;
    const previous = previousRef.current;
    if (previous === null) {
      // Premier rendu (hydratation/initialData) : rien à persister.
      previousRef.current = current;
      syncRunningRef.current = false;
      return;
    }

    const ops: Array<() => Promise<void>> = [];
    const previousById = new Map(previous.map((popup) => [popup.id, popup]));
    const nextById = new Map(current.map((popup) => [popup.id, popup]));

    for (const popup of previous) {
      if (!nextById.has(popup.id)) {
        const id = popup.id;
        ops.push(() => persistDeletePopUp(id));
      }
    }

    for (const popup of current) {
      const old = previousById.get(popup.id);
      if (old === undefined || JSON.stringify(old) !== JSON.stringify(popup)) {
        ops.push(() => persistPopUp(popup));
      }
    }

    /** Écriture réussie : l'état visé devient la nouvelle référence. */
    const markSynced = () => {
      previousRef.current = current;
      retryDelayRef.current = RETRY_BASE_MS;
    };

    /** Écriture refusée : on reprend plus tard, sans avancer la référence. */
    const scheduleRetry = () => {
      if (retryTimerRef.current !== null) {
        return;
      }
      const delay = retryDelayRef.current;
      retryDelayRef.current = Math.min(delay * 2, RETRY_MAX_MS);
      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = null;
        void runSyncRef.current();
      }, delay);
    };

    if (ops.length === 0) {
      markSynced();
    } else {
      let failed = false;
      for (const op of ops) {
        try {
          await op();
        } catch (error) {
          console.error("Persistance pop-ups :", error);
          failed = true;
          break;
        }
      }
      if (failed) {
        scheduleRetry();
      } else {
        markSynced();
      }
    }

    syncRunningRef.current = false;

    if (syncPendingRef.current) {
      syncPendingRef.current = false;
      void runSyncRef.current();
    }
  }, []);

  React.useEffect(() => {
    runSyncRef.current = runSync;
  }, [runSync]);

  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    const timer = window.setTimeout(() => {
      void runSyncRef.current();
    }, SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [popups, persistenceEnabled]);

  React.useEffect(
    () => () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    },
    []
  );

  const value = React.useMemo<PopUpsStoreValue>(() => {
    const getPopUp = (id: string): PopUp | undefined =>
      popups.find((popup) => popup.id === id);

    const createPopUp = (): PopUp => {
      const created = createDefaultPopUp();
      setPopups((previous) => [...previous, created]);
      return created;
    };

    const updatePopUp = (id: string, patch: Partial<PopUp>): void => {
      setPopups((previous) =>
        previous.map((popup) =>
          popup.id === id ? { ...popup, ...patch } : popup
        )
      );
    };

    const deletePopUp = (id: string): void => {
      setPopups((previous) => previous.filter((popup) => popup.id !== id));
    };

    return { popups, getPopUp, createPopUp, updatePopUp, deletePopUp };
  }, [popups]);

  return (
    <PopUpsStoreContext.Provider value={value}>
      {children}
    </PopUpsStoreContext.Provider>
  );
}

/** Accès au store — doit être appelé sous `<PopUpProvider>`. */
export function usePopUps(): PopUpsStoreValue {
  const context = React.useContext(PopUpsStoreContext);
  if (context === undefined) {
    throw new Error(
      "usePopUps doit être utilisé à l'intérieur de <PopUpProvider>."
    );
  }
  return context;
}
