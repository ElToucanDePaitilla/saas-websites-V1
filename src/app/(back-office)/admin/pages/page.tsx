import type { Metadata } from "next";

import { PagesManager } from "@/components/backoffice/pages/PagesManager";

/**
 * ============================================================================
 * PAGE SERVEUR — `/admin/pages` (Gestion des Pages)
 * ----------------------------------------------------------------------------
 * Server Component. L'écran client `PagesManager` consomme le store global
 * `PagesStoreProvider` (posé dans le Layout Dashboard) : le seed des pages et
 * modules vit dans le Provider. Prépare le futur SSR Supabase (remplacement du
 * seed par les données de la table `pages` sans changer le contrat du store).
 *
 * Références : plans/ROADMAP-3.1-pagemetadata.md §1.7 —
 *              plans/ROADMAP-3.2-pagebuilder-dnd.md §1.5
 * ============================================================================
 */

export const metadata: Metadata = {
  title: "Pages — Administration",
};

export default function AdminPagesPage() {
  return <PagesManager />;
}
