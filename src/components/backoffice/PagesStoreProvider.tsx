"use client";

import * as React from "react";
import {
  createModule,
  demotedHomeSlug,
  reorderModules,
  type ModuleVariant,
  type PageMetadataDraft,
  type PageModule,
  type PageModuleType,
  type SitePage,
} from "@/lib/pages";
import {
  persistCreatePage,
  persistDeletePage,
  persistSetHomePage,
  persistUpdateModules,
  persistUpdatePage,
} from "@/lib/persistence-client";

/**
 * ============================================================================
 * STORE MOCK GLOBAL — Pages & Modules du Back-Office (Étapes 3.2 & 3.4)
 * ----------------------------------------------------------------------------
 * Client Component (Provider) posé dans le Layout Dashboard `/admin` : il porte
 * l'état partagé des `pages` et des `modules` de chaque page (`modulesByPage`),
 * consommé par la liste `/admin/pages` ET l'éditeur `/admin/pages/[id]`.
 *
 * Persistance simulée en mémoire (aucune BDD) : initialisation unique avec
 * `seedPages` + `buildSeedModules(slug)` par page. Actions de CRUD pages
 * (reprises de l'Étape 3.1) et de manipulation des modules (ajout, suppression,
 * réordonnancement, masquage 3.3, édition temps réel 3.4). Toute mutation clone
 * l'état (zéro mutation directe).
 *
 * Garde-fous :
 *   - Seul le hook `usePagesStore` donne accès à l'état/actions (aucun setState
 *     parallèle ailleurs) ;
 *   - TypeScript strict, zéro `any` ;
 *   - Le Layout Dashboard reste un Server Component (provider client isolé).
 *
 * Références : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.3 —
 *              plans/ROADMAP-3.4-crud-expanded.md §1.2
 * ============================================================================
 */

type StoreState = {
  pages: SitePage[];
  modulesByPage: Record<string, PageModule[]>;
};

export type PagesStoreValue = {
  /** Liste des pages (la plus récemment modifiée en premier). */
  pages: SitePage[];
  /** Recherche d'une page par son id (undefined si absente). */
  getPage: (id: string) => SitePage | undefined;
  /** Crée une page (0 module) et la retourne. */
  createPage: (draft: PageMetadataDraft) => SitePage;
  /** Met à jour les métadonnées d'une page (+ updatedAt). */
  updatePage: (id: string, draft: PageMetadataDraft) => void;
  /** Supprime une page ET ses modules. */
  deletePage: (id: string) => void;
  /** Modules d'une page, dans l'ordre vertical (tableau vide si inconnue). */
  getModules: (pageId: string) => PageModule[];
  /**
   * Ajoute un module par défaut en fin de page.
   * `variant` préconfigure le contenu des familles à variantes (rubriques Héro
   * et Galeries & Portfolio).
   */
  addModule: (pageId: string, type: PageModuleType, variant?: ModuleVariant) => void;
  /** Supprime un module d'une page. */
  removeModule: (pageId: string, moduleId: string) => void;
  /** Masque (hidden=true) ou affiche (hidden=false) un module sur le site public. */
  setModuleHidden: (pageId: string, moduleId: string, hidden: boolean) => void;
  /**
   * Fusionne un `patch` dans un module (réglages scalaires `title`/`anchorId`/
   * `animation` OU `content` complet) — édition temps réel du CRUD déplié (3.4).
   */
  updateModule: (
    pageId: string,
    moduleId: string,
    patch: Partial<PageModule>
  ) => void;
  /** Réordonne les modules d'une page (Drag & Drop). */
  moveModule: (pageId: string, from: number, to: number) => void;
  /** Réordonne les pages du menu « Pages » (Drag & Drop sur la poignée). */
  movePage: (from: number, to: number) => void;
  /** Désigne la page d'accueil du site (Étape 10.1). */
  setHomePage: (id: string) => void;
};

/** État initial chargé côté serveur (BDD) — prop facultative du Provider. */
export type PagesInitialData = {
  pages: SitePage[];
  modulesByPage: Record<string, PageModule[]>;
};

const PagesStoreContext = React.createContext<PagesStoreValue | undefined>(
  undefined
);

/** Délai d'inactivité avant d'écrire en base après une mutation (ms). */
const SYNC_DEBOUNCE_MS = 200;

/** Premier délai de reprise après une écriture refusée (ms). */
const RETRY_BASE_MS = 2000;

/** Délai de reprise maximal (ms) — le délai double à chaque échec. */
const RETRY_MAX_MS = 30000;

/**
 * État initial **vide** (Étape 10.1) : le seed n'est plus un défaut implicite —
 * il est fourni **explicitement** par le serveur (`loadInitialData`) quand la
 * BDD est injoignable. Une BDD vide produit donc un site vide, sans fantôme.
 */
function createInitialState(): StoreState {
  return { pages: [], modulesByPage: {} };
}

export function PagesStoreProvider({
  children,
  initialData,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /**
   * Données initiales chargées côté serveur depuis la BDD (Étape 5.2,
   * plans/ROADMAP-5.2-ssr-db-hydration.md) — facultatives : absentes, le store
   * s'initialise sur le seed en mémoire (fallback hors-BDD).
   */
  initialData?: PagesInitialData;
  /**
   * true quand la BDD est disponible (Étape 5.3) : chaque mutation locale est
   * **persistée** (fire-and-forget, erreurs journalisées). false (défaut,
   * hors-BDD) : comportement mock en mémoire inchangé.
   */
  persistenceEnabled?: boolean;
}) {
  const [state, setState] = React.useState<StoreState>(() =>
    initialData
      ? { pages: initialData.pages, modulesByPage: initialData.modulesByPage }
      : createInitialState()
  );

  /**
   * Persistance des mutations Pages/Modules (Étape 5.3) — BDD disponible.
   *
   * L'état local reste la source de vérité **immédiate** de l'interface ;
   * l'écriture en base est **différée** (après la dernière mutation) puis
   * exécutée **en série** (l'ordre compte : une page se crée avant d'accueillir
   * ses modules).
   *
   * **Correctif de robustesse (étape 12.1).** Les références de comparaison ne
   * sont avancées qu'après un **succès complet**. Auparavant elles l'étaient
   * *avant* l'écriture différée, et la boucle s'arrêtait à la première erreur :
   * une écriture refusée (BDD momentanément injoignable, serveur de
   * développement en recompilation, coupure réseau) n'était donc **jamais
   * rejouée**, et la modification était perdue **en silence**, sans que
   * l'utilisateur puisse le savoir. Désormais la synchronisation reprend
   * d'elle-même, avec un délai qui double jusqu'à `RETRY_MAX_MS`.
   */
  const previousPagesRef = React.useRef<SitePage[] | null>(null);
  const previousModulesRef = React.useRef<Record<string, PageModule[]>>({});
  const stateRef = React.useRef(state);
  const runSyncRef = React.useRef<() => Promise<void>>(async () => {});
  const retryTimerRef = React.useRef<number | null>(null);
  const retryDelayRef = React.useRef(RETRY_BASE_MS);
  const syncRunningRef = React.useRef(false);
  const syncPendingRef = React.useRef(false);

  // État le plus récent, lu par la synchronisation différée (dont la closure
  // est figée à sa création). Déclaré avant l'effet de débounce pour être
  // à jour lorsque celui-ci se déclenche.
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const runSync = React.useCallback(async (): Promise<void> => {
    if (syncRunningRef.current) {
      // Une synchronisation est déjà en cours : on note qu'il faudra repasser,
      // pour ne jamais laisser une modification sans écriture.
      syncPendingRef.current = true;
      return;
    }
    syncRunningRef.current = true;

    const current = stateRef.current;
    const previousPages = previousPagesRef.current;
    if (previousPages === null) {
      // Premier rendu (hydratation/seed) : rien à persister.
      previousPagesRef.current = current.pages;
      previousModulesRef.current = current.modulesByPage;
      syncRunningRef.current = false;
      return;
    }
    const previousModules = previousModulesRef.current;

    const ops: Array<() => Promise<void>> = [];
    const previousById = new Map(previousPages.map((page) => [page.id, page]));
    const nextById = new Map(current.pages.map((page) => [page.id, page]));

    // Pages supprimées.
    for (const page of previousPages) {
      if (!nextById.has(page.id)) {
        const id = page.id;
        ops.push(() => persistDeletePage(id));
      }
    }

    for (const page of current.pages) {
      const old = previousById.get(page.id);
      // Pages créées → création puis modules (même vides, pour créer la page).
      if (!old) {
        const pageId = page.id;
        const modules = current.modulesByPage[pageId] ?? [];
        ops.push(() =>
          persistCreatePage(page).then(() =>
            persistUpdateModules(pageId, modules)
          )
        );
        continue;
      }
      // Métadonnées modifiées.
      if (
        old.title !== page.title ||
        old.menuTitle !== page.menuTitle ||
        old.slug !== page.slug ||
        old.status !== page.status ||
        old.inMenu !== page.inMenu
      ) {
        const pageId = page.id;
        const draft: PageMetadataDraft = {
          title: page.title,
          menuTitle: page.menuTitle,
          slug: page.slug,
          status: page.status,
          inMenu: page.inMenu,
        };
        ops.push(() => persistUpdatePage(pageId, draft));
      }
      // Modules d'une page modifiés (contenu, ordre, présence).
      const oldModules = previousModules[page.id] ?? [];
      const newModules = current.modulesByPage[page.id] ?? [];
      if (JSON.stringify(oldModules) !== JSON.stringify(newModules)) {
        const pageId = page.id;
        ops.push(() => persistUpdateModules(pageId, newModules));
      }
    }

    /** Écriture réussie : l'état visé devient la nouvelle référence. */
    const markSynced = () => {
      previousPagesRef.current = current.pages;
      previousModulesRef.current = current.modulesByPage;
      retryDelayRef.current = RETRY_BASE_MS;
    };

    /** Écriture refusée : on reprend plus tard, **sans avancer la référence**. */
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
          console.error("Persistance pages :", error);
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

    // Une passe a été demandée pendant celle-ci : on la rejoue immédiatement.
    if (syncPendingRef.current) {
      syncPendingRef.current = false;
      void runSyncRef.current();
    }
  }, []);

  // Rappel le plus récent, lu par la minuterie de reprise (dont la closure est
  // figée) — mis à jour **dans un effet**, jamais pendant le rendu.
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
  }, [state, persistenceEnabled]);

  // Aucune minuterie de reprise ne doit survivre au démontage du provider.
  React.useEffect(
    () => () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    },
    []
  );

  const value = React.useMemo<PagesStoreValue>(() => {
    const { pages, modulesByPage } = state;

    const getPage = (id: string): SitePage | undefined =>
      pages.find((page) => page.id === id);

    const createPage = (draft: PageMetadataDraft): SitePage => {
      const now = new Date().toISOString();
      const newPage: SitePage = {
        id: crypto.randomUUID(),
        ...draft,
        isHome: false,
        updatedAt: now,
      };
      setState((previous) => ({
        pages: [newPage, ...previous.pages],
        modulesByPage: {
          ...previous.modulesByPage,
          [newPage.id]: [],
        },
      }));
      return newPage;
    };

    const updatePage = (id: string, draft: PageMetadataDraft): void => {
      const now = new Date().toISOString();
      setState((previous) => ({
        ...previous,
        pages: previous.pages.map((page) =>
          page.id === id ? { ...page, ...draft, updatedAt: now } : page
        ),
      }));
    };

    const deletePage = (id: string): void => {
      setState((previous) => {
        const { [id]: _removed, ...restModules } = previous.modulesByPage;
        void _removed;
        return {
          pages: previous.pages.filter((page) => page.id !== id),
          modulesByPage: restModules,
        };
      });
    };

    const getModules = (pageId: string): PageModule[] =>
      modulesByPage[pageId] ?? [];

    const addModule = (
      pageId: string,
      type: PageModuleType,
      variant?: ModuleVariant
    ): void => {
      setState((previous) => {
        const current = previous.modulesByPage[pageId] ?? [];
        const nextModule = createModule(type, current.length + 1, variant);
        return {
          ...previous,
          modulesByPage: {
            ...previous.modulesByPage,
            [pageId]: [...current, nextModule],
          },
        };
      });
    };

    const removeModule = (pageId: string, moduleId: string): void => {
      setState((previous) => ({
        ...previous,
        modulesByPage: {
          ...previous.modulesByPage,
          [pageId]: (previous.modulesByPage[pageId] ?? []).filter(
            (module) => module.id !== moduleId
          ),
        },
      }));
    };

    const setModuleHidden = (
      pageId: string,
      moduleId: string,
      hidden: boolean
    ): void => {
      setState((previous) => ({
        ...previous,
        modulesByPage: {
          ...previous.modulesByPage,
          [pageId]: (previous.modulesByPage[pageId] ?? []).map((module) =>
            module.id === moduleId ? { ...module, hidden } : module
          ),
        },
      }));
    };

    const updateModule = (
      pageId: string,
      moduleId: string,
      patch: Partial<PageModule>
    ): void => {
      const now = new Date().toISOString();
      setState((previous) => ({
        ...previous,
        pages: previous.pages.map((page) =>
          page.id === pageId ? { ...page, updatedAt: now } : page
        ),
        modulesByPage: {
          ...previous.modulesByPage,
          [pageId]: (previous.modulesByPage[pageId] ?? []).map((module) =>
            module.id === moduleId ? { ...module, ...patch } : module
          ),
        },
      }));
    };

    const moveModule = (pageId: string, from: number, to: number): void => {
      setState((previous) => {
        const current = previous.modulesByPage[pageId] ?? [];
        return {
          ...previous,
          modulesByPage: {
            ...previous.modulesByPage,
            [pageId]: reorderModules(current, from, to),
          },
        };
      });
    };

    const movePage = (from: number, to: number): void => {
      setState((previous) => ({
        ...previous,
        pages: reorderModules(previous.pages, from, to),
      }));
    };

    /**
     * Désigne la page d'accueil (Étape 10.1) : l'ancien accueil est démis
     * (slug libéré) et la page cible reçoit le slug canonique `""`. Mise à jour
     * locale optimiste + persistance transactionnelle dédiée (API).
     */
    const setHomePage = (id: string): void => {
      const now = new Date().toISOString();
      setState((previous) => {
        const currentHome = previous.pages.find((page) => page.isHome);
        return {
          ...previous,
          pages: previous.pages.map((page) => {
            if (page.id === id) {
              return { ...page, isHome: true, slug: "", updatedAt: now };
            }
            if (currentHome && page.id === currentHome.id) {
              return {
                ...page,
                isHome: false,
                slug: demotedHomeSlug(page.id),
                updatedAt: now,
              };
            }
            return page;
          }),
        };
      });
      if (persistenceEnabled) {
        persistSetHomePage(id).catch((error: unknown) => {
          console.error("Persistance accueil :", error);
        });
      }
    };

    return {
      pages,
      getPage,
      createPage,
      updatePage,
      deletePage,
      getModules,
      addModule,
      removeModule,
      setModuleHidden,
      updateModule,
      moveModule,
      movePage,
      setHomePage,
    };
  }, [state, persistenceEnabled]);

  return (
    <PagesStoreContext.Provider value={value}>
      {children}
    </PagesStoreContext.Provider>
  );
}

/** Accès au store — doit être appelé sous `<PagesStoreProvider>`. */
export function usePagesStore(): PagesStoreValue {
  const context = React.useContext(PagesStoreContext);
  if (context === undefined) {
    throw new Error(
      "usePagesStore doit être utilisé à l'intérieur de <PagesStoreProvider>."
    );
  }
  return context;
}
