"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, SquarePen } from "lucide-react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pageHref, type ModuleCatalogEntry } from "@/lib/pages";

import { AddSectionSheet } from "./AddSectionSheet";
import { ModuleDndList } from "./ModuleDndList";

/**
 * Écran « Éditeur de page » (Étape 3.2) — route `/admin/pages/[id]`.
 * Client Component (monté sans SSR via `PageEditorScreen`) :
 *   - En-tête : retour liste, titre + statut + slug, « Aperçu » (nouvel onglet),
 *     bouton « + Ajouter une section ».
 *   - Canvas : liste des modules réordonnables (DnD) ou état vide.
 *   - Catalogue : `AddSectionSheet` → `addModule` (ajout en fin de page).
 *   - État « page introuvable » si l'id ne correspond à aucune page du store.
 *
 * Référence : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.6.1
 */

type PageEditorProps = {
  pageId: string;
};

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { getPage, getModules, addModule } = usePagesStore();
  const [catalogueOpen, setCatalogueOpen] = React.useState(false);

  const page = getPage(pageId);
  const modules = getModules(pageId);

  function handleAddSection(entry: ModuleCatalogEntry) {
    // La variante (ex. "static" pour la rubrique Héro) préconfigure le contenu.
    addModule(pageId, entry.type, entry.variant);
    setCatalogueOpen(false);
  }

  if (!page) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SquarePen className="size-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Page introuvable
          </h1>
          <p className="text-sm text-muted-foreground">
            Cette page n’existe pas ou a été supprimée. Revenez à la liste des
            pages pour continuer.
          </p>
          <Button onClick={() => router.push("/admin/pages")}>
            <ArrowLeft />
            Retour aux pages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/pages")}
            aria-label="Retour à la liste des pages"
            title="Retour à la liste"
            className="mt-0.5"
          >
            <ArrowLeft />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {page.title}
              </h1>
              {page.status === "published" ? (
                <Badge variant="success">Publié</Badge>
              ) : (
                <Badge variant="secondary">Brouillon</Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {pageHref(page.slug)}
              <span className="ml-3 font-sans normal-case">
                {modules.length} module{modules.length > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={pageHref(page.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              Aperçu
            </Link>
          </Button>
          <Button size="sm" onClick={() => setCatalogueOpen(true)}>
            <Plus />
            Ajouter une section
          </Button>
        </div>
      </div>

      {/* ---- Canvas ---- */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-6">
        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Plus className="size-5" />
            </span>
            <p className="font-medium text-foreground">
              Cette page est vide
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ajoutez votre première section pour commencer à composer la page.
            </p>
            <Button onClick={() => setCatalogueOpen(true)}>
              <Plus />
              Ajouter une section
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sections de la page
              </p>
            </div>
            <ModuleDndList pageId={pageId} modules={modules} />
            <p className="mt-4 text-xs text-muted-foreground">
              Astuce : utilisez la poignée ⋮⋮ pour réordonner les sections par
              glisser-déposer.
            </p>
          </>
        )}
      </div>

      {/* ---- Catalogue d'ajout ---- */}
      <AddSectionSheet
        open={catalogueOpen}
        onOpenChange={setCatalogueOpen}
        onAdd={handleAddSection}
      />
    </div>
  );
}
