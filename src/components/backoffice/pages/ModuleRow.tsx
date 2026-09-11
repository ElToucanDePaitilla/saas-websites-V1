"use client";

/* eslint-disable react-hooks/refs -- Adaptateur @hello-pangea/dnd & primitives
   Radix Accordion : provided.innerRef / draggableProps / dragHandleProps et la
   ref d'`AccordionPrimitive.Item` sont le pattern officiel (refs de rappel,
   non des refs React lues pendant le rendu). */

import * as React from "react";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";

import { AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { moduleCatalog, type PageModule } from "@/lib/pages";
import { cn } from "@/lib/utils";

import { EditorZone } from "./modules/EditorZone";
import { ModuleContentEditor } from "./modules/ModuleContentEditor";
import { ModuleSettingsForm } from "./modules/ModuleSettingsForm";
import { ModuleIcon } from "./ModuleIcon";

/**
 * Item d'accordéon compact d'un module dans le canvas de l'éditeur
 * (Étapes 3.3 & 3.4). Composé d'un bandeau compact (3.3) et d'une **Vue
 * Dépliée CRUD** (3.4) :
 *   - Vue Compacte (fermée) : poignée de glissement, libellé cliquable,
 *     Toggle Eye (masquer/afficher) et suppression avec confirmation ;
 *   - Vue Dépliée (ouverte) : `ModuleSettingsForm` (titre, ancre #id,
 *     animation) + `ModuleContentEditor` (formulaire contextuel par famille).
 *
 * Les formulaires sont **contrôlés par le store** : chaque frappe appelle
 * `onUpdateModule(patch)` → action `updateModule` (réactivité immédiate).
 *
 * Rendu par `ModuleDndList` à l'intérieur d'un `<Draggable>` : l'`Item` Radix
 * est l'élément racine et porte `innerRef`/`draggableProps`. Garde-fou HTML :
 * le handle, le trigger, l'œil et la suppression sont des **frères** dans le
 * bandeau (aucun `<button>` imbriqué) ; les champs du corps déplié ne sont pas
 * dans le trigger → la saisie ne replie pas et ne déclenche pas le drag.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.4
 */

type ModuleRowProps = {
  module: PageModule;
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  /** Bascule la visibilité publique : reçoit `module.hidden` (valeur actuelle). */
  onToggleHidden: (moduleId: string, hidden: boolean) => void;
  /** Supprime le module (après confirmation utilisateur). */
  onRemove: (moduleId: string) => void;
  /** Applique un patch au module (→ store `updateModule`, édition temps réel). */
  onUpdateModule: (patch: Partial<PageModule>) => void;
  /** true si l'ancre du module est déjà utilisée par un autre module de la page. */
  duplicateAnchor: boolean;
};

export function ModuleRow({
  module,
  index,
  provided,
  snapshot,
  onToggleHidden,
  onRemove,
  onUpdateModule,
  duplicateAnchor,
}: ModuleRowProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const meta = moduleCatalog.find((entry) => entry.type === module.type);
  const hidden = module.hidden;

  function handleConfirmDelete() {
    setConfirmDeleteOpen(false);
    onRemove(module.id);
  }

  return (
    <AccordionPrimitive.Item
      ref={provided.innerRef}
      {...provided.draggableProps}
      value={module.id}
      data-slot="module-accordion-item"
      className={cn(
        "rounded-lg border border-border bg-card shadow-xs transition-[box-shadow,background-color]",
        hidden && "bg-muted/30",
        snapshot.isDragging && "shadow-lg ring-2 ring-ring/40"
      )}
    >
      {/* ---- Bandeau compact (Vue Compacte, toujours visible) ---- */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Poignée de glissement (seule zone draggable) */}
        <button
          type="button"
          {...provided.dragHandleProps}
          aria-label={`Réordonner le module « ${module.title} »`}
          title="Glisser pour réordonner"
          className="cursor-grab rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        {/* Déclencheur d'ouverture/fermeture (libellé + icône + chevron) */}
        <AccordionPrimitive.Header className="flex min-w-0 flex-1">
          <AccordionPrimitive.Trigger
            className="group flex w-full flex-1 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&[data-state=open]>svg]:rotate-180"
            aria-label={
              hidden
                ? `Module masqué « ${module.title} » — ouvrir les réglages`
                : `Module « ${module.title} » — ouvrir les réglages`
            }
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
                hidden && "opacity-60"
              )}
            >
              <ModuleIcon type={module.type} className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "truncate text-[15px] leading-6 font-semibold text-foreground",
                    hidden && "text-muted-foreground"
                  )}
                >
                  <span className="mr-1.5 text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  {module.title}
                </span>
                {hidden && <Badge variant="outline">Masquée</Badge>}
              </span>
              <span
                className={cn(
                  "block truncate text-[13px] leading-5 text-muted-foreground",
                  hidden && "opacity-70"
                )}
              >
                {meta ? `${meta.category} · #${module.anchorId}` : module.anchorId}
              </span>
            </span>

            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        {/* Toggle Eye — masquer / afficher sur le site public */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={hidden}
          aria-label={
            hidden
              ? `Afficher le module « ${module.title} » sur le site`
              : `Masquer le module « ${module.title} » sur le site`
          }
          title={
            hidden
              ? "Afficher sur le site public"
              : "Masquer sur le site public (sans supprimer)"
          }
          onClick={() => onToggleHidden(module.id, hidden)}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            hidden && "text-foreground hover:text-foreground"
          )}
        >
          {hidden ? <EyeOff /> : <Eye />}
        </Button>

        {/* Suppression — ouvre la Dialog de confirmation */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Supprimer le module « ${module.title} »`}
          title="Supprimer le module"
          onClick={() => setConfirmDeleteOpen(true)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>

      {/* ---- Vue Dépliée (CRUD — formulaires contrôlés par le store) ---- */}
      <AccordionContent className="border-t border-border px-3 pb-4 pt-3">
        <div className="grid gap-4">
          {/* Contenu du module — chaque éditeur porte désormais ses propres zones
              titrées et pourvues d'une phrase de portée (Étape 11.17). */}
          <ModuleContentEditor
            content={module.content}
            onChangeContent={(content) => onUpdateModule({ content })}
            // Scalaire d'animation partagé — rubrique « Animations & Effets » du Héro (7.1).
            moduleAnimation={module.animation}
            onChangeModule={onUpdateModule}
          />

          {/* Réglages techniques — REPLIÉS et placés en fin de formulaire (11.17) :
              ces trois champs ne concernent pas le contenu composé par le
              photographe, ils n'ont donc pas à encombrer l'entrée du formulaire
              (plans/ROADMAP-11.17-editor-zones-ux.md §3.1). */}
          <EditorZone
            id={`module-settings-${module.id}`}
            tone="detail"
            collapsible
            title="Réglages avancés"
            scope="Nom de la section dans le back-office, identifiant utilisé par les liens et animation d’apparition. Ces réglages ne modifient pas le contenu affiché sur le site."
          >
            <ModuleSettingsForm
              module={module}
              duplicateAnchor={duplicateAnchor}
              onChange={onUpdateModule}
            />
          </EditorZone>
        </div>
      </AccordionContent>

      {/* ---- Dialog de confirmation de suppression ---- */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce module ?</DialogTitle>
            <DialogDescription>
              Le module « {module.title} » sera définitivement retiré de la page.
              {!hidden && (
                <>
                  {" "}
                  Il est actuellement visible sur le site public : cette action aura
                  un impact sur le rendu.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccordionPrimitive.Item>
  );
}
