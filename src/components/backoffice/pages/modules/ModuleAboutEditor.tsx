"use client";

import type { ModuleContent } from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { MediaFields, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « À propos » (Étape 3.4 / 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire du bloc À propos : titre de section, texte (bio) et média
 * (image + alt). Contrôlé par le store : chaque changement reconstruit l'objet
 * `content` puis le commit en bloc.
 *
 * Étape 11.17 : deux `EditorZone` remplacent la liste à plat. Chacune nomme sa
 * **cible** et sa **portée** (« Votre présentation », « Photo »), de sorte que
 * l'utilisateur sache à tout moment ce qu'il est en train de modifier — cause
 * racine n°1 du plan plans/ROADMAP-11.17-editor-zones-ux.md.
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.3 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §5
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
      <EditorZone
        tone="content"
        title="Votre présentation"
        scope="Le titre de la section et le texte que le visiteur lit à votre sujet, sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={content.heading}
          onChange={(heading) => onChangeContent({ ...content, heading })}
          hint="Titre visible au-dessus de votre présentation."
        />
        <TextAreaField
          label="Texte de présentation"
          value={content.text}
          rows={6}
          hint="Parcours, spécialités, approche artistique."
          onChange={(text) => onChangeContent({ ...content, text })}
        />
      </EditorZone>

      <EditorZone
        tone="style"
        title="Photo"
        scope="L’image qui accompagne votre présentation, et sa description pour les moteurs de recherche."
      >
        <MediaFields
          value={content.media}
          onChange={(media) => onChangeContent({ ...content, media })}
        />
      </EditorZone>
    </div>
  );
}
