<!--
==============================================================================
NOTICE D'UTILISATION DU FICHIER CHANGELOG.MD
------------------------------------------------------------------------------
À quoi sert ce fichier ?
1. Historique automatique des modifications apportées par l'agent IA.
  2. Permet à Cline d'avoir une vision chronologique exacte des étapes passées
     lors de l'ouverture d'une nouvelle tâche ("New Task").
==============================================================================
-->

---

## 2026-09-10 – 13:41 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Correctifs après recette (Étapes 11.9 → 11.15)**.
- **11.9 — Gallery Dynamic** : ouverture au **clic simple** (au lieu du double-clic), avec garde-fou de 300 ms empêchant le clic résiduel du double-clic de refermer la modale ; le double-clic reste dédié au cycle de zoom **dans** la Lightbox. [`GalleryCtaPanel`](src/components/backoffice/pages/modules/gallery/GalleryCtaPanel.tsx) affiche désormais une **alerte** (icône + texte) quand le bouton CTA est activé sans libellé ou sans lien (les trois variantes).
- **11.10 — Lightbox, pan fiable & fluidité** [`LightboxModal`](src/components/modules/gallery/LightboxModal.tsx) : l'état de glissement est armé **avant** `setPointerCapture` (avec `try/catch`), le déplacement est piloté par des **écouteurs fenêtre** (`pointermove/up/cancel`, nettoyés au démontage), transform `translate3d` + `transformOrigin: center`, `user-select: none`, `overscroll-behavior: contain` → **plus d'ascenseur natif** en mode zoomé, glissement fluide au clic maintenu, borné. **Préchargement** des images voisines (n−1 / n+1) pour une navigation quasi instantanée.
- **11.11 — Anneau coloré** [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx) : la modalité d'ouverture (clavier vs souris) est propagée de la vignette jusqu'à la Lightbox ; le focus n'est restauré sur la vignette **que** pour une ouverture clavier (plus de bordure rose après un clic souris), et l'anneau de focus est rendu discret.
- **11.12 — Galeries vides par défaut** [`pages.ts`](src/lib/pages.ts) : `createGalleryStaticContent` / `createGalleryDynamicContent` démarrent **sans photo** et `createGalleryPortfolioContent` **sans album** (ajout dynamique d'autant de thématiques que souhaité) ; messages d'aide dans l'éditeur ; le **seed** n'instancie plus de galerie vide (Accueil et Portfolio).
- **11.13 — WebP qualité 80 à l'upload** [`/api/media`](src/app/api/media/route.ts) : conversion **sharp → WebP q80** (orientation EXIF appliquée, métadonnées retirées) avant Storage pour JPEG/PNG/WebP/AVIF ; **SVG, GIF animés et vidéos** conservés tels quels ; **repli sur l'original** si la conversion échoue ; `mimeType`/extension `.webp`, `size` du WebP ; **EXIF lu sur l'original**, dimensions et blur calculés sur le WebP.
- **11.14 — Lazy loading & qualité** : prop `quality` ajoutée à [`MediaImage`](src/components/common/MediaImage.tsx) (utilisée à **80** dans la Lightbox et les grilles) ; toutes les photos de galerie restent en **lazy loading** (seule la première en `priority`), image active de la Lightbox en chargement immédiat.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/modules/gallery/{GalleryManager,GalleryItem,GalleryGrid,LightboxModal}.tsx`, `src/components/backoffice/pages/modules/gallery/GalleryCtaPanel.tsx`, `src/components/common/MediaImage.tsx`, `src/lib/pages.ts`, `src/app/api/media/route.ts`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration.

### Prochaine étape prévue
Nouvelle passe de recette `/demo` : Gallery Dynamic au clic simple (sans fermeture parasite), pan au clic maintenu sans ascenseur, cycle de zoom fit → 1,5× → 2,5×, absence d'anneau rose après un clic souris, fluidité du diaporama (préchargement + WebP), galeries vides à la création puis import multiple/dossier complet, alerte CTA incomplet.

---

## 2026-09-10 – 12:11 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Rubrique « Galeries & Portfolio » : Gallery Static, Gallery Dynamic, Gallery Portfolio** (plan [`plans/ROADMAP-11.1-galleries-portfolio.md`](plans/ROADMAP-11.1-galleries-portfolio.md) validé).
- **Architecture** : famille unique `type: "gallery"` à **variantes discriminées dans le JSONB** (`static` / `dynamic` / `portfolio`) — pattern de la rubrique Héro, **aucune migration BDD** (`module_type` conserve `gallery`). `GalleryVariant` (mode d'affichage) renommé `GalleryDisplayMode` + `layout.display`, avec **lecture rétro-compatible** de l'ancien `layout.variant` ; un contenu sans `variant` bascule vers `static` (legacy « Galerie photo masonry »).
- **Domaine** [`pages.ts`](src/lib/pages.ts) : `GalleryContent` (`GalleryStaticContent` / `GalleryDynamicContent` / `GalleryPortfolioContent`), effets exclusifs (`GalleryEffectSettings` light/normal/strong), ombre (`none`→`strong`), bordure (épaisseur + couleur), CTA, réglages Lightbox (zoom 1,5× / 2,5×, EXIF, légendes), albums imbriqués (`GalleryAlbum`), badges paramétrables, fabriques par variante, `resolveGalleryContent` (rétro-compat.), `galleryImageSources`, `galleryAlbumCover/PhotoCount`, `ModuleVariant` généralisé, catalogue à **3 cartes**.
- **Schémas** [`persistence.ts`](src/lib/schemas/persistence.ts) : `galleryContentSchema` (union discriminée, miroir du domaine). [`public-page.ts`](src/lib/public-page.ts) : collecte SEO/OG des images galerie **albums inclus**.
- **Effets** [`gallery-effects.ts`](src/lib/gallery-effects.ts) : mapping pur effet + intensité → styles (Passe-partout de Musée, Sous-Verre/glassmorphism, Polaroid papier glacé + reflet), ombre nacre et bordure indépendantes.
- **Rendu public** : [`GalleryManager`](src/components/modules/gallery/GalleryManager.tsx) orchestre les 3 variantes ; [`GalleryGrid`](src/components/modules/gallery/GalleryGrid.tsx) (uniforme/masonry, colonnes responsives par variables CSS) ; [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx) (`MediaImage` lazy, ratio réservé anti-CLS, effets, survol, curseurs selon variante, double-clic/ clic simple) ; [`GalleryAlbumBadge`](src/components/modules/gallery/GalleryAlbumBadge.tsx) ; [`CTAButton`](src/components/modules/gallery/CTAButton.tsx) (conditions habituelles show + label + href).
- **Lightbox unique** [`LightboxModal`](src/components/modules/gallery/LightboxModal.tsx) partagée Dynamic (toutes les images) + Portfolio (album exclusif) : clavier ← →, Échap, **focus trap**, ARIA, restauration du focus, scroll verrouillé, **Zoom HD**, **plein écran**, **cycle de zoom fit → 1,5× → 2,5× → fit**, **pan au clic maintenu** borné et **sans scroll** (molette neutralisée).
- **Back-Office** : [`ModuleGalleryEditor`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx) (routeur par variante) + panneaux [`ImportMediaPanel`](src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx) (multiple + dossier non compressé), [`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx) (CRUD, réordonnancement, masquage), [`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx) (thématiques + badges), `GalleryLayoutPanel`, `EffectSettingsPanel`, `GalleryCtaPanel`, `LightboxSettingsPanel`, `fields`.
- **Responsivité** : colonnes dégradées automatiquement (≤1024 → min(cols,3) ; ≤640 → min(cols,2) ; ≤400 → 1) et typographies fluides `clamp()` (titres, badges, légendes Polaroid).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK ; `npm run build` OK.

### Fichiers créés ou modifiés
- Créés : `src/lib/gallery-effects.ts` ; `src/components/modules/gallery/{GalleryManager,GalleryGrid,GalleryItem,GalleryAlbumBadge,LightboxModal,CTAButton}.tsx` ; `src/components/backoffice/pages/modules/gallery/{ImportMediaPanel,GalleryImagesPanel,AlbumManagerPanel,GalleryLayoutPanel,EffectSettingsPanel,GalleryCtaPanel,LightboxSettingsPanel,fields}.tsx` ; `plans/ROADMAP-11.1-galleries-portfolio.md`
- Modifiés : `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/lib/public-page.ts`, `src/app/globals.css`, `src/components/modules/PublicModules.tsx`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/modules/{ModuleGalleryEditor,ModuleSettingsForm}.tsx`, `src/app/(front-office)/demo/page.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- Supprimé : `src/components/modules/GalleryGrid.tsx` (logique migrée vers `src/components/modules/gallery/`)
- BDD : **aucune** migration (contenu JSONB uniquement).

### Prochaine étape prévue
Contrôle visuel `/demo` : Gallery Static (aucune interaction, Passe-partout + CTA), Gallery Dynamic (double-clic → diaporama, aucun voile au survol), Gallery Portfolio (clic simple → album exclusif + badges) ; cycle de zoom fit → 1,5× → 2,5× et pan au clic maintenu ; import multiple et dossier non compressé depuis `/admin/pages` ; responsivité mobile / tablette / desktop.

---

## 2026-09-09 – 22:11 (heure locale America/Bogota)

### Tâche exécutée
**Amendement 10.1.a — Liens de navigation orphelins & site vierge** (plan [`plans/ROADMAP-10.1-site-starter-onboarding.md`](plans/ROADMAP-10.1-site-starter-onboarding.md))
- **Cause identifiée** : `PagesNavigationSync` nettoie bien les entrées **liées à une page** (et la FK cascade en BDD), mais les entrées **`custom` (`pageId: null`)** — ancres du seed (`/portfolio#mariages`…), placeholders de presets (`/series`, `/galeries`), liens manuels — **n'étaient jamais nettoyées** → liens résiduels dans `/admin/navigation` et dans le Header.
- **Domaine** [`navigation.ts`](src/lib/navigation.ts) : `internalHrefSlug(href)` (`/portfolio#mariages` → `portfolio` ; `/` → `""` ; `#ancre`/`https://…` → `null`) et `isOrphanNavEntry(entry, slugs)` (liens internes morts uniquement — externes et ancres locales préservés).
- **Serveur** : `listPageSlugs()` ([`pages.repository.ts`](src/db/repositories/pages.repository.ts)) + **`pruneOrphanNavigation()`** ([`navigation.repository.ts`](src/db/repositories/navigation.repository.ts), réutilise `saveNavigation`) ; appel dans [`loadInitialData`](src/db/load-initial-data.ts) **uniquement si 0 page** → purge douce et ciblée (aucune suppression de placeholder sur un site qui a des pages).
- **Client** [`PagesNavigationSync`](src/components/backoffice/navigation/PagesNavigationSync.tsx) : **étape 5** — suppression immédiate des entrées `custom` orphelines (Header racine/sous-menu + Footer).
- **Action explicite** : `clearNavigation(area | "all")` ([`NavigationStoreProvider`](src/components/backoffice/navigation/NavigationStoreProvider.tsx)) + carte **« Zone de réinitialisation »** avec confirmation destructrice dans [`NavigationManager`](src/components/backoffice/navigation/NavigationManager.tsx) → Header/Footer vidés, persistés par `PUT /api/navigation`.
- **Onboarding autonome** [layout front-office](src/app/(front-office)/layout.tsx) : si `dbAvailable && !hasHomepage && 0 page` → rendu **sans Header/Footer** (aucune barre de nav vide/résiduelle).
- **Informatif** [`NavEntryRow`](src/components/backoffice/navigation/NavEntryRow.tsx) : badge **« Lien mort »** sur une entrée interne sans cible (site avec pages — pas de suppression auto).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts`, `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`, `src/components/backoffice/navigation/PagesNavigationSync.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationManager.tsx`, `src/components/backoffice/navigation/NavEntryRow.tsx`, `src/app/(front-office)/layout.tsx`, `plans/ROADMAP-10.1-site-starter-onboarding.md`, `CHANGELOG.md`
- BDD : **aucune** migration (réutilise `saveNavigation`).

### Prochaine étape prévue
Vérifier : supprimer toutes les pages → `/admin/navigation` **vide**, `/` **sans barre de navigation** (onboarding), `F5` stable ; « Vider la navigation » → menu vidé et persisté ; liens externes/ancres locales conservés ; badge « Lien mort » visible sur un lien interne sans cible.

---

## 2026-09-09 – 21:52 (heure locale America/Bogota)

### Tâche exécutée
**Étape 10.1 — Démarrage de site & Onboarding public** (plan [`plans/ROADMAP-10.1-site-starter-onboarding.md`](plans/ROADMAP-10.1-site-starter-onboarding.md) validé) : suppression des **données fantômes** (seed) et écran public `WelcomeOnboarding`.
- **Principe** : le seed n'est plus un défaut implicite des stores → **fallback serveur explicite uniquement si la BDD est injoignable**.
- **BDD** [`schema.ts`](src/db/schema.ts) : colonne **`pages.is_home`** + **index unique partiel** (`uniques par photographe`) ; migration [`0005_jittery_turbo.sql`](drizzle/0005_jittery_turbo.sql) (générée + backfill `slug = '' → is_home = true` éditée à la main) — **`db:migrate` appliqué**.
- **Domaine** [`pages.ts`](src/lib/pages.ts) : `SitePage.isHome`, `pageHrefFor(page)` (accueil → `/`), `demotedHomeSlug(pageId)` ; seed enrichi.
- **Fini les fantômes** : [`getPublicPage`](src/lib/public-page.ts) ne retombe plus sur le seed **quand la BDD répond** ; **`getHomepageState()`** renvoie `ready | draft | missing` (un accueil brouillon ≠ onboarding) ; ✅ `PagesStoreProvider` et ✅ `navigation-store` ont un **défaut vide**.
- **Loader** [`load-initial-data.ts`](src/db/load-initial-data.ts) : `pages`/`navigation` **toujours fournis si BDD OK (même vides)** + `hasHomepage` ; seed explicite si BDD down ; **plus d'auto-seed** (`ensureTenantSeeded` n'est plus appelé — reste en opt-in `npm run db:seed`).
- **Repository** [`pages.repository.ts`](src/db/repositories/pages.repository.ts) : `getHomePage`, **`setHomePage` transactionnel** (ancien accueil démis + slug libéré, nouveau accueil en slug `""`), `ensurePhotographerProfile` à la demande (FK mode démo).
- **API** [`POST /api/pages/[pageId]/home`](src/app/api/pages/[pageId]/home/route.ts) + `persistSetHomePage`.
- **UI Pages** [`PagesManager`](src/components/backoffice/pages/PagesManager.tsx) : badge **« Accueil »** + action **« Définir comme page d'accueil »** ; [`PageMetadataForm`](src/components/backoffice/pages/PageMetadataForm.tsx) : `isHome` déduit de la page (plus du slug vide) — le parcours « page blanche » est **débloqué**.
- **Écran public** [`WelcomeOnboarding`](src/components/onboarding/WelcomeOnboarding.tsx) (Server Component) rendu par [`/`](src/app/(front-office)/page.tsx) quand `missing` : 200 + **`noindex`**, 2 variantes (visiteur → CTA `/admin/login` ; admin → CTA `/admin/pages` et `/admin/navigation`). Accueil `draft` → 404.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages, route `/api/pages/[pageId]/home` présente).

### Fichiers créés ou modifiés
- Créés : `src/components/onboarding/WelcomeOnboarding.tsx`, `src/app/api/pages/[pageId]/home/route.ts`, `drizzle/0005_jittery_turbo.sql`, `plans/ROADMAP-10.1-site-starter-onboarding.md`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/db/repositories/pages.repository.ts`, `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/navigation-store.ts`, `src/lib/persistence-client.ts`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/PagesManager.tsx`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/app/(front-office)/page.tsx`, `CHANGELOG.md`
- BDD : `pages.is_home` + index partiel + backfill (migration 0005).

### Prochaine étape prévue
Scénarios DoD à vérifier par l'utilisateur : supprimer toutes les pages → `F5` sur `/` (aucune recréation, écran d'onboarding, menu vide) ; cas anon/admin ; créer une 1ʳᵉ page → **Définir comme page d'accueil** → **Publier** → `/` la sert. *Reporté en v2* : `site_mode`, reset in-app, support `?redirect=` après login.

---

## 2026-09-09 – 20:36 (heure locale America/Bogota)

### Tâche exécutée
**Module « Identité visuelle / Logo » — amendement 9.1.b** (demandes utilisateur) :
1. **échelle de taille calibrée** (ligne 1 ≈ +25 % du texte du menu ; ligne 1 ≈ +20 % de la ligne 2) + **2 niveaux supérieurs ajoutés** ;
2. **couleur par défaut des deux lignes = `#1E293B`** ;
3. **palette sur mesure** (2 rangées) + **pipette écran** (échantillonnage hors onglet).
- **Domaine** [`visual-identity.ts`](src/lib/visual-identity.ts) : `VisualIdentityTextSize` passe à **5 niveaux** (`small, medium, large, xlarge, xxlarge`) ; `textSizeLabels` (Petite · Moyenne (défaut) · Grande · Très grande · Énorme) ; **`TEXT_LINE_PX` recalibré** — ligne 1 : 14/18/22/25/30 px, ligne 2 : 12/15/18/21/25 px (défaut **18/15** = ratio 1,2 exact et ≈ +28,6 % vs menu 14 px) ; `TEXT_SIZE_LETTER_SPACING` sur 5 niveaux ; **défauts couleur `#1E293B`** pour les 2 lignes ; palettes **`VISUAL_IDENTITY_NEUTRALS`** (8) + **`VISUAL_IDENTITY_ACCENTS`** (10) ; `readSize` tolérant étendu.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : enum taille 5 niveaux + défauts couleur `#1E293B`.
- **Écran** [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : color picker sur **2 rangées** (neutres puis accents) ; bouton **« Pipette »** par ligne utilisant l'**EyeDropper API** (`new EyeDropper().open()`) → prélèvement **n'importe où à l'écran, y compris hors de l'onglet** ; détection de support (message si non supporté) ; note des nouvelles métriques.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : aucun changement de logique — applique les nouvelles px/espacements par ligne via `TEXT_LINE_PX` / `TEXT_SIZE_LETTER_SPACING`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/visual-identity.ts`, `src/lib/schemas/persistence.ts`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `plans/ROADMAP-9.1-visual-identity-logo.md`, `CHANGELOG.md`
- BDD : **aucune** migration (JSONB — tokens de taille inchangés, valeurs px recalculées à l'affichage).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → « Moyenne » (défaut) doit paraître nettement plus grande que le menu ; tester « Très grande »/« Énorme » ; utiliser la **pipette** pour échantillonner une couleur hors onglet ; vérifier que les deux lignes valent `#1E293B` par défaut.

---

## 2026-09-09 – 20:25 (heure locale America/Bogota)

### Tâche exécutée
**Module « Identité visuelle / Logo » — amendement 9.1.a** (demande utilisateur) :
1. **Paramètres typographiques distincts par ligne** (ligne 1 et ligne 2 indépendantes) ;
2. **Fond d'aperçu neutre médian** (ni blanc ni noir) pour vérifier la lisibilité d'un texte blanc, noir ou gris.
- **Domaine pur** [`visual-identity.ts`](src/lib/visual-identity.ts) : `VisualIdentityTextLine { value, color, size, weight }`, `text: { line1, line2 }` ; `TEXT_LINE_PX` (ligne 1 → 12/14/16 px ; ligne 2 → 10/12/13 px), `TEXT_SIZE_LETTER_SPACING`, `VISUAL_IDENTITY_PREVIEW_BG = "#808080"`, **`normalizeVisualIdentity()`** (rétro-compat de l'ancienne forme plate v1 → v2, sans lever) ; fichier **sans `"use client"`** → importable côté serveur.
- **Store séparé** [`visual-identity-store.ts`](src/lib/visual-identity-store.ts) (nouveau, `"use client"`) : snapshot/hydratation/subscription + `useVisualIdentity()`.
- **Zod v2** [`persistence.ts`](src/lib/schemas/persistence.ts) : `line1` (max 35, graisse 600 par défaut) et `line2` (max 45, graisse 400) avec chacun couleur/taille/graisse.
- **Repository** [`visual-identity.repository.ts`](src/db/repositories/visual-identity.repository.ts) : décodage via `normalizeVisualIdentity` puis Zod (contenus JSONB existants **migrés à la volée**, aucune migration SQL nécessaire).
- **Écran** [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : composant `TextLineFields` réutilisé → **rubrique « Ligne 1 » et « Ligne 2 » avec contrôles indépendants** (texte, couleur + presets, taille, graisse) ; **fond d'aperçu `#808080`** (aperçu en direct + encadré « Logo actuel »), repli `siteName` en gris foncé lisible.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : chaque ligne applique **ses propres** couleur/taille/graisse/espacement.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créés : `src/lib/visual-identity-store.ts`
- Modifiés : `src/lib/visual-identity.ts`, `src/lib/schemas/persistence.ts`, `src/db/repositories/visual-identity.repository.ts`, `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `src/components/layout/Header.tsx`, `plans/ROADMAP-9.1-visual-identity-logo.md`, `CHANGELOG.md`
- BDD : **aucune** migration (JSONB — normalisation applicative).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → régler séparément Ligne 1 et Ligne 2 (couleur/taille/graisse propres) → aperçu sur fond gris : les textes blanc, noir et gris doivent rester lisibles → « Enregistrer » → Header conforme.

---

## 2026-09-09 – 19:59 (heure locale America/Bogota)

### Tâche exécutée
**Nouveau module « Identité visuelle / Logo » (ROADMAP 9.1)** — configuration **100 % manuelle** de l'espace marque du Header (plan [`plans/ROADMAP-9.1-visual-identity-logo.md`](plans/ROADMAP-9.1-visual-identity-logo.md) validé)
- **BDD** [`schema.ts`](src/db/schema.ts) : table **`site_visual_identity`** (1 ligne/photographe, `data` **JSONB typé** `VisualIdentity`, timestamps). Migration **`drizzle/0004_steady_mikhail_rasputin.sql`** (générée + **RLS owner-only** ajoutée à la main) — **`db:migrate` appliqué avec succès**.
- **Domaine** [`visual-identity.ts`](src/lib/visual-identity.ts) (nouveau) : types (`VisualIdentityMode`, tailles, graisses), `DEFAULT_VISUAL_IDENTITY` (**champs vierges**, aucun pré-remplissage Profil), `TEXT_SIZE_METRICS` (12/10 · 14/12 · 16/13 px + espacement auto), contraintes (35/45 car., logo 2 Mo / 200×60), palette, `isVisualIdentityEmpty`, store module + `useVisualIdentity()`.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : `VisualIdentitySchema` (enums + défauts, **tolérant**, longueurs max appliquées).
- **Repository** [`visual-identity.repository.ts`](src/db/repositories/visual-identity.repository.ts) (nouveau) : `getVisualIdentity` / `upsertVisualIdentity` ; [`load-initial-data.ts`](src/db/load-initial-data.ts) : `visualIdentity?`.
- **Provider** [`VisualIdentityProvider.tsx`](src/components/backoffice/visual-identity/VisualIdentityProvider.tsx) (nouveau) : hydratation post-montage + persistance débouncée 400 ms ; monté dans les layouts [front-office](src/app/(front-office)/layout.tsx) et [admin](src/app/(back-office)/admin/layout.tsx).
- **API** [`/api/visual-identity`](src/app/api/visual-identity/route.ts) (nouveau, GET/PUT) + [`persistVisualIdentity`](src/lib/persistence-client.ts).
- **Écran** [`/admin/identite-visuelle`](src/app/(back-office)/admin/identite-visuelle/page.tsx) + [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : sélecteur **Texte | Logo**, rubrique Texte (2 lignes 35/45, couleur `input type=color` + 10 presets + Hex/RGBA, taille 3 positions, graisse 3 positions, espacement auto), rubrique Logo (**drag & drop**, SVG/PNG/JPG/WebP, **≤ 2 Mo**, altText, rendu **≤ 200×60 `object-contain`**), **aperçu en direct**, « Enregistrer » (flush BDD + états).
- **Sidebar** [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx) : entrée exacte **« Identité visuelle / Logo »** (icône Palette) → `/admin/identite-visuelle`.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : la marque rend le **mode Texte** (2 lignes stylées) ou le **mode Logo** (≤ 200×60) ; **repli `siteName`** si non configuré (aucun lien avec Profil).
- **SVG** : [`/api/media`](src/app/api/media/route.ts) accepte `image/svg+xml` + [`extensionFromMime`](src/lib/supabase/storage.ts:23) mappe `svg`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages, routes `/admin/identite-visuelle` et `/api/visual-identity`).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-9.1-visual-identity-logo.md`, `src/lib/visual-identity.ts`, `src/db/repositories/visual-identity.repository.ts`, `src/app/api/visual-identity/route.ts`, `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `src/app/(back-office)/admin/identite-visuelle/page.tsx`, `drizzle/0004_steady_mikhail_rasputin.sql`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/lib/schemas/persistence.ts`, `src/lib/persistence-client.ts`, `src/components/backoffice/SidebarNav.tsx`, `src/components/layout/Header.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `src/app/api/media/route.ts`, `src/lib/supabase/storage.ts`, `CHANGELOG.md`
- BDD : nouvelle table `site_visual_identity` + migration 0004 appliquée (RLS owner).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → mode Texte (2 lignes, couleur/taille/graisse) ou Logo (SVG/PNG ≤ 2 Mo) → « Enregistrer » → le Header reflète immédiatement la configuration ; **F5** → conservée (BDD).

---

## 2026-09-09 – 19:19 (heure locale America/Bogota)

### Tâche exécutée
**Header — la marque (gauche) n'est plus auto-complétée par le module « Profil »** (demande utilisateur : une fonctionnalité dédiée « Nom + baseline ou logo à télécharger » sera développée ultérieurement pour cet espace)
- [`Header.tsx`](src/components/layout/Header.tsx) : la zone **marque (gauche)** revient à l'affichage **statique `siteName`** — suppression de l'auto-complétion depuis le Profil pour le **nom** (`profile.brandName`) et le **logo** (`profile.logoUrl`) ; le **favicon** (onglet navigateur, hors zone marque) reste alimenté par le Profil.
- Le module Profil conserve sa **persistance BDD** (8.2) ; seules les injections Header (nom/logo) sont retirées — aucun impact sur `/admin/profile`, Footer ni l'API `/api/profile`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (16 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/layout/Header.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Fonctionnalité dédiée (ultérieure) : configurer l'espace marque du Header (nom + baseline et/ou logo à télécharger) via un module/réglage dédié du Back-Office.

---

## 2026-09-09 – 19:05 (heure locale America/Bogota)

### Tâche exécutée
**Correctif « Persistance BDD refusée (HTTP 400) — Email invalide »** (module Profil)
- **Cause** : `OwnerProfileSchema` validait `publicEmail`/`contactFormEmail` avec `z.string().email(...)` ; toute valeur non conforme (ex. email saisi sans TLD ou texte libre) faisait échouer **`PUT /api/profile` → 400**, bloquant la sauvegarde du profil entier (le Provider en débounce journalisait l'erreur et « Enregistrer » échouait).
- **Correctif** [`persistence.ts`](src/lib/schemas/persistence.ts:229) : emails passés en **texte libre** (`z.string().default("")`) — la persistance n'est plus jamais bloquée par un email ; l'indication de format reste portée par `type="email"` dans [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx). Retrait du log de debug temporaire et message d'échec `save()` rendu générique (« base de données indisponible ou erreur serveur »).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/schemas/persistence.ts`, `src/components/backoffice/profile/ProfileScreen.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Test utilisateur : saisir un profil avec un email « libre » (ex. sans TLD) → « Enregistrer » → message vert BDD (plus de 400) → F5 → données conservées.

---

## 2026-09-09 – 18:33 (heure locale America/Bogota)

### Tâche exécutée
**Module Profil — persistance BDD durable (ROADMAP 8.2)** — corrige « les infos entrées dans Profil ne sont pas sauvegardées » (diagnostic : état uniquement en mémoire, perdu au rechargement)
- **BDD** [`schema.ts`](src/db/schema.ts) : nouvelle table **`site_owner_profile`** (1 ligne/photographe : `photographer_id` PK/FK → `profiles`, profil complet en `data` **JSONB typé** `OwnerProfile`, timestamps). Migration **`drizzle/0003_serious_clea.sql`** (générée par `db:generate` puis éditée à la main) : **RLS owner-only** (`authenticated`, `photographer_id = auth.uid()` ; SELECT/INSERT/UPDATE/DELETE) — aucune lecture `anon`. **`db:migrate` appliqué avec succès** (Supabase joignable).
- **Repository** [`owner-profile.repository.ts`](src/db/repositories/owner-profile.repository.ts) (nouveau, serveur) : `getOwnerProfile` (decode Zod tolérant → `null` si absente) + `upsertOwnerProfile` (`onConflictDoUpdate`, PK).
- **Domaine** [`owner-profile.ts`](src/lib/owner-profile.ts) : ajout de **`hydrateOwnerProfile(profile)`** (fusion `DEFAULT`) + retrait du log de debug temporaire. [`persistence.ts`](src/lib/schemas/persistence.ts) : `OwnerProfileSchema` assoupli (noms autorisés vides, cohérent avec le fallback Header `siteName`).
- **Hydratation SSR** [`load-initial-data.ts`](src/db/load-initial-data.ts) : `SiteInitialData.profile` chargé côté serveur.
- **Provider** [`OwnerProfileProvider.tsx`](src/components/backoffice/profile/OwnerProfileProvider.tsx) (nouveau, client) : hydratation unique post-montage + **persistance débouncée (400 ms)** quand BDD dispo (ignorant 1er rendu & hydratation) ; monté dans le layout **[front-office](src/app/(front-office)/layout.tsx)** (Header/Footer) et le layout **[admin](src/app/(back-office)/admin/layout.tsx)**.
- **API** [`/api/profile`](src/app/api/profile/route.ts) (nouveau) : `GET` (profil) + `PUT` (upsert validé `OwnerProfileSchema`, scope `resolvePhotographerId`) ; [`persistence-client.ts`](src/lib/persistence-client.ts) : `persistOwnerProfile`.
- **UI** [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx) : « Enregistrer » = **flush immédiat réel** (PUT) avec retours d'état — succès « Profil enregistré dans la base de données » (vert) ; échec/hors-BDD → « Base de données indisponible : conservé en mémoire, sera perdu au rechargement » (rouge, plus de faux « en mémoire »).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (16 pages, route `/api/profile` présente).

### Fichiers créés ou modifiés
- Créés : `src/db/repositories/owner-profile.repository.ts`, `src/components/backoffice/profile/OwnerProfileProvider.tsx`, `src/app/api/profile/route.ts`, `drizzle/0003_serious_clea.sql`, `plans/ROADMAP-8.2-owner-profile-persistence.md`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/lib/owner-profile.ts`, `src/lib/persistence-client.ts`, `src/lib/schemas/persistence.ts`, `src/components/backoffice/profile/ProfileScreen.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `CHANGELOG.md`
- BDD : nouvelle table `site_owner_profile` + migration 0003 appliquée (RLS owner).

### Prochaine étape prévue
Test utilisateur : saisir/modifier `/admin/profile` → « Enregistrer » (message vert BDD) → **F5** → les données restent (hydratées depuis la BDD). Sans Supabase, message rouge explicite attendu.

---

## 2026-09-09 – 17:57 (heure locale America/Bogota)

### Tâche exécutée
**Module Hero Parallaxe — échelle d'intensité étendue à 7 niveaux « par force »** (demande utilisateur : les niveaux créés étaient trop légers ; ajouter 4 niveaux supérieurs + renommer par force d'intensité)
- **Domaine** [`pages.ts`](src/lib/pages.ts:669) : `ParallaxSpeed` passe de 3 à **7 tokens** `very-light | light | medium | pronounced | strong | very-strong | extreme` ; ordre Select + libellés « force » **« Très léger / Léger / Modéré / Marqué / Fort / Très fort / Extrême »** ; `PARALLAX_FACTOR` retravaillé (`0.07 → 0.60`) et nouveau **`PARALLAX_OVERSCAN`** (`0.10 → 0.44`) ; résolveur `resolveHeroParallaxContent` **rétro-compatible** (l'ancien token `subtle` de l'Étape 7.4 → `very-light` ; `medium`/`strong` conservés).
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts:131) : `parallaxSpeedSchema` = `z.enum` des 7 niveaux.
- **Rendu** [`HeroParallaxBackground.tsx`](src/components/modules/hero/HeroParallaxBackground.tsx) : l'**overscan de l'image devient proportionnel à l'intensité** (`top`/`height` en style inline au lieu de `top-[-12%] h-[124%]` fixes) et le **plafond de déplacement** passe de 12 % fixe à `rect.height * overscan` → les niveaux « Fort / Très fort / Extrême » produisent un effet réellement marqué (défilement jusqu'à ±44 % de la hauteur) ; dépendance `overscan` ajoutée (eslint 0 warning).
- **Éditeur** [`ModuleHeroParallaxEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx) : rubrique ⚙️ affiche les 7 libellés + tooltip « i » expliquant l'échelle (« Modéré » = classique).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroParallaxBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée (contenus JSONB rétro-compatibles via le résolveur).

### Prochaine étape prévue
Contrôle visuel navigateur (desktop ≥ 1024 px) : tester chaque niveau « Très léger → Extrême » au défilement — les niveaux forts doivent montrer un décalage nettement plus ample ; vérifier qu'aucune bordure d'image n'apparaît sur les plus fortes amplitudes.

---

## 2026-09-09 – 17:45 (heure locale America/Bogota)

### Tâche exécutée
**Correctif runtime SSR — « Missing getServerSnapshot » (module Profil)** (signalé après la phase 8.1)
- **Cause** : [`owner-profile.ts`](src/lib/owner-profile.ts) (`useOwnerProfile`) appelait `useSyncExternalStore(subscribeOwnerProfile, getOwnerProfileSnapshot)` **sans le 3ᵉ argument `getServerSnapshot`**. Le [`Header`](src/components/layout/Header.tsx:241) étant un Client Component rendu en SSR via le layout serveur async [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx:55), React 19 / Next 16.3.4 levait une erreur runtime « Missing getServerSnapshot … Will revert to client rendering » (le store Navigation passe déjà ce 3ᵉ argument — voir [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx:174)).
- **Correctif** [`owner-profile.ts`](src/lib/owner-profile.ts) : ajout de **`getOwnerProfileServerSnapshot()`** (retourne le snapshot du module, comme `getNavigationServerSnapshot`) passé en 3ᵉ argument de `useSyncExternalStore` ; suppression des logs de debug temporaires ajoutés pour la validation.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (SSR des pages front-office `/`, `/[slug]`, `/demo` régénéré sans erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/owner-profile.ts`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Contrôle visuel navigateur (aucune erreur SSR à l’ouverture d’une page publique). Ensuite : **étoffer l’échelle d’intensité du module Hero Parallaxe** (4 niveaux supérieurs demandés par l’utilisateur) — à planifier (étiquette/niveaux, facteurs d’amplitude, rétro-compatibilité `parallaxSpeed` stocké, Zod).

---

## 2026-09-09 – 17:27 (heure locale America/Bogota)

### Tâche exécutée
**Module Profil — ajustements finaux UI demandés par l’utilisateur** (écran [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx))
- 🏷️ Rubrique « 📍 Contacts & adresses » : libellé **« Email de contact public » → « Email de contact »** et toggle **« Utiliser l’email public pour les formulaires » → « Utiliser l’email pour recevoir les formulaires »** (tips mis à jour en cohérence).
- ℹ️ Ajout d’un **tooltip « i »** sur « Client idéal / Persona » (explique le persona à un non-technique et son usage IA).
- 📄 Remplacement des deux champs « PDF — Présentation / Bio (URL) » et « PDF — CV (URL) » par un **champ unique de téléchargement** « Téléchargements d’informations complémentaires (Bio, CV, actualités…) » (accepte `.doc, .pdf, .docx, .jpg, .jpeg, .png`), qui alimente `profile.documents` (multi-fichiers, liste de noms retirables) — documents destinés à une **analyse ultérieure par l’assistant IA** (cf. fiche : « … analysés plus tard par l’IA »).
- **Domaine/Zod déjà alignés** : [`owner-profile.ts`](src/lib/owner-profile.ts) (`documents: string[]`, `DEFAULT` `[]`) et [`persistence.ts`](src/lib/schemas/persistence.ts) (`OwnerProfileSchema.documents`) — aucune régression.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (route `/admin/profile` présente).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/profile/ProfileScreen.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur du rendu (`/admin/profile`) puis persistance BDD `site_owner_profile` + endpoint mot de passe réel (Supabase) et analyse IA des `documents`.

---

## 2026-09-09 – 16:48 (heure locale America/Bogota)

### Tâche exécutée
**Phase 8 – Module « Profil » (`site_owner_profile`)** — MVP validé (plan [`plans/ROADMAP-8.1-owner-profile.md`](plans/ROADMAP-8.1-owner-profile.md))
- **Domaine** [`src/lib/owner-profile.ts`](src/lib/owner-profile.ts) (nouveau) : type `OwnerProfile` (Identité/Contacts/Légal/IA), `DEFAULT_OWNER_PROFILE`, constantes (grammaticalPerson, communicationStyle), **store partagé** (module) + hook **`useOwnerProfile()`** (update) et **`getAIContextPrompt(profile)`**.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : `OwnerProfileSchema` + `ProfileSecuritySchema` (force : majuscule/chiffre/symbole/8 min, correspondance).
- **Back-Office** : route **`/admin/profile`** (page.tsx) + entrée sidebar **« Profil »** ([`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx)) + écran [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx) en **4 rubriques** avec tooltips « i » : 🏢 Identité & visuels (logo upload + vignette, favicon…), 📍 Contacts & adresses (toggles affichage, email formulaire masqué si même email, réseaux sociaux), ⚖️ Légal & ligne éditoriale IA (statut/SIRET/TVA/publication, personne/style, persona, PDF), 🔒 Sécurité & mot de passe (currentPassword obligatoire, force, confirmation, revoke ; MVP : validation + message démo — endpoint réel Supabase/email à connecter).
- **Intégrations Builder** : [`Header.tsx`](src/components/layout/Header.tsx) — **brandName/logo** du Profil (repli `siteName`) + **favicon** dynamique ; [`Footer.tsx`](src/components/layout/Footer.tsx) — marque ©, **réseaux sociaux** du Profil fusionnés, ligne **mentions légales** (statut/SIRET/directeur publication).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (dépend de Supabase/Resend)** : persistance BDD `site_owner_profile`, endpoint `POST /api/profile/password` + révocation sessions + email d’alerte.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-8.1-owner-profile.md`, `src/lib/owner-profile.ts`, `src/app/(back-office)/admin/profile/page.tsx`, `src/components/backoffice/profile/ProfileScreen.tsx`
- Modifiés : `src/lib/schemas/persistence.ts`, `src/components/backoffice/SidebarNav.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

### Prochaine étape prévue
Validation utilisateur (`/admin/profile` + nav/footer alimentés) puis persistance BDD du profil + sécurité réelle (Supabase/Resend).

---

## 2026-09-09 – 16:08 (heure locale America/Bogota)

### Tâche exécutée
**Correctif — sous-menu de la barre de navigation qui ne se refermait pas après un clic**
- **Cause** : le dropdown desktop était piloté **uniquement par le survol CSS** (`group-hover`) ; après un clic sur un enfant du sous-menu, le pointeur restant dans le groupe, le panneau ne se refermait pas.
- **Correctif** [`Header.tsx`](src/components/layout/Header.tsx) : `DesktopNavMenu` passe d’un dropdown CSS à un **dropdown contrôlé par état React** (`openId`) — ouvert au survol/focus du groupe, **fermé** à la sortie de la souris, **après activation d’un lien (parent ou enfant)** (`onNavigate` → `closeAfterNavigate`) et si le focus quitte le panneau (`onBlur`). Le menu mobile (Sheet + Accordion) se refermait déjà via `onNavigate`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/components/layout/Header.tsx`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (ouvrir un sous-menu desktop puis cliquer un lien → le menu doit se refermer ; survol hors du menu → fermeture ; navigation clavier).

---

## 2026-09-09 – 15:45 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.4 : Hero Parallaxe (`variant: "parallax"`)** (plan [`plans/ROADMAP-7.4-hero-parallax.md`](plans/ROADMAP-7.4-hero-parallax.md) validé : héritage `BaseHero`, parallaxe GPU desktop ≥1024px, désactivation mobile verrouillée)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `ParallaxSpeed` (subtle/medium/strong), `HeroParallaxContent extends HeroBaseShared` (`media: HeroStaticMedia`, `parallaxSpeed`, `disableOnMobile: true`) ; `HeroContent` élargie `static | slider | video | parallax` ; `PARALLAX_FACTOR`, libellés ; fabrique `createHeroParallaxContent`, `resolveHeroParallaxContent`, `heroParallaxImageSources` ; carte catalogue **« Hero Parallaxe »** ; `createModuleContent(type, variant?)` gère `"parallax"`.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : schéma `heroParallaxContentSchema` (media static + `parallaxSpeed` + `disableOnMobile: z.literal(true)`) ajouté à `heroContentSchema`.
- **Front** : [`HeroParallaxBackground.tsx`](src/components/modules/hero/HeroParallaxBackground.tsx) (client) — desktop **≥1024px** : image surdimensionnée translatée `translate3d` (GPU, `will-change-transform`) pilotée au scroll dans un `requestAnimationFrame` (amplitude `PARALLAX_FACTOR[speed]`), suspendue hors viewport via IntersectionObserver ; **mobile/reduced-motion : aucune animation** → `<picture>` fixe `object-cover` ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) branche `parallax` → `BaseHero` + background.
- **Back-Office** : [`ModuleHeroParallaxEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx) en **3 rubriques** — 🖼️ Image Parallaxe & Fallback (desktop 16:9 HD requis, mobile 9:16 fixe obligatoire, tablette 4:3, tooltips), 📝 Textes & Bouton hérités, ⚙️ Intensité (`parallax_speed`, mobile désactivé verrouillé) ; aiguillage [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx).
- **Helpers** : [`public-page.ts`](src/lib/public-page.ts) variante `parallax` (images collectées, OG = desktop).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : contrôle visuel (ajouter un « Hero Parallaxe ») : desktop ≥1024px = profondeur au scroll, mobile < 1024px = image fixe.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.4-hero-parallax.md`, `src/components/modules/hero/HeroParallaxBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`).

### Prochaine étape prévue
Validation utilisateur (parallaxe desktop / mobile fixe) — rubrique Héro désormais complète (static, slider, video, parallax) sur la base commune `BaseHero`.

---

## 2026-09-09 – 15:10 (heure locale America/Bogota)

### Tâche exécutée
**Diagnostic & correctif — liens dupliqués (~70) dans « Menu principal – Header »**
- **Diagnostic** : la table `navigation_entries` contenait des **doublons accumulés** (plusieurs lignes par page/lien) ; `getNavigation` les lisait tels quels → le menu Header affichait une liste énorme de liens jamais créés.
- **Correctif** [`navigation.repository.ts`](src/db/repositories/navigation.repository.ts) : déduplication **à la lecture** `dedupeNavigationRows` — une seule entrée conservée par `(zone, parent, page_id OU href)`, la première occurrence (position la plus faible) est gardée, les **enfants orphelins** d'un parent-doublon retiré sont eux-mêmes retirés. La BDD est ensuite **nettoyée automatiquement** à la prochaine sauvegarde (`saveNavigation` = delete + insert de la liste dédupliquée).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/db/repositories/navigation.repository.ts`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (recharger `/admin/navigation` : la liste Header doit redevenir courte) ; au besoin, purge SQL manuelle des doublons en base ou déclencher une modification de menu pour nettoyer.

---

## 2026-09-09 – 15:00 (heure locale America/Bogota)

### Tâche exécutée
**Dashboard Pages — Réordonnancement vertical des pages (Drag & Drop sur poignée)**
- **Store** [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : nouvelle action **`movePage(from, to)`** (helper `reorderModules`, immuable) exposée dans `PagesStoreValue`.
- **Écran** [`PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) : la liste « Pages » affiche désormais les pages dans **l'ordre du store** (le tri « mis à jour » est retiré de l'écran) et chaque ligne dispose d'une **colonne poignée ⋮⋮** à gauche — **glisser-déposer vertical** (`@hello-pangea/dnd`, comme les sections d'une page : `DragDropContext`/`Droppable` (tbody)/`Draggable` (tr), `dragHandleProps` sur la poignée uniquement, ombre `ring` pendant le drag). `onDragEnd` → `movePage(source.index, destination.index)`.
- A11y : poignée en bouton avec `aria-label`/`title` ; zone draggable limitée à la poignée (les clics sur la ligne restent libres pour éditer/supprimer).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Note** : l'ordre est réordonné dans le store (conservé en session) ; la persistance BDD d'un ordre de pages reste une extension future (aucune colonne d'ordre en base pour l'instant).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/PagesManager.tsx`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (glisser-déposer des pages dans le Dashboard) puis extension éventuelle : persistance de l'ordre des pages (colonne position / endpoint).

---

## 2026-09-09 – 14:15 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.3 : Hero Vidéo (`variant: "video"`)** (plan [`plans/ROADMAP-7.3-hero-video.md`](plans/ROADMAP-7.3-hero-video.md) validé : héritage 100 % `BaseHero`, fallback mobile < 768px, poster desktop au chargement, schémas Zod)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `HeroVideoMedia` (`videoUrl`, `loop`, `posterDesktop` 16:9 optionnel, `fallbackMobile` 9:16 obligatoire) & `HeroVideoContent extends HeroBaseShared` (variant `"video"`) ; `HeroContent` élargie `static | slider | video` ; `DEMO_HERO_VIDEO_URL` (MP4 bucket Google stable) ; fabrique `createHeroVideoContent`, `resolveHeroVideoContent`, `heroVideoImageSources` ; catalogue carte **« Hero Vidéo »** ; `createModuleContent(type, variant?)` gère `"video"`.
- **Zod** [`src/lib/schemas/persistence.ts`](src/lib/schemas/persistence.ts) : schémas Héro (`heroOverlaySchema`, `fontWeightSchema`, `artSourceSchema`, `heroSharedSchema`, variantes static/slider/video) et export **`heroContentSchema`** (union `z.discriminatedUnion("variant", …)`) pour la validation de persistance.
- **Front** : [`HeroVideoBackground.tsx`](src/components/modules/hero/HeroVideoBackground.tsx) (client) — `<video>` HTML5 `autoPlay muted loop playsInline controls={false}` `object-cover` + poster desktop au chargement ; **< 768px : vidéo non montée, image fallback 9:16 affichée** (`matchMedia` + `prefers-reduced-motion` → poster) ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) branche `video` → `BaseHero` + `HeroVideoBackground` (textes/overlay/CTA centrés partagés).
- **Back-Office** : [`ModuleHeroVideoEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx) en **3 rubriques** — 🎬 Média Vidéo & Fallback (URL, loop, fallback mobile obligatoire 9:16 + alt, poster desktop 16:9, tooltips), 📝 Textes & Bouton hérités (overlay, H1/H2/desc, tone, graisses, CTA), ⚙️ Réglages & Performance (muted/playsinline toujours actifs) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx) bascule `video`.
- **Helpers publics** : [`public-page.ts`](src/lib/public-page.ts) (variante `video` : images poster/fallback collectées, OG = poster) .
- **Upload vidéo (post-feedback)** : possibilité d’**uploader une vidéo MP4/WebM ou de coller une URL** (au choix) dans la rubrique Média de l’éditeur Hero Vidéo — `MediaUploadButton` accepte désormais un paramètre `accept` ; route [`/api/media`](src/app/api/media/route.ts) élargie (`video/mp4`, `video/webm`, 50 Mo max ; upload brut **sans** sharp/EXIF/blur pour les vidéos) ; mapping d’extension dans [`storage.ts`](src/lib/supabase/storage.ts).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : contrôle visuel (ajouter un « Hero Vidéo » dans `/admin/pages`) : desktop = vidéo autoplay/boucle avec poster ; mobile (< 768px) = photo fallback 9:16 ; uploader/remplacer la vidéo par la sienne.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.3-hero-video.md`, `src/components/modules/hero/HeroVideoBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`).

### Prochaine étape prévue
Validation utilisateur (rendu vidéo desktop/mobile) puis extension Héro restante : **HeroParallax** (`HeroContent` + `BaseHero`).

---

## 2026-09-09 – 12:20 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.2 : Hero Slider (`variant: "slider"`)** (plan [`plans/ROADMAP-7.2-hero-slider.md`](plans/ROADMAP-7.2-hero-slider.md) validé : D-2 refactor `HeroTextBlock` partagé, D-3 overlay/textes **par slide** + poids/réglages **au module**, D-4 réordonnancement ↑/↓, D-6 un seul `h1` actif)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `HeroSliderSlide` (art-direction `<picture>` + textes/CTA/overlay/tone par slide), `HeroSliderSettings` + `HeroAutoplaySpeed` + `HeroSliderTransition`, `HeroSliderContent` ; `HeroContent` élargie `static | slider` ; constantes/labels (vitesses, transitions, `DEFAULT_HERO_SLIDER_SETTINGS`) ; fabriques `createHeroSliderSlide`/`createHeroSliderContent` (3 slides pré-chargées picsum + alt SEO) ; `resolveHeroSliderContent` (slides/settings partiels normalisés) ; `heroSliderImageSources` ; `moduleCatalog` carte **« Hero Slider »** (`id hero-slider`, `variant slider`) ; `createModuleContent(type, variant?)` & `createModule` (passe la variante).
- **Front** : refactor **`HeroTextBlock`** (nouveau [`src/components/modules/hero/HeroTextBlock.tsx`](src/components/modules/hero/HeroTextBlock.tsx)) — bloc texte/CTA partagé (h1 géant clamp/h2/p, poids, tone, CTA, alignement `center`/`bottom-left`) ; [`BaseHero.tsx`](src/components/modules/hero/BaseHero.tsx) refactorisé dessus (static inchangé) ; **`HeroSlider.tsx`** (nouveau, client) — slides empilées GPU, transition `slide` (translateX) / `fade` (opacité), autoplay (pause survol/focus), flèches desktop, puces, **swipe tactile** pointer events (`touch-action pan-y`), `prefers-reduced-motion` + retour boucle sans glissade, A11y `aria-hidden` slides inactives ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) bascule `variant` static/slider.
- **Back-Office** : **`ModuleHeroSliderEditor.tsx`** (nouveau) en **3 rubriques** — 🖼️ Slides & Photos (ajout `+ slide`, suppression, réordonnancement ↑/↓, 3 `ArtSourceField` par slide), 📝 Textes & Boutons par slide (overlay segmenté, H1/H2/paragraphe, tone, CTA, graisses globales), ⚙️ Réglages du Slider (autoplay/vitesse, transition glissement/fondu, flèches, puces) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx) bascule par variante ; [`ModuleSettingsForm.tsx`](src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) masque l'animation générique pour **static uniquement**.
- **Helpers/démo** : [`public-page.ts`](src/lib/public-page.ts) multi-variantes (`collectImageUrls`, `publicDescription` 1re slide, `publicOgImage`) ; démo [`demo/page.tsx`](src/app/(front-office)/demo/page.tsx) ajoute un HeroSlider (3 slides).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : validation visuelle `/demo` (autoplay, transitions, swipe tactile, flèches/puces, overlay, texte bas-gauche desktop/centré mobile) et édition d'un « Hero Slider » dans `/admin/pages`.
- **Correctif assombrissement (post-feedback)** : le voile (`overlay_level`) était appliqué en `background-color` sur le conteneur de la slide (donc **sous** l’image) dans `HeroSlider` — déplacé vers un `<div>` **au-dessus de l’image** (`absolute inset-0 z-[2]`) dans chaque slide ; voile du `BaseHero` (HeroStatic) garanti au-dessus du fond via `z-[2]`.
- **Correctif moteur slider (post-feedback)** : suppression de la **rupture de cycle** en mode « Glissement » — ajout d’un **clone de la 1re slide** en fin de piste : au retour automatique, la piste ramène sur la vraie 1re slide **sans transition** (visuel identique, aucun saut brutal) ; suppression de la pause autoplay au **simple survol** (pause conservée au focus clavier et pendant le geste tactile) → démarrage stable et régulier.
- **Correctif pleine hauteur / responsif (post-feedback)** : sections Héro (slider & statique) recalées pour occuper l’espace **du bas de la barre de navigation (`h-16` fixe) jusqu’au bas de l’écran** (`min-h-[calc(100svh-4rem)]` + `-mt-4`) avec fallback **`dvh`** (`supports-[height:100dvh]:min-h-[calc(100dvh-4rem)]`) pour tenir compte de la barre d’adresse mobile ; dans `/demo`, le **HeroSlider est désormais le premier module** (héro plein écran en haut de page) pour valider ce comportement.
- **Correctif racine pleine hauteur (post-feedback) — mode « Glissement »** : la piste était un enfant **dans le flux** (`h-full` sur un parent à hauteur auto) → hauteur non résolue et vide sous les visuels. La piste est désormais **`absolute inset-0`** dans la section : elle remplit réellement toute la hauteur (≥ `min-h-[calc(100svh-4rem)]`) et chaque slide la couvre (`object-cover`), sans vide en bas, sur desktop et mobile.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.2-hero-slider.md`, `src/components/modules/hero/HeroTextBlock.tsx`, `src/components/modules/hero/HeroSlider.tsx`, `src/components/backoffice/pages/modules/ModuleHeroSliderEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/components/modules/hero/BaseHero.tsx`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/modules/ModuleSettingsForm.tsx`, `src/app/(front-office)/demo/page.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`) ; enum Zod `persistence.ts` inchangée.

### Prochaine étape prévue
Validation utilisateur (rendu + éditeur HeroSlider) puis extensions Héro (HeroVideo / HeroParallax via `HeroContent` + `BaseHero`).

---

## 2026-09-09 – 11:05 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.1 : Rubrique Héro — HeroStatic & base commune `BaseHero`**
- **Plan validé** : [`plans/ROADMAP-7.1-hero-static-basehero.md`](plans/ROADMAP-7.1-hero-static-basehero.md). Décision structurante : **famille `hero` unique + discriminant `variant`** (aucune migration d'enum BDD) ; nommage camelCase groupé ; animation d'entrée **source unique** = `module.animation` ; `textTone` sémantique ; injection défauts = fabrique riche + résolveur (pattern `resolveGalleryLayout`).
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : types Héro (`HeroVariant`, `HeroOverlayLevel`, `HeroTextTone`, `FontWeightClass`, `HeroCtaStyle`, `HeroStaticMedia`, `HeroBaseShared`, `HeroStaticContent`, union `ModuleContent` ouverte `{ type: "hero" } & HeroStaticContent`) ; constantes (`HERO_OVERLAY_OPACITY`, ordres/libellés Select, `DEFAULT_HERO_SHARED`, `DEFAULT_HERO_STATIC_MEDIA` picsum 16:9/4:3/9:16) ; `createHeroStaticContent`, `cloneArtSource/cloneHeroStaticMedia`, `heroStaticArtSources`, **`resolveHeroContent`** (upgrade legacy `hero` simple + fusion des défauts, zéro `any`) ; catalogue `moduleCatalog` → `ModuleCatalogEntry` (clé `id` + `variant`), carte « Hero Statique » ; `createModule(type, seq, variant?)` sélectionne l'entrée par type+variant ; seeds Accueil migrés vers le contenu static.
- **Rendu public** : [`src/components/modules/hero/BaseHero.tsx`](src/components/modules/hero/BaseHero.tsx) (structure commune : overlay `overlayLevel` auto-inversé selon `textTone`, textes H2 `clamp()`/H3/paragraphe avec graisses, CTA `ctaShow`+`ctaStyle`, ancre, animation) ; [`HeroStaticBackground.tsx`](src/components/modules/hero/HeroStaticBackground.tsx) (`<picture>` art-direction : desktop ≥1024, tablette ≥768 avec **repli auto desktop**, `<img>` mobile 9:16, alt SEO, `fetchpriority`) ; [`RevealHero.tsx`](src/components/modules/hero/RevealHero.tsx) (client, IntersectionObserver GPU + `motion-reduce`) ; [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) (orchestrateur `resolveHeroContent` → `BaseHero`) ; [`PublicModules.tsx`](src/components/modules/PublicModules.tsx) route `hero` vers le nouveau module (ancien `HeroModule` inline supprimé).
- **Back-Office** : [`ModuleHeroEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroEditor.tsx) réécrit en **3 rubriques** (🖼️ Images de fond — 3 `ArtSourceField` à vignettes/ratios/tooltips ; 📝 Textes & Bouton — overlay, textes, tone, graisses, CTA switch+style ; 🎬 Animations & Effets — pilotée par `module.animation`) ; nouveau [`ArtSourceField.tsx`](src/components/backoffice/pages/modules/ArtSourceField.tsx) (vignette + upload + alt SEO + URL) ; [`form-fields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) enrichi (`HelpTip`/`LabelWithTip`, prop `tip`, `SelectField` générique) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx)/[`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx)/[`ModuleSettingsForm.tsx`](src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) (animation transmise au Héro, sélecteur générique masqué pour la famille `hero`) ; [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) `addModule(pageId, type, variant?)` ; [`AddSectionSheet.tsx`](src/components/backoffice/pages/AddSectionSheet.tsx)/[`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx) `onAdd(entry)` + clé `id`.
- **SEO/helpers & démo** : [`src/lib/public-page.ts`](src/lib/public-page.ts) (`collectImageUrls` multi-sources, `publicDescription`, `publicOgImage` via `heroStaticArtSources`/`resolveHeroContent`) ; [`demo/page.tsx`](src/app/(front-office)/demo/page.tsx) hero art-direction 3 images (desktop/tablet/mobile).
- **Ajustement sémantique & typographique (post-validation)** : la section Héro porte le **titre principal `<h1>`** de la page → `titleH2` devient `titleH1`, `subtitleH3` devient `subtitleH2` (balise `<h2>`), graisses `weightH1`/`weightH2`/`weightText` ; `descriptionText` conservée (`<p>`). Schéma TS, `BaseHero` (H1 géant `clamp()` + H2), seeds/démo et libellés/tooltips de l'éditeur ajustés (voir §9 du plan).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — compilation + TypeScript + génération statique). **Restant (environnement utilisateur)** : validation visuelle `/demo` & `/` (art-direction, overlay, clamp, CTA, animation), pages `/admin/pages` (rubriques Héro) ; BDD : JSONB legacy normalisé à la lecture par `resolveHeroContent`.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.1-hero-static-basehero.md`, `src/components/modules/hero/BaseHero.tsx`, `src/components/modules/hero/HeroStaticBackground.tsx`, `src/components/modules/hero/RevealHero.tsx`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ArtSourceField.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/components/modules/PublicModules.tsx`, `src/app/(front-office)/demo/page.tsx`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/AddSectionSheet.tsx`, `src/components/backoffice/pages/PageEditor.tsx`, `src/components/backoffice/pages/ModuleRow.tsx`, `src/components/backoffice/pages/modules/ModuleHeroEditor.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/modules/ModuleSettingsForm.tsx`, `src/components/backoffice/pages/modules/form-fields.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`) ; enum Zod `persistence.ts` inchangée.

### Prochaine étape prévue
Validation utilisateur (rendu `/demo` & `/`, éditeur 3 rubriques, bascule responsive) puis extensions Héro (Slider/Video/Parallax via `HeroContent` + `BaseHero`) et médiathèque.

---

## 2026-09-07 – 16:06 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.3 : Pages Publiques Dynamiques `/[slug]`, SEO & Proxy Next 16**
- **Plan validé** : [`plans/ROADMAP-6.3-dynamic-pages.md`](plans/ROADMAP-6.3-dynamic-pages.md) (validé, arbitrages par défaut : **Option A** — rendu dynamique on-demand ; home = Accueil ; description = 1er module texte ; **bascule proxy immédiate**). L'Étape 6.3 raccorde les modules publics (6.2) au routeur Next et consolide l'infra.
- **Helper serveur** [`src/lib/public-page.ts`](src/lib/public-page.ts) : `getPublicPage(slug)` (BDD tenant démo via `getPagesWithModules` → filtre `published`, sinon **fallback seed** `seedPages`/`buildSeedModules` ; résolution **EXIF/blur** via `resolveMediaMetaByUrls`) + `publicDescription` (1er module texte) & `publicOgImage` ; `null` pour slug inconnu/brouillon → `notFound()`.
- **Routage public** : [`src/app/(front-office)/[slug]/page.tsx`](src/app/(front-office)/[slug]/page.tsx) (dynamique ƒ — `generateMetadata` SEO : titre, description, OG, canonical ; rendu `PageModuleRenderer`, H1 sr-only si la page ne débute pas par un Hero) ; page racine [`/`](src/app/(front-office)/page.tsx) réécrite pour rendre l'**Accueil** (slug vide) avec `generateMetadata`.
- **Proxy Next 16** : [`src/proxy.ts`](src/proxy.ts) (nouvelle convention — garde `/admin`, session, `/admin/login` exemptée, fallback démo) ; [`src/middleware.ts`](src/middleware.ts) supprimé (plus d'avertissement de dépréciation au build).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — **`/` statique** (seed Accueil), **`/[slug]` dynamique ƒ**, `/demo` statique, proxy reconnu ; avertissements « fs/zlib » des modules natifs non bloquants). **Restant (environnement utilisateur)** : validation visuelle `/`, `/portfolio`, `/prestations`, `/a-propos` (rendus seed/BDD), `/contact` & inconnu → 404, métadonnées SEO/OG ; avec BDD : pages réelles + EXIF galerie.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.3-dynamic-pages.md`, `src/lib/public-page.ts`, `src/app/(front-office)/[slug]/page.tsx`, `src/proxy.ts`
- Modifiés : `src/app/(front-office)/page.tsx` (Accueil dynamique) ; `src/middleware.ts` supprimé ; `ROADMAP.md` (6.3 `[x]`)
- Aucune table/éditeur/contrat modifié ; routes statiques (`/demo`, `/admin/*`) prioritaires sur `/[slug]`.

### Prochaine étape prévue
**Validation utilisateur** (pages publiques + SEO + 404 ; BDD si configurée) puis suite du ROADMAP (prochaines phases fonctionnelles : espaces clients/galeries privées, devis/agenda, ou consolidation RLS/PostgREST selon la feuille de route).

---

## 2026-09-07 – 15:37 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.2 : Rendu Public Optimisé des Galeries & Lightbox EXIF**
- **Plan validé** : [`plans/ROADMAP-6.2-gallery-optimization.md`](plans/ROADMAP-6.2-gallery-optimization.md) (validé, arbitrages par défaut : **Option A** — bibliothèque de renderers + route `/demo` ; EXIF au survol **et** en Lightbox ; résolution EXIF par URL via la table `media`). L'Étape 6.2 crée la couche de **rendu public** des modules du Page Builder, optimisée (`MediaImage`) avec **Lightbox EXIF**.
- **Renderers publics** [`src/components/modules/PublicModules.tsx`](src/components/modules/PublicModules.tsx) : `PageModuleRenderer` (aiguillage par `module.type`) + `HeroModule` (**MediaImage priority** — LCP), `AboutModule` (image-texte), `GalleryModule` (grille → `GalleryGrid`), `ServicesModule`, `CtaBannerModule`, `FaqModule` (détails natifs accessibles), `ContactModule` — styles « Éclat Minéral & Nacre », Server Components (seule la galerie embarque un sous-composant client).
- **Galerie + Lightbox EXIF** [`src/components/modules/GalleryGrid.tsx`](src/components/modules/GalleryGrid.tsx) (Client) : grille `MediaImage` lazy + survol (EXIF optionnel), **Lightbox** plein écran (navigation ←/→, Échap, compteur) affichant les puces EXIF (focale, f/, vitesse, ISO, boîtier, objectif). Utilitaire [`src/lib/media-exif.ts`](src/lib/media-exif.ts) (`exifChipsFromData`/`exifLineFromData`, client-safe).
- **Données média** : [`src/lib/media-resolve.ts`](src/lib/media-resolve.ts) (serveur) — `resolveMediaMetaByUrls(urls, photographerId)` : EXIF & blur depuis la table `media` (repli `{}` sans BDD).
- **Page de démonstration** [`/demo`](src/app/(front-office)/demo/page.tsx) (sous Front-Office, statique) : Hero/About/Galerie(+EXIF démo)/CTA via `PageModuleRenderer` — valide lazy, WebP/AVIF, placeholders, Lightbox EXIF et LCP/CLS (sans BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — **nouvelle route statique `/demo`** ; avertissements non bloquants « fs/zlib » des modules natifs + note de dépréciation Next 16 « middleware → proxy » documentée). **Restant (environnement utilisateur)** : validation visuelle `/demo` ; avec BDD `media` : EXIF/blur réels résolus par URL ; migration du middleware vers la convention `proxy` Next 16 à prévoir.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.2-gallery-optimization.md`, `src/lib/media-exif.ts`, `src/lib/media-resolve.ts`, `src/components/modules/PublicModules.tsx`, `src/components/modules/GalleryGrid.tsx`, `src/app/(front-office)/demo/page.tsx`
- Modifiés : `ROADMAP.md` (6.2 `[x]`)
- Aucune table, aucun éditeur Back-Office ni contrat `PageModule` modifié ; aucune route publique dynamique générique (réservée étape suivante « pages publiques »).

### Prochaine étape prévue
**Validation utilisateur** (`/demo` : Hero prioritaire, galerie lazy + Lightbox EXIF clavier, EXIF réel si BDD `media`) puis **Phase 6 – Étape 6.3** : Pages publiques dynamiques (routage `/slug` depuis la BDD, rendu des modules publiés) & consolidation (migration middleware → proxy Next 16).

---

## 2026-09-07 – 15:21 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.1 : Supabase Storage, Media Library Back-Office & Métadonnées EXIF**
- **Plan validé** : [`plans/ROADMAP-6.1-media-storage.md`](plans/ROADMAP-6.1-media-storage.md) (plan fourni et validé par l'utilisateur, arbitrages par défaut : **Supabase Storage**, table **`media`**, **sharp à l'upload**, **Picker dans MediaFields**). L'Étape 6.1 couvre la gestion/optimisation des images : stockage bucket `portfolio-media`, **Media Library** Back-Office, extraction **EXIF** et **blur placeholders**, wrapper **`next/image`** et **sélecteur d'images** branché sur les modules du Page Builder — avec **fallback démo**.
- **Schéma** : table **`media`** ajoutée à [`src/db/schema.ts`](src/db/schema.ts) (id, `photographer_id` FK→profiles CASCADE, url, filename, size, mime_type, width/height, `exif_data` JSONB, `blur_data_url`, created_at). Migration [`drizzle/0002_dapper_lethal_legion.sql`](drizzle/0002_dapper_lethal_legion.sql) (générée puis éditée) : table + **RLS media** (Owner RW / Public RO) + **bucket & politiques Storage** (`portfolio-media` : lecture publique, écritures Owner via préfixe `auth.uid()`), enregistrée au journal.
- **Serveur** : repository [`media.repository.ts`](src/db/repositories/media.repository.ts) (`listMedia`, `getMedia`, `createMedia`, `deleteMedia`) ; helpers [`src/lib/supabase/storage.ts`](src/lib/supabase/storage.ts) (upload/suppression/`storagePathFromUrl`, bucket) + `isStorageConfigured` ; Route Handlers `GET`/`POST /api/media` ([`route.ts`](src/app/api/media/route.ts) — upload multipart, **`exifr`** EXIF, **`sharp`** dimensions + **blur data URI**, Owner authentifié) et `DELETE /api/media/[id]` (objet + ligne). Dépendances `exifr` + `sharp` ajoutées.
- **UI Back-Office** : page `/admin/media` + [`MediaLibrary.tsx`](src/components/backoffice/media/MediaLibrary.tsx) (grille responsive, upload, suppression avec Dialog, **puces EXIF** : focale/f/ISO/vitesse/boîtier/objectif, mode démo lecture seule) ; [`MediaPicker.tsx`](src/components/backoffice/media/MediaPicker.tsx) (Dialog + bouton `MediaPickButton`) intégré à [`MediaFields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) (pré-remplit `url`/`alt` des modules hero/about) ; entrée **« Médias »** active dans [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx).
- **Rendu/performance** : `next.config.ts` — `images.remotePatterns` (Supabase + démo picsum) ; composant [`MediaImage.tsx`](src/components/common/MediaImage.tsx) (wrapper `next/image`, `blurDataURL`, repli `<img>` natif sûr) ; client média [`src/lib/media-client.ts`](src/lib/media-client.ts) (`useMediaAssets`, upload/delete, jeu de démo hors-BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — route `/admin/media` en statique + API `/api/media` & `/api/media/[id]` ; avertissements non bloquants « Couldn't load fs/zlib » liés aux modules natifs optionnels à la génération). **Restant (environnement utilisateur)** : Supabase Storage n'étant pas configuré ici → mode démo (upload/suppression désactivés) ; validation de bout en bout avec Supabase (bucket 0002, upload→EXIF/blur→ligne `media`, RLS Owner, suppression) à effectuer.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.1-media-storage.md`, `src/db/repositories/media.repository.ts`, `src/lib/supabase/storage.ts`, `src/lib/media-client.ts`, `src/components/common/MediaImage.tsx`, `src/components/backoffice/media/{MediaLibrary,MediaPicker}.tsx`, `src/app/(back-office)/admin/media/page.tsx`, `src/app/api/media/route.ts`, `src/app/api/media/[id]/route.ts`, `drizzle/0002_dapper_lethal_legion.sql`
- Modifiés : `src/db/schema.ts` (table `media`), `next.config.ts` (remotePatterns), `src/components/backoffice/SidebarNav.tsx` (Médias), `src/components/backoffice/pages/modules/form-fields.tsx` (MediaFields + picker), `package.json` (exifr, sharp), `drizzle/meta/_journal.json`, `ROADMAP.md` (Phase 6, 6.1 `[x]`)
- Aucune modification des contrats des modules existants (`MediaFields` reste `{url, alt}`) ; aucune table hors `media`.

### Prochaine étape prévue
**Validation utilisateur** (avec Supabase Storage configuré : migration 0002 → upload→EXIF/blur→`media`, RLS Owner, suppression, `MediaPicker` dans un module) puis **Phase 6 – Étape 6.2** : rendu public optimisé des galeries (`MediaImage` dans les modules publiés, WebP/AVIF, placeholders) & éventuels Crop/éditeur.

---

## 2026-09-07 – 15:01 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.4 : Auth Supabase, Row Level Security (RLS) & Middleware Back-Office**
- **Plan validé** : [`plans/ROADMAP-5.4-auth-rls.md`](plans/ROADMAP-5.4-auth-rls.md) (plan fourni et validé par l'utilisateur, arbitrages par défaut : **Option A** — Drizzle scoping + RLS défense, `profiles.id = auth.uid()`, tenant démo public, CTA → `/admin/login`). L'Étape 5.4 introduit l'**authentification réelle du photographe** (Supabase Auth) et la **sécurisation** des données (RLS Owner/Public), avec **fallback démo** quand Supabase n'est pas configuré.
- **Dépendances** : `@supabase/supabase-js` + `@supabase/ssr` ajoutées.
- **Clients & couche Supabase** [`src/lib/supabase/`](src/lib/supabase) : `demo.ts` (`isSupabaseConfigured`/`getSupabaseEnv` — valeurs factices ignorées), `server.ts` (`createServerClient` @supabase/ssr, cookies Next), `browser.ts` (`createBrowserClient`), `middleware.ts` (`updateSession` — refresh session + retour `user`), `session.ts` (`getCurrentPhotographerId` = `auth.uid()`, `resolvePhotographerId` avec repli `DEMO_PROFILE_ID`), `auth.ts` (Server Actions `loginAction`/`signOutAction`).
- **Middleware** [`src/middleware.ts`](src/middleware.ts) (nouveau) : matcher `/admin/:path*` — rafraîchit la session, redirige les **non connectés** vers `/admin/login` (`/admin/login` exempté) ; **mode démo** (Supabase non configuré) → aucune garde.
- **Connexion / Déconnexion** : page [`/admin/login`](src/app/(back-office)/admin/login/page.tsx) (serveur) + formulaire client [`LoginForm.tsx`](src/components/backoffice/auth/LoginForm.tsx) (email/mot de passe → `loginAction`, message « mode démo » sans Supabase) ; bouton **Déconnexion** conditionnel dans le layout admin (session active) ; CTA publics « Connexion » du Header redirigés vers `/admin/login`.
- **RLS & trigger (SQL)** : migration [`drizzle/0001_auth_rls.sql`](drizzle/0001_auth_rls.sql) (éditée à la main + enregistrée au journal) — fonction/trigger `handle_new_user` (`profiles.id = auth.uid()` auto-créé à l'inscription) ; politiques **Owner RW** (`profiles`/`pages`/`page_modules`/`navigation_entries` via `photographer_id = auth.uid()` ou sous-requête sur la page propriétaire) et **Public RO** (`pages.status = 'published'`, modules `is_visible = true`, navigation `hidden = false` + page liée publiée). RLS conservée « défense en profondeur » (Option A : accès applicatif Drizzle scope par session).
- **Scoping session (5.3)** : Route Handlers `/api/pages`, `/api/navigation`, `/api/navigation/presets` utilisent `resolvePhotographerId()` (authentifié sinon tenant démo) ; `loadInitialData(photographerId)` alimente le layout admin avec l'id **authentifié** (repli démo), le Front-Office `/` conservant le tenant démo.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — route `/admin/login` en statique, **Proxy (Middleware)** détecté ; routes publiques/API inchangées). **Restant (environnement utilisateur)** : Supabase n'étant pas configuré ici, le **mode démo** est actif (garde inactive) — validation de bout en bout avec Supabase réelle (création d'utilisateur → trigger `profiles`, connexion `/admin/login`, isolation RLS Owner/Public, déconnexion) à effectuer.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.4-auth-rls.md`, `src/middleware.ts`, `src/lib/supabase/{demo,server,browser,middleware,session,auth}.ts`, `src/components/backoffice/auth/LoginForm.tsx`, `src/app/(back-office)/admin/login/page.tsx`, `drizzle/0001_auth_rls.sql`
- Modifiés : `package.json` (@supabase/*), `src/app/api/pages/route.ts`, `src/app/api/navigation/route.ts`, `src/app/api/navigation/presets/route.ts` (scoping session), `src/db/load-initial-data.ts` (`photographerId` param), `src/app/(back-office)/admin/layout.tsx` (session + déconnexion), `src/components/layout/Header.tsx` (CTA `/admin/login`), `drizzle/meta/_journal.json`, `ROADMAP.md` (5.4 `[x]`)
- **Aucun composant métier Back-Office/Page Builder modifié** (contrats préservés) ; aucune table ajoutée (politiques/trigger seulement).

### Prochaine étape prévue
**Validation utilisateur** (avec Supabase configuré : création utilisateur → `profiles` auto, connexion `/admin/login`, isolation RLS, déconnexion) puis suite de la feuille de route (phase suivante à définir — consolidation RLS/PostgREST ou volet suivant du ROADMAP).

---

## 2026-09-07 – 14:03 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.3 : Persistance CRUD (API Route Handlers & Synchronisation BDD)**
- **Plan validé** : [`plans/ROADMAP-5.3-crud-persistence.md`](plans/ROADMAP-5.3-crud-persistence.md) (plan fourni et validé par l'utilisateur). L'Étape 5.3 connecte les **actions d'édition** des stores (PagesStore & NavigationStore) à la BDD : chaque mutation locale (optimiste) est **persistée** quand la BDD est disponible, avec **fallback transparent** hors-BDD (l'app tourne toujours sans Supabase) et **préservation totale des contrats UI**.
- **Repositories d'écriture** : [`pages.repository.ts`](src/db/repositories/pages.repository.ts) — `createPage(photographerId, page)` (id explicite), `updatePage(pageId, data)`, `deletePage(pageId)` (cascade modules + nav via FK), `updateModules(pageId, modules)` (remplacement **transacté** de la liste ordonnée, ids préservés, contenu JSONB resserré au domaine) ; [`navigation.repository.ts`](src/db/repositories/navigation.repository.ts) — `saveNavigation(photographerId, navigation)` (remplacement Header/Footer transacté, arborescence aplatie `parent_id`/`position`) et `applyPreset(photographerId, presetId)` (atomique : recalcule `is_in_menu` des pages + remplace le Header, Footer intact).
- **Validation zod** : [`src/lib/schemas/persistence.ts`](src/lib/schemas/persistence.ts) (nouveau, zéro `any`) — `pageMetadataSchema`, `moduleSchema`, `updateModulesPayloadSchema`, `navEntrySchema` (auto-référencé via `z.ZodType<NavEntryValue>`), `saveNavigationPayloadSchema`, `applyPresetPayloadSchema`. Dépendance `zod` ajoutée.
- **Route Handlers** (serveur, tenant de démo `DEMO_PROFILE_ID`) : `POST /api/pages`, `PATCH /api/pages/[pageId]`, `DELETE /api/pages/[pageId]`, `PUT /api/pages/[pageId]/modules`, `PUT /api/navigation`, `POST /api/navigation/presets` — corps validés zod (400) / erreurs BDD (500).
- **Branchement des stores (fallback préservé)** : prop optionnelle `persistenceEnabled` (défaut `false`) transmise par les layouts via **`dbAvailable`** exposé par [`load-initial-data.ts`](src/db/load-initial-data.ts). [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : effet de **diff** état précédent/courant → appels granulaire (`create`/`update`/`delete` page + `updateModules`) ; [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : effet différencié (JSON) → `PUT /api/navigation`. Appels fire-and-forget via [`src/lib/persistence-client.ts`](src/lib/persistence-client.ts) (erreurs journalisées, aucune régression UI). La **synchro inter-stores** `PagesNavigationSync` reste côté client et sa persistance transite par ces mêmes écritures (état final cohérent en BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack — pages inchangées + **5 routes API** listées `/api/pages`, `/api/pages/[pageId]`, `/api/pages/[pageId]/modules`, `/api/navigation`, `/api/navigation/presets`) ; ESLint `npx eslint src` OK (0 erreur, 0 avertissement). **Restant (environnement utilisateur)** : avec `DATABASE_URL` + migration/seed 5.1, vérifier la persistance CRUD de bout en bout (créer/éditer/supprimer une page, réordonner les modules, éditer/masquer/réordonner la nav, appliquer un preset → rechargement `F5` = état conservé, contrôlable via `db:studio`).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.3-crud-persistence.md`, `src/lib/schemas/persistence.ts`, `src/lib/persistence-client.ts`, `src/app/api/pages/route.ts`, `src/app/api/pages/[pageId]/route.ts`, `src/app/api/pages/[pageId]/modules/route.ts`, `src/app/api/navigation/route.ts`, `src/app/api/navigation/presets/route.ts`
- Modifiés : `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts` (`dbAvailable`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `package.json` (zod), `ROADMAP.md` (5.3 `[x]`)
- **Aucun composant UI métier ni hook modifié** (contrats préservés) ; aucune table ajoutée.

### Prochaine étape prévue
**Validation utilisateur** (BDD configurée : migration + seed puis test CRUD persistant + preset via `db:studio`) puis **Phase 5 – Étape 5.4** : Activation RLS/Auth (`@supabase/supabase-js`, politiques owner/public, branchement `profiles.auth_user_id`) — les politiques RLS posées en 5.1 restent vides jusqu'ici (accès serveur « service »).

---

## 2026-09-07 – 13:31 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.2 : Hydratation SSR des Stores depuis la BDD**
- **Plan validé** : [`plans/ROADMAP-5.2-ssr-db-hydration.md`](plans/ROADMAP-5.2-ssr-db-hydration.md) (architecture fournie et validée par l'utilisateur). L'Étape 5.2 connecte les stores React/Client (Pages & Navigation) aux **données réelles PostgreSQL** via l'**hydratation SSR** — avec **fallback gracieux** sur le seed en mémoire et **préservation totale des contrats UI** (aucun composant/hook/formulaire modifié).
- **Repository layer** : [`src/db/repositories/pages.repository.ts`](src/db/repositories/pages.repository.ts) — `getPagesWithModules(photographerId)` (pages + modules ordonnés, mappers BDD → domaine : `is_in_menu`→`inMenu`, `is_visible`→`hidden = !is_visible`, `content` JSONB typé `ModuleContent`) ; [`src/db/repositories/navigation.repository.ts`](src/db/repositories/navigation.repository.ts) — `getNavigation(photographerId)` (reconstitution de l'**arborescence** Header Niveau 1 + Niveau 2 via `parent_id` et Footer, tri par `position`). Couches **purement serveur**.
- **Connexion paresseuse** : [`src/db/index.ts`](src/db/index.ts) réécrit — `getDatabase()` crée l'instance **au premier appel uniquement** (plus aucun throw à l'import → le build reste vert sans BDD) ; `connect_timeout: 5` ajouté au client `postgres` (fallback rapide si BDD injoignable). [`src/db/constants.ts`](src/db/constants.ts) (nouveau) : `DEMO_PROFILE_ID`/`DEMO_EMAIL`/`DEMO_DISPLAY_NAME` partagés — [`src/db/seed.ts`](src/db/seed.ts) adapté (constantes + `getDatabase()`).
- **Loader SSR** : [`src/db/load-initial-data.ts`](src/db/load-initial-data.ts) (nouveau) — `loadInitialData()` : charge les données du tenant de démo via les repositories et retourne `{ pages?, navigation? }` ; **tout échec BDD (ou données vides) → `{}`** (les Providers basculent sur le seed en mémoire).
- **Providers étendus (prop `initialData`)** : [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) — `initialData?: PagesInitialData` (init `useState` = données fournies sinon `createInitialState`) ; [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) — `initialData?: NavigationSnapshot` + hydratation **unique par session** via **`hydrateNavigation`** ajouté à [`navigation-store.ts`](src/lib/navigation-store.ts) (garde-fou module `hydrated` : aucun écrasement des mutations lors des remontages SPA `/admin` ↔ `/`).
- **Layouts / Server Components (async)** : [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) transmet `initial.navigation` au `NavigationStoreProvider` ; [`(back-office)/admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) transmet `initial.pages` + `initial.navigation` aux deux Providers. Contrats de props internes inchangés — aucun composant métier touché.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — routes inchangées `/`, `/admin`, `/admin/navigation`, `/admin/pages`, `/admin/pages/[id]` ; la BDD étant absente de l'environnement, le **fallback seed** est actif → aucune dépendance réseau au build). **Restant (environnement utilisateur)** : avec `DATABASE_URL` + migration/seed 5.1, vérifier que `/admin/*` et `/` sont hydratés depuis la BDD au rechargement (une modification BDD visible après hydratation).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.2-ssr-db-hydration.md`, `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`, `src/db/constants.ts`
- Modifiés : `src/db/index.ts` (connexion paresseuse + `connect_timeout`), `src/db/seed.ts`, `src/lib/navigation-store.ts` (`hydrateNavigation`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `ROADMAP.md` (5.2 `[x]`)
- **Aucun composant UI métier ni route modifiés** (contrats préservés) ; aucune table ajoutée.

### Prochaine étape prévue
**Validation utilisateur** (avec BDD configurée : migration + seed puis vérification de l'hydratation SSR sur `/admin/*` et `/`) puis **Phase 5 – Étape 5.3** : Persistance des actions (CRUD optimiste via Route Handlers + Drizzle) et activation RLS/Auth (remplacement de la réconciliation client `PagesNavigationSync` par des transactions serveur).

---

## 2026-09-07 – 13:03 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.1 : Schéma BDD PostgreSQL / Drizzle ORM & Migrations**
- **Plan validé** : [`plans/ROADMAP-5.1-database-schema.md`](plans/ROADMAP-5.1-database-schema.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 5.1 pose la **fondation Drizzle ORM** (PostgreSQL/Supabase) pour le Volet 2 : le jeu de données mock (`seedPages` + `buildSeedModules` + `buildSeedNavigation`) est modélisé en **tables** et peuplé par un **seed initial**, **sans aucun changement de comportement** des composants UI (Étapes 3.x → 4.5).
- **Schéma** [`src/db/schema.ts`](src/db/schema.ts) (nouveau, zéro `any`) : enums `page_status`, `module_type`, `module_animation`, `nav_zone`, `nav_kind` + tables **`profiles`** (ancrage tenant minimal), **`pages`** (mapping `SitePage` — `photographer_id` FK, `slug`/`title`/`menu_title`/`status`/`is_in_menu`, unicité `(photographer_id, slug)`), **`page_modules`** (mapping `PageModule` — `page_id` FK CASCADE, `module_type`, `order_index`, `is_visible = !hidden`, `animation`, `anchor_id`, `layout_variant`, **`content` JSONB typé `$type<ModuleContent>()`**), **`navigation_entries`** (mapping `NavMenuEntry` — `zone`, `kind`, `hidden`, `auto`, `page_id` FK→`pages`, **`parent_id` auto-jointure FK CASCADE pour le Niveau 2**, `position` ; index `nav_zone_order_idx`, `nav_page_id_idx`, `nav_parent_id_idx`). Types d'insertion dérivés (`PageInsert`, …) exportés.
- **Configuration & client** : [`drizzle.config.ts`](drizzle.config.ts) (racine — `schema`/`out`/`dialect postgresql`/`dbCredentials.url` depuis `.env.local`) ; [`src/db/index.ts`](src/db/index.ts) (client Drizzle singleton `postgres-js` conservé sur `globalThis` sous HMR, erreur explicite si `DATABASE_URL` absente) ; scripts `db:generate`, `db:migrate`, `db:seed`, `db:studio` ajoutés dans [`package.json`](package.json) ; dépendances `drizzle-orm` + `postgres` et dev `drizzle-kit`, `tsx`, `dotenv` ; `DATABASE_URL` (échantillon) ajouté à [`.env.example`](.env.example).
- **Migration générée** : `drizzle/0000_calm_rockslide.sql` (enums, 4 tables, FK CASCADE y compris l'**auto-jointure** `parent_id`, index, unicité) + **activation RLS** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`) ajoutée en fin de migration — **aucune politique** posée (accès serveur « service » ; politiques owner/public à l'étape Auth 5.x).
- **Seed initial** [`src/db/seed.ts`](src/db/seed.ts) (nouveau, `tsx`, **idempotent**) : réutilise les helpers métier (`seedPages`, `buildSeedModules`, `pageHref`) — reset du tenant de démo (id fixe, cascade) puis insertion de `profiles` (demo), des **5 pages**, de leurs **modules par défaut** (`order_index` 1..n, `content` JSONB) et des **`navigation_entries`** (Header 5 racines `auto` liées aux pages + sous-menu **Portfolio** 3 `custom` en Niveau 2 via `parent_id` + Footer manuel sans l'Accueil).
- **Transition progressive (blueprint §5 du plan)** : 5.1 = infra pure (app intacte) → 5.2 hydration SSR via prop `initialData` (contrat de props inchangé) → 5.3 CRUD optimiste via Route Handlers + RLS/Auth. Draft SQL historique `-----PourMémoSQLeditor-CreationTable.md` conservé (obsolète, documenté).
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4, TypeScript terminé — routes inchangées `/`, `/admin`, `/admin/navigation`, `/admin/pages`, `/admin/pages/[id]` : aucun fichier UI/app modifié). **Restant (environnement utilisateur)** : renseigner `DATABASE_URL` dans `.env.local` puis `npm run db:migrate` et `npm run db:seed` (2 passes pour vérifier l'idempotence) — hors exécution possible dans cet environnement (pas de BDD accessible).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.1-database-schema.md`, `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`, `drizzle/0000_calm_rockslide.sql` (+ `drizzle/meta/*`)
- Modifiés : `package.json` (dépendances + scripts `db:*`), `.env.example` (`DATABASE_URL`), `ROADMAP.md` (Phase 5 créée, 5.1 `[x]`)
- **Aucun** fichier `src/components/**`, `src/app/**`, `src/lib/{pages,navigation,navigation-store}.ts` modifié — application intacte ; aucune route ni table SaaS ajoutée.

### Prochaine étape prévue
**Validation utilisateur** : configurer `DATABASE_URL` (Supabase pooler ou locale `supabase start`) → `npm run db:migrate` + `npm run db:seed` (×2 pour l'idempotence) → inspection `db:studio` puis **Phase 5 – Étape 5.2** : Hydration SSR des stores via la BDD (prop `initialData`, fallback seed) sans changer le contrat des composants.

---

## 2026-09-07 – 12:39 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Gestionnaire de Menu & Navigation) – Étape 4.5 : Rendu Front-Office dynamique du Header & Footer**
- **Plan validé** : [`plans/ROADMAP-4.5-front-navigation.md`](plans/ROADMAP-4.5-front-navigation.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.5 **branche enfin le Front-Office public sur le store de navigation** construit aux Étapes 4.1 → 4.4 : le Header et le Footer cessent d'être des composants statiques alimentés par [`site.ts`](src/lib/site.ts) pour **consommer dynamiquement les zones `header` / `footer`** du `NavigationStore`. **Décision structurante** : le `NavigationStore` devient un **store partagé au niveau module** (singleton en mémoire + `useSyncExternalStore`) consommé par `/admin` **ET** `/` — les modifications et Presets Onboarding du Back-Office sont **visibles immédiatement sur le site public** au sein d'une même session (un rechargement plein réinitialise sur le seed — limite du mock, persistance BDD à venir).
- **Store module partagé** [`src/lib/navigation-store.ts`](src/lib/navigation-store.ts) (nouveau, zéro `any`) : état `{ navigation, appliedPresetId }` en singleton, `getNavigationSnapshot`, `getNavigationServerSnapshot` (SSR/hydratation stable), `subscribeNavigation`, `setNavigationState(updater)` (notification de tous les abonnés). [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) réécrit en **fine couche** `useSyncExternalStore(subscribeNavigation, getNavigationSnapshot, getNavigationServerSnapshot)` exposant **la même valeur de contexte** (navigation, `appliedPresetId`, actions) — **aucun consommateur Back-Office ne change** (`PagesNavigationSync`, `NavigationManager`, `PresetOnboardingPanel`, `NavEntryForm`…).
- **Composant utilitaire** [`src/components/common/NavLink.tsx`](src/components/common/NavLink.tsx) (nouveau) : résolution **unifiée** des cibles — URL externe `https://…` → `<a target="_blank" rel="noopener noreferrer">` ; `/route` → Next `<Link>` (navigation App Router) ; `#ancre` (même page) → défilement lisse avec **offset du Header fixe** ; `/route#ancre` → si déjà sur `/route` défilement lisse, sinon `router.push` puis défilement après changement de route (effet borné, `requestAnimationFrame`, aucun `setState` synchrone — règle ESLint). `onNavigate` (fermeture menu mobile/dropdown), état actif `aria-current="page"` via `usePathname`, respect de `prefers-reduced-motion`.
- **Header** [`src/components/layout/Header.tsx`](src/components/layout/Header.tsx) : devient `"use client"` et lit `getEntries("header")` ; chrome (barre fixe `h-16`, glassmorphism nacré, marque serif, CTA « Connexion ») **conservé à l'identique**. **Desktop** (`hidden md:flex`) : Niveau 1 en liens directs ou **« parents » à chevron** avec **menu déroulant Niveau 2** au survol/focus (`group-hover` / `group-focus-within`, `pointer-events` neutralisé quand masqué). **Mobile** (sous `md`) : **burger → Sheet Radix** latéral ; racine sans enfant = lien pleine largeur, parent = **Accordion** (Trigger libellé + chevron, Content = enfants) ; CTA en pied de Sheet ; fermeture après activation (`onNavigate`).
- **Footer** [`src/components/layout/Footer.tsx`](src/components/layout/Footer.tsx) : devient `"use client"` et lit `getEntries("footer")` — la colonne **« Navigation »** liste les entrées **visibles** via `<NavLink>` ; les blocs marque + réseaux sociaux (`socialLinks`) et mentions légales (`legalLinks`) restent alimentés par `site.ts` (hors store). Structure, styles et copyright inchangés.
- **Layout public** [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) : monte `<NavigationStoreProvider>` autour de `<Header /> / <main> / <Footer />` — grâce au store module partagé, l'instance et celle du layout `/admin` lisent le même état en mémoire (Provider sans nœud DOM : les enfants restent directs du `<body>` en `flex flex-col`).
- **Filtre `hidden !== true` appliqué à chaque niveau** (racine + sous-menu, Header ET Footer) : « masquer » = ne pas rendre (pas supprimer), cohérent avec le Back-Office ; le `hidden` d'une entrée `page` brouillon est maintenu par la synchro côté `/admin` (store partagé → le public en hérite). Rendu public **SSR** (Client Components rendus côté serveur → balisage présent au premier chargement, pas de flash, contenu indexable).
- **Périmètre documenté & validé** : aucune route de page publique créée (les liens peuvent pointer vers des routes inexistantes — comme l'actuel `site.ts`) ; persistance BDD/Supabase hors périmètre (limite du mock : rechargement plein = retour au seed) ; `PagesStore`/`PagesNavigationSync` inutiles côté public (le store embarque déjà `href`/`hidden`/`label` résolus) ; aucune modification de charte « Éclat Minéral » ; schéma BDD inchangé.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4, compilation + passe TypeScript réussies) ; `npm run lint` OK (0 erreur, 0 avertissement). La validation interactive par l'utilisateur (`npm run dev`, cf. §8 du plan) reste à effectuer.

### Fichiers créés ou modifiés
- Créés : `src/lib/navigation-store.ts`, `src/components/common/NavLink.tsx`, `plans/ROADMAP-4.5-front-navigation.md`
- Modifiés : `src/components/backoffice/navigation/NavigationStoreProvider.tsx` (fine couche `useSyncExternalStore` sur le store module), `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/app/(front-office)/layout.tsx` (Provider monté), `ROADMAP.md` (4.5 `[x]`)
- Aucune dépendance nouvelle (Sheet/Accordéon/Button shadcn déjà présents), aucune route publique ajoutée, aucun changement de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** sur `/` (Header seed : Niveau 1 + sous-menu Portfolio au survol/focus Desktop ; redimensionner sous `md` → burger/Sheet/Accordéon ; ancre `#…`/`/page#…` → défilement fluide sans passage sous le Header fixe ; URL externe → `_blank` ; `/admin/navigation` → masquer un item ou appliquer un **Preset** → retour SPA sur `/` : Header/Footer publics reflètent l'état ; Footer colonne Navigation dynamique ; `F5` → retour au seed — limite mock documentée) puis **suite de la feuille de route** (l'intégration BDD/Supabase reste la prochaine grande étape une fois les volets mock consolidés).

---

## 2026-09-07 – 12:11 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.4 : Injection des Presets Onboarding de Navigation (Artiste, Commercial, Passionné)**
- **Plan validé** : [`plans/ROADMAP-4.4-nav-presets-onboarding.md`](plans/ROADMAP-4.4-nav-presets-onboarding.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.4 introduit les **Presets de Navigation Onboarding** (spec §7.2-D) dans l'écran Navigation (`/admin/navigation`) : le photographe choisit un **profil d'activité** et le menu principal est reconstruit selon une structure « starter » — *Artiste / Auteur* (Portfolio · Séries · À propos · Contact), *Photographe Pro / Commercial* (Accueil · Prestations avec sous-menu Mariage/Portrait/Corporate · À propos · Contact) et *Passionné / Semi-Pro* (Accueil · Galeries · Contact).
- **Sémantique validée (option retenue)** : appliquer un preset **devient la structure de référence** — l'application est **atomique sur les deux stores** : (1) recalcule le flag `inMenu` de toutes les pages existantes (`updatePage` — pages retenues → `true`, pages vitrines non retenues → `false`) puis (2) **remplace le Header** (`applyPreset`). La synchro auto [`PagesNavigationSync`](src/components/backoffice/navigation/PagesNavigationSync.tsx) est alors **idempotente** (aucun ré-ajout parasite de page `inMenu`, aucune entrée auto orpheline). **Footer inchangé**.
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) : types `NavPresetId` (`"artiste" | "commercial" | "passionne"`), `NavPresetTarget` (cible `page` par slug ou `href` directe), `NavPresetNode` (sous-menu Niveau 2 en `children`), `NavPreset`, catalogue **`NAV_PRESETS`** (mapping documenté — « Tarifs » fusionné dans la page seed « Prestations & Tarifs », « RDV/CTA » → item Contact, « Connexion » = item final placeholder) et **`resolveNavPreset`** (helper **pur** → `{ header, inMenuByPageSlug }` : page trouvée → entrée `page` **auto** cohérente avec la synchro (`hidden` si brouillon) ; page absente → entrée `custom` **manuelle** placeholder `/<slug>` ; cible `href` → entrée `custom` manuelle).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : état `appliedPresetId` (badge « Preset actif ») + action **`applyPreset(header, presetId)`** (remplace le Header, Footer intact) ; toute **mutation manuelle** (`addEntry`, `updateEntry`, `removeEntry`, `relocateEntry`, `moveNavItem`, `moveEntry`) **réinitialise** `appliedPresetId` à `null` (menu personnalisé) ; `useMemo` dépend de `appliedPresetId` pour propager le badge aux consommateurs.
- **Écran** : nouveau [`PresetOnboardingPanel.tsx`](src/components/backoffice/navigation/PresetOnboardingPanel.tsx) (composant **présentational** — 3 cartes de profil `NAV_PRESETS` avec aperçu racine + sous-menu, badge « Preset actif », Dialog de confirmation détaillant le remplacement du menu et la réorganisation des pages) intégré en tête de [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) ; orchestration **`handleApplyPreset`** (`resolveNavPreset` → `updatePage` pour chaque `inMenu` modifié → `applyPreset`). Couplage inter-stores assumé et documenté (Layout `/admin` : `PagesStoreProvider` > `NavigationStoreProvider`).
- **Périmètre documenté & validé** : Footer jamais modifié ; Front-Office public toujours **non branché** sur le store mock (Server Component via `site.ts`, répété depuis 4.1) ; aucune création automatique de pages (placeholders `custom` manuels — un éventuel doublon futur avec une page créée ensuite reste un choix manuel du photographe) ; ancres de sous-menu en chaînes libres (aucun couplage fort aux modules) ; schéma BDD inchangé.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/navigation`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement). La validation interactive par l'utilisateur (`npm run dev`) reste à effectuer.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts` (presets + `resolveNavPreset`), `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager}.tsx` (`appliedPresetId`/`applyPreset` + panel + orchestration), `ROADMAP.md` (4.4 `[x]`)
- Créés : `plans/ROADMAP-4.4-nav-presets-onboarding.md`, `src/components/backoffice/navigation/PresetOnboardingPanel.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (appliquer chaque preset → structure conforme au mapping, badge « Preset actif », retrait des pages non retenues dans `/admin/pages` sans réapparition ; édition manuelle → badge « personnalisé ») puis **suite de la feuille de route** (`ROADMAP.md` — l'intégration BDD/Supabase reste la prochaine grande étape une fois les volets mock consolidés).

---

## 2026-09-07 – 11:49 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.3 : Sous-menus Niveau 2, Drag & Drop et liens ancres/externes**
- **Plan validé** : [`plans/ROADMAP-4.3-navigation-advanced.md`](plans/ROADMAP-4.3-navigation-advanced.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.3 fait passer l'écran Navigation (`/admin/navigation`) d'une arborescence **plate** (4.1/4.2) à une arborescence **hiérarchique restructurable** (spec §7.2-D & §8) : **sous-menus de Niveau 2** dans le **Header uniquement** (le Footer reste plat), **re-structuration par Drag & Drop** (`@hello-pangea/dnd`) et **cibles de lien unifiées** (pages internes, ancres `#…`, chemins `/page#ancre`, URL externes `https://…`).
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) : `NavMenuEntry.children?: NavMenuEntry[]` (Niveau 2, profondeur **max 2**) ; `NavItemKind` renommé `"link"` → `"custom"` (lien personnalisé) ; **`normalizeHref` centralisé/exporté** (ancres, relatif + ancre, URL externes) ; helpers **purs** : `hasNavChildren`, `findNavEntry`, `findNavParentId`, `insertNavEntry`, `updateNavEntry`/`removeNavEntry` (**récursifs**, suppression = cascade du sous-menu), `moveNavEntryAcross` (déplacement entre listes racine/enfant, `structuredClone`) ; seed : **sous-menu de démonstration** sous « Portfolio » (enfants manuels Mariages/Portraits/Corporate → `/portfolio#…`).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : actions passées en **arbres** — `addEntry(area, entry, parentId?)`, `updateEntry`/`removeEntry` récursifs, `relocateEntry(area, id, toParentId)` (déplacement via formulaire), `moveNavItem(area, source, destination)` (DnD). Garde-fous : **Footer plat** (tout `parentId` ignoré), **profondeur max 2** (un item qui porte un sous-menu ne peut pas être imbriqué), refus d'auto-parent.
- **Synchro** [`PagesNavigationSync.tsx`](src/components/backoffice/navigation/PagesNavigationSync.tsx) : parcours du Header devenu **récursif** (racine + sous-menus) — une entrée `auto` (page `inMenu`) peut être **imbriquée** et reste retrouvée/purgée où qu'elle soit ; Footer inchangé ; règles 4.2 conservées (aucune boucle inter-stores, liens libres `pageId: null` et ordre jamais touchés).
- **Écran** [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) : **un `DragDropContext` par zone** (aucun glisser Header ↔ Footer). Le Header porte une liste racine + **une zone enfant par item de Niveau 1** (toujours montée → cible de dépôt fiable, car `@hello-pangea/dnd` ne mesure pas un droppable ajouté pendant le glisser) : déposer un lien de Niveau 1 dans la zone d'un autre l'**imbrique** (Niveau 2), le déposer dans la racine le **désimbrique**. Le Footer reste **plat** (réordonnancement simple). [`NavEntryRow.tsx`](src/components/backoffice/navigation/NavEntryRow.tsx) : **poignée `GripVertical`** (seule zone draggable — pattern `ModuleRow`), marqueur « Sous-menu » + icône pour le Niveau 2, **retrait des boutons ↑/↓** (provisoires 4.1). Suppression d'un parent = **cascade du sous-menu** (Dialog de confirmation « + n liens »).
- **Formulaire** [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) : type **« Lien personnalisé »** (`custom` — ancres/URL via `normalizeHref` importé) + champ **« Rattachement »** (Header : racine ou item de Niveau 1 ; **verrouillé à la racine** si l'item édité possède déjà un sous-menu) ; payload `{ label, kind, href, pageId, parentId }` → `addEntry(parentId)` / `relocateEntry`.
- **Montage sans SSR** : [`NavigationManagerScreen.tsx`](src/components/backoffice/navigation/NavigationManagerScreen.tsx) (nouveau, `dynamic(…, { ssr: false })`, miroir de `PageEditorScreen`) monté par [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) — `@hello-pangea/dnd` jamais rendu côté serveur.
- **Périmètre documenté & validé** : le **rendu public** (Header `/`) n'est **pas branché** sur le store mock (Server Component alimenté par `site.ts` — répété depuis 4.1, le branchage viendra avec l'intégration BDD/Supabase). Les **ancres sont saisies en texte libre** (aucun couplage fort avec les modules des pages, cf. plan §0.3). La validation interactive par l'utilisateur (`npm run dev`) reste à effectuer.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts` (arbre `children`, `kind custom`, `normalizeHref`, helpers), `src/components/backoffice/navigation/{NavigationStoreProvider,PagesNavigationSync,NavigationManager,NavEntryRow,NavEntryForm}.tsx`, `src/app/(back-office)/admin/navigation/page.tsx` (wrapper ssr:false), `ROADMAP.md` (4.3 `[x]`, 4.4 `[IN_PROGRESS]`)
- Créés : `plans/ROADMAP-4.3-navigation-advanced.md`, `src/components/backoffice/navigation/NavigationManagerScreen.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (réordonner par poignée ; imbriquer/désimbriquer un lien au Header ; refus d'imbriquer un parent avec sous-menu ; « Rattachement » du formulaire ; cascade de suppression ; synchro auto même imbriquée ; normalisation `#ancre` / `/page#ancre` / `https://…`) puis **Phase 4 – Étape 4.4** : Injection des Presets Onboarding de Navigation (Artiste, Commercial, Passionné).

---

## 2026-09-05 – 22:10 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.2 : Rattachement dynamique des pages (Navigation ↔ Pages)**
- **Plan validé** : [`plans/ROADMAP-4.2-pages-nav-sync.md`](plans/ROADMAP-4.2-pages-nav-sync.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.2 interconnecte automatiquement la gestion des Pages et l'arborescence de Navigation (spec §7.2-D) : création (option « Ajouter au menu »), mise à jour MenuTitle/slug, dépublication (masquage) et suppression (cascade / anti-liens orphelins).
- **Prérequis structurant (corrigé vs proposition initiale)** : le `NavigationStoreProvider` était **local à la route** `/admin/navigation` (4.1) — une synchro depuis `/admin/pages` était impossible. Le Provider navigation est **globalisé dans le Layout `/admin`** (au même niveau que `PagesStoreProvider`) ; retrait du Provider local de la page [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) (rend désormais directement `NavigationManager`).
- **Modèle Pages** [`src/lib/pages.ts`](src/lib/pages.ts) : `inMenu: boolean` ajouté à `SitePage` + `PageMetadataDraft` (source de vérité du rattachement auto, future colonne `pages.show_in_menu`) ; `seedPages` passées à `inMenu: true` ; `createPage`/`updatePage` propagent `inMenu` via le spread du draft.
- **Modèle Navigation** [`src/lib/navigation.ts`](src/lib/navigation.ts) : `NavMenuEntry.pageId: string | null` (lien stable vers `SitePage`) + `NavMenuEntry.auto: boolean` (entrée **auto** gérée par `inMenu` vs **manuelle**) ; `createNavEntry` étendu (`pageId`, `auto`) ; `buildSeedNavigation` : Header en entrées **auto**, Footer en entrées **manuelles** (purgé seulement à la suppression d'une page).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : payload `NewNavEntry` (+ `pageId`/`auto`), `addEntry` enrichi ; Provider désormais **global** (commentaire d'en-tête mis à jour).
- **Pont de synchronisation** [`PagesNavigationSync.tsx`](src/components/backoffice/navigation/PagesNavigationSync.tsx) (nouveau, `"use client"`, rend `null`, monté sous les deux Providers dans le Layout `/admin`) : réconciliation **idempotente** — (1) toute page `inMenu` sans entrée Header `pageId` → ajout d'une entrée **auto** ; (2) mise à jour `label`/`href`/`hidden` de toutes les entrées liées (auto ET manuelles, Header/Footer) quand la page existe ; (3) retrait du Header **uniquement des entrées auto** dont la page quitte le menu ; (4) cascade : retrait de toute entrée liée dont la page n'existe plus. Garde-fous : liens libres (`pageId: null`) et ordre jamais touchés ; comparaison avant `setState` → aucune boucle Pages ↔ Navigation.
- **Formulaire de page** [`PageMetadataForm.tsx`](src/components/backoffice/pages/PageMetadataForm.tsx) : option **« Ajouter au menu principal »** (`Switch`, pré-rempli `initial?.inMenu`) — **cochée par défaut à la création** (rattachement automatique attendu, désactivable). [`PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) transmet `inMenu` dans le draft.
- **Écran Navigation** [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) : les pages cibles sont typées `{ id, menuTitle, href }` — la sélection « Page du site » retient le **`pageId`** et remplit `label` (`menuTitle`) + `href` ; le payload soumis (`NavEntryFormData`) porte `pageId`. [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) adapté (mapping `id`, `handleSubmit` avec `pageId`).
- **Corrections post-validation (retours utilisateur)** : (a) un lien ajouté **manuellement** dans l'écran Navigation était immédiatement purgé par la réconciliation quand la page cible avait `inMenu` non coché → introduction du marqueur `auto` : seules les entrées **auto** sont retirées quand la page quitte le menu, les **manuelles** ne sont purgées que si la page est supprimée ; (b) l'option « Ajouter au menu » est désormais **cochée par défaut** pour qu'une nouvelle page apparaisse automatiquement ; (c) correction de la zone cible de `updateEntry` (le point 2 traitait le Footer en Header).
- **Périmètre documenté & validé** : le **rendu public** (Header `/`) n'est **pas branché** sur le store mock (Server Component alimenté par `site.ts`) — le branchage des menus sur le site public viendra avec l'intégration BDD/Supabase (répété depuis 4.1). La synchro Pages ↔ Navigation fonctionne dans le Back-Office.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/navigation`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts` (`inMenu`), `src/lib/navigation.ts` (`pageId` + `auto`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager,NavEntryForm}.tsx`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/app/(back-office)/admin/layout.tsx` (Providers + sync globalisés), `src/app/(back-office)/admin/navigation/page.tsx` (Provider retiré), `ROADMAP.md`
- Créés : `plans/ROADMAP-4.2-pages-nav-sync.md`, `src/components/backoffice/navigation/PagesNavigationSync.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (créer une page avec « Ajouter au menu » → apparition dans `/admin/navigation` ; modifier menuTitle/slug → mise à jour ; dépublier → masquée ; supprimer → purgée Header & Footer) puis **Phase 4 – Étape 4.3** : Re-structuration par Drag & Drop du Menu (éléments de Niveau 1, sous-menus de Niveau 2, liens vers ancres/externes).

---

## 2026-09-05 – 21:10 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.1 : Écran « Navigation & Menus » (organisation de l'arborescence du Header / Footer) — `/admin/navigation`**
- **Plan validé** : [`plans/ROADMAP-4.1-navigation.md`](plans/ROADMAP-4.1-navigation.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.1 crée l'écran d'administration des menus du site (spec §7.2-D) : listes ordonnées Header/Footer, CRUD d'items (libellé + cible), **Toggle Eye** (masquer sans supprimer) et réordonnancement ↑/↓. Périmètre **strict** : arborescence plate ; les sous-menus Niveau 2 + Drag & Drop + ancres/externes restent en **4.3**, le rattachement auto des pages en **4.2**, les presets en **4.4**.
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) (nouveau, logique pure, zéro `any`) : types `NavArea` ("header"/"footer"), `NavItemKind` ("page"/"link"), `NavMenuEntry {id, label, kind, href, hidden}`, `SiteNavigation` ; fabriques `createNavEntry`, `buildSeedNavigation` (Header depuis `seedPages` — Accueil + pages vitrines ; Footer sans l'Accueil), helper pur `moveNavEntry` (↑/↓). Mappage futur table `nav_items` documenté (schéma BDD non modifié).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) (nouveau, Provider client **local à la route**) : état `{header, footer}` seedé par `buildSeedNavigation` ; actions `getEntries`, `addEntry`, `updateEntry`, `removeEntry`, `moveEntry` (mutations clonantes) ; hook `useNavigationStore` = seule porte d'accès.
- **Écran** : [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) (zones « Menu principal — Header » et « Navigation du pied de page — Footer », compteurs, états vides, Dialog ajout/édition + confirmation suppression) ; [`NavEntryRow.tsx`](src/components/backoffice/navigation/NavEntryRow.tsx) (badge type Page/Lien, cible `href` mono, Toggle Eye `Eye`/`EyeOff` + badge « Masqué », ↑/↓ désactivés aux extrémités, édition, suppression) ; [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) (Dialog : libellé + type de cible — « Page du site » (Select alimenté par `usePagesStore`) ou « Lien libre » (Input slug/URL préfixé `/`), validation légère).
- **Routes & intégration** : page serveur [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) (metadata + `<NavigationStoreProvider><NavigationManager /></NavigationStoreProvider>`) ; nouveau [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx) (Client Component isolé pour `usePathname` — calcule l'entrée active « Pages »/« Navigation » selon la route, conserve les entrées « À venir » désactivées) branché dans [`admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) qui reste **Server Component** ; l'entrée sidebar « Navigation » passe de désactivée à fonctionnelle.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/app/(back-office)/admin/layout.tsx` (sidebar « Navigation » active + extraction `SidebarNav`), `ROADMAP.md`
- Créés : `plans/ROADMAP-4.1-navigation.md`, `src/lib/navigation.ts`, `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager,NavEntryRow,NavEntryForm}.tsx`, `src/components/backoffice/SidebarNav.tsx`, route `src/app/(back-office)/admin/navigation/page.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office (Header/Footer/`site.ts` inchangés) ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/navigation` : sidebar → Navigation actif, lister/masquer/↑/↓, ajouter/éditer/supprimer un lien page ou libre) puis **Phase 4 – Étape 4.2** : Rattachement dynamique des pages (mise en lien automatique du `MenuTitle` des pages créées dans la navigation).

---

## 2026-09-05 – 20:08 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.4 : Formulaire CRUD en vue dépliée (édition des contenus & réglages de chaque module) — éditeur `/admin/pages/[id]`**
- **Plan validé** : [`plans/ROADMAP-3.4-crud-expanded.md`](plans/ROADMAP-3.4-crud-expanded.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 3.4 remplace la **Vue Dépliée « lecture seule »** de l'Étape 3.3 par un **formulaire CRUD complet** contrôlé par le store, persistant en **temps réel sans rechargement** (spec §7.2-B « Vue Dépliée - CRUD »).
- **Modèle typé (union discriminé, zéro `any`)** [`src/lib/pages.ts`](src/lib/pages.ts) : nouveaux types `MediaField`, `ServiceItem`, `FaqItem`, `GalleryImage` et `ModuleContent` (union discriminé par `type`, 7 familles — hero, about, services, cta-banner, gallery, faq, contact) ; `PageModule` étendu avec `content: ModuleContent` (+ `layoutVariant?: string` **réservé** pour le futur Layout Switcher, non édité en 3.4) ; fabrique `createModuleContent(type)` (contenus par défaut riches, `crypto.randomUUID()` pour les items, instance neuve à chaque appel) ; `createModule` intègre `content` ; `buildSeedModules` conserve sa signature + surcharge seed du Hero de l'Accueil ; constantes `moduleAnimationLabels`/`moduleAnimationOrder` (déplacées depuis `ModuleRow`).
- **Store** [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : nouvelle action `updateModule(pageId, moduleId, patch: Partial<PageModule>)` — mutation clonante fusionnant le patch et rafraîchissant `updatedAt` de la page ; le `content` est committé **en bloc** (jamais partiel) pour préserver le typage de l'union.
- **Dossier de formulaires** `src/components/backoffice/pages/modules/` (nouveau) : `form-fields.tsx` (champs partagés accessibles via `useId` : `TextField`, `TextAreaField`, `MediaFields` URL+Alt) ; `ModuleSettingsForm.tsx` (réglages généraux : Titre d'affichage, Ancre `#id` avec validation légère + **alerte d'ancre dupliquée** non bloquante, Animation via `Select`) ; `ModuleContentEditor.tsx` (routeur discriminé sur `content.type`, switch exhaustif TS, aucun cast) ; 7 éditeurs de famille : `ModuleHeroEditor`, `ModuleAboutEditor`, `ModuleServicesEditor` (liste items titre/description/prix), `ModuleCtaBannerEditor`, `ModuleGalleryEditor` (liste visuels URL+Alt), `ModuleFaqEditor` (liste question/réponse), `ModuleContactEditor` (email/téléphone/adresse). Listes avec ajout/suppression (clés `item.id` stables), ordre conservé (réordonnancement d'images hors périmètre 3.4).
- **Intégration** [`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) : la Vue Dépliée remplace le récapitulatif par deux sections (« Réglages » → `ModuleSettingsForm`, « Contenu » → `ModuleContentEditor`) séparées par un `Separator` ; le bandeau 3.3 (poignée, œil, suppression, chevron) inchangé. [`ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) : câblage `handleUpdateModule` (→ `updateModule`) + `hasDuplicateAnchor` (détection d'ancre partagée). Compatibilité Drag & Drop préservée : poignée seule draggable, champs hors du trigger, saisies (flèches/Tab) non interceptées.
- **Portée volontairement allégée (assumé, validé par l'utilisateur)** : upload média non branché (placeholder URL — l'upload R2/Sharp viendra avec l'intégration stockage), 2e bouton CTA, variantes internes (`layoutVariant` réservé), assistants IA — enrichissements planifiés dans des phases ultérieures une fois les briques BDD/stockage/IA intégrées (spec §8).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts` (types de contenu + fabriques + labels animation), `src/components/backoffice/PagesStoreProvider.tsx` (action `updateModule`), `src/components/backoffice/pages/ModuleRow.tsx` (formulaires dans la Vue Dépliée), `src/components/backoffice/pages/ModuleDndList.tsx` (câblage updateModule + ancre dupliquée), `ROADMAP.md`
- Créés : `plans/ROADMAP-3.4-crud-expanded.md`, dossier `src/components/backoffice/pages/modules/` (`form-fields.tsx`, `ModuleSettingsForm.tsx`, `ModuleContentEditor.tsx`, `ModuleHeroEditor.tsx`, `ModuleAboutEditor.tsx`, `ModuleServicesEditor.tsx`, `ModuleCtaBannerEditor.tsx`, `ModuleGalleryEditor.tsx`, `ModuleFaqEditor.tsx`, `ModuleContactEditor.tsx`)
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route nouvelle, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (ouvrir un module → modifier titre/ancre/animation, saisir les contenus, ajouter/supprimer des items, vérifier la persistance au repli/rouverture et le drag) puis **Phase 4 – Étape 4.1** : Écran « Navigation & Menus » (Interface d'organisation de l'arborescence du Header/Footer).

---

## 2026-09-05 – 16:35 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.3 : Composant Accordéon Compact (Drag handle, nom du module, Toggle Eye de masquage, suppression) — éditeur de page `/admin/pages/[id]`**
- **Plan validé** : [`plans/ROADMAP-3.3-accordion-compact.md`](plans/ROADMAP-3.3-accordion-compact.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 3.3 transforme le bandeau provisoire de 3.2 en **gestionnaire Accordéon Compact** (spec §7.2-B) : Vue Compacte repliable (poignée DnD, libellé cliquable + chevron, Toggle Eye, suppression avec confirmation) et Vue Dépliée en **récapitulatif lecture seule** préparant le CRUD de l'Étape 3.4.
- **Store** [`src/components/backoffice/PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) (modifié) : nouvelle action `setModuleHidden(pageId, moduleId, hidden)` — mutation clonante qui pilote le champ `hidden` déjà présent sur `PageModule` (jusqu'ici inexploité). Sémantique : `hidden = true` → le module n'est pas rendu sur le site public (masqué sans suppression).
- **Canvas DnD + Accordéon** [`src/components/backoffice/pages/ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) (modifié) : l'`Accordion` Radix (`type="single"` `collapsible`, valeur = `module.id`) est intégré **à l'intérieur** du conteneur `Droppable` ; état contrôlé `openModuleId` (un seul module déplié à la fois, l'état suit l'item après réordonnancement) ; handlers `handleRemove` (referme l'accordéon si l'item supprimé était ouvert) et `handleToggleHidden`. `DragDropContext`/`Draggable` et `moveModule` inchangés (DnD 3.2 préservé, poignée = unique zone de drag).
- **Item accordéon compact** [`src/components/backoffice/pages/ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) (réécrit) : devient un `AccordionPrimitive.Item` (ref `innerRef` + `draggableProps` posées sur l'item racine). Bandeau : poignée `GripVertical` (`dragHandleProps`), trigger personnalisé (icône `ModuleIcon`, numéro + titre, meta catégorie · ancre, chevron rotatif) — **boutons frères, aucun `<button>` imbriqué** ; Toggle Eye (`Eye`/`EyeOff`, `aria-pressed`, tooltip) ; suppression `Trash2` → **`Dialog` de confirmation** (avertissement si le module est visible sur le site). Rendu « Masqué » : badge « Masquée », `EyeOff`, libellé estompé, fond grisé. Vue Dépliée (`AccordionContent`) : récapitulatif lecture seule (Type, Catégorie, Ancre `#…`, Animation avec libellés français, Visibilité) + encart « L'édition détaillée du contenu arrive à l'étape 3.4 » (aucun champ éditable — périmètre 3.4).
- **Ajustement post-validation (retour utilisateur)** : augmentation de la lisibilité des titres de sections accordéon — titre passé en `text-[15px] leading-6 font-semibold`, meta en `text-[13px] leading-5`, padding vertical du trigger élargi (`py-1.5`).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement — suppression d'une directive `eslint-disable react-hooks/refs` devenue inutile dans `ModuleDndList`).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/PagesStoreProvider.tsx` (action `setModuleHidden`), `src/components/backoffice/pages/ModuleDndList.tsx` (Accordéon contrôlé + handlers), `src/components/backoffice/pages/ModuleRow.tsx` (réécriture AccordionItem compact + taille des titres), `ROADMAP.md`
- Créés : `plans/ROADMAP-3.3-accordion-compact.md`
- Aucune dépendance nouvelle, aucun composant UI nouveau (`accordion.tsx`/`dialog.tsx` déjà injectés), aucune route nouvelle, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/pages` → « Ouvrir l'éditeur » → déplier/replier un module, masquer/afficher à l'œil, réordonner au drag, supprimer avec confirmation) puis **Phase 3 – Étape 3.4** : Formulaire CRUD en vue dépliée (Édition des champs textuels, boutons CTA, ancres `#id` et médias) — la vue dépliée de 3.3 (récapitulatif lecture seule + encart) fournit le conteneur réutilisé.

---

## 2026-09-05 – 15:30 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.2 : Conteneur Drag & Drop des modules (`@hello-pangea/dnd`) + menu « + Ajouter une section » (éditeur de page `/admin/pages/[id]`)**
- **Plan validé** : [`plans/ROADMAP-3.2-pagebuilder-dnd.md`](plans/ROADMAP-3.2-pagebuilder-dnd.md) (architecture rédigée en mode Architect, validée par l'utilisateur).
- **Store mock global au Back-Office** — [`src/components/backoffice/PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) (nouveau, Client Component) : Provider React Context posé dans le Layout Dashboard (Server Component conservé) autour de la zone de contenu ; porte l'état partagé `pages` + `modulesByPage` (initialisation unique `seedPages` + `buildSeedModules(slug)` par page). Hook `usePagesStore` (le seul accès) : `getPage`, `createPage`, `updatePage`, `deletePage` (supprime aussi les modules), `getModules`, `addModule`, `removeModule`, `moveModule`. Mutations clonantes, `updatedAt` ISO, zéro `any`.
- **Modèle étendu** [`src/lib/pages.ts`](src/lib/pages.ts) : types `PageModuleType` (hero/about/services/cta-banner/gallery/faq/contact), `ModuleAnimation`, `PageModule` (id/type/title/hidden/animation/anchorId, mappe 1:1 vers la future table `page_modules`), `ModuleMeta` + catalogue `moduleCatalog` (7 modules, 6 catégories — spec §8) ; fabriques `createModule` (id `randomUUID`, ancres indexées), `buildSeedModules(slug)` (modules par défaut par page seed ; pages créées = canvas vide) ; helper pur `reorderModules` (Drag & Drop).
- **Refactor liste** [`src/components/backoffice/pages/PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) : l'état local `useState` de l'Étape 3.1 **remonte dans le store** (comportement CRUD conservé) ; nouvelle action « Ouvrir l'éditeur » (icône `LayoutTemplate` + titre cliquable) → `router.push("/admin/pages/[id]")`. La page serveur [`(back-office)/admin/pages/page.tsx`](src/app/(back-office)/admin/pages/page.tsx) cesse de passer `initialPages` (seed dans le Provider).
- **Éditeur de page** (route dynamique [`[id]/page.tsx`](src/app/(back-office)/admin/pages/[id]/page.tsx) + `PageEditorScreen.tsx` monté via `next/dynamic ssr:false` pour isoler `@hello-pangea/dnd` de l'hydratation SSR) : [`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx) — en-tête (retour, titre + statut `Badge` + slug + compteur, « Aperçu » nouvel onglet, « + Ajouter une section »), canvas (liste DnD ou état vide « Cette page est vide »), état « Page introuvable » si id absent du store.
- **Drag & Drop** [`ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) : `DragDropContext`/`Droppable` (droppableId par page)/`Draggable` (`draggableId` stable = `module.id`) ; `onDragEnd` → `moveModule` (via `reorderModules`). [`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) : bandeau compact (poignée `GripVertical` en `dragHandleProps`, `ModuleIcon`, libellé + catégorie + ancre, suppression `Trash2`). Désactivation ciblée `react-hooks/refs` documentée (pattern d'adaptateur officiel de la lib).
- **Catalogue « + Ajouter une section »** [`AddSectionSheet.tsx`](src/components/backoffice/pages/AddSectionSheet.tsx) : `Sheet` latérale droite (shadcn/ui injectée [`src/components/ui/sheet.tsx`](src/components/ui/sheet.tsx), wrapper Radix Dialog déjà présent) ; catalogue groupé par catégorie → clic = `addModule(pageId, type)` (ajout en fin de canvas). [`ModuleIcon.tsx`](src/components/backoffice/pages/ModuleIcon.tsx) : mapping type → icône lucide centralisé.
- **Dépendance** : installation de `@hello-pangea/dnd@^18.0.1` (compatible React 19, installée sans conflit de peerDependencies).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/app/(back-office)/admin/layout.tsx` (Provider englobant), `src/app/(back-office)/admin/pages/page.tsx` (sans prop), `src/lib/pages.ts`, `src/components/backoffice/pages/PagesManager.tsx` (store + éditeur), `ROADMAP.md`, `package.json` & `package-lock.json` (`@hello-pangea/dnd`)
- Créés : `plans/ROADMAP-3.2-pagebuilder-dnd.md`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/ui/sheet.tsx`, `src/app/(back-office)/admin/pages/[id]/page.tsx`, `src/components/backoffice/pages/{PageEditor,PageEditorScreen,ModuleDndList,ModuleRow,AddSectionSheet,ModuleIcon}.tsx`
- Supprimés : fichiers journaux temporaires de build (`_build-3-2.txt`, `_build-3-2.log`)

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/pages` → « Ouvrir l'éditeur » → réordonner les modules au glisser-déposer, ajouter/supprimer des sections, état vide sur nouvelle page) puis **Phase 3 – Étape 3.3** : Composant Accordéon Compact (Drag handle, nom du module, Toggle Eye de masquage, suppression) — l'Étape 3.2 a fourni le bandeau provisoire réutilisé.

---

## 2026-09-05 – 14:05 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.1 : Métadonnées de Page (restructuration des routes en groupes + Dashboard `/admin` + gestionnaire de Pages CRUD simulé)**
- **Restructuration `src/app` en route groups** (conforme ARCHITECTURE.md §2 / plan §1.1) : layout racine [`src/app/layout.tsx`](src/app/layout.tsx) neutralisé (`<html>/<body>` + fonts + metadata uniquement) ; création du route group [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) reprenant à l'identique le chrome public (Header + `main pt-20` + Footer) et déplacement de la page d'accueil vers [`(front-office)/page.tsx`](src/app/(front-office)/page.tsx) (copie conforme, rendu `/` inchangé). Suppression de l'ancien `src/app/page.tsx` et du fichier orphelin accidentel `src/app/------(front-office)` (résidu de la session interrompue). URLs publiques préservées (les route groups n'ajoutent aucun segment).
- **Portée `.admin`** dans [`src/app/globals.css`](src/app/globals.css) : palette neutre « épurée & haut contraste » (fond blanc, surfaces grises `zinc`, primaire sombre `#18181b`, destructif rouge net) appliquée sur le conteneur du Layout Dashboard — aucun token du Front-Office modifié hors portée.
- **Chrome Dashboard** [`(back-office)/admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) (Server Component, `class="admin"`, Desktop-first) : barre latérale fixe `w-60` (marque « Administration », nav « Pages » active, entrées « À venir » désactivées avec tooltip) + barre supérieure (lien « Aperçu du site » `/` + avatar initiales) + zone contenu `flex-1` (pas de `pt-20`, pas de Header/Footer public). Point d'entrée [`(back-office)/admin/page.tsx`](src/app/(back-office)/admin/page.tsx) : `redirect("/admin/pages")`.
- **Composants UI injectés** dans `src/components/ui/` (convention shadcn/ui moderne `data-slot`, cohérente avec Button/Input/Dialog existants) : `label.tsx` (Radix Label), `select.tsx` (Radix Select complet), `switch.tsx` (Radix Switch), `badge.tsx` (variants `default`/`secondary`/`outline`/`success`/`warning`/`destructive`), `textarea.tsx`, `separator.tsx`. Dépendances installées : `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-separator`.
- **Modèle & helpers** [`src/lib/pages.ts`](src/lib/pages.ts) : types `PageStatus`, `SitePage` (mappe 1:1 vers la future table `pages`), `PageMetadataDraft` ; helpers `slugify` (NFD + retrait des accents), `slugFromTitle`, `uniqueSlug`, `pageHref` ; jeu de données `seedPages` (miroir de `mainNav`). TypeScript strict, zéro `any`, aucune dépendance.
- **Formulaire** [`src/components/backoffice/pages/PageMetadataForm.tsx`](src/components/backoffice/pages/PageMetadataForm.tsx) (Client Component, création/édition) : Titre H1/SEO (Input requis), MenuTitle (Input, max 28, compteur), Slug URL (Input éditable + préfixe `/` + bouton « Régénérer », auto-suggestion depuis le titre tant que le slug n'est pas saisi manuellement ; slug vide autorisé pour la page d'accueil), Statut (`Select` Brouillon/Publié). Validation légère côté client (requis + unicité du slug affichée en temps réel), messages d'erreur accessibles (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Écran de gestion** [`src/components/backoffice/pages/PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) (Client Component, persistance simulée `useState`) : barre d'actions (titre + compteurs + « + Nouvelle page »), liste tableau Desktop-first (Page + MenuTitle, URL `/slug` ouvrable, `Badge` Statut Publié/Brouillon, Mis à jour formaté `fr-FR`, actions éditer/supprimer), Dialog création/édition embarqué (`PageMetadataForm`, unicité hors page courante), Dialog de confirmation de suppression (avertissement si page publiée). Mutations : `crypto.randomUUID()` + `updatedAt` ISO + tri récentes d'abord.
- **Page serveur** [`(back-office)/admin/pages/page.tsx`](src/app/(back-office)/admin/pages/page.tsx) : titre metadata + `<PagesManager initialPages={seedPages} />` (prépare le futur SSR Supabase sans changer le contrat de props).
- Correction du typage du layout racine : remplacement de `LayoutProps<"/">` (scaffold) par `{ children: ReactNode }` (le layout racine englobe désormais `/` et `/admin`).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/`, `/_not-found`, `/admin`, `/admin/pages`).

### Fichiers créés ou modifiés
- Modifiés : `src/app/layout.tsx`, `src/app/globals.css`, `ROADMAP.md`, `package.json` & `package-lock.json` (dépendances Radix Label/Select/Switch/Separator)
- Créés : `src/app/(front-office)/page.tsx`, `src/app/(back-office)/admin/layout.tsx`, `src/app/(back-office)/admin/page.tsx`, `src/app/(back-office)/admin/pages/page.tsx`, `src/lib/pages.ts`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/components/backoffice/pages/PagesManager.tsx`, `src/components/ui/{label,select,switch,badge,textarea,separator}.tsx`
- Supprimés : `src/app/page.tsx` (déplacé), `src/app/------(front-office)` (orphelin accidentel)

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/` inchangé ; `/admin` → `/admin/pages` : chrome Dashboard, liste seed, création/édition/suppression de pages) puis **Phase 3 – Étape 3.2** : Conteneur Drag & Drop des modules (`@hello-pangea/dnd`) & menu « + Ajouter une section » dans l'éditeur de page.

---

## 2026-09-05 – 13:19 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.3 : création du Canvas central de la Page d'Accueil (`/`) reliant le Header et le Footer**
- `src/app/page.tsx` (réécrit) : remplacement du scaffold Next.js par le **Canvas central vierge** du Front-Office — section pleine hauteur `min-h-[calc(100svh-5rem)]` (compense le Header fixe `h-16` + offset `pt-20` du RootLayout) entre le Header et le Footer, halo nacré doux en arrière-plan (`bg-accent/25` + `blur-3xl`, aucun code couleur en dur), sur-titre « Photographe professionnel » (Plus Jakarta, `tracking-[0.3em]`), marque `siteName` en Cormorant Garamond (`text-5xl`→`lg:text-7xl`, `font-light`), accroche et doubles CTA (`Button` `size="lg"` default → `/portfolio` et outline → `/contact`). Placeholder « Page de garde » destiné à être alimenté par les modules du Page Builder (SPECIFICATIONS-V8.md §3.2).
- Les liens CTA pointent vers les routes `/portfolio` et `/contact` créées dans les phases ultérieures (pattern inchangé du Header).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Modifiés : `src/app/page.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** — la Phase 2 (Frame Global Front-Office : Header, Footer, Canvas d'accueil) est alors complète ; passage à la **Phase 3 – Back-Office Page Builder (Étape 3.1 : Métadonnées de Page)**.

---

## 2026-09-05 – 13:15 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.2 : création du composant `Footer` et intégration dans le RootLayout**
- `src/components/layout/Footer.tsx` (créé) : Server Component statique (aucun `"use client"`) — fond surface nacrée `bg-[var(--surface-color)]` + bordure haute perle `border-t border-[var(--border-color)]` ; marque en Cormorant Garamond (`var(--font-heading)`) reliée à l'accueil, textes/liens secondaires en Plus Jakarta Sans (`var(--font-body)`) ; blocs « Navigation » (réutilisation `mainNav`), « Informations » (mentions légales `legalLinks`) et marque + réseaux sociaux (`socialLinks` Instagram/Pinterest, liens externes `target="_blank" rel="noopener noreferrer"` avec icône `ArrowUpRight`) ; ligne basse avec copyright dynamique (`© {year} {siteName}`, année en cours calculée au rendu). Props optionnelles `siteName` / `navItems` / `socialItems` / `legalItems` / `year` (générique et réutilisable).
- `src/lib/site.ts` (étendu) : ajout des sources de config partagées — `socialLinks` (Instagram, Pinterest) et `legalLinks` (Mentions légales, Politique de confidentialité, CGU/CGV, Gestion des cookies) pointant vers leurs futurs slugs (affichage en modales prévu en phase ultérieure, spec §3.1).
- `src/app/layout.tsx` : import et placement de `<Footer />` en bas du `<body>`, après le `<main className="flex-1 pt-20">` (le `flex-1` maintient le Footer en bas de page sur les contenus courts).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Créés : `src/components/layout/Footer.tsx`
- Modifiés : `src/lib/site.ts`, `src/app/layout.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.3** : création du Canvas central vierge reliant le Header et le Footer sur la Page d'Accueil (`/`).

---

## 2026-09-05 – 13:02 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.1 : création du composant `Header` fixe (glassmorphism nacré) et intégration dans le RootLayout**
- `src/lib/site.ts` (créé) : source unique et découplée de la config du site — `siteName` (TODO : à brancher sur les réglages du photographe), type `NavItem` et `mainNav` (Accueil, Portfolio, Prestations, À propos, Contact) pointant vers les futurs slugs (le Header reste fonctionnel en attendant la création des routes).
- `src/components/layout/Header.tsx` (créé) : Server Component statique (aucun `"use client"`) — glassmorphism nacré (`glass` + bordure basse perle `border-b border-[var(--border-color)]/60`), barre `fixed inset-x-0 top-0 z-50` (hauteur `h-16`), marque en Cormorant Garamond (`var(--font-heading)`) reliée à l'accueil, nav desktop `hidden md:flex` avec hover doux sur accent nacré (`hover:bg-accent/40`), CTA `Button` shadcn `variant="outline" size="sm" asChild` → `Link /login`. Props optionnelles `siteName` / `navItems` / `ctaLabel` (générique et réutilisable, prévu Footer Étape 2.2).
- `src/app/layout.tsx` : import de `<Header />`, placement en tête du `<body>` + compensation `pt-20` (5rem = `h-16` + 16px) sur le conteneur `<main className="flex-1 pt-20">` pour que le contenu défile sous la barre fixe sans être masqué.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Créés : `src/lib/site.ts`, `src/components/layout/Header.tsx`
- Modifiés : `src/app/layout.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.2** : création du composant `Footer` fixe (Réseaux sociaux, mentions légales, copyright).

---

## 2026-09-05 – 12:48 (heure locale America/Bogota)

### Tâche exécutée
**Phase 1 (Socle Technique) – Étape 1.3 : configuration des Design Tokens du thème « Éclat Minéral & Nacre » (`globals.css`) + injection des composants de base `shadcn/ui`**
- `src/app/globals.css` : remplacement du scaffold par les variables « produit » du thème (`--bg-color`, `--surface-color`, `--surface-color-soft`, `--text-color`, `--accent-color`, `--accent-color-strong`, `--border-color`, `--text-muted`) et typographies (`--font-body` / `--font-heading`) ; mapping sémantique `shadcn/ui` (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, radius) ; signature premium (ombre nacre `shadow-pearl` / `shadow-pearl-sm`, utility `glass` de glassmorphism, easing `ease-silk`) ; garde-fou `@media (prefers-reduced-motion: reduce)` ; mode sombre de secours.
- `src/app/layout.tsx` : duo typographique « Éditorial & Luxe » via `next/font` (Cormorant Garamond titres + Plus Jakarta Sans corps), `lang="fr"`, `metadata` mis à jour.
- Installation des dépendances `shadcn/ui` : `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-slot`, `@radix-ui/react-accordion`, `@radix-ui/react-dialog`.
- Création : `src/lib/utils.ts` (helper `cn`), `components.json` (config `shadcn/ui`) et des composants `src/components/ui/{button,input,accordion,dialog}.tsx`.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/app/globals.css`, `src/app/layout.tsx`, `package.json` & `package-lock.json` (dépendances shadcn/ui)
- Créés : `src/lib/utils.ts`, `components.json`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/accordion.tsx`, `src/components/ui/dialog.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.1** : création du composant `Header` fixe (Nom du photographe, barre de navigation, bouton de connexion).

---

## 2026-09-05 – 12:35 (heure locale America/Bogota)

### Tâche exécutée
**Phase 1 (Socle Technique) – Finalisation : déplacement du scaffold Next.js de `tmp_scaffold/` vers la racine du workspace**
- Déplacement vers la racine de `src/` (App Router), `public/`, `node_modules/`, des fichiers de configuration et des fichiers racine du scaffold.
- Contournement d'un blocage Windows sur le renommage de dossiers hérités via `robocopy /MOVE` (copie fichier par fichier puis suppression source).
- Suppression des reliquats : `tmp_scaffold/.next` (cache régénéré), `tmp_scaffold/tsconfig.json` et `tmp_scaffold/README.md` (versions racine conservées), puis suppression du dossier temporaire `tmp_scaffold/`.
- Renommage du paquet `tmp_scaffold` → `saas-portfolio-photographe` (`package.json` + `package-lock.json`).
- Vérification d'intégrité : `npm run build` réussi et `npx tsc --noEmit` sans erreur (mode strict conservé).

### Fichiers créés ou modifiés
- Déplacés à la racine : `package.json`, `package-lock.json`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `src/` (`src/app/...`), `public/`, `node_modules/`
- Modifiés : `package.json` & `package-lock.json` (nom du paquet) ; `tsconfig.json` (config racine conservée, complétée par Next : `plugins.next`, includes `.next/types`)
- Supprimés : `tmp_scaffold/` (intégralement)

### Prochaine étape prévue
**ROADMAP – Étape 1.3 `[IN_PROGRESS]`** : configuration des Design Tokens du thème « Éclat Minéral » (fichier `globals.css` de l'application) et injection des composants de base `shadcn/ui` (Button, Input, Accordion, Dialog) dans `src/components/ui/`.

