# Plan — Sélection du thème du site (`/admin/apparence`)

## Objectif
Permettre au photographe de choisir dans le Dashboard l'une des **7 palettes**
(« Nacre & Éditorial » par défaut + les 6 presets déjà dans `globals.css`) et de
l'appliquer à **tout son site public**. Nouvelle page **Paramètres › Apparence**
(`/admin/apparence`), persistée par photographe, appliquée **côté serveur sans FOUC**.

## Décisions tranchées
1. **Application sur un wrapper du layout front-office** (`display: contents`), pas
   sur `<html>` : le layout racine (`src/app/layout.tsx:73`) n'est pas async et ne
   connaît pas le photographe, alors que `(front-office)/layout.tsx:57-58` le résout
   déjà. Pour qu'un wrapper suffise, les 6 presets deviennent **auto-suffisants** via
   une **règle d'alias partagée** — précédent identique dans le repo : `.admin`
   (`admin/layout.tsx:68` + `globals.css:242-260`).
   **Cela révise le contrat « `<html>` uniquement » du lot presets** ; les
   commentaires `globals.css` et `PROJECT_CONTEXT.md` doivent être mis à jour.
2. **Persistance : champ `theme` dans le JSONB `data`** de `site_visual_identity`
   → **aucune migration Drizzle**. Réutilise `VisualIdentitySchema`,
   `normalizeVisualIdentity`, le repository, l'API `PUT /api/visual-identity`,
   `persistVisualIdentity`, `loadInitialData`, `VisualIdentityProvider` et le store
   **tels quels**.
3. **Ids** : `"nacre" | "corporate" | "tech-minimaliste" | "terre-atelier" |
   "sauge-cabinet" | "galerie-luxe" | "girly-baby"`. Défaut `"nacre"` = **aucune
   classe** (Nacre est `:root`).
4. `galerie-luxe` ajoute **aussi** la classe `dark` sur le même wrapper (couplage
   déjà documenté ; `@custom-variant dark` ne réagit qu'à `.dark`).
5. **Sidebar réorganisée en sections** `Contenu` / `Paramètres`, **URLs inchangées**
   (`/admin/profile`, `/admin/identite-visuelle`, `/admin/apparence`).

## Faits vérifiés (ancrages)
- `src/app/globals.css` : section presets insérée après `.admin` (fin ~l.261) et
  avant `@theme` ; convention des jetons ~l.22-62 ; `.dark` l.187-229 ;
  `.admin` l.236-261.
- `src/lib/visual-identity.ts` : type `VisualIdentity`, `DEFAULT_VISUAL_IDENTITY`,
  `normalizeVisualIdentity` (l.212-249).
- `src/lib/schemas/persistence.ts` : `VisualIdentitySchema` (~l.611).
- `src/db/schema.ts:333` : `siteVisualIdentity.data` JSONB typé `VisualIdentity`.
- `src/db/repositories/visual-identity.repository.ts` : `getVisualIdentity` /
  `upsertVisualIdentity` (le type `data` porte déjà tout l'objet).
- `src/db/load-initial-data.ts:111` charge `visualIdentity` → rien à changer.
- `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx` +
  `src/lib/visual-identity-store.ts` : store module partagé, hydratation +
  persistance débouncée 400 ms.
- `src/app/(front-office)/layout.tsx` : providers sans DOM, `TopBannerChrome` en
  `display: contents` (précédent), `Header` + `main` + `Footer`.
- `src/components/backoffice/SidebarNav.tsx:43-63` : liste plate + un seul titre
  `Contenu` codé en dur (l.81-83), entrée « Paramètres » désactivée l.62.
- Garde `npm run check:contrast` : couvre déjà les 6 presets, **aucun changement de
  valeurs** attendu (seul un commentaire à corriger).

## Tâches ordonnées

### 1. `src/app/globals.css` — presets auto-suffisants
Ajouter **une seule** règle, à la fin de la section presets (après le bloc
`.theme-girly-baby`) :

```css
.theme-corporate,
.theme-tech-minimaliste,
.theme-terre-atelier,
.theme-sauge-cabinet,
.theme-galerie-luxe,
.theme-girly-baby {
  --background: var(--bg-color);
  --foreground: var(--text-color);
  --card: var(--surface-color);
  --card-foreground: var(--text-color);
  --popover: var(--surface-color);
  --popover-foreground: var(--text-color);
  --primary: var(--accent-color);
  --accent: var(--accent-color);
  --ring: var(--accent-color-strong);
  --border: var(--border-color);
  --input: var(--border-color);
  --muted-foreground: var(--text-muted);
}
```

- Les seuls jetons shadcn **littéraux** restent déjà déclarés dans chaque bloc
  preset (`--primary-foreground`, `--accent-foreground`, `--secondary`,
  `--secondary-foreground`, `--muted`, `--destructive`,
  `--destructive-foreground`) : ne pas les déplacer.
- **Ne modifier aucune déclaration** de `:root`, `.dark`, `.admin` ; que des ajouts.
- Réécrire l'en-tête de section : presets **auto-suffisants** (comme `.admin`),
  applicables sur un wrapper ; contrat `<html>` remplacé ; conserver les notes
  `--ring`/`--muted-foreground` désormais fournis par la règle partagée et
  `galerie-luxe` couplé à `.dark`.
- Mettre à jour la phrase du bloc « CONVENTION DES JETONS DE THÈME » (au-dessus de
  `:root`) qui dit « appliqués à `<html>` uniquement ».

### 2. `src/lib/site-theme.ts` (nouveau, pur, sans `"use client"`)
Miroir du domaine, importable serveur + client :
- `SiteThemeId` (union des 7 ids), `SITE_THEME_IDS` (ordre d'affichage).
- `DEFAULT_SITE_THEME: SiteThemeId = "nacre"`.
- `siteThemeLabels: Record<SiteThemeId, string>` — ex. « Nacre & Éditorial (défaut) »,
  « Corporate », « Tech minimaliste », « Terre & Atelier », « Sauge cabinet »,
  « Galerie luxe », « Girly baby ».
- `siteThemeModes: Record<SiteThemeId, "light" | "dark">` (`galerie-luxe` = dark).
- `isSiteThemeId(value: unknown): value is SiteThemeId`.
- `readSiteTheme(value: unknown): SiteThemeId` (tolérant → défaut).
- `siteThemeWrapperClasses(id: SiteThemeId): string` → `""` pour `nacre`, sinon
  `theme-<id>` (+ `" dark"` si mode dark). Utilisé par le layout public **et**
  l'aperçu admin.

### 3. Champ `theme` dans le domaine identité visuelle
- `src/lib/visual-identity.ts` : ajouter `theme: SiteThemeId` à `VisualIdentity`,
  `theme: DEFAULT_SITE_THEME` à `DEFAULT_VISUAL_IDENTITY`, et lire `theme` dans
  `normalizeVisualIdentity` via `readSiteTheme` (rétrocompat : anciennes lignes
  sans `theme` → `"nacre"`).
- `src/lib/schemas/persistence.ts` : `theme: z.enum(SITE_THEME_IDS).default("nacre")`
  dans `VisualIdentitySchema`.
- **Aucune** modification de `schema.ts`, repository, `load-initial-data.ts`,
  `persistence-client.ts`, provider, store, route API.

### 4. `src/app/(front-office)/layout.tsx` — application SSR
- Calculer `const themeClasses = siteThemeWrapperClasses(initial.visualIdentity?.theme ?? DEFAULT_SITE_THEME);`
- Dans la branche « chrome » (non vide), envelopper `TopBannerChrome` **et**
  `Footer` dans un `<div className={cn(themeClasses, "contents")}>` (importer `cn`
  depuis `@/lib/utils`). `contents` préserve le `flex-col`/`flex-1` du `<body>`
  (même technique que `TopBannerChrome`).
- Branche « site vide / onboarding » : laisser sans thème (défaut Nacre).
- Limite assumée : le thème est rendu au **chargement** ; un changement depuis
  l'admin n'est visible sur le site public qu'après rechargement.

### 5. `src/app/(back-office)/admin/apparence/page.tsx` + écran (nouveaux)
- `page.tsx` : Server Component rendant `<AppearanceScreen />`.
- `src/components/backoffice/appearance/AppearanceScreen.tsx` (`"use client"`),
  calqué sur `VisualIdentityScreen` :
  - lit `visualIdentity.theme` via `useVisualIdentity()` (provider déjà monté par
    `admin/layout.tsx`) ; `update({ theme })`.
  - **Sélecteur** : `role="radiogroup"`, 7 cartes ; `role="radio"` +
    `aria-checked`. Chaque carte affiche un **bandeau de 4 pastilles rendu dans un
    mini-wrapper thémé** (`<div className={siteThemeWrapperClasses(id)}>` +
    `bg-[var(--bg-color)]`, `bg-[var(--surface-color)]`,
    `bg-[var(--accent-color)]`, `bg-[var(--text-color)]`) → **aucune duplication
    hex** ; libellé + badge clair/sombre.
  - **Aperçu en direct** : wrapper `siteThemeWrapperClasses(theme)` contenant un
    mini-mockup (barre type Header + titre + bouton `bg-primary
    text-primary-foreground` + carte `bg-card border-border`).
  - **Enregistrer** : bouton appelant `persistVisualIdentity(visualIdentity)` +
    messages succès/erreur (mêmes idiomes que `VisualIdentityScreen`). L'auto-
    persistance du provider reste active (déjà débouncée 400 ms).
  - **Réinitialiser** : `update({ theme: "nacre" })`.

### 6. `src/components/backoffice/SidebarNav.tsx` — sections + entrée
- Refactor données : `sidebarSections: { label: string; items: SidebarNavItem[] }[]`
  = `Contenu` puis `Paramètres` ; rendre un titre par section (réutiliser le style
  `<p>` actuel l.81-83).
- **Contenu** : Pages, Navigation, Bandeau d'alerte, Médias, puis les entrées
  désactivées existantes (Modules, Portfolio, Clients, Devis).
- **Paramètres** : Profil, Identité visuelle / Logo, **Apparence**
  (`/admin/apparence`, icône `Palette`).
- Donner **`Image`** (ou `Type`) à « Identité visuelle / Logo » pour éviter le
  doublon d'icône `Palette` ; supprimer l'entrée « Paramètres » désactivée l.62
  (remplacée par le titre de section).
- Conserver `isActive` tel quel (routes à plat).

### 7. Documentation
- `PROJECT_CONTEXT.md` : bullet « Presets opt-in » → application sur wrapper
  front-office (plus `<html>`), champ `theme` persisté dans `site_visual_identity`,
  page `/admin/apparence`, sidebar en sections.
- `scripts/check-contrast.ts` : corriger le commentaire du bloc presets (« alias
  résolus par `:root` » → règle d'alias partagée) ; **aucune valeur ni paire** à
  changer.
- `CHANGELOG.md` : entrée du lot.

## Validation
- `npm run check:contrast` → **exit 0**, mêmes 4 avertissements (Nacre `--text-muted`
  ≈ 4,48, `--ring` 1,68, `--primary` 1,38 ; admin `--ring` 2,56) ; presets toujours
  conformes.
- `npx tsc --noEmit` → 0 ; `npm run lint` → 0.
- `git diff src/app/globals.css` → uniquement des **ajouts** ; aucune déclaration de
  `:root`/`.dark`/`.admin` modifiée.
- Manuel (ne pas lancer `npm run build` si `next dev` occupe le port 3000) :
  - `/admin/apparence` affiche 7 cartes + aperçu ; sélectionner « Corporate » →
    aperçu change ; Enregistrer ; recharger `/` → palette corporate.
  - Sélectionner « Galerie luxe » → `/` passe en sombre (wrapper reçoit `dark`) ;
    `/admin/*` reste zinc.
  - Aucun preset (Nacre) → `/` et `/admin/bandeau-alerte` strictement identiques
    à l'existant.

## Risques
- **`display: contents` + variables CSS** : l'héritage passe par l'arbre DOM, pas la
  boîte ; précédent `TopBannerChrome` dans le repo — à confirmer visuellement.
- **Résolution des alias** : validée par le précédent `.admin` ; vérifier qu'aucun
  composant public ne code une couleur hors jetons (sinon il ne suivra pas).
- **Dérivés hérités** : `--glass-bg`/`--shadow-pearl-sm`/`--star-color-empty` des
  presets clairs restent Nacre (assumé, non bloquant).
- **Fraîcheur** : pas de mise à jour du site public sans rechargement (SSR).
- **Rétrocompat** : lignes `site_visual_identity` sans `theme` → `normalize` tolérant.

## Hors périmètre
- Migration Drizzle / nouvelle table ; couleur d'accent libre ; typographies, effets,
  espacements ; mode sombre automatique (`prefers-color-scheme`) ; surcharge
  `--star-color-empty`/`--shadow-pearl-sm` ; i18n/langues ; SEO ; IA rédactionnelle ;
  thème par page ; mise à jour temps réel du site public.

## Questions ouvertes (lots suivants)
- Faut-il exposer ces réglages par **site** (aujourd'hui 1 photographe = 1 site) le
  jour du multi-site ?
- i18n du Dashboard : réutiliser le même emplacement « Paramètres » (`langue`).
