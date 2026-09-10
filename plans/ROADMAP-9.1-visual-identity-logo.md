# Plan — ROADMAP Étape 9.1 : Module « Identité visuelle / Logo »

## Objectif

Créer dans le Dashboard (Back-Office) un module **entièrement manuel**
« Identité visuelle / Logo » pilotant l'**espace marque** de la barre de
navigation principale, avec **deux modes exclusifs** :

- **Mode Texte** : 2 lignes saisies manuellement + styles restreints
  (couleur, taille 3 positions, graisse 3 positions, espacement auto) ;
- **Mode Logo** : upload d'image contrôlé (≤ 200 × 60 px, `object-fit: contain`).

**Aucune valeur n'est reprise du module « Profil »** (l'automatisation a déjà
été retirée du Header). Champs **vierges** si aucune configuration préalable.
À défaut de configuration, le Header conserve son repli actuel **`siteName`**.

---

## 0. Décisions d'architecture (à valider)

### D-1 — Zone cible : **Header public** (marque à gauche), pas une sidebar
Le projet n'a **pas de sidebar gauche publique** : la navigation principale est
un **Header supérieur fixe** ([`Header.tsx`](../src/components/layout/Header.tsx))
avec la marque à gauche (actuellement `siteName` statique depuis le retrait de
l'auto-complétion Profil). Le `sidebar_header` du JSON fourni est donc mappé sur
cet **espace marque du Header**. (Le Back-Office, lui, possède une sidebar mais
elle affiche `siteName` — hors périmètre.)

### D-2 — Route : convention projet `/admin/*` (et non `/dashboard/*`)
L'application utilise `/admin` (Pages, Navigation, Profil, Médias,
`/admin/profile`…). Proposition : **`/admin/identite-visuelle`** (nom français,
cohérent avec les libellés FR de la sidebar). Alternative :
`/admin/visual-identity`. → **à trancher**.

### D-3 — Données : table dédiée `site_visual_identity` (indépendante du Profil)
- Nouvelle table **`site_visual_identity`** : `photographer_id` **PK/FK** →
  `profiles.id` (cascade), `data` **JSONB typé** `VisualIdentity`, `created_at`,
  `updated_at` — exactement le pattern retenu en 8.2 (`site_owner_profile`).
- **Mapping camelCase** (convention projet) du JSON fourni :
  `mode: "text" | "logo"`, `text: { line1, line2, color, size, weight }`,
  `logo: { url, altText }` (sémantique identique au schéma de la fiche).
- **RLS owner-only** (migration 0004, comme 0003) : `authenticated`,
  `photographer_id = auth.uid()` ; aucune lecture `anon` (le Header est alimenté
  côté serveur par `loadInitialData`).

### D-4 — Persistance **tolérante** (leçon du bug 400 « Email invalide »)
- La validation Zod (`VisualIdentitySchema`) **n'échoue jamais** sur des champs
  vides : `line1`/`line2` = `z.string().default("")` (longueurs `max(35)` /
  `max(45)` appliquées côté UI, non bloquantes serveur) ; `color` = string libre
  (défaut `#FFFFFF`) ; `size`/`weight` = enums avec défauts.
- « Ligne 1 obligatoire en mode texte » = **indication UI** (astérisque + hint) ;
  si vide, le Header retombe sur `siteName` (jamais d'écran cassé).
- Endpoint `PUT /api/visual-identity` = **upsert** (1 ligne/photographe).

### D-5 — Store + hydratation SSR (même pattern que Profil 8.2)
- Nouveau domaine [`src/lib/visual-identity.ts`](../src/lib/visual-identity.ts) :
  type `VisualIdentity`, `DEFAULT_VISUAL_IDENTITY`, constantes
  (modes, tailles, graisses), mapping taille → `{ line1Px, line2Px, letterSpacing }`,
  store module (`getSnapshot`/`getServerSnapshot`/`subscribe`/`set`/`hydrate`),
  `useVisualIdentity()`.
- **`VisualIdentityProvider`** (client) monté dans les layouts **front-office**
  (Header) et **admin** (écran) : hydratation post-montage depuis
  `loadInitialData.visualIdentity` + **persistance débouncée** (400 ms) quand la
  BDD est disponible (1er rendu et hydratation ignorés).
- `loadInitialData` : ajoute `visualIdentity?` (absent → `DEFAULT`).

### D-6 — API + client
- `GET/PUT /api/visual-identity` (upsert validé `VisualIdentitySchema`, scope
  `resolvePhotographerId`), calqué sur `/api/profile`.
- `persistence-client.ts` : `persistVisualIdentity(visualIdentity)`.

### D-7 — UI (écran `/admin/identite-visuelle`)
- **Sélecteur de mode** : contrôle segmenté 2 positions **Texte | Logo**
  (pas de dépendance Tabs/RadioGroup installée → boutons segmentés maison,
  accessibles `role="radiogroup"`).
- **Mode Texte** : `line1` (placeholder « Ex : Nom du propriétaire / Artiste /
  Société / Marque », max 35), `line2` (placeholder « Ex : Qualité / Profession
  / Titre », max 45) ; **couleur** = `input type="color"` + **palettes
  prédéfinies** + saisie **Hex/RGBA** ; **taille** (Petite 12/10 · Moyenne 14/12
  par défaut · Grande 16/13) ; **graisse** (Normal 400 · Semi-gras 600 · Gras
  700) ; mention « police héritée de la charte, espacement calculé
  automatiquement ».
- **Mode Logo** : zone d'upload **Drag & Drop + sélection** (réutilise
  `MediaUploadButton`/`uploadMedia`) avec **validation client** : formats
  `.svg/.png/.jpg/.webp`, **max 2 Mo**, conseil SVG ; aperçu contraint
  `max-h-[60px] max-w-[200px] object-contain` ; champ `altText` (accessibilité).
- **Aperçu en direct** : bloc modélisant l'espace marque, réagissant à chaque
  frappe / couleur / taille / upload, **avant** enregistrement.
- Bouton **Enregistrer** (flush immédiat + états succès/erreur, comme 8.2).

### D-8 — Intégration Header
- La zone marque rend : mode **text** → les 2 lignes stylées (couleur, tailles,
  graisse, espacement auto) ; mode **logo** → `<img>` contraint 200×60
  `object-contain` (alt = `altText`) ; **sinon** → repli `siteName` (inchangé).
- Aucun lien avec `OwnerProfile` pour cet espace (indépendance DoD).

### D-9 — Support **SVG** à étendre dans la médiathèque
L'API média actuelle refuse le SVG ([`ALLOWED_MIME`](../src/app/api/media/route.ts:27)
sans `image/svg+xml`, [`extensionFromMime`](../src/lib/supabase/storage.ts:23)
sans `svg`). Or la fiche exige `.svg` (recommandé). → ajouter `image/svg+xml`
(mapping `svg`) **et** l'entrée d'accept correspondante. La limite **2 Mo** du
logo est contrôlée **côté client** (l'API média reste à 50 Mo pour les autres
usages).

### D-10 — Sidebar Dashboard
Ajout d'une entrée **« Identité visuelle / Logo »** dans
[`SidebarNav.tsx`](../src/components/backoffice/SidebarNav.tsx) (section
« Contenu », icône `Palette`/`Image`), route = D-2.

### D-11 — Contraintes typographiques exactes (reprises de la fiche)
| Taille | Ligne 1 | Ligne 2 |
| --- | --- | --- |
| Petite | 12 px | 10 px |
| Moyenne (défaut) | 14 px | 12 px |
| Grande | 16 px | 13 px |

Graisse : `400` / `600` / `700`. Espacement : dérivé de la taille
(ex. petite `0.02em`, moyenne `0.03em`, grande `0.04em`).

---

## 1. Fichiers impactés (pour Kilo Code)

**BDD / Drizzle**
- `src/db/schema.ts` : table `site_visual_identity` (+ type de ligne).
- `drizzle/` : `npm run db:generate` (migration 0004) puis **RLS owner** ajoutée
  à la main (style 0003) ; `npm run db:migrate` si env.

**Domaine / Serveur**
- `src/lib/visual-identity.ts` (nouveau) : types + defaults + constantes + store.
- `src/db/repositories/visual-identity.repository.ts` (nouveau) : get/upsert.
- `src/db/load-initial-data.ts` : `visualIdentity?`.
- `src/lib/schemas/persistence.ts` : `VisualIdentitySchema` (+ enums).
- `src/lib/persistence-client.ts` : `persistVisualIdentity`.

**API**
- `src/app/api/visual-identity/route.ts` (GET/PUT).
- `src/app/api/media/route.ts` + `src/lib/supabase/storage.ts` : acceptation SVG.

**UI / Providers**
- `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx` (nouveau).
- `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx` (nouveau) :
  segments mode, rubriques Texte/Logo, aperçu live.
- `src/app/(back-office)/admin/identite-visuelle/page.tsx` (route).
- `src/components/backoffice/SidebarNav.tsx` : entrée « Identité visuelle / Logo ».
- `src/components/layout/Header.tsx` : rendu marque depuis `useVisualIdentity`
  (repli `siteName`).
- Layouts front-office + admin : montage du `VisualIdentityProvider`.

## 2. Étapes d'implémentation (ordre)

1. Domaine `visual-identity.ts` (types, defaults, constantes taille/poids, store).
2. Schema BDD + migration 0004 (RLS owner) + `db:migrate` si env.
3. Repository (get/upsert tolérant) + `loadInitialData.visualIdentity`.
4. `VisualIdentitySchema` (Zod) + API `/api/visual-identity` + `persistVisualIdentity`.
5. `VisualIdentityProvider` + montage layouts.
6. Écran `/admin/identite-visuelle` (mode, rubriques, color picker, upload logo,
   aperçu live) + entrée sidebar exacte « Identité visuelle / Logo ».
7. SVG : extension `ALLOWED_MIME` + `extensionFromMime`.
8. Intégration Header (texte 2 lignes / logo contraint / repli `siteName`).
9. Validation `tsc` / `eslint` / `build` + CHANGELOG + contrôle visuel.

## 3. Périmètre & verdicts

| Question | Verdict |
| --- | --- |
| Zone pilotée | **Header public** (espace marque à gauche) — D-1 |
| Route | `/admin/identite-visuelle` (ou `/admin/visual-identity`) — D-2 à trancher |
| Stockage | Table dédiée `site_visual_identity` JSONB, RLS owner — D-3 |
| Indépendance Profil | Aucune valeur reprise ; champs vierges ; repli `siteName` — D-1/D-8 |
| Bascule Texte/Logo | Contrôle segmenté instantané, formulaire + aperçu live — D-7 |
| Contrainte logo | ≤ 200 × 60 px, `object-contain`, ≤ 2 Mo, SVG/PNG/JPG/WebP — D-7/D-9 |
| Persistance | Upsert BDD + hydratation SSR + debounce ; appliquée au reload/page — D-4/D-5 |
| Validation | Tolérante (pas de blocage 400 type « email ») — D-4 |

---

## Amendement 9.1.a — Paramètres distincts par ligne + aperçu sur fond neutre

### A-1 — Modèle : chaque ligne a **ses propres** paramètres
Le mode texte passe d'un style partagé à **deux blocs indépendants** :

```jsonc
{
  "mode": "text",
  "text": {
    "line1": { "value": "Nom de la Marque", "color": "#FFFFFF", "size": "medium", "weight": "600" },
    "line2": { "value": "Studio de création", "color": "#D1D5DB", "size": "small",  "weight": "400" }
  },
  "logo": { "url": "", "altText": "" }
}
```

- Type TS : `VisualIdentityTextLine { value, color, size, weight }` ; `text: { line1, line2 }`.
- Défauts (champs vierges) : `line1` = medium / 600, `line2` = medium / 400.
- **Métriques px par ligne** (alignées sur la fiche d'origine) :
  - ligne 1 : Petite 12 · Moyenne 14 · Grande 16 ;
  - ligne 2 : Petite 10 · Moyenne 12 · Grande 13.
- Espacement automatique **par ligne** selon sa taille (`.02em` / `.03em` / `.04em`).
- **Rétro-compatibilité** : l'ancienne forme plate (`text.line1: string`, `color`,
  `size`, `weight` partagés) est normalisée vers la nouvelle structure via
  `normalizeVisualIdentity(raw)` (utilisée par le repository au décodage BDD).
- UI : rubriques « Ligne 1 » et « Ligne 2 » **chacune** avec ses contrôles
  (texte 35/45, couleur + presets, taille 3 positions, graisse 3 positions).
- Header : applique les styles de chaque ligne séparément.

### A-2 — Aperçu en direct sur **fond neutre médian**
- Le bloc d'aperçu (écran) utilise désormais un **fond gris moyen** (ex. `#808080`,
  équivalent `bg-neutral-500`) — ni blanc ni noir — afin qu'un texte **blanc, noir
  ou gris** reste lisible.
- Seul l'**aperçu de l'éditeur** change : le vrai Header conserve son chrome
  (glassmorphism) inchangé.

### A-3 — Fichiers impactés (amendement)
`src/lib/visual-identity.ts` (types + métriques + normalize), `src/lib/schemas/persistence.ts`
(`VisualIdentitySchema` v2), `src/db/repositories/visual-identity.repository.ts`
(normalisation legacy), `VisualIdentityScreen.tsx` (rubriques ligne 1/2 + fond
aperçu), `src/components/layout/Header.tsx` (styles par ligne). Migrations : **aucune**
(JSONB — compat assurée par `normalizeVisualIdentity`).

---

## Amendement 9.1.b — Échelle 5 tailles calibrée, défaut couleur, palette + pipette

### B-1 — Ratios typographiques imposés
- Texte du **menu de la barre de nav** = `text-sm` Tailwind = **14 px** (référence).
- **Ligne 1** ≈ **+25 %** vs menu (14 × 1,25 = 17,5 → **18 px** arrondi, soit +28,6 %).
- **Ligne 2** = Ligne 1 ÷ 1,2 (⇒ Ligne 1 ≈ **+20 %** vs Ligne 2, ratio exact).

### B-2 — Deux niveaux **supplémentaires** → **5 positions** (recalibrées)
Les 3 libellés existants sont conservés, mais les valeurs px sont **recalibrées**
pour respecter B-1, et 2 niveaux sont ajoutés **au-dessus** :

| Niveau | Ligne 1 | Ligne 2 | Ratio L1/L2 |
| --- | --- | --- | --- |
| Petite (`small`) | 14 px | 12 px | 1,17 |
| **Moyenne (`medium`) — défaut** | **18 px** | **15 px** | **1,20** |
| Grande (`large`) | 22 px | 18 px | 1,22 |
| Très grande (`xlarge`) *(nouveau)* | 25 px | 21 px | 1,19 |
| Énorme (`xxlarge`) *(nouveau)* | 30 px | 25 px | 1,20 |

- Tokens ajoutés : `xlarge`, `xxlarge` (ordre : `small, medium, large, xlarge, xxlarge`).
- Libellés : Petite · Moyenne (défaut) · Grande · Très grande · Énorme.
- Espacement par taille : `.02em · .03em · .035em · .04em · .045em`.
- Note : le défaut passe de 14 → **18 px** (exigence « +25 % du menu ») ; les
  valeurs JSONB déjà stockées (`small/medium/large`) restent valides et
  s'affichent simplement à la nouvelle échelle.

### B-3 — Couleur par défaut des deux lignes : `#1E293B`
`DEFAULT_VISUAL_IDENTITY` **et** les défauts Zod passent à `#1E293B` (ardoise
foncée) pour les **deux** lignes. Sur le fond d'aperçu neutre `#808080`, ce
`#1E293B` reste lisible ; les textes blancs/gris restent possibles.

### B-4 — Palette **sur mesure** + **pipette écran**
- Nouvelle palette ~18 pastilles, en deux rangées : **neutres** (`#FFFFFF`,
  `#E5E7EB`, `#9CA3AF`, `#6B7280`, `#374151`, `#1E293B`, `#111827`, `#000000`)
  puis **accents** (`#2563EB`, `#0EA5E9`, `#14B8A6`, `#10B981`, `#84CC16`,
  `#F59E0B`, `#F97316`, `#EF4444`, `#EC4899`, `#8B5CF6`).
- Bouton **Pipette** (icône `Pipette` de lucide) par ligne : utilise l'**EyeDropper
  API** (`new EyeDropper().open()`) qui permet de prélever une couleur
  **n'importe où à l'écran, y compris hors de l'onglet**. Détection de support
  (`window.EyeDropper`) ; si absent (Firefox/Safari), bouton **désactivé** avec
  tooltip explicatif. Aucune dépendance ajoutée.
- Le champ texte Hex/RGBA et l'`input type="color"` restent disponibles en
  complément.

### B-5 — Fichiers impactés (9.1.b)
`src/lib/visual-identity.ts` (enum 5 tailles, `TEXT_LINE_PX`, spacing, défauts
`#1E293B`, palette), `src/lib/schemas/persistence.ts` (enum + défauts couleur),
`VisualIdentityScreen.tsx` (palette 2 rangées + bouton pipette + intégration),
`src/components/layout/Header.tsx` (aucun changement de logique : nouvelles px
via `TEXT_LINE_PX`). Migrations : **aucune**.
