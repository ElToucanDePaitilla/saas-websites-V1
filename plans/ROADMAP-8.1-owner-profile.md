# Plan — ROADMAP Étape 8.1 : Module « Profil » (site_owner_profile)

## Objectif

Créer dans le Dashboard une section **« Profil »** (`/admin/profile`) = **source
de vérité** du propriétaire/marque, structurée en **4 rubriques**, avec :
- injection de la marque (brandName/logo/favicon) dans le **Header** ;
- réseaux sociaux + mentions légales dans le **Footer** (et barre flottante
  future) ; coordonnées pour les blocs Contact ;
- contexte rédactionnel IA (`getAIContextPrompt`) ;
- sécurité & changement de mot de passe.

---

## 0. Décisions d'architecture (à valider)

### D-1 — Domaine : un module dédié `owner-profile` + store partagé
- Nouveau domaine [`src/lib/owner-profile.ts`](../src/lib/owner-profile.ts) :
  types `OwnerProfile` (miroir de la spec Zod), `DEFAULT_OWNER_PROFILE`,
  constantes de Select (grammaticalPerson/communicationStyle), fabrique.
- **Store** : `OwnerProfileProvider`/`useOwnerProfile` (même pattern que
  `PagesStoreProvider`) hydraté par le layout `/admin` ; actions `update(patch)`,
  `getAIContextPrompt()`.
- **Zod** : `OwnerProfileSchema` + `ProfileSecuritySchema` dans
  [`persistence.ts`](../src/lib/schemas/persistence.ts) (et/ou fichier dédié).

### D-2 — Table & persistance
- Table BDD **`site_owner_profile`** (photographer_id PK/FK → profiles, colonnes
  scalaires + `social_links jsonb`) + `profile_pdf/logo/favicon` via médiathèque
  existante (upload → URL). La table est optionnelle en mode démo (fallback seed
  mémoire) — **persistance réelle activée si Supabase est configuré**.
- Légère extension de `profiles` non requise : colonnes propres au profil.

### D-3 — Back-Office UI : 4 rubriques
1. **🏢 Identité, Marque & Visuels** : ownerName, brandName, logoUrl + faviconUrl
   (upload + vignette), businessSummary, businessSector, serviceArea, keywords.
2. **📍 Contacts & Adresses** : address + `showAddress` ; publicEmail +
   `showEmail` ; contactFormEmail masqué/synchronisé si `sameAsPublicEmail` ;
   socialLinks (instagram/facebook/linkedin/youtube/tiktok/x).
3. **⚖️ Légal & Ligne Éditoriale (IA)** : legalStatus, siret, vatNumber,
   publicationDirector ; grammaticalPerson, communicationStyle, targetAudience ;
   bioPdfUrl/cvPdfUrl (dropzone + nom de fichier).
4. **🔒 Sécurité & Mot de passe** : currentPassword (requis), newPassword (force :
   majuscule/chiffre/symbole/8 min), confirmPassword (correspondance),
   revokeOtherSessions ; email d’alerte.
- Tooltips « i » partout ; aide `HelpTip` existant réutilisé.

### D-4 — Intégrations (moteur Builder)
- **Header** : `brandName`/`logoUrl` remplacent l’actuel `siteName` (fallback
  `siteName` si vide) — via `useOwnerProfile` (le Header est déjà client).
- **Footer** : ligne réseaux sociaux (socialLinks) + bloc « Mentions légales »
  (publicationDirector/SIRET…) selon visibilité.
- **IA** : `getAIContextPrompt()` retourne une chaîne formatée (activité,
  summary, persona, tutoiement/vouvoiement + style) pour les futurs assistants.

### D-5 — Sécurité (backend dépend de Supabase)
- Formulaire UI complet + validation locale (schéma).
- **Changement réel** : endpoint serveur `POST /api/profile/password`
  (`supabase.auth.updateUser(password)` après revalidation de la session ;
  `revokeOtherSessions` → `admin`/list sessions) **si Supabase configuré** ;
  sinon mode démo (message « environnement non configuré »).
- **Email d’alerte** : fonction à brancher (Resend) — **conditionnée à l’env**
  (non bloquant si absent : log seulement).

### D-6 — Écran & navigation
- Route `/admin/pages`… non : nouvelle route **`/admin/profile`** + entrée
  « Profil » dans la sidebar admin ([`SidebarNav.tsx`](../src/components/backoffice/SidebarNav.tsx)).

---

## 1. Fichiers impactés (pour Kilo Code)
**Domaine** : `src/lib/owner-profile.ts` (nouveau), store `OwnerProfileProvider`,
[`persistence.ts`](../src/lib/schemas/persistence.ts) (Zod), éventuel repo
`owner-profile.repository` + route `/api/profile`.
**Back-Office** : `src/app/(back-office)/admin/profile/page.tsx`,
`components/backoffice/profile/ProfileScreen.tsx` (+ rubriques), `SidebarNav`.
**Front** : [`Header.tsx`](../src/components/layout/Header.tsx) (marque/logo),
`Footer.tsx` (social + mentions), `getAIContextPrompt`.
**Non modifié** : modules Héro/pages existants.

## 2. Étapes d’implémentation (ordre)
1. Domaine + types + defaults + store + Zod.
2. Écran `/admin/profile` 4 rubriques (upload logo/favicon/PDF via médiathèque,
   toggles, tooltips) + sidebar.
3. Intégrations Header/Footer + `getAIContextPrompt`.
4. Sécurité : validation + endpoint `POST /api/profile/password` (Supabase si
   dispo) + email d’alerte (env).
5. Validation `tsc`/`eslint`/`next build` + contrôle visuel + alimentation
   nav/footer.

## 3. Périmètre (décision à trancher)
- **MVP recommandé (v1)** : Profil 4 rubriques UI + domaine/store + Header
  (brand/logo) + Footer social/légal + `getAIContextPrompt` ; **Sécurité** = UI +
  validation + endpoint (si Supabase) mais **email d’alerte** en log (env manquant).
- **Complet** : en plus, table BDD + persistance profil complète + email Resend
  réel + synchro favoricon.

---

## 4. Verdicts d’architecture
| Question | Verdict |
| --- | --- |
| Source unique marque/coord. | **Validée** : module `owner-profile` + store partagé alimentant Header/Footer (D-1/D-4) |
| UI 4 rubriques | **Validée** : Identité & visuels / Contacts & adresses / Légal & IA / Sécurité (D-3) |
| Contexte IA | **Validée** : `getAIContextPrompt()` (summary + persona + ton) (D-4) |
| Sécurité mot de passe | **Validée** UI + validation ; backend/email dépendants de Supabase/Resend (D-5) |
