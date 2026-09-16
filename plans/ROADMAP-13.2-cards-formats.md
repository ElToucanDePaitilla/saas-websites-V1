# Étape 13.2 — Pieds de carte : arrondi, équilibre et formats

## 1. Demandes

1. **Pieds de hauteur uniforme** — le bloc clair (titre + texte + bouton) prend la
   hauteur du plus haut de **sa ligne**.
2. **Bouton plaqué au bas du pied** — l'espace excédentaire se loge entre le
   texte et le bouton, jamais sous le bouton.
3. **Équilibre vertical** — la marge sous le bouton est égale à la marge
   au-dessus du titre.
4. **Photo pleine** — les photos remplissent leur cadre (`object-fit: cover`).
5. **Deux nouveaux formats** (carré, paysage) en plus du portrait, le paysage
   n'affichant que **2 cartes par ligne**.
6. **Arrondi et épaisseur du filet du bloc** réglables (jusqu'ici figés : 2 px
   d'arrondi, 2 px de filet à la couleur d'accent).

## 2. Réglages ajoutés (optionnels ⇒ aucune migration)

| Réglage | Type | Plage | Défaut | Emplacement |
|---|---|---|---|---|
| Arrondi du bloc de pied | nombre | 0 – 200 px | 2 px | `style.bodyRadius` |
| Épaisseur du filet du bloc | nombre | 1 – 24 px | 2 px | `style.bodyBorderWidth` |
| Proportions de la photo en paysage | choix | 3:2 / 4:3 / 16:9 | 3:2 | `layout.landscapeRatio` |

- La **couleur** du filet reste la couleur d'accent du thème : le bloc suit donc
  le mode sombre sans réglage supplémentaire.
- Les trois champs sont **optionnels dans le schéma Zod** et complétés par le
  résolveur : les cartes enregistrées en 13.1 s'affichent avec 2 px / 2 px / 3:2,
  sans reprise de données (même technique que `hoverEffects` en 11.23).

## 3. Mécanique CSS

| Demande | Moyen | Pourquoi |
|---|---|---|
| 1 | `.cards-card__body { flex: 1 1 auto }` | La grille étire l'article à la hauteur de la ligne ; `auto` (et non `0`) pour ne jamais compresser le texte. |
| 2 | `.cards-card__cta { margin-top: auto; padding-top: 0.875rem }` | Dans un conteneur en colonne, `auto` absorbe l'espace restant **avant** le bouton. |
| 3 | `padding-block: var(--cards-inset)` | Une seule valeur pour les deux marges : elles ne peuvent pas diverger. |
| 4 | `.cards-card__frame :where(img) { width: 100%; height: 100%; object-fit: cover }` | Garantie **structurelle**, valable aussi sur le repli `<img>` natif des URL non optimisables, où aucune classe utilitaire ne s'applique. |

Les valeurs pilotées par les réglages (ratio, arrondi du bloc, épaisseur du
filet) arrivent en **style en ligne** ; les constantes de gabarit (chevauchement
2,5 rem, marge symétrique 15 px, filet à la couleur d'accent) restent dans la
feuille de styles.

## 4. Formats

| Format | Ratio photo | Cartes par ligne |
|---|---|---|
| Portrait (existant) | 4:5 fixe | 2 / 3 / 4 au choix |
| Carré | 1:1 fixe | 2 / 3 / 4 au choix |
| Paysage | 3:2 / 4:3 / 16:9 au choix | **2 imposées** (réglage masqué) |

- Le chevauchement du bloc clair reste la signature : identique dans les trois.
- Changer de format **conserve les cartes** ; seuls le ratio et les colonnes
  changent.
- `variant: "classic"` (contenus 13.1) est **traduit en `portrait` à la lecture**.
- Les 2 colonnes du paysage sont appliquées **à la lecture et à l'écriture**.

## 5. Éditeur

Zone « Disposition et apparence » :

- **Grille et alignement** : format des cartes · proportions de la photo
  (paysage seulement) · cartes par ligne (masqué en paysage, remplacé par une
  note) · alignement de l'en-tête ;
- **Cadre de la photo** : arrondi, ombre, bordure du cadre (13.1, inchangé) ;
- **Bloc de texte** *(nouveau)* : arrondi du bloc · épaisseur du filet ;
- **Au survol de la photo** : inchangé.

## 6. Fichiers touchés

- `src/lib/pages.ts` — variantes, ratios, colonnes forcées, gardes, replis des
  nouveaux champs, fabriques et résolveur par format ; catalogue : trois entrées.
- `src/lib/schemas/persistence.ts` — union discriminée + champs optionnels.
- `src/app/globals.css` — pied élastique, bouton en bas, marges symétriques,
  `object-fit`, arrondi et filet du bloc lus depuis le contenu.
- `src/components/modules/cards/CardItem.tsx`, `CardsModule.tsx`.
- `src/components/backoffice/pages/modules/ModuleCardsEditor.tsx`,
  `ArtSourceField.tsx` (ratios `1:1`, `3:2`, `16:9`).
- `src/app/(front-office)/demo/page.tsx` — un module par nouveau format.

## 7. Vérifications

- `npx tsc --noEmit`, `npm run lint`.
- `/demo` : trois sections Cards ; `aspect-ratio` réellement posé par format ;
  **paysage rendu en 2 colonnes alors que le contenu stocke 4** (le démonstrateur
  le stocke volontairement à 4 pour éprouver la normalisation) ; `object-fit`
  appliqué à toutes les images ; `border-radius` et `border-width` du bloc lus
  depuis le contenu.
- **Recette humaine** : hauteurs de pieds égales dans une ligne, boutons alignés
  en bas, aucun vide dans les cadres, arrondi et filet visibles.
- `CHANGELOG.md` daté.

---

## 8. Amendement du 2026-09-15 — Bouton commun à la section, libellé multiligne

### 8.1 Demandes

1. **Le style du bouton est identique pour toutes les cartes d'une section** : il
   devient un réglage de section, dans « Disposition et apparence », et
   **disparaît** du paramétrage individuel de chaque carte.
2. **Retour à la ligne automatique** du libellé, avec des marges gauche/droite
   **identiques** entre le texte et le bord du bouton, et des marges
   gauche/droite **identiques** entre le bouton et son conteneur.

### 8.2 Modélisation

| Élément | Avant (13.1) | Après |
|---|---|---|
| Style du bouton | `card.cta.style` — **par carte** | `style.ctaStyle` — **par section** (défaut `primary`) |
| Libellé | `card.cta.label` | inchangé — c'est du **contenu**, donc par carte |
| Destination | `card.cta.href` | inchangée — par carte |

- `CardCta` se réduit à `{ label, href }`.
- **Aucune migration** : les contenus déjà enregistrés portent un `cta.style` par
  carte, que le résolveur **cesse de lire** (champ surnuméraire inoffensif en
  JSONB). Tous les boutons déjà enregistrés sont en `primary` : le rendu ne
  change donc pas d'un pixel.
- Le style commun est résolu avec la même garde que partout (`isHeroCtaStyle`) et
  retombe sur `primary`.

### 8.3 Éditeur

- **Retiré** : le `SelectField` « Style » du sous-formulaire de chaque carte.
- **Ajouté** : sous-bloc **« Bouton des cartes »** dans la zone « Disposition et
  apparence » (après « Bloc de texte »), contenant le style du bouton, avec une
  phrase de portée qui dit que le **libellé et la destination restent carte par
  carte** — c'est leur contenu, et deux cartes mènent rarement au même endroit.
- Le sous-formulaire d'une carte conserve donc : photo, titre, texte, libellé,
  destination — plus un renvoi vers le réglage commun pour le style.

### 8.4 CSS — libellé multiligne et marges symétriques

Sur `.cards-card__cta :where(a, button)` — portée limitée aux cartes : le bouton
des héros et des galeries garde son `nowrap`, qui y est souhaitable.

```css
white-space: normal;      /* le libellé passe à la ligne */
height: auto;             /* la hauteur fixe de la variante « sm » couperait la 2e ligne */
min-height: 2rem;         /* un libellé d'une ligne garde la hauteur des autres */
padding: 0.5rem 1rem;     /* marges gauche/droite du texte IDENTIQUES */
text-wrap: balance;       /* deux lignes équilibrées plutôt qu'une longue + une courte */
overflow-wrap: anywhere;  /* garde-fou : aucun mot ne peut déborder du bloc */
text-align: center;
```

Sur le conteneur `.cards-card__cta`, une marge latérale garantit que le bouton
**ne touche jamais** les bords du bloc, même quand son libellé occupe toute la
largeur disponible :

```css
padding-inline: var(--cards-cta-inset, 0.25rem);
```

**Interaction avec l'alignement bas** (13.2) : `margin-top: auto` continue de
plaquer le bouton au bas du pied. Un libellé sur deux lignes rend le bouton plus
haut, mais **son bas reste aligné** sur celui des autres — l'espace excédentaire
se loge au-dessus.

### 8.5 Fichiers touchés

- `src/lib/pages.ts` — `CardCta` sans `style`, `style.ctaStyle`, fabriques et
  résolveur.
- `src/lib/schemas/persistence.ts` — `cardCtaSchema` sans `style` (le champ
  hérité reste toléré à la lecture, il est simplement ignoré) ; `ctaStyle`
  optionnel dans le style.
- `src/app/globals.css` — règles du 8.4.
- `src/components/modules/cards/CardItem.tsx` — style reçu de la section.
- `src/components/modules/cards/CardsModule.tsx` — transmet `style.ctaStyle`.
- `src/components/backoffice/pages/modules/ModuleCardsEditor.tsx` — sous-bloc
  « Bouton des cartes », retrait du style par carte.
- `src/app/(front-office)/demo/page.tsx` — un libellé volontairement long, pour
  éprouver le retour à la ligne.

### 8.6 Vérifications

- `npx tsc --noEmit`, `npm run lint`.
- `/demo` : style de bouton identique sur les trois cartes d'une section ; un
  libellé long passe sur deux lignes ; le CSS servi contient `white-space: normal`,
  `height: auto`, `padding-inline` (bloc et libellé).
- **Recette humaine** : deux lignes sans débordement, marges gauche/droite du
  texte identiques, bouton centré et détaché des bords du bloc, bas des boutons
  alignés dans une ligne.
- `CHANGELOG.md` daté.
