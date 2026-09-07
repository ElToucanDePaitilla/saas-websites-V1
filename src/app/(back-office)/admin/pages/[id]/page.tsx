import type { Metadata } from "next";

import { PageEditorScreen } from "@/components/backoffice/pages/PageEditorScreen";

/**
 * ============================================================================
 * PAGE SERVEUR — `/admin/pages/[id]` (Éditeur de page / Page Builder)
 * ----------------------------------------------------------------------------
 * Server Component léger : transmet l'`id` de la page au point de montage
 * client `PageEditorScreen` (chargé sans SSR car il embarque
 * `@hello-pangea/dnd`). L'existence de la page et la lecture de ses modules
 * sont faites côté client via le store `PagesStoreProvider` (données mock).
 *
 * Route dynamique : le `[id]` est inconnu à la compilation — aucun pré-rendu
 * statique. La validation d'id inconnu est gérée dans `PageEditor`
 * (état « Page introuvable »).
 *
 * Référence : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.7
 * ============================================================================
 */

export const metadata: Metadata = {
  title: "Éditeur de page — Administration",
};

type PageBuilderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPageBuilderPage({
  params,
}: PageBuilderPageProps) {
  const { id } = await params;
  return <PageEditorScreen pageId={id} />;
}
