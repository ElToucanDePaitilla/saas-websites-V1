"use client";

import * as React from "react";

import type { HeroVideoMedia } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * HERO VIDEO BACKGROUND — média vidéo de la variante "video" (7.3 → 11.19)
 * ----------------------------------------------------------------------------
 * Client Component. Couche de fond branchée en `children` de `BaseHero`.
 *
 * ----------------------------------------------------------------------------
 * RÉVISION 11.19 — suppression de l'« image fantôme » au chargement
 * ----------------------------------------------------------------------------
 * Symptôme rapporté : au chargement d'une page contenant un Héro vidéo, on
 * apercevait brièvement la « photo de secours ordinateur » avant que la vidéo
 * n'apparaisse — ce qui casse l'effet attendu.
 *
 * **Cause réelle** : la photo de secours desktop servait de **poster de
 * chargement** (attribut `poster` de `<video>` *et* `<img>` superposé). Or elle
 * est décodée et peinte **avant** le premier plan vidéo : elle s'affichait donc
 * systématiquement, pendant tout le temps de téléchargement de la vidéo.
 * Aucun réglage de fondu ne peut supprimer une image qui est *montrée* — il
 * fallait **cesser de l'afficher pendant le chargement**.
 *
 * **Nouvelle répartition des rôles — chacun des deux médias a UN seul rôle :**
 *
 * | Média                          | Rôle |
 * |--------------------------------|------|
 * | `videoUrl`                     | L'habillage animé du Héro (desktop, hors mouvement réduit) |
 * | `fallbackMobile`               | **Remplace la vidéo sur téléphone** (économie de données et de batterie) |
 * | `posterDesktop`                | **Image de repli** si la vidéo ne peut pas être lue (fichier absent ou illisible, mouvement réduit) — **jamais** pendant le chargement |
 *
 * Pendant le téléchargement de la vidéo, le fond est **anthracite** — le même
 * ton que l'overlay du Héro, donc perçu comme une intention et non comme un
 * défaut. La vidéo se **révèle en fondu** dès que sa première image est décodée
 * (`onLoadedData`, plus précoce et plus fiable que `onPlaying` — et qui couvre
 * aussi le cas d'un autoplay bloqué par le navigateur : l'image fixe du premier
 * plan reste alors visible).
 *
 * **Décision ergonomique assumée** : il n'existe aucun moyen d'afficher une
 * image *et* de ne pas la montrer. Entre « une image fantôme à chaque visite »
 * et « un fond neutre pendant le chargement », le second préserve l'effet
 * recherché — c'est le sens de cette révision.
 *
 * Les images de repli sont choisies **en CSS** (`md:hidden` / `hidden md:block`)
 * et non en JavaScript : elles sont donc présentes dès le HTML rendu par le
 * serveur, sans frame « indécise » (un état initial `null` produisait, lui, un
 * passage au noir supplémentaire).
 *
 * Références : CHANGELOG.md — Étapes 11.18 puis 11.19.
 * ============================================================================
 */

const DESKTOP_MEDIA = "(min-width: 768px)";
const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

type HeroVideoBackgroundProps = {
  media: HeroVideoMedia;
};

/** Image pleine surface en object-cover (alt vide : décorative). */
function FullImage({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  if (url === "") {
    return null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}

export function HeroVideoBackground({ media }: HeroVideoBackgroundProps) {
  // Sert UNIQUEMENT à décider si la vidéo est montée : la vidéo est de toute
  // façon masquée sous `md` par CSS, donc une estimation erronée pendant une
  // frame n'a aucune conséquence visible (aucune image parasite, aucun flash).
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  /** Première image de la vidéo décodée → révélation en fondu. */
  const [videoReady, setVideoReady] = React.useState(false);
  /** La vidéo n'a pas pu être lue → on retombe sur l'image de repli desktop. */
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    const mqDesktop = window.matchMedia(DESKTOP_MEDIA);
    const mqReduced = window.matchMedia(REDUCED_MEDIA);
    const apply = () => {
      setIsDesktop(mqDesktop.matches);
      setReduced(mqReduced.matches);
    };
    // Détection différée (rAF) : aucun setState synchrone dans l'effet.
    const frame = requestAnimationFrame(apply);
    mqDesktop.addEventListener("change", apply);
    mqReduced.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(frame);
      mqDesktop.removeEventListener("change", apply);
      mqReduced.removeEventListener("change", apply);
    };
  }, []);

  const hasVideoUrl = media.videoUrl.trim() !== "";
  const mountVideo = hasVideoUrl && isDesktop && !reduced;
  // Repli desktop : jamais pendant le chargement — seulement si la vidéo est
  // écartée (mobile / mouvement réduit / URL vide) ou si elle a échoué.
  const showDesktopFallback = !mountVideo || videoFailed;

  return (
    <div aria-hidden="true" className="absolute inset-0 bg-neutral-900">
      {/* --- Repli TÉLÉPHONE : sélectionné en CSS, donc présent dès le SSR. --- */}
      <FullImage
        url={media.fallbackMobile.url}
        alt={media.fallbackMobile.alt}
        className="md:hidden"
      />

      {/* --- Repli ORDINATEUR : uniquement si la vidéo ne joue pas. --- */}
      {showDesktopFallback ? (
        <FullImage
          url={media.posterDesktop.url}
          alt={media.posterDesktop.alt}
          className="hidden md:block"
        />
      ) : null}

      {/* --- Vidéo : montée seulement si utile, révélée en fondu à la 1re image.
             Aucun attribut `poster` : le fond anthracite tient ce rôle, sans
             afficher la moindre image parasite. --- */}
      {mountVideo ? (
        <video
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out",
            videoReady ? "opacity-100" : "opacity-0"
          )}
          src={media.videoUrl}
          autoPlay
          muted
          loop={media.loop}
          playsInline
          controls={false}
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          tabIndex={-1}
        />
      ) : null}
    </div>
  );
}
