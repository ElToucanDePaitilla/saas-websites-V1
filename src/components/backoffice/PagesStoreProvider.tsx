"use client";

import * as React from "react";
import {
  buildSeedModules,
  createModule,
  reorderModules,
  seedPages,
  type PageMetadataDraft,
  type PageModule,
  type PageModuleType,
  type SitePage,
} from "@/lib/pages";
import {
  persistCreatePage,
  persistDeletePage,
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
  /** Ajoute un module par défaut en fin de page. */
  addModule: (pageId: string, type: PageModuleType) => void;
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
};

/** État initial chargé côté serveur (BDD) — prop facultative du Provider. */
export type PagesInitialData = {
  pages: SitePage[];
  modulesByPage: Record<string, PageModule[]>;
};

const PagesStoreContext = React.createContext<PagesStoreValue | undefined>(
  undefined
);

/** État initial unique : pages seed + modules par défaut par page. */
function createInitialState(): StoreState {
  const modulesByPage: Record<string, PageModule[]> = {};
  for (const page of seedPages) {
    modulesByPage[page.id] = buildSeedModules(page.slug);
  }
  return { pages: seedPages, modulesByPage };
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

  // Persistance des mutations Pages/Modules (Étape 5.3) — BDD disponible.
  // Diffère l'état local courant vs l'état précédent et appelle l'API
  // granulaire correspondante (création/métadonnées/suppression de page,
  // remplacement des modules d'une page).
  const pagesReady = React.useRef(false);
  const previousPagesRef = React.useRef<SitePage[]>([]);
  const previousModulesRef = React.useRef<Record<string, PageModule[]>>({});

  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    const previousPages = previousPagesRef.current;
    const previousModules = previousModulesRef.current;
    if (!pagesReady.current) {
      // Premier rendu (hydratation/seed) : rien à persister.
      pagesReady.current = true;
      previousPagesRef.current = state.pages;
      previousModulesRef.current = state.modulesByPage;
      return;
    }

    const ops: Array<() => Promise<void>> = [];
    const previousById = new Map(previousPages.map((page) => [page.id, page]));
    const nextById = new Map(state.pages.map((page) => [page.id, page]));

    // Pages supprimées.
    for (const page of previousPages) {
      if (!nextById.has(page.id)) {
        const id = page.id;
        ops.push(() => persistDeletePage(id));
      }
    }

    for (const page of state.pages) {
      const old = previousById.get(page.id);
      // Pages créées → création puis modules (même vides, pour créer la page).
      if (!old) {
        const pageId = page.id;
        const modules = state.modulesByPage[pageId] ?? [];
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
      const newModules = state.modulesByPage[page.id] ?? [];
      if (JSON.stringify(oldModules) !== JSON.stringify(newModules)) {
        const pageId = page.id;
        ops.push(() => persistUpdateModules(pageId, newModules));
      }
    }

    previousPagesRef.current = state.pages;
    previousModulesRef.current = state.modulesByPage;

    if (ops.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        for (const op of ops) {
          try {
            await op();
          } catch (error) {
            console.error("Persistance pages :", error);
            return; // interruption à la première erreur (journalisée)
          }
        }
      })();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [state, persistenceEnabled]);

  const value = React.useMemo<PagesStoreValue>(() => {
    const { pages, modulesByPage } = state;

    const getPage = (id: string): SitePage | undefined =>
      pages.find((page) => page.id === id);

    const createPage = (draft: PageMetadataDraft): SitePage => {
      const now = new Date().toISOString();
      const newPage: SitePage = {
        id: crypto.randomUUID(),
        ...draft,
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

    const addModule = (pageId: string, type: PageModuleType): void => {
      setState((previous) => {
        const current = previous.modulesByPage[pageId] ?? [];
        const nextModule = createModule(type, current.length + 1);
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
    };
  }, [state]);

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
