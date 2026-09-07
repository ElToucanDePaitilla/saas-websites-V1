/**
 * ============================================================================
 * LOADER — Données initiales SSR (Étape 5.2)
 * ----------------------------------------------------------------------------
 * Point d'entrée **serveur** utilisé par les layouts pour hydrater les stores :
 *   - charge les données réelles du tenant de démo via les repositories ;
 *   - si la BDD est **indisponible** (`DATABASE_URL` absente, connexion
 *     refusée, tables absentes) ou **vide**, retourne `{}` → les Providers
 *     basculent alors de manière transparente sur le **seed en mémoire**
 *     (dev/démo jamais cassée, fallback gracieux).
 *
 * Les layouts consomment `initial.pages` (PagesStoreProvider) et
 * `initial.navigation` (NavigationStoreProvider).
 *
 * Référence : plans/ROADMAP-5.2-ssr-db-hydration.md §2.B
 * ============================================================================
 */

import type {
  NavPresetId,
  SiteNavigation,
} from "../lib/navigation";
import type { PageModule, SitePage } from "../lib/pages";
import { DEMO_PROFILE_ID } from "./constants";
import { getPagesWithModules } from "./repositories/pages.repository";
import { getNavigation } from "./repositories/navigation.repository";

/** Données initiales attendues par `PagesStoreProvider` (prop `initialData`). */
export interface PagesInitialData {
  pages: SitePage[];
  modulesByPage: Record<string, PageModule[]>;
}

/** Données initiales attendues par `NavigationStoreProvider`. */
export interface NavigationInitialData {
  navigation: SiteNavigation;
  appliedPresetId: NavPresetId | null;
}

/** Données initiales globales chargées côté serveur (éventuellement vides). */
export interface SiteInitialData {
  pages?: PagesInitialData;
  navigation?: NavigationInitialData;
  /** true si la BDD est joignable (persistance CRUD activée — Étape 5.3). */
  dbAvailable: boolean;
}

/**
 * Charge l'état initial du site depuis la BDD (tenant de démo).
 * Retourne `{}` en cas d'absence/erreur BDD ou de données vides (fallback seed).
 */
export async function loadInitialData(
  photographerId: string = DEMO_PROFILE_ID
): Promise<SiteInitialData> {
  try {
    const [pagesData, navigation] = await Promise.all([
      getPagesWithModules(photographerId),
      getNavigation(photographerId),
    ]);

    const initial: Omit<SiteInitialData, "dbAvailable"> = {};
    if (pagesData.pages.length > 0) {
      initial.pages = pagesData;
    }
    if (navigation.header.length > 0 || navigation.footer.length > 0) {
      initial.navigation = { navigation, appliedPresetId: null };
    }
    // BDD joignable (même vide) → persistance des mutations activée.
    return { ...initial, dbAvailable: true };
  } catch {
    // BDD indisponible / non migrée : fallback sur le seed en mémoire.
    return { dbAvailable: false };
  }
}
