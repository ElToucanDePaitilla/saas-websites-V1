"use client";

import {
  galleryEffectIntensityLabels,
  galleryEffectIntensityOrder,
  galleryEffectLabels,
  galleryEffectOrder,
  galleryShadowLabels,
  galleryShadowOrder,
  type GalleryEffectId,
  type GalleryEffectIntensity,
  type GalleryEffectSettings,
  type GalleryLayoutOptions,
  type GalleryShadowLevel,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";
import { ColorField, SwitchField } from "./fields";

/**
 * ============================================================================
 * PANNEAU EFFETS DE FINITION GALERIE (Phase 11)
 * ----------------------------------------------------------------------------
 * Effet **exclusif** (Aucun / Passe-partout de Musée / Sous-Verre / Polaroid
 * papier glacé) décliné en light/normal/strong, avec **paramétrage contextuel**
 * du menu ouvert. L'ombre et la bordure (épaisseur + couleur) restent des
 * réglages indépendants et cumulables.
 * ============================================================================
 */

type EffectSettingsPanelProps = {
  effect: GalleryEffectSettings;
  layout: GalleryLayoutOptions;
  onChangeEffect: (patch: Partial<GalleryEffectSettings>) => void;
  onChangeLayout: (patch: Partial<GalleryLayoutOptions>) => void;
};

export function EffectSettingsPanel({
  effect,
  layout,
  onChangeEffect,
  onChangeLayout,
}: EffectSettingsPanelProps) {
  const isNone = effect.effect === "none";

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Finitions & effets
      </p>

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
          label="Intensité"
          value={effect.intensity}
          options={galleryEffectIntensityOrder.map((value) => ({
            value,
            label: galleryEffectIntensityLabels[value],
          }))}
          onChange={(intensity) => onChangeEffect({ intensity })}
          disabled={isNone}
          hint={isNone ? "Sélectionnez d'abord un effet." : undefined}
        />
      </div>

      {/* Menu de paramétrage contextuel selon l'effet sélectionné. */}
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

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField<GalleryShadowLevel>
          label="Ombre portée"
          value={layout.shadow}
          options={galleryShadowOrder.map((value) => ({
            value,
            label: galleryShadowLabels[value],
          }))}
          onChange={(shadow) => onChangeLayout({ shadow })}
          hint="Activée par défaut (niveau normal)."
        />
      </div>

      <SwitchField
        label="Bordure"
        description="Encadre chaque vignette."
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
    </div>
  );
}
