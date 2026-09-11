"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ModuleContent, ServiceItem } from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Services / Tarifs » (Étape 3.4 / 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire des cartes de prestations : titre de section, introduction et liste
 * d'items (titre, description, prix) avec ajout / suppression. Contrôlé par le
 * store : chaque changement reconstruit le tableau `items` (immuable) puis
 * commit le `content` complet en bloc.
 *
 * Étape 11.17 : deux `EditorZone` séparent **l'en-tête de la section** de **la
 * liste des prestations**, et chacune énonce sa portée — au lieu de champs à
 * plat sans repère (plans/ROADMAP-11.17-editor-zones-ux.md §0.1). Les cartes de
 * prestations sont passées en bordure **pointillée**, convention des blocs
 * imbriqués dans une zone.
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.3 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §5
 * ============================================================================
 */

type ModuleServicesEditorProps = {
  content: Extract<ModuleContent, { type: "services" }>;
  onChangeContent: (
    content: Extract<ModuleContent, { type: "services" }>
  ) => void;
};

export function ModuleServicesEditor({
  content,
  onChangeContent,
}: ModuleServicesEditorProps) {
  function updateItem(itemId: string, patch: Partial<ServiceItem>) {
    onChangeContent({
      ...content,
      items: content.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    });
  }

  function removeItem(itemId: string) {
    onChangeContent({
      ...content,
      items: content.items.filter((item) => item.id !== itemId),
    });
  }

  function addItem() {
    onChangeContent({
      ...content,
      items: [
        ...content.items,
        {
          id: crypto.randomUUID(),
          title: "Nouvelle prestation",
          description: "Décrivez cette prestation…",
          price: "",
        },
      ],
    });
  }

  return (
    <div className="grid gap-4">
      <EditorZone
        tone="content"
        title="En-tête de la section"
        scope="Le titre et la phrase d’introduction affichés au-dessus des cartes de prestations, sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={content.heading}
          onChange={(heading) => onChangeContent({ ...content, heading })}
          hint="Titre visible au-dessus des prestations."
        />
        <TextAreaField
          label="Phrase d’introduction"
          value={content.intro}
          rows={2}
          hint="Quelques mots d’accroche au-dessus des cartes."
          onChange={(intro) => onChangeContent({ ...content, intro })}
        />
      </EditorZone>

      <EditorZone
        tone="style"
        title="Prestations et tarifs"
        scope="Chaque carte présentée au visiteur : son intitulé, sa description et son prix. Leur ordre est celui de la liste ci-dessous."
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prestations ({content.items.length})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus />
            Ajouter une prestation
          </Button>
        </div>

        {content.items.map((item, itemIndex) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Prestation {itemIndex + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Supprimer la prestation « ${item.title || "sans titre"} »`}
                title="Supprimer cette prestation"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
            <TextField
              label="Intitulé"
              value={item.title}
              placeholder="Ex. Séance portrait"
              onChange={(title) => updateItem(item.id, { title })}
            />
            <TextAreaField
              label="Description"
              value={item.description}
              rows={2}
              onChange={(description) => updateItem(item.id, { description })}
            />
            <TextField
              label="Prix"
              value={item.price}
              placeholder="Ex. à partir de 190 €"
              onChange={(price) => updateItem(item.id, { price })}
            />
          </div>
        ))}

        {content.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucune prestation. Cliquez sur « Ajouter une prestation » pour créer la
            première.
          </p>
        ) : null}
      </EditorZone>
    </div>
  );
}
