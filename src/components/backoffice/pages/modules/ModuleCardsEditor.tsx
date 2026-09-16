"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import { Button } from "@/components/ui/button";
import {
  CARDS_LANDSCAPE_RATIOS,
  cardsAlignLabels,
  cardsAlignOrder,
  cardsColumnLabels,
  cardsColumnsFor,
  cardsColumnsLocked,
  cardsColumnOptions,
  cardsEditorRatio,
  cardsLandscapeRatioLabels,
  cardsPhotoFormat,
  cardsPhotoFormatOrder,
  cardsVariantDescriptions,
  cardsVariantLabels,
  createCardItem,
  createCardsContent,
  createEditorialCardItem,
  galleryShadowLabels,
  galleryShadowOrder,
  resolveCardsContent,
  richTextDocToPlainText,
  type CardCta,
  type CardItem,
  type CardsAlign,
  type CardsColumns,
  type CardsContent,
  type CardsLandscapeRatio,
  type CardsLayoutSettings,
  type CardsPhotoFormat,
  type CardsStyleSettings,
  type EditorialCardItem,
  type ModuleContent,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { RichTextBlockEditor } from "./content/RichTextBlockEditor";
import type { RichTextStyleValue } from "./content/rich-text-config";
import { EditorSubZone, EditorZone } from "./EditorZone";
import { LinkTargetSelect } from "./LinkTargetSelect";
import { SelectField, TextAreaField, TextField } from "./form-fields";
import { SwitchField } from "./gallery/fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Cards » (Étapes 13.1 → 13.3)
 * ----------------------------------------------------------------------------
 * Trois `EditorZone` (échelle 11.17), une par question de l'utilisateur :
 *   1. 📝 **En-tête de la section** — titre, sous-titre, introduction ;
 *   2. 🎨 **Disposition et apparence** — quatre sous-blocs : format et grille,
 *      cadre de la photo, bloc de texte, effets au survol ;
 *   3. 🃏 **Les cartes** — liste réordonnable, avec ajout, duplication et
 *      suppression. Chaque carte se replie : seules celles sur lesquelles on
 *      travaille occupent l'écran (et un seul éditeur riche est monté à la fois).
 *
 * **Deux axes de réglage, distincts depuis 13.3** : la *variante* dit la nature
 * du corps (trois formats photo, ou `editorial`), le *cadrage* dit le ratio de
 * la photo. Le sélecteur « Format des cartes » ne propose **jamais** `editorial` :
 * changer de variante remplacerait les corps de texte riche par un titre et un
 * texte, c'est-à-dire détruirait du contenu. `editorial` s'obtient au catalogue,
 * et se recadre ensuite par `layout.editorialFormat`.
 *
 * Deux partis pris hérités des autres éditeurs de liste (diaporama, bandeau) :
 *   - l'en-tête d'une carte est un **bouton** de repli (le titre n'est jamais
 *     le parent du bouton : un bloc cliquable ne se met pas dans un bouton) ;
 *   - le réordonnancement se fait par **boutons**, pas par glisser-déposer : le
 *     glisser-déposer reste réservé au déplacement des sections, et un contrôle
 *     au clavier doit exister pour chaque action.
 *
 * Rappel de conception : **la carte n'est pas cliquable**. Seul le bouton porte
 * une destination — d'où l'absence, ici, de tout réglage de « lien de la carte ».
 * ============================================================================
 */

/**
 * Convertit une saisie en entier **borné** (retourne `null` si invalide).
 * Le bornage est répété côté domaine (`resolveCardsContent`) : l'éditeur
 * empêche une saisie absurde, la lecture protège d'une donnée héritée.
 */
function parseBounded(value: string, min: number, max: number): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Styles de bloc offerts **dans une carte** : texte normal, sous-titre (H3),
 * petit titre (H4).
 *
 * Le **« Titre » (H2) est volontairement retiré** : une carte vit *dans* une
 * section, dont l'en-tête porte déjà le H2. Autoriser un second niveau de titre
 * équivalent à l'intérieur d'une carte brouillerait la hiérarchie de la page —
 * et l'audit de titrage (« un seul h1, un h2 par section ») la mesurerait.
 * `RichTextRenderer` sait toujours rendre un H2 écrit à la main : la tolérance
 * de lecture reste entière, c'est l'édition qui est bornée.
 */
const CARDS_RICH_TEXT_STYLES: RichTextStyleValue[] = ["paragraph", "h3", "h4"];

/** Une carte de la section, quelle que soit la variante. */
type AnyCard = CardItem | EditorialCardItem;

/** Le corps (et non le titre) distingue une carte éditoriale d'une carte photo. */
function isEditorialCard(card: AnyCard): card is EditorialCardItem {
  return "body" in card;
}

/** Début de phrase sur un mot entier (libellés d'accordéon). */
function excerpt(text: string, max = 60): string {
  if (text.length <= max) {
    return text;
  }
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Première ligne de l'accordéon : le titre, ou le début du corps éditorial. */
function cardHeading(card: AnyCard): string {
  if (isEditorialCard(card)) {
    const text = richTextDocToPlainText(card.body).trim();
    return text === "" ? "Carte sans texte" : excerpt(text);
  }
  return card.title.trim() || "sans titre";
}

/** Seconde ligne de l'accordéon : le texte, ou la nature du corps. */
function cardSummary(card: AnyCard): string {
  if (isEditorialCard(card)) {
    return "Texte structuré";
  }
  return card.text.trim() || "Sans texte";
}

/**
 * Correspondance « valeur du `Select` → nombre de colonnes ».
 *
 * Les listes déroulantes de l'application manipulent des **chaînes** (la valeur
 * d'un `SelectItem` est toujours une chaîne), alors que le domaine décrit 2 à 6
 * par une union de **nombres** — et il a raison : `2 | 3 | 4 | 5 | 6` interdit
 * une valeur aberrante à la compilation, ce qu'une chaîne libre ne ferait pas.
 * Cette table fait la jonction, sans conversion ni `cast`.
 */
const COLUMN_FROM_SELECT: Record<string, CardsColumns> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
};

type ModuleCardsEditorProps = {
  content: Extract<ModuleContent, { type: "cards" }>;
  onChangeContent: (content: ModuleContent) => void;
};

export function ModuleCardsEditor({
  content,
  onChangeContent,
}: ModuleCardsEditorProps) {
  // Contenu **complet** avant édition : un contenu partiel (champ ajouté depuis)
  // ne doit pas faire apparaître de `undefined` dans les champs.
  const cards = React.useMemo<CardsContent>(
    () => resolveCardsContent(content),
    [content]
  );

  /** Carte ouverte dans l'accordéon (une seule à la fois : l'écran reste court). */
  const [openCardId, setOpenCardId] = React.useState<string>("");

  /**
   * Vue commune aux deux formes de carte : l'union de tableaux se lit mal
   * (`map` sur `CardItem[] | EditorialCardItem[]` n'a pas de signature unique),
   * et les opérations de liste sont identiques pour les deux. Les champs qui
   * diffèrent passent par `isEditorialCard`.
   */
  const cardList: readonly AnyCard[] = cards.cards;
  const cardCount = cardList.length;

  /** Cadrage réellement appliqué : variante pour les formats photo, layout sinon. */
  const photoFormat = cardsPhotoFormat(
    cards.variant,
    cards.layout.editorialFormat
  );

  function commit(next: CardsContent) {
    onChangeContent(next);
  }

  /**
   * Champs modifiables par les zones d'en-tête et de disposition.
   *
   * `variant` n'accepte **que** les trois cadrages photo : `editorial` ne se
   * choisit pas ici (garde du sélecteur de format), et l'union discriminée du
   * domaine exige que la reconstruction soit explicite — un simple
   * `{ ...cards, ...patch }` mélangerait les deux formes de contenu.
   */
  type CardsPatch = Partial<{
    variant: CardsPhotoFormat;
    heading: string;
    subtitle: string;
    intro: string;
    layout: CardsLayoutSettings;
    style: CardsStyleSettings;
  }>;

  function patch(next: CardsPatch) {
    // `??` et non `||` : un champ vidé par l'utilisateur doit le rester.
    const shared = {
      heading: next.heading ?? cards.heading,
      subtitle: next.subtitle ?? cards.subtitle,
      intro: next.intro ?? cards.intro,
      layout: next.layout ?? cards.layout,
      style: next.style ?? cards.style,
    };
    if (cards.variant === "editorial") {
      commit({
        type: "cards",
        variant: "editorial",
        ...shared,
        cards: cards.cards,
      });
      return;
    }
    commit({
      type: "cards",
      variant: next.variant ?? cards.variant,
      ...shared,
      cards: cards.cards,
    });
  }

  /**
   * Applique une transformation à la liste des cartes.
   *
   * Le `filter` final n'est pas une précaution théorique : il ramène l'union à
   * la forme exacte de la variante, sans `cast`, pour que le contenu reparte
   * typé. Les transformations, elles, ne fabriquent que des cartes du bon type
   * (elles partent de `cardList`).
   */
  function replaceCards(transform: (list: readonly AnyCard[]) => AnyCard[]) {
    const next = transform(cardList);
    if (cards.variant === "editorial") {
      commit({ ...cards, cards: next.filter(isEditorialCard) });
      return;
    }
    commit({
      ...cards,
      cards: next.filter((card): card is CardItem => !isEditorialCard(card)),
    });
  }

  function updatePhotoCard(
    cardId: string,
    cardPatch: Partial<Omit<CardItem, "id">>
  ) {
    replaceCards((list) =>
      list.map((card) =>
        card.id === cardId && !isEditorialCard(card)
          ? { ...card, ...cardPatch }
          : card
      )
    );
  }

  function updateEditorialCard(
    cardId: string,
    cardPatch: Partial<Omit<EditorialCardItem, "id">>
  ) {
    replaceCards((list) =>
      list.map((card) =>
        card.id === cardId && isEditorialCard(card)
          ? { ...card, ...cardPatch }
          : card
      )
    );
  }

  /** Le bouton (libellé / destination) est commun aux deux formes de carte. */
  function updateCardCta(card: AnyCard, ctaPatch: Partial<CardCta>) {
    const cta: CardCta = { ...card.cta, ...ctaPatch };
    if (isEditorialCard(card)) {
      updateEditorialCard(card.id, { cta });
      return;
    }
    updatePhotoCard(card.id, { cta });
  }

  function addCard() {
    // L'index sert seulement au choix du visuel et du texte d'exemple ; au-delà
    // des trois modèles, la fabrique reprend le premier (seed stable).
    const card: AnyCard =
      cards.variant === "editorial"
        ? createEditorialCardItem(cardCount, photoFormat)
        : createCardItem(cardCount, photoFormat);
    replaceCards((list) => [...list, card]);
    setOpenCardId(card.id);
  }

  function duplicateCard(cardId: string) {
    const index = cardList.findIndex((card) => card.id === cardId);
    const source = cardList[index];
    if (source === undefined) {
      return;
    }
    // Le corps éditorial est **copié en profondeur** (`structuredClone`) : deux
    // cartes ne doivent pas partager le même document, sans quoi une future
    // édition de l'une se répercuterait sur l'autre.
    let copy: AnyCard;
    if (isEditorialCard(source)) {
      copy = {
        ...source,
        id: crypto.randomUUID(),
        cta: { ...source.cta },
        media: { ...source.media },
        body: structuredClone(source.body),
      };
    } else {
      copy = {
        ...source,
        id: crypto.randomUUID(),
        cta: { ...source.cta },
        media: { ...source.media },
      };
    }
    replaceCards((list) => {
      const next = [...list];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setOpenCardId(copy.id);
  }

  function removeCard(cardId: string) {
    replaceCards((list) => list.filter((card) => card.id !== cardId));
  }

  /** Déplace une carte d'un cran (le tableau EST l'ordre d'affichage). */
  function moveCard(cardId: string, direction: -1 | 1) {
    const index = cardList.findIndex((card) => card.id === cardId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= cardCount) {
      return;
    }
    replaceCards((list) => {
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  /** Bloc « Bouton de la carte » — identique pour les deux formes de carte. */
  function renderCardCta(card: AnyCard) {
    return (
      <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3">
        <p className="text-[13px] font-semibold leading-snug text-foreground">
          Bouton de la carte
        </p>
        <p className="text-xs text-muted-foreground">
          C’est le seul élément cliquable de la carte : elle-même ne mène nulle
          part. Le bouton n’apparaît que si un libellé, une destination — et
          l’affichage des boutons (voir « Disposition et apparence ») — sont
          réunis. Son <strong>aspect</strong> est commun à toute la section :
          seul son contenu se règle ici.
        </p>
        <TextField
          label="Libellé"
          value={card.cta.label}
          placeholder="Ex. Voir les mariages"
          onChange={(label) => updateCardCta(card, { label })}
          hint="Un libellé long passe automatiquement à la ligne."
        />
        <LinkTargetSelect
          value={card.cta.href}
          onChange={(href) => updateCardCta(card, { href })}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — l'en-tête de la section ---- */}
      <EditorZone
        tone="content"
        title="En-tête de la section"
        scope="Le titre, le sous-titre et la phrase d’introduction affichés au-dessus des cartes, sur le site public. Chacun est facultatif : un champ laissé vide ne laisse ni blanc ni marge."
      >
        <TextField
          label="Titre de la section (H2)"
          value={cards.heading}
          placeholder="Ex. Mes univers"
          onChange={(heading) => patch({ heading })}
          hint="Titre visible au-dessus des cartes."
        />
        <TextField
          label="Sous-titre"
          value={cards.subtitle}
          placeholder="Ex. Trois façons de travailler ensemble"
          onChange={(subtitle) => patch({ subtitle })}
        />
        <TextAreaField
          label="Phrase d’introduction"
          value={cards.intro}
          rows={3}
          hint="Quelques mots d’accroche. Les retours à la ligne sont conservés."
          onChange={(intro) => patch({ intro })}
        />
      </EditorZone>

      {/* ---- Zone 2 — disposition, cadre et survol ---- */}
      <EditorZone
        tone="style"
        title="Disposition et apparence"
        scope="Comment les cartes se répartissent sur la page, et de quoi leur cadre a l’air, du repos au survol de la souris."
      >
        <EditorSubZone title="Grille et alignement">
          <SelectField<CardsPhotoFormat>
            label="Format des cartes"
            value={photoFormat}
            options={cardsPhotoFormatOrder.map((value) => ({
              value,
              label: cardsVariantLabels[value],
              description: cardsVariantDescriptions[value],
            }))}
            onChange={(format) => {
              if (cards.variant === "editorial") {
                // Le sélecteur ne change **que le cadrage** d'une section
                // éditoriale : la variante reste `editorial`, donc les corps de
                // texte riche restent intacts. Proposer `editorial` ici
                // reviendrait à offrir une bascule destructive.
                patch({
                  layout: { ...cards.layout, editorialFormat: format },
                });
                return;
              }
              // Les trois formats historiques portent leur cadrage dans la
              // variante : changer de format **commande** la grille (le paysage
              // n'accepte que deux colonnes), on normalise donc aussi la valeur
              // enregistrée, pour que ce qui est stocké corresponde à ce qui est
              // affiché — sans quoi le réglage masqué garderait une valeur que
              // le rendu ignorerait.
              patch({
                variant: format,
                layout: {
                  ...cards.layout,
                  columns: cardsColumnsFor(format, format, cards.layout.columns),
                },
              });
            }}
            hint={
              cards.variant === "editorial"
                ? "Ce réglage ne change que le cadrage des photos : le texte de chaque carte est conservé."
                : "Le format règle le cadrage des photos ; le reste des réglages ne change pas."
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {cardsColumnsLocked(photoFormat) ? (
              <p className="text-xs text-muted-foreground">
                {cardsVariantLabels[photoFormat]} : deux cartes par ligne, sans
                réglage — c’est ce qui laisse chaque image respirer.
              </p>
            ) : (
              <SelectField
                label="Cartes par ligne"
                value={String(cards.layout.columns)}
                options={cardsColumnOptions(cards.variant, photoFormat).map(
                  (value) => ({
                    value: String(value),
                    label: cardsColumnLabels[value],
                  })
                )}
                onChange={(value) => {
                  const columns = COLUMN_FROM_SELECT[value];
                  if (columns !== undefined) {
                    patch({ layout: { ...cards.layout, columns } });
                  }
                }}
                hint={
                  cards.variant === "editorial"
                    ? "Sur grand écran. Au-delà de 4 colonnes, la grille attend un écran de 1280 px : une photo 4:5 dans moins de 200 px ne serait plus une photo."
                    : "Sur grand écran. Sur tablette, deux cartes par ligne ; sur téléphone, une seule."
                }
              />
            )}
            <SelectField<CardsAlign>
              label="Alignement de l’en-tête"
              value={cards.layout.align}
              options={cardsAlignOrder.map((value) => ({
                value,
                label: cardsAlignLabels[value],
              }))}
              onChange={(align) => patch({ layout: { ...cards.layout, align } })}
            />
          </div>
          {/* Proportions de la photo : elles n'ont de sens qu'en paysage. */}
          {photoFormat === "landscape" ? (
            <SelectField<CardsLandscapeRatio>
              label="Proportions de la photo"
              value={cards.layout.landscapeRatio}
              options={CARDS_LANDSCAPE_RATIOS.map((value) => ({
                value,
                label: cardsLandscapeRatioLabels[value],
              }))}
              onChange={(landscapeRatio) =>
                patch({ layout: { ...cards.layout, landscapeRatio } })
              }
              hint="Format horizontal des visuels. Les photos d’exemple prennent ce cadrage à l’ajout."
            />
          ) : null}
        </EditorSubZone>

        <EditorSubZone title="Cadre de la photo">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Arrondi des coins (px)"
              type="number"
              value={String(cards.style.radius)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 40);
                if (parsed !== null) {
                  patch({ style: { ...cards.style, radius: parsed } });
                }
              }}
              hint="0 = coins droits (0 à 40)."
            />
            <SelectField
              label="Ombre portée"
              value={cards.style.shadow}
              options={galleryShadowOrder.map((value) => ({
                value,
                label: galleryShadowLabels[value],
              }))}
              onChange={(shadow) =>
                patch({ style: { ...cards.style, shadow } })
              }
            />
          </div>

          <SwitchField
            label="Bordure autour de la photo"
            description="Un trait fin souligne le cadre de chaque carte."
            checked={cards.style.border.enabled}
            onChange={(enabled) =>
              patch({
                style: { ...cards.style, border: { ...cards.style.border, enabled } },
              })
            }
          />
          {cards.style.border.enabled ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Épaisseur du trait (px)"
                type="number"
                value={String(cards.style.border.width)}
                onChange={(value) => {
                  const parsed = parseBounded(value, 0, 24);
                  if (parsed !== null) {
                    patch({
                      style: {
                        ...cards.style,
                        border: { ...cards.style.border, width: parsed },
                      },
                    });
                  }
                }}
                hint="De 0 à 24 px."
              />
              <ColorField
                label="Couleur du trait"
                value={cards.style.border.color}
                fallback={cards.style.border.color}
                ariaLabel="Couleur de la bordure des cartes"
                onChange={(color) =>
                  patch({
                    style: { ...cards.style, border: { ...cards.style.border, color } },
                  })
                }
              />
            </div>
          ) : null}
        </EditorSubZone>

        <EditorSubZone title="Bloc de texte">
          <p className="text-xs text-muted-foreground">
            Le bloc clair posé sur le bas de la photo, qui porte le titre, le
            texte et le bouton. La couleur de son filet est celle de l’accent du
            thème : elle suit donc le mode sombre du site sans réglage.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Arrondi du bloc (px)"
              type="number"
              value={String(cards.style.bodyRadius)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 200);
                if (parsed !== null) {
                  patch({ style: { ...cards.style, bodyRadius: parsed } });
                }
              }}
              hint="0 = angles droits ; 2 = gabarit d’origine (0 à 200)."
            />
            <TextField
              label="Épaisseur du filet (px)"
              type="number"
              value={String(cards.style.bodyBorderWidth)}
              onChange={(value) => {
                const parsed = parseBounded(value, 1, 24);
                if (parsed !== null) {
                  patch({ style: { ...cards.style, bodyBorderWidth: parsed } });
                }
              }}
              hint="De 1 à 24 px. Le filet est toujours présent."
            />
          </div>
        </EditorSubZone>

        <EditorSubZone title="Bouton des cartes">
          <p className="text-xs text-muted-foreground">
            L’aspect des boutons est <strong>commun à toute la section</strong> :
            trois boutons d’aspects différents dans une même rangée se liraient
            comme trois éléments de nature différente, alors qu’ils ont le même
            rôle. Le <strong>libellé</strong> et la <strong>destination</strong>,
            eux, se règlent carte par carte — c’est leur contenu.
          </p>
          <SwitchField
            label="Afficher les boutons"
            description="Désactivé, les cartes présentent sans appel à l’action. Les libellés et destinations sont conservés : les réactiver les fait réapparaître à l’identique."
            checked={cards.style.ctaShow}
            onChange={(ctaShow) => patch({ style: { ...cards.style, ctaShow } })}
          />
          {/* Un réglage sans objet est un piège : le style n'est proposé que si
              les boutons sont affichés. La valeur, elle, est conservée. */}
          {cards.style.ctaShow ? (
            <SelectField
              label="Style des boutons"
              value={cards.style.ctaStyle}
              options={[
                { value: "primary", label: "Principal" },
                { value: "secondary", label: "Secondaire" },
                { value: "outline", label: "Contours" },
              ]}
              onChange={(ctaStyle) => patch({ style: { ...cards.style, ctaStyle } })}
              hint="S’applique aux boutons de toutes les cartes de cette section."
            />
          ) : null}
        </EditorSubZone>

        <EditorSubZone title="Au survol de la photo">
          <p className="text-xs text-muted-foreground">
            La carte n’étant pas cliquable, aucun effet ne suggère un clic : ils
            portent tous sur la photo. Ils ne se déclenchent que sur un appareil
            doté d’une souris — et lorsque le visiteur sélectionne au clavier le
            bouton de la carte — puis sont automatiquement neutralisés si le
            système du visiteur demande de limiter les animations.
          </p>
          <TextField
            label="Zoom de la photo (%)"
            type="number"
            value={String(cards.style.hover.zoom)}
            onChange={(value) => {
              const parsed = parseBounded(value, 100, 118);
              if (parsed !== null) {
                patch({
                  style: {
                    ...cards.style,
                    hover: { ...cards.style.hover, zoom: parsed },
                  },
                });
              }
            }}
            hint="100 = aucun zoom (100 à 118)."
          />
          <SwitchField
            label="Brillance discrète"
            description="Un reflet diagonal traverse la photo."
            checked={cards.style.hover.shine}
            onChange={(shine) =>
              patch({ style: { ...cards.style, hover: { ...cards.style.hover, shine } } })
            }
          />
          <SwitchField
            label="Saturation et contraste"
            description="Les couleurs se ravivent légèrement."
            checked={cards.style.hover.saturate}
            onChange={(saturate) =>
              patch({
                style: { ...cards.style, hover: { ...cards.style.hover, saturate } },
              })
            }
          />
          <SwitchField
            label="Bordure lumineuse"
            description="Un liseré à la couleur d’accent du thème souligne le cadre."
            checked={cards.style.hover.glow}
            onChange={(glow) =>
              patch({ style: { ...cards.style, hover: { ...cards.style.hover, glow } } })
            }
          />
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 3 — les cartes ---- */}
      <EditorZone
        tone="action"
        title="Les cartes"
        scope={
          cards.variant === "editorial"
            ? "Chaque carte présentée au visiteur : sa photo, son texte mis en forme et son bouton. Leur ordre est celui de la liste ci-dessous."
            : "Chaque carte présentée au visiteur : sa photo, son titre, son texte et son bouton. Leur ordre est celui de la liste ci-dessous."
        }
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            Cartes ({cardCount})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addCard}>
            <Plus />
            Ajouter une carte
          </Button>
        </div>

        {cardList.map((card, cardIndex) => {
          const open = openCardId === card.id;
          const cardLabel = cardHeading(card);
          return (
            <div
              key={card.id}
              className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={
                    open
                      ? `Replier la carte ${cardIndex + 1}`
                      : `Déplier la carte ${cardIndex + 1}`
                  }
                  onClick={() => setOpenCardId(open ? "" : card.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      Carte {cardIndex + 1} — {cardLabel}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {cardSummary(card)}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Monter la carte ${cardIndex + 1}`}
                    title="Monter cette carte"
                    disabled={cardIndex === 0}
                    onClick={() => moveCard(card.id, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre la carte ${cardIndex + 1}`}
                    title="Descendre cette carte"
                    disabled={cardIndex === cardCount - 1}
                    onClick={() => moveCard(card.id, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Dupliquer la carte « ${cardLabel} »`}
                    title="Dupliquer cette carte"
                    onClick={() => duplicateCard(card.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Copy className="size-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la carte « ${cardLabel} »`}
                    title="Supprimer cette carte"
                    onClick={() => removeCard(card.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="grid gap-3">
                  <ArtSourceField
                    label="Photo de la carte"
                    ratio={cardsEditorRatio(
                      photoFormat,
                      cards.layout.landscapeRatio
                    )}
                    tip="Format identique pour toutes les cartes : c’est lui qui aligne les lignes de la grille."
                    value={card.media}
                    onChange={(media) =>
                      isEditorialCard(card)
                        ? updateEditorialCard(card.id, { media })
                        : updatePhotoCard(card.id, { media })
                    }
                  />
                  {isEditorialCard(card) ? (
                    // Un seul éditeur riche monté à la fois : seul le corps de la
                    // carte dépliée existe à l'écran, même avec six cartes.
                    <RichTextBlockEditor
                      doc={card.body}
                      label={`Carte ${cardIndex + 1} — texte`}
                      allowedStyles={CARDS_RICH_TEXT_STYLES}
                      onChange={(body) => updateEditorialCard(card.id, { body })}
                    />
                  ) : (
                    <>
                      <TextField
                        label="Titre de la carte (H3)"
                        value={card.title}
                        placeholder="Ex. Mariage"
                        onChange={(title) => updatePhotoCard(card.id, { title })}
                      />
                      <TextAreaField
                        label="Texte"
                        value={card.text}
                        rows={3}
                        hint="Les retours à la ligne sont conservés à l’affichage."
                        onChange={(text) => updatePhotoCard(card.id, { text })}
                      />
                    </>
                  )}
                  {renderCardCta(card)}
                </div>
              ) : null}
            </div>
          );
        })}

        {cardCount === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucune carte. Cliquez sur « Ajouter une carte » pour créer la
            première.
          </p>
        ) : null}
      </EditorZone>

      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => commit(createCardsContent(cards.variant))}
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
