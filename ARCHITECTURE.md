<!--
==============================================================================
NOTICE D'UTILISATION DU FICHIER ARCHITECTURE.MD
------------------------------------------------------------------------------
À quoi sert ce fichier ?
1. Expliciter l'architecture technique, le modèle de données PostgreSQL (Supabase) 
   et le flux d'informations pour que Kilo Code comprenne où placer le code 
   et comment les entités interagissent.
2. Définir le cadre logique (Règles RLS, multi-tenancy) pour que Kilo Code génère
   et construise les nouvelles tables au fur et à mesure de l'avancement du projet.
3. Servir de référence visuelle pour la structure des fichiers, le rendu Next.js,
   le moteur de stockage et les intégrations API.
==============================================================================
-->

# ARCHITECTURE TECHNIQUE ET MODÈLE DE DONNÉES (SAAS PORTFOLIO)

## 0. Directive Cadrage & Périmètre pour Kilo Code

Le projet comporte deux volets indissociables :
1. **Volet 1 – SaaS Multi-tenants (Gestion Plateforme Centralisée) :** Landing page commerciale, offres/abonnements, facturation SaaS, gestion des tenants photographes, codes promo[cite: 4].
2. **Volet 2 – Portfolio & Application Photographe (Produit Cœur) :** Sites web publics du photographe, Page Builder, espaces clients privés, e-commerce de tirages, module de devis/réservation et Dashboard d'administration photographe[cite: 1, 4].

**Consigne d'implémentation :**
- **Vision BDD globale :** Le modèle de données (tables, clés étrangères `photographer_id` / `tenant_id`, politiques RLS) est structuré pour supporter la cohabitation des deux volets dès l'origine.
- **Création progressive des tables :** Kilo Code générera les tables, schémas Drizzle et migrations au fur et à mesure du développement des fonctionnalités sous la directive de l'utilisateur.
- **Périmètre d'amorçage :** Le développement se concentre **exclusivement sur le Volet 2 (Portfolio Photographe)**.

---

## 1. Flux d'Information et Rendu (Next.js App Router)

- **Front-Office (Site Public Photographe - Volet 2) :** Next.js App Router avec Rendu **ISR (Incremental Static Regeneration)** / Statique pour une vitesse d'affichage ultra-rapide et un SEO optimal.
- **Back-Office (Dashboard Photographe & Page Builder - Volet 2) :** **SSR (Server-Side Rendering)** + **Client Components** isolés pour l'interactivité Drag & Drop (`@hello-pangea/dnd` ou `@dnd-kit`) et l'édition via accordéons compacts.
- **Gestion d'État UI & Cache :** React Server Components (RSC) nativement, `useState`/`useContext` pour les accordéons et états locaux, TanStack Query pour les requêtes dynamiques complexes et temps réel.
- **Design System & Styling :** Tailwind CSS + `shadcn/ui` (code source local injecté dans `/components/ui/`)[cite: 1, 3]. Injection dynamique des 15 palettes et typographies via variables CSS globales `:root` (`--bg-color`, `--surface-color`, `--accent-color`, `--text-color`). Zéro surcoût CSS-in-JS en runtime.
- **API & Backend :** Next.js Route Handlers (`/app/api/...`) + Client/Serveur SDK Supabase.
- **Base de Données & Auth :** Supabase (PostgreSQL) avec **Row Level Security (RLS)** strict et extension `pgvector` pour l'indexation sémantique/visuelle.
- **Stockage Médias :** Cloudflare R2 (API compatible S3) + Sharp pour l'optimisation et la conversion WebP automatique (qualité 80%)[cite: 1, 2].

---

## 2. Structure et Organisation des Dossiers

```text
/
├── app/
│   ├── (front-office)/       # Pages publiques du site photographe & galeries (Rendu ISR)
│   ├── (back-office)/        # Dashboard Admin Photographe & Page Builder (Rendu SSR)
│   └── api/                  # Route Handlers Next.js (Webhooks Stripe, IA, Uploads)
├── components/
│   ├── ui/                   # Composants atomiques réutilisables (shadcn/ui local)
│   └── modules/              # Blocs autonomes du Page Builder (/hero, /gallery, etc.)
├── lib/
│   ├── supabase/             # Clients SDK Supabase (Server, Client, Middleware)
│   └── schemas/              # Validation Zod & Définitions TypeScript
├── styles/
│   └── globals.css           # Déclaration des variables CSS :root & Signature visuelle
├── ARCHITECTURE.md           # Schéma BDD, règles RLS & Principes techniques
├── SPECIFICATIONS_V8.md      # Cahier des charges fonctionnel et métier
├── PROJECT_CONTEXT.md        # Design System "Éclat Minéral & Nacre"
├── ROADMAP.md                # Feuille de route du projet étape par étape
└── .kilorules                # Directives strictes de développement pour Kilo Code