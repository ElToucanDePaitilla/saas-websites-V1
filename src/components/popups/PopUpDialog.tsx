"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { PopUp } from "@/lib/popup";
import { cn } from "@/lib/utils";

import { PopUpContent } from "./PopUpContent";

/**
 * ============================================================================
 * POP-UP PUBLIC — boîte de dialogue paramétrable
 * ----------------------------------------------------------------------------
 * **Pas de `Portal` Radix, volontairement.** `DialogContent` (`ui/dialog.tsx`)
 * enveloppe son contenu dans `DialogPrimitive.Portal`, qui monte le nœud sur
 * `document.body` — donc **hors** du wrapper `display: contents` du layout
 * front-office qui porte les jetons `.theme-<id>`. Une pop-up portée perdrait la
 * palette du site (couleurs, polices, mode sombre) et afficherait les jetons de
 * `:root`. On utilise donc les primitives `Root / Overlay / Content / Title /
 * Close` **sans** `Portal`, rendues dans le flux du wrapper de thème.
 *
 * Conséquences assumées :
 *   - `z-[70]` : au-dessus du Header fixe (`z-50`) et de l'offset du bandeau ;
 *   - `modal` est désactivé pour le format `slide-in` (panneau non bloquant) et
 *     en aperçu admin (`preview`), jamais pour la modale ;
 *   - l'animation réutilise les utilitaires `tw-animate-css` (aucun `@keyframes`
 *     ajouté à `globals.css`) pilotés par le champ `animation` du domaine.
 * ============================================================================
 */

type PopUpDialogProps = {
  popup: PopUp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Aperçu admin : position neutralisée, pas de voile ni de verrouillage. */
  preview?: boolean;
  className?: string;
};

/** Classes d'entrée/sortie déduites de `popup.animation` (réutilise tw-animate). */
function animationClasses(popup: PopUp): string {
  const animation = popup.animation === "default" ? "scale-in" : popup.animation;
  const fade =
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200";
  switch (animation) {
    case "none":
      return "";
    case "fade-in":
      return fade;
    case "fade-up":
      return cn(fade, "data-[state=open]:slide-in-from-bottom-2");
    case "scale-in":
    default:
      return cn(fade, "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95");
  }
}

export function PopUpDialog({
  popup,
  open,
  onOpenChange,
  preview = false,
  className,
}: PopUpDialogProps) {
  const isSlideIn = popup.layout === "slide-in";
  const isFullscreen = popup.layout === "fullscreen";
  const showOverlay = !isSlideIn && popup.overlay;

  const heading = popup.heading.trim();

  // Position : neutralisée en aperçu (l'aperçu vit dans l'éditeur, pas dans le
  // viewport). Le `slide-in` rejoint sa position par la classe de côté.
  const positionClasses = preview
    ? "relative mx-auto w-full max-w-lg rounded-xl p-6"
    : isFullscreen
      ? "fixed inset-0 h-full w-full overflow-y-auto rounded-none p-6 sm:p-10"
      : isSlideIn
        ? cn(
            "fixed bottom-4 w-[min(24rem,calc(100%-2rem))] rounded-xl p-5",
            popup.slidePosition === "bottom-left" ? "left-4" : "right-4"
          )
        : "fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={preview ? undefined : onOpenChange}
      modal={!isSlideIn && !preview}
    >
      {showOverlay ? (
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[65] bg-black/45 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
      ) : null}

      <DialogPrimitive.Content
        aria-describedby={undefined}
        // En aperçu, l'ouverture ne doit pas voler le focus de l'éditeur : la
        // boîte est toujours « ouverte », sans intention d'interaction.
        onOpenAutoFocus={(event) => {
          if (preview) {
            event.preventDefault();
          }
        }}
        // Le clic sur le voile ferme la pop-up par défaut (Radix). Quand
        // `dismissOnOverlay` est faux, on l'empêche : seule la croix (et Échap)
        // ferment. Échap reste toujours actif — l'accessibilité n'est pas un
        // réglage.
        onPointerDownOutside={(event) => {
          if (!popup.dismissOnOverlay) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (!popup.dismissOnOverlay) {
            event.preventDefault();
          }
        }}
        className={cn(
          // Tout le contenu est centré horizontalement (`text-center`) : la
          // pop-up est un objet isolé, pas une colonne éditoriale. Le `px-8`
          // réserve la place de la croix de fermeture des deux côtés.
          "z-[70] grid gap-4 border border-border bg-card text-center text-card-foreground shadow-lg focus:outline-none",
          positionClasses,
          isSlideIn && !preview && "data-[state=open]:slide-in-from-bottom",
          animationClasses(popup),
          className
        )}
      >
        {/* Titre porté par un vrai `<h2>` (style ``.module-h2`` du site) : Radix
            `Title` câble `aria-labelledby` et rend `h2` par défaut ; `asChild`
            le rend explicite tout en gardant la typographie éditoriale. */}
        <DialogPrimitive.Title asChild>
          <h2
            className={cn(
              "module-h2 px-8 text-foreground",
              heading === "" && "sr-only"
            )}
          >
            {heading === "" ? "Message" : heading}
          </h2>
        </DialogPrimitive.Title>

        {/* Le contenu porte le reste : média, texte, code promo, CTA. */}
        <PopUpContent popup={popup} preview={preview} />

        <DialogPrimitive.Close
          aria-label="Fermer"
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}
