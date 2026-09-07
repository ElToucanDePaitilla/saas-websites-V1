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