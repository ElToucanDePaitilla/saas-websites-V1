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
import { EditorZone } from "./EditorZone";
import {
  HelpTip,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Vidéo » (Étape 7.3, revu en 11.17)
 * ----------------------------------------------------------------------------
 * Les textes/CTA héritent 100 % de `BaseHero` (H1/H2/description, overlay,
 * graisses, tone, CTA). Seule la couche média vidéo est spécifique.
 *
 * Étape 11.17 — quatre `EditorZone` nomment chacune leur cible et leur portée
 * (plans/ROADMAP-11.17-editor-zones-ux.md §5) :
 *   1. 🎬 **Vidéo d'arrière-plan**      — video_url, boucle, photo mobile 9:16
 *      obligatoire, poster desktop 16:9 optionnel ;
 *   2. 📝 **Textes affichés sur la vidéo** — overlay, textes, tone, graisses ;
 *   3. 🔗 **Bouton d'appel à l'action**  — libellé, style et destination ;
 *   4. ⚙️ **Performance et affichage**   — muet / playsinline (non modifiables).
 * ============================================================================
 */

type ModuleHeroVideoEditorProps = {
  content: Extract<ModuleContent, { type: "hero" } & { variant: "video" }>;
  onChangeContent: (content: ModuleContent) => void;
};

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
      {/* ---- Zone 1 — la vidéo d'arrière-plan ---- */}
      <EditorZone
        tone="style"
        title="Vidéo d’arrière-plan"
        scope="La vidéo jouée en fond de section. Sur téléphone, une photo prend automatiquement le relais pour économiser la batterie et les données mobiles de vos visiteurs."
      >
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
          label="Image de repli — ordinateur (optionnelle)"
          ratio="16:9"
          tip="Affichée uniquement si la vidéo ne peut pas être lue : fichier absent, format non pris en charge, ou visiteur ayant demandé à limiter les animations. Elle n’est jamais montrée pendant le chargement — c’est volontaire, pour éviter qu’une image n’apparaisse avant la vidéo."
          value={hero.media.posterDesktop}
          onChange={(value) => setMediaSource("posterDesktop", value)}
          note="Pendant le chargement de la vidéo, le fond du Héro reste sombre : l’animation se révèle en fondu."
        />
      </EditorZone>

      {/* ---- Zone 2 — les textes affichés sur la vidéo ---- */}
      <EditorZone
        tone="content"
        title="Textes affichés sur la vidéo"
        scope="Le titre, le sous-titre et le paragraphe présentés au centre de la section, par-dessus la vidéo."
      >
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
      </EditorZone>

      {/* ---- Zone 4 — performance et affichage ---- */}
      <EditorZone
        tone="detail"
        title="Performance et affichage"
        scope="Réglages appliqués automatiquement par le site pour garantir une vidéo fluide et lisible. Ils ne sont pas modifiables."
      >
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
      </EditorZone>

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
