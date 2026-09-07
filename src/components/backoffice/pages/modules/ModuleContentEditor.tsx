"use client";

import type { ModuleContent } from "@/lib/pages";

import { ModuleAboutEditor } from "./ModuleAboutEditor";
import { ModuleContactEditor } from "./ModuleContactEditor";
import { ModuleCtaBannerEditor } from "./ModuleCtaBannerEditor";
import { ModuleFaqEditor } from "./ModuleFaqEditor";
import { ModuleGalleryEditor } from "./ModuleGalleryEditor";
import { ModuleHeroEditor } from "./ModuleHeroEditor";
import { ModuleServicesEditor } from "./ModuleServicesEditor";

/**
 * ============================================================================
 * ROUTEUR D'ÉDITEUR DE CONTENU — Vue dépliée d'un module (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Sélectionne le formulaire de contenu adapté à la famille du module. Le
 * `switch` discrime directement sur `content.type` (union discriminé) : chaque
 * branche narrow l'objet et le TS garantit la couverture des 7 familles.
 * Centralise la correspondance `PageModuleType` ↔ éditeur (comme `ModuleIcon`
 * pour les icônes) et évite tout import UI dans `src/lib/pages.ts`.
 *
 * Chaque éditeur reçoit son `content` typé et un rappel qui commite le nouveau
 * contenu **en bloc** vers le store (`updateModule`). Aucun cast : la réduction
 * d'union est totale.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.2
 * ============================================================================
 */

type ModuleContentEditorProps = {
  content: ModuleContent;
  /** Commite un nouveau contenu complet (→ updateModule). */
  onChangeContent: (content: ModuleContent) => void;
};

export function ModuleContentEditor({
  content,
  onChangeContent,
}: ModuleContentEditorProps) {
  switch (content.type) {
    case "hero":
      return <ModuleHeroEditor content={content} onChangeContent={onChangeContent} />;
    case "about":
      return <ModuleAboutEditor content={content} onChangeContent={onChangeContent} />;
    case "services":
      return (
        <ModuleServicesEditor content={content} onChangeContent={onChangeContent} />
      );
    case "cta-banner":
      return (
        <ModuleCtaBannerEditor content={content} onChangeContent={onChangeContent} />
      );
    case "gallery":
      return <ModuleGalleryEditor content={content} onChangeContent={onChangeContent} />;
    case "faq":
      return <ModuleFaqEditor content={content} onChangeContent={onChangeContent} />;
    case "contact":
      return <ModuleContactEditor content={content} onChangeContent={onChangeContent} />;
  }
}
