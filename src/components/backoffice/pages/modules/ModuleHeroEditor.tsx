"use client";

import type { ModuleContent } from "@/lib/pages";

import { MediaFields, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Héro » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu du Héro plein écran : Titre H1, sous-titre, bouton CTA
 * (libellé + lien) et média d'arrière-plan (URL + alt). Contrôlé par le store :
 * chaque changement reconstruit l'objet `content` puis le commit en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleHeroEditorProps = {
  content: Extract<ModuleContent, { type: "hero" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "hero" }>) => void;
};

export function ModuleHeroEditor({
  content,
  onChangeContent,
}: ModuleHeroEditorProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Titre H1"
          value={content.heading}
          hint="Titre principal de la section (référencement)."
          onChange={(heading) => onChangeContent({ ...content, heading })}
          className="sm:col-span-2"
        />
        <TextAreaField
          label="Sous-titre"
          value={content.subheading}
          rows={3}
          hint="Une phrase d’accroche sous le titre."
          onChange={(subheading) => onChangeContent({ ...content, subheading })}
          className="sm:col-span-2"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Libellé du bouton CTA"
          value={content.ctaLabel}
          placeholder="Ex. Découvrir mon portfolio"
          onChange={(ctaLabel) => onChangeContent({ ...content, ctaLabel })}
        />
        <TextField
          label="Lien du bouton CTA"
          value={content.ctaHref}
          placeholder="/portfolio"
          mono
          hint="Page du site (/slug) ou URL externe (https://…)."
          onChange={(ctaHref) => onChangeContent({ ...content, ctaHref })}
        />
      </div>

      <MediaFields
        labelUrl="Image d’arrière-plan (URL)"
        value={content.media}
        onChange={(media) => onChangeContent({ ...content, media })}
      />
    </div>
  );
}
