import type { CSSProperties } from "react";

import { MediaImage } from "@/components/common/MediaImage";
import { CTAButton } from "@/components/modules/gallery/CTAButton";
import {
  galleryBorderStyle,
  galleryShadowStyle,
} from "@/lib/gallery-effects";
import {
  newsDateLabel,
  newsKindLabel,
  type NewsItem,
  type NewsStyleSettings,
} from "@/lib/pages";

/**
 * ============================================================================
 * CARTE D'ACTUALITÉ — cadre, affiche 2:3, pied (Étape 14.5)
 * ----------------------------------------------------------------------------
 * Un **cadre au fond du thème** (jeton choisi par `frameTone`, appliqué par
 * `data-tone`) qui contient l'affiche puis le pied : titre, date, texte et
 * bouton. Rien dans le contenu ne transporte de couleur : tout vient des jetons
 * du thème, la section suit donc le mode sombre sans réglage (D9).
 *
 * La géométrie de la carte (largeur dérivée de la hauteur de fenêtre, ratio
 * 2:3) vit **entièrement** dans `globals.css` : le composant pose les réglages
 * en variables CSS, jamais en transformations — c'est l'idiome du projet
 * (`cardsHoverCssVars`, `gallery-effects.ts`) et le seul moyen de décrire un
 * état de survol ou une neutralisation `prefers-reduced-motion`.
 *
 * Le titre est un `h3` : le titre de section est le `h2`, un item ne peut donc
 * pas le redoubler — règle de titrage du projet (« un seul h1, un h2 par
 * section »), déjà commentée dans `CardsModule`.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (réglages du contenu). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

type NewsCardProps = {
  item: NewsItem;
  /** Apparence commune à tous les items de la section. */
  style: NewsStyleSettings;
  /** Charge l'affiche en priorité (première carte = LCP). */
  priority: boolean;
  /**
   * Index positionnel dans la liste **filtrée** des items rendus : c'est la clé
   * que la délégation d'événements de `NewsLightbox` reporte sur l'affiche à
   * ouvrir. Il doit suivre l'ordre du `map` (jamais l'`id` de l'item).
   */
  index: number;
};

export function NewsCard({ item, style, priority, index }: NewsCardProps) {
  // Le rayon du cadre est reporté sur la boîte photo (angles supérieurs) via
  // `--news-frame-radius` : le cadre n'ayant pas d'`overflow: hidden` — qui
  // rognerait le pied — c'est l'affiche elle-même qui porte l'arrondi.
  const frameStyle: CSSVars = {
    ...galleryBorderStyle(style.border),
    ...galleryShadowStyle(style.shadow),
    borderRadius: style.radius,
    "--news-frame-radius": `${style.radius}px`,
    "--news-poster-fit": style.posterFit,
  };

  const dateLabel = newsDateLabel(item.publishedAt);

  return (
    <article
      className="news-card__frame"
      data-tone={style.frameTone}
      data-kind={item.kind}
      data-fit={style.posterFit}
      style={frameStyle}
    >
      <span className="news-card__badge">{newsKindLabel(item.kind)}</span>

      {/* Boîte photo : le double-clic et le bouton d'agrandissement portent deux
          attributs DISTINCTS (`data-news-media` / `data-news-open`). Les
          fusionner sur un même élément ferait qu'un simple clic ouvrirait la
          visionneuse, alors que la carte n'est jamais cliquable (règle D5
          révisée). `select-none` évite la sélection de texte au double-clic ;
          `touch-action: manipulation` (feuille de styles) neutralise le
          double-tap de zoom du navigateur sur mobile. */}
      <div className="news-card__media select-none" data-news-media={index}>
        <MediaImage
          src={item.media.url}
          alt={item.media.alt || item.title || "Affiche de l’actualité"}
          fill
          sizes="min(42rem, 100vw)"
          quality={85}
          priority={priority}
          className="news-card__img"
        />
        <button
          type="button"
          className="news-card__zoom"
          data-news-open={index}
          title="Agrandir l’affiche"
          aria-label="Agrandir l’affiche"
        >
          Agrandir
        </button>
      </div>

      <div className="news-card__body">
        {item.title.trim() !== "" ? (
          <h3 className="news-card__title">{item.title}</h3>
        ) : null}
        {dateLabel !== "" ? (
          <time className="news-card__date" dateTime={item.publishedAt}>
            {dateLabel}
          </time>
        ) : null}
        {item.text.trim() !== "" ? (
          <p className="news-card__text">{item.text}</p>
        ) : null}
        {/* Le STYLE et l'AFFICHAGE des boutons sont des réglages de **section** :
            `ctaShow` est passé à `show` au lieu de retirer le bouton du contenu,
            de sorte que libellé et destination restent enregistrés — réactiver
            l'interrupteur les restitue tels quels. */}
        <CTAButton
          cta={{
            show: style.ctaShow,
            label: item.cta.label,
            href: item.cta.href,
            style: style.ctaStyle,
          }}
          size="lg"
          className="news-card__cta"
        />
      </div>
    </article>
  );
}
