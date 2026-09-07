import { redirect } from "next/navigation";

/**
 * ============================================================================
 * INDEX DU DASHBOARD — `/admin`
 * ----------------------------------------------------------------------------
 * Point d'entrée minimal du Back-Office : redirection immédiate vers l'écran
 * de gestion des Pages (`/admin/pages`), premier module de la Phase 3.
 *
 * Référence : plans/ROADMAP-3.1-pagemetadata.md §1.7.
 * ============================================================================
 */
export default function AdminIndexPage() {
  redirect("/admin/pages");
}
