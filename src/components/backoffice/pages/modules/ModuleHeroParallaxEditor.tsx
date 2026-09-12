"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import {
  createHeroParallaxContent,
  fontWeightLabels,
  fontWeightOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  parallaxSpeedLabels,
  parallaxSpeedOrder,
  resolveHeroParallaxContent,
  type ArtSource,
  type HeroParallaxContent,
  type ModuleContent,
  type ParallaxSpeed,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { EditorZone } from "./EditorZone";
import { HelpTip, SelectField, TextAreaField, TextField } from "./form-fields";
import { LinkTargetSelect } from "./LinkTargetSelect";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Parallaxe » (Étape 7.4, revu en 11.17)
 * ----------------------------------------------------------------------------
 * Textes/CTA hérités de `BaseHero`.
 *
 * Étape 11.17 — quatre `EditorZone` nomment chacune leur cible et leur portée
 * (plans/ROADMAP-11.17-editor-zones-ux.md §5) :
 *   1. 🖼️ **Image et effet parallaxe** — desktop 16:9 HD, mobile 9:16 fixe
 *      obligatoire, tablette 4:3 optionnelle ;
 *   2. 📝 **Textes affichés sur l'image** — overlay, textes, tone, graisses ;
 *   3. 🔗 **Bouton d'appel à l'action**  — libellé, style et destination ;
 *   4. ⚙️ **Force de l'effet parallaxe** — `parallaxSpeed` (mobile verrouillé).
 * ============================================================================
 */

type ModuleHeroParallaxEditorProps = {
  content: Extract<ModuleContent, { type: "hero" } & { variant: "parallax" }>;
  onChangeContent: (content: ModuleContent) => void;
};

export function ModuleHeroParallaxEditor({
  content,
  onChangeContent,
}: ModuleHeroParallaxEditorProps) {
  const hero = React.useMemo<HeroParallaxContent>(
    () => resolveHeroParallaxContent(content),
    [content]
  );

  function commit(next: HeroParallaxContent) {
    onChangeContent({ type: "hero", ...next });
  }

  function setHero(patch: Partial<HeroParallaxContent>) {
    commit({ ...hero, ...patch });
  }

  function setMedia(key: "desktop" | "mobile" | "tablet", value: ArtSource) {
    const current = hero.media;
    setHero({
      media: {
        ...current,
        [key]: key === "tablet" ? value : value,
      },
    });
  }

  const setText = (field: "titleH1" | "subtitleH2" | "descriptionText") => {
    return (value: string) => setHero({ [field]: value });
  };

  return (
    <div className="grid gap-5">
      {/* ---- Zone 1 — l'image et l'effet parallaxe ---- */}
      <EditorZone
        tone="style"
        title="Image et effet parallaxe"
        scope="L’effet parallaxe crée une impression de profondeur au défilement. Sur téléphone, l’effet est automatiquement remplacé par une photo fixe optimisée."
      >
        <ArtSourceField
          label="Image ordinateur — effet parallaxe (16:9)"
          ratio="16:9"
          tip="Privilégiez une image haute définition pour un effet de profondeur fluide sur grand écran."
          value={hero.media.desktop}
          onChange={(value) => setMedia("desktop", value)}
        />
        <ArtSourceField
          label="Photo smartphone — fixe (obligatoire)"
          ratio="9:16"
          tip="Affichée sans effet parallaxe sur mobile pour éviter de ralentir le téléphone et économiser la batterie."
          value={hero.media.mobile}
          onChange={(value) => setMedia("mobile", value)}
        />
        <ArtSourceField
          label="Photo tablette (optionnelle)"
          ratio="4:3"
          tip="Image intermédiaire pour les tablettes (entre 768 et 1023 px)."
          value={hero.media.tablet ?? { url: "", alt: "" }}
          onChange={(value) => setMedia("tablet", value)}
        />
      </EditorZone>

      {/* ---- Zone 2 — les textes affichés sur l'image ---- */}
      <EditorZone
        tone="content"
        title="Textes affichés sur l’image"
        scope="Le titre, le sous-titre et le paragraphe présentés au centre de la section, par-dessus l’image."
      >
        <SelectField
          label="Assombrissement de l’image"
          value={hero.overlayLevel}
          options={heroOverlayOrder.map((value) => ({
            value,
            label: heroOverlayLabels[value],
          }))}
          onChange={(overlayLevel) => setHero({ overlayLevel })}
          tip="Voile sombre pour garantir la lisibilité des textes."
        />
        <TextField
          label="Titre principal (H1)"
          value={hero.titleH1}
          onChange={setText("titleH1")}
        />
        <TextField
          label="Sous-titre (H2)"
          value={hero.subtitleH2}
          onChange={setText("subtitleH2")}
        />
        <TextAreaField
          label="Description"
          value={hero.descriptionText}
          rows={3}
          onChange={setText("descriptionText")}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Couleur du texte"
            value={hero.textTone}
            options={heroTextToneOrder.map((value) => ({
              value,
              label: heroTextToneLabels[value],
            }))}
            onChange={(textTone) => setHero({ textTone })}
          />
          {(
            [
              ["weightH1", "Graisse du titre (H1)"],
              ["weightH2", "Graisse du sous-titre (H2)"],
              ["weightText", "Graisse de la description"],
            ] as const
          ).map(([field, label]) => (
            <SelectField
              key={field}
              label={label}
              value={hero[field]}
              options={fontWeightOrder.map((value) => ({
                value,
                label: fontWeightLabels[value],
              }))}
              onChange={(value) => setHero({ [field]: value })}
            />
          ))}
        </div>
      </EditorZone>

      {/* ---- Zone 3 — le bouton d'appel à l'action ---- */}
      <EditorZone
        tone="action"
        title="Bouton d’appel à l’action"
        scope="Le bouton affiché sous vos textes : son libellé, son style et la destination du visiteur qui clique."
      >
        <div className="rounded-md border border-dashed border-border bg-background/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="hero-parallax-cta-show"
              className="text-xs font-semibold text-foreground"
            >
              Afficher un bouton d’action (CTA)
            </label>
            <Switch
              id="hero-parallax-cta-show"
              checked={hero.ctaShow}
              onCheckedChange={(ctaShow) => setHero({ ctaShow })}
            />
          </div>
          {hero.ctaShow ? (
            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Libellé"
                  value={hero.ctaLabel}
                  onChange={(ctaLabel) => setHero({ ctaLabel })}
                />
                <SelectField
                  label="Style"
                  value={hero.ctaStyle}
                  options={[
                    { value: "primary", label: "Principal" },
                    { value: "secondary", label: "Secondaire" },
                    { value: "outline", label: "Contours" },
                  ]}
                  onChange={(ctaStyle) => setHero({ ctaStyle })}
                />
              </div>
              <LinkTargetSelect
                value={hero.ctaHref}
                onChange={(ctaHref) => setHero({ ctaHref })}
              />
            </div>
          ) : null}
        </div>
      </EditorZone>

      {/* ---- Zone 4 — la force de l'effet ---- */}
      <EditorZone
        tone="detail"
        title="Force de l’effet parallaxe"
        scope="L’ampleur du mouvement de l’arrière-plan au défilement, de « Très léger » à « Extrême »."
      >
        <SelectField
          label="Intensité de l’effet parallaxe"
          tip="7 niveaux de force : plus l’intensité est élevée, plus l’image « voyage » (se décale) au défilement. « Modéré » est le réglage classique."
          value={hero.parallaxSpeed}
          options={parallaxSpeedOrder.map((value) => ({
            value,
            label: parallaxSpeedLabels[value],
          }))}
          onChange={(parallaxSpeed) =>
            setHero({ parallaxSpeed: parallaxSpeed as ParallaxSpeed })
          }
        />
        <p className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <HelpTip tip="Sur téléphone (< 1024 px), l’effet parallaxe est toujours désactivé : une photo fixe est affichée pour préserver la performance (60 FPS) et la batterie." />
          Mobile : effet parallaxe désactivé (verrouillé) — photo fixe affichée.
        </p>
      </EditorZone>

      {/* Bouton discret de réinitialisation. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createHeroParallaxContent())}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground"
          )}
        >
          Réinitialiser à la démonstration
        </button>
      </div>
    </div>
  );
}
