# Module « Actualités & Expositions » — famille Page Builder `news`

> **Révisé par le plan `1790041285180-news-lightbox-modal-plan.md`** : **D5 remplacé** (le zoom sur place devient une **modale plein écran** réutilisant `LightboxModal`) et **§10 « lightbox plein écran » retiré du hors-périmètre**. Toutes les autres décisions (D2/D3/D4, D6, D7, D9, D11) restent valides.

**Objectif :** une section insérable par le photographe : un chapeau (titre `h2`, sous-titre, texte) puis une **colonne unique** de cartes empilées. Chaque carte = un cadre au fond du thème contenant **une affiche au format standard unique 2:3 (largeur 2 / hauteur 3)**, puis un titre, un texte et un bouton CTA « En savoir plus ». La photo doit être **entièrement visible dans la hauteur de la fenêtre** (hauteur dérivée par `min()`, jamais de recadrage vertical hors fenêtre). Double-clic sur la photo : **ouverture d'une visionneuse plein écran** (zoom et déplacement dans la modale).

**Référence de forme :** `plans/1789759143845-reviews-module-plan.md` (famille ajoutée après création du schéma) et `src/components/modules/cards/` (gabarit photo + pied + CTA).

---

## Décisions actées (validées par l'utilisateur)

| # | Sujet | Décision |
|---|---|---|
| **D1** | Famille | **Une seule famille** `news` (id anglais, libellé français « Actualités & expositions »). Un champ `kind: "news" \| "exhibition"` par item, rendu en pastille. Une seule migration `ALTER TYPE`. |
| **D2** | Format | **Ratio fixe 2:3** (`aspect-ratio: 2 / 3`), non réglable. C'est ce qui simplifie le module par rapport à `cards` (aucun sélecteur de variante). |
| **D3** | Hauteur | La **largeur** est bornée par `min(plafond de lecture, 100 %, fenêtre utile × 2/3)` ; la hauteur en découle par `aspect-ratio`. Par construction : `hauteur photo ≤ fenêtre utile`. |
| **D4** | Unité de fenêtre | **`svh`** (convention du projet, `globals.css` l.578 : seul `svh` ne « saute » pas), moins `--header-height` (l.86) **et** `--top-banner-offset` (`TopBannerChrome.tsx` l.126, déjà l'idiome du layout `(front-office)/layout.tsx` l.127). |
| **D5** | Zoom | **Révisé** (voir `1790041285180-news-lightbox-modal-plan.md`) : **visionneuse plein écran** réutilisant `LightboxModal` (`gallery/`), ouverte par double-clic **ou** bouton `.news-card__zoom` (chemin clavier/lecteur d'écran obligatoire). Plus de zoom sur place : `--news-zoom` et son `transform: scale()` sont supprimés. |
| **D6** | Ordre | **Manuel** : l'ordre du tableau `items` EST l'ordre d'affichage. **Aucun tri dans le résolveur.** Contrepartie obligatoire (sinon « la plus récente en haut » n'est plus tenue par le code) : insertion d'un nouvel item **en tête**, et bouton **« Trier par date décroissante »**. |
| **D7** | Réordonnancement des items | **Boutons ↑ / ↓ + Dupliquer + Supprimer**, comme `ModuleCardsEditor` (l.4, l.778-788). **Pas** de `DragDropContext` dans l'éditeur : `@hello-pangea/dnd` n'est éprouvé ici que sur des listes verticales au niveau module/page/navigation (`ModuleDndList`, `PagesManager`, `NavigationManager`) ; le DnD au niveau de la page couvre déjà le déplacement du module `news`. |
| **D8** | Hiérarchie de titres | Titre de section = `h2` (`module-h2`). **Titre d'item = `h3`**, pas `h2` : règle du projet (« un seul `h1`, un `h2` par section »), commentée dans `CardsModule.tsx` l.128-129. |
| **D9** | Cadre & fond | Fond du cadre en **jeton du thème** uniquement, sélectionné par `frameTone` et appliqué par attribut `data-tone` (précédent : `data-format` sur les cartes). **Aucune couleur libre stockée** (règle D3 du plan `reviews`). Filet, ombre et arrondi réutilisent `galleryBorderStyle` / `galleryShadowStyle`. |
| **D10** | CTA | `GalleryCtaSettings` + composant `CTAButton` existant (discrimination page / ancre / pop-up / URL absolue / `mailto:` / `tel:` déjà faite). Défaut : `label: "En savoir plus"`, `href: ""` → bouton masqué tant que la destination est vide (règle `CTAButton.tsx` l.39). |
| **D11** | Écriture | Contenu en JSONB `page_modules.content`, lu par un **résolveur tolérant** `resolveNewsContent`. `moduleSchema.content` reste `z.unknown()` : pas de schéma Zod de contenu dédié (même arbitrage que `reviews`). |

**Non retenu volontairement :** tri automatique par date (D6), glisser-déposer d'items (D7), second type `exhibitions` (D1), format réglable (D2), schéma Zod de contenu (D11). *La lightbox plein écran, d'abord écartée avec D5, a été retenue ensuite (voir le plan de révision).*

---

## 1. Domaine — `src/lib/pages.ts`

1. `PageModuleType` (l.204-227) : ajouter `| "news"` après `"reviews"`, avec le commentaire de famille habituel (nouvelle famille ⇒ enum Postgres + Zod + icône + `switch`).
2. Union `ModuleContent` (l.3171-3197) : ajouter `| NewsContent`.
3. Types (à insérer avant `interface PageModule`, près des blocs `reviews`/`marquee`) :

```ts
export type NewsKind = "news" | "exhibition";
export type NewsFrameTone = "surface" | "soft" | "accent";
export type NewsPosterFit = "cover" | "contain";

export interface NewsItem {
  id: string;               // crypto.randomUUID() côté éditeur ; repli déterministe en lecture
  kind: NewsKind;
  media: MediaField;        // affiche 2:3
  title: string;            // rendu en <h3>
  text: string;             // white-space: pre-line
  publishedAt: string;      // ISO "YYYY-MM-DD" ou "" — AFFICHAGE uniquement, jamais trié
  cta: GalleryCtaSettings;  // { show, label: "En savoir plus", href, style }
}

export interface NewsStyleSettings {
  radius: number;                    // arrondi du cadre (px)
  shadow: GalleryShadowLevel;        // galleryShadowOrder / galleryShadowLabels
  border: GalleryBorderSettings;     // galleryBorderSchema côté Zod
  frameTone: NewsFrameTone;
  posterFit: NewsPosterFit;
  ctaStyle: HeroCtaStyle;
  ctaShow: boolean;
}

export interface NewsContent {
  type: "news";
  heading: string;   // h2 de section — vide : non rendu
  subtitle: string;
  intro: string;     // pré-line
  items: NewsItem[];
  style: NewsStyleSettings;
}
```

4. Catalogues et gardes : `newsKindOrder` / `newsKindLabels` (« Actualité », « Exposition »), `newsFrameToneOrder` / `newsFrameToneLabels` (« Surface », « Surface douce », « Accent »), `newsPosterFitOrder` / `newsPosterFitLabels` (« Recadré (couverture) », « Entier (lettrage) »), et `isNewsKind` / `isNewsFrameTone` / `isNewsPosterFit`.
5. Constantes : `NEWS_POSTER_RATIO = "2 / 3"` (documentaire — le CSS porte la valeur), `NEWS_CARD_MAX_WIDTH_REM = 42` (plafond de lecture, miroir de `--news-card-max-w`).
6. Défauts : `DEFAULT_NEWS_STYLE` (`radius: 12`, `shadow: "normal"`, `border: { enabled: false, width: 1, color: "#EAE5E5" }`, `frameTone: "surface"`, `posterFit: "cover"`, `ctaStyle: "primary"`, `ctaShow: true`) et `createNewsContent()` → **instance neuve** (2 items d'exemple : un `news` + un `exhibition`, affiches picsum 900×1350, `cta: { show: true, label: "En savoir plus", href: "", style: "primary" }`).
7. `resolveNewsContent(raw: unknown): NewsContent` — mêmes idiomes que `resolveCardsContent` (l.4545) : `isRecord` sinon `createNewsContent()` ; `readString` pour tous les textes (**jamais de texte ressuscité**) ; `readBoundedNumber` pour `radius` ; gardes `is*` sinon défauts ; `resolveGalleryBorder` pour `border` ; `galleryShadowLevel` sinon défaut ; **`items` conservés dans l'ordre du tableau**, filtrés aux objets, `id` via `readString(raw.id, \`news-${index + 1}\`)` (repli déterministe — pas d'aléa côté serveur). **Aucun `sort()`.**
8. `newsImageSources(content: NewsContent): ArtSource[]` — miroir de `cardsImageSources` (l.4634) : `items.map(i => i.media).filter(m => m.url !== "")`.
9. Aides d'affichage : `newsKindLabel(kind)` (pour la pastille) et `newsDateLabel(iso)` → `Intl.DateTimeFormat("fr-FR", { dateStyle: "long" })`, retourne `""` si la date est vide ou invalide (jamais de « Invalid Date » affiché).
10. `moduleCatalog` (l.6401-6584) : entrée finale `{ id: "news", type: "news", label: "Actualités & expositions", category: "Présentation", description: "Une colonne d'actualités et d'expositions : affiche au format 2:3, titre, texte et lien « En savoir plus »." }`.
11. `createModuleContent` (l.6595) : `case "news": return createNewsContent();`.

## 2. Composants publics — `src/components/modules/news/`

### 2.a `NewsModule.tsx` — Server Component (renderer Page Builder)

- `const raw = module.content.type === "news" ? module.content : null;` sinon `null`.
- `const content = resolveNewsContent(raw);` puis **filtre des items dont `media.url === ""`** ; si la liste filtrée est vide → `return null` (pas de section vide).
- Rendu :
  ```
  <section id={module.anchorId} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
    <RevealHero animation={module.animation}>
      {chapeau : h2 .module-h2 si heading, p .news-section__subtitle si subtitle,
                 p .news-section__intro si intro}
      <div className="news-list">{items.map((item, i) => <NewsCard key={item.id} ... priority={i === 0} />)}</div>
    </RevealHero>
  </section>
  ```
- `align` n'est **pas** proposé (colonne centrée par D3) : le chapeau est centré (`max-w-3xl mx-auto text-center`), comme l'en-tête des cards par défaut.
- `priority={i === 0}` sur la première carte (LCP), comme `GalleryModule` (`priorityFirst`).

### 2.b `NewsCard.tsx` — Server Component

- Cadre : `style` = `{ ...galleryBorderStyle(style.border), ...galleryShadowStyle(style.shadow), borderRadius: style.radius }`, plus la variable `--news-poster-fit` et `--news-zoom` initiale (posée par le composant client, voir 2.c). `data-tone={style.frameTone}`, `data-kind={item.kind}`, `data-fit={style.posterFit}`.
- Pastille `kind` (texte `newsKindLabel`) — `.news-card__badge`.
- `<NewsPosterZoom>` (2.c) avec `src`, `alt` (`item.media.alt || item.title`), `sizes="min(42rem, 100vw)"`, `quality={85}`, `priority`.
- Corps **dans le cadre**, sous la photo : `h3.news-card__title` (non rendu si `title` vide), date si non vide (`.news-card__date`, `<time dateTime>`), `p.news-card__text` (non rendu si vide), puis `CTAButton cta={{ show: style.ctaShow, label: item.cta.label, href: item.cta.href, style: style.ctaStyle }} size="lg" className="news-card__cta"`.
- Le CTA hérite de `ctaShow` (réglage d'affichage de section) **sans** écraser le libellé ni le href enregistrés (même sémantique que `CardItem.tsx` l.141-143).

### 2.c `NewsPosterZoom.tsx` — **Client Component** (`"use client"`), props-only

- Props : `{ src, alt, sizes, quality, priority }`. Aucun store, aucun import back-office.
- État : `const [step, setStep] = React.useState(0)` ; `const ZOOM_STEPS = [1, 1.5, 2] as const` ; `cycle = () => setStep(s => (s + 1) % ZOOM_STEPS.length)`.
- Rendu : wrapper `.news-card__media` avec `onDoubleClick={cycle}` et `style={{ "--news-zoom": String(scale) }}` ; `MediaImage fill` en `.news-card__img` ; **bouton** `.news-card__zoom` avec `aria-pressed={step > 0}`, `onClick={cycle}`, libellé dynamique (« Zoomer » → « Zoomer ×2 » → « Réduire ») et `title` explicite.
- Précautions : `touchAction: "manipulation"` sur le wrapper (sinon double-tap iOS = zoom navigateur) et classe `select-none` (sinon le double-clic sélectionne l'`alt`/le texte voisin).
- Le transform n'est **pas** passé à `MediaImage` (il n'expose pas `style`) : il vit dans `globals.css` via `--news-zoom`, conformément à l'idiome du projet (`cardsHoverCssVars`, `gallery-effects.ts`).

## 3. CSS — `src/app/globals.css`

Insérer un bloc **§ MODULE « NEWS »** **après la ligne 1453** (fin du corps riche des cartes) et **avant** `MODULE « CONTACT »` (l.1455) — à spécificité égale, c'est l'ordre du fichier qui tranche.

```css
.news-list {
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;        /* la carte est centrée : sa largeur est dérivée */
  gap: 4rem;
}

.news-card__frame {
  /* Fenêtre utile : hors header fixe, hors bandeau haut, hors padding de section
     (py-20 = 5rem × 2) et 2rem de respiration. `svh` volontairement (cf. l.578). */
  --news-avail-h: calc(
    100svh - var(--header-height) - var(--top-banner-offset, 0px) - 12rem
  );
  /* Largeur = la plus petite de : plafond de lecture, conteneur, fenêtre × 2/3.
     `min(…, 100%)` est INDISPENSABLE : sans lui, sur mobile portrait, la hauteur
     dérivée déborderait la colonne. */
  --news-card-w: min(42rem, 100%, calc(var(--news-avail-h) * 2 / 3));
  width: var(--news-card-w);
  margin-inline: auto;
  overflow: hidden;           /* garantit l'arrondi sur la photo */
  background-color: var(--surface-color);
  /* border / box-shadow / border-radius : posés en inline par le composant
     (galleryBorderStyle / galleryShadowStyle / style.radius). */
}

/* Fond du cadre = jeton du thème, jamais une couleur stockée. */
.news-card__frame[data-tone="surface"] { background-color: var(--surface-color); }
.news-card__frame[data-tone="soft"]    { background-color: var(--surface-color-soft); }
.news-card__frame[data-tone="accent"]  {
  background-color: color-mix(in srgb, var(--accent-color) 10%, var(--surface-color));
}

/* Boîte photo : le RATIO fait que hauteur = largeur × 3/2 ≤ fenêtre utile (D3). */
.news-card__media {
  position: relative;
  overflow: hidden;           /* le zoom est recadré par la boîte, pas par le cadre */
  aspect-ratio: 2 / 3;
  background-color: var(--surface-color);
}
.news-card__img {
  width: 100%;
  height: 100%;
  object-fit: var(--news-poster-fit, cover);
  transform: scale(var(--news-zoom, 1));
  transform-origin: center;
  transition: transform 300ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .news-card__img { transition: none; }
}

.news-card__zoom { /* bouton discret, coin bas-droit de la boîte photo */ }
.news-card__body { padding: 1.25rem 1.25rem 1.5rem; text-align: center; }
.news-card__badge { /* pastille kind — capitales espacées, jeton accent */ }
.news-card__title { font-family: var(--font-heading);
  font-size: clamp(1.125rem, 0.95rem + 0.7vw, var(--h3-size)); line-height: 1.35; }
.news-card__date { /* N5 : 11px, --text-muted */ }
.news-card__text { white-space: pre-line; color: var(--text-muted); /* échelle cards-card__text */ }
.news-card__cta { margin-top: 1rem; }
.news-section__subtitle / .news-section__intro : reprendre les échelles de
  .cards-section__subtitle / .cards-section__intro (l.1382-1396) — même chapeau.
```

Deux points d'attention à vérifier en recette : (a) le `min()` sur `100%` ne référence pas de cycle (`--news-card-w` ne dépend pas de la largeur du parent, seulement du pourcentage de son bloc conteneur) ; (b) `overflow: hidden` est sur `.news-card__media`, **pas** sur `.news-card__frame`, sinon le pied (titre/texte/CTA) serait rogné.

## 4. Éditeur — `src/components/backoffice/pages/modules/ModuleNewsEditor.tsx`

`"use client"`, props `{ content: Extract<ModuleContent, { type: "news" }>; onChangeContent: (content: ModuleContent) => void }`. Normaliser via `React.useMemo(() => resolveNewsContent(content), [content])`. Accordéon d'items (état `openItemId`, un seul ouvert) et helper `commit(next)` + `patch(next)` avec `??`. Réutiliser les briques de `ModuleCardsEditor` : `EditorZone` / `EditorSubZone`, `TextField`, `TextAreaField`, `SelectField`, `SwitchField` (`./gallery/fields`), `ColorField` (`@/components/backoffice/shared/ColorField`), `LinkTargetSelect`, `parseBounded`, `EDITOR_TYPE`.

1. **Chapeau** (`EditorZone tone="content"`) — `TextField` titre (`heading`), `TextField` sous-titre (`subtitle`), `TextAreaField` texte (`intro`, `rows={3}`).
2. **Actualités & expositions** (`EditorZone tone="content"`) — liste avec, par item : `SelectField<NewsKind>` (pastille), `ArtSourceField`/`MediaFields` pour l'affiche (consigne N5 : « Format recommandé : 2:3 (portrait), ex. 900 × 1350 »), `TextField` titre, `TextAreaField` texte (`rows={3}`), `TextField type="date"` pour `publishedAt` (affichage seul — le commenter explicitement), `TextField` libellé du bouton, `LinkTargetSelect` pour la destination (défaut « En savoir plus » ; mentionner qu'une URL `https://` s'ouvre dans un nouvel onglet). Actions par item : `ArrowUp` / `ArrowDown` / `Copy` (dupliquer) / `Trash2` (supprimer, avec `Dialog` de confirmation si plusieurs items, pattern `ModuleCardsEditor`). **« Ajouter une actualité » insère en TÊTE** (D6). État vide expliqué. **Bouton « Trier par date décroissante »** (`Button variant="outline" size="sm"`) : tri stable des items par `publishedAt` desc, les items sans date restant **en fin** dans leur ordre relatif ; action ponctuelle, non automatique.
3. **Apparence** (`EditorZone tone="detail"`) — `SelectField<NewsFrameTone>` (`newsFrameToneOrder/Labels`) avec `HelpTip` « Le fond du cadre suit le thème clair/sombre » ; `SelectField<NewsPosterFit>` (`newsPosterFitOrder/Labels`) avec `HelpTip` « Recadré : remplit le cadre (une affiche non 2:3 est rognée). Entier : laisse apparaître le fond du cadre. » ; `radius` (nombre borné 0-40) ; `SelectField<GalleryShadowLevel>` (`galleryShadowOrder/Labels`) ; filet `SwitchField` + `ColorField` si activé (`GalleryBorderSettings`) ; `SelectField<HeroCtaStyle>` ; `SwitchField` « Afficher les boutons » (`ctaShow`).

## 5. Points d'intégration de famille (checklist exhaustive)

| Fichier | Modification |
|---|---|
| `src/lib/pages.ts` | `PageModuleType` += `"news"` ; `ModuleContent` += `NewsContent` ; types/catalogues/gardes/défauts/fabrique/résolveur/`newsImageSources` ; entrée `moduleCatalog` ; `case "news"` de `createModuleContent` |
| `src/db/schema.ts` | `moduleTypeEnum` (l.55-78) += `"news"` |
| `drizzle/0015_*.sql` | généré par `npm run db:generate` → `ALTER TYPE "public"."module_type" ADD VALUE 'news';` + journal/snapshot |
| `src/lib/schemas/persistence.ts` | `moduleTypeSchema` (l.31-49) += `"news"` — ⚠️ **aucune erreur à la compilation** : l'oubli ne se voit qu'à l'enregistrement (HTTP 400). Optionnel : `newsContentSchema` **documentaire** (miroir de `cardsSharedSchema`, jamais utilisé comme garde — cf. `reviews` D11). |
| `src/components/backoffice/pages/ModuleIcon.tsx` | `news: Newspaper` (vérifier l'export dans `lucide-react@1.41.0` ; repli `CalendarDays`) |
| `src/components/backoffice/pages/modules/ModuleContentEditor.tsx` | `case "news": <ModuleNewsEditor … />` |
| `src/components/modules/PublicModules.tsx` | `case "news": <NewsModule module={module} />` |
| `src/lib/public-page.ts` | `publicDescription` : branche `news` → `intro.trim() \|\| subtitle.trim() \|\| heading.trim()` ; `collectImageUrls` : boucle `newsImageSources(resolveNewsContent(mod.content))` ; `publicOgImage` : `newsImageSources(...)[0]` |
| `src/app/(front-office)/demo/page.tsx` | une instance `createModule("news", 18)` + surcharge de contenu |
| `CHANGELOG.md` | entrée (tâche, écarts, mesures, fichiers) |

## 6. `/demo`

Dans `buildDemoModules()`, après le module `reviews` (séquence 17) : `createModule("news", 18)` puis surcharge du contenu avec la fabrique :

- chapeau complet (`heading: "Actualités & expositions"`, sous-titre, intro) ;
- **4 items** : 2 `news` + 2 `exhibition`, `publishedAt` dans un ordre **volontairement NON trié** (pour prouver que l'ordre manuel est respecté tel quel) ;
- un item avec `kind: "exhibition"` et `cta.href` externe `https://…` (pour prouver l'ouverture en nouvel onglet), un autre avec `href: "/portfolio"` (cible interne) ;
- un item **sans date** (affichage du repli vide) et un item avec une affiche **non 2:3** en `posterFit: "contain"` (pour montrer le lettrage), puis la même en `cover`.

## 7. Migration

1. `npm run db:generate` → `drizzle/0015_*.sql` (attendu : `ALTER TYPE "public"."module_type" ADD VALUE 'news';`).
2. `npm run db:migrate` **avant** tout enregistrement d'un module `news` (sinon 400).

## 8. Validation

- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur / 0 avertissement**.
- Enum en base : `enum_range(NULL::module_type)` contient `news`.
- Enregistrement aller-retour d'un module `news` depuis le Back-Office (prouve `moduleTypeSchema` et la migration).
- `/demo` → **200**, sélecteurs dans la tranche `id="news-18"` :
  - `h2.module-h2` + sous-titre + intro présents ;
  - **4** `.news-card__frame` (dans l'ordre du contenu, **non trié par date**) ;
  - photo dans `.news-card__media` avec `aspect-ratio: 2 / 3` effectif et **hauteur rendue ≤ `100svh − header − top-banner`** (mesure au navigateur, à 2 hauteurs de fenêtre différentes) ;
  - `.news-card__title` en **`h3`**, `.news-card__text`, `.news-card__cta` présents dans le cadre ;
  - pastilles « Actualité » / « Exposition » ; liens externes en `target="_blank" rel="noopener noreferrer"`, liens internes rendus par `NavLink` ;
  - `<h1>` de la page = **1**, aucun `h1` dans la tranche.
- Zoom (recette navigateur, non mesurable ici) : double-clic → ×1,5 → ×2 → ×1 ; le bouton `.news-card__zoom` produit le **même** cycle au clavier, `aria-pressed` suit l'état ; `prefers-reduced-motion: reduce` supprime la transition ; double-tap mobile sans zoom navigateur.
- `npm run check:contrast` : à lancer **uniquement si** un jeton de couleur est ajouté — aucune couleur nouvelle n'est prévue (D9 réutilise les jetons existants).
- **Ne pas lancer `npm run build`** tant que `next dev` occupe le port 3000 (`.next` partagé).

## 9. Risques et pièges

- **`moduleTypeSchema` silencieux** (`persistence.ts` l.24-29) : l'oubli ne casse ni `tsc` ni le build.
- **Largeur dérivée d'une hauteur** : sur un bloc non remplacé, `width: auto` **ne dérive pas** de `height` + `aspect-ratio` (il remplit la colonne). C'est pourquoi la formule pilote la **largeur** (`min(42rem, 100%, fenêtre × 2/3)`) et laisse `aspect-ratio` déduire la hauteur. Ne pas « simplifier » en pilotant la hauteur.
- **`min(…, 100%)` + `aspect-ratio`** : le pourcentage se résout contre le bloc conteneur ; vérifier qu'aucun ancêtre n'impose une largeur intrinsèque (`width: fit-content`, `max-content`) qui fausserait la mesure.
- **`overflow: hidden` au mauvais niveau** : il doit clipper `.news-card__media` (photo), pas `.news-card__frame` (qui contient aussi le pied).
- **`100%` dans un `calc()` de variable CSS** : `--news-card-w` est utilisée dans `width`, la substitution est donc valide ; ne pas la réutiliser dans un contexte sans bloc conteneur (ex. `position: fixed`).
- **Bandeau haut actif** : sans `--top-banner-offset` dans la formule, la photo dépasserait de la hauteur du bandeau (D4).
- **Accessibilité du zoom** : double-clic non focalisable ⇒ le bouton n'est pas un « bonus », c'est le chemin accessible (WCAG 2.1). `touch-action: manipulation` + `select-none` obligatoires.
- **Qualité à ×2** : ~~`transform: scale()`~~ _obsolète depuis la révision_ : la lecture en grand passe par `LightboxModal` (`object-contain`, source servie à la largeur de fenêtre), l'agrandissement n'est donc plus un `scale()` flou de l'aperçu. L'aperçu de carte garde `sizes="min(42rem, 100vw)"` et `quality={85}`.
- **D6 non tenu par le code** : avec l'ordre manuel, « la plus récente en haut » est une convention d'édition. L'insertion en tête + le bouton de tri sont la contrepartie ; sans eux, le critère de recette est invérifiable.
- **`resolveNewsContent` ne doit jamais trier** : un tri ajouté « pour faire propre » casserait D6 et rendrait les boutons ↑/↓ mensongers.
- **Aucun `Math.random()`** côté serveur : repli d'`id` déterministe.
- **`prefers-reduced-motion`** : neutraliser la transition (et non le zoom lui-même — le zoom reste une action explicite de l'utilisateur).

## 10. Hors périmètre

- ~~Lightbox / visionneuse plein écran pour les affiches.~~ **Retiré du hors-périmètre** : livré par le plan `1790041285180-news-lightbox-modal-plan.md`.
- Tri automatique par date, épinglage, pagination, filtres par `kind`, recherche.
- Format de photo réglable (D2), grille multi-colonnes (la colonne unique est la demande).
- Dates d'événement structurées (`eventStart`/`eventEnd`) : seul `publishedAt` indicatif est stocké.
- Table BDD dédiée : le contenu vit dans `page_modules.content` (JSONB).
- Multi-langue, flux RSS, partage social par item.

## 11. Ordre d'implémentation

1. Domaine `pages.ts` (types, catalogues, gardes, défauts, `createNewsContent`, `resolveNewsContent`, `newsImageSources`, aides d'affichage, `PageModuleType`, `ModuleContent`, `moduleCatalog`, `createModuleContent`).
2. Points d'intégration : `db/schema.ts`, `lib/schemas/persistence.ts`, `ModuleIcon.tsx`.
3. `NewsPosterZoom.tsx` (client) puis `NewsCard.tsx` et `NewsModule.tsx` (serveur).
4. `globals.css` (§ MODULE « NEWS », après l.1453).
5. `PublicModules.tsx` (`case`), `public-page.ts` (description + images + OG).
6. `ModuleNewsEditor.tsx` + `case` du routeur.
7. `/demo` (instance 18, items non triés, cas `contain`/`cover`).
8. `npm run db:generate` + `npm run db:migrate`.
9. `npx tsc --noEmit`, `npm run lint`, assertions `/demo`, recette zoom/hauteur, puis `CHANGELOG.md`.

## Points laissés en recette (assumés)

- Plafond de lecture `42rem` et respiration `12rem` de `--news-avail-h` : valeurs à ajuster à l'œil sur grand écran et en 1280×720.
- Rendu de `--news-avail-h` avec un TopBanner actif (bandeau défilant de hauteur variable).
- Densité de l'espacement vertical de la colonne (`gap: 4rem`) et du pied de carte.
- Teinte exacte du `frameTone: "accent"` (proposition : 10 % d'accent sur la surface).
- `posterFit` par défaut : `cover` retenu ; basculer en `contain` si la recette montre trop d'affiches rognées.
- Emplacement et libellé du bouton de zoom (coin bas-droit proposé).
