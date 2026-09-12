"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { moduleCatalog, type ModuleCatalogEntry } from "@/lib/pages";

import { ModuleIcon } from "./ModuleIcon";

/**
 * Catalogue « + Ajouter une section » (Étape 3.2).
 * Panneau latéral droit (`Sheet` shadcn/ui) listant les modules préformatés du
 * catalogue (`moduleCatalog`), groupés par catégorie. Un clic sur une entrée
 * déclenche `onAdd(type)` — la fermeture et l'insertion sont pilotées par le
 * parent `PageEditor` (appel de l'action store `addModule`).
 *
 * Référence : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.6.2
 */

type AddSectionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reçoit l'entrée du catalogue (type + variante pré-configurée). */
  onAdd: (entry: ModuleCatalogEntry) => void;
};

export function AddSectionSheet({
  open,
  onOpenChange,
  onAdd,
}: AddSectionSheetProps) {
  /** Groupement stable du catalogue par catégorie (ordre d'apparition conservé). */
  const categories = React.useMemo(() => {
    const grouped = new Map<string, typeof moduleCatalog>();
    for (const meta of moduleCatalog) {
      const list = grouped.get(meta.category) ?? [];
      list.push(meta);
      grouped.set(meta.category, list);
    }
    return Array.from(grouped.entries());
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pr-8">
          <SheetTitle>Ajouter une section</SheetTitle>
          <SheetDescription>
            Choisissez un module préformaté : il sera ajouté en bas de la page,
            puis réordonnable par glisser-déposer.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 pb-6">
          {categories.map(([category, items], categoryIndex) => (
            <section
              key={category}
              aria-labelledby={`module-category-${categoryIndex}`}
            >
              <h2
                id={`module-category-${categoryIndex}`}
                className="mb-2 pl-1 text-[13px] font-semibold leading-snug text-foreground"
              >
                {category}
              </h2>
              <div className="grid gap-2">
                {items.map((meta) => (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => onAdd(meta)}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-ring hover:bg-accent"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ModuleIcon type={meta.type} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {meta.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {meta.description}
                      </span>
                    </span>
                    <Plus className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
