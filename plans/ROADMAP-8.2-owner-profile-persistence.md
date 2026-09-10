# Plan — ROADMAP Étape 8.2 : Persistance BDD du module « Profil »

## Objectif

Rendre **durable** le module Profil (créé en 8.1) : aujourd'hui l'état vit dans un
singleton en **mémoire** ([`owner-profile.ts`](../src/lib/owner-profile.ts)) —
tout rechargement de page (F5) ou redémarrage du dev server réinitialise à
`DEFAULT_OWNER_PROFILE`. Cette étape branche la **persistance BDD** exactement
comme les autres modules (pages/navigation/media) :

- table `site_owner_profile` (1 ligne par photographe) + RLS ;
- repository + hydratation SSR (`loadInitialData`) + `OwnerProfileProvider` ;
- endpoint `/api/profile` (PUT upsert) + client de persistance ;
- bouton « Enregistrer » réel avec retour d'état.

En l'absence de Supabase (`DATABASE_URL`), le **fallback gracieux** actuel est
conservé (mémoire + seed), comme pour pages/navigation.

---

## 0. Décisions d'architecture (à valider)

### D-1 — Table `site_owner_profile` : profil stocké en **JSONB typé**
- Une seule ligne par photographe → **`photographer_id` en clé primaire**
  (FK → `profiles.id`, `onDelete: cascade`).
- Colonnes : `photographer_id uuid PK`, `data jsonb` (`$type<OwnerProfile>()`),
  `created_at`, `updated_at` (Drizzle, mêmes conventions que le schéma 5.1).
- **Pourquoi JSONB et non ~24 colonnes scalaires** : le profil est un « settings
  » de tenant entier, validé par `OwnerProfileSchema` (Zod) à toutes les
  frontières ; un blob JSONB typé reste robuste aux évolutions de champs (même
  philosophie que `content` des modules) et évite une migration par champ.
- RLS (migration manuelle, comme 0001) : **owner-only** (`authenticated`,
  `photographer_id = auth.uid()`) sur SELECT/INSERT/UPDATE/DELETE. **Pas de
  lecture `anon`** : la marque publique (Header/Footer) est injectée côté
  **serveur** (rôle service) via l'hydratation SSR — pas d'exposition client des
  données privées du profil.

### D-2 — Repository dédié (couche serveur, jamais importée côté client)
`src/db/repositories/owner-profile.repository.ts` :
- `getOwnerProfile(photographerId)` → `OwnerProfile | null`
  (parse Zod tolérant + fusion `DEFAULT_OWNER_PROFILE` pour les champs absents).
- `upsertOwnerProfile(photographerId, profile)` → `insert … onConflictDoUpdate`
  (colonne `data`) + `updated_at` ; renvoie la ligne mise à jour.

### D-3 — Hydratation SSR comme `loadInitialData` (pattern 5.2)
- [`load-initial-data.ts`](../src/db/load-initial-data.ts) : ajoute
  `profile?: OwnerProfile` à `SiteInitialData` (chargé via le repo, même bloc
  `try` → si BDD absente, `dbAvailable: false`, `profile` absent → seed mémoire).
- Aucun seed de ligne profil par défaut : si le tenant n'a pas encore de ligne,
  le loader renvoie `profile` absent (le store reste sur `DEFAULT_OWNER_PROFILE`
  jusqu'au premier enregistrement).

### D-4 — `OwnerProfileProvider` (Client) dans les deux layouts
Nouveau composant client `OwnerProfileProvider` (monté dans le layout
**front-office** — Header/Footer — et le layout **admin** — `/admin/profile`) :
- lit le snapshot module via `useSyncExternalStore` (même 3ᵉ argument serveur) ;
- **hydrate une fois** (`useEffect`) si `initialProfile` est fourni
  (`hydrateOwnerProfile`) — premier rendu identique au HTML SSR, puis remplace
  les valeurs serveur (même principe que `NavigationStoreProvider`) ;
- **persiste** les mutations quand `persistenceEnabled` est vrai : débounce
  400 ms + `persistOwnerProfile(profile)` (fire-and-forget, erreur journalisée),
  en sautant le premier rendu (rien à persister) — pattern 5.3 navigation.

### D-5 — API + client de persistance
- Route **`PUT /api/profile`** (upsert) : corps validé par `OwnerProfileSchema`,
  `photographerId = resolvePhotographerId()`, repo `upsertOwnerProfile`, réponse
  `201/200 { ok: true }` ; gestion `ZodError` (400) / erreur (500) calquée sur
  [`/api/pages`](../src/app/api/pages/route.ts). Route **`GET /api/profile`**
  (lecture pour rechargement/rafraîchissement, facultative mais cohérente).
- [`persistence-client.ts`](../src/lib/persistence-client.ts) : ajout
  `persistOwnerProfile(profile)` → `PUT /api/profile`.

### D-6 — Bouton « Enregistrer » & retour d'état (ProfileScreen)
- La saisie reste **optimiste** (update en direct) ; la persistance débouncée du
  Provider sauvegarde en continu quand BDD dispo.
- « Enregistrer » déclenche un flush immédiat + feedback :
  - BDD dispo → « Profil enregistré (BDD) à HH:MM:SS » ;
  - hors BDD (fallback) → message explicite « BDD indisponible : profil conservé
    en mémoire pour cette session (sera perdu au rechargement) ».
- **Nettoyage** : retrait du log de debug temporaire ajouté lors du diagnostic
  (dans [`owner-profile.ts`](../src/lib/owner-profile.ts), `setOwnerProfile`).

### D-7 — Hook d'hydratation dans le domaine
[`owner-profile.ts`](../src/lib/owner-profile.ts) : ajout de
`hydrateOwnerProfile(profile: OwnerProfile)` (remplace le snapshot module et
notifie) + `getOwnerProfileServerSnapshot` inchangé (défaut stable côté SSR).

---

## 1. Fichiers impactés (pour Kilo Code)

**BDD / Drizzle**
- `src/db/schema.ts` : table `site_owner_profile` (+ type `SiteOwnerProfileRow`).
- `drizzle/` : génération `npm run db:generate` (migration 0003 + snapshot) puis
  ajout **manuel** des instructions RLS (`ALTER TABLE … ENABLE ROW LEVEL
  SECURITY` + 4 politiques owner, style `0001_auth_rls.sql` avec marqueurs
  `statement-breakpoint`). Application si `DATABASE_URL` dispo : `npm run db:migrate`.

**Serveur / Domain**
- `src/db/repositories/owner-profile.repository.ts` (nouveau).
- `src/db/load-initial-data.ts` (+ type `SiteInitialData.profile`).
- `src/lib/owner-profile.ts` : `hydrateOwnerProfile` + suppression log debug.
- `src/lib/persistence-client.ts` : `persistOwnerProfile`.

**API**
- `src/app/api/profile/route.ts` (GET + PUT).

**UI / Providers**
- `src/components/backoffice/profile/OwnerProfileProvider.tsx` (nouveau).
- `src/components/backoffice/profile/ProfileScreen.tsx` : save/flush + états.
- Layouts : `src/app/(front-office)/layout.tsx` et `src/app/(back-office)/admin/layout.tsx`
  (montage du Provider avec `initialData={initial.profile}` +
  `persistenceEnabled={initial.dbAvailable}`).

**Non modifié** : Header/Footer (lisent déjà `useOwnerProfile`), schémas Zod
(conservés pour l'API), modules Héro.

## 2. Étapes d'implémentation (ordre)

1. **Schema + migration** : table `site_owner_profile` dans
   [`schema.ts`](../src/db/schema.ts) → `npm run db:generate` → éditer la
   migration 0003 (RLS owner) → `npm run db:migrate` (si env dispo).
2. **Repository** : `getOwnerProfile` / `upsertOwnerProfile` (Zod tolérant).
3. **Domaine** : `hydrateOwnerProfile` dans
   [`owner-profile.ts`](../src/lib/owner-profile.ts) + suppression log debug.
4. **Loader SSR** : `profile` dans `loadInitialData` (try/catch existant).
5. **Provider** `OwnerProfileProvider` (hydratation + persistance débouncée).
6. **API** `PUT/GET /api/profile` + `persistOwnerProfile` dans le client.
7. **ProfileScreen** : flush « Enregistrer » + retours d'état BDD / hors-BDD.
8. **Layouts** : montage du Provider front-office + admin.
9. **Validation** : `npx tsc --noEmit`, `npx eslint`, `npm run build` ; test
   manuel (si Supabase dispo) : saisir → Enregistrer → F5 → données restées ;
   hors BDD : message de fallback visible.

## 3. Périmètre & verdicts

| Question | Verdict |
| --- | --- |
| Où persister | Table `site_owner_profile`, **1 ligne/photographe**, profil entier en `data` JSONB typé (D-1) |
| Accès public profil | **Aucun RLS anon** : Header/Footer alimentés côté serveur (rôle service), pas d'exposition client (D-1) |
| Hydratation | `loadInitialData.profile` → `OwnerProfileProvider` dans layouts front + admin (D-3/D-4) |
| Écriture | Optimiste + débounce Provider quand BDD dispo ; « Enregistrer » = flush + état (D-5/D-6) |
| Hors BDD | Fallback mémoire conservé avec message explicite « sera perdu au rechargement » (D-6) |
| Sécurité mot de passe | Hors périmètre de 8.2 (déjà UI en 8.1 ; endpoint réel dépend Supabase, étape dédiée) |
