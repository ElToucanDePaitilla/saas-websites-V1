"use client";

import * as React from "react";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { Switch } from "@/components/ui/switch";
import {
  createHeroVideoContent,
  fontWeightLabels,
  fontWeightOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  resolveHeroVideoContent,
  type ArtSource,
  type HeroVideoContent,
  type ModuleContent,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import {
  HelpTip,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Vidéo » (Étape 7.3)
 * ----------------------------------------------------------------------------
 * Les textes/CTA héritent 100 % de `BaseHero` (H1/H2/description, overlay,
 * graisses, tone, CTA). Seule la couche média vidéo est spécifique. Rubriques :
 *   1. 🎬 Média Vidéo & Fallback (video_url, loop, fallback mobile 9:16
 *      obligatoire, poster desktop 16:9 optionnel) ;
 *   2. 📝 Textes & Bouton (hérités — overlay, textes, tone, graisses, CTA) ;
 *   3. ⚙️ Réglages & Performance (muted / playsinline toujours actifs).
 * ============================================================================
 */

type ModuleHeroVideoEditorProps = {
  content: Extract<ModuleContent, { type: "hero" } & { variant: "video" }>;
  onChangeContent: (content: ModuleContent) => void;
};

/** Titre d'une rubrique (3 sections). */
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

export function ModuleHeroVideoEditor({
  content,
  onChangeContent,
}: ModuleHeroVideoEditorProps) {
  const hero = React.useMemo<HeroVideoContent>(
    () => resolveHeroVideoContent(content),
    [content]
  );

  function commit(next: HeroVideoContent) {
    onChangeContent({ type: "hero", ...next });
  }

  function setHero(patch: Partial<HeroVideoContent>) {
    commit({ ...hero, ...patch });
  }

  function setMedia(patch: Partial<HeroVideoContent["media"]>) {
    setHero({ media: { ...hero.media, ...patch } });
  }

  function setMediaSource(
    key: "posterDesktop" | "fallbackMobile",
    value: ArtSource
  ) {
    setMedia({ [key]: value });
  }

  const setText = (field: "titleH1" | "subtitleH2" | "descriptionText") => {
    return (value: string) => setHero({ [field]: value });
  };

  return (
    <div className="grid gap-5">
      {/* ============ Rubrique 1 — 🎬 Média Vidéo & Fallback ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="🎬 Média Vidéo & Fallback"
          description="La vidéo se joue en arrière-plan. Sur mobile, pour économiser la batterie et les données 4G/5G de vos visiteurs, une photo prend le relais automatiquement."
        />
        <div className="grid gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
            Vidéo d’arrière-plan (MP4 / WebM)
            <HelpTip tip="Privilégiez une vidéo courte, sans son et de poids léger." />
          </span>
          <p className="text-[11px] text-muted-foreground">
            Deux possibilités au choix : uploader un fichier vidéo, ou coller
            l’adresse (URL) d’un fichier hébergé.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <MediaUploadButton
              label="Cliquer ici pour uploader votre vidéo"
              accept="video/mp4,video/webm"
              onUploaded={(url) => setMedia({ videoUrl: url })}
            />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            … ou collez une URL :
          </p>
          <TextField
            label="URL de la vidéo"
            value={hero.media.videoUrl}
            mono
            placeholder="https://…/video.mp4"
            onChange={(videoUrl) => setMedia({ videoUrl })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
          <label
            htmlFor="hero-video-loop"
            className="flex items-center gap-2 text-xs font-semibold text-foreground"
          >
            Lecture en boucle
          </label>
          <Switch
            id="hero-video-loop"
            checked={hero.media.loop}
            onCheckedChange={(loop) => setMedia({ loop })}
          />
        </div>
        <ArtSourceField
          label="Photo de secours — smartphone (obligatoire)"
          ratio="9:16"
          tip="Affichée sur téléphone à la place de la vidéo pour garantir un chargement ultra-rapide."
          value={hero.media.fallbackMobile}
          onChange={(value) => setMediaSource("fallbackMobile", value)}
        />
        <ArtSourceField
          label="Photo de secours — ordinateur (optionnelle)"
          ratio="16:9"
          tip="S’affiche pendant le court instant où la vidéo se charge (poster)."
          value={hero.media.posterDesktop}
          onChange={(value) => setMediaSource("posterDesktop", value)}
        />
      </section>

      {/* ============ Rubrique 2 — 📝 Textes & Bouton (hérité de BaseHero) ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="📝 Textes & Bouton"
          description="Hérité du Héro : le contenu affiché au centre, par-dessus la vidéo."
        />
        <SelectField
          label="Assombrissement de la vidéo"
          value={hero.overlayLevel}
          options={heroOverlayOrder.map((value) => ({
            value,
            label: heroOverlayLabels[value],
          }))}
          onChange={(overlayLevel) => setHero({ overlayLevel })}
          tip="Voile sombre ajouté sur la vidéo pour garantir la lisibilité des textes."
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
              htmlFor="hero-video-cta-show"
              className="text-xs font-semibold text-foreground"
            >
              Afficher un bouton d’action (CTA)
            </label>
            <Switch
              id="hero-video-cta-show"
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

      {/* ============ Rubrique 3 — ⚙️ Réglages & Performance ============ */}
      <section className="grid gap-3">
        <RubricTitle
          title="⚙️ Réglages & Performance"
          description="Paramètres d’optimisation d’affichage de la vidéo."
        />
        <div className="grid gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            Muet (muted)
            <HelpTip tip="Toujours activé : les navigateurs exigent une vidéo muette pour autoriser la lecture automatique." />
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Toujours actif
            </span>
          </p>
          <p className="flex items-center gap-2 font-medium text-foreground">
            Lecture dans la page (playsinline)
            <HelpTip tip="Évite que le smartphone n’ouvre la vidéo en plein écran." />
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Toujours actif
            </span>
          </p>
          <p className="leading-relaxed">
            La vidéo se joue sans son et en boucle en arrière-plan ; elle est
            remplacée par la photo mobile sur téléphone.
          </p>
        </div>
      </section>

      {/* Bouton discret de réinitialisation. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createHeroVideoContent())}
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
