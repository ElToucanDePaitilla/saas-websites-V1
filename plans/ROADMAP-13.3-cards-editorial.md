# Étape 13.3 — Cards « texte structuré » (variante `editorial`)

## 1. Objectif

Une quatrième entrée de catalogue, **« Cards — texte structuré »** : les mêmes
cartes que les trois formats existants, mais dont le **corps est un document en
texte riche** (sous-titres, paragraphes, listes à puces et numérotées, gras,
italique, souligné, lien), avec :

- **2 à 6 cartes par ligne** (les trois formats photo restent plafonnés à 4) ;
- **uniformité des hauteurs** — déjà acquise, rien à coder ;
- un **CTA par défaut, activable/désactivable pour toute la section** ;
- le **chapeau de section inchangé** : titre + sous-titre + introduction.

## 2. Décisions arrêtées

| Sujet | Décision |
|---|---|
| Nature | **4ᵉ variante de `cards`**, pas une nouvelle famille → **aucune migration** d'énumération, 4 points d'intégration au lieu de 13 |
| Corps de carte | **Un seul document riche** (option A validée) : titre, sous-titre, texte, listes dans le même éditeur |
| Garde de titrage | **« Titre » (H2) retiré de la barre d'outils dans une carte** : une carte vit *dans* une section, son titre ne prime pas sur celui de la section. Niveaux offerts : Texte normal / Sous-titre (H3) / Petit titre (H4) |
| Champs de carte | `{ id, media, body: RichTextDoc, cta }` — **ni titre ni texte séparés** ; le libellé d'accordéon et le `alt` de repli se **déduisent** du document (`richTextDocToPlainText`, déjà exporté) |
| Format des photos | Réglage de **section**, déjà en place ; pour `editorial`, choisi via `layout.editorialFormat` (portrait / carré / paysage) |
| Variante immuable | Le sélecteur de format de l'éditeur **ne propose jamais `editorial`** : changer la variante détruirait les corps riches. `editorial` s'obtient par l'entrée de catalogue, comme un Hero Slider ne devient pas un Hero Vidéo |
| CTA | `style.ctaShow` au niveau de la **section** (défaut **affiché**), étendu **aux quatre variantes** ; libellé et destination restent par carte |
| Colonnes 5 et 6 | `lg:grid-cols-4 xl:grid-cols-5` / `xl:grid-cols-6` : au-delà de 4 colonnes, il faut 1280 px, sinon une photo 4:5 dans ~190 px n'est plus une photo |

## 3. Domaine — `src/lib/pages.ts`

1. **Deux axes séparés** (c'est le cœur du lot) :
   ```ts
   export type CardsPhotoFormat = "portrait" | "square" | "landscape";
   export type CardsVariant = CardsPhotoFormat | "editorial";
   ```
   Les trois formats historiques portent le format **dans leur `variant`** ;
   `editorial` le porte dans son layout.
2. `CARDS_COLUMN_COUNTS = [2, 3, 4, 5, 6]` (donc `CardsColumns = 2|3|4|5|6`),
   `cardsColumnOrder` et `cardsColumnLabels` complétés (5 et 6).
3. `CardsLayoutSettings` gagne `editorialFormat: CardsPhotoFormat` (défaut
   `portrait`), documenté « sans objet pour les trois formats historiques » —
   même statut que `landscapeRatio` aujourd'hui.
4. `CardsStyleSettings` gagne `ctaShow: boolean` (défaut `true`).
5. **Helpers qui remplacent l'usage direct du `variant` comme format** :
   - `cardsPhotoFormat(variant, editorialFormat)` → le format réellement appliqué ;
   - `cardsMediaRatio(photoFormat, landscapeRatio)` et
     `cardsEditorRatio(photoFormat, landscapeRatio)` (signature élargie) ;
   - `cardsColumnOptions(variant, photoFormat): CardsColumns[]` — les valeurs que
     l'éditeur propose (2 pour tous en paysage ; 2-4 pour les formats photo ;
     2-6 pour `editorial`) ;
   - `cardsColumnsFor(variant, photoFormat, requested)` — la valeur appliquée,
     **à la lecture comme à l'écriture** (la contrainte existante du paysage est
     conservée : `cardsColumnsLocked` se base désormais sur le photo format).
6. **Cartes** :
   ```ts
   export interface EditorialCardItem { id: string; media: ArtSource; body: RichTextDoc; cta: CardCta }
   interface CardsContentBase { type: "cards"; heading; subtitle; intro; layout; style }
   export interface CardsPhotoContent extends CardsContentBase { variant: CardsPhotoFormat; cards: CardItem[] }
   export interface CardsEditorialContent extends CardsContentBase { variant: "editorial"; cards: EditorialCardItem[] }
   export type CardsContent = CardsPhotoContent | CardsEditorialContent;
   ```
7. **Fabriques** : `createEditorialCardItem(index)` (document d'exemple : un
   sous-titre H3, un paragraphe, une liste à puces, une liste numérotée) et
   `createCardsContent("editorial")` → 3 cartes, `ctaStyle`/`ctaShow` par défaut.
8. **Résolveur** : `resolveCardsContent` devient tolérant aux deux formes.
   `body` absent → `{ type: "doc", content: [] }` ; listes de cartes et champs
   manquants traités comme aujourd'hui ; `editorialFormat` et `ctaShow` (tous deux
   **optionnels**) complétés par les défauts ⇒ **aucune reprise de données**.
   `cardsImageSources` reste inchangé (il travaille sur la base commune).
9. **Catalogue** : 4ᵉ entrée `{ id: "cards-editorial", type: "cards", variant:
   "editorial", label: "Cards — texte structuré", category: "Présentation",
   description: … }`. `cardsVariantLabels.editorial = "Texte structuré"`,
   `cardsVariantDescriptions.editorial` en une phrase.
10. `createModuleContent` : `case "cards"` accepte la quatrième variante
    (déjà écrit pour lire le variant — une ligne à élargir).

## 4. Rendu — `src/components/modules/cards/`

1. `CardsModule.tsx` :
   - `COLUMN_CLASSES` s'étend à 5 et 6 (`lg:grid-cols-4 xl:grid-cols-N`) ;
   - aiguillage `content.variant === "editorial"` → `EditorialCardItem` ;
   - `sizes` de la photo devient `(min-width:1280px) {100/columns}vw,
     (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw` : à 5-6 colonnes la
     largeur réelle change au palier `lg`, un `sizes` en deux paliers
     sous-dimensionnerait les images ;
   - `ctaShow` transmis à la carte.
2. `CardItem.tsx` : la prop `ctaShow` conditionne le rendu du bouton (le `cta`
   par carte est conservé tel quel : le masquer ne doit rien effacer).
3. **Nouveau** `EditorialCardItem.tsx` : `data-format`, cadre (rayon/ombre/
   bordure), survol et variables CSS **identiques** à `CardItem`, puis
   `<RichTextRenderer doc={card.body} className="cards-card__rich" />` à la place
   du titre et du texte.
   - `alt` de l'image : `media.alt` sinon le texte brut du document tronqué.

## 5. Styles — `src/app/globals.css`

1. **Portée rétrécie de `.rich-content` dans une carte** — indispensable :
   `.rich-content h2/h3/h4` prend aujourd'hui `--h2-size` / `--h3-size` /
   `--h4-size`, c'est-à-dire des tailles de **section**. Dans une carte :
   ```css
   .cards-card__rich :where(h2, h3, h4) { font-size: clamp(1rem, 0.9rem + 0.5vw, var(--h3-size)); }
   .cards-card__rich :where(h4) { font-size: clamp(0.9rem, …) }
   .cards-card__rich :where(p, li) { font-size: clamp(0.8125rem, …, 0.9375rem); }
   .cards-card__rich :where(ul, ol) { padding-left: 1.1rem; margin-bottom: 0.6rem; }
   ```
   (Les valeurs exactes reprennent l'échelle des cartes déjà en place :
   `.cards-card__title` et `.cards-card__text`.)
2. Le H2 n'est jamais produit par l'éditeur dans une carte (garde §3) ; la règle
   ci-dessus le couvre quand même, par tolérance de lecture d'un contenu écrit à
   la main — même principe que `RichTextRenderer` qui sait rendre du code sans
   que l'éditeur puisse en produire.
3. Rappel : `.rich-content` pose déjà `color: var(--text-muted)` et
   `0.9375rem / 1.7`, ce qui correspond au texte de carte actuel — la carte n'a
   donc rien à redéfinir sur ces deux points.

## 6. Éditeur

1. **Garde de la barre d'outils** — `RichTextBlockEditor` et `RichTextToolbar`
   gagnent une prop **optionnelle** `allowedStyles?: RichTextStyleValue[]` qui
   filtre `RICH_TEXT_STYLE_OPTIONS` (défaut : toutes, donc le module « Contenu en
   colonnes » ne change pas d'un pixel). Dans une carte : `paragraph`, `h3`, `h4`.
2. `ModuleCardsEditor.tsx` :
   - le sélecteur de format utilise une liste **photo** (`cardsPhotoFormatOrder`)
     qui écrit `variant` pour les trois formats historiques et
     `layout.editorialFormat` pour `editorial` — jamais `editorial` ;
   - « Cartes par ligne » lit `cardsColumnOptions(...)` (2-6 en `editorial`) ;
   - sous-formulaire d'une carte `editorial` : image, **éditeur riche**, libellé
     et destination du bouton (le style reste commun à la section) ;
   - le libellé d'accordéon d'une carte `editorial` est le début de
     `richTextDocToPlainText(body)` (repli « Carte sans texte ») ;
   - sous-bloc « Bouton des cartes » : `SwitchField` **« Afficher les boutons »**
     → `style.ctaShow`, et le sélecteur de style n'est proposé **que si l'affichage
     est actif** (un réglage sans objet est un piège) ; les libellés et
     destinations par carte sont conservés quand on masque.
   - l'export/duplication d'une carte `editorial` duplique son document
     (copie profonde, comme les autres champs composites).

## 7. Données de démonstration — `/demo`

Un 4ᵉ module `demoCardsModule(10, "editorial", …)` avec un document d'exemple
(sous-titre H3, paragraphe, liste à puces, liste numérotée) et **`ctaShow: false`
sur la section carrée existante**, pour montrer l'interrupteur de CTA à l'œuvre
sur une autre section que celle du nouveau contenu.

## 8. Points à NE PAS toucher (bénéfice de la variante)

- `src/db/schema.ts` (`moduleTypeEnum`) et `moduleTypeSchema` : **aucun changement**.
- `ModuleIcon` : la famille ne change pas.
- `PageModuleRenderer`, `ModuleContentEditor` : une branche de famille, pas de
  nouvelle famille.
- `collectImageUrls` / `publicOgImage` : déjà branchés sur `cards`.
- Le comportement des trois formats photo, hormis le plafond de colonnes ramené
  à 4 et le nouveau `ctaShow` (défaut affiché ⇒ aucun changement visible).

## 9. Risques et cas limites

- **Perte de contenu à la bascule de format** : traitée en rendant `editorial`
  inatteignable depuis le sélecteur (§2). À vérifier explicitement à la recette.
- **`sizes` à 5-6 colonnes** : corrigé par le `sizes` multi-paliers (§4.1).
- **Éditeur riche dans un accordéon imbriqué** : replier une carte démonte
  l'éditeur Tiptap. Le composant **flush au démontage** (déjà en place, 12.1) —
  point à vérifier en recette : taper puis replier immédiatement ne doit rien
  perdre.
- **Performance** : une seule carte est dépliée à la fois ⇒ un seul Tiptap monté,
  même avec 6 cartes.
- **Titrage** : les cartes contribuent des `h3`/`h4` (jamais de `h2`) ; le compte
  de `h1` de la page reste 1 (audit déjà en place).
- **`publicDescription`** : pour une page ne contenant que des cartes éditoriales,
  la description de partage doit venir de `richTextDocToPlainText` du premier
  document — modification de `src/lib/public-page.ts` (§10), à contrôler par
  relecture puisque `/demo` ne passe pas par cette fonction.

## 10. Vérifications

1. `npx tsc --noEmit` → 0 ; `npm run lint` → 0 erreur, 0 avertissement.
2. `/demo` → 200, **quatre** sections Cards :
   - `data-format` correct par section ; ratios posés (4:5, 1:1, 3:2) ;
   - la section `editorial` rend `h3`/`h4`/`p`/`ul`/`ol` ;
   - la section carrée ne contient **aucun** bouton (interrupteur de CTA à `false`) ;
   - aucun `lg:grid-cols-4` sur une section en paysage (contrainte conservée) ;
   - classes `xl:grid-cols-5`/`6` présentes uniquement si le réglage les demande.
3. **Audit de titrage** sur `/demo` : `h1` = 1, aucun `h2` issu d'une carte,
   comptage des `h3`/`h4` cohérent avec les documents d'exemple.
4. **CSS servi** : les règles `.cards-card__rich` sont bien émises (portée
   rétrécie), et `.rich-content` hors carte est **inchangé**.
5. **Recette humaine** : hauteurs de pieds égales avec des corps de longueurs
   différentes, boutons alignés en bas, texte riche lisible dans une carte
   étroite, listes indentées correctement, bascule de format sans perte de
   contenu, repli d'une carte après saisie sans perte.
6. `CHANGELOG.md` daté (mesures avant/après incluses).

## 11. Hors périmètre

- Pas de migration de données : `text` (texte simple) reste le corps des trois
  formats photo ; aucune conversion rétroactive vers le texte riche.
- Pas de conversion d'une section existante vers `editorial` (on en ajoute une).
- Pas d'images ni d'icônes **à l'intérieur** du document riche (le module
  « Contenu en colonnes » sait le faire via ses blocs ; ici le corps est un seul
  document texte).
