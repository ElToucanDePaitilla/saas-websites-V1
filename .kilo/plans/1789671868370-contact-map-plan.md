# Module « Contact Map » — carte Google Maps + informations pratiques

**Objectif :** ajouter une **nouvelle famille de module** `contact-map` : chapeau (H2/H3/paragraphe), puis deux conteneurs de hauteur égale — carte Google Maps embarquée et informations pratiques (adresse, parking, horaires, zone, bouton d'itinéraire) — dont l'ordre est **permutable** (`mapPosition`), avec fond de section uni, cadres réglables et filtres CSS sur l'iframe.

**Périmètre :** domaine `src/lib/pages.ts`, nouveau `src/lib/contact-map.ts`, rendu public `src/components/modules/contact-map/*`, CSS `src/app/globals.css`, éditeur `src/components/backoffice/pages/modules/ContactMapEditor.tsx`, points d'intégration de famille (enum DB, Zod, icône, catalogue, routeur d'éditeur, routeur public), loaders `src/lib/public-page.ts` + 2 routes, `/demo`, migration Drizzle.

---

## Décisions (arbitrées)

| # | Sujet | Décision |
|---|---|---|
| D1 | Famille | **Nouvelle famille** `contact-map` → migration `ALTER TYPE module_type ADD VALUE 'contact-map'`. Pas une variante de `contact`. |
| D2 | Bloc « Coordonnées & Adresse pro » | **Adresse seule** : `useOwnerAddress` / `customAddress` + `showAddressGroup`. **Pas de téléphone ni e-mail** (absents du schéma fourni ; la §4.B est ramenée à l'adresse). |
| D3 | `useOwnerAddress` | **Résolu au rendu** depuis le profil : `getOwnerProfile(photographerId).address` chargé par les loaders **uniquement si** un module `contact-map` l'utilise, puis passé en prop (`ownerAddress`). Repli sur `customAddress` si profil vide / BDD absente. |
| D4 | Animation d'entrée | **Réutilisation de `module.animation`** (déjà édité pour toutes les familles dans « Réglages avancés ») + `RevealHero`. Pas de champ `entranceAnimation`. |
| D5 | Iframe Maps | **Embed sans clé** : `https://www.google.com/maps?q=<adresse>&z=<zoom>&t=m|k&output=embed`. Aucune variable d'environnement. `t=k` (satellite) = « best effort » à vérifier en recette. |
| D6 | Cadres | **Réutilisation** de `ContactFrameSettings` + `contactFrameColorTokenOrder/Labels` + `contactFrameCssVars` de 14.1.c (jeton **sans** `--`, arrondi **numérique** en px). On ne suit pas les formes `borderColorToken: string` / `borderRadius: string` du schéma fourni. |
| D7 | Fond de section | `bgVariant` (`default`→`--bg-color`, `surface`→`--surface-color`, `contrast`→`--text-color`, `custom`) + `customBgColor`. Bandeau **couleur unie uniquement**, aucun média, aucun effet de survol. |
| D8 | Titrage | H2 titre + H3 sous-titre + `<p>` description. Le `h1` reste décidé par `PublicModulesList` (inchangé). |

---

## 1. Domaine — `src/lib/pages.ts`

**Types** (près du bloc CONTACT, après `ContactContent`) :

```ts
export type ContactMapPosition = "container2" | "container3";
export type ContactMapType = "roadmap" | "satellite";
export type ContactMapBgVariant = "default" | "surface" | "contrast" | "custom";
export type ContactMapFilterStyle = "standard" | "grayscale" | "theme-blend";
export type ContactMapOverlayIntensity = "none" | "light" | "medium" | "strong";

export interface ContactMapStyleSettings {
  bgVariant: ContactMapBgVariant;
  customBgColor: string;
  /** Cadre partagé des deux conteneurs — réutilise le modèle du module contact. */
  frame: ContactFrameSettings;
  mapFilterStyle: ContactMapFilterStyle;
  overlayIntensity: ContactMapOverlayIntensity;
}

export interface ContactMapContent {
  type: "contact-map";
  title: string;
  subtitle: string;
  description: string;
  /** Réutilise `ContactAlign` ("left" | "center") et ses libellés. */
  headerAlignment: ContactAlign;
  mapPosition: ContactMapPosition;
  useOwnerAddress: boolean;
  customAddress: string;
  /** Borné 1..20 (domaine ET éditeur). */
  zoom: number;
  mapType: ContactMapType;
  showAddressGroup: boolean;
  showParking: boolean;
  parkingText: string;
  showHoraires: boolean;
  horairesText: string;
  showZoneIntervention: boolean;
  zoneInterventionText: string;
  showDirectionsButton: boolean;
  style: ContactMapStyleSettings;
}
```

- Ajouter `| ContactMapContent` à l'union `ModuleContent` (`pages.ts:3144`). L'interface porte déjà `type: "contact-map"` (idiome exact de `ContactContent`, dont le `type` est **dans** l'interface).
- Ajouter `"contact-map"` à `PageModuleType` (`pages.ts:188`).
- Catalogues + gardes : `contactMapPositionOrder/Labels`, `contactMapTypeOrder/Labels`, `contactMapBgVariantOrder/Labels`, `contactMapFilterStyleOrder/Labels`, `contactMapOverlayIntensityOrder/Labels`, et un `is*` par union (idiome `isContactAlign`).
- Défauts : `DEFAULT_CONTACT_MAP_STYLE` (`default`, `#faf8f8`, `{ ...DEFAULT_CONTACT_FRAME }`, `grayscale`, `light`) et `DEFAULT_CONTACT_MAP_CONTENT`.
- Fabrique `createContactMapContent() : ContactMapContent` — contenu d'exemple (titre « Nous trouver », adresse d'exemple, parking/horaires/zone renseignés, `useOwnerAddress: true`, `zoom: 15`, `mapType: "roadmap"`, `mapPosition: "container2"`). **Aucun préremplissage** : l'adresse profil est résolue au rendu (D3), la fabrique n'a donc pas de variante `prefill`.
- Résolveur tolérant `resolveContactMapContent(raw: unknown): ContactMapContent` :
  - `readString` pour les textes, `readColor` pour `customBgColor` ;
  - `readBoundedNumber(raw.zoom, 15, 1, 20)` ;
  - booléens via `typeof === "boolean"` avec repli défaut ;
  - `headerAlignment` via `isContactAlign`, `mapPosition`/`mapType`/`bgVariant`/`mapFilterStyle`/`overlayIntensity` via leurs gardes ;
  - `style.frame = resolveContactFrame(styleRaw.frame)` (réutilisé tel quel) ;
  - `isRecord` faux → `createContactMapContent()`.

## 2. Nouveau `src/lib/contact-map.ts` (fonctions pures)

```ts
/** Adresse effective : profil si demandé et renseigné, sinon adresse libre. */
export function contactMapAddress(content: ContactMapContent, ownerAddress: string): string;

/** URL d'embed sans clé (D5) — encode l'adresse, borne déjà faite côté domaine. */
export function contactMapEmbedUrl(address: string, zoom: number, mapType: ContactMapType): string;
// https://www.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&t=${mapType === "satellite" ? "k" : "m"}&output=embed

/** URL d'itinéraire — ouvre l'app Maps native / le web dans un nouvel onglet. */
export function contactMapDirectionsUrl(address: string): string;
// https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}
```

## 3. Références d'images & SEO

- `publicDescription` (`src/lib/public-page.ts:137`) : branche `contact-map` → `subtitle || title`.
- `collectImageUrls` / `publicOgImage` : **rien à ajouter** (le module ne porte aucune photo).

## 4. Résolution de l'adresse du profil (D3)

Dans `src/lib/public-page.ts` :

- `PublicPage` gagne `ownerAddress: string`.
- Helper interne, **conditionnel** (aucune lecture si le module n'est pas utilisé) :
  ```ts
  async function resolveOwnerAddress(
    modules: PageModule[],
    photographerId: string
  ): Promise<string> {
    const needed = modules.some(
      (m) => m.content.type === "contact-map" && m.content.useOwnerAddress
    );
    if (!needed) return "";
    try {
      return (await getOwnerProfile(photographerId))?.address.trim() ?? "";
    } catch {
      return "";
    }
  }
  ```
  Import `getOwnerProfile` depuis `src/db/repositories/owner-profile.repository.ts` (déjà utilisé sans authentification par la route contact).
- `getPublicPage` et `getHomepageState` renseignent `ownerAddress` (chemin BDD ; le chemin seed retourne `""` — aucun seed ne contient ce module).
- Les **deux routes** (`src/app/(front-office)/page.tsx:75`, `src/app/(front-office)/[slug]/page.tsx:63`) passent `ownerAddress={page.ownerAddress}` à `PublicModulesList`.

## 5. Rendus publics

**`PublicModules.tsx`** :
- `PageModuleRenderer` : prop optionnelle `ownerAddress?: string` ; `case "contact-map":` → `<ContactMapModule module={module} ownerAddress={ownerAddress} />`.
- `PublicModulesList` : prop optionnelle `ownerAddress?: string`, transmise (même tuyau que `pageSlug`).
- `/demo` (`src/app/(front-office)/demo/page.tsx:424`) : passer un littéral d'exemple, ex. `ownerAddress="8 avenue de l'Opéra, 75001 Paris"`.

**Nouveau `src/components/modules/contact-map/ContactMapModule.tsx`** (Server Component) :
- résout `resolveContactMapContent` ; `const address = contactMapAddress(content, ownerAddress ?? "")`.
- `visibleInfo` = au moins un de : adresse (`showAddressGroup` et adresse non vide), parking, horaires, zone, bouton itinéraire (adresse non vide).
- structure :
  ```
  <section id={module.anchorId} className="contact-map contact-map--bg-<variant>" style={...}>
    <RevealHero animation={module.animation}>
      <div class="contact-map__header ...alignement...">
        <h2 class="module-h2">…</h2> <h3 class="module-h3">…</h3> <p>…</p>
      </div>
      {visibleInfo ? (
        <div class="contact-map__grid">
          {mapPosition === "container2" ? [<MapFrame/>, <InfoFrame/>] : [<InfoFrame/>, <MapFrame/>]}
        </div>
      ) : null}
    </RevealHero>
  </section>
  ```
- **MapFrame** : `.contact-map__frame.contact-map__frame--map` ; si `address` non vide → `<iframe class="contact-map__iframe contact-map__iframe--<filter>" src={contactMapEmbedUrl(...)} title="Plan d'accès" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />` + `<div class="contact-map__overlay" aria-hidden="true" />` ; sinon placeholder `.contact-map__map--empty` (surface + texte « Adresse non renseignée ») — **pas d'iframe vide** (elle afficherait le monde).
- **InfoFrame** : racine `.contact-map__frame.contact-map__info` ; adresse en `<address class="contact-map__address">` (lignes `white-space: pre-line`) ; Parking / Horaires / Zone en `<dl class="contact-map__lines">` (`<dt>` intitulé, `<dd class="contact-map__preline">`) ; bouton itinéraire `<a class="contact-map__directions" href={contactMapDirectionsUrl(address)} target="_blank" rel="noopener noreferrer">Obtenir l’itinéraire</a>` — rendu **seulement si** `showDirectionsButton && address !== ""`.
- `style` du `<section>` : `{ ...contactFrameCssVars(content.style.frame), ...contactMapBgCssVars(content.style) }` avec une petite fonction locale posant `--contact-map-bg`, `--contact-map-text`, `--contact-map-overlay` (0 / 0.15 / 0.35 / 0.55).

## 6. Éditeur — `src/components/backoffice/pages/modules/ContactMapEditor.tsx`

Routeur : `ModuleContentEditor.tsx` → `case "contact-map": <ContactMapEditor content={...} onChangeContent={...} />`.

Zones (`EditorZone` + `EditorSubZone`, champs partagés `TextField` / `TextAreaField` / `SelectField` / `SwitchField` / `ColorField`) :

1. **Chapeau** (tone `content`) — titre, sous-titre (H3), paragraphe, `SelectField<ContactAlign>` alignement (réutilise `contactAlignOrder/Labels`).
2. **Disposition** (tone `content`) — `SelectField<ContactMapPosition>` : « Carte à gauche (conteneur 2) » / « Carte à droite (conteneur 3) ».
3. **Adresse & carte** (tone `detail`) — `SwitchField` « Utiliser l’adresse de mon profil » ; `TextField` adresse personnalisée **désactivé** quand le profil est utilisé ; hint affichant l'adresse du profil via `useOwnerProfile()` (`use client`) ; `SwitchField` « Afficher le bloc adresse » ; `TextField type="number"` zoom (`parseBounded 1..20`) ; `SelectField<ContactMapType>` plan/satellite.
4. **Informations pratiques** (tone `detail`) — pour chacun : `SwitchField` + champ : Parking (`TextField`), Horaires (`TextAreaField`), Zone d’intervention (`TextAreaField`) ; `SwitchField` « Bouton Obtenir l’itinéraire ».
5. **Apparence** (tone `style`) — `SelectField<ContactMapBgVariant>` fond ; `ColorField` si `custom` uniquement (idiome `ctaShow`/`colorMode`) ; épaisseur du trait (0..8), jeton de couleur (`contactFrameColorTokenOrder/Labels`), arrondi (0..24) ; `SelectField<ContactMapFilterStyle>` ; `SelectField<ContactMapOverlayIntensity>`.

- Helper `patchContactMap(next)` reproduisant l'idiome `??` de `ModuleContactEditor` (jamais de retour à un exemple) + résolution en édition via `resolveContactMapContent(content)` pour ne jamais afficher `undefined`.
- `parseBounded` : **extraire** la fonction locale de `ModuleContactEditor.tsx:70` vers `form-fields.tsx` (export partagé) et mettre à jour l'import des deux éditeurs — évite une 2ᵉ copie.
- Doc-comment d'en-tête expliquant : un seul cadre partagé (D6), couleur = jeton de thème (pas de pipette), fond uni sans média.

## 7. Points d'intégration de famille (checklist exhaustive)

| Fichier | Modification |
|---|---|
| `src/lib/pages.ts` | `PageModuleType` + `ModuleContent` + types/catalogues/fabrique/résolveur + entrée `moduleCatalog` (catégorie `Contact & cartographie`, label « Plan d'accès & informations ») + `case "contact-map"` dans `createModuleContent` |
| `src/db/schema.ts` | `moduleTypeEnum` += `"contact-map"` |
| `drizzle/0010_*.sql` | généré par `npm run db:generate` → `ALTER TYPE "public"."module_type" ADD VALUE 'contact-map';` + journal/snapshot |
| `src/lib/schemas/persistence.ts` | `moduleTypeSchema` += `"contact-map"` (**⚠ silence à la compilation**, échec 400 à l'enregistrement) |
| `src/components/backoffice/pages/ModuleIcon.tsx` | `"contact-map": MapPin` (vérifier l'export lucide disponible) |
| `src/components/backoffice/pages/modules/ModuleContentEditor.tsx` | `case "contact-map"` |
| `src/components/modules/PublicModules.tsx` | `case "contact-map"` + prop `ownerAddress` |
| `src/lib/public-page.ts` | `ownerAddress` + `publicDescription` |
| routes `page.tsx` / `[slug]/page.tsx` | passage de `ownerAddress` |

## 8. CSS — `src/app/globals.css`

Nouvelle section `MODULE « CONTACT MAP »` après la section contact (avant `Base layer`), hors `@layer` (prime sur les utilitaires, même choix que les autres modules). Blocs :

- `.contact-map` : `background-color: var(--contact-map-bg, var(--bg-color)); color: var(--contact-map-text, var(--text-color));` + padding vertical (`py-20` en utilitaire sur le composant).
- `.contact-map__grid` : `display: grid; gap: 2.5rem;` ; `@media (min-width: 1024px) { grid-template-columns: 1fr 1fr; align-items: stretch; }`.
- `.contact-map__frame` : `border: var(--contact-frame-border-width, 1px) solid var(--contact-frame-color, var(--border-color)); border-radius: var(--contact-frame-radius, 2px); padding: 1.25rem;` ; `@media (min-width: 640px) { padding: 2rem; }` — **mêmes variables** que `.contact-frame` (D6), classe propre au module.
- `.contact-map__frame--map` : `display: flex; flex-direction: column;`.
- `.contact-map__map` : `position: relative; flex: 1; min-height: 20rem; overflow: hidden; border-radius: inherit; background: var(--surface-color);`.
- `.contact-map__iframe` : `position: absolute; inset: 0; width: 100%; height: 100%; border: 0;`.
- Filtres : `--standard` (rien), `--grayscale` `filter: grayscale(100%) contrast(105%);`, `--theme-blend` idem `--grayscale`.
- `.contact-map__overlay` : `position: absolute; inset: 0; pointer-events: none; background: var(--contact-map-bg, var(--bg-color)); opacity: var(--contact-map-overlay, 0);` ; `.contact-map--blend .contact-map__overlay { mix-blend-mode: multiply; }`.
- `.contact-map__map--empty` : `display: grid; place-items: center; color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 1rem;`.
- `.contact-map__address` : `display: grid; gap: 0.15rem; white-space: pre-line; color: var(--text-muted);`.
- `.contact-map__lines` : `display: grid; gap: 1.25rem; margin: 0;` ; `dt` 700, capitales espacées, `--text-muted` ; `dd` `margin: 0.15rem 0 0`.
- `.contact-map__directions` : bouton sobre (bordure + `--surface-color`, hover `--accent-color-strong`), `align-self: flex-start`.
- `@media (prefers-reduced-motion: reduce)` : neutraliser toute transition éventuelle.

## 9. `/demo`

Dans `buildDemoModules()` (après `contactNoInfo`) :

- `contact-map-13` : fabrique par défaut (`mapPosition: "container2"`, fond `default`, filtre `grayscale`, overlay `light`).
- `contact-map-14` : permutation + variantes — `mapPosition: "container3"`, `headerAlignment: "left"`, `bgVariant: "surface"`, `mapFilterStyle: "theme-blend"`, `overlayIntensity: "medium"`, `useOwnerAddress: false`, `customAddress` explicite, `showParking: false` (prouve les toggles).
- Les deux sont ajoutés au tableau retourné.
- `DemoPage` passe `ownerAddress` (littéral) pour que `useOwnerAddress: true` du premier module ait une valeur.

## 10. Validation

- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur / 0 avertissement**.
- `npm run db:generate` produit `0010_*.sql` (`ALTER TYPE … ADD VALUE 'contact-map'`) ; `npm run db:migrate` l'applique. Contrôler que l'enregistrement d'un module `contact-map` depuis le Dashboard ne renvoie plus 400.
- `/demo` → **200**. Dans les tranches `contact-map-13` / `contact-map-14` :
  - iframe présente, `src` contient `google.com/maps`, `output=embed`, `z=15` ;
  - l'ordre `.contact-map__map` vs `.contact-map__info` s'**inverse** entre les deux modules (preuve de `mapPosition`) ;
  - `.contact-map__overlay` présent ; `contact-map--blend` présent sur le second ;
  - **« Horaires » / « Zone d'intervention » / « Parking »** présents ; absents du second là où le toggle est faux ;
  - page `<h1` = **1** (le héro) ; aucun `<h1>` dans les sections contact-map.
  - Comptages **par tranche** (la charge RSC de `next dev` duplique les classes en fin de document) et par sélecteur complet (pas de sous-chaîne `contact-map`).
- CSS compilé (extraire l'unique `href="…css"` du HTML puis télécharger) : `.contact-map__iframe--grayscale` porte `filter: grayscale(100%) contrast(105%)`, `.contact-map__overlay` porte `pointer-events: none`, `.contact-map__frame` porte les replis `--contact-frame-*`.
- Éditeur (grep/relecture) : `case "contact-map"` présent dans `ModuleContentEditor`, les 5 zones et le sélecteur `mapPosition` présents.
- **Ne pas lancer `npm run build`** tant que le serveur de développement occupe le port 3000 (`.next` partagé).
- Recette visuelle navigateur (non mesurable ici) : hauteurs des deux cadres égales en `lg`, pile sur mobile, satellite si `t=k` honoré, overlay et filtres, bascule carte/infos.

## 11. Risques et points de vigilance

- **`t=k` (satellite) non documenté** en embed sans clé : à valider en recette ; si ignoré, seule la carte « plan » reste fiable (l'option Embed API + clé a été écartée, D5).
- **Oubli du `moduleTypeSchema` Zod** = seul point qui ne casse pas la compilation (commentaire existant, `persistence.ts:22`).
- **Enum Postgres** : `ALTER TYPE … ADD VALUE` doit être appliqué **avant** tout enregistrement d'un module `contact-map`, sinon l'UI échoue à la sauvegarde.
- **Lecture profil au rendu** : conditionnelle, avec repli à chaque étage (pas de profil → `customAddress` ; BDD absente → `""`). Ne jamais faire échouer le rendu de page pour un profil manquant.
- **Adresse vide** : pas d'iframe (placeholder) et pas de bouton itinéraire — un réglage sans objet est un piège.
- **Titrage** : le module émet `h2` + `h3`, jamais `h1` ; l'invariant « un seul `h1` » de `PublicModulesList` est inchangé.
- **Comptages HTML** : la charge RSC de `next dev` duplique les classes — mesurer par tranche, sélecteurs complets.
- **Accessibilité** : `title` sur l'iframe, `aria-hidden` sur l'overlay, `rel="noopener noreferrer"` sur l'itinéraire.

## 12. Hors périmètre

- Téléphone et e-mail dans le bloc « Coordonnées & Adresse pro » (D2).
- Bouton CTA global de bandeau ; fonds photo/vidéo/diaporama ; effet de survol/parallax sur le fond (D7).
- Champ `entranceAnimation` (D4 : le scalaire `module.animation` est la source unique).
- Formule de carte avec clé API Google (D5).
- Modification du module `contact` existant, de son formulaire, de sa base ou de ses RLS.
