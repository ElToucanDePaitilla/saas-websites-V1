"use client";

import type { ModuleContent } from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Contact » (Étape 3.4 / 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire du bloc contact : titre, introduction et coordonnées (e-mail,
 * téléphone, adresse). Contrôlé par le store : chaque changement reconstruit
 * l'objet `content` puis le commit en bloc.
 *
 * Étape 11.17 : deux `EditorZone` nomment chacune leur cible et leur portée
 * (« Votre message d'accueil », « Coordonnées ») au lieu d'une liste à plat.
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.3 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §5
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
      <EditorZone
        tone="content"
        title="Votre message d’accueil"
        scope="Le titre de la section et le texte d’invitation affichés au-dessus de vos coordonnées, sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={content.heading}
          onChange={(heading) => onChangeContent({ ...content, heading })}
          hint="Titre visible au-dessus de la section contact."
        />
        <TextAreaField
          label="Texte d’invitation"
          value={content.intro}
          rows={2}
          hint="Quelques mots pour inviter le visiteur à vous écrire."
          onChange={(intro) => onChangeContent({ ...content, intro })}
        />
      </EditorZone>

      <EditorZone
        tone="detail"
        title="Coordonnées"
        scope="Les informations de contact affichées sur le site public. Elles servent aussi au bouton « me contacter » d’autres sections."
      >
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
      </EditorZone>
    </div>
  );
}
