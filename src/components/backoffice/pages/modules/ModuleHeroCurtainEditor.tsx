"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import {
  createHeroCurtainContent,
  fontWeightLabels,
  fontWeightOrder,
  heroOverlayLabels,
  heroOverlayOrder,
  heroTextToneLabels,
  heroTextToneOrder,
  resolveHeroCurtainContent,
  type ArtSource,
  type HeroCurtainContent,
  type ModuleContent,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { EditorZone } from "./EditorZone";
import { HelpTip, SelectField, TextAreaField, TextField } from "./form-fields";
import { LinkTargetSelect } from "./LinkTargetSelect";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Hero Rideau » (variante `curtain`)
 * ----------------------------------------------------------------------------
 * Adapté du gabarit **Hero Parallaxe** : mêmes zones pour tout ce qui est
 * commun (images, textes, CTA), et **rien de plus**. Ce qui a été retiré de
 * l'original n'était pas décoratif mais structurellement inutile ici :
 *
 *   - `parallaxSpeed` — l'image du rideau ne bouge pas : aucun défilement
 *     différentiel à régler, donc plus de select d'intensité ni de mention
 *     « mobile désactivé » ;
 *   - `disableOnMobile` — l'épinglage de la section est du **CSS natif**
 *     (`position: sticky`), identique sur tous les écrans : il n'y a plus rien
 *     à désactiver sur téléphone, et la photo mobile 9:16 garde tout son rôle.
 *
 * Trois `EditorZone` conformes à l'échelle 11.17 :
 *   1. 🖼️ **Images du rideau** — desktop 16:9, mobile 9:16, tablette 4:3 ;
 *   2. 📝 **Textes affichés sur l'image** — overlay, textes, tone, graisses ;
 *   3. 🔗 **Bouton d'appel à l'action**  — libellé, style et destination.
 *
 * Le réglage « Animation d'apparition du bloc » reste celui, générique, des
 * « Réglages avancés » du module : la variante ne réutilise pas la rubrique
 * « Animations & Effets » du Hero statique (7.1), elle n'en a pas besoin.
 * ============================================================================
 */

type ModuleHeroCurtainEditorProps = {
  content: Extract<ModuleContent, { type: "hero" } & { variant: "curtain" }>;
  onChangeContent: (content: ModuleContent) => void;
};

export function ModuleHeroCurtainEditor({
  content,
  onChangeContent,
}: ModuleHeroCurtainEditorProps) {
  const hero = React.useMemo<HeroCurtainContent>(
    () => resolveHeroCurtainContent(content),
    [content]
  );

  function commit(next: HeroCurtainContent) {
    onChangeContent({ type: "hero", ...next });
  }

  function setHero(patch: Partial<HeroCurtainContent>) {
    commit({ ...hero, ...patch });
  }

  function setMedia(key: "desktop" | "mobile" | "tablet", value: ArtSource) {
    setHero({
      media: {
        ...hero.media,
        [key]: value,
      },
    });
  }

  const setText = (field: "titleH1" | "subtitleH2" | "descriptionText") => {
    return (value: string) => setHero({ [field]: value });
  };

  return (
    <div className="grid gap-5">
      {/* ---- Zone 1 — les images du rideau ---- */}
      <EditorZone
        tone="style"
        title="Images du rideau"
        scope="La photo reste immobile : c’est la section suivante qui vient la recouvrir au défilement, comme un rideau qui tombe. Les trois formats servent le même visuel selon la taille de l’écran."
      >
        <ArtSourceField
          label="Image ordinateur (16:9)"
          ratio="16:9"
          tip="Privilégiez une image haute définition : elle occupe tout l’écran sous la barre de navigation."
          value={hero.media.desktop}
          onChange={(value) => setMedia("desktop", value)}
        />
        <ArtSourceField
          label="Photo smartphone (obligatoire)"
          ratio="9:16"
          tip="Cadrage vertical affiché sur téléphone — le rideau fonctionne aussi sur mobile, l’image y est donc bien visible."
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
              htmlFor="hero-curtain-cta-show"
              className="text-xs font-semibold text-foreground"
            >
              Afficher un bouton d’action (CTA)
            </label>
            <Switch
              id="hero-curtain-cta-show"
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

      {/* Le seul « réglage » du rideau est une conséquence de la mise en page,
          pas un paramètre — d'où ces deux aides plutôt qu'une zone de réglages.
          La seconde compte autant que la première : une section ajoutée se
          place **en fin de page**, où un rideau n'a plus rien à recouvrir et
          se contente donc de défiler. Le dire ici évite de croire à une panne. */}
      <div className="grid gap-2">
        <p className="flex items-start gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <HelpTip tip="Le rideau ne se règle pas : dès que le visiteur fait défiler la page, la section suivante monte par-dessus la photo et la recouvre entièrement. Sur téléphone comme sur ordinateur, le comportement est le même." />
          Effet automatique : la section suivante recouvre la photo au défilement.
        </p>
        <p className="flex items-start gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <HelpTip tip="Une section ajoutée se place en fin de page. Un rideau placé en dernier n’a plus rien à faire tomber devant lui : sa photo défile alors normalement, comme n’importe quelle image. Glissez la section vers le haut de la page, ou ajoutez au moins une section après elle." />
          Pour que le rideau se voie : cette section doit être suivie d’au moins une autre section.
        </p>
      </div>

      {/* Bouton discret de réinitialisation. */}
      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createHeroCurtainContent())}
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
