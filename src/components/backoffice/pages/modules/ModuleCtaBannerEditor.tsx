"use client";

import type { ModuleContent } from "@/lib/pages";

import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Bandeau CTA » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu du bandeau d'appel à l'action : titre, sous-titre et bouton
 * CTA (libellé + lien). Contrôlé par le store : chaque changement reconstruit
 * l'objet `content` puis le commit en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleCtaBannerEditorProps = {
  content: Extract<ModuleContent, { type: "cta-banner" }>;
  onChangeContent: (
    content: Extract<ModuleContent, { type: "cta-banner" }>
  ) => void;
};

export function ModuleCtaBannerEditor({
  content,
  onChangeContent,
}: ModuleCtaBannerEditorProps) {
  return (
    <div className="grid gap-4">
      <TextField
        label="Titre du bandeau"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />
      <TextAreaField
        label="Sous-titre"
        value={content.subheading}
        rows={2}
        onChange={(subheading) => onChangeContent({ ...content, subheading })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Libellé du bouton CTA"
          value={content.ctaLabel}
          placeholder="Ex. Me contacter"
          onChange={(ctaLabel) => onChangeContent({ ...content, ctaLabel })}
        />
        <TextField
          label="Lien du bouton CTA"
          value={content.ctaHref}
          placeholder="/contact"
          mono
          onChange={(ctaHref) => onChangeContent({ ...content, ctaHref })}
        />
      </div>
    </div>
  );
}
