# Plan — ROADMAP Étape 5.1 : Schéma BDD PostgreSQL / Drizzle ORM & Migrations

## Objectif

Porter la **persistance du Volet 2 (Portfolio Photographe)** vers une vraie base
de données **PostgreSQL (Supabase)** en posant la **fondation Drizzle ORM** : le
jeu de données aujourd'hui **mock en mémoire** (`seedPages` +
`buildSeedModules` + `buildSeedNavigation`, rechargé à chaque `F5`) est modélisé
en **tables PostgreSQL** et peuplé par un **seed initial**, sans **aucun
changement de comportement** des composants UI existants (Étapes 3.x → 4.5).

Périmètre de cette étape (infrastructure **seule**) :

1. Modélisation des tables `pages`, `page_modules`, `navigation_entries` (avec
   clés étrangères et **auto-jointure** `parent_id` pour le Niveau 2) via Drizzle ;
2. Configuration Drizzle (`drizzle.config.ts`, client d'accès DB, variables) ;
3. Scripts de **migration** (`drizzle-kit`) et **d'injection du seed initial** ;
4. **Stratégie de transition progressive** (blueprint 5.2/5.3) garantissant que
   le branchement des stores sur la BDD ne casse **aucun** composant UI.

Le **branchement effectif** des stores UI / route handlers / RLS / auth est
**hors périmètre** de 5.1 (étapes 5.2 → 5.x dédiées, cf. §5).

## Références projet

- `../ROADMAP.md` — Phase 5 (à créer : « Intégration BDD / Supabase / Drizzle »,
  Étape 5.1 `[IN_PROGRESS]`).
- `../ARCHITECTURE.md` — §0 « Vision BDD globale » (multi-tenancy
  `photographer_id` / RLS), §1 flux, arborescence `lib/`.
- `../SPECIFICATIONS-V8.md` — §9.2 « Backend, Base de Données & Multi-Tenancy ».
- `../.kilorules` — §0.1 (consulter ARCHITECTURE pour Drizzle/Supabase), §4
  (schéma BDD **non modifié sans validation** — ici création initiale),
  §1 (étape par étape, validation, CHANGELOG), §3 (zéro `any`).
- `../-----PourMémoSQLeditor-CreationTable.md` — **draft SQL antérieur**
  (`pages`, `page_modules`, `media_assets`) : repris, **réconcilié et
  supervisé** par Drizzle (le draft devient obsolète une fois la migration n°1
  générée — il reste conservé comme historique de décision).
- Plans mock : `../plans/ROADMAP-3.1-pagemetadata.md` §1.4 (`SitePage` → `pages`),
  `../plans/ROADMAP-3.2-pagebuilder-dnd.md` §1.2 (`PageModule` → `page_modules`),
  `../plans/ROADMAP-4.3-navigation-advanced.md` §1.1 & §0.5 (`NavMenuEntry` →
  table `navigation_entries`, auto-jointure `parent_id`).

## 0. Décisions d'architecture (à valider)

### 0.1 Nom des tables & clés étrangères

| Table mock / type | Table PostgreSQL | Rôle |
|---|---|---|
| `SitePage` ([`src/lib/pages.ts`](../src/lib/pages.ts)) | `pages` | métadonnées de page |
| `PageModule` + `ModuleContent` | `page_modules` | modules ordonnés + `content` JSONB |
| `NavMenuEntry` ([`src/lib/navigation.ts`](../src/lib/navigation.ts)) | `navigation_entries` | entrées Header/Footer, **auto-jointure** `parent_id` (Niveau 2) |
| — (racine du tenant) | `profiles` | ancrage multi-tenant minimal `photographer_id` |

- `navigation_entries` : le nom **validé avec l'utilisateur** remplace la
  dénomination `nav_items` évoquée dans les commentaires mock des Étapes 4.1 →
  4.3 (aucune BDD n'existe encore → aucun impact).
- `profiles` minimal : table d'ancrage du propriétaire. La table **n'est pas
  reliée à `auth.users` à ce stade** (l'auth arrive plus tard) — son `id` est un
  UUID libre (seed démo). À l'étape Auth, on branchera `profiles.auth_user_id`
  (ou `id = auth.uid()`) et l'on figera les **politiques RLS** (cf. §0.5).

### 0.2 Mapping colonnes (source de vérité = types mock)

Le contrat de données TypeScript actuel **reste la référence** :
[`src/lib/pages.ts`](../src/lib/pages.ts) et
[`src/lib/navigation.ts`](../src/lib/navigation.ts) sont **la couche métier
partagée** ; Drizzle ne fait que **persister** ces formes. La colonne JSONB
`page_modules.content` est typée `$type<ModuleContent>()` (import **type-only**
depuis `pages.ts` → aucun cycle, zéro `any`).

### 0.3 RLS & accès DB (mode « service » à ce stade)

- `ALTER TABLE … ENABLE ROW LEVEL SECURITY` sur **toutes** les tables (préparé
  dès l'origine, conforme ARCHITECTURE).
- **Aucune politique** posée en 5.1 : le serveur (Route Handlers futurs,
  migrations, seed) se connecte via `DATABASE_URL` (rôle `postgres` /
  service) → **bypass RLS**. Les politiques « owner »/« public anon » seront
  posées à l'étape Auth (5.x) avec le client `@supabase/supabase-js`.
- Conséquence documentée : en attendant l'auth, tout accès applicatif passe par
  le **serveur** (jamais par le client navigateur avec la clé `anon`).

### 0.4 Cible de BDD : Supabase (local et/ou distant)

- `DATABASE_URL` pointe vers **Supabase** : chaîne **transaction pooler**
  (`:6543`, rôle `postgres`) pour le runtime/migrations, ou BDD locale
  `supabase start` (`:54322`) en développement.
- Aucune table créée hors `public` à cette étape (ni `auth`, ni `storage`).

### 0.5 Hors périmètre (explicite)

- **Aucune** modification des composants/stores UI (Header, Footer, Navigation,
  Pages, providers, `navigation-store.ts`, `PagesNavigationSync`) ;
- **aucune** route publique, **aucun** Route Handler, **aucun** client
  `@supabase/supabase-js`, **aucune** politique RLS finale ;
- la table `media_assets` (draft) et `pgvector` : étapes Médias/IA ultérieures ;
- tables SaaS (Volet 1) : hors périmètre (priorité Volet 2, cf. SPECIFICATIONS
  §règle exécutive) — la présence de `profiles`/`photographer_id` **prépare**
  déjà la cohabitation future des deux volets.

## 1. Schéma Drizzle — `src/db/schema.ts` (nouveau)

Fichiers cibles :
- `src/db/schema.ts` — définition des tables/enums (zéro `any`) ;
- `src/db/index.ts` — **client d'accès DB** partagé (runtime + seed) ;
- `drizzle.config.ts` (racine) — config Drizzle Kit ;
- migrations générées dans `drizzle/` (non éditées à la main).

### 1.1 Enums (intégrité DB, extensibles)

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const pageStatusEnum = pgEnum("page_status", ["draft", "published"]);
export const moduleTypeEnum = pgEnum("module_type", [
  "hero", "about", "services", "cta-banner", "gallery", "faq", "contact",
]);
export const moduleAnimationEnum = pgEnum("module_animation", [
  "default", "fade-up", "fade-in", "scale-in", "none",
]);
export const navZoneEnum = pgEnum("nav_zone", ["header", "footer"]);
export const navKindEnum = pgEnum("nav_kind", ["page", "custom"]);
```

> Décision : `pages.status` est un **enum** `page_status` (`draft`/`published`),
> aligné 1:1 sur `PageStatus` (le draft SQL « pour mémo » utilisait
> `is_published boolean` — écart assumé, validé ici, aucun code existant ne
> dépend des colonnes DB).

### 1.2 Table `profiles` (ancrage tenant minimal)

```ts
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### 1.3 Table `pages` (mapping `SitePage`)

| Colonne Drizzle | Type | Mapping mock | Contrainte |
|---|---|---|---|
| `id` | `uuid` PK `defaultRandom()` | `SitePage.id` | |
| `photographer_id` | `uuid` NN → `profiles.id` ON DELETE CASCADE | racine tenant | |
| `slug` | `text` NN (`""` = Accueil) | `SitePage.slug` | |
| `title` | `text` NN | `SitePage.title` | |
| `menu_title` | `text` NN | `SitePage.menuTitle` | |
| `status` | `page_status` NN `default 'draft'` | `SitePage.status` | |
| `is_in_menu` | `boolean` NN `default true` | `SitePage.inMenu` | |
| `created_at` | `timestamptz` NN `defaultNow()` | — | |
| `updated_at` | `timestamptz` NN `defaultNow()` | `SitePage.updatedAt` | |

```ts
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photographerId: uuid("photographer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    menuTitle: text("menu_title").notNull(),
    status: pageStatusEnum("status").notNull().default("draft"),
    isInMenu: boolean("is_in_menu").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("pages_photographer_slug_unique").on(table.photographerId, table.slug)]
);
```

### 1.4 Table `page_modules` (mapping `PageModule` + `content` JSONB)

| Colonne Drizzle | Type | Mapping mock |
|---|---|---|
| `id` | `uuid` PK | `PageModule.id` |
| `page_id` | `uuid` NN → `pages.id` ON DELETE CASCADE | `pageId` |
| `module_type` | `module_type` NN | `PageModule.type` |
| `title` | `text` NN `default ''` | `PageModule.title` (bandeau) |
| `order_index` | `integer` NN `default 0` | position verticale (ordre = `order_index`) |
| `is_visible` | `boolean` NN `default true` | `!PageModule.hidden` (Toggle Eye) |
| `animation` | `module_animation` NN `default 'default'` | `PageModule.animation` |
| `anchor_id` | `text` NN `default ''` | `PageModule.anchorId` |
| `layout_variant` | `text` NN `default 'default'` | `PageModule.layoutVariant` (réservé) |
| `content` | `jsonb` NN `default {}` `$type<ModuleContent>()` | `PageModule.content` (union discriminée) |

```ts
export const pageModules = pgTable(
  "page_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    moduleType: moduleTypeEnum("module_type").notNull(),
    title: text("title").notNull().default(""),
    orderIndex: integer("order_index").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    animation: moduleAnimationEnum("animation").notNull().default("default"),
    anchorId: text("anchor_id").notNull().default(""),
    layoutVariant: text("layout_variant").notNull().default("default"),
    content: jsonb("content").$type<ModuleContent>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("page_modules_page_order_idx").on(table.pageId, table.orderIndex)]
);
```

### 1.5 Table `navigation_entries` (mapping `NavMenuEntry`, auto-jointure Niveau 2)

| Colonne Drizzle | Type | Mapping mock |
|---|---|---|
| `id` | `uuid` PK | `NavMenuEntry.id` |
| `photographer_id` | `uuid` NN → `profiles.id` ON DELETE CASCADE | racine tenant |
| `zone` | `nav_zone` NN | `header` / `footer` |
| `label` | `text` NN | `NavMenuEntry.label` |
| `kind` | `nav_kind` NN | `page` / `custom` |
| `href` | `text` NN `default ''` | `NavMenuEntry.href` |
| `hidden` | `boolean` NN `default false` | `NavMenuEntry.hidden` (Toggle Eye) |
| `auto` | `boolean` NN `default false` | `NavMenuEntry.auto` (entrée maintenue par la synchro) |
| `page_id` | `uuid` **NULL** → `pages.id` ON DELETE CASCADE | `NavMenuEntry.pageId` (`null` = custom) |
| `parent_id` | `uuid` **NULL** → `navigation_entries.id` ON DELETE CASCADE | **Niveau 2** (`null` = racine) |
| `position` | `integer` NN `default 0` | ordre dans la liste du parent, par zone |
| `created_at` / `updated_at` | `timestamptz` | — |

```ts
export const navigationEntries = pgTable(
  "navigation_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photographerId: uuid("photographer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    zone: navZoneEnum("zone").notNull(),
    label: text("label").notNull(),
    kind: navKindEnum("kind").notNull(),
    href: text("href").notNull().default(""),
    hidden: boolean("hidden").notNull().default(false),
    auto: boolean("auto").notNull().default(false),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(() => navigationEntries.id, {
      onDelete: "cascade",
    }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("nav_zone_order_idx").on(
      table.photographerId,
      table.zone,
      table.parentId,
      table.position
    ),
    index("nav_page_id_idx").on(table.pageId),
    index("nav_parent_id_idx").on(table.parentId),
  ]
);
```

Garde-fous exprimés en migration (CHECK) :
- `kind = 'page'` ⇒ `page_id NOT NULL` ; `kind = 'custom'` ⇒ `page_id IS NULL` ;
- `zone IN ('header','footer')` déjà garanti par l'enum.

> Sémantique des `ON DELETE CASCADE` (cohérente avec le mock) : supprimer une
> page retire ses entrées de navigation liées (anti-lien orphelin) ; supprimer
> un **parent** Header retire **son sous-menu** (`parent_id` cascade) — exactement
> la cascade actuelle de `removeNavEntry`. Le Footer **plat** et la
> **profondeur max 2** restent garantis **par l'application** (règles 4.3),
> non exprimables proprement en contrainte SQL.

### 1.6 Relations Drizzle

`relations.ts` (optionnel) : relations typées `pages.modules`,
`pages.navigationEntries`, `navigationEntries.children` (auto),
`navigationEntries.parent`, `navigationEntries.page`, `profiles.pages` — pour
les futures requêtes `db.query` (utilisées dès 5.2).

## 2. Configuration Drizzle & client DB

### 2.1 Dépendances (à installer)

- Runtime : `drizzle-orm`, `postgres` (driver) ;
- Dev : `drizzle-kit`, `tsx` (exécution des scripts TS), `dotenv` (chargement
  des variables en CLI).

### 2.2 `drizzle.config.ts` (racine)

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true, // empêche drizzle-kit de générer du SQL « permissif »
});
```

### 2.3 `src/db/index.ts` — client d'accès partagé

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "";
// Singleton robuste en dev (évite la multiplication de pools sous HMR Next.js).
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> };

function createDb() {
  const client = postgres(connectionString, { max: 1 }); // pool adapté serveur Next
  return drizzle(client, { schema });
}

export const db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;
```

> Le cast `globalThis as unknown as …` est un **conteneur connu** (pattern
> Next.js officiel pour les connexions singleton) — aucun `any` de données métier.

### 2.4 Variables d'environnement (`.env.example` — à compléter)

Ajout (valeurs factices, `.env.local` réel rempli par l'utilisateur — jamais
édité par l'agent) :

```env
# Supabase PostgreSQL (Drizzle) — pooler transaction ou BDD locale `supabase start`
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 3. Scripts migration & seed

### 3.1 Scripts npm (`package.json`)

| Script | Commande | Rôle |
|---|---|---|
| `db:generate` | `drizzle-kit generate` | génère la migration depuis `schema.ts` |
| `db:migrate` | `drizzle-kit migrate` | applique les migrations (table `drizzle.__drizzle_migrations`) |
| `db:seed` | `tsx src/db/seed.ts` | injecte le seed initial (idempotent) |
| `db:studio` | `drizzle-kit studio` | exploration visuelle (dev) |

### 3.2 `src/db/seed.ts` — injection du seed initial (idempotent)

Réplique **exactement** le jeu de données mock (même contenu que
`seedPages` + `buildSeedModules` + `buildSeedNavigation`), mais en **UUID
réels** et en respectant les clés étrangères :

1. **Transaction** : suppression du contenu du tenant de démo (id fixe
   `00000000-0000-0000-0000-000000000001`) pour garantir l'**idempotence** ;
2. **`profiles`** : upsert du profil démo (`email: demo@exemple.fr`) ;
3. **`pages`** : insertion des 5 pages seed (slug vide pour l'Accueil) — on
   conserve les **UUID retournés** par Drizzle (`returning`) ;
4. **`page_modules`** : pour chaque page, insertion de `buildSeedModules(slug)`
   en réindexant `order_index` (1..n) et en posant `is_visible = !hidden`,
   `content` = JSON sérialisé de `ModuleContent` (colonnes scalaires dérivées) ;
5. **`navigation_entries`** :
   - **Header** : 5 entrées racine `auto` liées aux pages (label =
     `menuTitle`, href = `pageHref(slug)`, position croissante) ;
   - sous-menu **démo Portfolio** : 3 entrées `custom` (`/portfolio#mariages`,
     `#portraits`, `#corporate`) avec `parent_id` = entrée Portfolio ;
   - **Footer** : entrées `manual` (`auto: false`) des pages sauf Accueil.

> NB : `buildSeedModules` génère des `randomUUID()` **dans** le JSON (ids
> d'items services/FAQ/galerie) — recréés à chaque seed, sans impact (ids
> locaux au contenu). Les helpers mock restent la source unique du contenu.

### 3.3 Vérification rapide

`db:check` (ad hoc en dev) : `SELECT count(*)` sur `pages`, `page_modules`,
`navigation_entries` du tenant de démo (attendu 5 / ~13 / 8+3) et un `JOIN`
démontrant l'auto-jointure Niveau 2 (enfants de l'entrée Portfolio).

## 4. Diagramme d'architecture

```mermaid
flowchart TD
    A[src/db/schema.ts] -->|drizzle-kit generate| M[drizzle migrations]
    M -->|drizzle-kit migrate| P[(PostgreSQL Supabase)]
    S[src/db/seed.ts] -->|tsx| P
    D[drizzle.config.ts] --> P
    C[src/db/index.ts client singleton] --> P
    P -->|futur 5.2 SSR hydration| U[Stores UI inchangés]
```

## 5. Stratégie de transition progressive (sans casser l'UI)

Principe directeur : **l'UI reste synchrone et optimiste** ; la BDD est
introduite **par la périphérie** (données initiales) puis **par les actions**
(persistance), jamais en refactorisant les composants.

### 5.1 (cette étape) — Infrastructure uniquement

- Schéma + migrations + seed + client DB. **Zéro** modification UI : les
  stores continuent de s'initialiser sur le seed mémoire.
- Garantie : `npx tsc --noEmit`, `npm run lint`, `npm run build` restent verts
  (aucun import nouveau côté app).

### 5.2 (étape suivante) — Hydratation SSR sans changer le contrat

- Les providers reçoivent un prop optionnel `initialData` (pages, modules,
  navigation) — **contrat de props identique** (pattern déjà utilisé en 3.1 :
  `PagesManager initialPages`, « prépare le futur SSR Supabase sans changer le
  contrat »).
- Les pages/layouts serveur (`/admin/*`, `/`) lisent l'état via le client DB
  (Drizzle, §2.3) et le sérialisent dans les providers → l'UI **restitue la
  BDD** à la place du seed. **Fallback seed** si `DATABASE_URL` absente/erreur.
- Le store module `navigation-store.ts` (§4.5) est réconcilié : l'init seed est
  remplacé par une **hydratation explicite** au montage des layouts (la
  persistance d'une même session entre `/admin` et `/` reste assurée côté
  serveur au rechargement).

### 5.3 (étape suivante) — Persistance des actions & RLS/Auth

- Chaque action de store devient **optimiste + persistée** via Route Handlers
  (`/api/pages`, `/api/navigation`) validés par Drizzle (server actions ou
  handlers — décision 5.3) ;
- `PagesNavigationSync` et la logique `resolveNavPreset` migrent en **requêtes
  transactionnelles** serveur (plus de réconciliation client) ;
- RLS « owner » (`profiles.id` ↔ `auth.uid()`) + lecture publique filtrée des
  pages **publiées** ; `@supabase/supabase-js` introduit ;
- retrait progressif du seed mémoire (celui-ci devient uniquement le seed BDD).

```mermaid
flowchart LR
    M1[Mock en mémoire] -->|5.1 schema seed| M2[BDD + seed + fallback mock]
    M2 -->|5.2 hydration SSR initialData| M3[Stores hydratés par la BDD]
    M3 -->|5.3 CRUD optimiste API| M4[Persistance complète + RLS]
```

## 6. Tâches (ordre d'exécution — mode Code)

1. `package.json` : dépendances `drizzle-orm`, `postgres` + dev `drizzle-kit`,
   `tsx`, `dotenv` ; scripts `db:*`.
2. `.env.example` : ajout `DATABASE_URL` (valeurs factices) — rappel : l'agent
   ne modifie jamais `.env.local`.
3. `drizzle.config.ts` (racine) + `src/db/schema.ts` (§1) + `src/db/index.ts`
   (§2.3).
4. `drizzle-kit generate` → migration n°1 ; `drizzle-kit migrate` (cible
   Supabase locale/distance configurée par l'utilisateur).
5. `src/db/seed.ts` (§3.2) + exécution `db:seed` + vérification `db:check`.
6. Vérifications app intactes : `npx tsc --noEmit`, `npm run lint`,
   `npm run build`.
7. `../ROADMAP.md` (Phase 5 créée, 5.1 `[x]`) + `../CHANGELOG.md` (après
   validation interactive).

## 7. Fichiers touchés (prévision)

- Créés : `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`,
  `drizzle/` (migrations), `src/db/seed.ts`,
  `plans/ROADMAP-5.1-database-schema.md`.
- Modifiés : `package.json`, `package-lock.json`, `.env.example` (sample),
  `../ROADMAP.md`, `../CHANGELOG.md`.
- **Aucun** fichier `src/components/**`, `src/app/**`, `src/lib/pages.ts`,
  `src/lib/navigation.ts`, `src/lib/navigation-store.ts` modifié en 5.1.
- Draft historique `../-----PourMémoSQLeditor-CreationTable.md` : conservé tel
  quel (obsolète, documenté).

## 8. Vérifications & validation manuelle

- `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (l'app reste
  sur le mock, aucune régression) ;
- `db:generate` produit la migration attendue ; `db:migrate` l'applique sans
  erreur sur la BDD cible ;
- `db:seed` deux fois de suite → état identique (idempotence) ;
- requête de contrôle : les 5 pages, leurs modules ordonnés, le Header avec le
  sous-menu Portfolio (auto-jointure Niveau 2) et le Footer sont présents pour
  le tenant de démo ;
- `db:studio` : inspection visuelle des 3 tables + relations.

## 9. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Casser l'UI en introduisant la BDD | 5.1 = infra pure, zéro import app ; garanties tsc/lint/build (cf. §0.5) |
| Mismatch mock ↔ colonnes (statuts, `hidden`/`is_visible`, ordre) | Table de mapping exhaustive (§1.3 → §1.5) ; seed qui réutilise les helpers mock (source unique) |
| Enum `module_type` trop rigide (nouveaux modules) | `pgEnum` extensible (ajout d'une valeur = migration additive) ; `layout_variant`/`content` JSONB restent souples |
| Orphelins Niveau 2 / liens cassés | FKs `ON DELETE CASCADE` (page → nav, parent → enfants) alignées sur la cascade mock |
| `content` JSONB non typé (perte du zéro `any`) | `$type<ModuleContent>()` + validation applicative ; Zod prévu en 5.2/5.3 |
| Pools DB multipliés sous HMR Next.js | singleton `globalThis` (§2.3) |
| Rejouer le seed détruit des données utilisateur | seed **isolé au tenant de démo** (id fixe) + transaction idempotente ; jamais global |
| `DATABASE_URL` absente en dev | fallback seed intact ; `db:*` ne s'exécutent que si l'utilisateur a renseigné `.env.local` |
| RLS activée sans politique → accès anon vide | accès serveur « service » (bypass) documenté ; politiques posées uniquement à l'étape Auth |

## 10. Décisions ouvertes soumises à validation

1. **Enum `pages.status`** (`draft`/`published`) plutôt que `is_published
   boolean` du draft SQL (recommandé — mapping 1:1 avec `PageStatus`) ;
2. **Table `profiles`** légère sans lien `auth.users` en 5.1 (l'auth viendra
   plus tard) ;
3. **RLS activée mais sans politique** en 5.1 (accès serveur « service ») ;
4. **Cible BDD** : Supabase distant et/ou local (`supabase start`) selon ce que
   l'utilisateur a configuré ;
5. **Réutiliser les helpers mock** (`buildSeedModules`, `buildSeedNavigation`,
   labels/hrefs) comme source du seed BDD (recommandé — zéro duplication).
