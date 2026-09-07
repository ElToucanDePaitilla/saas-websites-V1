# Plan — ROADMAP Étape 5.2 : Hydratation SSR des Stores depuis la BDD

> Plan d'architecture **validé par l'utilisateur**. Implémentation en mode Code,
> dans la continuité de l'Étape 5.1 (schéma Drizzle + migrations + seed).

## 1. Objectifs & Périmètre

Connecter les stores React/Client (Pages et Navigation) aux **données réelles de
la base PostgreSQL** via l'**hydratation SSR** :

1. **Repository Layer (`src/db/repositories/`)** — fonctions d'accès aux données
   pour charger pages, modules et entrées de navigation depuis la BDD.
2. **Hydratation SSR & prop `initialData`** — charger les données côté serveur
   au niveau des layouts/pages (`src/app/`) et les transmettre via les props
   `initialData` à `PagesStoreProvider` et `NavigationStoreProvider`.
3. **Fallback gracieux / mode hors-BDD** — si la BDD est inaccessible ou
   `DATABASE_URL` absente → bascule transparente sur le **seed en mémoire**
   existant (dev/démo jamais cassée).
4. **Préservation des contrats UI** — composants, hooks et formulaires du
   Back-Office (`/admin/pages`, `/admin/navigation`) et du Front-Office (`/`)
   inchangés (aucune modification de signature UI).

## 2. Décisions d'architecture structurantes

### A. Repositories BDD & mappers

- **`src/db/repositories/pages.repository.ts`**
  - `getPagesWithModules(photographerId: string)` : pages + modules ordonnés,
    typés selon le domaine (`SitePage` / `PageModule`).
- **`src/db/repositories/navigation.repository.ts`**
  - `getNavigation(photographerId: string)` : entrées Header (Niveau 1 + Niveau 2
    reconstruit via `parent_id`) et Footer → arborescence `SiteNavigation`
    (`NavMenuEntry[]`).
- **Mappers** : conversion étanche BDD → domaine (colonnes snake_case Drizzle →
    champs camelCase des types mock : `isInMenu`/`isVisible`/`orderIndex`…).

### B. Pattern d'hydratation

```text
Layout / Page (Server Component)
  └─> Fetch DB via Repositories (Fallback -> Seeds in-memory)
        └─> <StoreProvider initialData={data}>
              └─> Stores React / Hooks Client (PagesStore & NavigationStore)
```

- Les Providers acceptent une prop optionnelle `initialData` et **initialisent
  leur état réactif** avec ces données si fournies (sinon seed en mémoire).
- `PagesStoreProvider` : `useState(initialData ?? createInitialState())`.
- `NavigationStoreProvider` (store **module partagé** 4.5) : hydratation
  **unique par session** via `hydrateNavigation(initialData)` déclenchée au
  montage (l'état reste partagé entre `/admin` et `/` sans réinitialisation au
  changement de layout).

### C. Gestion multi-tenants

- Requêtes ciblées sur l'**id du profil photographe de démo** (tenant seed) —
  constante partagée `src/db/constants.ts`.

## 3. Plan d'exécution technique

1. `src/db/repositories/pages.repository.ts` (nouveau) ;
2. `src/db/repositories/navigation.repository.ts` (nouveau) ;
3. `src/db/index.ts` : **connexion paresseuse** (`getDatabase()`) — aucun throw
   à l'import (indispensable pour que le build reste vert sans BDD) ;
   `src/db/constants.ts` : id du tenant de démo (partagé avec le seed) ;
4. **Providers** : `PagesStoreProvider` et `NavigationStoreProvider` acceptent
   `initialData` optionnelle (+ `hydrateNavigation` dans `navigation-store.ts`) ;
5. **Layouts / Server Components** : chargement des données initiales
   (`src/db/load-initial-data.ts`, fallback seed) transmises par
   `(front-office)/layout.tsx` (Navigation) et `(back-office)/admin/layout.tsx`
   (Pages + Navigation) ;
6. Vérifications : `npx tsc --noEmit`, `npm run lint`, `npm run build` ;
7. `ROADMAP.md` (5.2 `[x]`) + `CHANGELOG.md` (après validation).

## 4. Fichiers touchés (prévision)

- Créés : `src/db/repositories/pages.repository.ts`,
  `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`,
  `src/db/constants.ts`, `plans/ROADMAP-5.2-ssr-db-hydration.md`.
- Modifiés : `src/db/index.ts` (connexion paresseuse), `src/db/seed.ts`
  (constante partagée), `src/components/backoffice/PagesStoreProvider.tsx`,
  `src/components/backoffice/navigation/NavigationStoreProvider.tsx`,
  `src/lib/navigation-store.ts` (hydrate), `src/app/(front-office)/layout.tsx`,
  `src/app/(back-office)/admin/layout.tsx`, `ROADMAP.md`, `CHANGELOG.md`.
- Aucun composant UI métier modifié (contrats préservés), aucune route/table
  ajoutée.

## 5. Vérifications & validation manuelle

- `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (même sans
  `DATABASE_URL` — fallback seed).
- Avec BDD (`DATABASE_URL` + migration + seed 5.1) : `/admin/pages` et
  `/admin/navigation` affichent les données BDD ; `/` (Header/Footer) les
  reflète après hydratation ; une modification de la BDD est visible au
  rechargement.
