"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import {
  createHeroStaticContent,
  fontWeightLabels,
  fontWeightOrder,
  heroCtaStyleLabels,
  heroCtaStyleOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  moduleAnimationLabels,
  moduleAnimationOrder,
  resolveHeroContent,
  type FontWeightClass,
  type HeroStaticContent,
  type ModuleAnimation,
  type ModuleContent,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { SelectField, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero » (Étape 7.1 — HeroStatic)
 * ----------------------------------------------------------------------------
 * Formulaire contrôlé par le store (réactivité immédiate). Organisé en **3
 * rubriques** pour les utilisateurs non-techniques :
 *   1. 🖼️ Images de fond    — art-direction responsive `<picture>` (desktop
 *      16:9 / tablette 4:3 optionnelle / mobile 9:16) + vignettes + alt SEO ;
 *   2. 📝 Textes & Bouton   — overlay, textes (H1/H2/paragraphe), couleur,
 *      graisses de police et CTA optionnel ;
 *   3. 🎬 Animations & Effets — animation d'entrée (source unique : le scalaire
 *      `module.animation` partagé — cf. plans/ROADMAP-7.1 D-3).
 * Le contenu est normalisé à la lecture (`resolveHeroContent`) puis chaque
 * changement commite un contenu complet en bloc vers le store.
 * ============================================================================
 */

type ModuleHeroEditorProps = {
  content: Extract<ModuleContent, { type: "hero" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "hero" }>) => void;
  /** Scalaire d'animation d'entrée du module (source unique — D-3). */
  moduleAnimation?: ModuleAnimation;
  /** Applique un patch au module (rubrique « Animations & Effets »). */
  onChangeModule?: (patch: Partial<PageModule>) => void;
};

/** Options d'un Select (label + valeur) à partir d'un tableau ordonné. */
function toOptions<T extends string>(
  order: readonly T[],
  labels: Record<T, string>
): Array<{ value: T; label: string }> {
  return order.map((value) => ({ value, label: labels[value] }));
}

const FONT_WEIGHT_OPTIONS = toOptions(fontWeightOrder, fontWeightLabels);
const OVERLAY_OPTIONS = toOptions(heroOverlayOrder, heroOverlayLabels);
const CTA_STYLE_OPTIONS = toOptions(heroCtaStyleOrder, heroCtaStyleLabels);
const TEXT_TONE_OPTIONS = toOptions(heroTextToneOrder, heroTextToneLabels);
const ANIMATION_OPTIONS = toOptions(moduleAnimationOrder, moduleAnimationLabels);

/** Titre d'une rubrique (3 sections de la fiche HeroStatic). */
function RubricTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="grid gap-1">
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      {description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ModuleHeroEditor({
  content,
  onChangeContent,
  moduleAnimation = "default",
  onChangeModule,
}: ModuleHeroEditorProps) {
  // Contenu normalisé (upgrade legacy + fusion des défauts) — base d'édition.
  const hero = React.useMemo<HeroStaticContent>(
    () => resolveHeroContent(content),
    [content]
  );

  /** Commite un contenu Héro complet vers le store. */
  function commit(next: HeroStaticContent) {
    onChangeContent({ type: "hero", ...next });
  }

  /** Applique un patch partiel sur le contenu Héro. */
  function setHero(patch: Partial<HeroStaticContent>) {
    commit({ ...hero, ...patch });
  }

  /** Met à jour une source d'image art-direction (desktop/mobile/tablet). */
  function setMediaSource(
    kind: "desktop" | "mobile" | "tablet",
    source: { url: string; alt: string }
  ) {
    const tablet = hero.media.tablet ?? { url: "", alt: "" };
    const media =
      kind === "tablet"
        ? { ...hero.media, tablet: source }
        : { ...hero.media, [kind]: source };
    void tablet;
    setHero({ media });
  }

  /** Met à jour une graisse de police typée. */
  function setWeight(field: "weightH1" | "weightH2" | "weightText") {
    return (value: FontWeightClass) => setHero({ [field]: value });
  }

  const setText = (field: "titleH1" | "subtitleH2" | "descriptionText") => {
    return (value: string) => setHero({ [field]: value });
  };

  return (
    <div className="grid gap-5">
      {/* ============ Rubrique 1 — 🖼️ Images de fond ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="🖼️ Images de fond"
          description="Trois versions de la même photo pour chaque écran (ordinateur, tablette, mobile). Le site choisit automatiquement la bonne — pas besoin d’y penser."
        />
        <ArtSourceField
          label="Image ordinateur (paysage 16:9)"
          ratio="16:9"
          tip="Photo affichée en grand sur les écrans d’ordinateur (largeur ≥ 1024 px). C’est l’image principale de votre Héro — obligatoire."
          value={hero.media.desktop}
          onChange={(value) => setMediaSource("desktop", value)}
        />
        <ArtSourceField
          label="Image mobile (portrait 9:16)"
          ratio="9:16"
          tip="Photo recadrée en hauteur pour les smartphones. Sur un téléphone, une image en portrait remplit mieux l’écran — obligatoire pour un rendu net."
          value={hero.media.mobile}
          onChange={(value) => setMediaSource("mobile", value)}
        />
        <ArtSourceField
          label="Image tablette (4:3)"
          ratio="4:3"
          tip="Photo intermédiaire pour les tablettes (largeur entre 768 et 1023 px). Champ optionnel."
          value={hero.media.tablet ?? { url: "", alt: "" }}
          onChange={(value) => setMediaSource("tablet", value)}
          note="Optionnel : si vous la laissez vide, l’image « ordinateur » est affichée automatiquement sur tablette."
        />
      </section>

      {/* ============ Rubrique 2 — 📝 Textes & Bouton ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="📝 Textes & Bouton"
          description="Le contenu affiché au centre du Héro : titre, sous-titre, description et bouton d’action."
        />

        <SelectField
          label="Assombrissement de la photo"
          value={hero.overlayLevel}
          options={OVERLAY_OPTIONS}
          onChange={(overlayLevel) => setHero({ overlayLevel })}
          tip="Ajoute un voile sombre sur la photo pour garantir le contraste et la lisibilité des textes, quelle que soit l’image choisie."
        />

        <div className="grid gap-3 sm:grid-cols-1">
          <TextField
            label="Titre principal (H1)"
            value={hero.titleH1}
            tip="Le titre principal de la page (balise H1, important pour le référencement). Sa taille géante s’adapte automatiquement — sans casser les mots sur téléphone."
            onChange={setText("titleH1")}
          />
          <TextField
            label="Sous-titre (H2)"
            value={hero.subtitleH2}
            tip="Une courte phrase d’accroche sous le titre (balise H2)."
            onChange={setText("subtitleH2")}
          />
          <TextAreaField
            label="Description (paragraphe)"
            value={hero.descriptionText}
            rows={3}
            tip="Un paragraphe qui présente votre activité ou votre proposition."
            onChange={setText("descriptionText")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Couleur du texte"
            value={hero.textTone}
            options={TEXT_TONE_OPTIONS}
            onChange={(textTone) => setHero({ textTone })}
            tip="« Clair » (blanc) est recommandé sur une photo. Choisissez « Sombre » uniquement si votre image est très claire."
          />
          <SelectField
            label="Graisse du titre (H1)"
            value={hero.weightH1}
            options={FONT_WEIGHT_OPTIONS}
            onChange={setWeight("weightH1")}
            tip="Épaisseur du trait du titre principal : Normal, Moyen, Demi-gras ou Gras."
          />
          <SelectField
            label="Graisse du sous-titre (H2)"
            value={hero.weightH2}
            options={FONT_WEIGHT_OPTIONS}
            onChange={setWeight("weightH2")}
            tip="Épaisseur du trait du sous-titre."
          />
          <SelectField
            label="Graisse de la description"
            value={hero.weightText}
            options={FONT_WEIGHT_OPTIONS}
            onChange={setWeight("weightText")}
            tip="Épaisseur du trait du paragraphe de description."
          />
        </div>

        {/* Bouton CTA optionnel */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="hero-cta-show"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Afficher un bouton d’action (CTA)
            </label>
            <Switch
              id="hero-cta-show"
              checked={hero.ctaShow}
              onCheckedChange={(ctaShow) => setHero({ ctaShow })}
              aria-label="Afficher un bouton d’action"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {hero.ctaShow
              ? "Le bouton est visible : renseignez son libellé et son lien."
              : "Bouton masqué. Activez l’interrupteur pour le configurer."}
          </p>

          {hero.ctaShow ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField
                label="Libellé du bouton"
                value={hero.ctaLabel}
                placeholder="Ex. Découvrir mon portfolio"
                onChange={(ctaLabel) => setHero({ ctaLabel })}
              />
              <TextField
                label="Lien du bouton"
                value={hero.ctaHref}
                mono
                placeholder="/portfolio"
                tip="Page du site (/slug) ou adresse externe (https://…)."
                onChange={(ctaHref) => setHero({ ctaHref })}
              />
              <SelectField
                label="Style du bouton"
                value={hero.ctaStyle}
                options={CTA_STYLE_OPTIONS}
                onChange={(ctaStyle) => setHero({ ctaStyle })}
                tip="Principal : bouton coloré bien visible. Secondaire : plus discret. Contour : transparence avec une bordure."
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ============ Rubrique 3 — 🎬 Animations & Effets ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="🎬 Animations & Effets"
          description="L’animation d’apparition du bloc lorsque le visiteur arrive sur la page. Effet fluide (transparence et déplacement) et désactivé automatiquement si l’on préfère réduire les mouvements."
        />
        <SelectField
          label="Animation d’entrée"
          value={moduleAnimation}
          options={ANIMATION_OPTIONS}
          onChange={(animation) => onChangeModule?.({ animation })}
          hint="Réglée ici pour ce Héro (elle reste un réglage commun à tout module)."
          className="max-w-xs"
        />
        {!onChangeModule ? (
          <p className="text-xs text-muted-foreground">
            Réglage d’animation disponible dans « Réglages » du module.
          </p>
        ) : null}
      </section>

      {/* Bouton discret de réinitialisation aux valeurs de démonstration. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createHeroStaticContent())}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground"
          )}
        >
          Réinitialiser aux valeurs de démonstration
        </button>
      </div>
    </div>
  );
}
