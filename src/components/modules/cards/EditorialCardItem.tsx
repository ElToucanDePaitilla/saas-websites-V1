import type { CSSProperties } from "react";

import { MediaImage } from "@/components/common/MediaImage";
import { cardImageSizes } from "@/components/modules/cards/CardItem";
import { RichTextRenderer } from "@/components/modules/content/RichTextRenderer";
import { CTAButton } from "@/components/modules/gallery/CTAButton";
import { cardsHoverCssVars } from "@/lib/cards-effects";
import {
  galleryBorderStyle,
  galleryShadowStyle,
} from "@/lib/gallery-effects";
import {
  cardsMediaRatio,
  richTextDocToPlainText,
  type CardsColumns,
  type CardsLandscapeRatio,
  type CardsPhotoFormat,
  type CardsStyleSettings,
  type EditorialCardItem as EditorialCardItemModel,
  type RichTextDoc,
} from "@/lib/pages";

/**
 * ============================================================================
 * CARTE ÉDITORIALE — photo + corps en texte riche + bouton (Étape 13.3)
 * ----------------------------------------------------------------------------
 * Même **gabarit** que `CardItem` (photo au ratio du cadrage, bloc clair qui la
 * chevauche, cadre, ombre, bordure, effets de survol, bouton plaqué au bas) et
 * mêmes variables CSS : une carte éditoriale posée à côté d'une carte photo doit
 * être indiscernable au premier regard ; seule change la nature du pied.
 *
 * Trois différences, toutes voulues :
 *   1. le pied ne porte **ni titre ni texte séparés** — un seul document, rendu
 *      par `RichTextRenderer`. Le texte riche n'est **jamais** stocké en HTML :
 *      il vit en arbre ProseMirror, projeté ici par liste blanche (aucun
 *      `dangerouslySetInnerHTML`, donc aucune surface d'injection) ;
 *   2. `data-format` vaut `"editorial"` (et non un cadrage) : la section est
 *      reconnaissable à l'inspection, quel que soit son `editorialFormat` ;
 *   3. le texte de repli de la photo est **déduit du document** : la carte n'a
 *      pas de titre, et sans cette déduction toutes les cartes sans `alt`
 *      porteraient le même libellé générique.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (réglages du contenu). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Longueur maximale du texte de repli (`alt`) déduit du document. */
const ALT_FALLBACK_MAX = 90;

/**
 * Texte alternatif de repli d'une carte éditoriale.
 *
 * `media.alt` reste prioritaire (c'est le texte que l'auteur a écrit pour la
 * photo) ; à défaut on déduit du document un début de phrase, tronqué sur un
 * mot entier pour ne pas couper au milieu. Un document vide retombe sur le
 * libellé générique, comme les cartes photo sans titre.
 */
function editorialAltFallback(body: RichTextDoc): string {
  const text = richTextDocToPlainText(body).trim();
  if (text === "") {
    return "Visuel de la carte";
  }
  if (text.length <= ALT_FALLBACK_MAX) {
    return text;
  }
  const cut = text.slice(0, ALT_FALLBACK_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

type EditorialCardItemProps = {
  card: EditorialCardItemModel;
  /** Apparence commune à toutes les cartes de la section. */
  style: CardsStyleSettings;
  /** Colonnes de la grille — sert uniquement à dimensionner la requête d'image. */
  columns: CardsColumns;
  /** Cadrage de la section (réglage `layout.editorialFormat`). */
  photoFormat: CardsPhotoFormat;
  /** Proportion du paysage (sans objet pour les autres cadrages). */
  landscapeRatio: CardsLandscapeRatio;
  /** Afficher les boutons de la section (`style.ctaShow`). */
  ctaShow: boolean;
};

export function EditorialCardItem({
  card,
  style,
  columns,
  photoFormat,
  landscapeRatio,
  ctaShow,
}: EditorialCardItemProps) {
  const frameStyle: CSSProperties = {
    ...galleryBorderStyle(style.border),
    ...galleryShadowStyle(style.shadow),
    borderRadius: style.radius,
  };

  const cardStyle: CSSVars = {
    ...cardsHoverCssVars(style.hover),
    "--cards-media-ratio": cardsMediaRatio(photoFormat, landscapeRatio),
    "--cards-body-radius": `${style.bodyRadius}px`,
    "--cards-body-border-width": `${style.bodyBorderWidth}px`,
  };

  return (
    // `group/media` : même sélecteur de survol que les cartes photo et les
    // vignettes de galerie (`globals.css` § Effets de survol).
    <article
      className="group/media cards-card"
      data-format="editorial"
      style={cardStyle}
    >
      <div className="hv-frame cards-card__frame" style={frameStyle}>
        <div className="hv-media absolute inset-0">
          <MediaImage
            src={card.media.url}
            alt={card.media.alt || editorialAltFallback(card.body)}
            fill
            quality={80}
            sizes={cardImageSizes(columns)}
            className="object-cover"
          />
        </div>
        {style.hover.shine ? <span aria-hidden="true" className="hv-shine" /> : null}
      </div>

      {/* `cards-card__body` porte le gabarit du pied (chevauchement, filet,
          arrondi, hauteur élastique) ; `cards-card__rich` resserre l'échelle
          typographique du texte riche à celle d'une carte (voir `globals.css`).
          Les deux classes cohabitent avec `rich-content`, posée par le
          renderer : c'est `.cards-card__rich` qui gagne la course aux tailles. */}
      <div className="cards-card__body">
        <RichTextRenderer doc={card.body} className="cards-card__rich" />
        {/* `ctaShow` est un réglage d'affichage : le libellé et la destination
            restent enregistrés, on ne fait que masquer le bouton. */}
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
