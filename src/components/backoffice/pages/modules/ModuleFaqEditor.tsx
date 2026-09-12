"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FaqItem, ModuleContent } from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « FAQ » (Étape 3.4 / 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire de la foire aux questions : titre de section et liste de
 * questions/réponses avec ajout / suppression. Contrôlé par le store : chaque
 * changement reconstruit le tableau `items` (immuable) puis commit en bloc.
 *
 * Étape 11.17 : le formulaire est réuni dans une `EditorZone` « Questions et
 * réponses », qui nomme le sujet **et** énonce sa portée — au lieu d'une liste
 * de champs à plat sans repère (plans/ROADMAP-11.17-editor-zones-ux.md §0.1).
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.3 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §5
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
      <EditorZone
        tone="content"
        title="Questions et réponses"
        scope="Le titre de la section et la liste des questions dépliables affichées sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={content.heading}
          onChange={(heading) => onChangeContent({ ...content, heading })}
          hint="Titre visible au-dessus de la liste des questions."
        />

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold leading-snug text-foreground">
              Questions ({content.items.length})
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus />
              Ajouter une question
            </Button>
          </div>

          {content.items.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
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
              Aucune question. Cliquez sur « Ajouter une question » pour créer la
              première.
            </p>
          ) : null}
        </div>
      </EditorZone>
    </div>
  );
}
