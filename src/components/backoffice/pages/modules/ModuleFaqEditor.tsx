"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FaqItem, ModuleContent } from "@/lib/pages";

import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « FAQ » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu de la foire aux questions : titre de section et liste de
 * questions/réponses avec ajout / suppression. Contrôlé par le store : chaque
 * changement reconstruit le tableau `items` (immuable) puis commit en bloc.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleFaqEditorProps = {
  content: Extract<ModuleContent, { type: "faq" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "faq" }>) => void;
};

export function ModuleFaqEditor({ content, onChangeContent }: ModuleFaqEditorProps) {
  function updateItem(itemId: string, patch: Partial<FaqItem>) {
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
          question: "Nouvelle question",
          answer: "Rédigez la réponse…",
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

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Questions ({content.items.length})
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
                Question {itemIndex + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Supprimer la question « ${item.question || "sans titre"} »`}
                title="Supprimer cette question"
                onClick={() => removeItem(item.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
            <TextField
              label="Question"
              value={item.question}
              placeholder="Ex. Comment se déroule une séance ?"
              onChange={(question) => updateItem(item.id, { question })}
            />
            <TextAreaField
              label="Réponse"
              value={item.answer}
              rows={3}
              onChange={(answer) => updateItem(item.id, { answer })}
            />
          </div>
        ))}

        {content.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucune question. Cliquez sur « Ajouter » pour créer la première.
          </p>
        ) : null}
      </div>
    </div>
  );
}
