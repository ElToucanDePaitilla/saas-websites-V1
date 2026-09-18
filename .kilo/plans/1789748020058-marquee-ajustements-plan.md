# Mini-bandeau « Alerte / Promotion » — réglage global au-dessus du Header

**Objectif :** bandeau de notification **global** (100 % largeur), fixé en haut de l'écran **au-dessus du Header** public, avec fermeture par bouton « X » qui rend au Header sa place. Réglages : hauteur, gaps haut/bas + couleur de gap, fond, typographie, mode défilant/statique, lien global.

**Ce n'est PAS une famille de module Page Builder.** Décision A (validée) : c'est un **réglage global du site**, rendu par le layout front-office, calqué sur le patron existant « Identité visuelle / Logo » (`site_visual_identity`). Conséquence : **aucun point d'intégration** `PageModuleType` / `moduleCatalog` / `moduleTypeEnum` / `moduleIcon` / `PageModuleRenderer` n'est touché.

---

## Décisions validées

| # | Sujet | Décision |
|---|---|---|
| D1 | Portée | **Réglage global** (1 ligne par photographe), visible sur toutes les pages front-office. Pas de ciblage par page. |
| D2 | Gaps | **Barre + gaps autour** : total = `gapHaut + hauteur + gapBas` ; la barre porte le fond, les gaps portent la **couleur de gap**. C'est ce total qui décale Header et `main`. |
| D3 | Fermeture | **Session navigateur** (`sessionStorage`, clé par photographe) : fermé jusqu'à la fin de l'onglet, réapparaît à la visite suivante. Non persisté en BDD. |
| D4 | Lien | **Convention du projet** : `NavLink` + `LinkTargetSelect`, mode **dérivé de `href`** (`http(s)` → nouvel onglet automatique, page/ancre → défilement compensé, `mailto:`/`tel:` → `<a>` simple). **Aucun booléen « nouvel onglet ».** |
| D5 | Vitesse | Mode défilant par défaut, réglage **« Durée d'un cycle » borné 18–30 s** (défaut 24). |

Décisions d'implémentation (assumées, à revoir en recette) : bouton « X » **toujours présent** (spec) ; message = **une seule chaîne** (typographie appliquée au tout) ; police = **police de corps du site** (pas de choix de famille) ; pas de dates d'expiration ; fond **couleur uniquement** (aucun média).

---

## Modèle de données — `src/lib/top-banner.ts` (pur, importable serveur + client)

```ts
export type TopBannerTextMode = "marquee" | "static";
export type TopBannerFontWeight = "400" | "500" | "600" | "700";
export type TopBannerLetterSpacing = "tight" | "normal" | "wide" | "wider";

export interface TopBannerGapSetting { enabled: boolean; value: number; } // value 0..15

export interface TopBanner {
  enabled: boolean;
  text: string;
  height: number;              // 15..50, défaut 32
  gapTop: TopBannerGapSetting;    // défaut { enabled:false, value:0 }
  gapBottom: TopBannerGapSetting; // défaut { enabled:false, value:0 }
  gapColor: BannerColorSettings;  // réutilise BannerColorSettings (thème | custom)
  background: BannerColorSettings;
  textColor: BannerColorSettings;
  fontSize: number;            // 11..16, défaut 12
  fontWeight: TopBannerFontWeight;      // défaut "500"
  letterSpacing: TopBannerLetterSpacing; // défaut "normal"
  textMode: TopBannerTextMode;          // défaut "marquee"
  durationSeconds: number;     // 18..30, défaut 24
  linkEnabled: boolean;        // défaut false
  linkHref: string;
}
```

- Réutilise `BannerColorSettings` / `BannerThemeToken` / `bannerThemeTokenOrder/Labels` (`src/lib/pages.ts:3208`) et `bannerColorCssValue` (`src/lib/banner-effects.ts:22`). Défauts proposés : `background = {source:"theme", token:"text-color"}`, `textColor = {source:"theme", token:"bg-color"}`, `gapColor = {source:"theme", token:"bg-color"}` (contraste garanti dans les deux thèmes).
- Catalogues : `topBannerFontWeightOrder/Labels`, `topBannerLetterSpacingOrder/Labels` (valeurs em : `tight -0.01em`, `normal 0.02em`, `wide 0.08em`, `wider 0.14em`), `topBannerTextModeOrder/Labels` (« Défilant », « Statique »).
- Helpers : `DEFAULT_TOP_BANNER`, `createDefaultTopBanner()`, `topBannerTotalHeight(banner)` (`height + gaps actifs`), `topBannerVisible(banner)` (`enabled && text.trim() !== ""`), `normalizeTopBanner(raw)` **tolérant** (mêmes idiomes que `normalizeVisualIdentity` : bornes via lecture numérique, énumérations validées, jamais d'exception ; ne « ressuscite » jamais de texte).
- Le champ `linkLabel` n'existe pas : le texte du bandeau **est** le nom accessible du lien.

## Points d'intégration (checklist exhaustive)

| Fichier | Modification |
|---|---|
| `src/lib/top-banner.ts` | **créé** (domaine ci-dessus) |
| `src/lib/top-banner-store.ts` | **créé** — store singleton + `useTopBanner()` (copie du motif `visual-identity-store.ts`) |
| `src/db/schema.ts` | table `siteTopBanner` (`site_top_banner`) : `photographerId` PK/FK → `profiles.id` cascade, `data jsonb $type<TopBanner>()` défaut `'{}'`, `created_at`, `updated_at` |
| `drizzle/0012_*.sql` | généré par `npm run db:generate` ; **éditer à la main** pour ajouter les 4 politiques RLS owner-only, copiées de `drizzle/0004_steady_mikhail_rasputin.sql:20-42` (aucune lecture `anon`) |
| `src/lib/schemas/persistence.ts` | `TopBannerSchema` (Zod) + `export type TopBannerPayload` |
| `src/db/repositories/top-banner.repository.ts` | **créé** — `getTopBanner(photographerId)` (décode + `normalizeTopBanner` + `safeParse`, `null` si absente) ; `upsertTopBanner` (onConflictDoUpdate, `updated_at = now()`) |
| `src/db/load-initial-data.ts` | `SiteInitialData.topBanner?: TopBanner` ; chargé via `getTopBanner(photographerId)` dans le `try` |
| `src/app/api/top-banner/route.ts` | **créé** — `GET`/`PUT` calqués sur `src/app/api/visual-identity/route.ts` |
| `src/lib/persistence-client.ts` | `persistTopBanner(value)` (PUT `/api/top-banner`) |
| `src/components/backoffice/top-banner/TopBannerProvider.tsx` | **créé** — hydratation + persistance débouncée 400 ms (copie de `VisualIdentityProvider`) |
| `src/components/backoffice/top-banner/TopBannerScreen.tsx` | **créé** — écran d'édition + aperçu en direct |
| `src/app/(back-office)/admin/bandeau-alerte/page.tsx` | **créé** — rend `<TopBannerScreen/>` |
| `src/components/backoffice/SidebarNav.tsx` | entrée `{ label: "Bandeau d'alerte", href: "/admin/bandeau-alerte", icon: Megaphone }` après « Identité visuelle / Logo » |
| `src/components/layout/TopBannerChrome.tsx` | **créé** — Client Component : lit le store, gère la fermeture session, calcule le décalage, rend la barre + un wrapper portant `--top-banner-offset` |
| `src/app/(front-office)/layout.tsx` | envelopper Header + `main` dans `TopBannerProvider` + `TopBannerChrome` ; `main` passe de `pt-20` à `paddingTop: calc(5rem + var(--top-banner-offset, 0px))` |
| `src/components/layout/Header.tsx` | `fixed` : ajouter `style={{ top: "var(--top-banner-offset, 0px)" }}` |
| `src/components/common/NavLink.tsx` | `scrollToHashId` : offset = `HEADER_OFFSET + valeur de --top-banner-offset` (lu sur `documentElement`, 0 si absent) |
| `src/app/globals.css` | section `.top-banner*` hors `@layer` + `@keyframes top-banner-scroll` |
| `CHANGELOG.md` | entrée (tâche, écarts, mesures, fichiers) |

## Mécanique de placement (SSR-correct, sans flash)

- `<TopBannerChrome>` rend `<div style={{ "--top-banner-offset": `${offset}px` }}>` autour de `Header` + `main`. Les éléments `fixed` **héritent** des variables CSS du wrapper : le Header lit donc la variable même s'il est hors flux.
- `offset = (!visible || dismissed) ? 0 : topBannerTotalHeight(banner)`. La fermeture met `dismissed = true` → l'offset passe à 0 → le Header remonte.
- La barre est `position: fixed; top: 0; z-index: 60` (au-dessus du Header `z-50`).
- Lire `dismissed` : `useState(false)` + `useEffect` sur `sessionStorage` clé `top-banner-dismissed:${photographerId}` (le layout transmet `photographerId`). **Limite assumée** : à un rechargement après fermeture, le bandeau peut apparaître une frame avant l'effet (pas de mismatch d'hydratation).
- En complément, le composant pose la même variable sur `document.documentElement` (effet) pour que `NavLink` la lise au clic.

## Rendu public de la barre

- Si `!topBannerVisible(banner)` → **rien** (pas de barre vide, offset 0).
- Variables inline sur `.top-banner` : `--top-banner-height`, `--top-banner-gap-top`, `--top-banner-gap-bottom`, `--top-banner-bg`, `--top-banner-gap-color`, `--top-banner-text`, `--top-banner-font-size`, `--top-banner-font-weight`, `--top-banner-letter-spacing`, `--top-banner-duration` (idiome `CSSVars`).
- Zones : `role="region" aria-label="Bandeau d'information"`.
- **Statique** : texte centré, `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (barre de 15–50 px : une ligne). Limite assumée.
- **Défilant** : deux groupes identiques animés `translate3d(-100%, 0, 0)` (motif éprouvé du module 14.3). Chaque groupe répète le texte `copies` fois, `copies = clamp(ceil(2560 / largeurEstimée), 1, 12)` — `largeurEstimée ≈ max(120, text.length × fontSize × 0.62 + 48)` — **estimation assumée** (la largeur de texte n'est pas mesurable côté serveur). Les copies au-delà de la première sont `aria-hidden` et portent `.top-banner__group--repeat`.
- **Lien** (si `linkEnabled && linkHref.trim() !== ""`) : le lien enveloppe la **zone de texte** (jamais le bouton « X »), via `NavLink` (ou `<a>` simple pour `mailto:`/`tel:`, même garde que `CTAButton.tsx:49`). Curseur `pointer` uniquement si lien actif.
- **Bouton « X »** : frère du lien, `position: absolute` à droite, `aria-label="Masquer le bandeau"`, `type="button"`. La zone de texte réserve sa place (`padding-right`) pour ne pas passer dessous.
- `prefers-reduced-motion` : animation supprimée, `.top-banner__group--repeat { display: none; }`, viewport `overflow-x: auto` (le texte reste lisible et défilable).

## Éditeur — `TopBannerScreen.tsx`

Écran d'édition (Client) branché sur `useTopBanner()`, structuré en zones (réutiliser `EditorZone`/`EditorSubZone` de `modules/EditorZone.tsx` et les champs de `modules/form-fields.tsx`) + **aperçu en direct** :

1. **Activation** — `SwitchField` « Afficher le bandeau » (défaut : désactivé).
2. **Message & affichage** — `TextField` (message), `SelectField` mode Défilant | Statique, `TextField type="number"` « Durée d'un cycle (s) » `parseBounded 18..30` (affiché seulement en défilant), aperçu.
3. **Typographie** — `TextField type="number"` taille (px, `parseBounded 11..16`), `SelectField` graisse, `SelectField` espacement, couleurs (voir zone 4).
4. **Couleurs** — trois sous-blocs (Fond, Couleur du texte, Couleur du gap) : `SelectField` origine (`theme` | `custom`), puis `SelectField<BannerThemeToken>` ou `ColorField` (pipette + palette) selon l'origine — exactement le motif de `ModuleCtaBannerEditor.tsx:312-350`.
5. **Dimensions & gaps** — `TextField type="number"` hauteur `parseBounded 15..50` ; pour chaque gap : `SwitchField` + `TextField type="number"` `parseBounded 0..15` (désactivé si toggle off, valeur conservée).
6. **Lien** — `SwitchField` « Rendre le bandeau cliquable » puis `LinkTargetSelect` (label « Destination du bandeau »).
7. **Aperçu** — rendu mini du bandeau (mêmes variables CSS/CSS compilé que le public ; pas de seconde implémentation).

## CSS — `src/app/globals.css`

Nouvelle section `MODULE « MINI-BANDEAU ALERTE / PROMO »` **hors `@layer`**, avant `Base layer` : `.top-banner` (fixed, gaps en padding, fond de gap), `.top-banner__bar` (hauteur, fond, texte, centrage, `overflow: hidden`), `.top-banner__viewport`, `.top-banner__static`, `.top-banner__link(--clickable)`, `.top-banner__group(--repeat)`, `.top-banner__close`, `@keyframes top-banner-scroll { to { transform: translate3d(-100%, 0, 0); } }`, `@media (prefers-reduced-motion: reduce)`.

## Ordre d'implémentation

1. Domaine `src/lib/top-banner.ts` + store `src/lib/top-banner-store.ts`.
2. Persistance : `schema.ts` (table) → `TopBannerSchema` → repository → `load-initial-data.ts` → `persistence-client.ts` → `api/top-banner/route.ts`.
3. `npm run db:generate` puis **ajout manuel des RLS** dans `drizzle/0012_*.sql`, puis `npm run db:migrate`.
4. Chrome public : `TopBannerChrome.tsx` + `globals.css` + `layout.tsx` + `Header.tsx` + `NavLink.tsx`.
5. Back-office : `TopBannerProvider.tsx`, `TopBannerScreen.tsx`, page `/admin/bandeau-alerte`, entrée `SidebarNav`, `TopBannerProvider` dans `admin/layout.tsx`.
6. Validation (`tsc`, `lint`, `/demo` avec un bandeau activé en BDD, CSS compilé), puis `CHANGELOG.md`.

## Validation

- `npx tsc --noEmit` → 0 ; `npm run lint` → 0 erreur / 0 avertissement.
- `npm run db:generate` → `drizzle/0012_*.sql` (table + FK + RLS owner-only) ; `npm run db:migrate` → appliquée. Contrôler en base l'existence de `site_top_banner` et de ses politiques (script `tsx`/SQL temporaire, supprimé après usage).
- **Activer** un bandeau de test pour le photographe démo via un script `tsx` temporaire (message, gaps 5/5, hauteur 40, mode défilant, lien externe `https://example.com`) puis fetch `/demo` (ou `/`) :
  - `.top-banner` présent, message présent, bouton `aria-label="Masquer le bandeau"` présent ;
  - wrapper portant `--top-banner-offset: 50px` (40 + 5 + 5) ; Header portant `top: var(--top-banner-offset, 0px)` ; `main` portant `paddingTop: calc(5rem + var(--top-banner-offset, 0px))` ;
  - lien externe : `<a … target="_blank" rel="noopener noreferrer"` ; **sans** `linkEnabled`, aucun `<a>` autour du texte et curseur non `pointer` ;
  - mode défilant : ≥ 2 `.top-banner__group` ; mode statique : `.top-banner__static` unique ;
  - page `<h1>` inchangé (= 1 sur `/demo`).
  - **Nettoyer** la ligne de test après validation (remettre `enabled: false` ou supprimer la ligne).
- **CSS compilé** (chunk extrait du HTML puis téléchargé) : `.top-banner` porte `position: fixed`, `.top-banner__group` porte `animation: top-banner-scroll … var(--top-banner-duration…`, `@keyframes top-banner-scroll` présent, `prefers-reduced-motion` masque `.top-banner__group--repeat`.
- **Recette navigateur** (non mesurable ici) : fermeture → Header remonte ; rechargement dans le même onglet → reste fermé (session) ; gaps colorés, typographie, statique vs défilant, `prefers-reduced-motion`, ancres `#id` correctement compensées sous le bandeau.
- `npm run build` non lancé tant que le serveur de développement occupe le port 3000.

## Risques et pièges

- **Header `fixed` + variable CSS d'un wrapper non ancêtre en flux** : les variables CSS s'héritent dans l'arbre DOM, pas dans l'arbre de rendu — le wrapper doit bien contenir Header et `main`.
- **`NavLink` lit `documentElement`** : la variable y est posée par effet (post-hydratation) ; les clics n'ont lieu qu'après, aucun impact SSR.
- **Flash à la fermeture mémorisée** : `sessionStorage` n'est lisible qu'après montage ; le bandeau peut apparaître une frame. Assumé (pas de script inline).
- **Répétition du texte défilant** : estimation de largeur ; si elle est fausse, la boucle peut montrer un trou — plafond 12 copies et filet `min-width: 100%` sur le groupe.
- **Barre très basse (15 px) + police 16 px** : la police peut dépasser ; le CSS rogne (`overflow: hidden`), l'aide de l'éditeur le signale.
- **Texte statique long** : tronqué (`ellipsis`) à une ligne — conséquence de la hauteur bornée.
- **RLS oubliée** : la table doit être owner-only ; une politique manquante casse l'écriture depuis le Back-Office (400/500) sans casser `tsc`.
- **`sessionStorage` par photographe** : la clé embarque l'id du photographe (transmis par le layout) ; un même navigateur sur deux tenants ne partage pas la fermeture.

## Hors périmètre

- Famille de module Page Builder, ciblage par page, dates d'expiration, planification, A/B, analytics.
- Fond média (photo/vidéo/slider), icône, texte riche, choix de police.
- Variante par appareil, bannière sur l'écran d'onboarding (site vide, sans Header).
- Persistance de la fermeture en BDD.
