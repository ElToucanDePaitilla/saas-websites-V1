# Plan — ROADMAP Étape 3.1 : Métadonnées de Page (Back-Office / Page Builder)

## Objectif

Amorcer la **Phase 3 – Back-Office « Créateur de Pages »** en isolant architecturalement
l'administration du chrome public, puis créer l'**écran de gestion des Pages** avec son
formulaire de **Métadonnées de Page** (Titre H1/SEO, MenuTitle, Slug URL auto-suggéré,
statut Brouillon/Publié).

À l'issue de cette étape, le photographe doit pouvoir **créer, lister, éditer et
supprimer des pages** (persistance simulée en mémoire, en attendant l'intégration
Supabase/Drizzle d'une phase ultérieure).

## Références projet

- `ROADMAP.md` — Phase 3, Étape 3.1 `[PENDING]`.
- `SPECIFICATIONS-V8.md` §7.2-D « Champs Création de Page : Titre SEO/H1, MenuTitle
  (nom abrégé pour le menu) et emplacement » + §7.2-B (Page Builder) + §9.1 (Client
  Components isolés, Desktop-first).
- `PROJECT_CONTEXT.md` §1.2 : Dashboard Back-Office = « interface d'administration
  épurée et hautement contrastée basée sur des standards UI/UX de productivité
  (shadcn/ui) », **Desktop-first**.
- `.kilorules` §0.2, §1 (avancement strict étape par étape, validation explicite,
  CHANGELOG), §2 (structure `(front-office)` / `(back-office)`), §3 (pas de `any`,
  variables CSS uniquement).
- `ARCHITECTURE.md` §2 : arborescence cible `app/(front-office)/` et `app/(back-office)/`.
- Composants déjà injectés : `src/components/ui/{button,input,accordion,dialog}.tsx`.
- Alias `@/*` → `./src/*`, tokens thème dans `src/app/globals.css`.

## 0. Décisions d'architecture (préalables à valider)

1. **Route Groups.** Restructurer `src/app` en deux groupes de routes conformément à
   `ARCHITECTURE.md` §2, sans modifier les URLs publiques (un route group n'ajoute pas
   de segment) :
   - `(front-office)/` → héberge le chrome public actuel (Header + `main pt-20` + Footer)
     et la page d'accueil déplacée.
   - `(back-office)/` → héberge le Dashboard (chrome admin dédié, sans Header/Footer
     public), accessible sous l'URL `/admin`.
2. **Écran cible de l'étape** : `/admin/pages` (Gestion des Pages) + `/admin`
   (redirection simple vers `/admin/pages`).
3. **Persistance simulée.** Aucun SDK Supabase/Drizzle n'est encore intégré au code.
   L'Étape 3.1 fournit un **mock en mémoire** (seed + `useState`) et un **type `SitePage`**
   conçu pour mapper 1:1 vers la future table `pages` (Titre/MenuTitle/Slug/statut).
   Le schéma BDD **n'est pas modifié** à ce stade (règle `.kilorules` §4).
4. **Style admin.** L'administration réutilise les tokens shadcn/ui existants mais avec
   une **portée `.admin`** dans `globals.css` (fond neutre, surfaces grises, accent plus
   contrasté, primaire sombre) pour respecter l'exigence « épurée et hautement
   contrastée », **sans impacter le Front-Office**.
5. **Composants UI.** Compléter la bibliothèque locale shadcn/ui avec les primitives
   manquantes nécessaires au formulaire et à la liste : `Label`, `Select`, `Switch`,
   `Badge`, `Textarea`, `Separator` (aucune dépendance UI externe fermée).

## 1. Fichiers concernés

### 1.1 Restructuration des routes — `src/app/`

**État actuel :**
```
src/app/
├── layout.tsx      ← racine : <html>/<body> + Header + main(pt-20) + Footer
├── page.tsx        ← accueil publique
└── globals.css
```

**État cible :**
```
src/app/
├── layout.tsx                    (MODIFIÉ)  ← racine « neutre » : <html>/<body> + fonts + metadata + import globals.css
├── globals.css                   (MODIFIÉ)  ← + portée .admin (tokens dashboard)
├── (front-office)/
│   ├── layout.tsx                (NOUVEAU)  ← chrome public : <Header /> + <main class="flex-1 pt-20"> + <Footer />
│   └── page.tsx                  (DÉPLACÉ)  ← accueil actuelle (inchangée)
└── (back-office)/
    └── admin/
        ├── layout.tsx            (NOUVEAU)  ← chrome Dashboard : topbar + sidebar nav + zone contenu
        ├── page.tsx              (NOUVEAU)  ← redirect() vers /admin/pages
        └── pages/
            └── page.tsx          (NOUVEAU)  ← Server Component : titre + <PagesManager />
```

Détail du **layout racine** (`src/app/layout.tsx`) : conserve uniquement `<html lang="fr"
class={fonts}>`, `<body className="min-h-full flex flex-col">` et `{children}` ; les
classes `bg-background text-foreground antialiased` sont déjà appliquées globalement par
`globals.css` sur `body`. Le `metadata` racine reste inchangé.

Détail du **layout `(front-office)/layout.tsx`** : reprend exactement le chrome actuel —
`<Header />`, `<main className="flex-1 pt-20">{children}</main>`, `<Footer />` — afin de
ne **strictement rien changer** au rendu public existant (`/`).

> **Garde-fou non-régression** : `(front-office)/page.tsx` est un copier-coller à
> l'identique de l'actuel `src/app/page.tsx` (aucune modification de contenu).

### 1.2 Portée style Dashboard — `src/app/globals.css` (portée `.admin`)

Ajouter un bloc scopé (aucun changement des valeurs hors portée) :

```css
/* Dashboard Back-Office : épuré & haut contraste (PROJECT_CONTEXT §1.2) */
.admin {
  --background: #ffffff;
  --foreground: #18181b;
  --card: #ffffff;
  --card-foreground: #18181b;
  --surface-color: #fafafa;
  --surface-color-soft: #f4f4f5;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --accent: #f4f4f5;
  --accent-foreground: #18181b;
  --primary: #18181b;             /* bouton principal sombre, plus contrasté */
  --primary-foreground: #ffffff;
  --border-color: #e4e4e7;
  --ring: #a1a1aa;
}
```

Le layout admin applique `class="admin …"` sur son conteneur racine ; toutes les classes
des composants internes continuent d'utiliser les utilitaires sémantiques
(`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`…) qui se rebranchent
automatiquement sur ces variables.

### 1.3 Composants UI manquants — `src/components/ui/` (injection shadcn/ui)

- `label.tsx` — `Label` (wrapper `@radix-ui/react-label`, associe `htmlFor`).
- `select.tsx` — `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`… (wrapper
  `@radix-ui/react-select`, affichage natif du status).
- `switch.tsx` — `Switch` (toggle accessible, option alternative au Select pour le statut).
- `badge.tsx` — `Badge` + variants (`default` / `secondary` / `outline` / `success`)
  pour afficher le statut « Publié » / « Brouillon ».
- `textarea.tsx` — `Textarea` (prévu pour la description SEO optionnelle et les futurs CRUD).
- `separator.tsx` — `Separator` (division topbar / contenu).

> Dépendances runtime supplémentaires à installer (paquets Radix officiels uniquement,
> conformes shadcn/ui) : `@radix-ui/react-label`, `@radix-ui/react-select`,
> `@radix-ui/react-switch`, `@radix-ui/react-separator` (+ `@radix-ui/react-slot` déjà
> présent, `lucide-react` déjà présent pour `ChevronDown`/`Check`).

### 1.4 Modèle de données & helpers — `src/lib/pages.ts` (nouveau)

```ts
/** Statut de publication d'une page. */
export type PageStatus = "draft" | "published";

/** Modèle métier « Page » — mappe 1:1 vers la future table `pages` (Supabase). */
export interface SitePage {
  id: string;            // identifiant stable (mock : crypto.randomUUID())
  title: string;         // Titre H1 / SEO (affiché en <h1> et balise <title>)
  menuTitle: string;     // nom abrégé affiché dans la navigation
  slug: string;          // URL canonique, ex. "a-propos" (sans "/" de tête)
  status: PageStatus;
  updatedAt: string;     // horodatage ISO de dernière modification
}

/** Normalise un intitulé en slug URL (minuscules, accents retirés, "-" ). */
export function slugify(input: string): string;

/** Génère un slug à partir du titre + suffixe de sécurité si collision. */
export function slugFromTitle(title: string): string;

/** Jeu de données initial (miroir de mainNav dans src/lib/site.ts). */
export const seedPages: SitePage[];
```

> `slugify` = `normalize("NFD").replace(/\p{Diacritic}/gu, "")` puis minuscules,
> remplace espaces/`_`/apostrophes par `-`, supprime les caractères non
> `[a-z0-9-]`, compresse les tirets multiples. Fonctions typées, **zéro `any`**.

### 1.5 Formulaire — `src/components/backoffice/pages/PageMetadataForm.tsx` (nouveau)

**Client Component** (`"use client"`), contrôlé, réutilisable en création et en édition.
Props :

```tsx
type PageMetadataFormProps = {
  initial?: SitePage;                       // absent → mode création
  existingSlugs: string[];                  // pour l'unicité du slug
  onSubmit: (data: PageMetadataDraft) => void;
  onCancel: () => void;
  submitLabel?: string;
};
```

Champs :
1. **Titre de la page (H1 / SEO)** — `Input`, requis. Label : « Titre de la page (H1/SEO) ».
2. **Nom dans le menu (MenuTitle)** — `Input`, requis, maxLength court. Label :
   « Nom dans le menu » avec hint « Nom abrégé affiché dans la navigation ».
3. **Slug URL** — champ à deux états : `Input` éditable + bouton « Régénérer ».
   Auto-suggestion : à la saisie du titre (si le slug est vide ou a été auto-généré),
   le slug se remplit via `slugFromTitle`. Préfixe visuel `/{slug}`.
4. **Statut** — `Select` (« Brouillon » / « Publié ») ou `Switch` « Publié », au choix du
   code (voir validation). Badge de rappel visuel.
5. Boutons d'action : annuler / enregistrer (`submitLabel`).

Validation légère côté client (champs requis, slug non vide, unicité du slug signalée)
sans bibliothèque de validation externe.

### 1.6 Écran de gestion — `src/components/backoffice/pages/PagesManager.tsx` (nouveau)

**Client Component** — pilote la liste et la persistance simulée :

```tsx
type PagesManagerProps = {
  initialPages?: SitePage[];   // fourni par la page serveur (défaut : seedPages)
};
```

- **Barre d'actions** : titre « Pages » + sous-titre du compte + `Button` « + Nouvelle page ».
- **Liste** (Desktop-first) : tableau épuré — colonnes *Titre*, *Slug* (`/<slug>`), *Statut*
  (`Badge`), *Mis à jour* (date formatée) et colonne d'actions (éditer / supprimer).
  Le MenuTitle et le Titre apparaissent (tooltip) pour visualiser l'effet navigation.
- **Création** : ouverture d'un `Dialog` embarquant `PageMetadataForm` (mode création).
- **Édition** : même `Dialog` pré-rempli via `initial` (mode édition) — le slug peut être
  modifié, l'unicité est vérifiée hors de la page courante.
- **Suppression** : confirmation dans un `Dialog` secondaire (pas de suppression sans
  confirmation). La suppression d'une page publiée affiche un avertissement.
- **État** : `useState<SitePage[]>(initialPages ?? seedPages)` ; chaque mutation met à jour
  `updatedAt` et le tri (récentes d'abord). Ajout d'un en-tête de formulaire cohérent.

> Nota : aucun appel réseau — ce gestionnaire sera branché sur Supabase à l'étape
> d'intégration BDD (Route Handler + TanStack Query) sans changer son contrat de props.

### 1.7 Page serveur & redirection — `src/app/(back-office)/admin/**`

- `pages/page.tsx` — **Server Component** : en-tête de page et `<PagesManager />`
  (le `seedPages` peut être passé en prop initiale pour préparer le futur SSR).
- `page.tsx` (`/admin`) — `import { redirect } from "next/navigation"` →
  `redirect("/admin/pages")` (point d'entrée minimal du Dashboard).
- `layout.tsx` — **Server Component**, portée `class="admin"` :
  - Barre latérale fixe (Desktop-first, `hidden lg:flex` min. `w-60`) : marque du Dashboard,
    section « Pages » (active), puis entrées désactivées « À venir » (Modules, Navigation,
    Portfolio, Clients, Devis, Paramètres) avec tooltip « Prochaines étapes ».
  - Barre supérieure : titre de la section courante, séparateur, lien « Aperçu du site »
    (`/`) et placeholder utilisateur.
  - Zone de contenu `flex-1` (pas de `pt-20` : le Dashboard n'a pas de Header public fixe).

## 2. Ordre d'exécution (Code mode) — avec validation à chaque sous-tâche

1. **ROADMAP** : cocher `1.3` `[x]` (terminée selon CHANGELOG) et passer `3.1` à
   `[IN_PROGRESS]` (avec `[x]` sur les étapes 2.x déjà faites — déjà le cas).
2. **Restructuration** `src/app` en route groups + `(front-office)/layout.tsx` +
   déplacement de l'accueil. → Validation visuelle `/` identique + `tsc`/`build`.
3. **Layout Dashboard** `(back-office)/admin/layout.tsx` + `page.tsx` (redirect) +
   portée `.admin` dans `globals.css`. → Validation `/admin/pages` affiche le chrome.
4. **Composants UI** manquants (Label, Select/Switch, Badge, Textarea, Separator) via
   injection shadcn/ui. → Validation visuelle des primitives.
5. **Modèle & helpers** `src/lib/pages.ts` (`SitePage`, `PageStatus`, `slugify`,
   `slugFromTitle`, `seedPages`).
6. **Formulaire** `PageMetadataForm.tsx` (slug auto-suggéré, statut, validation).
7. **Écran** `PagesManager.tsx` + page serveur `/admin/pages` (liste, Dialog création/
   édition, confirmation suppression).
8. **Contrôles finaux** : `npx tsc --noEmit` puis `npm run build` (zéro erreur).
9. **Validation utilisateur** via `npm run dev` (`/`, `/admin/pages`) puis mise à jour
   `CHANGELOG.md` (résumé + fichiers + prochaine étape 3.2) et coche `3.1` `[x]` +
   `3.2` `[IN_PROGRESS]` dans `ROADMAP.md`.

## 3. Garde-fous / non-régression

- **Front-Office inchangé** : le contenu de `(front-office)/page.tsx` et le chrome du
  layout `(front-office)` reproduisent à l'identique l'actuel rendu de `/` (aucune
  modification cosmétique involontaire).
- **URLs publiques préservées** : les route groups n'ajoutent aucun segment ; `/` reste
  la page d'accueil. Seule nouvelle URL : `/admin` (+ `/admin/pages`).
- **Dashboard sans chrome public** : pas de Header fixe ni Footer nacre dans le Back-Office,
  conformément à `PROJECT_CONTEXT.md` §1.2 ; pas de `pt-20`.
- **Isolation des styles** : les surcharges Dashboard vivent sous la portée `.admin` ;
  aucun token global du Front-Office n'est modifié hors portée.
- **TypeScript strict, zéro `any`**, fonctions typées ; composants serveur par défaut,
  composants clients isolés (`"use client"` uniquement là où l'interactivité est requise).
- **Aucune dépendance UI fermée** ; uniquement des wrappers Radix/shadcn locaux et
  `lucide-react` déjà présent.
- **Pas de modification du schéma BDD** à ce stade (`SitePage` documenté pour un futur
  mapping vers la table `pages`).
- **Vérification finale** obligatoire : `npx tsc --noEmit` et `npm run build` sans erreur
  avant toute déclaration de fin d'étape.
