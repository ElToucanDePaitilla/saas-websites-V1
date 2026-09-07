"use client";

import * as React from "react";
import {
  Draggable,
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Menu, Plus, Trash2 } from "lucide-react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
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
import { pageHref } from "@/lib/pages";
import {
  findNavParentId,
  hasNavChildren,
  resolveNavPreset,
  type NavArea,
  type NavMenuEntry,
  type NavPresetId,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

import {
  NavEntryForm,
  type NavEntryFormData,
  type NavParentOption,
  type NavTargetPage,
} from "./NavEntryForm";
import { NavEntryRow } from "./NavEntryRow";
import { useNavigationStore } from "./NavigationStoreProvider";
import { PresetOnboardingPanel } from "./PresetOnboardingPanel";

/**
 * ============================================================================
 * ÉCRAN — Navigation & Menus (Étapes 4.1 → 4.3)
 * ----------------------------------------------------------------------------
 * Client Component. Consomme le store mock global `NavigationStoreProvider`
 * (posé dans le Layout `/admin`). Organise l'arborescence du menu du **Header**
 * (menu principal, Niveau 1 + sous-menus Niveau 2) et du **Footer** (plat).
 *
 * Étape 4.3 :
 *   - **Drag & Drop** (`@hello-pangea/dnd`) : un `DragDropContext` **par zone**
 *     (aucun glisser Header ↔ Footer possible). Le Header porte une liste
 *     racine + une **zone enfant par item de Niveau 1** (sous-menu) ; déposer un
 *     item de Niveau 1 dans la zone enfant d'un autre l'**imbrique** (Niveau 2),
 *     le déposer dans la racine le **désimbrique** ;
 *   - le Footer est **plat** (liste unique) ;
 *   - le formulaire gagne le « Rattachement » (parent) et le type « Lien
 *     personnalisé » (ancres / URL externes) ;
 *   - la suppression d'un parent avertit de la **cascade du sous-menu**.
 *
 * Références : plans/ROADMAP-4.1-navigation.md §1.3 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.4
 * ============================================================================
 */

type AreaConfig = {
  area: NavArea;
  title: string;
  description: string;
};

const AREAS: AreaConfig[] = [
  {
    area: "header",
    title: "Menu principal — Header",
    description:
      "Niveau 1 + sous-menus (Niveau 2). Glissez un lien sur « Déposer ici » d'un item pour l’imbriquer.",
  },
  {
    area: "footer",
    title: "Navigation du pied de page — Footer",
    description:
      "Menu plat (Niveau 1 uniquement) — réordonnez les liens par glisser-déposer.",
  },
];

type EditorState = {
  open: boolean;
  area: NavArea;
  entry?: NavMenuEntry;
};

type DeleteTarget = {
  area: NavArea;
  entry: NavMenuEntry;
};

/** Ids stables des Droppable (@hello-pangea/dnd). */
function droppableRootId(area: NavArea): string {
  return `nav-${area}:root`;
}

function droppableSubId(area: NavArea, parentId: string): string {
  return `nav-${area}:sub:${parentId}`;
}

/**
 * Analyse un `droppableId` → `parentId` de la liste visée (`null` = racine).
 * Une id inconnue est traitée comme la racine (défensif, jamais atteint).
 */
function parseDroppableId(area: NavArea, droppableId: string): string | null {
  const root = droppableRootId(area);
  if (droppableId === root) {
    return null;
  }
  const prefix = droppableSubId(area, "");
  if (droppableId.startsWith(prefix)) {
    return droppableId.slice(prefix.length);
  }
  return null;
}

/** Nombre total d'items visibles d'une liste racine (racine + enfants). */
function countAll(entries: NavMenuEntry[]): number {
  return entries.reduce(
    (total, entry) => total + 1 + (entry.children?.length ?? 0),
    0
  );
}

/**
 * Liste DnD d'une zone (montée sous `<NavigationStoreProvider>`).
 * Le Drag & Drop est **local à la zone** : Header imbriqué, Footer plat.
 */
function NavigationList({
  area,
  onEdit,
  onRequestDelete,
}: {
  area: NavArea;
  onEdit: (area: NavArea, entry: NavMenuEntry) => void;
  onRequestDelete: (area: NavArea, entry: NavMenuEntry) => void;
}) {
  const { getEntries, updateEntry, moveNavItem } = useNavigationStore();
  const entries = getEntries(area);

  function handleToggleHidden(id: string, hidden: boolean) {
    updateEntry(area, id, { hidden: !hidden });
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    const sourceParent = parseDroppableId(area, source.droppableId);
    const destinationParent = parseDroppableId(area, destination.droppableId);
    moveNavItem(
      area,
      { parentId: sourceParent, index: source.index },
      { parentId: destinationParent, index: destination.index }
    );
  }

  if (entries.length === 0) {
    return (
      <p
        className={cn(
          "rounded-md border border-dashed border-border bg-background/50 px-3 py-8 text-center text-sm text-muted-foreground"
        )}
      >
        Aucun lien dans ce menu. Cliquez sur « Ajouter un lien » pour commencer.
      </p>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableRootId(area)}>
        {(dropProvided) => (
          <ul
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className="space-y-2"
          >
            {entries.map((entry, index) => {
              const children = entry.children ?? [];
              const hasChildren = children.length > 0;
              return (
                <Draggable
                  key={entry.id}
                  draggableId={entry.id}
                  index={index}
                >
                  {(dragProvided, dragSnapshot) => (
                    <li
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="list-none"
                    >
                      <NavEntryRow
                        entry={entry}
                        level={1}
                        submenuCount={children.length}
                        dragHandleProps={dragProvided.dragHandleProps}
                        snapshotIsDragging={dragSnapshot.isDragging}
                        onToggleHidden={handleToggleHidden}
                        onEdit={(entryToEdit) => onEdit(area, entryToEdit)}
                        onRemove={(entryToRemove) =>
                          onRequestDelete(area, entryToRemove)
                        }
                      />

                      {/* Zone enfant (sous-menu Niveau 2) — Header uniquement.
                          Toujours montée pour être une cible de dépôt fiable
                          (DnD : un droppable ajouté pendant le glisser ne serait
                          pas mesuré) ; affichage compact si vide. */}
                      {area === "header" ? (
                        <Droppable droppableId={droppableSubId(area, entry.id)}>
                          {(subProvided, subSnapshot) => (
                            <div
                              ref={subProvided.innerRef}
                              {...subProvided.droppableProps}
                              className={cn(
                                "ml-6 mt-1 rounded-md border border-dashed transition-colors",
                                hasChildren
                                  ? "border-border/60 bg-muted/10 p-1.5"
                                  : "border-border/25",
                                subSnapshot.isDraggingOver &&
                                  "border-primary bg-primary/5"
                              )}
                            >
                              {hasChildren ? (
                                <ul className="space-y-1.5">
                                  {children.map((child, childIndex) => (
                                    <Draggable
                                      key={child.id}
                                      draggableId={child.id}
                                      index={childIndex}
                                    >
                                      {(childProvided, childSnapshot) => (
                                        <li
                                          ref={childProvided.innerRef}
                                          {...childProvided.draggableProps}
                                          className="list-none"
                                        >
                                          <NavEntryRow
                                            entry={child}
                                            level={2}
                                            dragHandleProps={
                                              childProvided.dragHandleProps
                                            }
                                            snapshotIsDragging={
                                              childSnapshot.isDragging
                                            }
                                            onToggleHidden={handleToggleHidden}
                                            onEdit={(childToEdit) =>
                                              onEdit(area, childToEdit)
                                            }
                                            onRemove={(childToRemove) =>
                                              onRequestDelete(
                                                area,
                                                childToRemove
                                              )
                                            }
                                          />
                                        </li>
                                      )}
                                    </Draggable>
                                  ))}
                                </ul>
                              ) : (
                                <p
                                  className={cn(
                                    "px-1.5 py-0.5 text-[11px] text-muted-foreground/60 transition-colors",
                                    subSnapshot.isDraggingOver &&
                                      "text-muted-foreground"
                                  )}
                                >
                                  {subSnapshot.isDraggingOver
                                    ? "Relâchez pour imbriquer ce lien (Niveau 2)"
                                    : "Déposer ici pour imbriquer un lien (Niveau 2)"}
                                </p>
                              )}
                              {subProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : null}
                    </li>
                  )}
                </Draggable>
              );
            })}
            {dropProvided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export function NavigationManager() {
  const {
    getEntries,
    addEntry,
    updateEntry,
    removeEntry,
    relocateEntry,
    applyPreset,
    appliedPresetId,
  } = useNavigationStore();
  const { pages, updatePage } = usePagesStore();

  const [editor, setEditor] = React.useState<EditorState>({
    open: false,
    area: "header",
  });
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
    null
  );

  const pageTargets: NavTargetPage[] = React.useMemo(
    () =>
      pages.map((page) => ({
        id: page.id,
        menuTitle: page.menuTitle,
        href: pageHref(page.slug),
      })),
    [pages]
  );

  const headerEntries = getEntries("header");
  const footerEntries = getEntries("footer");
  const totalEntries = countAll(headerEntries) + countAll(footerEntries);

  /** Options de parent (Header) : items de Niveau 1, hors item édité. */
  const parentOptions: NavParentOption[] = React.useMemo(() => {
    if (editor.area !== "header") {
      return [];
    }
    return headerEntries
      .filter((item) => item.id !== editor.entry?.id)
      .map((item) => ({ id: item.id, label: item.label }));
  }, [headerEntries, editor]);

  /** Un item édité qui porte déjà un sous-menu reste verrouillé à la racine. */
  const parentEnabled =
    editor.entry === undefined || !hasNavChildren(editor.entry);

  const editingParentId = React.useMemo(() => {
    if (!editor.entry) {
      return null;
    }
    return findNavParentId(getEntries(editor.area), editor.entry.id);
  }, [editor, getEntries]);

  function openCreate(area: NavArea) {
    setEditor({ open: true, area });
  }

  function openEdit(area: NavArea, entry: NavMenuEntry) {
    setEditor({ open: true, area, entry });
  }

  function closeEditor() {
    setEditor((previous) => ({ ...previous, open: false }));
  }

  function handleSubmit(data: NavEntryFormData) {
    const { area, entry } = editor;
    if (entry) {
      if (area === "header" && data.parentId !== editingParentId) {
        relocateEntry(area, entry.id, data.parentId);
      }
      updateEntry(area, entry.id, {
        label: data.label,
        kind: data.kind,
        href: data.href,
        pageId: data.pageId,
      });
    } else {
      addEntry(area, data, data.parentId);
    }
    closeEditor();
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    removeEntry(deleteTarget.area, deleteTarget.entry.id);
    setDeleteTarget(null);
  }

  /**
   * Applique un preset Onboarding (Étape 4.4) : résout la structure puis, de
   * façon **atomique sur les deux stores**, (1) positionne `inMenu` de chaque
   * page existante selon le preset (`updatePage`) et (2) remplace le Header
   * (`applyPreset`). La synchro auto `PagesNavigationSync` est alors
   * idempotente — aucune page ne réapparaît, aucune entrée auto orpheline.
   */
  function handleApplyPreset(presetId: NavPresetId) {
    const resolved = resolveNavPreset(presetId, pages);
    for (const page of pages) {
      const next = resolved.inMenuByPageSlug[page.slug] === true;
      if (page.inMenu !== next) {
        updatePage(page.id, {
          title: page.title,
          menuTitle: page.menuTitle,
          slug: page.slug,
          status: page.status,
          inMenu: next,
        });
      }
    }
    applyPreset(resolved.header, presetId);
  }

  const isEditing = editor.entry !== undefined;
  const deletedChildrenCount = deleteTarget?.entry.children?.length ?? 0;

  return (
    <div className="grid gap-6">
      {/* ---- Barre d'actions ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Menu aria-hidden="true" className="size-6 text-muted-foreground" />
            Navigation & Menus
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalEntries} lien{totalEntries > 1 ? "s" : ""} répartis sur le
            menu principal (Niveaux 1 & 2) et le pied de page.
          </p>
        </div>
      </div>

      {/* ---- Presets Onboarding (Étape 4.4) ---- */}
      <PresetOnboardingPanel
        appliedPresetId={appliedPresetId}
        onApply={handleApplyPreset}
      />

      {/* ---- Zones Header / Footer ---- */}
      <div className="grid gap-6">
        {AREAS.map((config) => {
          const entries = getEntries(config.area);
          return (
            <section
              key={config.area}
              aria-labelledby={`area-${config.area}`}
              className="rounded-lg border border-border bg-card"
            >
              {/* En-tête de zone */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <h2
                    id={`area-${config.area}`}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    {config.title}
                    <Badge variant="secondary" className="rounded-sm px-1.5 py-0">
                      {countAll(entries)}
                    </Badge>
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
                <Button size="sm" onClick={() => openCreate(config.area)}>
                  <Plus />
                  Ajouter un lien
                </Button>
              </div>

              {/* Liste DnD */}
              <div className="p-3">
                <NavigationList
                  area={config.area}
                  onEdit={openEdit}
                  onRequestDelete={(area, entry) =>
                    setDeleteTarget({ area, entry })
                  }
                />
              </div>
            </section>
          );
        })}
      </div>

      {/* ---- Dialog Ajout / Édition ---- */}
      <Dialog open={editor.open} onOpenChange={closeEditor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le lien" : "Ajouter un lien"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Mettez à jour le libellé, la cible ou le rattachement puis enregistrez."
                : "Choisissez le libellé, la cible et le rattachement du nouveau lien de menu."}
            </DialogDescription>
          </DialogHeader>

          <NavEntryForm
            key={`${editor.area}-${editor.entry?.id ?? "new"}`}
            initial={editor.entry}
            pages={pageTargets}
            parentOptions={parentOptions}
            initialParentId={editingParentId}
            showParent={editor.area === "header"}
            parentEnabled={parentEnabled}
            parentDisabledHint={
              editor.entry && hasNavChildren(editor.entry)
                ? "Cet élément possède déjà un sous-menu : il reste à la racine du menu (profondeur maximale Niveau 2)."
                : ""
            }
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            submitLabel={isEditing ? "Enregistrer" : "Ajouter"}
          />
        </DialogContent>
      </Dialog>

      {/* ---- Dialog Confirmation de suppression ---- */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce lien ?</DialogTitle>
            <DialogDescription>
              Le lien « {deleteTarget?.entry.label} »
              {deletedChildrenCount > 0
                ? ` et son sous-menu (${deletedChildrenCount} lien${
                    deletedChildrenCount > 1 ? "s" : ""
                  })`
                : ""}{" "}
              seront définitivement retirés du menu. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
