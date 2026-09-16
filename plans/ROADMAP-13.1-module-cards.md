# Étape 13.1 — Module « Cards »

## 1. Objectif

Nouvelle famille de modules `cards` : une liste de cartes (photo, titre, texte,
bouton) présentée en **2, 3 ou 4 cartes par ligne**, la ligne suivante se
formant naturellement.

Le gabarit fourni par le commanditaire est **figé dans son principe** (bloc
clair chevauchant le bas de la photo) : c'est la signature du template, elle
n'est pas réglable. Seuls les réglages partagés avec le reste de l'application
sont exposés.

## 2. Décisions arrêtées (cahier des charges révisé)

| Point | Décision |
|---|---|
| Identifiant de famille | `cards` (pluriel), variante unique `classic` |
| Colonnes | réglage **2 / 3 / 4** par ligne (desktop) |
| chevauchement du bloc | signature du template, **non réglable** |
| Mode de carte | **une seule carte possible : non cliquable** — seul le bouton est un lien |
| Survol | la carte conserve un effet de survol, **porté par l'image** |
| Entrée | la carte conserve une animation d'entrée (réglage générique du module) |
| Élévation de la carte | **supprimée** — une carte non cliquable ne doit pas promettre un clic |
| En-tête | titre (`h2`) + sous-titre + introduction |
| Libellé catalogue | « Cards » |

Deux points **conservés du cahier initial** : l'alignement de l'en-tête
(centré / aligné à gauche) et le texte de carte (texte simple, **sauts de ligne
préservés**, comme l'introduction de l'en-tête de « Contenu en colonnes »).

## 3. Modèle

```ts
export type CardsVariant = "classic";
export const CARDS_COLUMN_COUNTS = [2, 3, 4] as const;
export type CardsColumns = (typeof CARDS_COLUMN_COUNTS)[number];
export type CardsAlign = "left" | "center";

export interface CardCta {
  label: string;
  href: string;      // destination interne / externe / ancre
  style: HeroCtaStyle;
}

export interface CardItem {
  id: string;
  media: ArtSource;
  title: string;
  text: string;
  cta: CardCta;
}

export interface CardsHoverEffects {
  zoom: number;      // % — 100 = aucun zoom
  shine: boolean;
  saturate: boolean;
  glow: boolean;
}

export interface CardsContent {
  type: "cards";
  variant: CardsVariant;
  heading: string;   // <h2>
  subtitle: string;
  intro: string;
  layout: { columns: CardsColumns; align: CardsAlign };
  style: {
    radius: number;
    shadow: GalleryShadowLevel;
    border: GalleryBorderSettings;
    hover: CardsHoverEffects;
  };
  cards: CardItem[];
}
```

`lift` et `parallax` sont **exclus** : le premier n'a plus d'objet (carte non
cliquable), le second est bancal sur une vignette.

Résolveur tolérant `resolveCardsContent(raw: unknown)` sur le modèle de
`resolveHeroCurtainContent` : un contenu JSONB partiel ou d'une version
antérieure ne doit **jamais** produire de 500 (leçon de `heroH1Text`).

## 4. Point d'intégration — 13 points

| # | Point | Emplacement | Signalé à la compilation |
|---|---|---|---|
| 1 | `PageModuleType` | `src/lib/pages.ts` | oui |
| 2 | `CardsVariant` + `ModuleVariant` | `src/lib/pages.ts` | oui |
| 3 | `ModuleContent` (union) | `src/lib/pages.ts` | oui |
| 4 | `createModuleContent` | `src/lib/pages.ts` | oui |
| 5 | `moduleCatalog` | `src/lib/pages.ts` | non |
| 6 | `moduleIcons` | `ModuleIcon.tsx` | oui (`Record`) |
| 7 | `ModuleContentEditor` | `ModuleContentEditor.tsx` | **non → éditeur vide** |
| 8 | `PageModuleRenderer` | `PublicModules.tsx` | **non → section invisible** |
| 9 | `moduleTypeEnum` | `src/db/schema.ts` | **non** |
| 10 | `moduleTypeSchema` | `src/lib/schemas/persistence.ts` | **non → HTTP 400** |
| 11 | `cardsContentSchema` | `src/lib/schemas/persistence.ts` | à créer (miroir) |
| 12 | `collectImageUrls` + `publicOgImage` + `publicDescription` | `src/lib/public-page.ts` | non |
| 13 | Commentaires comptant les familles | `pages.ts`, `ModuleContentEditor.tsx` | non |

## 5. Migration

```sql
ALTER TYPE "public"."module_type" ADD VALUE 'cards';
```

Généré par `drizzle-kit` pour que `drizzle/meta/_journal.json` reste cohérent
(précédent : `0006_whole_puff_adder.sql`). **Seul geste non réversible** de
l'étape.

## 6. Rendu

`src/components/modules/cards/CardsModule.tsx` (serveur) + `CardItem.tsx`.

- Grille `repeat(var(--cards-columns), 1fr)`, `--cards-columns` = 2 / 3 / 4.
- **≤ 1024 px → 2 colonnes**, **≤ 640 px → 1 colonne**, quelle que soit la
  valeur choisie (le réglage décrit le desktop).
- Image `aspect-ratio: 4 / 5` (le gabarit 350×440).
- Bloc clair à 88 % de largeur, chevauchement `--card-overlap` fixe, fond
  `--surface-color`, bordure `--border-color`.
- Typographie **responsive par `clamp()`** : aucun réglage nouveau. Titre de
  section `h2` (jeton `--h2-*`), titres de cartes `h3` (jeton `--h3-*`).
- Survol : variables CSS `--hv-*` posées sur la carte, mécanique
  `globals.css` § Effets de survol — uniquement sous `hover: hover` +
  `pointer: fine`, neutralisée sous `prefers-reduced-motion`.
- Images via `MediaImage` (loader CDN conservé, transformation ≤ 2560 px).
- Animation d'entrée : réglage générique `module.animation`, aucun code nouveau.

## 7. Éditeur

`ModuleCardsEditor.tsx`, quatre `EditorZone` :

1. **En-tête de la section** (`content`) — titre, sous-titre, introduction,
   alignement ;
2. **Disposition** (`style`) — colonnes 2 / 3 / 4 ;
3. **Apparence des cartes** (`style`) — rayon, ombre, bordure, survol ;
4. **Cartes** (`action`) — liste réordonnable ↑↓, ajout / suppression /
   duplication, et par carte : image, titre, texte, libellé du bouton,
   destination (`LinkTargetSelect`), style du bouton.

## 8. Vérifications

- `npx tsc --noEmit`, `npm run lint`, `npm run build` (**serveur dev arrêté**,
  `.next` partagé).
- Les points muets exercés à la main : création → enregistrement → rechargement
  (9/10/11), rendu sur `/demo` (8), icône au catalogue (6).
- Bascule 4 / 3 / 2 / 1 colonnes ; survol réel vs tactile ;
  `prefers-reduced-motion`.
- Focus clavier : **uniquement le bouton**, jamais la carte.
- Audit `h1` / `h2` / `h3` sur `/demo` avec un module Cards.
- Absence de requête `_next/image` et transformation ≤ 2560 px sur les photos
  de cartes.
- Entrée `CHANGELOG.md` datée, avec mesures avant / après.
