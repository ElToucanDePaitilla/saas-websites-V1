"use client";

import type { ModuleContent } from "@/lib/pages";

import { MediaFields, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « À propos » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu du bloc À propos : titre de section, texte (bio) et média
 * (image + alt). Contrôlé par le store : chaque changement reconstruit l'objet
 * `content` puis le commit en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleAboutEditorProps = {
  content: Extract<ModuleContent, { type: "about" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "about" }>) => void;
};

export function ModuleAboutEditor({
  content,
  onChangeContent,
}: ModuleAboutEditorProps) {
  return (
    <div className="grid gap-4">
      <TextField
        label="Titre de la section"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />
      <TextAreaField
        label="Bio / Texte"
        value={content.text}
        rows={6}
        hint="Présentez-vous : parcours, spécialités, approche artistique."
        onChange={(text) => onChangeContent({ ...content, text })}
      />
      <MediaFields
        value={content.media}
        onChange={(media) => onChangeContent({ ...content, media })}
      />
    </div>
  );
}
