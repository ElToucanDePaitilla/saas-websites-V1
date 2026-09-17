"use client";

import type {
  ModuleAnimation,
  ModuleContent,
  PageModule,
} from "@/lib/pages";

import { ModuleAboutEditor } from "./ModuleAboutEditor";
import { ModuleCardsEditor } from "./ModuleCardsEditor";
import { ContactMapEditor } from "./ContactMapEditor";
import { ModuleContactEditor } from "./ModuleContactEditor";
import { ModuleCtaBannerEditor } from "./ModuleCtaBannerEditor";
import { ModuleFaqEditor } from "./ModuleFaqEditor";
import { ModuleGalleryEditor } from "./ModuleGalleryEditor";
import { ModuleHeroEditor } from "./ModuleHeroEditor";
import { ModuleHeroSliderEditor } from "./ModuleHeroSliderEditor";
import { ModuleHeroParallaxEditor } from "./ModuleHeroParallaxEditor";
import { ModuleHeroCurtainEditor } from "./ModuleHeroCurtainEditor";
import { ModuleHeroVideoEditor } from "./ModuleHeroVideoEditor";
import { ModuleContentColumnsEditor } from "./ModuleContentColumnsEditor";
import { ModuleServicesEditor } from "./ModuleServicesEditor";

/**
 * ============================================================================
 * ROUTEUR D'ÉDITEUR DE CONTENU — Vue dépliée d'un module (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Sélectionne le formulaire de contenu adapté à la famille du module. Le
 * `switch` discrime directement sur `content.type` (union discriminé) : chaque
 * branche narrow l'objet et le TS garantit la couverture des familles.
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
  /** Scalaire d'animation d'entrée (source unique) — transmis au Héro (7.1). */
  moduleAnimation?: ModuleAnimation;
  /** Applique un patch scalaire au module (ex. animation) — transmis au Héro. */
  onChangeModule?: (patch: Partial<PageModule>) => void;
};

export function ModuleContentEditor({
  content,
  onChangeContent,
  moduleAnimation,
  onChangeModule,
}: ModuleContentEditorProps) {
  switch (content.type) {
    case "hero":
      // Aiguillage par variante : slider (7.2) / vidéo (7.3) / parallaxe (7.4) /
      // rideau (7.5) / statique (7.1, défaut).
      if (content.variant === "slider") {
        return (
          <ModuleHeroSliderEditor
            content={content}
            onChangeContent={onChangeContent}
          />
        );
      }
      if (content.variant === "video") {
        return (
          <ModuleHeroVideoEditor
            content={content}
            onChangeContent={onChangeContent}
          />
        );
      }
      if (content.variant === "parallax") {
        return (
          <ModuleHeroParallaxEditor
            content={content}
            onChangeContent={onChangeContent}
          />
        );
      }
      if (content.variant === "curtain") {
        return (
          <ModuleHeroCurtainEditor
            content={content}
            onChangeContent={onChangeContent}
          />
        );
      }
      return (
        <ModuleHeroEditor
          content={content}
          onChangeContent={onChangeContent}
          moduleAnimation={moduleAnimation}
          onChangeModule={onChangeModule}
        />
      );
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
    case "contact-map":
      return <ContactMapEditor content={content} onChangeContent={onChangeContent} />;
    case "content":
      return (
        <ModuleContentColumnsEditor
          content={content}
          onChangeContent={onChangeContent}
        />
      );
    case "cards":
      // Étape 13.1 — famille sans variante : le routeur n'a rien à discriminer.
      return (
        <ModuleCardsEditor content={content} onChangeContent={onChangeContent} />
      );
  }
}
