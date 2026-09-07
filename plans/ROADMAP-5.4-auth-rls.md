# Plan — ROADMAP Étape 5.4 : Auth Supabase, Row Level Security (RLS) & Multi-tenant Isolation

## Objectif

Sécuriser l'accès aux données BDD et introduire l'**authentification réelle du
photographe** : sessions Supabase (`@supabase/ssr`, cookies), **Row Level
Security** stricte (Owner RW / Public RO), **middleware** de protection de la
zone `/admin/*` (redirection `/admin/login`) — avec **fallback démo** quand
Supabase Auth n'est pas configuré (le projet tourne toujours sans BDD).

Cible : `/admin` → zone authentifiée du photographe ; `/` (Front-Office) →
lecture publique des contenus **publiés/non masqués**.

## Références

- `../ROADMAP.md` — Phase 5, Étape 5.4 `[IN_PROGRESS]` (à ajouter).
- `../ARCHITECTURE.md` — §0 (multi-tenancy `photographer_id`/RLS), §1 (clients
  Supabase Server/Client/Middleware), §9.4 SPECIFICATIONS (Auth 3 rôles —
  périmètre réduit ici au rôle photographe admin).
- Étapes 5.1 → 5.3 (schema+seed, hydration, CRUD) — état actuel ci-dessous.
- `.kilorules` §0.2/§1 (étape par étape, validation), §3 (zéro `any`), §4
  (schéma non modifié sans validation).

## État actuel (constats d'entrée)

- Aucun code Supabase présent (`src/lib/supabase/` inexistant, aucun
  `@supabase/*`) — le lien `.kilorules` §0.1 « Drizzle/Supabase → ARCHITECTURE »
  et l'historique Phase 1.2 (supabase scaffoldé puis absent) sont documentés.
- `.env.example` expose déjà `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ `DATABASE_URL`
  ajouté en 5.1).
- BDD (5.1) : `profiles(id uuid PK, email unique, display_name…)`,
  `pages(photographer_id → profiles ON DELETE CASCADE, status enum, is_in_menu)`,
  `page_modules(page_id → pages…)`, `navigation_entries(photographer_id →
  profiles, zone, hidden, page_id → pages, parent_id auto…)`. RLS **activée**
  mais **sans politique** (accès serveur « service » via Drizzle/DATABASE_URL).
- Route Handlers/seed/repositories **figent le tenant démo**
  `DEMO_PROFILE_ID` (`src/db/constants.ts`).
- Aucune route `/login` ni `/admin/login` n'existe (les liens « Connexion »
  publics du Header 4.5 pointent vers `/login` → 404 actuel).

## 0. Décisions d'architecture (à valider)

### 0.1 Couche d'accès : Drizzle « service » + scoping par session (recommandé)

Deux modèles possibles pour exécuter le RLS :

- **Option A (recommandée)** : l'app conserve **Drizzle/DATABASE_URL** comme
  couche de données (service → bypass RLS), mais l'**autorisation est
  appliquée applicativement** : les Route Handlers/repositories reçoivent le
  `photographerId` **authentifié** (dérivé de `auth.uid()`) au lieu du tenant
  démo ; les requêtes publiques filtrent `status='published'` / `hidden=false`.
  Les **politiques RLS sont néanmoins créées** (défense en profondeur +
  lectures publiques via PostgREST lorsque Supabase est utilisé hors Drizzle).
- **Option B** : bascule des repositories sur **PostgREST (`supabase-js`)**
  pour que le RLS gouverne réellement les requêtes — refactor lourd, RLS et
  PostgREST deviennent obligatoires, le fallback démo/hors-BDD devient délicat.

Arbitrage proposé : **Option A** (évolutif, non destructif, RLS posé et
testable côté Supabase, bascule vers B facilitée plus tard).

### 0.2 Identité : `profiles.id = auth.uid()` + trigger d'initialisation

- Pattern Supabase : le profil photographe porte **`id = auth.uid()`** — la
  politique `photographer_id = auth.uid()` suffit (pas de table de jointure).
- **Trigger PostgreSQL** : à chaque création d'un utilisateur `auth.users`,
  insertion automatique dans `profiles(id = NEW.id, email = NEW.email,
  display_name = '' )` si absent (fonction `handle_new_user` + trigger
  `on_auth_user_created`).
- Conséquence multi-tenant : un photographe connecté **ne voit que ses propres
  pages/modules/navigation** (`photographer_id = son profil`) ; le **seed démo**
  (`DEMO_PROFILE_ID`) reste visible uniquement **déconnecté / mode démo**.

### 0.3 RLS — politiques (migration SQL dédiée, appliquée côté Supabase)

| Table | Owner (authentifié) | Public (anon) |
|---|---|---|
| `profiles` | SELECT/UPDATE sur sa ligne | — (aucun accès aux emails/display) |
| `pages` | SELECT/INSERT/UPDATE/DELETE où `photographer_id = auth.uid()` | SELECT où `status = 'published'` |
| `page_modules` | pleins droits via sa page (`JOIN pages` propriétaire) | SELECT via sa page publiée ET `is_visible = true` |
| `navigation_entries` | pleins droits via `photographer_id = auth.uid()` | SELECT où `zone` header/footer, `hidden = false`, et page liée publiée le cas échéant |

> Réconciliation : le plan d'origine parle de `is_published` ; notre schéma 5.1
> utilise **`pages.status = 'published'`** (enum) — la politique publique
> s'exprime donc `status = 'published'`. La visibilité publique des modules =
> `is_visible = true` (équivalent `hidden = false`).

### 0.4 Middleware : protection `/admin/*`

- `middleware.ts` (racine) : `@supabase/ssr` (rafraîchissement + création de
  session côté serveur), **matcher** sur `/admin/:path*`.
- Non connecté → redirection `307` vers `/admin/login` ; connecté → poursuite.
- `/admin/login` et `/admin/logout` sont **exemptés** de la garde.
- **Mode démo** (auth non configurée) → le middleware laisse passer (pas de
  redirection) : `/admin` reste accessible comme aujourd'hui.

### 0.5 Périmètre & réconciliations

- Rôle limité au **photographe admin** (rôles Client/Visiteur hors périmètre).
- Les repositories/Route Handlers de 5.3 passent du `DEMO_PROFILE_ID` figé à
  un **résolveur de session** (`getCurrentPhotographerId()`), avec repli
  `DEMO_PROFILE_ID` **seulement** en mode démo/déconnecté (lecture publique).
- CTA public « Connexion » (Header/Footer) redirigé vers `/admin/login`.
- Front-Office `/` reste **SSR statique** (pages publiées) — sans filtre
  `hidden`/statut redondant inutile (les entrées `hidden`/draft sont déjà
  exclues en amont), mais le Reader public filtre par principe.
- Aucune route publique `/(front-office)` n'est protégée.

## 1. Dépendances & clients Supabase

### 1.1 Dépendances

`@supabase/supabase-js` (runtime) + `@supabase/ssr` (runtime).

### 1.2 Fichiers clients (`src/lib/supabase/`)

- `server.ts` — `createClient()` **serveur** (`@supabase/ssr` `createServerClient`
  avec cookies Next) : lecture session pour SSR/layouts, résolution du
  `photographerId`.
- `browser.ts` — `createBrowserClient()` (cookies de session côté navigateur).
- `middleware.ts` — helper `updateSession(request)` (refresh/échange de cookies)
  utilisé par `middleware.ts` racine.
- `auth.ts` — helpers serveur : `getSession()`, `getPhotographerId()`
  (`auth.uid()`), `signOutAction()` (Server Action)…
- `demo.ts` — `isSupabaseConfigured()` (URL + anon présents) → active/désactive
  le mode démo.

## 2. Connexion / Déconnexion Back-Office

- **Route** `/admin/login` (page serveur + formulaire client email/mot de passe
  via `signInWithPassword`) ; erreurs affichées (shadcn/ui, contrats inchangés).
- **Déconnexion** : action/serveur `signOut` (fin de session) + lien dans le
  chrome `/admin` (en-tête « Tableau de bord ») ; redirection `/admin/login`.
- CTA publics (Header/Footer `/login`) → pointent vers `/admin/login`.
- Pas de rôle multi-utilisateur : tout `auth.uid()` valide est un photographe
  (profil auto-créé par le trigger).

## 3. RLS & DB (SQL — migration dédiée)

1. Migration 5.4 (fichier SQL généré `drizzle/…` **édité à la main** car
   politiques/triggers non exprimables en Drizzle) :
   - fonction `handle_new_user()` + trigger `on_auth_user_created` sur
     `auth.users` ;
   - politiques `profiles`, `pages`, `page_modules`, `navigation_entries`
     (Owner RW / Public RO, cf. §0.3) ;
   - `ALTER TABLE … ENABLE ROW LEVEL SECURITY` (déjà présent pour les 4
     tables — complété par les politiques).
2. La contrainte `pages.photographer_id NOT NULL` reste ; les seed/mutations de
   démo utilisent `DEMO_PROFILE_ID` (jamais `auth.uid()`).

## 4. Middleware Next.js

```ts
// middleware.ts (racine)
export async function middleware(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request); // refresh cookies
  const url = new URL(request.url);
  // Mode démo (Supabase non configuré) → pas de garde.
  if (!isSupabaseConfigured()) return supabaseResponse;
  if (url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login")) {
    const { data: { user } } = await ... getUser();
    if (!user) return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return supabaseResponse;
}
export const config = { matcher: ["/admin/:path*"] };
```

> NB : le fallback démo garde l'accès `/admin` (aucune BDD requise) ; les
> protections **applicatives** (§0.1) s'appliquent dès que l'on est connecté.

## 5. Scoping des données & impact 5.3

- Helper serveur `getPhotographerId()` : retourne `auth.uid()` quand connecté,
  sinon `null`.
- Route Handlers (`/api/pages*`, `/api/navigation*`) : remplacent
  `DEMO_PROFILE_ID` par l'id authentifié (et retournent `401` si aucun) —
  **sauf en mode démo** où le tenant démo reste utilisé (accès sans auth).
- `loadInitialData()` : lit le `photographerId` de session pour l'hydratation
  `/admin` ; côté `/` (public) lit le tenant **démo** (contenu publié du site
  de démonstration) — ce point est à arbitrer (voir §0.5 & question).

## 6. Diagramme

```mermaid
flowchart TD
    U[Visiteur /admin] --> M[middleware.ts]
    M -->|non connecte| L[/admin/login]
    M -->|connecte| A[Layout admin SSR]
    A -->|session auth.uid| P[Repositories scopees photographe]
    A -->|lecture publique| F[/ Front-Office statique]
    P -->|RLS Owner + Drizzle service| DB[(PostgreSQL Supabase)]
    F -->|RLS Public RO status published hidden false| DB
    AUTH[auth.users] -->|trigger handle_new_user| PRO[profiles id = auth.uid]
```

## 7. Tâches (ordre d'exécution — mode Code)

1. Dépendances `@supabase/supabase-js` + `@supabase/ssr` ; `.env.example`
   inchangé (clés déjà présentes).
2. `src/lib/supabase/` : `server.ts`, `browser.ts`, `middleware.ts`, `auth.ts`,
   `demo.ts`.
3. `middleware.ts` racine (garde `/admin`, exemption login/logout, fallback
   démo).
4. Route `/admin/login` + formulaire (email/mot de passe) + action `signOut` +
   lien en-tête `/admin`.
5. Migration SQL 5.4 : trigger `handle_new_user` + politiques RLS (4 tables).
6. Scoping 5.3 : repositories/Route Handlers/loader utilisent
   `getPhotographerId()` (fallback démo documenté) ; CTA publics → `/admin/login`.
7. Vérifications : `npx tsc --noEmit`, `npm run lint`, `npm run build`.
8. `ROADMAP.md` (5.4 `[x]`) + `CHANGELOG.md` (après validation).

## 8. Fichiers touchés (prévision)

- Créés : `src/lib/supabase/{server,browser,middleware,auth,demo}.ts`,
  `middleware.ts`, `src/app/(back-office)/admin/login/page.tsx` (+ formulaire
  client), migration 5.4, `plans/ROADMAP-5.4-auth-rls.md`.
- Modifiés : `package.json`, Route Handlers `/api/*` (scoping session),
  `src/db/repositories/*` (paramètre photographe), `src/db/load-initial-data.ts`
  (session), chrome `/admin` (en-tête logout), Header/Footer (CTA `/admin/login`),
  `src/db/constants.ts` (rôle du tenant démo précisé), `ROADMAP.md`,
  `CHANGELOG.md`.
- **Aucun composant métier Back-Office/Page Builder modifié** (contrats
  préservés) ; aucune table ajoutée (politiques/trigger seulement).

## 9. Vérifications & validation

- `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK **sans BDD**
  (fallback démo : `/admin` accessible, middleware inactif).
- Avec Supabase (`NEXT_PUBLIC_SUPABASE_URL/ANON` + `DATABASE_URL`) :
  - création d'un utilisateur → `profiles` auto-créé (trigger) ;
  - `/admin` sans session → redirection `/admin/login` ; connexion → accès ;
  - RLS : un utilisateur ne voit/supprime que ses propres lignes
    (`photographer_id = auth.uid()`) ; l'API retourne `401` sans session ;
  - lecture publique `/` : pages publiées + modules visibles + nav non masquée ;
  - déconnexion → retour `/admin/login`.

## 10. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Bascule RLS lourde (Option B) | Option A : Drizzle scoping + RLS défense ; bascule B différée |
| Tenant démo vs utilisateur réel | `DEMO_PROFILE_ID` réservé à démo/public ; repositories scopés par session quand auth |
| Middleware bloque la démo | `isSupabaseConfigured()` → garde inactive sans Supabase |
| Mismatch `is_published` vs `status` | Politiques RLS exprimées sur `pages.status = 'published'` |
| Trigger/auth dépendent de `auth.users` (schéma Supabase) | Migration exécutée sur la BDD Supabase (le schéma `auth` existe) ; hors BDD non exécutable (documenté) |
| Sessions/Cookies SSR | `@supabase/ssr` (createServerClient + updateSession) pattern officiel |

## 11. Points d'arbitrage (soumis à validation)

1. **Option A** (Drizzle scoping + RLS défense) vs **Option B** (PostgREST/RLS
   effectif) — recommandation A.
2. **`profiles.id = auth.uid()`** + trigger d'auto-création (recommandé).
3. **Hydratation `/` publique** : tenant démo (contenu de démo publié) vs
   reprise du photographe connecté — recommandation : tenant démo pour le
   public tant que la notion « site du photographe » n'est pas une entité.
4. **CTA public « Connexion »** redirigé vers `/admin/login`.
