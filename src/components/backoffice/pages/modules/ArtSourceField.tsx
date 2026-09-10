"use client";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import type { ArtSource } from "@/lib/pages";
import { cn } from "@/lib/utils";

import { HelpTip, TextField } from "./form-fields";

/**
 * ============================================================================
 * ART SOURCE FIELD — image de fond d'un breakpoint (rubrique Héro, 7.1)
 * ----------------------------------------------------------------------------
 * Champ « prêt à l'emploi » pour une source du HeroStatic :
 *   - vignette (thumbnail) de prévisualisation aux bons ratios ;
 *   - upload local direct (remplace la photo) ;
 *   - texte alternatif `alt` (SEO / accessibilité) avec tooltip « i » ;
 *   - URL manuelle en lecture (mono) pour coller une adresse externe.
 * Contrôlé par le store : `value` + `onChange(next)`.
 * ============================================================================
 */

const ALT_TOOLTIP =
  "Texte lu par Google et les lecteurs d’écran pour décrire la photo. Un bon texte améliore votre référencement (SEO) et l’accessibilité pour les personnes malvoyantes.";

/** Classe d'aspect de la vignette selon le ratio du breakpoint. */
function aspectClassFor(ratio: string): string {
  switch (ratio) {
    case "16:9":
      return "aspect-video";
    case "4:3":
      return "aspect-[4/3]";
    case "9:16":
      return "aspect-[9/16]";
    default:
      return "aspect-video";
  }
}

type ArtSourceFieldProps = {
  /** Intitulé affiché en tête du champ (ex. « Image desktop — ordinateur »). */
  label: string;
  /** Explication affichée dans le tooltip « i » du label. */
  tip?: string;
  /** Ratio attendu (ex. "16:9") — vignette + aide visuelle. */
  ratio: string;
  value: ArtSource;
  onChange: (value: ArtSource) => void;
  /** Petite précision sous le champ (ex. repli tablette sur desktop). */
  note?: string;
  className?: string;
};

export function ArtSourceField({
  label,
  tip,
  ratio,
  value,
  onChange,
  note,
  className,
}: ArtSourceFieldProps) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-background/60 p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          {label}
          {tip ? <HelpTip tip={tip} /> : null}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {ratio}
        </span>
      </div>

      <div className="flex items-start gap-3">
        {/* Vignette de prévisualisation */}
        <div
          className={cn(
            "w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted",
            aspectClassFor(ratio)
          )}
        >
          {value.url !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.url}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>

        {/* Upload + texte alternatif */}
        <div className="min-w-0 flex-1 space-y-2">
          <MediaUploadButton
            onUploaded={(url, alt) =>
              onChange({ ...value, url, alt: value.alt || alt })
            }
          />
          <TextField
            label="Texte alternatif (SEO)"
            value={value.alt}
            placeholder="Description de l’image"
            tip={ALT_TOOLTIP}
            onChange={(alt) => onChange({ ...value, alt })}
          />
        </div>
      </div>

      <TextField
        label="URL de l’image"
        value={value.url}
        mono
        placeholder="https://… ou url de la médiathèque"
        tip="Adresse de la photo. Vous pouvez l’uploader, la choisir dans la médiathèque ou coller une URL (WebP recommandé)."
        onChange={(url) => onChange({ ...value, url })}
      />

      {note ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}
