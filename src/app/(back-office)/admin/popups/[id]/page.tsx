import type { Metadata } from "next";

import { PopUpEditor } from "@/components/backoffice/popups/PopUpEditor";

/**
 * ============================================================================
 * PAGE SERVEUR — `/admin/popups/[id]` (éditeur d'une pop-up)
 * ----------------------------------------------------------------------------
 * Server Component léger : transmet l'`id` au point de montage client. La
 * lecture de la pop-up se fait via `PopUpProvider` (store hydraté par le layout
 * `/admin`) ; un id inconnu affiche l'état « Pop-up introuvable ». Route
 * dynamique : aucun pré-rendu statique.
 * ============================================================================
 */

export const metadata: Metadata = {
  title: "Éditeur de pop-up — Administration",
};

type PopUpEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPopUpEditorPage({
  params,
}: PopUpEditorPageProps) {
  const { id } = await params;
  return <PopUpEditor popupId={id} />;
}
