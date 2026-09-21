# Plan — Module Pop-up (paramétrable, global + par page)

## Objectif
Permettre au photographe de créer des **pop-ups** (message, code promo, capture
d'e-mail) déclenchées par minuterie / exit-intent / profondeur de défilement /
clic manuel, avec contrôle de fréquence, ciblage, formats (modale centrée,
slide-in, plein écran), animations et accessibilité. Les pop-ups héritent du
**design system** (jetons de thème, polices) et de la **palette du site**
(`.theme-<id>`). Administration dédiée : `/admin/popups`.

## Décisions tranchées
1. **Entité dédiée `site_popups`, PAS une famille `PageModuleType`** (Option 1
   validée). Raisons vérifiées :
   - `publicDescription` / `publicOgImage` / `collectImageUrls`
     (`src/lib/public-page.ts:124-315`) itèrent `page.modules` : une pop-up dans
     `page.modules` fuiterait dans la **meta description**, l'**image OG** et la
     résolution **EXIF** ; il faudrait l'exclure dans 3+ fonctions, sans oublis
     garantis.
   - Elle entrerait dans l'ordre DnD, le calcul du `h1` unique
     (`PublicModulesList`, `src/components/modules/PublicModules.tsx:339-353`)
     et l'`anchorId` — sans jamais être dans le flux vertical.
   - Une pop-up **globale** ne peut pas vivre dans `pages` (FK `page_id`) sans
     duplication. Une famille `PageModuleType` exige en plus une migration
     `ALTER TYPE module_type ADD VALUE` (`src/db/schema.ts:54-77`).
   - Le patron exact existe déjà : `site_top_banner` (`src/db/schema.ts:359`,
     `drizzle/0012_quiet_peter_parker.sql`, `top-banner.repository.ts`,
     `src/app/api/top-banner/route.ts`, `src/lib/top-banner-store.ts`,
     `src/components/backoffice/top-banner/*`).
   Le **contenu** réutilise les briques de section (chapeau, texte, CTA, média,
   style). L'entrée « + Ajouter une section › Interaction & Conversion ›
   Pop-up » pourra être ajoutée **en façade** plus tard (elle créerait une
   pop-up liée à la page, jamais un `PageModule`) — hors périmètre de ce plan.
2. **Au plus une pop-up affichée par chargement de page.** Priorité : pop-up de
   page (`pages.popup_id`) > pop-up globale ciblée, dans l'ordre de la liste.
   Pas d'empilement.
3. **Pas de portail Radix.** La pop-up est rendue **dans** le wrapper de thème
   `display: contents` du layout front-office, sinon elle perdrait les jetons
   `.theme-<id>` (un portail Radix va sur `document.body`). On utilise les
   primitives `@radix-ui/react-dialog` **sans** `DialogPrimitive.Portal`.
4. **Design system hérité par défaut** : aucune pipette de couleur dans ce lot.
   La pop-up consomme `bg-card`, `text-card-foreground`, `border-border`,
   `bg-primary`, les polices du thème.
5. **Rendu SSR + client** : la résolution de cible se fait côté serveur (props),
   les déclencheurs et la fréquence sont **client-only** (montage après
   `useEffect`, jamais de lecture `localStorage` au rendu serveur).
6. **Fréquence en `localStorage`**, clés préfixées par photographe + pop-up.
   L'aperçu admin ignore la fréquence.

## Faits vérifiés (ancrages)
- `src/lib/pages.ts:41-51` `SitePage` ; `:27-33` `PageMetadataDraft` ;
  `:128-176` `seedPages` (5 entrées) ; `:188-211` `PageModuleType` (ne pas
  toucher) ; `:222-237` `moduleAnimationOrder/Labels` (réutilisés) ;
  `:244-247` `MediaField` ; `HeroCtaStyle` `:279`.
- `src/db/schema.ts:54-77` enum `module_type` ; `:110-148` table `pages` ;
  `:359-370` `site_top_banner` (modèle à copier).
- `src/db/repositories/pages.repository.ts:42-53` `toSitePage`,
  `:115-164` `createPage`/`updatePage`, `:244-280` `updateModules`.
- `src/db/load-initial-data.ts:57-73` `SiteInitialData`, `:93-139`
  `loadInitialData` (à étendre : `popups?`).
- `src/components/backoffice/PagesStoreProvider.tsx` — patron de sync
  résilient (debounce 200 ms + reprise, diff create/update/delete) à calquer.
- `src/lib/schemas/persistence.ts` `VisualIdentitySchema` ~L611,
  `TopBannerSchema` ~L672, `pageMetadataSchema` (à localiser par grep).
- `src/lib/persistence-client.ts:154-163` `persistVisualIdentity`/
  `persistTopBanner` (modèle).
- `src/app/api/top-banner/route.ts` (GET list/PUT) — modèle de route.
- `src/app/(front-office)/layout.tsx` — wrapper `cn(themeClasses,"contents")`
  autour de `TopBannerChrome` + `Footer` (poser le host ici).
- `src/lib/site-theme.ts` `siteThemeWrapperClasses` (aperçu admin).
- `src/components/ui/dialog.tsx:41-65` — `DialogContent` **porte** vers
  `document.body` : ne pas l'utiliser pour la pop-up publique.
- `@radix-ui/react-dialog`, `react-remove-scroll` déjà en dépendances.
- `src/lib/link-targets.ts` (mode dérivé du `href`) ; `CTAButton.tsx` ;
  `NavLink.tsx` — pour le déclenchement manuel.
- `src/components/backoffice/pages/modules/` : `EditorZone`, `form-fields`
  (`TextField`/`SelectField`/`parseBounded`), `gallery/fields` (`SwitchField`),
  `LinkTargetSelect`, `ArtSourceField` — briques de l'éditeur admin.

## Modèle de données

### Domaine pur — `src/lib/popup.ts` (nouveau, sans `"use client"`)
```ts
export type PopUpScope = "global" | "page";
export type PopUpTargetingMode = "all" | "home" | "pages";
export type PopUpLayout = "modal" | "slide-in" | "fullscreen";
export type PopUpSlidePosition = "bottom-right" | "bottom-left";
export type PopUpFrequencyMode = "every" | "session" | "days" | "once";
export type PopUpContentKind = "message" | "promo" | "lead";

export interface PopUpTriggers {
  timer: { enabled: boolean; delaySeconds: number };      // 0..120, déf. 5
  exitIntent: { enabled: boolean };
  scrollDepth: { enabled: boolean; percent: number };     // 10..100, déf. 50
  click: { enabled: boolean };                            // manuel `popup:<id>`
}
export interface PopUpFrequency { mode: PopUpFrequencyMode; days: number; suppressAfterSubmit: boolean }
export interface PopUpTargeting { mode: PopUpTargetingMode; pageIds: string[] }
export interface PopUpCta { show: boolean; label: string; href: string; style: HeroCtaStyle }

export interface PopUp {
  id: string;              // crypto.randomUUID() côté client
  enabled: boolean;
  name: string;            // libellé admin, jamais rendu publiquement
  scope: PopUpScope;
  targeting: PopUpTargeting;      // pertinent si scope === "global"
  contentKind: PopUpContentKind;
  heading: string;
  body: string;                   // texte simple (pas de rich text dans ce lot)
  media: MediaField | null;       // illustration optionnelle
  cta: PopUpCta;                  // href géré par LinkTargetSelect
  promoCode: string;              // contentKind === "promo"
  leadCollectName: boolean;       // contentKind === "lead"
  triggers: PopUpTriggers;
  frequency: PopUpFrequency;
  mobileAutoOpen: boolean;        // déf. false (déclenchement auto désactivé sur mobile)
  layout: PopUpLayout;            // déf. "modal"
  slidePosition: PopUpSlidePosition;
  overlay: boolean;               // modal/fullscreen
  dismissOnOverlay: boolean;
  animation: ModuleAnimation;     // réutilise l'énum existante
}
```
Exporte aussi : `DEFAULT_POPUP`, `createDefaultPopUp()`, `normalizePopUp(raw)`
(tolérant, champ par champ), les ordres/libellés (`popUpLayoutOrder`,
`popUpFrequencyOrder`, `popUpContentKindOrder`, `popUpSlidePositionOrder`,
`popUpTargetingModeOrder` + labels FR), et les helpers purs :
- `popUpHref(id): string` → `popup:<id>` ; `popUpIdFromHref(href)`.
- `popUpTargetingMatches(popup, { pageId, isHome })`.
- `resolveActivePopUp(popups, { pageId, isHome, pagePopUpId })` → `PopUp | null`
  (page > globale, première activée dans l'ordre de la liste).
- `popUpFrequencyStorageKey(photographerId, popupId, suffix)`.
- `hasAnyTrigger(triggers)` (sinon la pop-up ne s'ouvre jamais en auto).

### Base de données
- Table `site_popups` : `id uuid PK`, `photographer_id uuid NOT NULL FK
  profiles(id) ON DELETE CASCADE`, `data jsonb NOT NULL DEFAULT '{}'`,
  `created_at`, `updated_at`. Index `site_popups_photographer_idx`.
  RLS **owner-only** (select/insert/update/delete, copie de 0012, aucune lecture
  `anon`).
- `pages` : nouvelle colonne `popup_id uuid NULL REFERENCES site_popups(id)
  ON DELETE SET NULL` (supprimer une pop-up détache la page, ne casse rien).
- Migration : `npm run db:generate` puis **ajout manuel du bloc RLS** dans le
  SQL généré (même procédure que 0012), puis `npm run db:migrate`.

### Zod — `src/lib/schemas/persistence.ts`
- `PopUpSchema` : miroir de `PopUp` avec `.default(...)` partout (rétrocompat
  JSONB), `id: z.string().uuid()`.
- `pageMetadataSchema` : ajouter `popupId: z.string().uuid().nullable().default(null)`.

---

## Tâches ordonnées

### Lot A — Socle (MVP : pop-up globale + par page, triggers auto, formats)
1. **`src/lib/popup.ts`** (nouveau) : domaine ci-dessus.
2. **`src/lib/schemas/persistence.ts`** : `PopUpSchema` + `pageMetadataSchema.popupId`.
3. **`src/db/schema.ts`** : table `sitePopups` (+ type `PopUp`) et colonne
   `pages.popupId` (FK `set null`). Exporter `PopUpInsert`/`PopUpRow` si utile.
4. **Migration Drizzle** : générer, ajouter le RLS owner-only, appliquer.
5. **`src/db/repositories/popup.repository.ts`** (nouveau) :
   `listPopUps(photographerId): Promise<PopUp[]>` (ordre `createdAt`),
   `getPopUp(photographerId, id)`, `upsertPopUp(photographerId, popup)`
   (vérifie l'appartenance par `id` avant update, sinon insert),
   `deletePopUp(photographerId, id)` (`where id AND photographer_id`).
   Décodage tolérant : `normalizePopUp` → `PopUpSchema.safeParse`.
6. **`src/db/repositories/pages.repository.ts`** : mapper `popupId` dans
   `toSitePage`, `createPage`, `updatePage`.
7. **`src/db/load-initial-data.ts`** : `popups?: PopUp[]` dans `SiteInitialData`,
   charger `listPopUps` (branché) et `[]` dans le seed de repli.
8. **API** : `src/app/api/popups/route.ts` (`GET` liste, `PUT` upsert) et
   `src/app/api/popups/[id]/route.ts` (`DELETE`), calquées sur
   `api/top-banner` + `api/pages/[pageId]`. `PATCH /api/pages/[pageId]` accepte
   déjà `popupId` via `pageMetadataSchema` (aucune route à créer).
9. **`src/lib/persistence-client.ts`** : `persistPopUp(popup)`,
   `persistDeletePopUp(id)` ; inclure `popupId` dans le draft de
   `persistUpdatePage`.
10. **`src/lib/pages.ts`** : `SitePage.popupId: string | null` et
    `PageMetadataDraft.popupId: string | null` ; renseigner `popupId: null` sur
    les 5 `seedPages`.
11. **Store admin** : `src/components/backoffice/popups/PopUpProvider.tsx`
    (contexte + `usePopUps()`), **calqué sur `PagesStoreProvider`** : hydratation
    depuis `initial.popups`, diff create/update/delete, debounce + reprise.
    Monter le provider dans `src/app/(back-office)/admin/layout.tsx` (chaîne des
    providers, près de `TopBannerProvider`).
12. **Écrans admin** :
    - `src/app/(back-office)/admin/popups/page.tsx` → `PopUpsManager`
      (`src/components/backoffice/popups/PopUpsManager.tsx`) : liste, créer
      (`createDefaultPopUp()` puis navigation vers l'éditeur), activer/masquer,
      supprimer (confirmation), badges portée/format, lien vers l'éditeur.
    - `src/app/(back-office)/admin/popups/[id]/page.tsx` → `PopUpEditor`
      (`src/components/backoffice/popups/PopUpEditor.tsx`) : rubriques via
      `EditorZone`/`EditorSubZone` — Contenu (`contentKind`, `heading`, `body`,
      média via `ArtSourceField`, CTA via `LinkTargetSelect`), Déclencheurs
      (timer / exit-intent / scroll / clic), Fréquence & ergonomie
      (`frequency`, `suppressAfterSubmit`, `mobileAutoOpen`), Disposition &
      animation (`layout`, `slidePosition`, `overlay`, `dismissOnOverlay`,
      `animation`), Ciblage (`scope`, `targeting` ; liste de pages via
      `usePagesStore()`), Aperçu.
    - `PopUpPreview` : réutilise le composant public `PopUpDialog` en mode
      `preview` (position neutralisée, comme `top-banner--preview`), enveloppé
      d'un `div` portant `siteThemeWrapperClasses(visualIdentity.theme)` pour
      refléter la palette réellement choisie.
13. **`src/components/backoffice/SidebarNav.tsx`** : nouvelle section
    `Interaction & Conversion` avec l'entrée `Pop-ups` (`/admin/popups`, icône
    `AppWindow`). Ne pas toucher aux URLs existantes.
14. **`PageMetadataForm`** : contrôle « Pop-up de cette page » (Select :
    « Aucune » + pop-ups `scope === "page"`), câblé à `PageMetadataDraft.popupId`.
15. **Rendu public** :
    - `src/components/popups/PublicPopUpHost.tsx` (`"use client"`) : props
      `popups: PopUp[]`, `pages: Array<{ id; slug; popupId; isHome }>`,
      `photographerId`. Résout la cible via `usePathname()` +
      `resolveActivePopUp`, exécute les déclencheurs, applique la fréquence,
      rend `null` tant que non monté (pas de mismatch d'hydratation).
    - `src/components/popups/PopUpDialog.tsx` : primitives
      `@radix-ui/react-dialog` **sans `Portal`**, `modal={layout !== "slide-in"}`.
      Overlay assombri/flouté (modal, fullscreen) + `dismissOnOverlay` ; slide-in
      sans overlay, positionné en bas à droite/gauche. `z-[70]` (au-dessus du
      Header fixe). Esc fourni par Radix. `aria-labelledby` sur le titre, sinon
      `aria-label`. Animations via `animation` (classes `data-[state]`).
    - `src/components/popups/PopUpContent.tsx` : message / promo / lead ; CTA
      via `CTAButton` (ou bouton équivalent). Repli si `heading` et `body` vides.
    - Déclencheurs : `usePopUpTriggers` (timer `setTimeout` ; scroll
      `scroll` + rAF ; exit-intent `mouseout` sur `document` avec `clientY <= 0`
      et `relatedTarget === null`, **jamais attaché au tactile** ;
      `mobileAutoOpen === false` désactive timer/scroll/exit-intent sur mobile,
      le clic manuel reste actif).
    - Fréquence : écriture/lecture `localStorage` en `try/catch` ; à la
      fermeture, marquer `seen` pour `session`/`days`/`once`.
    - **Montage** : dans `src/app/(front-office)/layout.tsx`, à l'intérieur du
      `<div className={cn(themeClasses, "contents")}>` (après `<Footer />`),
      avec `initial.popups ?? []` et `initial.pages?.pages ?? []`. La branche
      « site vide / onboarding » reste sans pop-up.
16. **`src/app/globals.css`** : uniquement des **ajouts** pour les animations
    de pop-up (fade-in, scale-in, slide-up/right) si `tw-animate-css` ne suffit
    pas ; ne rien modifier dans `:root`/`.dark`/`.admin`.
17. **Docs** : `PROJECT_CONTEXT.md` (nouveau bullet « Pop-ups » : entité dédiée,
    page `/admin/popups`, portée globale/page) ; `CHANGELOG.md` (entrée du lot).

### Lot B — Déclenchement manuel au clic (`popup:<id>`)
18. **`src/lib/link-targets.ts`** : mode `popup` (`isPopUpHref`,
    `popUpIdFromHref`), `collectPopUpTargets(popups)`, `LinkTargetIndex.popups`,
    groupe « Pop-ups » dans `buildLinkTargetOptions`, cas dans
    `detectCtaTargetMode` et `describeLinkTarget`.
19. **`src/components/backoffice/pages/modules/useLinkTargetIndex.ts`** :
    inclure les pop-ups (`usePopUps()`), et faire passer la liste aux
    consommateurs.
20. **Rendu public** : dans `CTAButton` (et tout rendu de lien partagé
    concerné), si `popup:` → `<button type="button">` qui émet
    `window.dispatchEvent(new CustomEvent("popup:open", { detail: id }))` ;
    `PublicPopUpHost` écoute et ouvre. L'ouverture **manuelle** ignore timer/
    scroll/exit-intent et la fréquence `session`/`days`/`once`, mais respecte
    `suppressAfterSubmit`.
21. **`LinkTargetSelect`/`LinkTargetField`** : libellés et aperçu du mode
    `popup` (« Ouvre la pop-up “…” »).

### Lot C — Contenus de conversion (après A/B)
22. **Mode code promo** : bouton « Copier le code » dans `PopUpContent`
    (`navigator.clipboard.writeText` + repli), `promoCode`.
23. **Mode capture d'e-mail (newsletter)** :
    - Table `popup_submissions` (miroir de `contact_submissions` :
      `photographer_id`, `popup_id` `set null`, `email`, `name`, `accepted_cgu`
      déf. `false`, `ip_hash`, `user_agent`, `created_at`) + index.
    - API `POST /api/popup-submissions` : écriture **anonyme** via rôle service,
      Turnstile (réutiliser `TurnstileWidget`) et limitation de débit (même
      pattern que `/api/contact`).
    - `PopUpLeadForm` dans `PopUpContent` ; succès → `localStorage`
      (`suppressAfterSubmit`) et message de confirmation.
    - Notification e-mail : réutiliser le patron
      `src/lib/emails/contact-notification.ts`.
    - **Décision produit requise** : destination de la liste (table interne
      recommandée vs fournisseur externe). Tant qu'elle n'est pas tranchée,
      livrer A/B et garder le mode `lead` désactivé dans l'UI.

---

## Validation
- `npx tsc --noEmit` → 0 ; `npm run lint` → 0 ; `npm run check:contrast` → exit 0
  (mêmes 4 avertissements, aucun jeton de couleur modifié).
- Migration : `npm run db:generate` (vérifier le SQL : table + colonne + FK),
  ajouter le RLS owner-only, `npm run db:migrate`.
- `git diff src/app/globals.css` → **ajouts uniquement** (pas de modification
  de `:root`/`.dark`/`.admin`).
- Manuel navigateur (ne pas lancer `npm run build` si `next dev` occupe 3000) :
  - Créer une pop-up globale, minuterie 5 s → apparaît sur `/` après 5 s,
    disparaît au rechargement dans la même session si `frequency = session`.
  - Exit-intent (souris vers le haut) et scroll 50 % fonctionnent ; le clic
    manuel (`popup:<id>`) ouvre même si la fréquence bloque l'auto.
  - `frequency = days` (7 j) : ne réapparaît pas après rechargement ; bouton
    « réinitialiser » admin (ou vider `localStorage`) la réaffiche.
  - `mobileAutoOpen = false` : aucun déclenchement auto sur mobile ; clic manuel OK.
  - Modal / slide-in / plein écran ; Esc, clic sur l'overlay (si
    `dismissOnOverlay`), bouton X ; focus piégé en modal, libre en slide-in.
  - Thème `galerie-luxe` → la pop-up suit les couleurs sombres (preuve : pas de
    portail, les `var(--…)` sont résolues dans le wrapper de thème).
  - Pop-up de page (`pages.popup_id`) prioritaire sur une pop-up globale ciblée.
  - Nacre / aucune pop-up → `/` et `/admin` strictement identiques à l'existant.

## Risques
- **Portail vs thème** : régression si un `DialogContent` shadcn (qui porte) est
  utilisé ; le plan impose les primitives sans `Portal` rendues dans le wrapper.
- **Hydratation / FOUC** : lire `localStorage` ou calculer un déclencheur au
  rendu serveur provoquerait un mismatch ; le host rend `null` jusqu'au montage.
- **`localStorage` indisponible** (navigation privée stricte) : encapsuler en
  `try/catch`, dégrader en « afficher une fois par chargement ».
- **Exit-intent mobile** : inopérant ; c'est la raison de `mobileAutoOpen`.
- **Auteur qui ne voit jamais sa pop-up** (fréquence) : prévoir un moyen de
  réinitialiser depuis l'éditeur (bouton « réinitialiser l'affichage » qui purge
  les clés `localStorage` de la pop-up) et un aperçu qui ignore la fréquence.
- **Suppression d'une pop-up référencée** : FK `ON DELETE SET NULL` sur
  `pages.popup_id` (la page reste, sans pop-up).
- **`/demo`** est sous `(front-office)` : une pop-up globale `all` y apparaîtra.
  À exclure si non souhaité (décision ouverte).
- **Ordre de migration** : créer `site_popups` **avant** d'ajouter la FK sur
  `pages`.
- **Un seul pop-up affiché** : conséquence assumée (pas d'empilement) ; documenter
  la priorité page > globale.

## Hors périmètre
- Facade « + Ajouter une section › Interaction & Conversion › Pop-up » (lot
  ultérieur, sans `PageModuleType`).
- Couleur d'accent libre de la pop-up (héritage du design system uniquement).
- Corps en texte riche (le lot utilise du texte simple).
- Analytics d'impression/clic, A/B testing, `prefers-color-scheme`.
- i18n ; multi-pop-ups simultanées ; mise à jour temps réel du site public sans
  rechargement (rendu SSR).
- Pop-up par site pour le futur multi-tenant.

## Questions ouvertes
1. **Destination des e-mails (Lot C)** : table interne `popup_submissions`
   (recommandé) ou fournisseur externe ? Bloque uniquement le Lot C.
2. **`/demo`** doit-il afficher les pop-ups globales `all` ? (défaut proposé :
   oui, c'est un rendu du site).
3. Confirmer que l'ouverture **manuelle** ignore la fréquence (recommandé), sauf
   `suppressAfterSubmit`.
