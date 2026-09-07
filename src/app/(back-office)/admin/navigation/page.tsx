import type { Metadata } from "next";

import { NavigationManagerScreen } from "@/components/backoffice/navigation/NavigationManagerScreen";

/**
 * ============================================================================
 * PAGE SERVEUR — `/admin/navigation` (Navigation & Menus)
 * ----------------------------------------------------------------------------
 * Server Component léger : rend l'écran client `NavigationManagerScreen` (qui
 * charge `NavigationManager`, embarquant `@hello-pangea/dnd`, **sans SSR** —
 * Étape 4.3). Depuis l'Étape 4.2, le Provider mock `NavigationStoreProvider`
 * est **globalisé dans le Layout `/admin`** (avec `PagesStoreProvider` +
 * `PagesNavigationSync`) — il n'est donc plus posé ici. Le
 * `PagesStoreProvider` englobe également cette route : l'écran Navigation peut
 * lister les pages pour les entrées « page ».
 *
 * Références : plans/ROADMAP-4.1-navigation.md §1.6 —
 *              plans/ROADMAP-4.2-pages-nav-sync.md §1.6 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.7
 * ============================================================================
 */

export const metadata: Metadata = {
  title: "Navigation & Menus — Administration",
};

export default function AdminNavigationPage() {
  return <NavigationManagerScreen />;
}
