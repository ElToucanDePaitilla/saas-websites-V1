# Module « Avis clients » — famille Page Builder `reviews`

**Objectif :** section de réassurance insérable par le photographe : logo du fournisseur d'avis, carrousel d'avis clients (navigation + autoplay) et synthèse de note globale. Contenu **saisi manuellement** dans l'éditeur, stocké dans le JSONB du module, rendu avec les jetons du thème du site.

**Décisions validées en amont :**
- **D1 — Famille Page Builder `reviews`** (pas un composant posé à la main). Le composant d'affichage reste **100 % props-only et découplé** (aucun store, aucun import back-office) : c'est le renderer serveur qui lit le contenu du module et lui passe ses props.
- **D2 — Saisie manuelle** : aucun appel API (Google/Trustpilot), aucune clé, aucun cache. Le champ `provider` ne choisit que le logo affiché.

**Décisions d'implémentation (assumées, à revoir en recette) :**

| # | Sujet | Décision |
|---|---|---|
| D3 | Thème | Jetons existants uniquement (`--surface-color`, `--surface-color-soft`, `--text-color`, `--text-muted`, `--border-color`, `--bg-color`, `--radius`). **Ajout de `--star-color` et `--star-color-empty`** (les `--primary-bg`, `--card-bg`, `--star-gold` du cahier des charges **n'existent pas** dans ce projet). Aucune couleur grise/ambre codée en dur. |
| D4 | Autoplay | Réutilise `HeroAutoplaySpeed` + `heroAutoplaySpeedOrder`/`heroAutoplaySpeedLabels` (3/5/7/10 s) ; `pauseOnHover` (défaut `true`) ; **autoplay coupé sous `prefers-reduced-motion`** ; pause au survol **et** au focus clavier. |
| D5 | Étoiles | Ids de dégradé SVG **déterministes** via `React.useId()` — jamais `Math.random()` (mismatch d'hydratation). |
| D6 | Titre | Champ `heading` optionnel rendu en `module-h2` (nomme la section, alimente le SEO). Défaut « Avis clients ». Vide → masqué. |
| D7 | Notes | `rating` borné 0..5 ; `overallScore` borné 0..5 avec **une décimale**. `parseBounded` (entier) ne convient pas au score : parser local dans l'éditeur. |
| D8 | Légende | `totalReviewsText` est affiché **une seule fois**, dans la colonne droite (le mock le dupliquait sous le carrousel). |
| D9 | Logos | SVG fournisseurs **inline** (comme le mock), texte en `currentColor` hérité de `var(--text-color)`. Ce sont des marques approximatives : pas de fetch, pas de fichier média. |
| D10 | Largeur | Section `mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8` (convention des modules publics), pas 1200 px. 3 colonnes : `md:grid-cols-[1fr_1.5fr_1fr]`, 1 colonne en mobile. |

**Non retenu volontairement :** `AvisClients.schema.ts` (Zod). Dans ce projet, `moduleSchema.content` est `z.unknown()` : le contenu d'un module est lu par un **résolveur tolérant** (`resolveReviewsContent`), jamais validé par Zod à la frontière. Un schéma Zod dans le composant serait du code mort. Nommage retenu : famille `reviews`, dossier `src/components/modules/reviews/` (les ids de familles sont anglais, les libellés restent français).

---

## 1. Domaine — `src/lib/pages.ts`

Ajouter `| "reviews"` à `PageModuleType` (bloc lignes 188-207) et `| ReviewsContent` à l'union `ModuleContent` (lignes 3151-3176).

**Interfaces** (à insérer avant `interface PageModule`) :

```ts
export type ReviewProvider =
  | "google"
  | "trustpilot"
  | "trusted_shops"
  | "avis_verifies";

export interface ReviewItem {
  id: string;          // stable (crypto.randomUUID() côté éditeur)
  author: string;
  initial: string;     // facultatif : repli sur la 1re lettre de `author`
  timeAgo: string;     // ex. « il y a 2 semaines »
  rating: number;      // 0..5
  comment: string;
  isVerified: boolean; // défaut true
}

export interface ReviewsContent {
  type: "reviews";
  /** Titre de section optionnel (`module-h2`) — vide : non rendu. */
  heading: string;
  provider: ReviewProvider;
  /** Mot d'accroche global, ex. « EXCELLENT ». */
  summaryWord: string;
  /** Note moyenne 0..5 (une décimale autorisée). */
  overallScore: number;
  /** Légende du nombre d'avis, ex. « Basé sur 10 avis ». */
  totalReviewsText: string;
  reviews: ReviewItem[];
  /** Vitesse d'autoplay — mêmes valeurs que le Héro (3/5/7/10 s). */
  autoplaySpeedMs: HeroAutoplaySpeed;
  pauseOnHover: boolean;
}
```

**Catalogues :** `reviewProviderOrder` / `reviewProviderLabels` (« Google », « Trustpilot », « Trusted Shops », « Avis Vérifiés ») ; `isReviewProvider`.

**Défauts et fabrique :** `DEFAULT_REVIEWS_CONTENT` (heading « Avis clients », `provider: "google"`, `summaryWord: "EXCELLENT"`, `overallScore: 4.5`, `totalReviewsText: "Basé sur 10 avis"`, `reviews: []`, `autoplaySpeedMs: 5000`, `pauseOnHover: true`) ; `createReviewsContent()` renvoie une **instance neuve** (`reviews: []`, aucun tableau partagé).

**Résolveur tolérant** `resolveReviewsContent(raw: unknown): ReviewsContent` (mêmes idiomes que `resolveMarqueeContent`) :
- `!isRecord(raw)` → `createReviewsContent()` ;
- `heading`, `summaryWord`, `totalReviewsText`, `timeAgo`, `comment`, `initial` via `readString` (jamais de texte ressuscité) ;
- `overallScore` via un lecteur numérique borné 0..5 **sans arrondi entier** ; `rating` idem ;
- `provider` via `isReviewProvider` sinon défaut ; `autoplaySpeedMs` via la garde de vitesse existante (ou `heroAutoplaySpeedOrder.includes`) ;
- `pauseOnHover` / `isVerified` via `typeof === "boolean"` ;
- `reviews` : tableau filtré aux objets, `id` via `readString(raw.id, `review-${index + 1}`)` (repli déterministe, jamais d'id aléatoire côté serveur).

**Catalogue et fabrique de module :**
- `moduleCatalog` : entrée `{ id: "reviews", type: "reviews", label: "Avis clients", category: "Bannières & réassurance", description: "Un logo de fournisseur d'avis, un carrousel d'avis clients et une note globale — pour rassurer avant le premier contact." }`.
- `createModuleContent` : `case "reviews": return createReviewsContent();`.

## 2. Composants publics — `src/components/modules/reviews/`

### 2.a `ReviewsModule.tsx` — Server Component (renderer Page Builder)
- `content = module.content.type === "reviews" ? module.content : null` ; sinon `null`.
- `const resolved = resolveReviewsContent(content)` ; **si `resolved.reviews.length === 0` → `return null`** (pas de section vide).
- Rend :
  ```
  <section id={module.anchorId} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
    <RevealHero animation={module.animation}>
      <ReviewsCarousel {...props dérivées de resolved} />
    </RevealHero>
  </section>
  ```
- `heading` non vide → `<h2 className="module-h2 ...">{heading}</h2>` au-dessus. Aucun `h1`.

### 2.b `ReviewsCarousel.tsx` — Client Component (props-only)
Props : `{ heading, provider, summaryWord, overallScore, totalReviewsText, reviews, autoplaySpeedMs, pauseOnHover }` (structure identique à `ReviewsContent` sans `type`). Correctifs obligatoires par rapport au mock :
- **Étoiles** : `RenderStars` avec `StarSVG` ; id de dégradé via `React.useId()` nettoyé (`useId().replace(/:/g, "")`), `stopColor` = `var(--star-color)` puis `var(--star-color-empty)`. `aria-hidden` sur le SVG ; note annoncée par un texte (ex. `aria-label={`${score.toFixed(1)} sur 5`}` sur le conteneur).
- **Carrousel responsive** : viewport `w-full max-w-[320px]`, chaque carte `w-full shrink-0`, piste `translateX(-${currentIndex * 100}%)` (pas de `320px` en dur), `transition-transform duration-500 motion-reduce:transition-none`.
- **Autoplay lint-safe** : `window.setInterval` (ref `number | null`), callback avec **setState fonctionnel** (jamais `nextSlide` capturé), garde `!paused && !reducedMotion && reviews.length > 1`, deps `[autoplaySpeedMs, reviews.length, paused, reducedMotion]`, cleanup `window.clearInterval`.
- **Mouvement réduit** : petit hook interne `usePrefersReducedMotion()` (`matchMedia`, SSR-safe : `false` au serveur, abonnement `change` au montage).
- **Pause** : `onMouseEnter/onMouseLeave` **et** `onFocus/onBlur` (capture) sur la section ; pas d'autoplay si `pauseOnHover` est faux au survol (le toggle gouverne la pause, l'autoplay reste actif sinon).
- **Navigation** : boutons `aria-label="Avis précédent"` / `"Avis suivant"`, désactivés si `reviews.length <= 1`.
- **Accessibilité** : `aria-roledescription="carousel"` + `aria-label={heading || "Avis clients"}` ; chaque carte `role="group"` + `aria-label={`${i + 1} sur ${reviews.length}`}` ; cartes hors index visibles mais `aria-hidden` pour ne pas relire (le track reste monté).
- **Badge vérifié** : puce avec `Check`, `title="Avis vérifié"` + `aria-label`.
- **Avatar** : `rev.initial || rev.author.trim().charAt(0)`.
- **Texte de l'avis** : `line-clamp-4` (utilitaire Tailwind core).
- **Logos** : record `PROVIDER_LOGOS` (SVG inline du mock, `fill="currentColor"` pour les textes), hauteur `h-[80px] w-auto`, conteneur en `text-[var(--text-color)]`.
- **Thème** : section `bg-[var(--surface-color-soft)] border border-[var(--border-color)] rounded-[var(--radius)]` ; cartes `bg-[var(--surface-color)]` ; textes `var(--text-color)` / `var(--text-muted)` ; étoiles `var(--star-color)`.

## 3. CSS — `src/app/globals.css`
- Ajouter dans `:root` : `--star-color: #e0a82e;` et `--star-color-empty: #d9d3d0;`.
- Ajouter dans le bloc de thème sombre (vers la ligne 138) : `--star-color: #e6b84d;` et `--star-color-empty: rgba(244, 240, 239, 0.22);`.
- Aucun `@keyframes` (transition CSS + Tailwind seulement).

## 4. Éditeur — `src/components/backoffice/pages/modules/ModuleReviewsEditor.tsx`
`"use client"`, props `{ content: Extract<ModuleContent, { type: "reviews" }>; onChangeContent: (content: ReviewsContent) => void }`. Normaliser via `React.useMemo(() => resolveReviewsContent(content), [content])`. Helper `patch(next)` avec `??`. Zones :

1. **En-tête et fournisseur** (`EditorZone` tone `content`) — `TextField` titre (`heading`), `SelectField<ReviewProvider>` (via `reviewProviderOrder/Labels`), `TextField` mot d'accroche (`summaryWord`), `TextField type="number"` note globale avec **parser décimal local** borné 0..5 (`Math.min(Math.max(value, 0), 5)`), `TextField` légende (`totalReviewsText`).
2. **Avis** (`EditorZone` tone `content`) — liste ajout/suppression calquée sur `ModuleFaqEditor` : par avis, `TextField` auteur, `TextField` initiale (facultatif), `TextField` ancienneté (`timeAgo`), `TextField type="number"` note (parser décimal 0..5), `TextAreaField` commentaire (`rows={3}`), `SwitchField` « Avis vérifié ». État vide expliqué ; bouton « Ajouter un avis ».
3. **Défilement** (`EditorZone` tone `detail`) — `SelectField<HeroAutoplaySpeed>` (vitesses du Héro, `heroAutoplaySpeedOrder/Labels`), `SwitchField` « Mettre en pause au survol ».

## 5. Points d'intégration de famille (checklist exhaustive)

| Fichier | Modification |
|---|---|
| `src/lib/pages.ts` | `PageModuleType` += `"reviews"` ; `ModuleContent` += `ReviewsContent` ; types/catalogues/gardes/défauts/fabrique/résolveur ; entrée `moduleCatalog` ; `case "reviews"` de `createModuleContent` |
| `src/db/schema.ts` | `moduleTypeEnum` += `"reviews"` |
| `drizzle/0013_*.sql` | généré par `npm run db:generate` → `ALTER TYPE "public"."module_type" ADD VALUE 'reviews';` + journal/snapshot |
| `src/lib/schemas/persistence.ts` | `moduleTypeSchema` += `"reviews"` (**⚠ silence à la compilation**, 400 à l'enregistrement si oubli) |
| `src/components/backoffice/pages/ModuleIcon.tsx` | `reviews: MessageSquareQuote` (vérifié présent dans lucide-react 1.41.0) |
| `src/components/backoffice/pages/modules/ModuleContentEditor.tsx` | `case "reviews"` |
| `src/components/modules/PublicModules.tsx` | `case "reviews": <ReviewsModule module={module} />` |
| `src/lib/public-page.ts` | `publicDescription` : branche `reviews` → `heading.trim() \|\| summaryWord.trim()` ; `collectImageUrls`/`publicOgImage` **inchangés** (aucune image) |
| `src/app/(front-office)/demo/page.tsx` | une instance `reviews` (séquence 17) |
| `CHANGELOG.md` | entrée (tâche, écarts, mesures, fichiers) |

## 6. `/demo`
Dans `buildDemoModules()`, après `marquee-16` : `createModule("reviews", 17)` puis surcharge du contenu avec `resolveReviewsContent`/fabrique — 3 avis (dont un `isVerified: false` pour prouver la condition), `overallScore: 4.5`, `provider: "google"`, `heading: "Ils me font confiance"`, `autoplaySpeedMs: 5000`, `pauseOnHover: true`, notes distinctes (dont une à 3.5 pour éprouver le remplissage partiel des étoiles). Ajouter au tableau retourné.

## 7. Migration
`npm run db:generate` → `drizzle/0013_*.sql` ; `npm run db:migrate`. L'enum doit être appliqué **avant** tout enregistrement d'un module `reviews` (sinon 400).

## 8. Validation
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur / 0 avertissement**.
- Enum Postgres contrôlé en base (`enum_range(NULL::module_type)` contient `reviews`).
- `/demo` → **200** ; sélecteurs par tranche `id="reviews-17"` :
  - section et en-tête `module-h2` présents ; 3 cartes d'avis dans le DOM (le track reste monté) ;
  - logo fournisseur (SVG Google) présent ; 5 étoiles dans la colonne score + étoiles par carte ;
  - `summaryWord`, `overallScore` (« 4.5 »), `totalReviewsText` présents ;
  - boutons `aria-label="Avis précédent"` / `"Avis suivant"` présents ;
  - aucun `Math.random`-id dupliqué (ids de dégradé uniques) ;
  - page `<h1>` = **1**, aucun `h1` dans la tranche.
- CSS/variables : `--star-color` résolu dans le HTML rendu (dégradés) ; contrôle visuel du contraste en thème sombre (recette).
- Comportement (recette navigateur, non mesurable ici) : autoplay, pause au survol/focus, boutons, `prefers-reduced-motion` (aucun autoplay, aucune transition), troncature `line-clamp-4`, responsive 1 colonne.
- **Ne pas lancer `npm run build`** tant que le serveur de développement occupe le port 3000 (`.next` partagé).

## 9. Risques et pièges
- **Hydratation** : ids SVG via `useId` uniquement ; `Math.random()` interdit.
- **Lint `react-hooks`** : l'effet d'autoplay doit utiliser un setState fonctionnel et des deps honnêtes, sinon `npm run lint` échoue.
- **`window.setInterval`** (pas `setInterval` global) pour éviter le type `NodeJS.Timeout`.
- **`parseBounded` est entier** : ne pas l'utiliser pour `overallScore`/`rating` (une décimale) — parser décimal local.
- **`moduleSchema.content = z.unknown()`** : le résolveur tolérant est le seul garde-fou ; ne jamais ressusciter un texte, borner notes et vitesses.
- **Enum Postgres** : la migration doit précéder l'enregistrement.
- **Marques** : logos Google/Trustpilot/Trusted Shops/Avis Vérifiés approximatifs ; texte en `currentColor` pour rester lisible dans les deux thèmes.
- **Accessibilité du carrousel** : les cartes hors index restent dans le DOM (track) — les `aria-hidden` sont nécessaires.

## 10. Hors périmètre
- Import automatique via API fournisseur, cache, clés, configuration par photographe.
- Avis par produit/prestation, pagination, likes, réponses du photographe, modération.
- Médiathèque d'avatars (initiales seulement), photos d'avis, texte riche.
- Table BDD dédiée : le contenu vit dans `page_modules.content` (JSONB).
- Schéma Zod de contenu (`AvisClients.schema.ts`) : non retenu (cf. en-tête).

## 11. Ordre d'implémentation
1. Domaine `pages.ts` (types, catalogues, défauts, fabrique, résolveur, union, `PageModuleType`, catalogue, `createModuleContent`).
2. Points d'intégration : `schema.ts`, `persistence.ts`, `ModuleIcon.tsx`.
3. `ReviewsCarousel.tsx` (client, props-only) puis `ReviewsModule.tsx` (serveur).
4. `globals.css` (`--star-color`, `--star-color-empty`, thème sombre).
5. `PublicModules.tsx` (`case`), `public-page.ts` (description).
6. Éditeur `ModuleReviewsEditor.tsx` + `case` du routeur.
7. `/demo` (instance 17).
8. `npm run db:generate` + `npm run db:migrate`.
9. `npx tsc --noEmit`, `npm run lint`, assertions `/demo`, puis `CHANGELOG.md`.

## Points laissés en recette (assumés)
- Valeur exacte de `--star-color` / `--star-color-empty` (proposition dorée chaude, compatible nacre).
- Texte par défaut du `heading` (« Avis clients ») et emplacement de la légende (colonne droite, D8).
- Seuil de troncature `line-clamp-4` et largeur de carte 320 px en mobile.
