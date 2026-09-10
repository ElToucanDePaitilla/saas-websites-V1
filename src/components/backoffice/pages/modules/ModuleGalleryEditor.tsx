"use client";

import {
  resolveGalleryContent,
  type GalleryBaseShared,
  type GalleryContent,
  type GalleryLayoutOptions,
  type ModuleContent,
} from "@/lib/pages";

import { TextField } from "./form-fields";
import { AlbumManagerPanel } from "./gallery/AlbumManagerPanel";
import { EffectSettingsPanel } from "./gallery/EffectSettingsPanel";
import { GalleryCtaPanel } from "./gallery/GalleryCtaPanel";
import { GalleryImagesPanel } from "./gallery/GalleryImagesPanel";
import { GalleryLayoutPanel } from "./gallery/GalleryLayoutPanel";
import { LightboxSettingsPanel } from "./gallery/LightboxSettingsPanel";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Rubrique « Galeries & Portfolio » (Phase 11)
 * ----------------------------------------------------------------------------
 * Aiguillage par variante (pattern Héro) :
 *   - static    : photos + mise en page + effets + CTA (aucune Lightbox) ;
 *   - dynamic   : photos + mise en page + effets + Lightbox + CTA ;
 *   - portfolio : albums thématiques + badges + mise en page + effets + Lightbox
 *                 + CTA.
 * Le contenu JSONB est normalisé (`resolveGalleryContent`) : les variantes
 * anciennes (masonry legacy) sont lues sans rupture.
 * ============================================================================
 */

type GalleryContentValue = Extract<ModuleContent, { type: "gallery" }>;

type ModuleGalleryEditorProps = {
  content: GalleryContentValue;
  onChangeContent: (content: GalleryContentValue) => void;
};

export function ModuleGalleryEditor({
  content,
  onChangeContent,
}: ModuleGalleryEditorProps) {
  const resolved = resolveGalleryContent(content);

  /** Commit d'un contenu galerie complet. */
  function commit(next: GalleryContent) {
    onChangeContent({ type: "gallery", ...next });
  }

  /** Patch du socle commun (mise en page, effets, CTA, Lightbox, badge…). */
  function updateShared(patch: Partial<GalleryBaseShared>) {
    commit({ ...resolved, ...patch });
  }

  /** Patch de la mise en page. */
  function updateLayout(patch: Partial<GalleryLayoutOptions>) {
    updateShared({ layout: { ...resolved.layout, ...patch } });
  }

  return (
    <div className="grid gap-4">
      <TextField
        label="Titre de la section"
        value={resolved.heading}
        onChange={(heading) => updateShared({ heading })}
      />
      <TextField
        label="Sous-titre (facultatif)"
        value={resolved.subheading}
        onChange={(subheading) => updateShared({ subheading })}
      />

      {resolved.variant === "portfolio" ? (
        <AlbumManagerPanel
          albums={resolved.albums}
          onChange={(albums) => commit({ ...resolved, albums })}
          badge={resolved.badge}
          onChangeBadge={(patch) =>
            updateShared({ badge: { ...resolved.badge, ...patch } })
          }
        />
      ) : (
        <GalleryImagesPanel
          images={resolved.images}
          onChange={(images) => commit({ ...resolved, images })}
          folderLabel="Importer un dossier"
        />
      )}

      <GalleryLayoutPanel
        layout={resolved.layout}
        variant={resolved.variant}
        onChange={updateLayout}
      />

      <EffectSettingsPanel
        effect={resolved.effect}
        layout={resolved.layout}
        onChangeEffect={(patch) =>
          updateShared({ effect: { ...resolved.effect, ...patch } })
        }
        onChangeLayout={updateLayout}
      />

      {resolved.variant !== "static" ? (
        <LightboxSettingsPanel
          lightbox={resolved.lightbox}
          onChange={(patch) =>
            updateShared({ lightbox: { ...resolved.lightbox, ...patch } })
          }
        />
      ) : null}

      <GalleryCtaPanel
        cta={resolved.cta}
        onChange={(patch) =>
          updateShared({ cta: { ...resolved.cta, ...patch } })
        }
      />
    </div>
  );
}
