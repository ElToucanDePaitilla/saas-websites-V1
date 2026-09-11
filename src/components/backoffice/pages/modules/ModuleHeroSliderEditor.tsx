"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  createHeroSliderContent,
  createHeroSliderSlide,
  fontWeightLabels,
  fontWeightOrder,
  heroAutoplaySpeedLabels,
  heroAutoplaySpeedOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroSliderTransitionLabels,
  heroSliderTransitionOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  resolveHeroSliderContent,
  type ArtSource,
  type FontWeightClass,
  type HeroAutoplaySpeed,
  type HeroOverlayLevel,
  type HeroSliderContent,
  type HeroSliderSlide,
  type HeroSliderTransition,
  type HeroTextTone,
  type ModuleContent,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { EditorZone } from "./EditorZone";
import { HelpTip, SelectField, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Slider » (Étape 7.2, revu en 11.17)
 * ----------------------------------------------------------------------------
 * Formulaire contrôlé par le store.
 *
 * Étape 11.17 — trois `EditorZone` nomment chacune leur cible et leur portée
 * (plans/ROADMAP-11.17-editor-zones-ux.md §5) :
 *   1. 🖼️ **Les slides du carrousel**       — liste des slides (ajout,
 *      suppression, réordonnancement ↑/↓) ; par slide : images desktop / mobile
 *      / tablette + textes alternatifs (SEO) ;
 *   2. 📝 **Textes et boutons des slides**  — par slide : overlay, H1/H2,
 *      paragraphe, ton et bouton ; graisses globales au module ;
 *   3. ⚙️ **Défilement du carrousel**       — lecture automatique, vitesse,
 *      transition, flèches et points de navigation.
 *
 * Le contenu est normalisé (`resolveHeroSliderContent`) puis chaque changement
 * commite un contenu complet vers le store.
 * ============================================================================
 */

type ModuleHeroSliderEditorProps = {
  content: Extract<
    ModuleContent,
    { type: "hero" } & { variant: "slider" }
  >;
  onChangeContent: (content: ModuleContent) => void;
};

const ALT_TOOLTIP =
  "Description de l'image pour le référencement (SEO Google) et les lecteurs d'écran.";

/** Boutons segmentés (overlay / transition) — accessibles (aria-pressed). */
function SegmentedButtons<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-background/60 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            option.value === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function overlayOptions() {
  return heroOverlayOrder.map((value) => ({
    value,
    label: heroOverlayLabels[value],
  }));
}

export function ModuleHeroSliderEditor({
  content,
  onChangeContent,
}: ModuleHeroSliderEditorProps) {
  // Contenu normalisé (défauts 3 slides) — base d'édition.
  const hero = React.useMemo<HeroSliderContent>(
    () => resolveHeroSliderContent(content),
    [content]
  );
  const [openSlide, setOpenSlide] = React.useState(0);

  /** Commite un contenu complet vers le store. */
  function commit(next: HeroSliderContent) {
    onChangeContent({ type: "hero", ...next });
  }

  function setSlide(id: string, patch: Partial<HeroSliderSlide>) {
    commit({
      ...hero,
      slides: hero.slides.map((slide) =>
        slide.id === id ? { ...slide, ...patch } : slide
      ),
    });
  }

  function setSlideMedia(id: string, kind: "desktop" | "mobile" | "tablet", value: ArtSource) {
    setSlide(id, {
      media: { ...(hero.slides.find((s) => s.id === id)?.media ?? { desktop: value, mobile: value, tablet: null }), [kind]: value },
    });
  }

  function addSlide() {
    const next = createHeroSliderSlide();
    commit({ ...hero, slides: [...hero.slides, next] });
    setOpenSlide(hero.slides.length);
  }

  function removeSlide(id: string) {
    if (hero.slides.length <= 1) {
      return; // garde-fou : au moins une slide
    }
    const next = hero.slides.filter((slide) => slide.id !== id);
    commit({ ...hero, slides: next });
    setOpenSlide((current) => Math.max(0, Math.min(current, next.length - 1)));
  }

  function moveSlide(id: string, direction: -1 | 1) {
    const currentIndex = hero.slides.findIndex((slide) => slide.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= hero.slides.length) {
      return;
    }
    const next = Array.from(hero.slides);
    const [moved] = next.splice(currentIndex, 1);
    if (moved) {
      next.splice(targetIndex, 0, moved);
    }
    commit({ ...hero, slides: next });
  }

  function setSettings(patch: Partial<HeroSliderContent["settings"]>) {
    commit({ ...hero, settings: { ...hero.settings, ...patch } });
  }

  return (
    <div className="grid gap-5">
      {/* ---- Zone 1 — les slides et leurs photos ---- */}
      <EditorZone
        tone="style"
        title="Les slides du carrousel"
        scope="Les visuels qui défilent, dans leur ordre d’apparition (↑/↓ pour réordonner). Chaque slide possède trois versions de la même photo, une par type d’écran."
      >

        <div className="flex items-center gap-2">
          <HelpTip tip="Le slider permet de faire défiler plusieurs visuels. Par défaut, 3 slides d’exemple sont pré-chargées. Vous pouvez en ajouter ou en supprimer à tout moment." />
          <button
            type="button"
            onClick={addSlide}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <Plus className="size-3.5" />
            Ajouter une slide
          </button>
        </div>

        <div className="grid gap-3">
          {hero.slides.map((slide, slideIndex) => {
            const isOpen = openSlide === slideIndex;
            return (
              <div
                key={slide.id}
                className="overflow-hidden rounded-lg border border-border bg-background/60"
              >
                {/* Bandeau slide : numéro, actions, dépliage */}
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenSlide(isOpen ? -1 : slideIndex)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="truncate text-xs font-semibold text-foreground">
                      Slide {slideIndex + 1}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {slide.titleH1 || "Sans titre"}
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Monter la slide ${slideIndex + 1}`}
                      disabled={slideIndex === 0}
                      onClick={() => moveSlide(slide.id, -1)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Descendre la slide ${slideIndex + 1}`}
                      disabled={slideIndex === hero.slides.length - 1}
                      onClick={() => moveSlide(slide.id, 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Supprimer la slide ${slideIndex + 1}`}
                      disabled={hero.slides.length <= 1}
                      onClick={() => removeSlide(slide.id)}
                      className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="grid gap-3 p-3">
                    <ArtSourceField
                      label={`Slide ${slideIndex + 1} — ordinateur (16:9)`}
                      ratio="16:9"
                      tip={ALT_TOOLTIP}
                      value={slide.media.desktop}
                      onChange={(value) => setSlideMedia(slide.id, "desktop", value)}
                    />
                    <ArtSourceField
                      label={`Slide ${slideIndex + 1} — mobile (9:16)`}
                      ratio="9:16"
                      tip={ALT_TOOLTIP}
                      value={slide.media.mobile}
                      onChange={(value) => setSlideMedia(slide.id, "mobile", value)}
                    />
                    <ArtSourceField
                      label={`Slide ${slideIndex + 1} — tablette (4:3)`}
                      ratio="4:3"
                      tip={ALT_TOOLTIP}
                      value={slide.media.tablet ?? { url: "", alt: "" }}
                      onChange={(value) => setSlideMedia(slide.id, "tablet", value)}
                      note="Optionnel : laissée vide ⇒ l’image « ordinateur » est affichée sur tablette."
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </EditorZone>

      {/* ---- Zone 2 — les textes et boutons de chaque slide ---- */}
      <EditorZone
        tone="content"
        title="Textes et boutons des slides"
        scope="Pour un affichage épuré, le bloc de texte se place en bas à gauche de chaque slide (centré sur téléphone). Dépliez une slide pour la modifier."
      >
        {hero.slides.map((slide, slideIndex) => {
          const isOpen = openSlide === slideIndex;
          return (
            <div
              key={slide.id}
              className="overflow-hidden rounded-lg border border-border bg-background/60"
            >
              <button
                type="button"
                onClick={() => setOpenSlide(isOpen ? -1 : slideIndex)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2 text-left"
              >
                <span className="text-xs font-semibold text-foreground">
                  Textes & CTA de la slide {slideIndex + 1}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen ? (
                <div className="grid gap-3 p-3">
                  <div className="grid gap-1.5">
                    <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      Assombrissement de la photo
                      <HelpTip tip="Voile sombre posé sur la photo de cette slide pour garantir la lisibilité des textes." />
                    </span>
                    <SegmentedButtons
                      value={slide.overlayLevel}
                      options={overlayOptions()}
                      onChange={(overlayLevel) =>
                        setSlide(slide.id, {
                          overlayLevel: overlayLevel as HeroOverlayLevel,
                        })
                      }
                      label="Assombrissement"
                    />
                  </div>
                  <TextField
                    label="Titre principal (H1)"
                    value={slide.titleH1}
                    tip="Titre de cette slide — balise H1 visible uniquement lorsque la slide est affichée."
                    onChange={(titleH1) => setSlide(slide.id, { titleH1 })}
                  />
                  <TextField
                    label="Sous-titre (H2)"
                    value={slide.subtitleH2}
                    onChange={(subtitleH2) => setSlide(slide.id, { subtitleH2 })}
                  />
                  <TextAreaField
                    label="Description"
                    value={slide.descriptionText}
                    rows={2}
                    onChange={(descriptionText) =>
                      setSlide(slide.id, { descriptionText })
                    }
                  />
                  <SelectField
                    label="Couleur du texte"
                    value={slide.textTone}
                    options={heroTextToneOrder.map((value) => ({
                      value,
                      label: heroTextToneLabels[value],
                    }))}
                    onChange={(textTone) =>
                      setSlide(slide.id, { textTone: textTone as HeroTextTone })
                    }
                    tip="« Clair » (blanc) est recommandé sur une photo."
                  />
                  <div className="rounded-md border border-dashed border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor={`hero-slider-cta-${slide.id}`}
                        className="text-xs font-semibold text-foreground"
                      >
                        Afficher un bouton d’action (CTA) sur cette slide
                      </label>
                      <Switch
                        id={`hero-slider-cta-${slide.id}`}
                        checked={slide.ctaShow}
                        onCheckedChange={(ctaShow) =>
                          setSlide(slide.id, { ctaShow })
                        }
                      />
                    </div>
                    {slide.ctaShow ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <TextField
                          label="Libellé"
                          value={slide.ctaLabel}
                          placeholder="Ex. Découvrir la collection"
                          onChange={(ctaLabel) => setSlide(slide.id, { ctaLabel })}
                        />
                        <TextField
                          label="Lien"
                          value={slide.ctaHref}
                          mono
                          placeholder="/portfolio"
                          onChange={(ctaHref) => setSlide(slide.id, { ctaHref })}
                        />
                        <SelectField
                          label="Style du bouton"
                          value={slide.ctaStyle}
                          options={[
                            { value: "primary", label: "Principal" },
                            { value: "secondary", label: "Secondaire" },
                            { value: "outline", label: "Contours" },
                          ]}
                          onChange={(ctaStyle) =>
                            setSlide(slide.id, {
                              ctaStyle: ctaStyle as HeroSliderSlide["ctaStyle"],
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Graisses globales au module */}
        <div className="grid gap-3 sm:grid-cols-3">
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
              onChange={(value) =>
                commit({ ...hero, [field]: value as FontWeightClass })
              }
            />
          ))}
        </div>
      </EditorZone>

      {/* ---- Zone 3 — le défilement du carrousel ---- */}
      <EditorZone
        tone="detail"
        title="Défilement du carrousel"
        scope="La vitesse et la manière dont les visuels défilent à l’écran, ainsi que les commandes laissées au visiteur (flèches, points)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
            <label
              htmlFor="hero-slider-autoplay"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Défilement automatique (autoplay)
            </label>
            <Switch
              id="hero-slider-autoplay"
              checked={hero.settings.autoplay}
              onCheckedChange={(autoplay) => setSettings({ autoplay })}
            />
          </div>
          <SelectField
            label="Vitesse de défilement"
            value={String(hero.settings.autoplaySpeedMs)}
            options={heroAutoplaySpeedOrder.map((value) => ({
              value: String(value),
              label: heroAutoplaySpeedLabels[value],
            }))}
            onChange={(speed) =>
              setSettings({
                autoplaySpeedMs: Number(speed) as HeroAutoplaySpeed,
              })
            }
            disabled={!hero.settings.autoplay}
          />
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              Transition entre les visuels
            </span>
            <SegmentedButtons
              value={hero.settings.transition}
              options={heroSliderTransitionOrder.map((value) => ({
                value,
                label: heroSliderTransitionLabels[value],
              }))}
              onChange={(transition) =>
                setSettings({ transition: transition as HeroSliderTransition })
              }
              label="Type de transition"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
            <label
              htmlFor="hero-slider-arrows"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Flèches gauche / droite (ordinateur)
            </label>
            <Switch
              id="hero-slider-arrows"
              checked={hero.settings.showArrows}
              onCheckedChange={(showArrows) => setSettings({ showArrows })}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
            <label
              htmlFor="hero-slider-dots"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Points de navigation en bas
            </label>
            <Switch
              id="hero-slider-dots"
              checked={hero.settings.showDots}
              onCheckedChange={(showDots) => setSettings({ showDots })}
            />
          </div>
        </div>
      </EditorZone>

      {/* Bouton discret de réinitialisation aux valeurs de démonstration. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createHeroSliderContent())}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Réinitialiser aux 3 slides de démonstration
        </button>
      </div>
    </div>
  );
}
