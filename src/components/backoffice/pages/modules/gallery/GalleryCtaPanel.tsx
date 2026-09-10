"use client";

import { AlertCircle } from "lucide-react";

import {
  heroCtaStyleLabels,
  heroCtaStyleOrder,
  type GalleryCtaSettings,
  type HeroCtaStyle,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * PANNEAU CTA DE GALERIE (Phase 11)
 * ----------------------------------------------------------------------------
 * Bouton d'appel à l'action affiché en pied de galerie. Rendu uniquement selon
 * les **conditions habituelles de l'application** : affiché (`show`) ET libellé
 * ET lien non vides (voir `CTAButton`).
 * ============================================================================
 */

type GalleryCtaPanelProps = {
  cta: GalleryCtaSettings;
  onChange: (patch: Partial<GalleryCtaSettings>) => void;
};

export function GalleryCtaPanel({ cta, onChange }: GalleryCtaPanelProps) {
  // Champs manquants empêchant l'affichage du bouton (conditions habituelles).
  const missing: string[] = [];
  if (cta.label.trim() === "") {
    missing.push("libellé");
  }
  if (cta.href.trim() === "") {
    missing.push("lien");
  }

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Bouton d’appel à l’action
      </p>

      <SwitchField
        label="Afficher un bouton en pied de galerie"
        description="Le bouton n'apparaît que si un libellé et un lien sont renseignés."
        checked={cta.show}
        onChange={(show) => onChange({ show })}
      />

      {/* Alerte : bouton activé mais incomplet (ne s'affichera pas sur le site). */}
      {cta.show && missing.length > 0 ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Le bouton ne s’affichera pas sur le site : renseignez le{" "}
            {missing.join(" et le ")} pour le rendre visible.
          </span>
        </p>
      ) : null}

      {cta.show ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Libellé du bouton"
            value={cta.label}
            placeholder="Ex. Me contacter"
            onChange={(label) => onChange({ label })}
          />
          <TextField
            label="Lien du bouton"
            value={cta.href}
            placeholder="/contact ou https://…"
            onChange={(href) => onChange({ href })}
          />
          <SelectField<HeroCtaStyle>
            label="Style du bouton"
            value={cta.style}
            options={heroCtaStyleOrder.map((value) => ({
              value,
              label: heroCtaStyleLabels[value],
            }))}
            onChange={(style) => onChange({ style })}
          />
        </div>
      ) : null}
    </div>
  );
}
