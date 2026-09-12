"use client";

import {
  galleryEffectIntensityLabels,
  galleryEffectIntensityOrder,
  galleryEffectLabels,
  galleryEffectOrder,
  galleryItemWording,
  galleryShadowLabels,
  galleryShadowOrder,
  type GalleryEffectId,
  type GalleryEffectIntensity,
  type GalleryEffectSettings,
  type GalleryLayoutOptions,
  type GalleryModuleVariant,
  type GalleryShadowLevel,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";
import { ColorField, SwitchField } from "./fields";

/**
 * ============================================================================
 * PANNEAU « FORMAT DES COUVERTURES » — Galerie (Phase 11, réorganisé 11.20.c)
 * ----------------------------------------------------------------------------
 * Les quatre réglages d'**aspect d'une vignette**, dans l'ordre où ils se
 * décident — du plus général au plus ponctuel :
 *
 *   1. **Effet de finition** — Aucun / Passe-partout de Musée / Sous-Verre /
 *      Polaroid, son intensité et ses paramètres contextuels ;
 *   2. **Arrondi** — courbure des coins ;
 *   3. **Encadrement** — interrupteur, épaisseur, couleur ;
 *   4. **Ombre portée** — niveau.
 *
 * Pourquoi cet ordre (constat de recette) : l'arrondi vivait auparavant dans
 * « Disposition de la grille », **loin de l'encadrement** qu'il complète, ce qui
 * rendait leur combinaison impossible à évaluer — et laissait croire à une
 * incompatibilité entre les deux. Les voici côte à côte, dans l'ordre.
 *
 * Aucun de ces réglages n'est exclusif : ombre, encadrement et arrondi restent
 * **indépendants et cumulables** (le rendu des rayons concentriques est corrigé
 * dans `gallery-effects.ts` / `GalleryItem`).
 *
 * Le **vocabulaire suit la variante** : « couvertures d'albums » en portfolio,
 * « photos » sur static / dynamic — la zone d'édition est partagée par les trois.
 * ============================================================================
 */

type EffectSettingsPanelProps = {
  effect: GalleryEffectSettings;
  layout: GalleryLayoutOptions;
  /** Variante de la galerie : détermine le vocabulaire des libellés. */
  variant: GalleryModuleVariant;
  onChangeEffect: (patch: Partial<GalleryEffectSettings>) => void;
  onChangeLayout: (patch: Partial<GalleryLayoutOptions>) => void;
};

export function EffectSettingsPanel({
  effect,
  layout,
  variant,
  onChangeEffect,
  onChangeLayout,
}: EffectSettingsPanelProps) {
  const isNone = effect.effect === "none";
  const { plural } = galleryItemWording(variant);

  return (
    // Étape 11.17 : plus de boîte ni de titre propres — ils sont fournis par
    // la sous-zone parente. Ce panneau ne rend que les champs.
    <div className="grid gap-3">
      {/* ---- 1. Effet de finition ------------------------------------------ */}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField<GalleryEffectId>
          label="Effet de finition"
          value={effect.effect}
          options={galleryEffectOrder.map((value) => ({
            value,
            label: galleryEffectLabels[value],
          }))}
          onChange={(next) => onChangeEffect({ effect: next })}
          hint="Un seul effet de finition peut être actif à la fois."
        />
        <SelectField<GalleryEffectIntensity>
          label="Intensité de l’effet"
          value={effect.intensity}
          options={galleryEffectIntensityOrder.map((value) => ({
            value,
            label: galleryEffectIntensityLabels[value],
          }))}
          onChange={(intensity) => onChangeEffect({ intensity })}
          disabled={isNone}
          hint={isNone ? "Sélectionnez d’abord un effet." : undefined}
        />
      </div>

      {/* Paramétrage contextuel du menu ouvert. */}
      {effect.effect === "museum-pass" ? (
        <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3 sm:grid-cols-2">
          <ColorField
            label="Couleur du passe-partout"
            value={effect.matColor}
            onChange={(matColor) => onChangeEffect({ matColor })}
          />
          <div className="flex items-end">
            <SwitchField
              className="w-full"
              label="Biseau intérieur"
              description="Fine ligne ombrée au contact de la photo."
              checked={effect.matBevel}
              onChange={(matBevel) => onChangeEffect({ matBevel })}
            />
          </div>
        </div>
      ) : null}

      {effect.effect === "glass" ? (
        <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3 sm:grid-cols-2">
          <TextField
            label="Flou du verre"
            type="number"
            value={String(effect.glassBlur)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                onChangeEffect({
                  glassBlur: Math.min(Math.max(parsed, 0), 40),
                });
              }
            }}
            hint="Intensité de la réfraction (px)."
          />
          <ColorField
            label="Teinte du voile"
            value={effect.glassTint}
            onChange={(glassTint) => onChangeEffect({ glassTint })}
          />
        </div>
      ) : null}

      {effect.effect === "polaroid" ? (
        <div className="grid gap-2 rounded-md border border-dashed border-border bg-background/40 p-3">
          <SwitchField
            label="Légende sur la bande blanche"
            description="Affiche la légende de la photo sous le cadre Polaroid."
            checked={effect.polaroidCaptionShow}
            onChange={(polaroidCaptionShow) =>
              onChangeEffect({ polaroidCaptionShow })
            }
          />
          <SwitchField
            label="Rotation légère"
            description="Inclinaison argentique aléatoire du tirage."
            checked={effect.polaroidRotation}
            onChange={(polaroidRotation) =>
              onChangeEffect({ polaroidRotation })
            }
          />
        </div>
      ) : null}

      {/* ---- 2. Arrondi (déplacé ici depuis « Disposition de la grille ») -- */}
      <TextField
        label={`Arrondi des ${plural}`}
        type="number"
        value={String(layout.radius)}
        onChange={(value) => {
          const parsed = Number.parseInt(value, 10);
          if (!Number.isNaN(parsed)) {
            onChangeLayout({ radius: Math.min(Math.max(parsed, 0), 200) });
          }
        }}
        hint="Courbure des coins (px). Se combine avec l’encadrement et l’ombre."
      />

      {/* ---- 3. Encadrement ------------------------------------------------ */}
      <SwitchField
        label={`Encadrement des ${plural}`}
        description="Trace une bordure autour de chaque vignette."
        checked={layout.border.enabled}
        onChange={(enabled) =>
          onChangeLayout({ border: { ...layout.border, enabled } })
        }
      />

      {layout.border.enabled ? (
        <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3 sm:grid-cols-2">
          <TextField
            label="Épaisseur"
            type="number"
            value={String(layout.border.width)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                onChangeLayout({
                  border: {
                    ...layout.border,
                    width: Math.min(Math.max(parsed, 0), 24),
                  },
                });
              }
            }}
            hint="Épaisseur de la bordure (px)."
          />
          <ColorField
            label="Couleur de la bordure"
            value={layout.border.color}
            onChange={(color) =>
              onChangeLayout({ border: { ...layout.border, color } })
            }
          />
        </div>
      ) : null}

      {/* ---- 4. Ombre portée ----------------------------------------------- */}
      <SelectField<GalleryShadowLevel>
        label={`Ombre portée sous les ${plural}`}
        value={layout.shadow}
        options={galleryShadowOrder.map((value) => ({
          value,
          label: galleryShadowLabels[value],
        }))}
        onChange={(shadow) => onChangeLayout({ shadow })}
        hint="Activée par défaut (niveau normal)."
      />
    </div>
  );
}
