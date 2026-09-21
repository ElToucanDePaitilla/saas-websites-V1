"use client";

import { PopUpDialog } from "@/components/popups/PopUpDialog";
import type { PopUp } from "@/lib/popup";
import { siteThemeWrapperClasses } from "@/lib/site-theme";
import { useVisualIdentity } from "@/lib/visual-identity-store";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * APERÇU ADMIN D'UNE POP-UP
 * ----------------------------------------------------------------------------
 * Réutilise le **composant public** `PopUpDialog` en mode `preview` (position
 * neutralisée, pas de voile, pas de verrouillage de focus) plutôt qu'un rendu
 * parallèle : ce que le photographe voit ici est exactement ce que le visiteur
 * verra. L'aperçu **ignore la fréquence** (sinon l'auteur croirait sa pop-up
 * cassée) et ne déclenche aucun événement.
 *
 * Le wrapper porte la palette choisie (`siteThemeWrapperClasses`) **plus** le
 * scope `.site-preview` : la page vit sous `.admin`, qui surcharge les alias
 * shadcn, et sans ce scope l'aperçu de Nacre afficherait la palette zinc de
 * l'administration au lieu du rose nacré.
 * ============================================================================
 */

export function PopUpPreview({ popup }: { popup: PopUp }) {
  const { visualIdentity } = useVisualIdentity();

  return (
    <div
      className={cn(
        "site-preview grid min-h-48 place-items-center rounded-lg border border-border bg-background p-4",
        siteThemeWrapperClasses(visualIdentity.theme)
      )}
    >
      <PopUpDialog popup={popup} open onOpenChange={() => {}} preview />
    </div>
  );
}
