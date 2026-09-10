/**
 * ============================================================================
 * LOADER — Données initiales SSR (Étapes 5.2 & 10.1)
 * ----------------------------------------------------------------------------
 * Point d'entrée **serveur** utilisé par les layouts pour hydrater les stores.
 *
 * Étape 10.1 — contrat explicite (fin des « données fantômes ») :
 *   - **BDD joignable** : `pages` et `navigation` sont **toujours** fournis,
 *     même **vides** — un site vide reste vide (aucun seed implicite) ;
 *     `hasHomepage` indique si une page d'accueil (`is_home`) existe ;
 *   - **BDD injoignable** : retourne le **seed explicite** (pages + navigation
 *     de démonstration) → l'expérience démo hors-BDD est préservée.
 *
 * L'auto-amorçage BDD (`ensureTenantSeeded`) n'est **plus** appelé ici : il
 * reste disponible en opt-in (`npm run db:seed`).
 *
 * Référence : plans/ROADMAP-10.1-site-starter-onboarding.md §D-1
 * ============================================================================
 */

import {
  buildSeedNavigation,
  type NavPresetId,
  type SiteNavigation,
} from "../lib/navigation";
import type { OwnerProfile } from "../lib/owner-profile";
import {
  buildSeedModules,
  seedPages,
  type PageModule,
  type SitePage,
} from "../lib/pages";
import type { VisualIdentity } from "../lib/visual-identity";
import { DEMO_PROFILE_ID } from "./constants";
import {
  getNavigation,
  pruneOrphanNavigation,
} from "./repositories/navigation.repository";
import { getOwnerProfile } from "./repositories/owner-profile.repository";
import { getHomePage, getPagesWithModules } from "./repositories/pages.repository";
import { getVisualIdentity } from "./repositories/visual-identity.repository";

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

/** Données initiales globales chargées côté serveur. */
export interface SiteInitialData {
  /** Toujours présent si la BDD répond (éventuellement vide) — 10.1. */
  pages?: PagesInitialData;
  /** Toujours présent si la BDD répond (éventuellement vide) — 10.1. */
  navigation?: NavigationInitialData;
  /** Profil du propriétaire (Étape 8.2) — absent si aucune ligne en BDD. */
  profile?: OwnerProfile;
  /** Espace marque Header (Étape 9.1) — absent si aucune ligne en BDD. */
  visualIdentity?: VisualIdentity;
  /** true si une page d'accueil (`is_home`) existe — pilote l'onboarding. */
  hasHomepage?: boolean;
  /** true si la BDD est joignable (persistance CRUD activée — Étape 5.3). */
  dbAvailable: boolean;
}

/** Données de pages issues du **seed** (fallback BDD injoignable). */
function seedPagesData(): PagesInitialData {
  const modulesByPage: Record<string, PageModule[]> = {};
  for (const page of seedPages) {
    modulesByPage[page.id] = buildSeedModules(page.slug);
  }
  return { pages: seedPages, modulesByPage };
}

/** Navigation issue du **seed** (fallback BDD injoignable). */
function seedNavigationData(): NavigationInitialData {
  return { navigation: buildSeedNavigation(), appliedPresetId: null };
}

/**
 * Charge l'état initial du site depuis la BDD (tenant courant).
 * BDD injoignable → **seed explicite** (mode démo).
 */
export async function loadInitialData(
  photographerId: string = DEMO_PROFILE_ID
): Promise<SiteInitialData> {
  try {
    const pages = await getPagesWithModules(photographerId);
    let navigation = await getNavigation(photographerId);
    // Étape 10.1.a — site totalement vide : purger les **liens internes
    // orphelins** (entrées `custom` sans `pageId` : ancres du seed, placeholders
    // de presets…). Uniquement si 0 page, pour ne jamais supprimer un lien
    // volontaire d'un site en construction.
    if (pages.pages.length === 0) {
      const removed = await pruneOrphanNavigation(photographerId);
      if (removed > 0) {
        navigation = await getNavigation(photographerId);
      }
    }
    const home = await getHomePage(photographerId);
    const profile = await getOwnerProfile(photographerId);
    const visualIdentity = await getVisualIdentity(photographerId);

    const initial: Omit<SiteInitialData, "dbAvailable"> = {
      // Étape 10.1 : toujours fournis (même vides) → plus de seed implicite.
      pages,
      navigation: { navigation, appliedPresetId: null },
      hasHomepage: home !== null,
    };
    if (profile) {
      initial.profile = profile;
    }
    if (visualIdentity) {
      initial.visualIdentity = visualIdentity;
    }
    return { ...initial, dbAvailable: true };
  } catch {
    // BDD indisponible / non migrée : seed explicite (démo), jamais implicite.
    return {
      pages: seedPagesData(),
      navigation: seedNavigationData(),
      hasHomepage: true,
      dbAvailable: false,
    };
  }
}
