# Plan — ROADMAP Étape 7.4 : Rubrique Héro — HeroParallax (`variant: "parallax"`)

## Objectif

Construire le **Hero Parallaxe** « prêt à l'emploi » en **héritage direct de
`BaseHero`** (structure 7.1 : H1/H2/description, overlay, graisses, tone, CTA,
animation) — seule la **couche image en profondeur** (parallaxe) est ajoutée,
avec **désactivation automatique sur mobile** (perf 60 FPS). Même famille
`type: "hero"`, discriminent `variant: "parallax"`, aucune migration d'enum,
catalogue multi-cartes.

---

## 0. Décisions d'architecture (recommandations — à valider)

### D-1 — Héritage : `HeroParallaxContent extends HeroBaseShared` (comme static/video)
- Le média réutilise **`HeroStaticMedia`** (desktop 16:9 HD pour l'effet,
  mobile 9:16 fixe obligatoire, tablette 4:3 optionnelle) — mêmes types
  `ArtSource`/`<picture>` déjà éprouvés.
- `HeroContent` devient `static | slider | video | parallax`.
- L'aiguillage renderer/éditeur bascule par `content.variant`.

```ts
/** Intensité de l'effet parallaxe (desktop). */
export type ParallaxSpeed = "subtle" | "medium" | "strong";

export interface HeroParallaxContent extends HeroBaseShared {
  variant: "parallax";
  media: HeroStaticMedia;      // desktop 16:9 HD / mobile 9:16 fixe / tablet 4:3
  parallaxSpeed: ParallaxSpeed; // défaut "medium" (classique)
  /** Verrouillé à true — effet toujours désactivé sur mobile (perf). */
  disableOnMobile: true;
}
```

### D-2 — Effet & performance (client, GPU)
- **Desktop (≥ 1024px)** : l'image est **surdimensionnée** (`scale-110` /
  hauteur du conteneur image > conteneur) et **translatée en Y** via
  `transform: translate3d` piloté à la demande (**`requestAnimationFrame` +
  `will-change-transform`**), proportionnel au scroll (facteur selon
  `parallaxSpeed` : subtle 0.08 / medium 0.15 / strong 0.25). Pas de calcul JS
  lourd : lecture de `scrollY` dans le rAF, interpolation directe, arrêt quand
  hors du viewport (IntersectionObserver) → CPU/GPU minimal.
- **Mobile (< 1024px)** : `disableOnMobile` verrouillé → **aucun** `transform`
  animé ; affichage **image fixe** `<picture>` `object-cover` standard
  (`background cover`) → 60 FPS & zéro friction tactile.
- `prefers-reduced-motion` : effet coupé (image fixe).
- Composant **`HeroParallaxBackground`** (client) branché en `children` de
  `BaseHero` ; overlay/textes centrés restent ceux de `BaseHero`.

### D-3 — Éditeur : 3 rubriques (réutilise les briques existantes)
- **🖼️ Image Parallaxe & Fallback** : `ArtSourceField` desktop (16:9, tooltip
  « privilégiez une haute définition »), mobile **obligatoire** (9:16 fixe,
  tooltip perf), tablette **optionnelle** (4:3).
- **📝 Textes & Bouton** : hérités de `BaseHero` (overlay segmenté, H1/H2/desc,
  tone, graisses, CTA) — mêmes champs que static/video.
- **⚙️ Réglages & Intensité Parallaxe** : `parallaxSpeed` (Select Léger /
  Moyen classique / Prononcé) + note « Mobile : effet désactivé automatiquement »
  (réglage verrouillé).

### D-4 — Aiguillages & Zod
- [`HeroModule.tsx`](../src/components/modules/hero/HeroModule.tsx) : branche
  `variant === "parallax"` → `BaseHero` + `HeroParallaxBackground`.
- [`ModuleContentEditor.tsx`](../src/components/backoffice/pages/modules/ModuleContentEditor.tsx) :
  branche `parallax` → `ModuleHeroParallaxEditor`.
- [`ModuleSettingsForm.tsx`](../src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) :
  animation générique visible (seul `static` garde sa rubrique dédiée).
- Zod : ajout `heroParallaxContentSchema` (variante `parallax` étendue de
  `heroSharedSchema` + `heroStaticMediaSchema` + `parallaxSpeed`) à
  `heroContentSchema` dans [`persistence.ts`](../src/lib/schemas/persistence.ts).

### D-5 — Helpers publics
- `public-page.ts` : collecter les images parallax (desktop/mobile/tablette) ;
  OG = image desktop.

---

## 1. Fabrique & résolveur

```ts
export function createHeroParallaxContent(): HeroParallaxContent { … }   // picsum HD 16:9 / 9:16 / 4:3 + speed medium
export function resolveHeroParallaxContent(raw: unknown): HeroParallaxContent { … }
export function heroParallaxImageSources(content: HeroParallaxContent): ArtSource[] { … }
```

## 2. Catalogue & injection
Carte : `{ id: "hero-parallax", type: "hero", variant: "parallax",
label: "Hero Parallaxe", category: "Héro & accroche", description: "Image en
profondeur au défilement, figée sur mobile." }` → `createModule("hero", seq,
"parallax")` ; `createModuleContent(type, variant?)` gère `"parallax"`.

## 3. Fichiers impactés (pour Kilo Code)
**Domaine** : [`src/lib/pages.ts`](../src/lib/pages.ts) (types, union,
fabrique/résolveur, catalogue, `createModuleContent`), [`persistence.ts`](../src/lib/schemas/persistence.ts)
(Zod `parallax`).

**Front** : `src/components/modules/hero/HeroParallaxBackground.tsx` (client,
parallaxe desktop / image fixe mobile), [`HeroModule.tsx`](../src/components/modules/hero/HeroModule.tsx).

**Back-Office** : `ModuleHeroParallaxEditor.tsx`, [`ModuleContentEditor.tsx`](../src/components/backoffice/pages/modules/ModuleContentEditor.tsx).

**Helpers** : [`public-page.ts`](../src/lib/public-page.ts) ; démo éventuelle.

**Non modifié** : enum BDD `module_type`, `moduleTypeSchema`, [`schema.ts`](../src/db/schema.ts).

## 4. Étapes d'implémentation (ordre)
1. Domaine (types/union/fabrique/résolveur/catalogue/Zod).
2. Front `HeroParallaxBackground` + orchestrateur + helpers.
3. Éditeur `ModuleHeroParallaxEditor` 3 rubriques + aiguillage.
4. Validation `tsc`/`eslint`/`next build` + contrôle visuel desktop/mobile.

## 5. Périmètre exclu
- Autres effets (Ken Burns, scroll parallaxe multi-couches) ; `background-attachment:
  fixed` non retenu (mobile buggé) au profit de `transform` GPU desktop + image
  fixe mobile.

---

## 6. Verdicts d'architecture
| Question | Verdict |
| --- | --- |
| Héritage BaseHero | **Validée** : `HeroParallaxContent extends HeroBaseShared` (D-1) |
| Effet & perf | **Validée** : translate3D GPU (rAF + will-change) ≥1024px ; image fixe `<picture>` <1024px ; `disableOnMobile` verrouillé ; reduced-motion (D-2) |
| Interface 3 rubriques | **Validée** : image & fallback, textes hérités, intensité (D-3) |
| Zod / types | **Validée** : extension TS + schéma `parallax` (D-4) |
| Responsive / GPU 60 FPS | **Validée** : parallaxe desktop uniquement, aucune animation mobile |
