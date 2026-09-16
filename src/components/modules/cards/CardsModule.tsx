import { CardItem } from "@/components/modules/cards/CardItem";
import { EditorialCardItem } from "@/components/modules/cards/EditorialCardItem";
import {
  cardsPhotoFormat,
  resolveCardsContent,
  type CardsColumns,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * SECTION « CARDS » — rendu public (Étapes 13.1 → 13.3)
 * ----------------------------------------------------------------------------
 * Un en-tête (titre `h2`, sous-titre, introduction) puis une grille de cartes.
 *
 * Nombre de cartes par ligne : le réglage décrit le **grand écran**. Jusqu'à 4,
 * la grille se déploie dès `lg` ; à 5 et 6, elle plafonne à 4 en `lg` et ne prend
 * sa valeur qu'en `xl` (1280 px) — au-delà de 4 colonnes, une photo 4:5 dans
 * ~190 px n'est plus une photo. En dessous, la grille se replie d'elle-même —
 * 2 colonnes sur tablette, 1 sur téléphone — sans exception : c'est ce qui
 * garantit qu'une carte à 6 colonnes ne finisse jamais en timbre-poste.
 *
 * Les cartes au-delà de la première ligne passent simplement à la ligne
 * suivante : le nombre de cartes n'est pas borné, seule la grille l'est.
 *
 * Deux natures de cartes, un seul gabarit : les trois variantes photo affichent
 * titre + texte, la variante `editorial` affiche un corps en texte riche. Le
 * **cadrage** de la photo est résolu une fois pour toutes ici
 * (`cardsPhotoFormat`) : les composants de carte ne connaissent pas la variante,
 * seulement le cadrage et le ratio qui en découle.
 * ============================================================================
 */

/**
 * Colonnes par ligne sur grand écran.
 *
 * `lg` = 4 colonnes au maximum ; 5 et 6 n'existent qu'à partir de `xl`, en
 * `lg` elles retombent donc sur 4. Ce sont ces classes qui doivent rester
 * synchronisées avec le `sizes` de `cardImageSizes()`.
 */
const COLUMN_CLASSES: Record<CardsColumns, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-4 xl:grid-cols-5",
  6: "lg:grid-cols-4 xl:grid-cols-6",
};

export function CardsModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "cards" ? module.content : null;
  if (raw === null) {
    return null;
  }

  // Forme complète (repli champ par champ) : le rendu ne lit jamais de contenu
  // brut — un contenu partiel ne doit pas pouvoir faire échouer la page. C'est
  // aussi ce résolveur qui traduit l'ancien format `classic` en `portrait`, qui
  // ramène le paysage à deux colonnes et qui complète `ctaShow` des contenus
  // enregistrés avant l'interrupteur (boutons affichés).
  const content = resolveCardsContent(raw);
  if (content.cards.length === 0) {
    return null;
  }

  const centered = content.layout.align === "center";
  // Cadrage réellement appliqué : la variante pour les trois formats photo, le
  // layout pour `editorial`. Aucun test direct sur la variante dans les cartes.
  const photoFormat = cardsPhotoFormat(
    content.variant,
    content.layout.editorialFormat
  );

  return (
    <section
      id={module.anchorId}
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      {/* En-tête : chaque élément est facultatif et n'émet son nœud que s'il a
          du texte — aucune marge résiduelle, aucun titre vide. */}
      {content.heading.trim() !== "" ||
      content.subtitle.trim() !== "" ||
      content.intro.trim() !== "" ? (
        <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
          {content.heading.trim() !== "" ? (
            <h2 className="module-h2">{content.heading}</h2>
          ) : null}
          {content.subtitle.trim() !== "" ? (
            <p className="cards-section__subtitle">{content.subtitle}</p>
          ) : null}
          {content.intro.trim() !== "" ? (
            <p className="cards-section__intro">{content.intro}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2",
          COLUMN_CLASSES[content.layout.columns]
        )}
      >
        {/* Le `variant` discrimine l'union : dans chaque branche, `cards` a
            exactement la forme attendue par le composant — aucun `cast`. */}
        {content.variant === "editorial"
          ? content.cards.map((card) => (
              <EditorialCardItem
                key={card.id}
                card={card}
                style={content.style}
                columns={content.layout.columns}
                photoFormat={photoFormat}
                landscapeRatio={content.layout.landscapeRatio}
                ctaShow={content.style.ctaShow}
              />
            ))
          : content.cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                style={content.style}
                columns={content.layout.columns}
                photoFormat={photoFormat}
                landscapeRatio={content.layout.landscapeRatio}
                ctaShow={content.style.ctaShow}
              />
            ))}
      </div>
    </section>
  );
}
