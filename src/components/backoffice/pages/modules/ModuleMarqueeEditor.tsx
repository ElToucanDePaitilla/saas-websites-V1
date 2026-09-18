"use client";

import * as React from "react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import {
  bannerThemeTokenLabels,
  bannerThemeTokenOrder,
  galleryShadowLabels,
  galleryShadowOrder,
  marqueeRatioLabels,
  marqueeRatioOrder,
  resolveMarqueeContent,
  type BannerThemeToken,
  type GalleryShadowLevel,
  type MarqueeContent,
  type MarqueeRatio,
  type MarqueeStyleSettings,
  type ModuleContent,
} from "@/lib/pages";

import { EditorSubZone, EditorZone } from "./EditorZone";
import { parseBounded, SelectField, TextField } from "./form-fields";
import { SwitchField } from "./gallery/fields";
import { GalleryImagesPanel } from "./gallery/GalleryImagesPanel";
import { LinkTargetSelect } from "./LinkTargetSelect";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Bandeau défilant » (Étape 14.3)
 * ----------------------------------------------------------------------------
 * Cinq `EditorZone` :
 *   1. 🖼️ Photos — import, ordre, œil et alt (panneau de galerie réutilisé) ;
 *   2. 🎞️ Défilement — durée d'un cycle, pause au survol ;
 *   3. 📐 Dimensions — hauteur de bande et de vignette, format, écart ;
 *   4. 🎨 Apparence — fond de section (thème ou pipette) et ombre ;
 *   5. 🔗 Lien — ruban cliquable, destination unique, libellé d'accessibilité.
 *
 * Partis pris, alignés sur les décisions du module :
 *   - **aucun slider** (D10) : le projet n'a pas cette primitive, et les
 *     éditeurs Cards / Galerie / Contact saisissent déjà leurs nombres au
 *     champ. Un `RangeField` n'aurait servi qu'ici et aurait créé un idiome de
 *     saisie de plus ;
 *   - **fond et ombre réutilisés** (D5/D6) : `BannerColorSettings` et
 *     `GalleryShadowLevel`, jamais des réglages dédiés — ni seconde pipette, ni
 *     curseurs Flou/Décalage/Opacité ;
 *   - **destination par sélecteur de cible** (D7) : le mode (page, ancre,
 *     externe, protocole) est dérivé de l'`href`, rien de supplémentaire n'est
 *     stocké, et il n'existe donc pas de booléen « nouvel onglet » à
 *     désynchroniser.
 * ============================================================================
 */

type ModuleMarqueeEditorProps = {
  content: Extract<ModuleContent, { type: "marquee" }>;
  onChangeContent: (content: MarqueeContent) => void;
};

export function ModuleMarqueeEditor({
  content,
  onChangeContent,
}: ModuleMarqueeEditorProps) {
  // Contenu **complet** avant édition : un JSONB tronqué ne doit pas faire
  // apparaître d'`undefined` dans les champs.
  const marquee = React.useMemo<MarqueeContent>(
    () => resolveMarqueeContent(content),
    [content]
  );

  type MarqueePatch = Partial<Omit<MarqueeContent, "type">>;

  function patch(next: MarqueePatch) {
    onChangeContent({
      ...marquee,
      // `??` et non `||` : un champ vidé (textes, lien) doit rester vide.
      height: next.height ?? marquee.height,
      tileHeight: next.tileHeight ?? marquee.tileHeight,
      ratio: next.ratio ?? marquee.ratio,
      gap: next.gap ?? marquee.gap,
      durationSeconds: next.durationSeconds ?? marquee.durationSeconds,
      pauseOnHover: next.pauseOnHover ?? marquee.pauseOnHover,
      images: next.images ?? marquee.images,
      linkEnabled: next.linkEnabled ?? marquee.linkEnabled,
      linkHref: next.linkHref ?? marquee.linkHref,
      linkLabel: next.linkLabel ?? marquee.linkLabel,
      style: next.style ?? marquee.style,
    });
  }

  function patchStyle(next: Partial<MarqueeStyleSettings>) {
    patch({ style: { ...marquee.style, ...next } });
  }

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — les photos du ruban ---- */}
      <EditorZone
        tone="content"
        title="Photos"
        scope="Les visuels qui défilent, dans l’ordre affiché. Une photo masquée à l’œil n’apparaît pas sur le site."
      >
        <GalleryImagesPanel
          images={marquee.images}
          onChange={(images) => patch({ images })}
          title="Photos du ruban"
          emptyHint="Aucune photo. Importez vos visuels ou cliquez sur « Ajouter »."
        />
      </EditorZone>

      {/* ---- Zone 2 — le défilement ---- */}
      <EditorZone
        tone="content"
        title="Défilement"
        scope="La vitesse de la boucle et son comportement au survol."
      >
        <TextField
          label="Durée d’un cycle (secondes)"
          type="number"
          value={String(marquee.durationSeconds)}
          onChange={(value) => {
            const parsed = parseBounded(value, 10, 120);
            if (parsed !== null) {
              patch({ durationSeconds: parsed });
            }
          }}
          hint="10 à 120 s. Un ruban long semble défiler plus vite."
        />
        <SwitchField
          label="Mettre en pause au survol"
          description="Le ruban s’arrête quand le curseur le survole, et repart ensuite."
          checked={marquee.pauseOnHover}
          onChange={(pauseOnHover) => patch({ pauseOnHover })}
        />
      </EditorZone>

      {/* ---- Zone 3 — dimensions ---- */}
      <EditorZone
        tone="style"
        title="Dimensions"
        scope="La hauteur de la bande, le format et la taille des vignettes, et l’espace qui les sépare."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Hauteur de la bande (px)"
            type="number"
            value={String(marquee.height)}
            onChange={(value) => {
              const parsed = parseBounded(value, 100, 500);
              if (parsed !== null) {
                patch({ height: parsed });
              }
            }}
            hint="De 100 à 500 px."
          />
          <TextField
            label="Hauteur des vignettes (px)"
            type="number"
            value={String(marquee.tileHeight)}
            onChange={(value) => {
              const parsed = parseBounded(value, 80, 450);
              if (parsed !== null) {
                patch({ tileHeight: parsed });
              }
            }}
            hint="De 80 à 450 px. Au-delà de la hauteur de la bande, la vignette est rognée en haut et en bas."
          />
        </div>
        <SelectField<MarqueeRatio>
          label="Format des vignettes"
          value={marquee.ratio}
          options={marqueeRatioOrder.map((value) => ({
            value,
            label: marqueeRatioLabels[value],
          }))}
          onChange={(ratio) => patch({ ratio })}
        />
        <TextField
          label="Écart entre les vignettes (px)"
          type="number"
          value={String(marquee.gap)}
          onChange={(value) => {
            const parsed = parseBounded(value, 0, 32);
            if (parsed !== null) {
              patch({ gap: parsed });
            }
          }}
          hint="De 0 à 32 px."
        />
      </EditorZone>

      {/* ---- Zone 4 — apparence ---- */}
      <EditorZone
        tone="style"
        title="Apparence"
        scope="Le fond de la bande et l’ombre portée des vignettes."
      >
        <EditorSubZone title="Fond de la section">
          <SelectField
            label="Origine de la couleur"
            value={marquee.style.background.source}
            options={[
              { value: "theme", label: "Couleur du thème (recommandé)" },
              { value: "custom", label: "Couleur libre (palette ou pipette)" },
            ]}
            onChange={(source) =>
              patchStyle({
                background: {
                  ...marquee.style.background,
                  source: source as "theme" | "custom",
                },
              })
            }
            tip="Une couleur du thème suit automatiquement le thème du site ; une couleur libre reste figée."
          />
          {marquee.style.background.source === "theme" ? (
            <SelectField<BannerThemeToken>
              label="Couleur du thème"
              value={marquee.style.background.token}
              options={bannerThemeTokenOrder.map((value) => ({
                value,
                label: bannerThemeTokenLabels[value],
              }))}
              onChange={(token) =>
                patchStyle({
                  background: { ...marquee.style.background, token },
                })
              }
            />
          ) : (
            <ColorField
              label="Couleur de fond"
              value={marquee.style.background.value}
              fallback={marquee.style.background.value}
              ariaLabel="Couleur de fond du bandeau défilant"
              onChange={(value) =>
                patchStyle({
                  background: { ...marquee.style.background, value },
                })
              }
            />
          )}
        </EditorSubZone>

        <EditorSubZone title="Ombre des vignettes">
          <SwitchField
            label="Ajouter une ombre"
            checked={marquee.style.shadowEnabled}
            onChange={(shadowEnabled) => patchStyle({ shadowEnabled })}
          />
          {/* Un réglage sans objet est un piège : l'intensité ne se choisit
              que si l'ombre est active. La valeur, elle, est conservée. */}
          {marquee.style.shadowEnabled ? (
            <SelectField<GalleryShadowLevel>
              label="Intensité de l’ombre"
              value={marquee.style.shadow}
              options={galleryShadowOrder.map((value) => ({
                value,
                label: galleryShadowLabels[value],
              }))}
              onChange={(shadow) => patchStyle({ shadow })}
            />
          ) : null}
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 5 — le lien ---- */}
      <EditorZone
        tone="action"
        title="Lien"
        scope="La destination ouverte au clic. Toute la bande devient cliquable, le fond de section reste inerte."
      >
        <SwitchField
          label="Rendre le ruban cliquable"
          checked={marquee.linkEnabled}
          onChange={(linkEnabled) => patch({ linkEnabled })}
        />
        {marquee.linkEnabled ? (
          <>
            <LinkTargetSelect
              label="Destination du ruban"
              value={marquee.linkHref}
              onChange={(linkHref) => patch({ linkHref })}
            />
            <TextField
              label="Description du lien (accessibilité)"
              value={marquee.linkLabel}
              placeholder="Ex. Voir la galerie complète"
              hint="Sans elle, le nom accessible du lien vient des textes alternatifs des photos."
              onChange={(linkLabel) => patch({ linkLabel })}
            />
          </>
        ) : null}
      </EditorZone>
    </div>
  );
}
