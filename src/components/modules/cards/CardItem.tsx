import type { CSSProperties } from "react";

import { MediaImage } from "@/components/common/MediaImage";
import { CTAButton } from "@/components/modules/gallery/CTAButton";
import { cardsHoverCssVars } from "@/lib/cards-effects";
import {
  galleryBorderStyle,
  galleryShadowStyle,
} from "@/lib/gallery-effects";
import {
  cardsMediaRatio,
  type CardItem as CardItemModel,
  type CardsColumns,
  type CardsLandscapeRatio,
  type CardsPhotoFormat,
  type CardsStyleSettings,
} from "@/lib/pages";

/**
 * ============================================================================
 * CARTE — photo, titre, texte, bouton (Étapes 13.1 & 13.2)
 * ----------------------------------------------------------------------------
 * Le gabarit est **la signature du module** : photo au ratio du cadrage choisi,
 * puis un bloc clair qui chevauche son bas, à 88 % de largeur (voir
 * `globals.css` § MODULE « CARDS »).
 *
 * **La carte n'est pas cliquable** : elle ne contient aucun gestionnaire de clic
 * et n'est pas focalisable. Le seul élément interactif est le bouton, qui porte
 * la destination. Conséquence directe : pas de faux signal (ni élévation, ni
 * curseur main sur la carte) et un parcours clavier qui s'arrête pile sur
 * l'action — le focus du bouton déclenche en revanche le même effet de survol
 * sur la photo, pour que la navigation au clavier ne soit pas « morte ».
 *
 * Étape 13.3 : la carte ne connaît plus la **variante** mais le **cadrage
 * photo** (`CardsPhotoFormat`). La variante éditoriale a, elle aussi, une photo,
 * dont le cadrage vient de son layout — c'est l'appelant qui le résout, ici on
 * ne fait que l'appliquer. Les cartes éditoriales ont leur propre composant
 * (`EditorialCardItem`), qui partage ce gabarit mais pas son pied.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (réglages du contenu). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/**
 * `sizes` de la photo selon le nombre de colonnes (une carte = une colonne).
 *
 * Trois paliers, calqués sur les classes de grille de `CardsModule` :
 *   - `xl` (≥ 1280 px) : le réglage exact, `100 / colonnes` ;
 *   - `lg` (1024–1279 px) : la grille **plafonne à 4 colonnes** (5 et 6 ne
 *     prennent leur valeur qu'en `xl`) — d'où `min(colonnes, 4)`. Un `sizes`
 *     en deux paliers sous-dimensionnerait les images à 5 et 6 colonnes, où la
 *     largeur réelle change au palier `lg` ;
 *   - tablette (640–1023 px) : 2 colonnes ; téléphone : 1 colonne.
 */
export function cardImageSizes(columns: CardsColumns): string {
  const desktop = Math.round(100 / columns);
  const laptop = Math.round(100 / Math.min(columns, 4));
  return `(min-width: 1280px) ${desktop}vw, (min-width: 1024px) ${laptop}vw, (min-width: 640px) 50vw, 100vw`;
}

type CardItemProps = {
  card: CardItemModel;
  /** Apparence commune à toutes les cartes de la section. */
  style: CardsStyleSettings;
  /** Colonnes de la grille — sert uniquement à dimensionner la requête d'image. */
  columns: CardsColumns;
  /** Cadrage de la section — décide du ratio de la photo. */
  photoFormat: CardsPhotoFormat;
  /** Proportion du paysage (sans objet pour les autres cadrages). */
  landscapeRatio: CardsLandscapeRatio;
  /** Afficher les boutons de la section (`style.ctaShow`). */
  ctaShow: boolean;
};

export function CardItem({
  card,
  style,
  columns,
  photoFormat,
  landscapeRatio,
  ctaShow,
}: CardItemProps) {
  const frameStyle: CSSProperties = {
    ...galleryBorderStyle(style.border),
    ...galleryShadowStyle(style.shadow),
    borderRadius: style.radius,
  };

  // Tout ce qui est piloté par le contenu passe en **variables CSS** (et non en
  // propriétés directes) : la feuille de styles garde ainsi les replis du
  // gabarit et les commentaires qui expliquent chaque mécanique.
  const cardStyle: CSSVars = {
    ...cardsHoverCssVars(style.hover),
    "--cards-media-ratio": cardsMediaRatio(photoFormat, landscapeRatio),
    "--cards-body-radius": `${style.bodyRadius}px`,
    "--cards-body-border-width": `${style.bodyBorderWidth}px`,
  };

  return (
    // `group/media` : c'est le sélecteur attendu par les règles de survol de
    // `globals.css` (§ Effets de survol), partagé avec les vignettes de galerie.
    // `data-format` documente le cadrage dans le DOM (recette, inspection).
    <article
      className="group/media cards-card"
      data-format={photoFormat}
      style={cardStyle}
    >
      {/* `hv-frame` / `hv-media` : transitions et transformations vivent dans
          `globals.css`, avec la neutralisation `prefers-reduced-motion`. */}
      <div className="hv-frame cards-card__frame" style={frameStyle}>
        <div className="hv-media absolute inset-0">
          <MediaImage
            src={card.media.url}
            alt={card.media.alt || card.title || "Visuel de la carte"}
            fill
            quality={80}
            sizes={cardImageSizes(columns)}
            className="object-cover"
          />
        </div>
        {style.hover.shine ? <span aria-hidden="true" className="hv-shine" /> : null}
      </div>

      <div className="cards-card__body">
        {card.title.trim() !== "" ? (
          // `h3` : le titre de la section est un `h2`, un titre de carte ne peut
          // donc pas être un `h2` — la hiérarchie de titres est vérifiée sur
          // chaque page (« un seul `h1`, un `h2` par section »).
          <h3 className="cards-card__title">{card.title}</h3>
        ) : null}
        {card.text.trim() !== "" ? (
          <p className="cards-card__text">{card.text}</p>
        ) : null}
        {/* Mêmes conditions d'affichage que partout ailleurs dans l'application :
            libellé non vide ET destination non vide — le bouton disparaît de
            lui-même tant que l'un des deux manque. Le STYLE, lui, vient de la
            section (`style.ctaStyle`) : dans une rangée, tous les boutons ont le
            même aspect, car ils ont le même rôle.

            `ctaShow` est un réglage d'**affichage** : on le passe à `show` au
            lieu de retirer le bouton du contenu. Le libellé et la destination
            restent donc enregistrés — réactiver l'interrupteur les restitue. */}
        <CTAButton
          cta={{
            show: ctaShow,
            label: card.cta.label,
            href: card.cta.href,
            style: style.ctaStyle,
          }}
          size="sm"
          className="cards-card__cta"
        />
      </div>
    </article>
  );
}
