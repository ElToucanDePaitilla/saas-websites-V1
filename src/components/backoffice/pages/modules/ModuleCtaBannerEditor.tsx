"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { ColorField } from "@/components/backoffice/shared/ColorField";
import { Switch } from "@/components/ui/switch";
import {
  bannerBackgroundLabels,
  bannerBackgroundOrder,
  bannerFocalYLabels,
  bannerFocalYOrder,
  bannerHeightLabels,
  bannerHeightOrder,
  bannerThemeTokenLabels,
  bannerThemeTokenOrder,
  createBannerSlide,
  createCtaBannerContent,
  heroAutoplaySpeedLabels,
  heroAutoplaySpeedOrder,
  heroCtaStyleLabels,
  heroCtaStyleOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroSliderTransitionLabels,
  heroSliderTransitionOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  parallaxSpeedLabels,
  parallaxSpeedOrder,
  resolveCtaBannerContent,
  type BannerSlide,
  type BannerThemeToken,
  type CtaBannerContent,
  type ModuleContent,
} from "@/lib/pages";
import { bannerEffectiveVariant } from "@/lib/banner-effects";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { EditorZone } from "./EditorZone";
import { LinkTargetField } from "./LinkTargetField";
import { SelectField, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR — « Bandeau message ou d'appel à l'action » (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Le module n'est plus un simple encart coloré : c'est un **séparateur
 * éditorial** pleine largeur, à quatre fonds et trois hauteurs. Le formulaire est
 * donc organisé en **cinq zones**, dans l'ordre où le photographe se pose les
 * questions (convention de l'Étape 11.17) :
 *
 *   0. ❓ **À quoi sert ce bandeau ?** — l'aide : usages possibles et étendue du
 *      paramétrage (toujours visible, jamais repliée : c'est le mode d'emploi) ;
 *   1. 📝 **Message du bandeau** — titre, sous-titre, paragraphe, contraste ;
 *   2. 🖼️ **Fond du bandeau** — les quatre fonds, avec le sous-formulaire du
 *      fond choisi (couleur, carrousel, parallaxe, vidéo) ;
 *   3. 📏 **Hauteur du bandeau** — petit / standard / grand ;
 *   4. 🔗 **Bouton d'appel à l'action** — libellé, destination, style.
 *
 * Rien n'est dupliqué : les réglages de média sont les composants déjà utilisés
 * par les quatre variantes de Héro (`ArtSourceField`, `MediaUploadButton`), et la
 * destination du bouton est le sélecteur généralisé en 11.26 (`LinkTargetField`).
 *
 * Le contenu est normalisé à la lecture (`resolveCtaBannerContent`) puis chaque
 * changement commite un contenu complet vers le store.
 * ============================================================================
 */

type ModuleCtaBannerEditorProps = {
  content: Extract<ModuleContent, { type: "cta-banner" }>;
  onChangeContent: (content: CtaBannerContent) => void;
};

const BACKGROUND_OPTIONS = bannerBackgroundOrder.map((value) => ({
  value,
  label: bannerBackgroundLabels[value],
}));

const HEIGHT_OPTIONS = bannerHeightOrder.map((value) => ({
  value,
  label: bannerHeightLabels[value],
}));

const THEME_TOKEN_OPTIONS = bannerThemeTokenOrder.map((value) => ({
  value,
  label: bannerThemeTokenLabels[value],
}));

const OVERLAY_OPTIONS = heroOverlayOrder.map((value) => ({
  value,
  label: heroOverlayLabels[value],
}));

const TEXT_TONE_OPTIONS = heroTextToneOrder.map((value) => ({
  value,
  label: heroTextToneLabels[value],
}));

const CTA_STYLE_OPTIONS = heroCtaStyleOrder.map((value) => ({
  value,
  label: heroCtaStyleLabels[value],
}));

const PARALLAX_OPTIONS = parallaxSpeedOrder.map((value) => ({
  value,
  label: parallaxSpeedLabels[value],
}));

/** Cadrages verticaux — convertis en chaînes pour le `Select` générique. */
const FOCAL_Y_OPTIONS = bannerFocalYOrder.map((value) => ({
  value: String(value),
  label: bannerFocalYLabels[value],
}));

const SLIDER_SPEED_OPTIONS = heroAutoplaySpeedOrder.map((value) => ({
  value: String(value),
  label: heroAutoplaySpeedLabels[value],
}));

const SLIDER_TRANSITION_OPTIONS = heroSliderTransitionOrder.map((value) => ({
  value,
  label: heroSliderTransitionLabels[value],
}));

export function ModuleCtaBannerEditor({
  content,
  onChangeContent,
}: ModuleCtaBannerEditorProps) {
  // Contenu normalisé (upgrade legacy + défauts) — base d'édition.
  const banner = React.useMemo<CtaBannerContent>(
    () => resolveCtaBannerContent(content),
    [content]
  );
  const [openSlide, setOpenSlide] = React.useState(0);

  /** Commite un contenu de bandeau complet vers le store. */
  function commit(next: CtaBannerContent) {
    onChangeContent(next);
  }

  /** Applique un patch partiel sur le contenu du bandeau. */
  function setBanner(patch: Partial<CtaBannerContent>) {
    commit({ ...banner, ...patch });
  }

  /** Met à jour une source d'image du fond parallaxe (art-direction). */
  function setMediaSource(
    kind: "desktop" | "mobile" | "tablet",
    source: { url: string; alt: string }
  ) {
    const media =
      kind === "desktop"
        ? { ...banner.media, desktop: source }
        : kind === "mobile"
          ? { ...banner.media, mobile: source }
          : { ...banner.media, tablet: source };
    setBanner({ media });
  }

  /* ---- Carrousel de fond : liste des visuels ---- */

  function setSlide(id: string, patch: Partial<BannerSlide>) {
    commit({
      ...banner,
      slides: banner.slides.map((slide) =>
        slide.id === id ? { ...slide, ...patch } : slide
      ),
    });
  }

  function setSlideMedia(
    id: string,
    kind: "desktop" | "mobile",
    source: { url: string; alt: string }
  ) {
    const slide = banner.slides.find((item) => item.id === id);
    if (!slide) {
      return;
    }
    setSlide(id, { media: { ...slide.media, [kind]: source } });
  }

  function addSlide() {
    const next = createBannerSlide(banner.slides.length);
    commit({ ...banner, slides: [...banner.slides, next] });
    setOpenSlide(banner.slides.length);
  }

  function removeSlide(id: string) {
    const next = banner.slides.filter((slide) => slide.id !== id);
    commit({ ...banner, slides: next });
    setOpenSlide((current) => Math.max(0, Math.min(current, next.length - 1)));
  }

  function moveSlide(id: string, direction: -1 | 1) {
    const index = banner.slides.findIndex((slide) => slide.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= banner.slides.length) {
      return;
    }
    const next = Array.from(banner.slides);
    const [moved] = next.splice(index, 1);
    if (moved) {
      next.splice(target, 0, moved);
    }
    commit({ ...banner, slides: next });
  }

  // Variante réellement rendue (repli couleur si le média choisi est vide) :
  // l'éditeur le dit, pour éviter de chercher une panne là où il n'y en a pas.
  const effectiveVariant = bannerEffectiveVariant(banner);
  const mediaMissing =
    banner.variant !== "color" && effectiveVariant === "color";

  return (
    <div className="grid gap-5">
      {/* ---- Zone 0 — l'aide : usages et étendue du paramétrage ---- */}
      <EditorZone
        tone="detail"
        title="À quoi sert ce bandeau ?"
        scope="Un séparateur pleine largeur qui marque une respiration dans la page et peut porter un message."
      >
        <ul className="grid gap-1 text-xs leading-relaxed text-muted-foreground">
          <li>
            • <span className="font-medium text-foreground">Message d’appel à l’action</span>{" "}
            : une phrase et un bouton (« Un projet photo ? Parlons-en ! »).
          </li>
          <li>
            • <span className="font-medium text-foreground">Slogan</span> : une
            affirmation courte, sans bouton.
          </li>
          <li>
            • <span className="font-medium text-foreground">Séparateur éditorial</span>{" "}
            : une photo, un carrousel, une vidéo ou une couleur pour rythmer la
            page entre deux rubriques.
          </li>
        </ul>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Quatre fonds (couleur unie, carrousel de photos, photo en parallaxe,
          vidéo) et trois hauteurs (petit, standard, grand). Le bandeau occupe
          toujours toute la largeur de l’écran.
        </p>
      </EditorZone>

      {/* ---- Zone 1 — le message ---- */}
      <EditorZone
        tone="content"
        title="Message du bandeau"
        scope="Ce que le visiteur lit : un titre, éventuellement un sous-titre et un paragraphe court."
      >
        <TextField
          label="Titre du message"
          value={banner.heading}
          tip="La phrase principale, affichée en grand. Sur le site, ce titre est un sous-titre de section (et non le titre de la page)."
          onChange={(heading) => setBanner({ heading })}
        />
        <TextField
          label="Sous-titre"
          value={banner.subheading}
          onChange={(subheading) => setBanner({ subheading })}
        />
        <TextAreaField
          label="Paragraphe (optionnel)"
          value={banner.descriptionText}
          rows={2}
          hint="Laissez vide pour un bandeau très sobre : le titre et le sous-titre suffisent souvent."
          onChange={(descriptionText) => setBanner({ descriptionText })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Couleur du texte"
            value={banner.textTone}
            options={TEXT_TONE_OPTIONS}
            onChange={(textTone) => setBanner({ textTone })}
            tip="« Clair » (blanc) pour une photo sombre ; « Sombre » sur un fond clair."
          />
          <SelectField
            label="Assombrissement du fond"
            value={banner.overlayLevel}
            options={OVERLAY_OPTIONS}
            onChange={(overlayLevel) => setBanner({ overlayLevel })}
            tip="Voile posé sur la photo ou la vidéo pour garantir la lisibilité du texte. Sans effet sur un fond couleur unie."
          />
        </div>
      </EditorZone>

      {/* ---- Zone 2 — le fond ---- */}
      <EditorZone
        tone="style"
        title="Fond du bandeau"
        scope="Ce qui habille le bandeau derrière le message. Un seul fond à la fois, choisi ci-dessous."
      >
        <SelectField
          label="Type de fond"
          value={banner.variant}
          options={BACKGROUND_OPTIONS}
          onChange={(variant) => setBanner({ variant })}
          className="max-w-sm"
        />

        {mediaMissing ? (
          <p className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-700">
            Aucun visuel n’est encore renseigné pour ce fond : le bandeau
            s’affiche provisoirement en couleur unie. Ajoutez une photo ou une
            vidéo ci-dessous pour activer le fond choisi.
          </p>
        ) : null}

        {/* ---- Fond « couleur unie » ---- */}
        {banner.variant === "color" ? (
          <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
            <SelectField
              label="Origine de la couleur"
              value={banner.color.source}
              options={[
                { value: "theme", label: "Couleur du thème (recommandé)" },
                { value: "custom", label: "Couleur libre (palette ou pipette)" },
              ]}
              onChange={(source) =>
                setBanner({
                  color: { ...banner.color, source: source as "theme" | "custom" },
                })
              }
              tip="Une couleur du thème suit automatiquement le thème du site ; une couleur libre reste figée."
            />
            {banner.color.source === "theme" ? (
              <SelectField
                label="Couleur du thème"
                value={banner.color.token}
                options={THEME_TOKEN_OPTIONS}
                onChange={(token) =>
                  setBanner({
                    color: { ...banner.color, token: token as BannerThemeToken },
                  })
                }
              />
            ) : (
              <ColorField
                label="Couleur de fond"
                value={banner.color.value}
                onChange={(value) =>
                  setBanner({ color: { ...banner.color, value } })
                }
              />
            )}
          </div>
        ) : null}

        {/* ---- Fond « parallaxe » ---- */}
        {banner.variant === "parallax" ? (
          <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
            <ArtSourceField
              label="Photo — ordinateur (paysage 16:9)"
              ratio="16:9"
              tip="Privilégiez une image haute définition : l’effet de profondeur se voit d’autant plus."
              value={banner.media.desktop}
              onChange={(value) => setMediaSource("desktop", value)}
            />
            <ArtSourceField
              label="Photo — smartphone (portrait 9:16)"
              ratio="9:16"
              tip="Sur téléphone, l’effet est remplacé par une image fixe (performance et batterie)."
              value={banner.media.mobile}
              onChange={(value) => setMediaSource("mobile", value)}
            />
            <ArtSourceField
              label="Photo — tablette (4:3, optionnelle)"
              ratio="4:3"
              tip="Optionnel : sans elle, la photo « ordinateur » est utilisée sur tablette."
              value={banner.media.tablet ?? { url: "", alt: "" }}
              onChange={(value) => setMediaSource("tablet", value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Intensité du déplacement"
                value={banner.parallaxSpeed}
                options={PARALLAX_OPTIONS}
                onChange={(parallaxSpeed) => setBanner({ parallaxSpeed })}
                tip="Amplitude du mouvement de la photo au défilement. « Modéré » est le réglage classique."
              />
              <SelectField
                label="Position verticale de la photo"
                value={String(banner.focalY)}
                options={FOCAL_Y_OPTIONS}
                onChange={(value) => setBanner({ focalY: Number(value) })}
                tip="Cadrage : choisissez la partie de la photo à privilégier (visage en haut, horizon en bas…)."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              L’effet est désactivé sur téléphone : la photo fixe est affichée.
            </p>
          </div>
        ) : null}

        {/* ---- Fond « carrousel » ---- */}
        {banner.variant === "slider" ? (
          <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
              >
                <Plus className="size-3.5" />
                Ajouter un visuel
              </button>
              <span className="text-xs text-muted-foreground">
                {banner.slides.length} visuel
                {banner.slides.length > 1 ? "s" : ""}
              </span>
            </div>

            {banner.slides.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun visuel : le bandeau s’affiche en couleur unie tant que la
                liste est vide.
              </p>
            ) : null}

            <div className="grid gap-3">
              {banner.slides.map((slide, index) => {
                const isOpen = openSlide === index;
                return (
                  <div
                    key={slide.id}
                    className="overflow-hidden rounded-lg border border-border bg-background/60"
                  >
                    <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setOpenSlide(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="truncate text-xs font-semibold text-foreground">
                          Visuel {index + 1}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {slide.media.desktop.alt || "Sans description"}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          aria-label={`Monter le visuel ${index + 1}`}
                          disabled={index === 0}
                          onClick={() => moveSlide(slide.id, -1)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Descendre le visuel ${index + 1}`}
                          disabled={index === banner.slides.length - 1}
                          onClick={() => moveSlide(slide.id, 1)}
                          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer le visuel ${index + 1}`}
                          onClick={() => removeSlide(slide.id)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="grid gap-3 p-3">
                        <ArtSourceField
                          label="Photo — ordinateur (paysage 16:9)"
                          ratio="16:9"
                          value={slide.media.desktop}
                          onChange={(value) =>
                            setSlideMedia(slide.id, "desktop", value)
                          }
                        />
                        <ArtSourceField
                          label="Photo — smartphone (portrait 9:16)"
                          ratio="9:16"
                          value={slide.media.mobile}
                          onChange={(value) =>
                            setSlideMedia(slide.id, "mobile", value)
                          }
                        />
                        <SelectField
                          label="Position verticale de la photo"
                          value={String(slide.focalY)}
                          options={FOCAL_Y_OPTIONS}
                          onChange={(value) =>
                            setSlide(slide.id, { focalY: Number(value) })
                          }
                          className="max-w-xs"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Transition entre les visuels"
                value={banner.settings.transition}
                options={SLIDER_TRANSITION_OPTIONS}
                onChange={(transition) =>
                  setBanner({
                    settings: { ...banner.settings, transition },
                  })
                }
              />
              <SelectField
                label="Durée d’affichage"
                value={String(banner.settings.autoplaySpeedMs)}
                options={SLIDER_SPEED_OPTIONS}
                onChange={(value) =>
                  setBanner({
                    settings: {
                      ...banner.settings,
                      autoplaySpeedMs: Number(
                        value
                      ) as CtaBannerContent["settings"]["autoplaySpeedMs"],
                    },
                  })
                }
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                <label
                  htmlFor="banner-slider-autoplay"
                  className="text-xs font-semibold text-foreground"
                >
                  Défilement automatique
                </label>
                <Switch
                  id="banner-slider-autoplay"
                  checked={banner.settings.autoplay}
                  onCheckedChange={(autoplay) =>
                    setBanner({ settings: { ...banner.settings, autoplay } })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                <label
                  htmlFor="banner-slider-arrows"
                  className="text-xs font-semibold text-foreground"
                >
                  Flèches (ordinateur)
                </label>
                <Switch
                  id="banner-slider-arrows"
                  checked={banner.settings.showArrows}
                  onCheckedChange={(showArrows) =>
                    setBanner({ settings: { ...banner.settings, showArrows } })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                <label
                  htmlFor="banner-slider-dots"
                  className="text-xs font-semibold text-foreground"
                >
                  Points de repère
                </label>
                <Switch
                  id="banner-slider-dots"
                  checked={banner.settings.showDots}
                  onCheckedChange={(showDots) =>
                    setBanner({ settings: { ...banner.settings, showDots } })
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* ---- Fond « vidéo » ---- */}
        {banner.variant === "video" ? (
          <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
            <MediaUploadButton
              label="Cliquer ici pour uploader votre vidéo"
              accept="video/mp4,video/webm"
              onUploaded={(url) =>
                setBanner({ video: { ...banner.video, videoUrl: url } })
              }
            />
            <TextField
              label="… ou URL de la vidéo"
              value={banner.video.videoUrl}
              mono
              placeholder="https://…/video.mp4"
              onChange={(videoUrl) =>
                setBanner({ video: { ...banner.video, videoUrl } })
              }
            />
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
              <label
                htmlFor="banner-video-loop"
                className="text-xs font-semibold text-foreground"
              >
                Lecture en boucle
              </label>
              <Switch
                id="banner-video-loop"
                checked={banner.video.loop}
                onCheckedChange={(loop) =>
                  setBanner({ video: { ...banner.video, loop } })
                }
              />
            </div>
            <ArtSourceField
              label="Photo de secours — smartphone (obligatoire)"
              ratio="9:16"
              tip="Affichée sur téléphone à la place de la vidéo : chargement immédiat, données et batterie préservées."
              value={banner.video.fallbackMobile}
              onChange={(value) =>
                setBanner({ video: { ...banner.video, fallbackMobile: value } })
              }
            />
            <ArtSourceField
              label="Image de repli — ordinateur (optionnelle)"
              ratio="16:9"
              tip="Affichée uniquement si la vidéo ne peut pas être lue (fichier absent ou illisible, animations réduites). Jamais pendant le chargement."
              value={banner.video.posterDesktop}
              onChange={(value) =>
                setBanner({ video: { ...banner.video, posterDesktop: value } })
              }
            />
          </div>
        ) : null}
      </EditorZone>

      {/* ---- Zone 3 — la hauteur ---- */}
      <EditorZone
        tone="style"
        title="Hauteur du bandeau"
        scope="La place qu’occupe le bandeau entre la barre de navigation et le bas de la fenêtre du visiteur."
      >
        <SelectField
          label="Encombrement vertical"
          value={banner.height}
          options={HEIGHT_OPTIONS}
          onChange={(height) => setBanner({ height })}
          className="max-w-sm"
          tip="Les trois hauteurs s’adaptent à la taille de l’écran du visiteur. Le bandeau occupe toujours toute la largeur."
        />
      </EditorZone>

      {/* ---- Zone 4 — le bouton ---- */}
      <EditorZone
        tone="action"
        title="Bouton d’appel à l’action"
        scope="Le bouton affiché sous le message : son libellé, sa destination et son style. Facultatif — un bandeau peut n’être qu’un slogan."
      >
        <div className="rounded-md border border-dashed border-border bg-background/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="banner-cta-show"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Afficher un bouton d’action (CTA)
            </label>
            <Switch
              id="banner-cta-show"
              checked={banner.ctaShow}
              onCheckedChange={(ctaShow) => setBanner({ ctaShow })}
              aria-label="Afficher un bouton d’action"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {banner.ctaShow
              ? "Le bouton est visible : renseignez son libellé et sa destination."
              : "Bouton masqué : le bandeau devient un simple message ou slogan."}
          </p>

          {banner.ctaShow ? (
            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Libellé du bouton"
                  value={banner.ctaLabel}
                  placeholder="Ex. Me contacter"
                  onChange={(ctaLabel) => setBanner({ ctaLabel })}
                />
                <SelectField
                  label="Style du bouton"
                  value={banner.ctaStyle}
                  options={CTA_STYLE_OPTIONS}
                  onChange={(ctaStyle) => setBanner({ ctaStyle })}
                  tip="Principal : bouton coloré bien visible. Secondaire : plus discret. Contour : transparence avec une bordure."
                />
              </div>
              <LinkTargetField
                value={banner.ctaHref}
                onChange={(ctaHref) => setBanner({ ctaHref })}
                label="Destination du bouton"
                hint="Choisissez une page ou une section du site ; pour un site externe, collez l’adresse."
              />
            </div>
          ) : null}
        </div>
      </EditorZone>

      {/* Bouton discret de réinitialisation aux valeurs de démonstration. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createCtaBannerContent())}
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
