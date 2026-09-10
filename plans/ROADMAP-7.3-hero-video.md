# Plan — ROADMAP Étape 7.3 : Rubrique Héro — HeroVideo (`variant: "video"`)

## Objectif

Construire le module **Hero Vidéo** « prêt à l'emploi », en **héritage direct de
`BaseHero`** (structure 7.1 : H1/H2/description, graisses, tone, overlay, CTA,
animation) — seule la **couche média vidéo** et sa gestion mobile sont ajoutées.
Même famille `type: "hero"`, discriminent `variant: "video"`, aucune migration
d'enum BDD, catalogue multi-cartes.

---

## 0. Décisions d'architecture (recommandations — à valider)

### D-1 — Héritage : `HeroVideoContent extends HeroBaseShared` (comme le static) ✅ STRUCTURE VALIDÉE
- HeroStatic porte un média `<picture>` ; **HeroVideo porte une vidéo** : le
  bloc textes/CTA/overlay/animation reste celui de `BaseHero` (centré), exactement
  comme `HeroStaticContent`.
- `HeroContent` (union) devient `HeroStaticContent | HeroSliderContent |
  HeroVideoContent`.
- L'aiguillage renderer/éditeur bascule par `content.variant`.

```ts
/** Média vidéo du HeroVideo (fallback responsive). */
export interface HeroVideoMedia {
  videoUrl: string;            // MP4 / WebM (obligatoire pour le rendu vidéo)
  loop: boolean;               // défaut true (lecture en boucle)
  /** Poster desktop 16:9 (optionnel) — affiché pendant le chargement vidéo. */
  posterDesktop: ArtSource;
  /** Fallback mobile 9:16 OBLIGATOIRE (photo à la place de la vidéo <768px). */
  fallbackMobile: ArtSource;
}

/** Contenu d'un Hero VIDÉO. */
export interface HeroVideoContent extends HeroBaseShared {
  variant: "video";
  media: HeroVideoMedia;       // distingué du HeroStatic par le variant
}
```

### D-2 — Rendu : `<video>` desktop + `<picture>` mobile (économies data) ✅ RECOMMANDÉ
- **Desktop (≥ 768 px)** : balise `<video>` en `absolute inset-0 object-cover`,
  `autoPlay muted loop playsInline controls={false} preload="metadata"` +
  `poster` = image desktop (16:9) si renseignée (état de chargement) — le
  `muted`/`playsinline` restent forcés (exigence navigateur autoplay).
- **Mobile (< 768 px)** : la vidéo est **masquée** (et non chargée) et l'on
  affiche l'**image fallback 9:16** via `<picture>` (mobile obligatoire) →
  économie de data/batterie. Le basculement s'appuie sur `matchMedia
  (min-width: 768px)` dans un petit composant **client** `HeroVideoBackground`
  (SSR : rend desktop par défaut → cohérent pour le poster/LCP).
- Le composant est branché en `children` de `BaseHero` (comme
  `HeroStaticBackground` pour le static) ; overlay/textes centrés inchangés.

### D-3 — Éditeur : 3 rubriques (réutilise les briques 7.1/7.2)
- **🎬 Média Vidéo & Fallback** : `video_url` (URL/MP4/WebM) + tooltip
  « privilégiez une vidéo courte sans son et légère », `loop` (Switch, activé) ;
  fallback mobile **obligatoire** (`ArtSourceField` 9:16 + alt) + tooltip ;
  poster desktop **optionnel** (`ArtSourceField` 16:9) + tooltip.
- **📝 Textes & Bouton** : **héritée de BaseHero** (overlay segmenté, H1/H2/desc,
  tone, graisses globales, CTA) — mêmes champs que le static (réutilise les
  helpers de `ModuleHeroEditor` : `overlayLevel`, `textTone`, `weightH1/H2/Text`,
  CTA).
- **⚙️ Réglages & Performance** : `loop` (rappel) + aides sur `muted`/`playsinline`
  (toujours actifs, non éditables — exigence navigateur).

### D-4 — Aiguillages (renderer/éditeur)
- [`HeroModule`](../src/components/modules/hero/HeroModule.tsx) : branche
  `variant === "video"` → `BaseHero` + `HeroVideoBackground` (idem static).
- [`ModuleContentEditor`](../src/components/backoffice/pages/modules/ModuleContentEditor.tsx) :
  branche `variant === "video"` → `ModuleHeroVideoEditor`.
- [`ModuleSettingsForm`](../src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) :
  animation générique **visible** pour `video` (comme slider) ; seul `static`
  garde sa rubrique dédiée.

### D-5 — Schémas Zod (demande explicite)
- Ajout d'un schéma de **contenu Héro** (validation à la persistance) :
  `heroVideoMediaSchema`, puis `heroContentSchema = z.discriminatedUnion("variant",
  [heroStaticContentSchema, heroSliderContentSchema, heroVideoContentSchema])`
  dans [`src/lib/schemas/persistence.ts`](../src/lib/schemas/persistence.ts)
  (les schémas des variantes static/slider y sont ajoutés en même temps).
- Appliqué en option lors de la validation du `content` d'un module `hero`
  (payload `/api/pages/[pageId]/modules`) — aucune rupture : le JSONB reste la
  source de vérité et le code domaine normalise (résolveurs).

### D-6 — SEO/helpers
- `public-page.ts` : pour `variant video`, collecter `posterDesktop` +
  `fallbackMobile` (images) ; description/OG : texte du bloc (H1 partagé) et
  image **poster desktop** (idéale pour l'OG) sinon fallback mobile.

---

## 1. Fabrique & résolveur

```ts
/** Vidéo d'exemple (MP4 de démo, poster + fallback picsum 16:9 / 9:16). */
export function createHeroVideoContent(): HeroVideoContent { … }

/** Résout un contenu Héro « video » (JSONB/partiel → complet). */
export function resolveHeroVideoContent(raw: unknown): HeroVideoContent { … }
```

> Les images par défaut réutilisent le pool picsum existant (seeds stables) ;
> `videoUrl` par défaut = une URL MP4 de démonstration (peut être un asset local
> `/…` à confirmer à l'implémentation, ex. `https://…/demo.mp4`).

## 2. Catalogue & injection
Carte : `{ id: "hero-video", type: "hero", variant: "video", label: "Hero
Vidéo", category: "Héro & accroche", description: "Une vidéo d'arrière-plan
avec photo de secours sur mobile et appel à l'action." }` → `createModule("hero",
seq, "video")` ; `createModuleContent(type, variant?)` gère `"video"`.

## 3. Fichiers impactés (pour Kilo Code)

**Domaine** : [`src/lib/pages.ts`](../src/lib/pages.ts) (`HeroVideoMedia`,
`HeroVideoContent`, `HeroContent` élargie, `heroVariantLabels` + "video",
fabriques, `resolveHeroVideoContent`, catalogue) ; [`persistence.ts`](../src/lib/schemas/persistence.ts)
(schémas Zod Héro, D-5).

**Front** : `src/components/modules/hero/HeroVideoBackground.tsx` (client,
bascule <768), orchestrateur [`HeroModule.tsx`](../src/components/modules/hero/HeroModule.tsx)
branche video, [`PublicModules.tsx`](../src/components/modules/PublicModules.tsx) inchangé (→ HeroModule).

**Back-Office** : `ModuleHeroVideoEditor.tsx` (3 rubriques, réutilise
`ArtSourceField`, `SelectField`, `SegmentedButtons`, helpers de textes),
[`ModuleContentEditor.tsx`](../src/components/backoffice/pages/modules/ModuleContentEditor.tsx).

**Helpers** : [`public-page.ts`](../src/lib/public-page.ts) (images video : poster
+ fallback ; description/OG), démo éventuelle [`demo/page.tsx`](../src/app/(front-office)/demo/page.tsx).

**Non modifié** : enum BDD `module_type`, `moduleTypeSchema` (`hero`),
[`schema.ts`](../src/db/schema.ts).

## 4. Étapes d'implémentation (ordre)

1. **Domaine** : types + union + fabrique/défauts + `resolveHeroVideoContent` +
   catalogue carte + `createModuleContent(variant)` + Zod Héro (D-5).
2. **Front** : `HeroVideoBackground` (video desktop / `<picture>` mobile,
   poster, `prefers-reduced-motion` → autoplay coupé, image affichée) branché sur
   `BaseHero` ; orchestrateur + helpers publics.
3. **Back-Office** : `ModuleHeroVideoEditor` 3 rubriques + aiguillage.
4. **Validation** : `tsc --noEmit` + `eslint` + `next build` ; contrôle visuel
   desktop (vidéo autoplay/boucle/poster) et mobile (< 768 px → photo fallback).

## 5. Périmètre exclu
- HeroParallax (étape suivante).
- Vidéos distantes optimisées (streaming) / vignette durée / boutons de contrôle :
  hors fiche (video en arrière-plan décorative, `controls={false}`).

---

## 6. Verdicts d'architecture

| Question | Verdict |
| --- | --- |
| Héritage BaseHero 100 % | **Validée** : `HeroVideoContent extends HeroBaseShared` → BaseHero + overlay/textes/CTA/animation partagés (D-1) |
| Média vidéo & fallback mobile | **Validée** : `<video>` autoplay/muted/loop/playsinline + `object-cover` ≥768 ; `<picture>` 9:16 <768 ; poster desktop au chargement (D-2) |
| Interface 3 rubriques | **Validée** : média & fallback (tooltips), textes hérités, réglages/perf (muted/playsinline masqués) (D-3) |
| Schémas Zod / types | **Validée** : extension TS + `heroContentSchema` discriminé (static/slider/video) en validation de persistance (D-5) |
| Responsive / data | **Validée** : vidéo non chargée sur mobile, fallback photo ; `prefers-reduced-motion` → autoplay coupé |
