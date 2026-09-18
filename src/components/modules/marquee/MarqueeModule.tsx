import type { CSSProperties } from "react";

import { MediaImage } from "@/components/common/MediaImage";
import { NavLink } from "@/components/common/NavLink";
import { RevealHero } from "@/components/modules/hero/RevealHero";
import { bannerColorCssValue } from "@/lib/banner-effects";
import { galleryShadowStyle } from "@/lib/gallery-effects";
import {
  marqueeAspectRatio,
  resolveMarqueeContent,
  type GalleryImage,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MODULE « BANDEAU DÉFILANT » — rendu public (Étape 14.3)
 * ----------------------------------------------------------------------------
 * Un ruban de photos qui défile en boucle. Server Component : aucun état, le
 * mouvement appartient entièrement au CSS (voir `globals.css`, § BANDEAU
 * DÉFILANT). `RevealHero` n'apporte que l'animation d'entrée commune à tous
 * les modules (`module.animation`).
 *
 * Deux groupes **strictement identiques** sont rendus côte à côte dans un
 * même viewport : c'est la condition de la boucle sans raccord. Le second est
 * `aria-hidden` — sans cela, chaque photo serait annoncée deux fois par les
 * lecteurs d'écran. Toute différence entre les deux groupes (index, priorité)
 * casserait la boucle : ne jamais les faire diverger.
 *
 * **Pourquoi répéter la séquence dans chaque groupe ?** La translation `-100%`
 * n'est sans trou que si un groupe est au moins aussi large que le viewport.
 * Comme on ne peut pas mesurer cette largeur côté serveur, on force un groupe
 * à couvrir une largeur de référence en répétant la liste (`MARQUEE_REFERENCE_WIDTH`).
 * C'est ce qui permet à l'écart réglé d'être **exact** : un groupe plus large
 * que la bande n'a plus d'espace libre, donc `justify-content: space-around`
 * n'a plus rien à répartir et n'absorbe plus le `gap`. L'alternative
 * (space-around sans répétition) neutralisait le réglage ; l'autre alternative
 * (flex-start sans répétition) laissait un trou visible avec peu de photos.
 *
 * La zone cliquable est **le viewport du ruban**, jamais le fond de section
 * (D7) : le module porte une destination unique, sans élément interactif
 * imbriqué. Les protocoles `mailto:`/`tel:` passent par un `<a>` simple —
 * `NavLink` les prendrait pour des routes internes (`/mailto:…`), même garde
 * que `CTAButton`.
 *
 * Aucun `h1`/`h2` : le module ne porte aucun chapitre (invariant de titrage de
 * `PublicModulesList`).
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (idiome `CardItem`). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Protocoles d'action rendus en `<a>` simple (jamais par `NavLink`). */
const ACTION_PROTOCOL_PATTERN = /^(mailto|tel):/i;

/**
 * Largeur de référence qu'un groupe doit couvrir (px). Elle n'a pas à égaler
 * la plus large des bandes : au-delà, `space-around` reprend la main — l'écart
 * redevient un minimum, mais aucun trou n'apparaît (le filet du plan).
 */
const MARQUEE_REFERENCE_WIDTH = 2560;

/** Plafond de répétitions : borne le DOM même pour des vignettes minuscules. */
const MARQUEE_MAX_COPIES = 6;

/** Une vignette du ruban : cadre à ratio réservé + photo qui le remplit. */
function MarqueeTile({
  image,
  shadow,
  tileWidth,
  repeated,
  hidden,
}: {
  image: GalleryImage;
  shadow: CSSProperties;
  /** Largeur estimée, en px — sert au `sizes` de l'optimiseur d'images. */
  tileWidth: number;
  /** Copie au-delà de la première : motif de boucle, masquée sous mouvement réduit. */
  repeated: boolean;
  /** Retirée de l'arbre d'accessibilité (copie de boucle ou second groupe). */
  hidden: boolean;
}) {
  return (
    <div
      className={cn("marquee__tile", repeated && "marquee__tile--repeat")}
      style={shadow}
      aria-hidden={hidden || undefined}
    >
      <MediaImage
        src={image.url}
        alt={image.alt || "Photo du portfolio"}
        fill
        sizes={`${tileWidth}px`}
        className="object-cover"
      />
    </div>
  );
}

export function MarqueeModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "marquee" ? module.content : null;
  if (raw === null) {
    return null;
  }

  const content = resolveMarqueeContent(raw);
  // Images masquées ou sans URL exclues du rendu (`hidden` est un réglage
  // d'édition, pas un contenu). Une liste vide n'a rien à faire défiler : la
  // section disparaît, comme la galerie.
  const visible = content.images.filter(
    (image) => image.url !== "" && image.hidden !== true
  );
  if (visible.length === 0) {
    return null;
  }

  const [ratioWidth, ratioHeight] = content.ratio.split(":").map(Number);
  const tileWidth = Math.round(
    content.tileHeight * (ratioWidth / ratioHeight)
  );
  // Répartition des copies : la largeur d'une séquence (vignettes + écarts) est
  // connue ici, la largeur de la bande non — on couvre donc une référence fixe.
  const sequenceWidth = visible.length * (tileWidth + content.gap);
  const copies = Math.max(
    1,
    Math.min(
      MARQUEE_MAX_COPIES,
      Math.ceil(MARQUEE_REFERENCE_WIDTH / sequenceWidth)
    )
  );

  const vars: CSSVars = {
    "--marquee-bg": bannerColorCssValue(content.style.background),
    "--marquee-height": `${content.height}px`,
    "--marquee-tile-height": `${content.tileHeight}px`,
    "--marquee-aspect": marqueeAspectRatio(content.ratio),
    "--marquee-gap": `${content.gap}px`,
    "--marquee-duration": `${content.durationSeconds}s`,
  };

  // Ombre **explicite** dans les deux cas : `none` neutralise toute ombre
  // héritée d'un style de la page, là où un `undefined` la laisserait passer.
  const shadow: CSSProperties = content.style.shadowEnabled
    ? galleryShadowStyle(content.style.shadow)
    : { boxShadow: "none" };

  const group = (ariaHidden: boolean) => (
    <div className="marquee__group" aria-hidden={ariaHidden || undefined}>
      {/* `copies` séquences identiques : seule la première est annoncée par les
          lecteurs d'écran (le second groupe entier l'est déjà). */}
      {Array.from({ length: copies }, (_, copy) =>
        visible.map((image) => (
          <MarqueeTile
            key={`${copy}-${image.id}`}
            image={image}
            shadow={shadow}
            tileWidth={tileWidth}
            repeated={copy > 0}
            hidden={ariaHidden || copy > 0}
          />
        ))
      )}
    </div>
  );

  const href = content.linkHref.trim();
  const linked = content.linkEnabled && href !== "";
  const ariaLabel = content.linkLabel.trim() || undefined;

  const viewport = (
    <>
      {group(false)}
      {group(true)}
    </>
  );

  return (
    <section
      id={module.anchorId}
      className={cn("marquee", content.pauseOnHover && "marquee--pause")}
      style={vars}
    >
      <RevealHero animation={module.animation}>
        {linked ? (
          ACTION_PROTOCOL_PATTERN.test(href) ? (
            <a className="marquee__viewport" href={href} aria-label={ariaLabel}>
              {viewport}
            </a>
          ) : (
            <NavLink
              className="marquee__viewport"
              href={href}
              ariaLabel={ariaLabel}
            >
              {viewport}
            </NavLink>
          )
        ) : (
          <div className="marquee__viewport">{viewport}</div>
        )}
      </RevealHero>
    </section>
  );
}
