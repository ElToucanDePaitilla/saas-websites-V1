"use client";

import * as React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import { Accordion } from "@/components/ui/accordion";
import type { PageModule } from "@/lib/pages";

import { ModuleRow } from "./ModuleRow";

/**
 * Conteneur Drag & Drop + Accordéon vertical des modules d'une page
 * (Étape 3.3). Reprend le canvas DnD de l'Étape 3.2 et transforme chaque
 * module en **item d'accordéon compact** (`Accordion type="single"`):
 *   - un seul module est déplié à la fois (valeur = `module.id`, `collapsible`) ;
 *   - `@hello-pangea/dnd` reste isolé ici — monté sans SSR (voir PageEditorScreen).
 *
 * - `Droppable` = zone du canvas (droppableId unique par page) ;
 * - `Draggable` = un module (draggableId stable = module.id, jamais l'index) ;
 * - `onDragEnd` → `moveModule(pageId, from, to)` (helper `reorderModules`) ;
 * - l'item ouvert conserve son état après réordonnancement (la valeur `module.id`
 *   ne change pas) ; la suppression d'un item ouvert referme l'accordéon.
 *
 * Référence : plans/ROADMAP-3.3-accordion-compact.md §1.2
 */

type ModuleDndListProps = {
  pageId: string;
  modules: PageModule[];
};

export function ModuleDndList({ pageId, modules }: ModuleDndListProps) {
  const { moveModule, removeModule, setModuleHidden, updateModule } =
    usePagesStore();
  const [openModuleId, setOpenModuleId] = React.useState<string | undefined>(
    undefined
  );

  function handleDragEnd(result: DropResult) {
    const { destination, source } = result;
    if (!destination) {
      return;
    }
    if (destination.droppableId !== source.droppableId) {
      return;
    }
    if (destination.index === source.index) {
      return;
    }
    moveModule(pageId, source.index, destination.index);
  }

  function handleRemove(moduleId: string) {
    if (openModuleId === moduleId) {
      setOpenModuleId(undefined);
    }
    removeModule(pageId, moduleId);
  }

  function handleToggleHidden(moduleId: string, hidden: boolean) {
    setModuleHidden(pageId, moduleId, !hidden);
  }

  function handleUpdateModule(
    moduleId: string,
    patch: Partial<PageModule>
  ) {
    updateModule(pageId, moduleId, patch);
  }

  /** true si l'ancre d'un module est déjà portée par un autre module de la page. */
  function hasDuplicateAnchor(module: PageModule): boolean {
    return modules.some(
      (other) =>
        other.id !== module.id &&
        other.anchorId.length > 0 &&
        other.anchorId === module.anchorId
    );
  }

  if (modules.length === 0) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={`modules-${pageId}`}>
        {(dropProvided) => (
          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            <Accordion
              type="single"
              collapsible
              value={openModuleId}
              onValueChange={setOpenModuleId}
              className="space-y-3"
            >
              {modules.map((module, index) => (
                <Draggable key={module.id} draggableId={module.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <ModuleRow
                      module={module}
                      index={index}
                      provided={dragProvided}
                      snapshot={snapshot}
                      onToggleHidden={handleToggleHidden}
                      onRemove={handleRemove}
                      onUpdateModule={(patch) => handleUpdateModule(module.id, patch)}
                      duplicateAnchor={hasDuplicateAnchor(module)}
                    />
                  )}
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </Accordion>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
