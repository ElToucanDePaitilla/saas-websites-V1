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
import { HelpTip, SelectField, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Parallaxe » (Étape 7.4)
 * ----------------------------------------------------------------------------
 * Textes/CTA hérités de `BaseHero`. Rubriques :
 *   1. 🖼️ Image Parallaxe & Fallback (desktop 16:9 HD requis, mobile 9:16
 *      fixe obligatoire, tablette 4:3 optionnelle) ;
 *   2. 📝 Textes & Bouton (hérités) ;
 *   3. ⚙️ Réglages & Intensité (parallax_speed ; mobile désactivé verrouillé).
 * ============================================================================
 */

type ModuleHeroParallaxEditorProps = {
  content: Extract<ModuleContent, { type: "hero" } & { variant: "parallax" }>;
  onChangeContent: (content: ModuleContent) => void;
};

function RubricTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1">
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

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
      {/* ============ Rubrique 1 — 🖼️ Image Parallaxe & Fallback ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="🖼️ Image Parallaxe & Fallback"
          description="L’effet parallaxe crée une impression de profondeur au défilement. Sur téléphone, l’effet est automatiquement désactivé au profit d’une photo fixe optimisée."
        />
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
      </section>

      {/* ============ Rubrique 2 — 📝 Textes & Bouton ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="📝 Textes & Bouton"
          description="Hérité du Héro : contenu affiché au centre, par-dessus l’image."
        />
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
        <div className="rounded-lg border border-border bg-background/60 p-3">
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
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField
                label="Libellé"
                value={hero.ctaLabel}
                onChange={(ctaLabel) => setHero({ ctaLabel })}
              />
              <TextField
                label="Lien"
                value={hero.ctaHref}
                mono
                placeholder="/portfolio"
                onChange={(ctaHref) => setHero({ ctaHref })}
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
          ) : null}
        </div>
      </section>

      {/* ============ Rubrique 3 — ⚙️ Réglages & Intensité ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="⚙️ Réglages & Intensité Parallaxe"
          description="Ajustez la force du mouvement de l’arrière-plan, de « Très léger » à « Extrême »."
        />
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
      </section>

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
