"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { CTAButton } from "@/components/modules/gallery/CTAButton";
import type { PopUp } from "@/lib/popup";

/**
 * ============================================================================
 * CONTENU D'UNE POP-UP — message / promo / capture (rendu partagé)
 * ----------------------------------------------------------------------------
 * Corps visuel de la pop-up, réutilisé **tel quel** par le rendu public
 * (`PopUpDialog`) et par l'aperçu admin (`PopUpPreview`). Il ne porte ni voile,
 * ni position, ni fermeture : ces décisions appartiennent à `PopUpDialog`.
 *
 * Le CTA réutilise `CTAButton` — donc, gratuitement, la discrimination de
 * destination du site (URL absolue en nouvel onglet, `mailto:`/`tel:` en même
 * onglet, destination interne par `NavLink`), qui inclut le déclenchement
 * `popup:<id>` depuis le lot B.
 *
 * Mode `lead` (Lot C) : **inerte** tant que la destination des e-mails n'est pas
 * tranchée — le contenu se rend comme un message simple, sans formulaire cassé.
 * ============================================================================
 */

type PopUpContentProps = {
  popup: PopUp;
  /** Aperçu admin : affiche une aide quand la pop-up est vide. */
  preview?: boolean;
};

export function PopUpContent({ popup, preview = false }: PopUpContentProps) {
  const [copied, setCopied] = React.useState(false);

  const mediaUrl = popup.media?.url.trim() ?? "";
  const body = popup.body.trim();
  const promoCode = popup.promoCode.trim();

  async function copyPromoCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le code reste lisible
      // à l'écran, la copie manuelle est le repli.
    }
  }

  const isEmpty =
    mediaUrl === "" &&
    body === "" &&
    (popup.contentKind !== "promo" || promoCode === "") &&
    !(popup.cta.show && popup.cta.label.trim() !== "");

  return (
    <div className="grid gap-4">
      {mediaUrl !== "" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={popup.media?.alt ?? ""}
          className="max-h-56 w-full rounded-lg border border-border object-cover"
        />
      ) : null}

      {body !== "" ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      ) : null}

      {popup.contentKind === "promo" && promoCode !== "" ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold tracking-wide text-foreground">
            {promoCode}
          </code>
          <button
            type="button"
            onClick={() => void copyPromoCode()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {copied ? (
              <>
                <Check aria-hidden="true" className="size-3.5" />
                Copié
              </>
            ) : (
              <>
                <Copy aria-hidden="true" className="size-3.5" />
                Copier
              </>
            )}
          </button>
        </div>
      ) : null}

      {popup.cta.show &&
      popup.cta.label.trim() !== "" &&
      popup.cta.href.trim() !== "" ? (
        <div className="flex justify-center pt-1">
          <CTAButton cta={popup.cta} size="default" />
        </div>
      ) : null}

      {preview && isEmpty ? (
        <p className="text-xs text-muted-foreground">
          Renseignez un titre, un texte, une image, un code ou un bouton pour
          que ce message ait du contenu à afficher.
        </p>
      ) : null}
    </div>
  );
}
