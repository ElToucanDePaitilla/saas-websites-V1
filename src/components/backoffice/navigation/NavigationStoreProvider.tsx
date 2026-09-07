"use client";

import * as React from "react";
import {
  createNavEntry,
  findNavEntry,
  findNavParentId,
  hasNavChildren,
  insertNavEntry,
  moveNavEntryAcross,
  removeNavEntry,
  reorderNavList,
  updateNavEntry,
  type NavArea,
  type NavItemKind,
  type NavMenuEntry,
  type NavMovePosition,
  type NavPresetId,
  type SiteNavigation,
} from "@/lib/navigation";
import { persistNavigation } from "@/lib/persistence-client";
import {
  getNavigationServerSnapshot,
  getNavigationSnapshot,
  hydrateNavigation,
  setNavigationState,
  subscribeNavigation,
  type NavigationSnapshot,
} from "@/lib/navigation-store";

/**
 * ============================================================================
 * STORE MOCK — Navigation du site (Étapes 4.1 → 4.3)
 * ----------------------------------------------------------------------------
 * Client Component (Provider) **global au Layout `/admin`** (depuis l'Étape 4.2,
 * au même niveau que `PagesStoreProvider`) : porte l'état des menus `header` et
 * `footer` et les actions CRUD. La globalisation permet la **synchronisation
 * Pages ↔ Navigation** (`PagesNavigationSync`, 4.2) depuis n'importe quelle
 * route `/admin` (notamment `/admin/pages`).
 *
 * Étape 4.3 : le store passe d'une arborescence **plate** (4.1/4.2) à une
 * arborescence **à 2 niveaux** (`NavMenuEntry.children`, Header uniquement).
 * Les actions sont devenues **récursives** et exposent :
 *   - `addEntry(area, entry, parentId?)` : ajout en fin de liste (racine par
 *     défaut, ou sous-menu du parent visé dans le Header) ;
 *   - `updateEntry` / `removeEntry` : ciblage **récursif** (racine + enfants) ;
 *     la suppression d'un parent retire **tout son sous-menu** (cascade) ;
 *   - `relocateEntry(area, id, toParentId)` : déplace un item existant vers un
 *     autre parent (ou la racine) — utilisé par le formulaire ;
 *   - `moveNavItem(area, source, destination)` : branche Drag & Drop sur
 *     `moveNavEntryAcross` ;
 *   - `moveEntry` conservé (réordonnancement plat — Footer / cas même-liste).
 *
 * Garde-fous (4.3) :
 *   - **Footer plat** : le Footer n'a jamais d'enfants — tout `parentId` non nul
 *     y est ignoré (toujours racine) ;
 *   - **profondeur max 2** : un parent ne peut être parent que s'il est un item
 *     de Niveau 1 du Header (racine) ; un item qui a déjà des enfants ne peut
 *     pas être imbriqué sous un autre (refus silencieux, aucune mutation) ;
 *   - Provider posé dans le Layout `/admin` (Server Component englobant) ;
 *   - Seul le hook `useNavigationStore` donne accès à l'état/actions ;
 *   - TypeScript strict, zéro `any`.
 *
 * Références : plans/ROADMAP-4.1-navigation.md §1.2 —
 *              plans/ROADMAP-4.2-pages-nav-sync.md §1.3 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.2
 * ============================================================================
 */

/** Payload de création d'un item (pageId null = lien personnalisé). */
export type NewNavEntry = {
  label: string;
  kind: NavItemKind;
  href: string;
  pageId?: string | null;
  /** Entrée auto (gérée par la synchro Pages ↔ Navigation) — défaut : manuelle. */
  auto?: boolean;
};

type NavigationStoreValue = {
  /** Navigation complète (header + footer). */
  navigation: SiteNavigation;
  /** Preset Onboarding appliqué (badge « Preset actif ») — null = personnalisé. */
  appliedPresetId: NavPresetId | null;
  /** Items de Niveau 1 d'une zone, dans l'ordre d'affichage. */
  getEntries: (area: NavArea) => NavMenuEntry[];
  /**
   * Ajoute un item en fin de liste.
   * `parentId` non nul → ajout dans le sous-menu du parent (Header uniquement —
   * ignoré pour le Footer, toujours racine).
   */
  addEntry: (
    area: NavArea,
    entry: NewNavEntry,
    parentId?: string | null
  ) => void;
  /** Met à jour un item (fusion du patch) — recherche récursive racine + enfants. */
  updateEntry: (
    area: NavArea,
    id: string,
    patch: Partial<NavMenuEntry>
  ) => void;
  /** Supprime un item (et son sous-menu le cas échéant) — recherche récursive. */
  removeEntry: (area: NavArea, id: string) => void;
  /**
   * Déplace un item existant à la fin de la liste visée (racine si
   * `toParentId` est `null`, sinon sous-menu du parent). Refuse d'imbriquer un
   * item qui a déjà des enfants (profondeur max 2).
   */
  relocateEntry: (
    area: NavArea,
    id: string,
    toParentId: string | null
  ) => void;
  /** Déplace un item entre listes (Drag & Drop) via `moveNavEntryAcross`. */
  moveNavItem: (
    area: NavArea,
    source: NavMovePosition,
    destination: NavMovePosition
  ) => void;
  /** Réordonne les items racine d'une zone (Footer / cas même-liste). */
  moveEntry: (area: NavArea, from: number, to: number) => void;
  /**
   * Remplace le **Header** par une structure (résolue par un preset Onboarding)
   * et mémorise le preset appliqué (4.4). Le Footer n'est jamais modifié.
   */
  applyPreset: (header: NavMenuEntry[], presetId: NavPresetId) => void;
};

const NavigationStoreContext = React.createContext<
  NavigationStoreValue | undefined
>(undefined);

/**
 * Résout le `parentId` effectif : Header uniquement, et le parent doit être un
 * item de **Niveau 1** (racine) du Header — sinon `null` (racine). Garantit le
 * Footer plat et la profondeur max 2 même en cas d'UI erronée.
 */
function effectiveParentId(
  area: NavArea,
  list: NavMenuEntry[],
  parentId: string | null | undefined
): string | null {
  if (area !== "header" || parentId === null || parentId === undefined) {
    return null;
  }
  return list.some((item) => item.id === parentId) ? parentId : null;
}

export function NavigationStoreProvider({
  children,
  initialData,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /**
   * État initial chargé côté serveur depuis la BDD (Étape 5.2,
   * plans/ROADMAP-5.2-ssr-db-hydration.md) — facultatif : absent, le store
   * reste sur le seed en mémoire (fallback hors-BDD).
   */
  initialData?: NavigationSnapshot;
  /**
   * true quand la BDD est disponible (Étape 5.3) : chaque mutation locale est
   * alors **persistée** (fire-and-forget, erreurs journalisées). false (défaut,
   * hors-BDD) : comportement mock en mémoire inchangé.
   */
  persistenceEnabled?: boolean;
}) {
  // État **partagé au niveau module** (Étape 4.5, plans/ROADMAP-4.5 §0.1) : chaque
  // instance du Provider — layout `/admin` ET layout public `/` — observe le même
  // snapshot en mémoire. Les presets / éditions du Back-Office restent donc
  // visibles sur le site public au sein d'une même session (rechargement plein
  // du navigateur = retour au seed, limite du mock documentée).
  const { navigation, appliedPresetId } = React.useSyncExternalStore(
    subscribeNavigation,
    getNavigationSnapshot,
    getNavigationServerSnapshot
  );

  // Hydratation **unique** depuis les données serveur (effet post-montage : le
  // premier rendu reste identique au HTML SSR — aucune erreur d'hydratation).
  React.useEffect(() => {
    if (initialData) {
      hydrateNavigation(initialData);
    }
  }, [initialData]);

  // Persistance des mutations de navigation (Étape 5.3) — BDD disponible.
  const firstNavRun = React.useRef(true);
  const previousNavigation = React.useRef<SiteNavigation | null>(null);
  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    if (firstNavRun.current) {
      // Premier rendu (hydratation/seed) : rien à persister.
      firstNavRun.current = false;
      previousNavigation.current = navigation;
      return;
    }
    const previous = previousNavigation.current;
    previousNavigation.current = navigation;
    if (
      previous !== null &&
      JSON.stringify(previous) === JSON.stringify(navigation)
    ) {
      return; // aucune mutation effective
    }
    const timer = window.setTimeout(() => {
      persistNavigation(navigation).catch((error: unknown) => {
        console.error("Persistance navigation :", error);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [navigation, persistenceEnabled]);

  const value = React.useMemo<NavigationStoreValue>(() => {
    const getEntries = (area: NavArea): NavMenuEntry[] => navigation[area];

    const addEntry = (
      area: NavArea,
      entry: NewNavEntry,
      parentId: string | null = null
    ): void => {
      setNavigationState((previous) => {
        const list = previous.navigation[area];
        const target = effectiveParentId(area, list, parentId);
        const created = createNavEntry(
          entry.kind,
          entry.label,
          entry.href,
          entry.pageId ?? null,
          entry.auto ?? false
        );
        return {
          navigation: {
            ...previous.navigation,
            [area]: insertNavEntry(list, target, created),
          },
          // Toute mutation manuelle invalide le « preset actif ».
          appliedPresetId: null,
        };
      });
    };

    const updateEntry = (
      area: NavArea,
      id: string,
      patch: Partial<NavMenuEntry>
    ): void => {
      setNavigationState((previous) => ({
        navigation: {
          ...previous.navigation,
          [area]: updateNavEntry(previous.navigation[area], id, patch),
        },
        appliedPresetId: null,
      }));
    };

    const removeEntry = (area: NavArea, id: string): void => {
      setNavigationState((previous) => ({
        navigation: {
          ...previous.navigation,
          [area]: removeNavEntry(previous.navigation[area], id),
        },
        appliedPresetId: null,
      }));
    };

    const relocateEntry = (
      area: NavArea,
      id: string,
      toParentId: string | null
    ): void => {
      setNavigationState((previous) => {
        const list = previous.navigation[area];
        const entry = findNavEntry(list, id);
        if (!entry) {
          return previous;
        }
        const target = effectiveParentId(area, list, toParentId);
        // Profondeur max 2 : refus d'imbriquer un item qui porte déjà un sous-menu.
        if (target !== null && hasNavChildren(entry)) {
          return previous;
        }
        if (findNavParentId(list, id) === target) {
          return previous;
        }
        const without = removeNavEntry(list, id);
        return {
          navigation: {
            ...previous.navigation,
            [area]: insertNavEntry(without, target, entry),
          },
          appliedPresetId: null,
        };
      });
    };

    const moveNavItem = (
      area: NavArea,
      source: NavMovePosition,
      destination: NavMovePosition
    ): void => {
      setNavigationState((previous) => {
        const list = previous.navigation[area];
        const sourceParent = effectiveParentId(area, list, source.parentId);
        const destinationParent = effectiveParentId(
          area,
          list,
          destination.parentId
        );
        // L'item déplacé doit exister à la position source.
        const sourceList =
          sourceParent === null
            ? list
            : list.find((item) => item.id === sourceParent)?.children ?? [];
        const moved = sourceList[source.index];
        if (!moved) {
          return previous;
        }
        // Profondeur max 2 : refus d'imbriquer un parent qui a des enfants.
        if (destinationParent !== null && hasNavChildren(moved)) {
          return previous;
        }
        const next = moveNavEntryAcross(
          list,
          { parentId: sourceParent, index: source.index },
          { parentId: destinationParent, index: destination.index }
        );
        if (next === null) {
          return previous;
        }
        return {
          navigation: { ...previous.navigation, [area]: next },
          appliedPresetId: null,
        };
      });
    };

    const moveEntry = (area: NavArea, from: number, to: number): void => {
      setNavigationState((previous) => ({
        navigation: {
          ...previous.navigation,
          [area]: reorderNavList(previous.navigation[area], from, to),
        },
        appliedPresetId: null,
      }));
    };

    const applyPreset = (
      header: NavMenuEntry[],
      presetId: NavPresetId
    ): void => {
      setNavigationState((previous) => ({
        navigation: { ...previous.navigation, header },
        appliedPresetId: presetId,
      }));
    };

    return {
      navigation,
      appliedPresetId,
      getEntries,
      addEntry,
      updateEntry,
      removeEntry,
      relocateEntry,
      moveNavItem,
      moveEntry,
      applyPreset,
    };
  }, [navigation, appliedPresetId]);

  return (
    <NavigationStoreContext.Provider value={value}>
      {children}
    </NavigationStoreContext.Provider>
  );
}

/** Accès au store — doit être appelé sous `<NavigationStoreProvider>`. */
export function useNavigationStore(): NavigationStoreValue {
  const context = React.useContext(NavigationStoreContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationStore doit être utilisé à l'intérieur de <NavigationStoreProvider>."
    );
  }
  return context;
}
