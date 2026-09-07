"use client";

import type { ModuleContent } from "@/lib/pages";

import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Contact » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu du bloc contact : titre, introduction et coordonnées
 * (email, téléphone, adresse). Contrôlé par le store : chaque changement
 * reconstruit l'objet `content` puis le commit en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleContactEditorProps = {
  content: Extract<ModuleContent, { type: "contact" }>;
  onChangeContent: (
    content: Extract<ModuleContent, { type: "contact" }>
  ) => void;
};

export function ModuleContactEditor({
  content,
  onChangeContent,
}: ModuleContactEditorProps) {
  return (
    <div className="grid gap-4">
      <TextField
        label="Titre de la section"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />
      <TextAreaField
        label="Introduction"
        value={content.intro}
        rows={2}
        hint="Texte d’invitation affiché au-dessus des coordonnées."
        onChange={(intro) => onChangeContent({ ...content, intro })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="E-mail"
          type="email"
          value={content.email}
          placeholder="bonjour@exemple.fr"
          autoComplete="email"
          onChange={(email) => onChangeContent({ ...content, email })}
        />
        <TextField
          label="Téléphone"
          type="tel"
          value={content.phone}
          placeholder="+33 6 00 00 00 00"
          autoComplete="tel"
          onChange={(phone) => onChangeContent({ ...content, phone })}
        />
      </div>
      <TextField
        label="Adresse / zone d’intervention"
        value={content.address}
        placeholder="Ville, région, pays"
        onChange={(address) => onChangeContent({ ...content, address })}
      />
    </div>
  );
}
