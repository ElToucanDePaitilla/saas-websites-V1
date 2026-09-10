# FEUILLE DE ROUTE DE DÉVELOPPEMENT (ROADMAP)

## Phase 1 : Socle Technique & Infrastructure
- [x] **Étape 1.1** : Initialisation du projet Next.js (App Router), TypeScript et Tailwind CSS.
- [x] **Étape 1.2** : Configuration de Supabase (Client, middleware Auth et variables `.env.local`).
- [x] **Étape 1.3** : Configuration de `styles/globals.css` avec les Design Tokens du thème "Éclat Minéral" et injection des composants de base `shadcn/ui` (Button, Input, Accordion, Dialog).

---

## Phase 2 : Frame Global (Front-Office)
- [x] **Étape 2.1** : Création du composant `Header` fixe (Nom du photographe, barre de navigation, bouton de connexion).
- [x] **Étape 2.2** : Création du composant `Footer` fixe (Réseaux sociaux, mentions légales, copyright).
- [x] **Étape 2.3** : Création du Canvas central vierge reliant le Header et le Footer sur la Page d'Accueil (`/`).

---

## Phase 3 : Back-Office - Créateur de Pages (Page Builder)
- [x] **Étape 3.1** : Métadonnées de Page (Formulaire de création de page : Titre H1/SEO, MenuTitle, Slug URL, statut publié/brouillon).
- [x] **Étape 3.2** : Conteneur Drag & Drop des modules (`@hello-pangea/dnd`) & Menu déroulant « + Ajouter une section ».
- [x] **Étape 3.3** : Composant Accordéon Compact (Drag handle, nom du module, Toggle Eye de masquage, suppression).
- [x] **Étape 3.4** : Formulaire CRUD en vue dépliée (Édition des champs textuels, boutons CTA, ancres `#id` et médias).

---

## Phase 4 : Back-Office - Gestionnaire de Menu & Navigation
- [x] **Étape 4.1** : Écran « Navigation & Menus » (Interface d'organisation de l'arborescence du Header/Footer).
- [x] **Étape 4.2** : Rattachement dynamique des pages (Mise en lien automatique du `MenuTitle` des pages créées dans la navigation).
- [x] **Étape 4.3** : Re-structuration par Drag & Drop du Menu (Gestion des éléments de Niveau 1, sous-menus de Niveau 2, et liens vers ancres/externes).
- [x] **Étape 4.4** : Injection des Presets Onboarding de Navigation (Artiste, Commercial, Passionné).
- [x] **Étape 4.5** : Rendu Front-Office dynamique du Header & Footer (branchage sur le store Navigation partagé, sous-menus Niveau 2, ancres/URL externes).

---

## Phase 5 : Intégration BDD & Persistance (Supabase / Drizzle ORM)
- [x] **Étape 5.1** : Schéma BDD PostgreSQL via Drizzle ORM (tables `profiles`, `pages`, `page_modules`, `navigation_entries` avec auto-jointure Niveau 2), migrations & seed initial (app Next intacte).
- [x] **Étape 5.2** : Hydratation SSR des stores depuis la BDD (repository layer, prop `initialData` sur les Providers, fallback seed, contrats UI préservés).
- [x] **Étape 5.3** : Persistance CRUD des actions (repositories d'écriture, Route Handlers `/api/*` validés zod, synchro persistée Pages ↔ Navigation, fallback hors-BDD).
- [x] **Étape 5.4** : Auth Supabase & RLS (`@supabase/ssr`, `/admin/login`, middleware `/admin/*`, politiques Owner RW/Public RO + trigger `profiles.id = auth.uid()`, fallback démo).

---

## Phase 6 : Stockage Médias & Performance (Supabase Storage / Galerie)
- [x] **Étape 6.1** : Supabase Storage `portfolio-media`, Media Library `/admin/media` (upload/EXIF/blur, suppression), table `media`, wrapper `next/image` + MediaPicker branché sur les modules (fallback démo).
- [x] **Étape 6.2** : Rendu public optimisé des galeries (renderers `src/components/modules/`, `MediaImage` lazy/priority/blur, Lightbox EXIF, page `/demo`).
- [x] **Étape 6.3** : Pages publiques dynamiques `/[slug]` + Accueil `/` (getPublicPage BDD→seed, `PageModuleRenderer`, `generateMetadata` SEO/OG) & migration proxy Next 16.

---

## Phase 11 : Rubrique « Galeries & Portfolio » (modules multi-variantes)
- [x] **Étape 11.1** : Domaine & persistance — famille `gallery` à variantes (`static` / `dynamic` / `portfolio`) discriminées dans le JSONB (**sans migration** : `module_type` reste `gallery`), effets, ombre, bordure, CTA, Lightbox, albums, `resolveGalleryContent` rétro-compatible (legacy masonry → `static`), catalogue à 3 cartes, `galleryContentSchema` zod.
- [x] **Étape 11.2** : Effets & briques visuelles — `src/lib/gallery-effects.ts` (Passe-partout de Musée / Sous-Verre / Polaroid papier glacé, light/normal/strong), ombre nacre 4 niveaux, bordure (épaisseur + couleur), `CTAButton`.
- [x] **Étape 11.3** : Grille & vignettes — `GalleryGrid` (uniforme / masonry, colonnes responsives), `GalleryItem` (`MediaImage` lazy, ratio anti-CLS, effets, survol, curseurs selon variante), `GalleryAlbumBadge`.
- [x] **Étape 11.4** : `LightboxModal` générique (unique) — clavier/Échap, focus trap, ARIA, zoom HD, plein écran, cycle fit → 1,5× → 2,5×, pan au clic maintenu sans scroll.
- [x] **Étape 11.5** : `GalleryManager` — orchestration static / dynamic / portfolio et branchement du rendu public (`PageModuleRenderer`).
- [x] **Étape 11.6** : Éditeurs Back-Office — `ImportMediaPanel`, `GalleryLayoutPanel`, `EffectSettingsPanel`, `GalleryCtaPanel`, `LightboxSettingsPanel`, `AlbumManagerPanel`, `GalleryImagesPanel`, routeur `ModuleGalleryEditor`.
- [x] **Étape 11.7** : Démo `/demo` (3 galeries + albums thématiques) & validation `tsc` / `eslint` / `build`.
- [x] **Étape 11.8** : Suivi `ROADMAP.md` + `CHANGELOG.md`.

### Correctifs après recette (Phase 11)
- [x] **Étape 11.9** : **Gallery Dynamic en clic simple** (garde anti-fermeture du backdrop) ; **alerte** dans l'éditeur quand le CTA est activé sans libellé ou sans lien.
- [x] **Étape 11.10** : `LightboxModal` — **pan fiable** (armement du drag avant capture, écouteurs fenêtre, `translate3d`, `overscroll` contenu, aucun ascenseur natif) et **préchargement** des images voisines (fluidité du diaporama).
- [x] **Étape 11.11** : Focus — restauration **uniquement** pour les ouvertures clavier (suppression de l'anneau coloré résiduel) et anneau de focus discret.
- [x] **Étape 11.12** : Galeries **vides par défaut** (photos et albums ajoutés dynamiquement, aucun masque pré-créé) ; seed nettoyé de la galerie vide.
- [x] **Étape 11.13** : **Conversion WebP qualité 80 à l'upload** (`sharp`, JPEG/PNG/WebP/AVIF ; SVG/GIF/vidéos exclus ; repli sur l'original) — EXIF lu sur l'original, dimensions/blur sur le WebP.
- [x] **Étape 11.14** : **Lazy loading** systématique des photos de galerie et prop `quality` sur `MediaImage` (80 en Lightbox et grilles).
- [x] **Étape 11.15** : Validation `tsc` / `eslint` / `build` + `ROADMAP.md` / `CHANGELOG.md`.

> Note : les Phases 7 (Héro 7.1→7.4), 8 (Profil propriétaire), 9 (Identité visuelle) et 10 (Onboarding) sont documentées dans `plans/ROADMAP-*.md` et restent à reporter dans cette feuille de route.