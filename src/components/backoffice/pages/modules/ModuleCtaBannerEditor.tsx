"use client";

import type { ModuleContent } from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Bandeau CTA » (Étape 3.4 / 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire du bandeau d'appel à l'action : message (titre + sous-titre) et
 * bouton (libellé + lien). Contrôlé par le store : chaque changement
 * reconstruit l'objet `content` puis le commit en bloc.
 *
 * Étape 11.17 : deux `EditorZone` séparent nettement **le message** de **l'action**
 * (« Message du bandeau » / « Bouton »), ce qui répond à la question « de quoi
 * parle cette rubrique ? » — cause racine n°1 du plan
 * plans/ROADMAP-11.17-editor-zones-ux.md.
 *
 * Évolution possible (hors périmètre) : remplacer le champ texte « Lien du
 * bouton » par `LinkTargetField` — le sélecteur de cible créé en 11.16 pour le
 * CTA de galerie — afin d'éviter au photographe de saisir une URL à la main.
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.3 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §5
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
      <EditorZone
        tone="content"
        title="Message du bandeau"
        scope="Ce que le visiteur lit dans le bandeau, sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={content.heading}
          onChange={(heading) => onChangeContent({ ...content, heading })}
          hint="Titre principal du bandeau."
        />
        <TextAreaField
          label="Sous-titre"
          value={content.subheading}
          rows={2}
          hint="Phrase d’appui affichée sous le titre."
          onChange={(subheading) => onChangeContent({ ...content, subheading })}
        />
      </EditorZone>

      <EditorZone
        tone="action"
        title="Bouton"
        scope="Le bouton du bandeau : son libellé et la destination du visiteur qui clique."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Libellé du bouton"
            value={content.ctaLabel}
            placeholder="Ex. Me contacter"
            onChange={(ctaLabel) => onChangeContent({ ...content, ctaLabel })}
          />
          <TextField
            label="Lien du bouton"
            value={content.ctaHref}
            placeholder="/contact ou https://…"
            mono
            onChange={(ctaHref) => onChangeContent({ ...content, ctaHref })}
          />
        </div>
      </EditorZone>
    </div>
  );
}
