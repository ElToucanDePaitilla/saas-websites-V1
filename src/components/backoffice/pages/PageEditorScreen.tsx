"use client";

import dynamic from "next/dynamic";

/**
 * Point de montage de l'éditeur de page (Étape 3.2).
 * Charge `PageEditor` — qui embarque `@hello-pangea/dnd` — **sans rendu
 * serveur** (`ssr: false`) : la bibliothèque accède au DOM et n'est pas
 * compatible avec l'hydratation SSR (évite tout `mismatch`). Un fallback
 * s'affiche pendant le chargement du module côté client.
 *
 * Référence : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.6.5
 */

const PageEditor = dynamic(
  () => import("./PageEditor").then((module) => module.PageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="text-sm text-muted-foreground">
          Chargement de l’éditeur…
        </p>
      </div>
    ),
  }
);

export function PageEditorScreen({ pageId }: { pageId: string }) {
  return <PageEditor pageId={pageId} />;
}
