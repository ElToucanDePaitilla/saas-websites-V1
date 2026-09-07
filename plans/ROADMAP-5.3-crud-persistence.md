# Plan — ROADMAP Étape 5.3 : Persistance CRUD (API & Synchronisation BDD)

> Plan d'architecture **fourni et validé par l'utilisateur**. Implémentation en
> mode Code, dans la continuité des Étapes 5.1 (schéma/migrations/seed) et 5.2
> (hydratation SSR + repositories de lecture).

## 1. Objectifs & Périmètre

Connecter les **actions d'édition** du Back-Office (PagesStore et
NavigationStore) pour qu'elles **enregistrent réellement les modifications en
base de données** quand la BDD est configurée :

1. **Mutation BDD Pages & Modules (PagesStore)** : création, modification des
   métadonnées (slug, titre, statut…), réordonnancement des modules et
   suppression de pages → persistés en BDD.
2. **Mutation BDD Navigation (NavigationStore)** : ajout/édition d'entrées
   (Header/Footer, Niveau 1/2), visibilité (`hidden`), réorganisation
   (Drag & Drop) et application des **Presets Onboarding** → persistés en BDD.
3. **Synchronisation réactive inter-stores persistée** : la synchro
   Pages ↔ Navigation (création/modification/suppression de page ⇒ mise à jour
   du Header) est conservée côté client **et** rendue persistante.
4. **Fallback mode démo / hors-BDD** : sans `DATABASE_URL`, bascule
   transparente sur l'état volatile en mémoire (le site fonctionne toujours sans
   Supabase — l'app ne requiert **aucune** BDD pour tourner).

## 2. Décisions d'architecture structurantes

### A. Repositories d'écriture (`src/db/repositories/`)

- **`pages.repository.ts`** :
  - `createPage(photographerId, data)` — insère une page (id explicite) ;
  - `updatePage(pageId, data)` — met à jour les métadonnées ;
  - `deletePage(pageId)` — supprime (cascade modules + navigation liée) ;
  - `updateModules(pageId, modules)` — remplace la liste ordonnée des modules
    (transacté, préserve les ids client).
- **`navigation.repository.ts`** :
  - `saveNavigation(photographerId, entries)` — remplace la navigation
    Header/Footer (arborescence Niveau 2) en une transaction ;
  - `applyPreset(photographerId, presetId)` — orchestration atomique
    (recalcul `inMenu` des pages + remplacement du Header).

### B. Couche API (Route Handlers + validation)

- **Route Handlers Next.js** sous `src/app/api/` (écritures serveur) avec
  **validation Zod** :
  - `POST /api/pages` (création), `PATCH /api/pages/[pageId]` (métadonnées),
    `DELETE /api/pages/[pageId]`, `PUT /api/pages/[pageId]/modules` ;
  - `PUT /api/navigation` (remplacement Header/Footer) ;
  - `POST /api/navigation/presets` (application d'un preset).
- Tenant ciblé : profil photographe de démo (`DEMO_PROFILE_ID`) — aucune auth
  encore (RLS posée à l'étape Auth).

### C. Branchement des stores (contrats UI préservés)

- Les Providers reçoivent un booléen serveur `persistenceEnabled`
  (`loadInitialData` expose `dbAvailable`) ;
- Si **activée** : chaque action locale (optimiste) déclenche l'écriture BDD
  correspondante via l'API (fire-and-forget, erreurs journalisées — aucune
  régression UI) ;
- Si **désactivée** (hors-BDD) : comportement **strictement identique** à
  aujourd'hui (mock en mémoire).

## 3. Fichiers touchés (prévision)

- Créés : `plans/ROADMAP-5.3-crud-persistence.md`,
  `src/lib/schemas/persistence.ts` (zod), `src/lib/persistence-client.ts`
  (appels API), `src/app/api/pages/route.ts`,
  `src/app/api/pages/[pageId]/route.ts`,
  `src/app/api/pages/[pageId]/modules/route.ts`,
  `src/app/api/navigation/route.ts`, `src/app/api/navigation/presets/route.ts`.
- Modifiés : `src/db/repositories/pages.repository.ts`,
  `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`
  (`dbAvailable`), `src/components/backoffice/PagesStoreProvider.tsx`,
  `src/components/backoffice/navigation/NavigationStoreProvider.tsx`,
  `src/components/backoffice/PagesStoreProvider.tsx`…, layouts admin/front
  (transmission du flag), `package.json` (zod), `ROADMAP.md`, `CHANGELOG.md`.
- Aucun composant UI métier ni hook modifié (contrats préservés).

## 4. Vérifications & validation manuelle

- `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (sans BDD —
  fallback actif) ;
- Sans BDD : CRUD fonctionne comme avant (aucun appel réseau) ;
- Avec BDD (migration + seed) : créer/éditer/supprimer une page, réordonner les
  modules, éditer/masquer/réordonner la navigation et appliquer un preset →
  rechargement (`F5`) : l'état est **persisté** en BDD (vérifiable via
  `db:studio`).
