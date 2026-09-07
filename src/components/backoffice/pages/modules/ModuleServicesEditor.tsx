"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ModuleContent, ServiceItem } from "@/lib/pages";

import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Services / Tarifs » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu des cartes de prestations : titre de section, introduction
 * et liste d'items (titre, description, prix) avec ajout / suppression.
 * Contrôlé par le store : chaque changement reconstruit le tableau `items`
 * (immuable) puis commit le `content` complet en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
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
      <TextField
        label="Titre de la section"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />
      <TextAreaField
        label="Introduction"
        value={content.intro}
        rows={2}
        hint="Phrase d’accroche au-dessus des cartes de prestations."
        onChange={(intro) => onChangeContent({ ...content, intro })}
      />

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prestations ({content.items.length})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus />
            Ajouter
          </Button>
        </div>

        {content.items.map((item, itemIndex) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-md border border-border bg-background/50 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Item {itemIndex + 1}
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
              label="Titre"
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
            Aucune prestation. Cliquez sur « Ajouter » pour créer la première.
          </p>
        ) : null}
      </div>
    </div>
  );
}
