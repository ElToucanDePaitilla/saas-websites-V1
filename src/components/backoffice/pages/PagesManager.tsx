"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ExternalLink,
  GripVertical,
  Home,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

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
import {
  pageHrefFor,
  type PageMetadataDraft,
  type SitePage,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { PageMetadataForm } from "./PageMetadataForm";

/**
 * ============================================================================
 * ÉCRAN — Gestion des Pages (liste + CRUD + Drag & Drop vertical)
 * ----------------------------------------------------------------------------
 * Client Component. Consomme le store global `PagesStoreProvider`.
 *   - Barre d'actions : titre « Pages », compte, bouton « + Nouvelle page ».
 *   - Liste (Desktop-first) : tableau épuré, réordonnable **verticalement** au
 *     glisser-déposer sur la **poignée ⋮⋮** de gauche (comme les sections d'une
 *     page) — l'ordre manuel remplace le tri « mis à jour » dans l'écran ;
 *   - Création & édition : Dialog embarquant `PageMetadataForm`.
 *   - Suppression : confirmation (avertissement si publiée).
 * L'ordre est réordonné dans le store (`movePage`) — ordre conservé en session
 * (la persistance BDD de l'ordre des pages est une extension future).
 *
 * Références : plans/ROADMAP-3.1-pagemetadata.md §1.6
 * ============================================================================
 */

type EditorState = {
  open: boolean;
  page?: SitePage;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PagesManager() {
  const router = useRouter();
  const { pages, createPage, updatePage, deletePage, movePage, setHomePage } =
    usePagesStore();
  const [editor, setEditor] = React.useState<EditorState>({ open: false });
  const [deleteTarget, setDeleteTarget] = React.useState<SitePage | null>(null);

  const publishedCount = pages.filter(
    (page) => page.status === "published"
  ).length;

  /** Slugs des autres pages (hors page en cours d'édition) — pour l'unicité. */
  const otherSlugs = pages
    .filter((page) => page.id !== editor.page?.id)
    .map((page) => page.slug);

  const isEditing = editor.page !== undefined;

  function openCreate() {
    setEditor({ open: true });
  }

  function openEdit(page: SitePage) {
    setEditor({ open: true, page });
  }

  function closeEditor() {
    setEditor({ open: false });
  }

  function openPageEditor(page: SitePage) {
    router.push(`/admin/pages/${page.id}`);
  }

  function handleDragEnd(result: DropResult) {
    const { destination, source } = result;
    if (!destination || destination.droppableId !== source.droppableId) {
      return;
    }
    if (destination.index === source.index) {
      return;
    }
    movePage(source.index, destination.index);
  }

  function handleSubmit(data: PageMetadataDraft) {
    const editingPage = editor.page;
    if (editingPage) {
      updatePage(editingPage.id, data);
    } else {
      createPage(data);
    }
    closeEditor();
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    deletePage(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="grid gap-6">
      {/* ---- Barre d'actions ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pages.length} page{pages.length > 1 ? "s" : ""} · {publishedCount}{" "}
            publiée{publishedCount > 1 ? "s" : ""} ·{" "}
            {pages.length - publishedCount} brouillon
            {pages.length - publishedCount > 1 ? "s" : ""} · glissez la poignée
            ⋮⋮ pour réordonner
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Nouvelle page
        </Button>
      </div>

      {/* ---- Liste (Desktop-first) — DnD vertical sur la poignée ---- */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Liste des pages du site (ordre modifiable par glisser-déposer).
              </caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th
                    scope="col"
                    className="w-10 px-2 py-3 font-semibold"
                    aria-label="Réordonner"
                  >
                    <GripVertical className="mx-auto size-4 opacity-40" />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Page
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    URL
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Statut
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Mis à jour
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <Droppable droppableId="pages">
                {(dropProvided) => (
                  <tbody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                    {pages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          Aucune page pour le moment. Créez votre première page.
                        </td>
                      </tr>
                    ) : (
                      pages.map((page, index) => (
                        <Draggable
                          key={page.id}
                          draggableId={page.id}
                          index={index}
                        >
                          {(dragProvided, snapshot) => (
                            <tr
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={cn(
                                "border-b border-border last:border-b-0 hover:bg-muted/30",
                                snapshot.isDragging &&
                                  "shadow-lg ring-2 ring-ring/40"
                              )}
                            >
                              {/* Poignée de glissement (seule zone draggable) */}
                              <td className="px-2 py-3">
                                <button
                                  type="button"
                                  {...dragProvided.dragHandleProps}
                                  aria-label={`Réordonner la page « ${page.title} »`}
                                  title="Glisser pour réordonner"
                                  className="cursor-grab rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
                                >
                                  <GripVertical className="size-4" />
                                </button>
                              </td>

                              {/* Page */}
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openPageEditor(page)}
                                    className="text-left font-medium text-foreground underline-offset-4 hover:underline"
                                    title={`Éditer les modules de « ${page.title} »`}
                                  >
                                    {page.title}
                                  </button>
                                  {page.isHome ? (
                                    <Badge variant="secondary">Accueil</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Menu : « {page.menuTitle} »
                                </p>
                              </td>

                              {/* URL */}
                              <td className="px-4 py-3">
                                <a
                                  href={pageHrefFor(page)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-accent-foreground underline-offset-4 hover:underline"
                                >
                                  <span className="font-mono text-xs">
                                    {pageHrefFor(page)}
                                  </span>
                                  <ExternalLink className="size-3 shrink-0" />
                                </a>
                              </td>

                              {/* Statut */}
                              <td className="px-4 py-3">
                                {page.status === "published" ? (
                                  <Badge variant="success">Publié</Badge>
                                ) : (
                                  <Badge variant="secondary">Brouillon</Badge>
                                )}
                              </td>

                              {/* Mis à jour */}
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {formatDate(page.updatedAt)}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Page d'accueil : la maison est présente sur
                                      **chaque ligne**, et c'est sa **couleur** qui
                                      porte l'information, jamais sa présence.
                                        · maison **grise et cliquable** → cette page
                                          n'est pas l'accueil ; le clic la désigne ;
                                        · maison **noire et non interactive** → c'est
                                          l'accueil du site ; le survol l'explique.

                                      Deux raisons de ne pas réutiliser `Button` pour
                                      l'état « accueil » :
                                        1. `disabled` impose `pointer-events-none`
                                           (voir `ui/button.tsx`) : le **tooltip ne
                                           s'afficherait jamais**, or c'est
                                           précisément ce qui est demandé ici ;
                                        2. un bouton désactivé mais focusable reste
                                           un piège au clavier — un indicateur n'est
                                           pas une action.
                                      Le `size-9` reproduit exactement la taille du
                                      bouton voisin : les icônes restent alignées
                                      d'une ligne à l'autre (la ligne de l'accueil
                                      décalait auparavant ses actions d'un cran). */}
                                  {page.isHome ? (
                                    <span
                                      role="img"
                                      aria-label={`« ${page.title} » est la page d’accueil du site`}
                                      title="Ceci est votre page d'accueil"
                                      className="flex size-9 shrink-0 items-center justify-center text-foreground"
                                    >
                                      <Home className="size-4" />
                                    </span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setHomePage(page.id)}
                                      aria-label={`Définir « ${page.title} » comme page d’accueil`}
                                      title="Définir cette page comme page d’accueil"
                                      className="text-muted-foreground/45 hover:text-foreground"
                                    >
                                      <Home />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openPageEditor(page)}
                                    aria-label={`Ouvrir l'éditeur de la page « ${page.title} »`}
                                    title="Éditeur de modules"
                                  >
                                    <LayoutTemplate />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(page)}
                                    aria-label={`Modifier la page « ${page.title} »`}
                                    title="Modifier les métadonnées"
                                  >
                                    <Pencil />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteTarget(page)}
                                    aria-label={`Supprimer la page « ${page.title} »`}
                                    title="Supprimer"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))
                    )}
                    {dropProvided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </DragDropContext>
        </div>
      </div>

      {/* ---- Dialog Création / Édition ---- */}
      <Dialog open={editor.open} onOpenChange={closeEditor}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la page" : "Nouvelle page"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Mettez à jour les métadonnées de la page puis enregistrez."
                : "Renseignez les métadonnées de la page (titre, menu, slug, statut)."}
            </DialogDescription>
          </DialogHeader>

          <PageMetadataForm
            key={editor.page?.id ?? "new"}
            initial={editor.page}
            existingSlugs={otherSlugs}
            onSubmit={handleSubmit}
            onCancel={closeEditor}
            submitLabel={isEditing ? "Enregistrer" : "Créer la page"}
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
            <DialogTitle>Supprimer cette page ?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.status === "published" ? (
                <>
                  « {deleteTarget.title} » est actuellement{" "}
                  <strong className="font-medium text-foreground">
                    publiée
                  </strong>{" "}
                  et visible sur le site. La suppression est définitive et
                  supprime aussi ses modules.
                </>
              ) : (
                <>
                  La page « {deleteTarget?.title} » et ses modules seront
                  définitivement supprimés. Cette action est irréversible.
                </>
              )}
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
