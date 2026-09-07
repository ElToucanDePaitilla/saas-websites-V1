# Plan — ROADMAP Étape 6.3 : Pages Publiques Dynamiques `/[slug]`, SEO & Proxy Next 16

## Objectif

Raccorder les **modules publics** (6.2) au routeur Next.js et consolider
l'infrastructure :

1. **Routage dynamique public `/[slug]`** + ajustement de la page racine `/` ;
2. **Chargement SSR** des pages + modules depuis la BDD (`pages.repository`) avec
   **fallback démo** ;
3. Rendu dynamique via **`PageModuleRenderer`** + **`generateMetadata()`** SEO
   (titre H1, description, OpenGraph) ;
4. **Consolidation du middleware** Next 16 vers la **convention `proxy`**
   (dépréciation signalée en 6.2) ;
5. Validation `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## État actuel (constats)

- Front-Office : `/` = page statique placeholder (2.3) ; `/demo` (6.2) valide les
  renderers publics ; la navigation publique pointe vers `/portfolio`,
  `/a-propos`… qui n'existent pas encore (404).
- BDD/SSR : [`pages.repository.ts`](../src/db/repositories/pages.repository.ts)
  (`getPagesWithModules`), loader d'hydratation (`loadInitialData`), table
  `pages` (`status` published/draft), `media` (EXIF/blur) ; `DEMO_PROFILE_ID`
  = tenant public de démo ; seedPages mock en mémoire (fallback).
- `src/middleware.ts` (5.4) fonctionne mais Next 16 déprécie `middleware` au
  profit de `proxy`.

## 0. Décisions d'architecture (à valider)

### 0.1 Routage : `/` = Accueil + `/[slug]` dynamique

- Page **racine `/`** ([`(front-office)/page.tsx`](../src/app/(front-office)/page.tsx)) :
  rend la page **Accueil** (slug `""`) publiée — même rendu que `[slug]`.
- Route dynamique **`src/app/(front-office)/[slug]/page.tsx`** : rend une page
  **publiée** quel que soit son slug (portfolio, prestations, a-propos, …).
  - Les routes statiques existantes (`/demo`) **prennent priorité** sur
    `[slug]` (comportement Next).
  - Slug inconnu **ou** page brouillon → `notFound()` (404).
- Helper commun **`getPublicPage(slug)`** (serveur) :
  1. essaie la BDD (tenant démo) → page `status='published'` + modules ordonnés
     (via `getPagesWithModules` + filtre) ;
  2. sinon **fallback seed** (`seedPages`/`buildSeedModules`) pour les slugs
     connus (respect du statut `draft` → 404 pour Contact) ;
  3. résout **EXIF/blur** des URLs (`resolveMediaMetaByUrls`) pour la galerie.
- **Rendu** : liste des modules via `PageModuleRenderer` (server, statique) ;
  composant Lightbox client embarqué par `GalleryModule`.

### 0.2 SEO — `generateMetadata()`

- `generateMetadata({ params })` résout la page (même helper) puis retourne :
  - `title` = `page.title` (H1) ;
  - `description` = extrait du 1er module texte (about/services) ou phrase
    générique ;
  - `openGraph.images` = URL de la 1re image (hero/about/galerie) ;
  - `alternates.canonical` = `/slug` (racine = `/`).
- Pages brouillon/inconnues → `metadata` minimal + `notFound()`.

### 0.3 Stratégie de rendu (statique/dynamique)

- **Option A (recommandée)** : `[slug]` en **dynamique on-demand** (ƒ) —
  reflète l'état publié de la BDD à chaque requête (cohérent avec RLS/public) ;
  `/` également dynamique. Simple, pas de régénération à gérer.
- **Option B** : statique + `generateStaticParams` (slugs seed) avec
  `dynamicParams = true` (fallback dynamique) — SEO maximale mais nécessite ISR
  dès que la BDD évolue.
Arbitrage proposé : **A** pour cette étape (le site se fera monter en statique/
ISR plus tard).

### 0.4 Fallback démo

- Sans BDD (`DATABASE_URL` absente/erreur) : `/` et `/portfolio`… rendus depuis
  le **seed en mémoire** (Accueil/Portfolio/Prestations/À propos publiés ;
  Contact brouillon → 404) ; `/demo` conservé. Aucun appel réseau au build.

### 0.5 Proxy Next 16 (consolidation 5.4)

- Remplacer `src/middleware.ts` par **`src/proxy.ts`** (convention Next 16) :
  - même logique (garde `/admin`, refresh session, `/admin/login` exempté,
    fallback démo) ;
  - export de la fonction par défaut + `config.matcher`.
- Si la convention exige une API légèrement différente, ajuster
  (`updateSession` reste inchangé) ; vérifier au build.

## 1. Fichiers (prévision)

- Créés : `src/lib/public-page.ts` (getPublicPage + description/og helpers),
  `src/app/(front-office)/[slug]/page.tsx`, `src/proxy.ts`,
  `plans/ROADMAP-6.3-dynamic-pages.md`.
- Modifiés : `src/app/(front-office)/page.tsx` (Accueil dynamique via helper),
  suppression `src/middleware.ts`, `ROADMAP.md`, `CHANGELOG.md`.
- Inchangés : renderers publics, repository existants, éditeurs, contrats.

## 2. Diagramme

```mermaid
flowchart TD
    R[/] --> H[getPublicPage slug vide]
    D[/:slug/] --> H2[getPublicPage slug]
    H --> DB[(BDD pages+modules media)]
    H --> SEED[fallback seed]
    H -->|status draft ou inconnu| NF[notFound 404]
    H2 --> DB
    DB --> RDR[PageModuleRenderer]
    RDR --> G[Gallery Lightbox EXIF]
    D --> GMD[generateMetadata SEO OG]
    M[middleware] -->|deprecated| P[proxy Next16]
```

## 3. Tâches (ordre — mode Code)

1. `src/lib/public-page.ts` (helper serveur : BDD → seed → exif/blur ;
   `getPublicPageTitle/Description/Image`) ;
2. `src/app/(front-office)/[slug]/page.tsx` (`generateMetadata` + rendu) ;
3. `src/app/(front-office)/page.tsx` → rendu Accueil (slug vide) ;
4. Proxy : `src/proxy.ts` (nouvelle convention) + suppression `middleware.ts` ;
5. Vérifications : `npx tsc --noEmit`, `npx eslint src`, `npm run build` ;
6. `ROADMAP.md` (6.3 `[x]`) + `CHANGELOG.md`.

## 4. Vérifications & validation

- `/`, `/portfolio`, `/prestations`, `/a-propos` (seed/BDD) rendus avec les
  modules publics (Hero/Galerie…) ; titre SEO + OG corrects ; `/contact`
  (brouillon) → 404 ; `/inconnu` → 404 ;
- Avec BDD : pages/médias réels + EXIF en galerie ; sans BDD : seed (fallback) ;
- Aucun avertissement `middleware` (proxy) au build ; routes listées
  (`/`, `/[slug]` ƒ, `/demo`, API…).

## 5. Risques & mitigations

| Risque | Mitigation |
|---|---|
| `[slug]` capte `/demo` | routes statiques prioritaires ; helper ignore slug réservés |
| BDD + statique/ISR | Option A (dynamique on-demand) |
| SEO sans DB | `generateMetadata` via seed/fallback |
| proxy Next 16 (API inconnue) | migration minimale ; vérif build ; doc 5.4 |
| Contact brouillon visible | filtre `status='published'` (+ 404) |

## 6. Points d'arbitrage

1. **Rendu** : Option A (dynamique on-demand) vs Option B (statique+ISR) ;
2. **Home** : `/` = Accueil publié (slug `""`) via le même helper (recommandé) ;
3. **Description SEO** : extraction 1er module texte (recommandé) ;
4. **Proxy** : bascule immédiate vers `proxy.ts` (recommandé) vs report.
