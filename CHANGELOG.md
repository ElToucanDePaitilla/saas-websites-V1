<!--
==============================================================================
NOTICE D'UTILISATION DU FICHIER CHANGELOG.MD
------------------------------------------------------------------------------
À quoi sert ce fichier ?
1. Historique automatique des modifications apportées par l'agent IA.
  2. Permet à Cline d'avoir une vision chronologique exacte des étapes passées
     lors de l'ouverture d'une nouvelle tâche ("New Task").
==============================================================================
-->

---

## 2026-09-17 – 16:35 (heure locale America/Bogota)

### Tâche exécutée
**Étape 14.2 — nouveau module « Contact Map » : carte Google Maps embarquée + informations pratiques, disposition permutable.**
- **Nouvelle famille `contact-map` (D1)** : `PageModuleType`, `moduleTypeEnum` (Postgres), `moduleTypeSchema` (Zod), `moduleCatalog` (catégorie « Contact & cartographie », label « Plan d'accès & informations »), `ModuleIcon` (`MapPin`) et les deux `switch` sans `default` (`ModuleContentEditor`, `PageModuleRenderer`) sont étendus. Migration `drizzle/0010_simple_chat.sql` : `ALTER TYPE "public"."module_type" ADD VALUE 'contact-map';`.
- **Domaine** : `ContactMapContent` (interface portant son `type`, idiome `ContactContent`), `ContactMapStyleSettings`, cinq unions à catalogue (`mapPosition`, `mapType`, `bgVariant`, `mapFilterStyle`, `overlayIntensity`) avec ordre, libellés et garde ; `DEFAULT_CONTACT_MAP_STYLE`, `DEFAULT_CONTACT_MAP_CONTENT` (forme sans texte) et `createContactMapContent()` (exemple). Résolveur tolérant `resolveContactMapContent` : `readString`/`readColor`/`readBoundedNumber(zoom, 15, 1, 20)`, gardes d'union, `style.frame = resolveContactFrame` (réutilisé de 14.1.c). **Aucun texte de démonstration ressuscité.**
- **Logique pure** `src/lib/contact-map.ts` : `contactMapAddress` (profil si demandé **et** renseigné, sinon adresse libre), `contactMapEmbedUrl` (`output=embed`, `t=m|k`, D5), `contactMapDirectionsUrl` (`dir/?api=1`).
- **Adresse du profil résolue au rendu (D3)** : `PublicPage.ownerAddress` + helper `resolveOwnerAddress` dans `public-page.ts`, qui **ne lit la BDD que si** un module `contact-map` porte `useOwnerAddress` (repli `""` sur toute erreur). Tuyau `ownerAddress` jusqu'au rendu par les deux routes, la liste et le routeur (même modèle que `pageSlug`). Seed → `""` (aucun seed ne contient ce module).
- **Rendu public** `src/components/modules/contact-map/ContactMapModule.tsx` (Server Component) : chapeau H2/H3/`<p>`, puis deux cadres de hauteur égale dont l'ordre suit `mapPosition` — **aucun `h1`**. Adresse vide → placeholder « Adresse non renseignée » (jamais d'iframe vide, qui afficherait le monde) et bouton d'itinéraire absent. Iframe `title`, overlay `aria-hidden`, `rel="noopener noreferrer"`. `RevealHero` pour l'animation d'entrée (`module.animation`, D4).
- **Cadres (D6)** : `contactFrameCssVars` + `.contact-map__frame` réutilisent les variables `--contact-frame-*` — mêmes replis, un seul réglage pour les deux conteneurs. **Fond de section uni (D7)** : `--contact-map-bg/text/overlay` posées par le composant (`default`/`surface`/`contrast`/`custom`, voile 0/0,15/0,35/0,55) ; `theme-blend` ajoute `contact-map--blend` (overlay en `multiply`).
- **Éditeur** : `ContactMapEditor.tsx` (5 `EditorZone` : chapeau, disposition, adresse & carte, informations pratiques, apparence), helper `patch` en `??`, champs désactivés sous interrupteur, hint montrant l'adresse du profil via `useOwnerProfile()`, `ColorField` seulement en fond `custom`. `parseBounded` **extrait** de `ModuleContactEditor` vers `form-fields.tsx` (export partagé) — plus de seconde copie.
- **`/demo`** : `contact-map-13` (fabrique par défaut, adresse profil simulée) et `contact-map-14` (permutation `container3`, alignement gauche, `useOwnerAddress: false`, parking masqué, fond `surface`, `theme-blend`, voile `medium`) ; `DemoPage` passe `ownerAddress`.
- **CSS** : nouvelle section `MODULE « CONTACT MAP »` hors `@layer`, avant `Base layer`.

### Écarts assumés (et pourquoi)
- **Un conteneur interne `mx-auto max-w-7xl`** borne le contenu alors que le fond de section reste **pleine largeur** (D7). La structure du plan ne le montrait pas : sans lui, la grille carte/infos s'étalait sur toute la fenêtre. Le fond, lui, ne pouvait pas être borné sans cesser d'être un bandeau.
- **Le fichier s'appelle `ContactMapEditor.tsx` et le composant `ContactMapEditor`** (nom du plan) : dérogation assumée à la convention `Module*Editor` des autres familles. Le routeur l'importe sous ce nom.
- **`grayscale(100%)` devient `grayscale()` dans le CSS compilé** (normalisation Lightning CSS) : valeur **équivalente**, l'assertion de recette porte donc sur la règle et non sur la forme littérale.
- **Le satellite (`t=k`) reste « best effort »** : non documenté en embed sans clé (D5). Si Google l'ignore, seul le plan routier est garanti — le champ est conservé et signalé à l'éditeur.
- **La bascule `useOwnerAddress` désactive le champ libre seulement si le profil porte une adresse** : sans adresse de profil, le champ doit rester éditable, puisque c'est lui qui sert de repli.
- **`theme-blend` sans voile reste un simple N&B** : le fondu au fond passe par l'overlay en `multiply` ; c'est documenté dans l'aide du filtre.
- **La variante « contraste » réexprime `--text-muted` localement** (`color-mix` sur le texte inversé). Le plan ne le prévoyait pas, mais le jeton global restait sombre sur fond d'encre : adresse, intitulés et phrase d'intro auraient été illisibles en mode clair. L'override est **scopé** à `.contact-map--bg-contrast`, le jeton du site est intact.
- **Comptages HTML par tranche** : la charge RSC de `next dev` duplique les classes en fin de document ; les assertions ont porté sur les tranches `contact-map-13` / `contact-map-14` et sur des sélecteurs complets.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `npm run db:generate` → `drizzle/0010_simple_chat.sql` (`ALTER TYPE "public"."module_type" ADD VALUE 'contact-map';`) ; `npm run db:migrate` → **appliquée**. Enum contrôlé **en base** (`enum_range(NULL::module_type)` contient `contact-map`, script `tsx` temporaire supprimé après usage).
- `/demo` → **200**. Tranche `contact-map-13` : `<iframe` = 1, `src` = `google.com/maps?q=…&z=15&t=m&output=embed` (adresse du profil), `.contact-map__map` **avant** `.contact-map__info`, overlay = 1, `contact-map--blend` = 0, Parking/Horaires/Zone d'intervention = 1, itinéraire = 1. Tranche `contact-map-14` : ordre **inversé** (info avant map), `contact-map--blend` = 1, filtre `theme-blend` = 1, **Parking = 0** (toggle faux) mais Horaires/Zone = 1. Page `<h1` = **1** ; aucun `<h1>` dans l'une ou l'autre tranche.
- **CSS compilé contrôlé** (chunk extrait du HTML puis téléchargé, 143 053 caractères) : `.contact-map__iframe--grayscale, .contact-map__iframe--theme-blend { filter: grayscale() contrast(105%); }`, `.contact-map__overlay { pointer-events: none; … }`, `.contact-map__frame` porte les replis `--contact-frame-border-width, 1px` et `--contact-frame-radius, 2px`, `.contact-map__map--empty` et `mix-blend-mode: multiply` présents.
- **Éditeur (relecture)** : `case "contact-map"` présent dans `ModuleContentEditor` ; les 5 `EditorZone` et le `SelectField<ContactMapPosition>` sont présents dans `ContactMapEditor.tsx`.
- **`npm run build` non lancé** : le serveur de développement occupe le port 3000 et `.next` est partagé.
- **Recette visuelle navigateur** (non mesurable ici) : cadres de hauteur égale en `lg`, pile sur mobile, satellite si `t=k` honoré, voile et filtres, permutation carte/infos, mode clair/sombre.

### Fichiers modifiés
- `src/lib/pages.ts` (types, catalogues, gardes, défauts, fabrique, résolveur, `PageModuleType`, `ModuleContent`, `moduleCatalog`, `createModuleContent`), `src/lib/contact-map.ts` (créé), `src/db/schema.ts`, `drizzle/0010_simple_chat.sql` + `drizzle/meta/_journal.json` + snapshot (générés), `src/lib/schemas/persistence.ts`, `src/components/backoffice/pages/ModuleIcon.tsx`, `src/components/modules/contact-map/ContactMapModule.tsx` (créé), `src/components/modules/PublicModules.tsx`, `src/lib/public-page.ts`, `src/app/(front-office)/page.tsx`, `src/app/(front-office)/[slug]/page.tsx`, `src/components/backoffice/pages/modules/ContactMapEditor.tsx` (créé), `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/modules/ModuleContactEditor.tsx` (import de `parseBounded`), `src/components/backoffice/pages/modules/form-fields.tsx` (`parseBounded` partagé), `src/app/(front-office)/demo/page.tsx`, `src/app/globals.css`, `CHANGELOG.md`.

### Prochaine étape prévue
Recette visuelle navigateur (égales hauteurs, permutation, filtres et voile, satellite), puis contrôle de l'enregistrement réel d'un module `contact-map` depuis le Dashboard (couverture Zod + enum) et du préremplissage d'adresse depuis le profil.

---

## 2026-09-17 – 15:00 (heure locale America/Bogota)

### Tâche exécutée
**Étape 14.1.d — Contact, ajustements du rendu public : réseaux intégrés au container 2, séparateurs retirés, formulaire aligné sur la hauteur de C2.**
- **Séparateurs retirés** : les deux `border-top` posés en 14.1.c (`.contact-info__address:not(:first-child)`, `.contact-info__lines:not(:first-child)`) sont supprimés. L'air entre Identité / Adresse / Coordonnées reste assuré par le seul `gap-12` (3 rem) de la grille, aucune ligne ne coupe plus le bloc.
- **Réseaux sociaux déplacés dans le container 2** : la barre d'icônes est désormais la **dernière ligne** de C2, sous Téléphone / Mobile / E-mail, rendue par `ContactInfoBlock` (nouvelles props `social` / `socialStyle`). Le container 4 autonome est supprimé — `ContactModule` ne rend plus de `<SocialLinks>` hors de la grille.
- **Aucune marge haute sur la barre** : le `mt-10` de `SocialLinks` est retiré. L'espacement vient du `gap-12` de la grille `.contact-info`, soit **exactement la même valeur** que celle séparant Adresse et Téléphone ; un `margin-top` s'y serait cumulé (2,5 + 3 rem).
- **Alignement** : le réglage `style.social.alignment` est **conservé** (il reste éditable), et les deux instances de `/demo` passent à `alignment: "left"` — la barre vit sous des coordonnées alignées à gauche, un centrage y flotterait.
- **Visibilité** : `hasVisibleContactInfo` gagne un troisième paramètre `hasSocial`. Un bloc qui ne porterait que des icônes reste donc affiché (sinon la barre disparaîtrait silencieusement). Masquer C2 (`showContainer2`) masque aussi les réseaux, qui en font désormais partie.
- **Message élastique** : `.contact-frame--form` devient une colonne flex, `.contact-form` l'occupe entièrement (`flex: 1`), et le champ Message (`.contact-form__field--message`, `textarea` en `flex-grow`) absorbe l'espace libre. Les deux cadres étant des items de la même grille, ils s'étirent à hauteur égale : le bouton « Envoyer » repose donc sur le bas du cadre C3, au niveau de la dernière ligne affichée en C2 — sans aucun `min-height` en dur, donc sans casse si une ligne de C2 change (adresse retirée, horaires réactivés).

### Écarts assumés (et pourquoi)
- **Le container 4 disparaît, mais le composant `SocialLinks` reste.** Il n'est pas supprimé, il change de place : le garder comme composant dédié évite d'inliner icônes et styles dans `ContactInfoBlock`, et sa réutilisation est immédiate.
- **Les réseaux sont masqués avec C2** (décision validée) : c'est la conséquence logique de leur intégration au container des coordonnées. Dans `/demo`, `contact-12` (C2 masqué) n'affiche donc plus aucune icône.
- **Le réglage d'alignement des réseaux n'est pas retiré** : il reste fonctionnel et éditable ; seule la démonstration le force à gauche. Le retirer aurait été une modification de domaine et d'éditeur au-delà de la demande.
- **`ContactForm.tsx` est touché** alors que 14.1 le déclarait intouchable — une seule classe CSS ajoutée au champ Message (`contact-form__field--message`). La logique de soumission, l'état, les contrôles et la charge utile sont **inchangés** ; c'est une modification de présentation.
- **Comptages HTML par tranche** : la charge RSC de `next dev` duplique les classes en fin de document. Les tranches `contact-11` (bornée par `contact-12`) et `contact-12` (bornée par `</section>`) ont donc été utilisées, et la recherche a porté sur `<ul class="contact-social` (et non « `contact-social` », présent aussi dans `contact-social__link` / `__icon`).

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**. Tranche `contact-11` : `<h2` = **2**, `<h3` = **1**, `<ul class="contact-social` = **1** et son index est **antérieur** à `contact-frame--form` (la barre est donc bien dans C2, plus après le formulaire) ; `contact-form__field--message` = **1**. Section `contact-12` : `<ul class="contact-social` = **0** (C2 masqué). Page : `<h1` = **1**.
- **CSS compilé contrôlé** : `.contact-info__address:not(:first-child)` **absent** ; `.contact-frame--form`, `.contact-form__field--message` et les replis `contact-frame-border-width, 1px` **présents**.
- **`npm run build` non lancé** : le serveur de développement occupe le port 3000 et `.next` est partagé.
- **Recette visuelle navigateur** (non mesurable ici) : aucun trait horizontal dans le container des coordonnées, icônes à gauche sous les coordonnées, bouton « Envoyer » aligné sur le bas du cadre C2 en `lg`.

### Fichiers modifiés
- `src/app/globals.css` (suppression des séparateurs, `.contact-frame--form` en colonne flex, `.contact-form` en flex `1`, règles `.contact-form__field--message`), `src/components/modules/contact/SocialLinks.tsx` (`mt-10` retiré, doc-comment), `src/components/modules/contact/ContactInfoBlock.tsx` (props `social`/`socialStyle`, rendu de `SocialLinks`, `hasVisibleContactInfo(info, visibility, hasSocial)`), `src/components/modules/contact/ContactModule.tsx` (container 4 supprimé, `social` transmis, `hasSocial`), `src/components/modules/contact/ContactForm.tsx` (classe du champ Message), `src/app/(front-office)/demo/page.tsx` (`alignment: "left"` pour `contact-12`), `CHANGELOG.md`.

### Prochaine étape prévue
Recette visuelle navigateur (hauteur des deux cadres en `lg` et sur mobile, barre de réseaux à gauche, mode sombre), puis validation de la persistance du cadre et du préremplissage depuis l'éditeur.

---

## 2026-09-17 – 14:05 (heure locale America/Bogota)

### Tâche exécutée
**Étape 14.1.c — Contact, refonte visuelle à 4 conteneurs : cadres configurables par module, séparateurs de sous-groupes, retrait de « Informations pratiques » (code conservé).**
- **Cadres configurables par module (D1)** : `ContactFrameSettings` (`borderWidth`, `borderColorToken`, `borderRadius`) vit dans `ContactStyleSettings.frame`, donc dans le JSONB `content.style.frame` — **aucune migration**, aucun store de design system (il n'en existe pas). C'est le modèle de `CardsStyleSettings.bodyBorderWidth` / `bodyRadius` ; le résolveur `resolveContactFrame` borne `0..8` (épaisseur) et `0..24` (arrondi) avec repli sur `DEFAULT_CONTACT_FRAME`.
- **Couleur = jeton de thème uniquement (D2)** : `ContactFrameColorToken` (`border-color`, `accent-color`, `accent-color-strong`, `text-color`, `surface-color`), catalogue `contactFrameColorTokenOrder` / `contactFrameColorTokenLabels` dans l'esprit de `bannerThemeTokenLabels`. Pas de pipette, pas d'hex stocké : le cadre suit le mode clair/sombre. Le composant traduit le réglage en variables CSS (`contactFrameCssVars`), la feuille porte la règle et ses replis — même idiome que `CardItem.tsx`.
- **Un seul réglage pour C2 et C3 (D7)** : `.contact-frame` s'applique à la racine des coordonnées (`ContactInfoBlock`, `frame` passé en **prop** — le composant ne lit jamais `content`) **et** à l'enveloppe du formulaire (`contact-frame--form`, `ContactModule`). Le formulaire reste donc encadré **même quand C2 est masqué**. Défauts : 1 px, `border-color`, 2 px d'arrondi ; `0` = sans cadre (valeur légitime, distincte d'un réglage absent). Bordure seule, **aucun fond** (D8) : la surface nacrée de la page reste visible.
- **Séparateurs de sous-groupes (D4)** : `.contact-info__address:not(:first-child)` et `.contact-info__lines:not(:first-child)` reçoivent un `border-top: 1px solid var(--border-color)`. Pas de `<hr>`, pas de H3 de sous-groupe, **pas de `padding-top`** (le `gap-12` fournit l'air ; un padding cumulerait).
- **« Informations pratiques » retiré de la vue, code conservé (D6)** : drapeau de domaine `CONTACT_PRACTICAL_INFO_ENABLED: boolean = false` (typé `boolean` **explicitement** — sinon TS infère le littéral `false`, la condition paraît toujours fausse et le code conservé passerait pour mort). Le sous-bloc de l'éditeur n'est plus rendu et Horaires / Zone d'intervention ne s'affichent plus, mais `ContactInfoSettings.hours` / `.serviceArea`, `showHours` / `showServiceArea`, leurs défauts et leur résolution sont **intacts** — un seul booléen réactive les deux vues, sans perte de donnée.
- **Deux gardes de rendu** : `hasVisibleContactInfo` ne compte horaires/zone que sous le drapeau (sinon un contenu qui ne renseignait qu'eux aurait fait afficher un cadre quasi vide) ; le `<dl>` n'est rendu **que s'il reste au moins une ligne** (téléphone / mobile / e-mail), sinon un `<dl>` vide et son séparateur orphelin apparaîtraient.
- **Éditeur** : nouvelle `EditorZone tone="style"` « Cadres des conteneurs » (après « Formulaire ») — épaisseur bornée `0..8` (« 0 = sans cadre. »), jeton de couleur (« Couleur du thème : elle suit le mode clair/sombre. »), arrondi borné `0..24` (« 2 px par défaut. »), via un helper `patchFrameStyle`.

### Écarts assumés au plan (et pourquoi)
- **Deux `h2` par section contact, déjà assumé en 14.1.b.** Le chapeau et le nom du bloc Identité portent chacun un `h2.module-h2` ; la refonte ne touche pas au titrage. Invariant du site inchangé : **un seul `h1`**, décidé par `PublicModulesList`.
- **Horaires / Zone d'intervention ne sont plus éditables ni affichés dans ce module.** C'est la conséquence directe de D6 : la donnée reste en JSONB et le code est réactivable, mais un contenu existant qui ne montrait que ces deux rubriques n'affiche plus que son cadre et ses autres lignes.
- **Le défaut pose un cadre sur les pages déjà publiées.** `borderWidth: 1` est un défaut **de forme**, non une donnée : après mise à jour, tout module contact existant gagne un filet de 1 px. C'est l'effet voulu de la refonte (D3), signalé ici. Aucune donnée perdue.
- **`patchSocialStyle` propage désormais `...style`.** Avant, il écrivait `{ social }` seul ; depuis que `style` porte aussi `frame`, ce raccourci aurait effacé le cadre à chaque réglage d'icône. Le correctif est inclus plutôt que découvert en recette.
- **Comptage brut des occurrences `contact-frame` faussé par la charge RSC de Next.** Le HTML de `next dev` embarque le payload de vol, qui **duplique** les classes en fin de document (4 occurrences de `contact-frame--form` au total pour 2 attendues) : les assertions ont donc été faites **par tranche** (`contact-11`, `contact-12`), pas sur la page entière.
- **CSS non minifié en développement** : les contrôles ont porté sur les formes multi-lignes réelles du chunk servi, identiques en valeur au build.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**. Tranche `contact-11` : `<h2` = **2** (chapeau + nom), `<h3` = **1** (slogan) ; page `<h1` = **1**. `class="contact-info contact-frame` = **1** et `contact-frame--form` = **1** (les deux conteneurs encadrés), `--contact-frame-border-width:1px` = **2** (posé sur C2 **et** le formulaire).
- Tranche `contact-12` (C2 masqué) : `--contact-frame-radius:12px` = **1** et `--contact-frame-color:var(--accent-color)` = **1** — le cadre distinct est bien **porté par le module**, et il habille le formulaire seul.
- **« Horaires » = 0** et **« intervention » = 0** sur toute la page : la rubrique n'est plus rendue.
- **CSS compilé contrôlé** (chunk extrait du HTML puis téléchargé) : `.contact-frame` porte `border: var(--contact-frame-border-width, 1px) solid`, `var(--contact-frame-color, var(--border-color))` et `border-radius: var(--contact-frame-radius, 2px)` ; `.contact-info__address:not(:first-child)` et `.contact-info__lines:not(:first-child)` sont émis.
- **Éditeur (relecture)** : `CONTACT_PRACTICAL_INFO_ENABLED` vaut `false` et le JSX « Informations pratiques » reste dans la source, sous le drapeau ; aucune sous-zone n'est rendue.
- **`npm run build` non lancé** : le serveur de développement occupe le port 3000 et `.next` est partagé.
- **Recette visuelle navigateur** (non mesurable ici) : deux cartes encadrées se faisant écho, séparateurs entre Identité / Adresse / Coordonnées, réglages réactifs dans l'éditeur, cadre absent à épaisseur 0.

### Fichiers modifiés
- `src/lib/pages.ts` (`ContactFrameColorToken`, `ContactFrameSettings`, `ContactStyleSettings.frame`, `CONTACT_PRACTICAL_INFO_ENABLED`, `contactFrameColorTokenOrder` / `Labels` / `isContactFrameColorToken`, `DEFAULT_CONTACT_FRAME`, `resolveContactFrame`, branchements `createContactContent` / `resolveContactContent`), `src/components/modules/contact/contactFrame.ts` (créé), `src/components/modules/contact/ContactInfoBlock.tsx` (prop `frame`, `contact-frame`, drapeau, garde `<dl>`, `hasVisibleContactInfo`), `src/components/modules/contact/ContactModule.tsx` (enveloppe `contact-frame--form`, prop `frame`), `src/app/globals.css` (§ MODULE « CONTACT » : `.contact-frame`, séparateurs), `src/components/backoffice/pages/modules/ModuleContactEditor.tsx` (zone « Cadres des conteneurs », `patchFrameStyle`, `patchSocialStyle` corrigé, sous-zone « Informations pratiques » sous drapeau), `src/app/(front-office)/demo/page.tsx` (`frame` par module), `CHANGELOG.md`.

### Prochaine étape prévue
Recette visuelle navigateur des deux cadres et des séparateurs (clair/sombre, épaisseur 0, arrondi), puis validation de la persistance du réglage (`content.style.frame` relu par l'éditeur après rechargement).

---

## 2026-09-16 – 19:55 (heure locale America/Bogota)

### Tâche exécutée
**Étape 14.1.b — Contact, rendu public : hiérarchie d'identité, espacements doublés, intitulés en gras.**
- **Hiérarchie** : le nom quitte son `<p class="contact-info__name">` pour un vrai `<h2 class="module-h2">` (échelle de titre de section : 2,34 rem ; 2,81 rem ≥ 640 px ; poids 300) ; le slogan devient `<h3 class="contact-info__slogan">` et reprend **l'échelle que le nom occupait** (`clamp(1.25rem, 1.05rem + 0.8vw, var(--h3-size))`, interligne 1,3, police heading, `--text-muted`) — un cran sous le titre, sans adopter le gabarit `.module-h3` (1,4 rem), trop proche du corps de texte. Nom et slogan forment désormais **un seul bloc Identité** (`grid gap-1`).
- **Espacements doublés** : entre les blocs Identité / Adresse / Coordonnées, `gap-6` → `gap-12` (1,5 → 3 rem) ; entre les lignes de coordonnées, `.contact-info__lines { gap }` `0,75 → 1,5 rem`.
- **Intitulés** : `<dt>` (Téléphone, Mobile, E-mail, Horaires, Zone d'intervention) `font-weight: 600 → 700` — à 0,69 rem en capitales espacées et en couleur atténuée, le semi-gras ne tranchait pas assez sur la valeur.
- **Le `margin-top: -0.75rem` du slogan est supprimé** : ce négatif compensait l'espacement du bloc mais s'appliquait aussi quand le nom était masqué, et dépendait de l'élément précédent. Le `gap-1` du conteneur Identité le remplace, et ce conteneur **n'est rendu que si le nom ou le slogan est visible et non vide** (aucun nœud d'écart vide).
- **Périmètre respecté** : `hasVisibleContactInfo`, `hasAddress`, `telHref`, la logique de masquage, la grille C2/C3, le formulaire, les réseaux sociaux, l'éditeur back-office, la base et le schéma sont **inchangés** — réglages purement typographiques et de mise en page.

### Écarts assumés au plan (et pourquoi)
- **Deux `h2` dans la section contact.** Le chapeau (C1) porte déjà un `h2.module-h2` ; le nom étant promu à la même échelle, une section complète en contient **deux** (ordre DOM valide : h2, h2, h3). C'est la demande explicite (nom à l'échelle H2 pleine), pas un effet de bord : l'invariant du site reste « un seul `h1` », décidé par `PublicModulesList`, inchangé. L'assertion de recette « `h2` = 1 par section contact » (entrée 14.1) devient donc fausse et est annotée ci-dessous.
- **Le slogan garde `--h3-size` en borne haute du `clamp`, mais pas le poids ni l'interlettrage de `.module-h3`.** Il reste un `h3` sémantique (titre du bloc Identité) avec une typographie de slogan : c'est le seul niveau de titre disponible sous le nom sans introduire une taille inédite dans l'échelle du site.
- **Aucune assertion CSS « minifiée » dans le serveur de développement.** Le chunk servi est **non minifié** en `next dev` (règles multi-lignes) ; les contrôles ont donc porté sur les formes réelles (`gap: 1.5rem`, `font-weight: 700`, `clamp(1.25rem, 1.05rem + .8vw, var(--h3-size))`), la valeur étant identique.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**. Dans la tranche `contact-11` (C2 rempli) : `<h2` = **2** (chapeau + nom), `<h3` = **1** (slogan), `<h2 class="module-h2">` = **2**, `<h3 class="contact-info__slogan">` = **1** ; page entière `<h1` = **1** (le héros).
- **CSS compilé contrôlé** (chunk de 139 482 caractères, extrait du HTML puis téléchargé) : `.contact-info__lines` porte `gap: 1.5rem`, `.contact-info__lines dt` porte `font-weight: 700`, `.contact-info__slogan` porte `font-family: var(--font-heading)`, `font-size: clamp(1.25rem, 1.05rem + .8vw, var(--h3-size))` et `line-height: 1.3` ; `.contact-info__name` **n'est plus émis**.
- **Recette visuelle navigateur** (non mesurable ici) : nom à l'échelle du titre de section, slogan intermédiaire, blocs nettement séparés, intitulés franchement gras.

### Fichiers modifiés
- `src/components/modules/contact/ContactInfoBlock.tsx` (racine `gap-12`, bloc Identité `grid gap-1`, nom `<h2 class="module-h2">`, slogan `<h3 class="contact-info__slogan">`, doc-comment d'en-tête), `src/app/globals.css` (§ MODULE « CONTACT » : suppression de `.contact-info__name`, réécriture de `.contact-info__slogan`, `gap` des lignes, `dt` en 700), `CHANGELOG.md`.

### Prochaine étape prévue
Recette visuelle navigateur de la section contact, puis reste de la recette 14.1 (soumission réelle avec `service_role` et Resend, `npm run build` serveur arrêté).

---

## 2026-09-16 – 17:30 (heure locale America/Bogota)

### Tâche exécutée
**Correctif 14.1.a — le bouton « Ajouter un réseau » ne produisait rien.**
- **Cause racine** : `resolveContactSocial` (`src/lib/pages.ts`) écarte toute entrée dont l'URL est vide — règle **correcte pour le rendu** (un lien sans destination n'a rien à afficher), mais fatale à l'**édition**. L'éditeur dérive sa liste de `resolveContactContent(content)`, mémoïsé sur `content` : le réseau ajouté était bien écrit dans le store, puis **filtré au rendu suivant**, si bien que la liste gardait la même longueur et que le clic semblait sans effet.
- **Correctif** : le résolveur accepte une option `keepEmptySocialNetworks`, **réservée à l'éditeur**, qui conserve les entrées à URL vide. Le défaut est inchangé : le rendu public continue d'écarter un réseau sans adresse, et `publicDescription` également.
- **Vérifié par script** (`npx tsx`, script temporaire supprimé après) : sur un contenu portant 3 réseaux + 1 ajout vide → **3** en lecture par défaut, **4** avec l'option, et l'entrée vide est bien celle qui a été ajoutée.
- **Non-régression** : `npx tsc --noEmit` → 0 ; `npm run lint` → 0/0 ; `/demo` → **200**, toujours 3 liens sociaux rendus par section et un seul `h1`.

### Fichiers modifiés
- `src/lib/pages.ts` (`ResolveContactContentOptions`, `resolveContactSocial(raw, keepEmpty)`), `src/components/backoffice/pages/modules/ModuleContactEditor.tsx` (résolution avec `keepEmptySocialNetworks`).

---

## 2026-09-16 – 16:30 (heure locale America/Bogota)

### Tâche exécutée
**Étape 14.1 — Refonte du module « Contact & Localisation » : quatre containers, formulaire BDD-First + Resend, pièces jointes validées, anti-spam, tolérance totale au mode démo.**
- **Quatre containers** remplacent les trois champs à plat : chapeau (C1), coordonnées masquables ligne par ligne (C2), formulaire (C3), réseaux sociaux (C4). `content.type` reste `"contact"` : aucune migration d'énumération, le contenu vit dans le JSONB.
- **Le module historique reste lisible** : `resolveContactContent` est **total** et reprend `email → info.email`, `phone → info.landline`, `address → info.address.address1`. Aucune migration de données, aucun contenu existant invalidé.
- **Le formulaire est le premier chemin d'écriture non authentifié du projet.** Rien d'identitaire ne vient du payload : le serveur résout la page **publiée** par `pageSlug` (D13), en déduit `page_id` + `photographer_id`, puis le destinataire depuis le profil (`contact_form_email`, repli `public_email`, sinon 422 — D12). Le tenant et le destinataire ne sont donc **jamais** transmis par le visiteur.
- **Cas de la page d'accueil traité** (découverte de planification) : le slug vide n'est pas une clé fiable, la route résout explicitement `is_home = true` quand `pageSlug === ""`. Sans cela, le formulaire de la page d'accueil n'aurait jamais trouvé sa page.
- **Pièce jointe : plafond serveur `min(maxFileSizeMB, 10)`, catalogue fermé, signature binaire** (magic bytes, jamais `file.type`). Le nom de l'objet est un UUID généré. Le `path` relatif est stocké, **jamais** l'URL publique signée (elle expire). Bucket réutilisé `portfolio-media` sous `contact-attachments/{photographerId}/…` : aucun objet ne pollue la médiathèque, qui liste la table `media` et non les objets du bucket.
- **Anti-spam** : `_gotcha` rempli ⇒ 200 silencieux (aucune insertion, aucun e-mail) ; limitation de débit **comptée en base** (fenêtre de 10 min, plafond 5 par `ip_hash` salé) — fiable en serverless, contrairement à un compteur mémoire ; Turnstile en composant maison (~40 lignes, rendu explicite) pour éviter une 4ᵉ dépendance.
- **Mode démo d'abord (A5)** : le widget Turnstile n'est monté que si la clé publique existe, l'e-mail est non bloquant, et la route répond `503` quand Supabase/`DATABASE_URL` manque. `/demo` rend **200** sans aucune variable d'environnement.
- **Éditeur refondu** en quatre zones : chapeau ; coordonnées & visibilité (interrupteur **maître** puis 8 interrupteurs, les champs masqués restant **visibles mais désactivés** pour pouvoir être corrigés sans les réafficher) ; formulaire (taille, formats en cases à cocher, CGU) ; réseaux sociaux (apparence de section — forme, alignement, mode couleur — puis liste ordonnée avec ajout / duplication / suppression / montée / descente, à la manière de `ModuleCardsEditor`). Le `ColorField` n'apparaît qu'en mode `custom`.
- **Préremplissage (A1)** : `src/lib/contact-prefill.ts` mappe `OwnerProfile` → objet **pur** `ContactPrefill` avec `import type` uniquement. `pages.ts` n'importe **jamais** `owner-profile.ts` (module `"use client"`). `PagesStoreProvider.addModule` applique ce préremplissage à la création d'un contact ; un profil sans réseaux n'en reçoit aucun (pas de faux liens).
- **BDD** : table `contact_submissions` (migration `0008`), `accepted_cgu DEFAULT false` — un consentement n'est jamais présumé — et migration RLS `0009` écrite à la main : lecture et suppression propriétaire seulement, **aucune politique INSERT** (l'insertion passe par le service_role / la connexion propriétaire).
- **Documentation** : `.env.example` complété (`RESEND_FROM_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_IP_SALT`) ; `-----PourMémoSQLeditor-CreationTable.md` porte la nouvelle table et ses politiques.

### Écarts assumés au plan (et pourquoi)
- **Couleur de glyphe « thème » = `--text-color`, et non `--primary`.** `--primary` vaut `--accent-color` (`#e8d8d7`), un rose très clair : un glyphe de 18 px dans cette teinte sur surface nacrée est quasi invisible. L'accent reste porté par le survol et le filet. C'est exactement le piège signalé en découverte.
- **LinkedIn : SVG local dans la table d'icônes.** Simple Icons **13.15.1 ne publie plus la marque LinkedIn** et Lucide v1 ne porte plus aucune marque — le repli enregistré au plan (§6) n'est donc pas utilisable pour ce glyphe. Le repli est isolé dans le **seul fichier de correspondance**, là où le plan voulait qu'un renommage d'export se corrige en une ligne.
- **`/demo` ne montre que 2 formes d'icônes, pas 4.** La forme est un réglage **de section** (un seul `shape` par module) : avec les **deux instances** exigées par le plan, seules deux formes peuvent être rendues (rond / arrondi). Les **quatre règles** de forme sont en revanche présentes dans le CSS compilé et contrôlées ; c'est la démonstration de forme « une par instance » qui est impossible, pas le réglage.
- **`phone` historique → `info.landline`**, littéralement comme au plan. Le champ d'origine ne distingue pas fixe et mobile ; aucune heuristique sur le premier chiffre n'a été introduite (l'hypothèse est documentée dans le résolveur).
- **`findPublishedContactPage` renvoie la page *et* les réglages du formulaire** (nom différent de `findPublishedPageBySlug`, même responsabilité). Ces réglages (`requireCGU`, extensions, taille) sont nécessaires **avant** de valider la soumission et l'upload ; les recharger dans la route aurait dupliqué la requête.
- **`disabled` ajouté à `TextField` / `TextAreaField`** (champs partagés) : sans cela, « champs masqués mais grisés » n'était pas réalisable.
- **Resend par `fetch`, sans SDK** (comme Turnstile) : un envoi unique ne justifie pas une dépendance supplémentaire.
- **Le lot 1 n'a pas pu rester seul à `tsc` 0.** Remplacer la branche `contact` de `ModuleContent` casse mécaniquement l'ancien rendu inline (il lisait `content.email`) : le typecheck est vert aux **Lots 3 + 4**, livrés dans la même passe. La consigne « ne pas câbler `resolveContactContent` avant le Lot 3 » a été respectée.
- **Id de champs uniques par instance (`useId`)** : la démonstration monte deux formulaires ; des `id` fixes auraient dupliqué les identifiants et cassé l'association `label`/`for`.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- **Dépendance vérifiée à l'installation** : `@icons-pack/react-simple-icons@13.15.1`, peer `react: ^16.13 || ^17 || ^18 || ^19` (compatible React 19.2.8), import **par icône** `…/icons/SiInstagram` (export par défaut) — jamais le barrel. LinkedIn absent du paquet (cf. écarts).
- `/demo` → **200** (198 515 caractères). Deux sections contact (`contact-11`, `contact-12`), **un** `<form>` chacune, `name="_gotcha"` présent **exactement 1 fois par formulaire**.
- **Rendu des containers** : `contact-11` porte `lg:grid-cols-2` (C2 + C3), `tel:` ×2 et `mailto:` ×1 ; `contact-12` n'a **aucun** `tel:`/`mailto:` et porte `mx-auto max-w-2xl` — la preuve du formulaire seul et centré quand C2 est masqué.
- **Titrage** : `h1` = **1** sur toute la page (le héro), **0** dans les deux sections contact ; `h2` = **1** par section (le chapeau). Aucun style de champ back-office sur la page publique. *(Assertion valable jusqu'à l'étape 14.1.b : le nom du bloc Identité est depuis un second `h2` — voir l'entrée du 16/09 19:55.)*
- **Identifiants de formulaire** : 14 `id` de champs, **tous distincts** (2 formulaires × 7 champs) — pas de collision d'accessibilité.
- **CSS compilé contrôlé** (chunk de 139 520 caractères) : `contact-section__subtitle`, `contact-info__preline`, `contact-form__gotcha`, `contact-social__link` et les règles `--circle`, `--square`, `--rounded` sont émises. `--minimal` n'émet **aucune** règle : c'est sa définition (absence d'habillage), pas un oubli.
- **Route exercée partiellement** (l'environnement local a Supabase + `DATABASE_URL`) : POST vide → **400** (Zod) ; POST valide avec `pageSlug=demo` → **422** « Page inconnue ou non publiée » ; POST valide avec `pageSlug=""` → **422** également (accueil sans module contact). Le passage honeypot → Zod → résolution de page est donc réellement exercé. Turnstile **non configuré** ici (sinon la requête se serait arrêtée en 400 anti-robot).
- **Non exercé, assumé et signalé** : la **soumission complète** (insertion, upload, e-mail) n'a pas été jouée — elle exige une page publiée portant un module contact **et** une clé `service_role`, absents ici. Elle a été vérifiée **par relecture** (ordre des contrôles, `min(…, 10)`, signature binaire, `path` et non URL).
- **`publicDescription` (branche contact) : relecture seule.** `/demo` court-circuite `public-page.ts` ; la lecture du chapeau (sous-titre, à défaut titre) n'a donc **pas** été exercée par les contrôles.
- **RLS jamais exercée** (décision D2) : Supabase Studio agit en `service_role` et la contourne, et aucune UI de consultation n'est livrée. Les politiques sont posées pour la suite, pas testées. `is_read` reste sans lecteur.
- **`npm run build` non lancé** : le serveur de développement occupe le port 3000 et `.next` est partagé.

### Fichiers créés ou modifiés
- Créés : `src/lib/contact-prefill.ts`, `src/components/modules/contact/{ContactModule,ContactInfoBlock,ContactForm,SocialLinks,socialIcons,TurnstileWidget}.tsx`, `src/lib/integrations.ts`, `src/lib/supabase/admin.ts`, `src/lib/emails/contact-notification.ts`, `src/app/api/contact/route.ts`, `src/db/repositories/contact-submissions.repository.ts`, `drizzle/0008_gorgeous_rage.sql`, `drizzle/0009_contact_rls.sql`.
- Modifiés : `src/lib/pages.ts` (§ CONTACT : types, catalogues, format, fabriques, résolveur, catalogue et `createModuleContent`), `src/lib/public-page.ts` (description de partage), `src/components/modules/PublicModules.tsx` (ancien rendu inline supprimé, plomberie `pageSlug`), `src/app/(front-office)/page.tsx` et `[slug]/page.tsx` (`pageSlug`), `src/app/(front-office)/demo/page.tsx` (deux modules contact), `src/components/backoffice/pages/modules/ModuleContactEditor.tsx` (réécriture), `src/components/backoffice/pages/modules/form-fields.tsx` (`disabled`), `src/components/backoffice/PagesStoreProvider.tsx` (préremplissage), `src/app/globals.css` (§ MODULE « CONTACT »), `src/db/schema.ts`, `drizzle/meta/_journal.json`, `.env.example`, `-----PourMémoSQLeditor-CreationTable.md`, `package.json` / `package-lock.json` (dépendance icônes).
- BDD : table `contact_submissions` + index ; RLS lecture/suppression propriétaire (aucune politique INSERT).

### Prochaine étape prévue
Recette navigateur (lisibilité des coordonnées, formulaire sur mobile, retour de focus, habillages d'icônes, pièce jointe refusée pour cause de format), puis « soumission réelle » sur une page contact publiée avec `service_role` et Resend configurés, et enfin `npm run build` **serveur de développement arrêté**.

---

## 2026-09-15 – 18:20 (heure locale America/Bogota)

### Tâche exécutée
**Étape 13.3 — Cards « texte structuré » (variante `editorial`) : 4ᵉ variante, corps en texte riche, 2 à 6 colonnes, interrupteur de boutons.**
- **Quatrième variante de `cards`, aucune migration** : le contenu vit dans le JSONB, `module_type` reste `cards` et l'énumération Postgres n'est pas touchée. La variante s'ajoute comme branche de l'union discriminée existante (portrait / square / landscape / editorial) au lieu d'ouvrir une famille — 4 points d'intégration au lieu de 13.
- **Deux axes enfin séparés : variante et cadrage photo.** `CardsPhotoFormat` (portrait / square / landscape) est le format ; `CardsVariant = CardsPhotoFormat | "editorial"` est la nature de la section. `cardsPhotoFormat(variant, editorialFormat)` devient la fonction pivot : les trois formats historiques portent leur cadrage dans leur variante, `editorial` dans `layout.editorialFormat`. `cardsMediaRatio` / `cardsEditorRatio` prennent désormais un **cadrage**, et `cardsColumnsFor` / `cardsColumnsLocked` / `cardsColumnOptions` raisonnent sur lui.
- **`editorial` est inatteignable depuis le sélecteur de format de l'éditeur** (exigence de correction, pas de cosmétique) : le sélecteur ne propose que les trois cadrages via `cardsPhotoFormatOrder` et, sur une section éditoriale, n'écrit que `layout.editorialFormat` — la variante ne change donc jamais et les corps riches ne peuvent pas être détruits. La variante s'obtient par l'entrée de catalogue `cards-editorial`, comme un Hero Slider ne devient pas un Hero Vidéo.
- **Corps de carte = un seul document riche** : `EditorialCardItem = { id, media, body: RichTextDoc, cta }`, ni titre ni texte séparés. Le libellé d'accordéon et l'`alt` de repli de la photo se **déduisent** du document (`richTextDocToPlainText`, tronqué sur un mot entier) — sans quoi toutes les cartes sans `alt` porteraient le même libellé générique. Le rendu passe par `RichTextRenderer` (liste blanche, jamais de `dangerouslySetInnerHTML`).
- **Barre d'outils bornée dans une carte** : `RichTextBlockEditor` / `RichTextToolbar` gagnent une prop **optionnelle** `allowedStyles` (défaut : toutes, le module « Contenu en colonnes » ne change pas d'un pixel). Dans une carte : Texte normal / Sous-titre (H3) / Petit titre (H4) — le **H2 est retiré**, la carte vit dans une section dont l'en-tête le porte déjà. La lecture reste tolérante : un H2 écrit à la main est toujours rendu et la liste déroulante retombe sur « Texte normal » au lieu de s'afficher vide.
- **2 à 6 cartes par ligne** : `CARDS_COLUMN_COUNTS` passe à `[2,3,4,5,6]`, mais les trois formats photo restent **plafonnés à 4** (au-delà, une photo 4:5 dans moins de 200 px n'est plus une photo) ; seul `editorial` monte à 6. La grille n'atteint 5 et 6 qu'en `xl` (`lg:grid-cols-4 xl:grid-cols-5|6`).
- **`sizes` de la photo en trois paliers** et non deux : `(min-width: 1280px) 100/colonnes vw, (min-width: 1024px) 100/min(colonnes,4) vw, (min-width: 640px) 50vw, 100vw`. La grille plafonnant à 4 colonnes en `lg`, ce palier vaut `min(colonnes, 4)` : un `sizes` fixe à 25vw sous-dimensionnerait les images des sections à 2 et 3 colonnes, et un `sizes` en deux paliers les sous-dimensionnerait à 5 et 6.
- **Boutons de section activables/désactivables** : `style.ctaShow` (défaut **affiché**, donc rendu inchangé pour tous les contenus existants). Le sélecteur de style n'est proposé que si l'affichage est actif — un réglage sans objet est un piège. Masquer **n'efface rien** : libellés et destinations restent enregistrés, réactiver les restitue (même précédent que `cta.style` ignoré en 13.2.b : un réglage d'affichage n'est pas un effacement de données).
- **Une seule instance Tiptap à la fois** : seule la carte dépliée monte son éditeur, six cartes coûtent donc un éditeur. Le `flush` au démontage (déjà en place en 12.1) fait que replier une carte après une frappe ne perd rien.
- **Aucune reprise de données** : `editorialFormat` et `ctaShow` sont **optionnels** dans le schéma Zod et complétés par le résolveur (`resolveCardsContent` reste total : corps absent → `{ type: "doc", content: [] }`, jamais de texte de démonstration ressuscité). Le schéma gagne la branche `editorial` (avec un miroir minimal de `RichTextDoc`) et des colonnes 5 et 6.
- **SEO de partage** : `publicDescription` lit désormais, pour une page ne contenant que des cartes éditoriales, le texte brut du premier corps non vide — sans quoi une telle page n'aurait aucune description.

### Écarts assumés au plan (et pourquoi)
- **`:is()` au lieu de `:where()`** dans les règles `.cards-card__rich` du plan : `:where()` ramène la spécificité de la sélection interne à zéro, donc `.cards-card__rich :where(h3)` (0,1,0) **perd** contre `.rich-content h3` (0,1,1) déclaré plus haut — les tailles de section resteraient appliquées. `:is(...)` prend la spécificité d'un élément (0,1,1), à égalité, et l'ordre du fichier tranche.
- **`text-align: left` sur `.cards-card__rich`** : le pied de carte est centré (`text-align: center` du gabarit), mais des listes centrées détachent leurs puces de leur texte. Le bloc reste centré dans la carte ; c'est son contenu qui s'aligne à gauche.
- **`sizes` du palier `lg` en `min(colonnes, 4)`** plutôt que 25vw fixe (voir ci-dessus).
- **Démo à 6 colonnes sur la section éditoriale** : c'est le seul moyen de prouver le palier `xl` et le `sizes` multi-paliers en HTML, et le cas le plus étroit pour juger la lisibilité.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**, **quatre** sections Cards (`cards-7` à `cards-10`), **3 cartes chacune** : `data-format` = `portrait` / `square` / `landscape` / `editorial` 3 fois par section ; ratios `4 / 5`, `1 / 1` et `3 / 2` posés 3 fois chacun.
- **Section éditoriale** : 3 corps `rich-content cards-card__rich`, 3 `h3`, 3 `ul`, 3 `ol`, 15 `li` (2 puces + 3 étapes par carte), 3 boutons — et **un seul `h2`** (l'en-tête de section), donc aucun titre issu d'une carte.
- **Interrupteur de boutons prouvé sur une autre section** : la section **carrée** ne contient **0 bouton** alors que portrait en compte 3 et que sa première ligne de contenu est identique — c'est bien un réglage d'affichage de section.
- **Contrainte du paysage conservée** : la section paysage porte `lg:grid-cols-2` et **aucun `lg:grid-cols-4`**, alors que le contenu de démo est enregistré avec `columns: 4` exprès.
- **5 et 6 colonnes uniquement demandées** : `xl:grid-cols-6` présent (section éditoriale, réglée à 6) et `xl:grid-cols-5` **absent**.
- **Audit de titrage** : `h1` = 1 ; `h2` = 1 par section Cards (l'en-tête), aucun `h2` dans un corps de carte.
- **`sizes` servi** : section éditoriale (6 colonnes) `(min-width: 1280px) 17vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw` ; section paysage (2 colonnes) `50vw` à tous les paliers.
- **CSS compilé contrôlé** (chunk 135 519 caractères) : les quatre règles `.cards-card__rich` sont émises (`:is(h2, h3)`, `h4`, `:is(p, li)`, `:is(ul, ol)`) **après** `.content-header__h3, .rich-content h3, .module-h3 { font-size: var(--h3-size) }` (index 121 704 contre 126 928) — l'ordre qui fait gagner le rétrécissement de portée. `.rich-content` hors carte est inchangé.
- **`/demo` n'est pas un test d'intégration complet** : il court-circuite `public-page.ts`. La lecture du corps éditorial par `publicDescription` **n'a donc pas été exercée par ces contrôles** — elle a été contrôlée par relecture du code (premier corps non vide, après introduction et sous-titre).
- **Reste à confirmer dans le navigateur** (non mesurable en ligne de commande) : hauteurs de pieds égales avec des corps de longueurs différentes, boutons alignés en bas, texte riche lisible dans une carte à 6 colonnes, listes indentées, bascule de cadrage sans perte de texte, repli d'une carte juste après une frappe sans perte.

### Fichiers créés ou modifiés
- Créé : `src/components/modules/cards/EditorialCardItem.tsx`.
- Modifiés : `src/lib/pages.ts` (`CardsPhotoFormat` / `CardsVariant`, `cardsPhotoFormat`, ratios et colonnes par cadrage, `editorialFormat` / `ctaShow`, `EditorialCardItem`, fabriques, résolveur, catalogue `cards-editorial`), `src/lib/schemas/persistence.ts` (branche `editorial`, `richTextDocSchema`, `editorialFormat` / `ctaShow` optionnels, colonnes 5-6), `src/components/modules/cards/CardsModule.tsx` (colonnes 5-6, aiguillage, `sizes`), `.../cards/CardItem.tsx` (cadrage + `ctaShow`, `cardImageSizes` exporté), `src/app/globals.css` (§ `.cards-card__rich`), `src/components/backoffice/pages/modules/content/RichTextBlockEditor.tsx` et `.../RichTextToolbar.tsx` (`allowedStyles`), `src/components/backoffice/pages/modules/ModuleCardsEditor.tsx`, `src/lib/public-page.ts`, `src/app/(front-office)/demo/page.tsx`.
- BDD : **aucune migration** — `module_type` inchangé, `editorialFormat` et `ctaShow` facultatifs, aucun contenu existant invalidé.

### Prochaine étape prévue
Recette navigateur (hauteurs de pieds, lisibilité à 6 colonnes, listes, bascule de cadrage sans perte, repli après frappe), puis `npm run build` **serveur de développement arrêté**.

---

## 2026-09-15 – 15:00 (heure locale America/Bogota)

### Tâche exécutée
**Étape 13.2.b — Cards : style de bouton commun à la section et libellé multiligne.**
- **Le style du bouton devient un réglage de section.** Il était réglé carte par carte, ce qui pouvait donner trois boutons d'aspects différents dans une même rangée — trois éléments de même rôle lus comme trois natures différentes. `CardCta` se réduit donc à `{ label, href }`, et le style vit dans `style.ctaStyle` (défaut `primary`, mêmes trois valeurs que le CTA du Héro). **Libellé et destination restent carte par carte** : c'est leur contenu, et deux cartes ne mènent pas au même endroit.
- **Aucune migration** : les contenus enregistrés portent encore un `cta.style` par carte, que le résolveur **cesse de lire** (champ surnuméraire inoffensif en JSONB) ; `style.ctaStyle`, absent des contenus antérieurs, est **optionnel** dans le schéma Zod et complété à la lecture. Tous les boutons déjà enregistrés étant en `primary`, le rendu ne change pas d'un pixel.
- **Éditeur** : le sélecteur « Style » disparaît du sous-formulaire de chaque carte (qui garde photo, titre, texte, libellé, destination) et un sous-bloc **« Bouton des cartes »** apparaît dans « Disposition et apparence », avec la phrase de portée qui rappelle ce qui est commun et ce qui reste par carte.
- **Retour à la ligne automatique du libellé** : le bouton du thème porte `whitespace-nowrap` et une hauteur fixe (`h-8`), qui couperaient un libellé long sur une carte étroite. Les deux sont neutralisés **uniquement dans les cartes** (`white-space: normal`, `height: auto` + `min-height: 2rem` pour qu'un libellé d'une ligne garde la hauteur du thème) — dans un héro ou une galerie, un libellé sur une seule ligne reste souhaitable.
- **Marges symétriques, les deux demandées** : le **texte** dans le bouton (`padding: 0.5rem 1rem`, gauche = droite) et le **bouton** dans son bloc (`padding-inline: var(--cards-cta-inset, 0.25rem)`) — même quand un libellé long occupe toute la largeur disponible, il ne touche jamais les bords du bloc. Complété par `text-wrap: balance` (deux lignes de longueur comparable) et `overflow-wrap: anywhere` (garde-fou : aucun mot ne déborde).
- **Interaction avec l'alignement bas** (13.2) : un libellé sur deux lignes rend le bouton plus haut, mais `margin-top: auto` continue de plaquer son **bas** sur celui des autres cartes de la ligne — l'espace excédentaire se loge au-dessus.

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**. **Le style commun est prouvé sur le rendu** : la section paysage, réglée en « contours », contient **3 cartes et exactement 3 boutons en style contours, 0 en style principal** — les trois changent donc ensemble. La démonstration porte aussi un **libellé long** (« Découvrir l'accompagnement des mariages et des portraits ») pour éprouver le retour à la ligne.
- **CSS servi contrôlé** (chunk compilé) : `white-space: normal`, `text-wrap: balance`, `overflow-wrap: anywhere`, `height: auto`, `min-height: 2rem`, `padding: .5rem 1rem`, `line-height: 1.35` sur le bouton ; `padding-inline: var(--cards-cta-inset, .25rem)` sur son conteneur.
- **Reste à confirmer dans le navigateur** : un libellé long se répartit sur deux lignes sans débordement, marges gauche/droite du texte identiques, bouton centré et détaché des bords du bloc, bas des boutons alignés dans une ligne.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts` (`CardCta` sans style, `style.ctaStyle`, fabriques et résolveur), `src/lib/schemas/persistence.ts` (`cardCtaSchema` sans style, `ctaStyle` optionnel), `src/app/globals.css` (§ MODULE « CARDS » : retour à la ligne, marges symétriques), `src/components/modules/cards/CardItem.tsx`, `.../CardsModule.tsx`, `src/components/backoffice/pages/modules/ModuleCardsEditor.tsx` (sous-bloc « Bouton des cartes »), `src/app/(front-office)/demo/page.tsx`, `plans/ROADMAP-13.2-cards-formats.md` (§8, amendement).
- BDD : **aucune migration** — le style par carte est ignoré, le style de section est facultatif.

### Prochaine étape prévue
Recette navigateur (retour à la ligne du bouton, marges symétriques, bas des boutons alignés, trois formats), puis `npm run build` **serveur arrêté** — dernière étape de 13.x.

---

## 2026-09-15 – 12:55 (heure locale America/Bogota)

### Tâche exécutée
**Étape 13.2 — Cards : pieds de carte alignés, bloc de texte réglable et trois formats.**
- **Pieds de carte de hauteur uniforme** : l'article est l'item de la grille, il était donc déjà étiré à la hauteur de la ligne ; c'est le **bloc clair** qui ne suivait pas. Il passe en `flex: 1 1 auto` (`auto`, et non `0` : une base à zéro aurait compressé le texte) et en conteneur colonne.
- **Bouton plaqué au bas du pied** : `margin-top: auto` sur le bouton — l'espace excédentaire se loge **entre le texte et le bouton**, jamais sous lui. Une ligne de cartes a donc ses boutons alignés sur le bas du pied le plus haut.
- **Équilibre vertical** : `padding-block: var(--cards-inset)` (0,9375 rem), **une seule valeur** pour la marge au-dessus du titre et celle sous le bouton — deux valeurs séparées finiraient par diverger.
- **Photo pleine** : `object-fit: cover` est désormais **structurel** (`.cards-card__frame :where(img)`), avec `width`/`height` à 100 %. La garantie ne dépend plus d'une classe utilitaire : elle vaut donc aussi pour le repli `<img>` natif des URL non optimisables, où le vide apparaissait.
- **Le bloc de texte devient réglable** : arrondi (0 à 200 px, **défaut 2 px**) et épaisseur du filet (1 à 24 px, **défaut 2 px**). La **couleur** du filet reste l'accent du thème — elle suit donc le mode sombre sans réglage ; la plage démarre à 1 px, le filet est toujours présent.
- **Trois formats au lieu d'un** : **portrait** (4:5, l'existant), **carré** (1:1) et **paysage** (3:2, 4:3 ou 16:9 au choix — défaut 3:2), ce dernier à **2 cartes par ligne**. Le format ne change que le ratio et la largeur de colonne : le chevauchement du bloc clair, signature du module, reste identique dans les trois cas.
- **La contrainte du paysage est appliquée à la lecture et à l'écriture** (`cardsColumnsFor`) : un contenu réglé sur 4 puis passé en paysage revient à 2 tout seul. Le contrôle « Cartes par ligne » disparaît alors de l'éditeur — un réglage sans effet serait un piège.
- **Aucune migration de données** : `variant: "classic"` (contenus de 13.1) est **traduit en `"portrait"` à la lecture** (même technique que « masonry » → « static », 11.1), et les trois nouveaux champs sont **optionnels** dans le schéma Zod (`bodyRadius`, `bodyBorderWidth`, `landscapeRatio`), complétés par le résolveur — la même méthode que `hoverEffects` (11.23) et `album.hidden` (11.20).

### Mesures et vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement**.
- `/demo` → **200**, avec **un module par format** : 3 sections de 3 cartes, `data-format` présent 3 fois par format, ratios `4 / 5`, `1 / 1` et `3 / 2` posés 3 fois chacun, **1 `h1`** et **9 `h3`** (un par carte).
- **Normalisation du paysage prouvée sur le rendu** : la section paysage est enregistrée **exprès** avec `columns: 4` et le HTML ne contient **aucun `lg:grid-cols-4`**, seulement `lg:grid-cols-2`.
- Le bloc du module paysage reçoit **18 px d'arrondi et 4 px de filet** : les deux réglages ajoutés se voient donc à l'œil nu dans la recette.
- **CSS réellement servi contrôlé** (chunk compilé, 134 Ko) : `aspect-ratio: var(--cards-media-ratio, 4 / 5)`, `object-fit: cover` structurel, `flex: auto` (minification de `flex: 1 1 auto`), `margin-top: auto` sur le bouton, `border: var(--cards-body-border-width, 2px)` et `border-radius: var(--cards-body-radius, 2px)` — replis du gabarit inclus.
- **Reste à confirmer dans le navigateur** (non mesurable en ligne de commande) : hauteurs de pieds égales dans une ligne, boutons alignés en bas, absence de vide dans les cadres, et rendu des trois formats.

### Fichiers créés ou modifiés
- Créé : [`plans/ROADMAP-13.2-cards-formats.md`](plans/ROADMAP-13.2-cards-formats.md).
- Modifiés : `src/lib/pages.ts` (formats, ratios, colonnes contraintes, trois nouveaux réglages, résolveur, catalogue à trois entrées), `src/lib/schemas/persistence.ts` (union discriminée + champs optionnels), `src/app/globals.css` (§ MODULE « CARDS » : pied élastique, bouton en bas, marges symétriques, `object-fit`, arrondi et filet pilotés par variables), `src/components/modules/cards/CardItem.tsx`, `.../CardsModule.tsx`, `src/components/backoffice/pages/modules/ModuleCardsEditor.tsx`, `.../ArtSourceField.tsx` (ratios `1:1`, `3:2`), `src/app/(front-office)/demo/page.tsx`.
- BDD : **aucune migration** — les nouveaux réglages sont facultatifs et l'ancien format est traduit à la lecture.

### Prochaine étape prévue
Recette navigateur des trois formats (hauteurs de pieds, boutons en bas, cadres pleins), puis `npm run build` **serveur de développement arrêté** — dernière étape restante de l'étape 13.

---

## 2026-09-15 – 11:45 (heure locale America/Bogota)

### Tâche exécutée
**Étape 13.1 — Module « Cards » : cartes photo + titre + texte + bouton, de 2 à 4 par ligne.**
- **Nouvelle famille `cards`** (variante unique `classic`), avec un gabarit figé : photo au ratio 4:5, puis un bloc clair qui **chevauche** son bas à 88 % de largeur. Le chevauchement est la **signature** du module — il ne se règle pas. Seuls rayon, ombre, bordure et effets de survol sont réglables, et ils s'appliquent au **cadre de la photo**, exactement comme les vignettes de galerie (mêmes fonctions de style, mêmes jetons).
- **La carte n'est jamais cliquable — décision de conception assumée.** Seul le bouton porte une destination. Une carte entièrement cliquable aurait fait dépendre le clic de la zone la plus large de la page et interdit tout autre élément interactif à l'intérieur. Conséquence directe : l'**élévation au survol a été retirée** (elle promettait un clic qui n'existe pas), et les effets retenus portent sur la **photo** — zoom, brillance, saturation, liseré. `parallax` est également écarté (sans objet sur une vignette). Le focus du bouton déclenche les mêmes effets qu'un survol, pour qu'un parcours clavier ne soit pas « mort ».
- **Réglages** : cartes par ligne (**2 / 3 / 4** — réglage imposé, pas de valeur libre), alignement de l'en-tête (centré / aligné à gauche), et en-tête à trois niveaux : titre `h2`, sous-titre, introduction. Texte de carte **simple, retours à la ligne conservés** (`white-space: pre-line`) — pas de texte riche : le module reste simple, conformément au cahier des charges révisé.
- **Responsive** : réglage = grand écran ; tablette 2 colonnes, téléphone 1 colonne **quelle que soit la valeur choisie**. Typographie fluide (`clamp`) **plafonnée par les jetons du site** (`--h3-size`) — pas de seconde échelle de titres. Titres de cartes en `h3` (jamais `h2` : l'en-tête le porte), un seul `h1` par page.
- **Les cinq points muets ont été traités explicitement** — ce sont ceux qui ne se signalent pas à la compilation (leçon de la famille « Contenu en colonnes ») : `moduleTypeEnum` (Postgres), `moduleTypeSchema` (Zod — l'oublier donne un **HTTP 400 à l'enregistrement**), `PageModuleRenderer` (l'oublier donne une **section invisible**), `ModuleContentEditor` (l'oublier donne un **éditeur vide**), `moduleCatalog`, plus `collectImageUrls` / `publicOgImage` / `publicDescription` (SEO d'une page faite uniquement de cartes). Les commentaires qui **comptaient** les familles (« 7 familles », déjà faux) ont été corrigés.

### Mesures
- Poids et vitesse : inchangés — les photos de cartes passent par `MediaImage` et le loader CDN existant (**0 requête `_next/image`**, transformation ≤ 2560 px).
- Rendu réel de `/demo` (module Cards ajouté à la page de démonstration, qui ne dépend pas de la BDD) : **3 cartes** rendues, **1 `h1`**, **9 `h2`**, **3 `h3`** (les titres de cartes), variables de survol `--hv-zoom/--hv-filter` posées par carte, bordure de cadre `2px #EAE5E5`, rayon 12, `sizes` de photo `33vw` en 3 colonnes.
- **Migration** : générée puis **appliquée après validation explicite** (voir ci-dessous) — l'énumération Postgres `module_type` accepte désormais `cards`.

### Fichiers créés ou modifiés
- Créés : [`src/lib/cards-effects.ts`](src/lib/cards-effects.ts) (survol → variables CSS), [`src/components/modules/cards/CardsModule.tsx`](src/components/modules/cards/CardsModule.tsx) et [`CardItem.tsx`](src/components/modules/cards/CardItem.tsx) (rendu public), [`src/components/backoffice/pages/modules/ModuleCardsEditor.tsx`](src/components/backoffice/pages/modules/ModuleCardsEditor.tsx) (éditeur en 3 zones), [`plans/ROADMAP-13.1-module-cards.md`](plans/ROADMAP-13.1-module-cards.md), migration [`drizzle/0007_slow_sabra.sql`](drizzle/0007_slow_sabra.sql).
- Modifiés : `src/lib/pages.ts` (domaine complet : types, gardes, résolveur tolérant, fabriques, catalogue), `src/lib/schemas/persistence.ts`, `src/db/schema.ts`, `src/components/backoffice/pages/ModuleIcon.tsx` (`IdCard`), `.../modules/ModuleContentEditor.tsx`, `.../modules/ArtSourceField.tsx` (ratio `4:5`), `src/components/modules/PublicModules.tsx`, `src/components/modules/gallery/CTAButton.tsx` (taille `sm` optionnelle, défaut `lg` inchangé), `src/app/globals.css` (§ MODULE « CARDS »), `src/lib/public-page.ts`, `src/app/(front-office)/demo/page.tsx`.
- **BDD : une migration, appliquée après validation** — `ALTER TYPE "public"."module_type" ADD VALUE 'cards'` (`drizzle/0007_slow_sabra.sql`, généré par `drizzle-kit`). C'est le seul geste non réversible de l'étape. Sans elle, l'enregistrement d'une page contenant un module Cards échoue : le symptôme observé est un **HTTP 500** (`invalid input value for enum module_type: "cards"`), **et non un 400** — le 400 signalerait un échec de `moduleTypeSchema`, qui était donc déjà correct. La requête insérant **tous** les modules d'une page en une instruction, l'échec annulait l'enregistrement de la page entière (aucune donnée modifiée, page enregistrée intacte).
- **Contrôle après application** : `select enumlabel from pg_enum where typname = 'module_type'` → `hero, about, services, cta-banner, gallery, faq, contact, content, cards`.

### Vérifications
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur, 0 avertissement** ; `/`, `/demo`, `/portfolio` → **200** après ajout de la famille ; énumération Postgres relue en base après migration.
- **Reste à faire** : `npm run build` **serveur de développement arrêté** (`.next` partagé — le serveur occupait le port 3000 pendant cette passe).
- **Reste à confirmer dans le navigateur** : enregistrer une page contenant un module Cards (le point qui échouait), puis bascule 4 / 3 / 2 / 1 colonnes, survol souris vs tactile, neutralisation `prefers-reduced-motion`, focus clavier **uniquement sur le bouton**.

### Prochaine étape prévue
Créer un module Cards dans le constructeur et **enregistrer la page** (l'enregistrement était le dernier point bloqué), puis `npm run build` serveur arrêté.

---

## 2026-09-15 – 10:10 (heure locale America/Bogota)

### Tâche exécutée
**Diaporama de galerie lent et saccadé — le préchargement des voisines téléchargeait les photos en original.**
- **Symptôme rapporté** : dans le diaporama (clic sur une photo de galerie), le chargement est très lent et semble figer par moments ; tout était fluide avant les travaux de fin de semaine. Hypothèse avancée : une régression du formatage WebP 80 %.
- **Verdict : ce n'est pas une régression du WebP 80 %**, ni des titres H2/H3/H4, ni du « Hero Rideau » — aucun de ces travaux ne touche au chemin de chargement des images. La correction WebP/80 mesure **2,81 Mo → 252 Ko** à 640 px : elle est saine.
- **Cause réelle, mesurée** : le préchargement du diaporama ([`LightboxModal`](src/components/modules/gallery/LightboxModal.tsx)) portait sur **les deux voisines** et utilisait l'URL **d'origine** de la photo, pas la version transformée. Sur cette liaison (**~450 Ko/s** mesuré vers Supabase, l'original met **6,9 s** à descendre), chaque appui sur une flèche déclenchait **~5,6 Mo** de téléchargements qui saturaient la connexion **et retardaient l'image affichée** — d'où l'impression de figement. Défaut **préexistant**, rendu visible par l'arrivée de nombreuses photos de plusieurs mégaoctets.
- **Correction, trois changements ciblés** : **(1)** une seule photo préchargée — la **suivante** — au lieu des deux voisines ; **(2)** préchargée via le **CDN de transformation** (`supabaseImageUrl`, 1920 px WebP q80) au lieu de l'original, et **1920 est exactement la variante que le navigateur affiche**, donc l'image est déjà en cache à la navigation suivante ; **(3)** préchargement différé de **200 ms** pour que l'image affichée parte en premier, et `sizes` du diaporama plafonné à 1600 px (`(max-width: 1024px) 100vw, 1600px`) au lieu de `100vw`.
- **Plafond de largeur dans le loader** (`media-url.ts`) : `MAX_TRANSFORM_WIDTH = 2560`. Next réclame des variantes jusqu'à **3840 px** (écrans 4K) que le CDN facture en octets pour un gain invisible ; au-delà de 2560 les entrées du `srcset` pointent vers la même variante. Vérifié dans le `srcset` réellement produit : **`width=2560` présent, `width=3840` absent**.
- **Avant / après, par navigation dans le diaporama** : **5,6 Mo → 0,77 Mo** (−86 %), et l'image affichée passe d'un JPEG de 2,81 Mo à un **WebP 774 Ko** servi par le CDN. Le poids restant est celui de la connexion (~450 Ko/s ≈ 1,7 s), pas du code.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; mesures directes des URL (original 2,81 Mo / 6 854 ms ; transformée 1920 = 774 Ko ; transformée 3840 = 1 174 Ko, désormais inutilisée) ; `srcset` contrôlé sur une photo Supabase placée **temporairement** dans `/demo`, puis retirée. **Reste à confirmer dans le navigateur** : parcourir une galerie à la souris et au clavier, et vérifier la fluidité ainsi que l'absence de `object/public` en préchargement dans l'onglet Réseau.
- **Piste si ce n'est pas encore assez fluide** : ramener la largeur du diaporama de 1920 à 1280 px (~400 Ko, soit ~0,9 s sur cette liaison) — un seul nombre à changer dans `LightboxModal`. Réversible, sans migration.

### Fichiers modifiés
- `src/components/modules/gallery/LightboxModal.tsx` (préchargement de la seule suivante, via le CDN, différé ; `sizes` plafonné ; en-tête).
- `src/lib/media-url.ts` (plafond `MAX_TRANSFORM_WIDTH = 2560`).
- BDD : **aucune** migration, aucun contenu modifié.

### Prochaine étape prévue
Recette humaine du diaporama (souris, flèches, Échap, zoom, plein écran) puis, si la fluidité est confirmée, `npm audit` et `npm run build` serveur arrêté.

---

## 2026-09-15 – 00:16 (heure locale America/Bogota)

### Tâche exécutée
**Panne d'affichage des photos — le CDN de transformation Supabase remplace l'optimiseur de Next.**
- **Symptôme** : toutes les photos du portfolio en **HTTP 500**, la console du serveur répétant `GET /_next/image?…&q=80 500` puis `⨯ upstream image response timed out for …supabase.co/…`, avec des dizaines de `TimeoutError`.
- **Cause, mesurée** : l'optimiseur d'images de Next **télécharge l'original, côté serveur**, une fois **par largeur demandée**. Une photo du portfolio pèse **2,81 Mo** : ce téléchargement dépasse le délai interne de l'optimiseur (7 s), il abandonne et répond 500. Trente photos × plusieurs largeurs, et la page n'affiche plus rien.
- **Ce que le projet prévoyait déjà** : le plan du stockage média (étape 6.1) l'écrit noir sur blanc — « URL CDN Supabase avec transformations (`width`/`height`/`quality`/`format`) → `next/image` ne retravaille pas les octets ». Le montage manquait.
- **Correction — le CDN de transformation entre dans la boucle.** Nouveau [`media-url.ts`](src/lib/media-url.ts) : `supabaseImageUrl()` réécrit une URL publique Supabase en URL de transformation (`/storage/v1/render/image/public/…?width=…&format=webp&quality=…`). Nouveau [`image-loader.ts`](src/lib/image-loader.ts) : le `loader` qui l'utilise, **déclaré globalement** dans `next.config.ts` (`images.loader: "custom"` + `images.loaderFile`). Plus aucune image ne passe par `/_next/image`, et le montage vaut pour **tout** le site (galeries, Lightbox, contenu, back-office) sans exception à maintenir.
- **Incident corrigé pendant la vérification, et règle à retenir.** La première version passait le loader en **prop** à `next/image` depuis un composant serveur : erreur d'exécution immédiate — « **Functions cannot be passed directly to Client Components** ». `next/image` est un composant **client**, une fonction ne franchit pas cette frontière ; `loaderFile` est le mécanisme prévu pour cela. La correction a aussi supprimé la prop devenue inutile dans `MediaImage` (et les deux exports qu'elle utilisait, pour ne pas laisser de code mort).
- **Gain mesuré, même photo** : original **2,81 Mo** (JPEG) → transformée **252 Ko** (WebP 640 px), **11 fois moins**, servie par le CDN Supabase et **sans passage par `/_next/image`**.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; `srcset` réellement produit contrôlé en plaçant **temporairement** une photo Supabase dans `/demo` (**32 URL `render/image` portant `width=…&format=webp&quality=80`**, **0 requête `_next/image`**), puis retirée ; `/` et `/demo` servis en **200**, sans l'erreur de fonction ; les visuels de démonstration (picsum), dont l'URL n'est pas transformable, sont renvoyés **tels quels** par le loader. **Reste à confirmer dans le navigateur** : les photos de `/mon-portfolio` s'affichent et la console n'affiche plus ni 500 ni « upstream image response timed out ».
- **Réversible sans migration** : les URL stockées en base ne changent pas — la transformation est appliquée **à l'affichage**.

### Fichiers créés ou modifiés
- Créés : `src/lib/media-url.ts` (transformation d'URL) et `src/lib/image-loader.ts` (loader global).
- Modifiés : `next.config.ts` (`images.loader` / `loaderFile`), `src/components/common/MediaImage.tsx` (en-tête : le redimensionnement n'est plus une prop), et — de la passe précédente — `src/app/layout.tsx`, `src/components/backoffice/pages/ModuleDndList.tsx`.
- BDD : **aucune** migration, aucun contenu modifié.

### Prochaine étape prévue
Recharger `/mon-portfolio` : les photos doivent s'afficher nettement plus vite, sans erreur en console. Puis `npm audit` et `npm run build` serveur arrêté.

---

## 2026-09-15 – 00:07 (heure locale America/Bogota)

### Tâche exécutée
**Trois correctifs tirés des logs de recette** — qualité d'image, défilement lissé, accordéon du back-office.
- **Qualité d'image : la liste `qualities` manquait dans `next.config.ts`.** Next 16 n'autorise qu'**une** qualité (75) tant que la liste n'est pas déclarée ; or trois composants demandent explicitement `quality={80}` (`GalleryItem`, `LightboxModal`, photos du contenu en colonnes) et `MediaImage` utilise 75 par défaut. Chaque image servie produisait donc un avertissement et repartait en 75 — sur un site de photographe, la compression ne doit pas se voir. La liste déclare maintenant **`[75, 80]`** : les deux qualités réellement demandées par le code, et rien d'autre. Mesure sur `/demo` : **119 URL en `q=80`** (galeries) et **10 en `q=75`** (chemins par défaut) — preuve que les deux sont nécessaires, et qu'aucune troisième valeur ne circule.
- **`data-scroll-behavior="smooth"` sur `<html>`.** Le site défile en douceur (ancres compensées sous le Header fixe, étape 11.16). Sans cet attribut, Next applique aussi ce défilement animé à ses **propres transitions de route** : l'arrivée sur une nouvelle page « glisse » au lieu de se poser, et Next le signalait. Ajouté dans le layout racine, avec l'explication en commentaire.
- **Accordéon du back-office : état contrôlé dès le premier rendu.** `ModuleDndList` gardait `openModuleId` en `string | undefined` : Radix recevait `value={undefined}` (accordéon **non contrôlé**) au premier rendu, puis une chaîne dès l'ouverture d'un module (accordéon **contrôlé**). React interdit ce changement de nature en cours de vie d'un composant — avertissement en console et état interne de Radix désynchronisé. L'état est désormais une **chaîne** dont `""` signifie « aucun module déplié » : contrôlé du début à la fin.
- **Ce qui restait du log n'appelait aucune correction** : `Couldn't load fs/zlib` et le drapeau Turbopack sont du bruit de développement volontairement configuré (`turbopackFileSystemCacheForDev: false`, documenté dans `next.config.ts`) ; les `TimeoutError` sont des requêtes abandonnées pendant les rechargements, à ne surveiller que si une image cesse de s'afficher.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; serveur de développement redémarré sur la nouvelle configuration et pages servies (`/demo`, `/` → 200). **À faire côté utilisateur** : `npm audit` (GitHub signale **1 vulnérabilité modérée** sur la branche par défaut) et un `npm run build` **serveur arrêté**, non relancé ici.

### Fichiers modifiés
- `next.config.ts` (`images.qualities`), `src/app/layout.tsx` (`data-scroll-behavior`), `src/components/backoffice/pages/ModuleDndList.tsx` (état contrôlé de l'accordéon).
- BDD : **aucune** migration.

### Prochaine étape prévue
`npm audit` puis mise à jour du paquet signalé, et build de production serveur arrêté.

---

## 2026-09-14 – 20:59 (heure locale America/Bogota)

### Tâche exécutée
**Hiérarchie des titres — un seul `h1` par page, décidé à un seul endroit.**
- **Constat de départ.** Le niveau 1 n'était pas *décidé*, il était *supposé* : chaque page regardait si **son premier module** était un Héro (`firstIsHero`), et lui laissait le `h1` ; sinon elle posait un `h1` invisible (`sr-only`) contenant le titre de la page. Le pari tenait tant que la page commençait par un Héro… et cédait autrement : **Héro ajouté en fin de page** (le cas courant, le bouton d'ajout place en fin) ou second Héro → **deux `h1`** ; **carrousel** → un `h1` **par diapositive** (toutes sont dans le document, plus le doublon de boucle) ; **titre vidé** → un `h1` **vide** (`HeroTextBlock` rendait le titre sans condition, contrairement au sous-titre et à la description). La page `/demo` en portait **4 à 5**.
- **La règle appartient désormais à la page, pas aux modules.** `PublicModulesList` calcule **une fois** qui porte le titre : le **premier module**, s'il est de la famille Héro et que son titre est renseigné ; sinon la page pose son propre titre en `sr-only` (vrai texte, lu par les lecteurs d'écran et indexé — jamais de page sans `h1`). Le résultat est transmis à chaque module (`titleTag`), qui ne décide plus rien.
- **Nouveau `heroH1Text(raw)`** ([`pages.ts`](src/lib/pages.ts)) : donne le titre « principal » d'un Héro **quelle que soit sa variante** — pour un carrousel, le premier titre non vide parmi les diapositives, puisque son `h1` suit la diapositive affichée.
- **Un Héro au milieu de page est un séparateur** : il reçoit `h2`, comme le bandeau le fait depuis 11.27 (le CSS note déjà que sa *taille* reste celle d'un `h1` : le niveau est une décision de structure, la taille une décision de design).
- **Carrousel** : seule la diapositive **affichée** conserve le niveau reçu ; les autres — déjà `aria-hidden` — passent en `h2`. Elles étaient invisibles pour les lecteurs d'écran, pas pour le plan du document.
- **Titre vide** : `HeroTextBlock` saute le titre (`titleH1.trim() !== ""`), comme il sautait déjà le sous-titre et la description. Le créneau `h1` redescend alors au repli de page.
- **Incident corrigé pendant la vérification, et leçon retenue.** Les contenus venus de la BDD sont **bruts** (non résolus : chaque consommateur résout sa variante au rendu). Lire `titleH1` directement faisait donc échouer les pages BDD en **HTTP 500** — `Cannot read properties of undefined (reading 'trim')`. `heroH1Text` prend maintenant le contenu brut et **passe par le résolveur de la variante** avant de lire. C'est la règle de lecture du projet, et elle se paie une fois de plus quand on l'oublie.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; et le **compte réel des `h1` sur les pages servies** : `/` 1 (« Michel Haury », titre du Héro de tête), `/portfolio` 1, `/a-propos` 1, `/prestations` 1, `/demo` 1 (17 `h2`). Le **repli sans Héro** a été vérifié en retirant temporairement les deux Héros de la démo : `h1` = 1, `class="sr-only"`, « Démo — Rendu des modules » — puis remis en place.
- **Reste à la recette humaine** : composer une page sans Héro, puis une page avec deux Héros, et vérifier qu'il n'y a jamais qu'un seul `h1` — et que le titre affiché correspond bien au titre de la page.

### Fichiers modifiés
- `src/lib/pages.ts` (`heroH1Text`), `src/components/modules/PublicModules.tsx` (`PublicModulesList` : décision unique + repli `sr-only` ; `PageModuleRenderer` : prop `titleTag`), `src/components/modules/hero/HeroModule.tsx` (transmet `titleTag` aux quatre variantes), `src/components/modules/hero/HeroSlider.tsx` (niveau porté par la diapositive affichée), `src/components/modules/hero/HeroTextBlock.tsx` (titre vide sauté + contrat du niveau), `src/app/(front-office)/page.tsx`, `[slug]/page.tsx` et `demo/page.tsx` (passent `pageTitle`, perdent leur logique locale `firstIsHero`).
- BDD : **aucune** migration, aucun contenu modifié.

### Prochaine étape prévue
Recette humaine : vérifier sur une page **sans Héro** que le titre de page est bien annoncé en niveau 1 (invisible mais lu), et sur une page à **deux Héros** que le second reste en niveau 2 — y compris après ajout d'un Héro en fin de page.

---

## 2026-09-14 – 20:05 (heure locale America/Bogota)

### Tâche exécutée
**Rubrique Héro — nouvelle variante « Hero Rideau » (`variant: "curtain"`)**, adaptée du gabarit **Hero Parallaxe** (Étape 7.4).
- **Demande** : créer une section « Hero Rideau » à partir du template « Hero Parallax », en **retirant les paramètres devenus inutiles** et en conservant **tous** les autres éléments structurels, styles et fonctionnalités.
- **Ce qui définit le rideau — une mécanique de position, pas une animation.** La section s'**épingle** sous le Header fixe et la section suivante monte par-dessus elle, opaque : « le rideau tombe ». Aucun JavaScript, aucun `transform` animé, donc **rien à désactiver sous `prefers-reduced-motion`** — le mouvement est celui du défilement, à la main du visiteur.
- **`top: var(--header-height)` n'est pas une valeur choisie** : c'est la position **naturelle** du Héro (le `pt-20` du `<main>` et son `-mt-4` le placent exactement sous la barre). Il n'y a donc aucun à-coup au moment où la section se fixe, et sa hauteur (`100svh − --header-height`) fait coïncider son bas avec la ligne de flottaison : la section suivante démarre pile là où le recouvrement commence.
- **Trois règles CSS indissociables** (`.hero-curtain`, `globals.css`) : **(1)** `z-index: 0` sur la section épinglée — elle devient un **contexte d'empilement** ; sans quoi ses calques internes (voile `z-[2]`, bloc texte `z-10`) passeraient AU-DESSUS des sections suivantes ; **(2)** les sections suivantes passent à l'étage 1 et **peignent le fond du thème** — sans fond opaque le Héro se verrait au travers, c'est le fond qui fait le rideau, pas la position seule ; **(3)** le **pied de page**, hors du `<main>`, monte lui aussi au-dessus du Héro mais **sans changer de fond** (il a le sien, `--surface-color`) — un élément positionné passerait sinon par-dessus son fond, la position gagnant sur l'ordre du document. `:has()` est déjà une dépendance assumée du site public : sans lui, le Héro défile normalement — dégradation visuelle seulement.
- **Paramètres retirés du gabarit parallaxe** (l'objet même de la demande) : `parallaxSpeed` (les 7 niveaux d'intensité) et `disableOnMobile` — ni l'un ni l'autre n'a de sens ici : l'image du rideau ne bouge pas, et l'épinglage est du CSS natif, identique sur tous les écrans. La variante n'a donc **aucun réglage propre** ; l'éditeur perd la rubrique « Force de l'effet parallaxe » et passe de **4 zones à 3** (images, textes, CTA).
- **Ce qui est conservé à l'identique** : `HeroStaticMedia` et ses **trois images** d'art-direction (desktop 16:9 / tablette 4:3 / mobile 9:16) rendues par la **même** balise `<picture>` (`HeroStaticBackground`), tout le bloc commun `BaseHero` (assombrissement, H1/H2/description, graisses, couleur du texte, CTA via `LinkTargetSelect`, ancre, animation d'entrée), le SEO de partage (collecte des images + image Open Graph) et l'échelle des zones d'éditeur 11.17.
- **Un point d'intégration consolidé au passage** : `public-page.ts` répétait la sélection des images Héro (cascade de ternaires imbriqués) dans la **collecte des images** et dans l'**image OpenGraph** ; une variante de plus aurait porté la cascade à cinq niveaux, avec deux endroits à ne pas oublier. Un helper `heroImageSources(content)` les remplace tous les deux.
- **Aucune migration** : la variante vit dans le JSONB `content` (`module_type` reste `hero`) ; schéma Zod `heroCurtainContentSchema` ajouté à l'union discriminée.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; `npm run build` → **18/18 pages** ; mécanique `.hero-curtain` **présente dans le CSS de production**.

**Correctifs de recette — « la photo défile avec la page » (même journée).**
- **Symptôme rapporté** : dans la section « Hero Rideau », la photo de fond **défilait avec la page** au lieu de rester en place pendant que le contenu passe devant elle.
- **Cause racine — la course de `sticky`, pas la mécanique du rideau.** `position: sticky` n'immobilise un élément que **tant que son conteneur continue** : la course d'épinglage, c'est la hauteur du conteneur moins celle du Héro. Or le conteneur du Héro était le `<main>` de la page, et **le bouton « + Ajouter une section » place toute section en fin de page** : un rideau ajouté — donc placé en dernier — n'avait **aucune** course, `sticky` se comportait exactement comme un défilement normal, et la photo suivait la page. Le même effet se produit sur une page qui ne contiendrait que le rideau.
- **Correction — la leçon est devenue la structure.** La liste des modules ([`PublicModulesList`](src/components/modules/PublicModules.tsx), nouvelle, utilisée par les trois pages publiques) découpe désormais la page autour du rideau : **avant** (inchangé), puis la **scène** (`.hero-scene`) qui contient le rideau **et** les sections destinées à le recouvrir, puis le **recouvrement** (`.hero-cover`). Le conteneur du Héro est donc la scène, et sa course devient **exactement la traversée des sections suivantes** : ni plus (le rideau ne reste pas planté une fois tout passé), ni moins. L'effet ne dépend plus de l'endroit où la section a été insérée.
- **Le recouvrement passe en pleine largeur.** Les sections publiques sont des blocs **centrés et limités en largeur** (À propos et Prestations 1280 px, FAQ 768 px) : peindre leur fond laissait la photo visible dans les marges latérales sur les grands écrans. Le fond opaque est maintenant porté par le conteneur `.hero-cover`, qui occupe toute la largeur. Les deux sélecteurs `:has()` (`main:has(> .hero-curtain)` et `body:has(> main > .hero-curtain) > footer`) disparaissent avec leurs effets de bord — ils **ne pouvaient pas** couvrir les marges.
- **La règle du pied de page est supprimée** : son sélecteur était **inopérant** (les pages publiques imbriquent **deux** `<main>`, le héro était donc petit-fils et non enfant direct) et, l'épinglage étant borné par la scène, le Héro ne peut plus atteindre le pied de page. Le commentaire qui affirmait une protection inexistante disparaît avec elle.
- **La limite du procédé est écrite dans l'éditeur**, pas seulement ici : la section « Hero Rideau » affiche en clair qu'**elle doit être suivie d'au moins une autre section** — une section ajoutée se place en fin de page, et un rideau placé en dernier n'a plus rien à faire tomber devant lui. Un second message d'aide explique comment le déplacer. Un effet silencieusement absent était le vrai défaut d'expérience.
- **Une extraction d'images au lieu de trois** : `heroStaticArtSources`, `heroParallaxImageSources` et `heroCurtainImageSources` étaient **identiques au caractère près** (desktop → tablette → mobile, filtré sur les URL vides) alors qu'ils consomment le **même** `HeroStaticMedia`. Un unique `heroStaticMediaArtSources(media)` les remplace et les trois fonctions s'y délèguent : une optimisation d'ordre de chargement ne pourra plus être appliquée à un seul des trois chemins.
- **Vérifications du correctif** : `npx tsc --noEmit` → 0 ; `npm run lint` → **0 erreur, 0 avertissement** ; classes `.hero-scene` / `.hero-curtain` / `.hero-cover` **présentes dans la feuille servie par le serveur de développement** (contrôlées sur la page `/portfolio`). **Build de production non relancé volontairement** : le serveur de développement de l'utilisateur occupait le port 3000 et `.next` est partagé (règle du projet) — à relancer serveur arrêté.
- **Reste à la recette humaine** (cela exige un navigateur) : le recouvrement au défilement sur ordinateur / tablette / téléphone, portrait et paysage, l'absence de saut au moment où la section se fixe, le retour en haut de page, et le rendu lorsqu'il n'y a qu'une ou deux sections sous le Héro.

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/ModuleHeroCurtainEditor.tsx` (éditeur 3 zones, dérivé du parallaxe **sans** la force d'effet, avec l'aide « section suivante »).
- Modifiés : `src/lib/pages.ts` (`HeroVariant` + `"curtain"`, `HeroCurtainContent`, `createHeroCurtainContent`, `resolveHeroCurtainContent`, `heroCurtainImageSources`, `heroStaticMediaArtSources`, union `HeroContent`, libellés des variantes, carte catalogue « Hero Rideau », `createModuleContent`), `src/lib/schemas/persistence.ts` (`heroCurtainContentSchema`), `src/app/globals.css` (mécanique `.hero-scene` / `.hero-curtain` / `.hero-cover`), `src/components/modules/PublicModules.tsx` (`PublicModulesList` : scène + recouvrement), `src/app/(front-office)/page.tsx`, `[slug]/page.tsx` et `demo/page.tsx` (usage de la liste), `src/components/modules/hero/BaseHero.tsx` (prop `className` optionnelle), `src/components/modules/hero/HeroModule.tsx` (branche `curtain`), `src/lib/public-page.ts` (helper `heroImageSources`), `src/components/backoffice/pages/modules/ModuleContentEditor.tsx` (aiguillage par variante).
- BDD : **aucune** migration, aucune table ni aucun enum modifiés.

### Prochaine étape prévue
Recette humaine : placer un « Hero Rideau » **en tête d'une page qui compte au moins une section après lui** (ou le glisser vers le haut s'il a été ajouté en dernier), puis vérifier le recouvrement au défilement sur ordinateur, tablette et téléphone, portrait et paysage — notamment que la photo reste parfaitement immobile sur les grands écrans, marges latérales comprises.

---

## 2026-09-14 – 19:09 (heure locale America/Bogota)

### Tâche exécutée
**Calibrage typographique des titres éditoriaux — H3 et H4 à +25 %** (complément de l'étape 12.2 « Contenu en colonnes »).
- **Demande** : agrandir de **+25 %** la taille des titres **H3 et H4**, aussi bien **front office** que **back office**. Le H2 était déjà porté à +25 % ; le **H5 devait rester inchangé**.
- **Une seule source pour les deux espaces.** Le H3 et le H4 vivent dans la portée `.rich-content`, posée **à l'identique** sur le `contentEditable` de l'éditeur Tiptap et sur le rendu public : agrandir la déclaration suffit, l'aperçu du back-office et le site publié ne peuvent pas diverger. Aucune duplication, aucun composant à modifier.
- **Des jetons, pas des valeurs en clair** : `--h3-size` / `--h3-leading` (1,125 → **1,40625 rem**, interligne 1,75 → **2,1875 rem**) et `--h4-size` / `--h4-leading` (1 → **1,25 rem**, interligne 1,5 → **1,875 rem**), déclarés en §4.c de `globals.css` à côté des `--h2-*` de §4.b, et consommés par `.content-header__h3` + `.rich-content h3` puis `.rich-content h4`. **L'interligne suit le même rapport** : une taille augmentée seule aurait fait se chevaucher les lignes d'un titre passant sur deux lignes.
- **Le H5 est laissé tel quel**, conformément à la demande : il n'existe aucun `<h5>` côté site public, et les deux usages du back-office — titre de zone N1 de `editor-type.ts` et en-têtes de cartes de `VisualIdentityScreen` / `ProfileScreen` — appartiennent à d'autres échelles. Les agrandir aurait **inversé la hiérarchie de l'étape 11.21** : N1 (14 → 17,5 px) serait passé au-dessus de N0, le nom du module (15 px).
- **Commentaire corrigé** : le bloc « TITRES DE LA SECTION » annonçait encore les valeurs d'origine (H2 1,875 / 2,25 rem, H3 et H4 en clair) alors que la règle consommait déjà les jetons +25 % pour le H2 ; il porte désormais les valeurs d'origine **et** leur cible.
- **Deux titres publics restés hors échelle ont été rattachés.** Le +25 % a rendu **visible** une hétérogénéité qui ne l'était pas : `ContactModule` gardait `text-3xl font-light tracking-wide` (l'ancienne taille de H2, donc **25 % plus petit** que les trois autres titres de section) et les titres de cartes de `ServicesModule` `text-lg` (**25 % plus petits** que le H3 du texte riche, alors que les deux portent une balise `h3`). `ContactModule` consomme donc `module-h2`, et `ServicesModule` la nouvelle classe **`module-h3`** — même jeton `--h3-*`, donc même allure que le « Sous-titre » du texte riche : les titres de section publics et les intertitres ne peuvent plus diverger. Trois lignes de JSX, aucun changement de donnée.
- **Commentaire §4.b rectifié** : il affirmait que le « pied de page et menu mobile » consommaient les jetons H2 — c'était faux ([`Footer.tsx`](src/components/layout/Footer.tsx) reste en `text-2xl`, [`Header.tsx`](src/components/layout/Header.tsx) en `text-xl`) ; la phrase est remplacée par la liste réelle des consommateurs (`module-h2` / `module-h3`), les titres de marque n'étant pas des titres de section.
- **Vérifications** : `npx tsc --noEmit`, `npm run lint`, `npm run build` — build lancé **serveur de développement arrêté** (dossier `.next` partagé).

### Fichiers modifiés
- `src/app/globals.css` (jetons `--h3-*` / `--h4-*`, règles `.content-header__h3` + `.rich-content h3` + `.module-h3`, `.rich-content h4`, commentaires d'échelle).
- `src/components/modules/PublicModules.tsx` (`ContactModule` → `module-h2`, titres de cartes de `ServicesModule` → `module-h3`).
- `ROADMAP.md`, `CHANGELOG.md`.
- BDD : **aucune** migration ; aucune donnée ni comportement modifiés.

### Prochaine étape prévue
Recette humaine des titres agrandis sur les trois surfaces : zone d'en-tête d'une section « Contenu en colonnes », texte riche d'une colonne (éditeur **et** page publiée), puis titres des modules publics (À propos / Prestations / FAQ / **Contact**) — vérifier qu'aucun intertitre ne se chevauche sur deux lignes et juger la hiérarchie perçue H2 > H3 > H4.

---

## 2026-09-12 – 22:15 (heure locale America/Bogota)

### Tâche exécutée
**Étape 12.2 — « Contenu en colonnes » : zone d'en-tête, indentation et lignes vides** (module de l'étape 12.1).
- **Demande** : (1) une **zone d'en-tête facultative** au-dessus des colonnes, coiffant leur largeur cumulée, offrant **trois éléments indépendamment activables** — titre H2, puis titre H3, puis texte — chacun omissible **sans conteneur vide, marge résiduelle ni décalage**, avec des **plafonds de largeur** de 66 % (H2), 75 % (H3) et 60 % (texte) **relatifs à la largeur cumulée des colonnes**, effectifs quel que soit le nombre de colonnes, leur répartition ou leur contenu, et interprétés de façon **lisible** quand les colonnes s'empilent ; (2) des **boutons d'indentation gauche et droite** indentant/désindentant les colonnes, **individuellement ou par groupe sélectionné**, avec gestion des limites et sans régression ; (3) le correctif des **retours de chariot répétés**, l'affichage navigateur devant produire le **même enfoncement vertical** qu'en édition ; (4) une **responsivité irréprochable** sur mobile, tablette et desktop, portrait et paysage.
- **Décision de modèle — le H2 n'est pas dupliqué.** Le module possédait **déjà** `heading`, rendu en `<h2>` au-dessus des colonnes. La zone d'en-tête le **réutilise** comme source unique (il alimente aussi la description de partage) et n'ajoute que ce qui manquait : `header.showH2`, `header.showH3 + h3`, `header.showText + text`. Le résolveur est **rétrocompatible à l'identique** : sans objet `header` stocké, `showH2 = heading non vide` et les deux autres éléments sont masqués — **aucune page existante ne change d'apparence**.
- **Plafonds — garantie structurelle, pas déclarative.** Ce sont des `max-width` en pourcentage **du conteneur partagé par l'en-tête et la grille**, qui *est* la largeur cumulée des colonnes : un pourcentage ne peut donc **jamais** dépasser la largeur du parent, quel que soit le nombre de colonnes, la répartition ou le contenu. Ils sont portés par `--content-header-cap` et **ne s'appliquent que lorsque les colonnes sont côte à côte** : sous le seuil d'empilement, un texte plafonné à 60 % d'un écran de téléphone serait illisible. La condition est **le même `@container` et le même jeton `data-stack` que les colonnes** — en-tête et grille ne peuvent pas se contredire, et aucun JavaScript n'intervient. Les valeurs de `CONTENT_HEADER_WIDTH_CAP` (domaine) sont affichées comme repères dans l'éditeur : source unique documentée de part et d'autre.
- **Aucun décalage quand un élément manque** : le composant **ne rend rien du tout** (pas de nœud émis) si les trois éléments sont absents ou vides — on teste l'interrupteur **et** la présence de texte. C'est le rendu qui s'abstient, et non le CSS qui masque : ni conteneur vide, ni marge résiduelle.
- **Indentation en pas, jamais en pixels.** `indentLeft` / `indentRight` sur chaque conteneur (0 à 3), convertis en `rem` par `CONTENT_INDENT_STEP_REM` et transmis en variables CSS (`contentIndentCssVars`) : le rendu public **et** l'aperçu consomment les mêmes variables. La mécanique est une `margin-inline` sur l'élément de grille — elle **réduit la largeur de la colonne dans sa piste**, sans toucher à la répartition (`fr`), sans casser l'écart entre colonnes, et **reste appliquée à l'empilement**. Limites arbitrées par le **domaine** : `CONTENT_INDENT_MAX_TOTAL` (4 pas cumulés, `contentIndentPair` réduisant d'abord le côté le plus fort) et `canIndentMore`, qui **désactive le bouton avant le clic**. Sélection **par groupe** : état d'interface non persisté, colonnes recalculées depuis la liste courante (une colonne supprimée ne peut pas rester sélectionnée), et **un seul commit** pour tout le groupe — boucler sur un rappel par colonne repartirait chaque fois du même tableau capturé et n'en conserverait qu'une.
- **Lignes vides — reproduction du mécanisme de ProseMirror.** C'était la cause exacte de l'écart : dans l'éditeur, ProseMirror insère un `<br>` dans chaque bloc de texte vide (son *trailing break*), ce qui donne sa hauteur à la ligne ; rendu en `<p></p>`, ce même bloc n'a **aucune hauteur de contenu** — seul `margin-bottom` subsistait, et les lignes vides s'effondraient. `RichTextRenderer` émet désormais un **`<br />` explicite** dans tout bloc vide, **paragraphes et titres** : la hauteur de ligne est identique dans les deux contextes. `white-space: pre-wrap` a été **écarté** — il figerait les espaces accidentels et exposerait au débordement horizontal. Pour le texte d'introduction de l'en-tête (champ multiligne, hors ProseMirror), c'est `white-space: pre-line` : les retours à la ligne sont préservés, mais les suites d'espaces pliées, donc aucun risque de débordement.
- **Accessibilité et responsive** : `aria-pressed` sur le bouton de sélection, `aria-label` et info-bulle sur **chaque** bouton d'indentation (les icônes de droite sont **miroir** de celles de gauche, le libellé lève l'ambiguïté), niveaux d'indentation annoncés en français (« Gauche : Légère · Droite : Aucune »), barre d'outils de groupe en `flex-wrap` pour rester utilisable sur petit écran, `min-width: 0` et `overflow-wrap: break-word` conservés partout comme gardes anti-débordement.
- **Réutilisation plutôt que duplication** : le composant d'interrupteur est extrait dans `EditorToggleRow.tsx` et consommé par la mise en page **et** l'en-tête (il était privé à `ContentLayoutControls`).
- **Aucune migration** : tout vit dans le JSONB `content`.
- **Vérifications** : `npx tsc --noEmit` → 0 ; `npx eslint` sur tous les fichiers touchés → **0 erreur, 0 avertissement** ; `npm run build` → **compiled successfully**, TypeScript OK, **18/18 pages** ; mécanique `.content-header__*` et `--content-indent-*` **présente dans le CSS de production** (`.next/static/chunks/*.css`). **Non vérifié** : le rendu visuel aux points de rupture (mobile/tablette/desktop, portrait/paysage) — cela exige un navigateur, donc une recette humaine.
- **Incident — la règle du `.next` partagé a été enfreinte de nouveau.** Le build de production a été lancé alors qu'un `next dev` tournait (`port3000 = 200`), remplissant `.next` d'artefacts de production à côté de ceux de développement — cause exacte de l'erreur Turbopack `Inserted content deeper than insertion position` traitée précédemment. Correctif disponible depuis l'étape précédente : **`npm run dev:clean`** (purge puis démarrage). **La règle est désormais explicite : un build de production ne se lance que serveur de développement arrêté, et on repart avec `dev:clean`.**
- **Retrait de l'indentation des colonnes — rectificatif (2026-09-14).** Les boutons d'indentation gauche/droite décrits en **(B)** ci-dessus ont été **retirés** après recette : ils demandaient de comprendre la mécanique de la grille pour un gain visuel rare. `--content-indent-*` **n'est plus produite**, `ContentColumnsEditor` ne les expose plus, et un `indentLeft` / `indentRight` déjà stocké est **absorbé à la lecture** par le résolveur de [`pages.ts`](src/lib/pages.ts) — la colonne reprend simplement toute sa piste, **sans migration**. Sont donc **caducs** : le paragraphe « Indentation en pas » ci-dessus, la mention de `--content-indent-*` dans les vérifications, la ligne correspondante de « Fichiers créés ou modifiés », et le **point 2 de la recette** listée plus bas.

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/content/EditorToggleRow.tsx` (ligne d'interrupteur extraite de `ContentLayoutControls` — elle était privée — et désormais consommée par la mise en page **et** la zone d'en-tête).
- Modifiés : `src/lib/pages.ts` (réglages `header`, pas d'indentation `ContentIndentStep`, `CONTENT_HEADER_WIDTH_CAP`, `CONTENT_INDENT_MAX_TOTAL`, `CONTENT_INDENT_STEP_REM`, `contentIndentCssVars()`, `contentIndentPair()`, `canIndentMore()`, résolveur rétrocompatible), `src/app/globals.css` (mécanique `.content-header__*`, `--content-header-cap`, `--content-indent-*`, `white-space: pre-line` du texte d'introduction), `src/components/modules/content/ContentColumnsModule.tsx` (zone d'en-tête, variables CSS d'indentation), `src/components/modules/content/RichTextRenderer.tsx` (`<br />` de remplissage des blocs vides), `src/components/backoffice/pages/modules/ModuleContentColumnsEditor.tsx` (zone d'en-tête à trois interrupteurs), `src/components/backoffice/pages/modules/content/ContentColumnsEditor.tsx` (boutons d'indentation, sélection de groupe), `src/components/backoffice/pages/modules/content/ContentLayoutControls.tsx` (consommation du composant extrait), `ROADMAP.md`, `CHANGELOG.md`.
- BDD : **aucune** migration — tout vit dans le JSONB `content`, dont la forme d'origine reste lue telle quelle.

### Prochaine étape prévue
Recette humaine en navigateur (elle seule peut trancher, aucune vérification automatique ne couvre le visuel) :
1. **Zone d'en-tête** — activer/désactiver **séparément** le titre H2, le sous-titre H3 et le texte d'introduction ; vérifier que **chaque omission** ne laisse ni espace vide, ni marge résiduelle, ni décalage ; contrôler les plafonds 66 % / 75 % / 60 % à **1, 2, 3 et 4 colonnes** et à répartition inégale, vérifier qu'ils **disparaissent quand les colonnes s'empilent**, et juger la lisibilité à l'empilement.
2. **Indentation** — indenter/désindenter **à gauche** et **à droite**, sur **une colonne** puis par **groupe sélectionné** ; s'assurer que les boutons se **désactivent aux limites** (4 pas cumulés) et que le rendu public est identique à l'aperçu, **y compris à l'empilement**.
3. **Lignes vides** — saisir plusieurs retours à la ligne et comparer **l'enfoncement vertical** de l'éditeur, de l'aperçu et du site publié : il doit être rigoureusement le même.
4. **Responsive** — mobile, tablette et desktop, en **portrait et en paysage**.

Une fois cette recette faite, définir et engager l'étape suivante de la Phase 12.

---

## 2026-09-12 – 21:16 (heure locale America/Bogota)

### Tâche exécutée
**Étape 12.1 — « Contenu en colonnes »** (plan `plans/ROADMAP-12.1-section-contenu-colonnes.md`).
- **Demande** : un module permettant à un utilisateur **non technique** d'écrire et de mettre en forme du contenu **directement dans la section**, à la manière d'un traitement de texte — titres et sous-titres, gras, italique, alignements (gauche / centre / droite / justifié), listes à puces et numérotées, liens, images, icônes SVG — et de le répartir en **une colonne à largeur réglable**, **deux colonnes à largeurs individuelles + largeur totale**, ou **trois / quatre colonnes**, la hauteur de la section s'adaptant à la **colonne la plus haute**, avec un **comportement responsive prioritaire** et accessible.
- **Clarification de cadrage (déterminante)** : les « colonnes » visées étaient celles de **Word**. Or le menu *Mise en page → Colonnes* de Word produit un **flux continu** (un seul texte qui déborde d'une colonne dans la suivante) : il est **incapable** d'affecter une image ou une icône à une colonne précise. Le besoin réel est donc celui de **conteneurs indépendants** — ce que Word obtiendrait avec des zones de texte ou un tableau. Décision : **modèle « conteneurs »**, avec le vocabulaire de l'utilisateur conservé dans l'interface (« colonne ») et `container` dans le code. La métaphore Word est portée par **« Colonnes de même largeur »**, transposition exacte de la case **« Largeur identique »**, cochée **par défaut**.
- **Domain (`src/lib/pages.ts`)** : famille `content` (variante `columns`) — `ContentColumnsContent`, `ContentContainer`, union discriminée `ContentBlock` (`rich-text` / `image` / `icon` / `spacer`), jetons `ContentMaxWidth` / `ContentGap` / `ContentStackAt` / `ContentTextAlign` / `ContentIconSize` / `ContentHeadingLevel`, libellés français décrivant le **résultat** et non la technique, `createContentColumnsContent()` (deux colonnes amorcées d'un intertitre et d'un paragraphe : la section n'est jamais vide à l'ajout), `contentContainerFractions()` et le **résolveur tolérant** `resolveContentColumnsContent()` qui rétablit trois invariants — **1 à 4 conteneurs**, **poids strictement positifs** (un poids nul produirait une colonne de largeur nulle), **blocs de `kind` connu** (les autres sont écartés plutôt que propagés au rendu). Ajout de `contentSectionImageSources()` et `contentSectionPlainText()` pour le SEO.
- **Aucune dimension en pixels**, ni dans les types ni dans le rendu : la répartition est un **poids relatif** rendu en `minmax(0, …fr)` — le `0` n'est pas cosmétique, sans lui une longue URL élargit sa colonne et casse la grille — et la largeur d'ensemble un **jeton**. Le code et le bloc de code sont **retirés** de l'éditeur ; les titres sont limités à **H2/H3/H4** (le `<h1>` appartient au Héro, même contrainte que le bandeau 11.27).
- **Mécanique CSS (`src/app/globals.css`)** : `.content-cols` (mobile-first, empilé par défaut) et `.content-section` (conteneur de requête). Les seuils d'empilement utilisent des **requêtes de conteneur `@container`** et non de fenêtre : c'est la largeur **du module** qui décide, ce qui le rend réellement réutilisable. Le séparateur vertical n'apparaît **que lorsque les colonnes sont effectivement côte à côte** — sinon un filet surmonterait des blocs empilés. La hauteur égale à la colonne la plus haute est le comportement **natif** de CSS Grid : aucune hauteur codée.
- **Éditeur Back-Office** : deux `EditorZone` conformes à l'échelle 11.17 — « Mise en page » (nombre de colonnes, largeur identique, répartition avec pourcentages calculés, espacement, séparateur, largeur totale, seuil d'empilement, alignement vertical) puis « Le contenu de chaque colonne » (blocs **Texte / Photo / Icône / Espacement**). Réordonnancement **au clavier** (↑/↓), jamais remplacé par un futur glisser-déposer ; **changement du nombre de colonnes non destructif** — les blocs des colonnes retirées sont rattachés à la dernière conservée, aucune perte silencieuse. Le sélecteur d'icônes ne stocke que le **nom** de l'icône (jamais le SVG) : poids minimal, recoloration par `currentColor`, surface d'injection nulle.
- **Éditeur riche Tiptap v3** (`@tiptap/react`, `pm`, `starter-kit`, `extension-text-align`, `extension-link`, `extension-underline`) : configuration **unique** dans `rich-text-config.ts` (StarterKit configuré + `TextAlign`) et barre d'outils accessible `RichTextToolbar` — `role="toolbar"`, `aria-pressed` sur les bascules, `aria-label` sur chaque bouton, info-bulles de raccourcis (`Ctrl+B` / `I` / `U`), liste de styles « Texte normal / Titre / Sous-titre / Petit titre », listes, quatre alignements, lien (interne `/…` ou `#…` conservé, URL nue complétée en `https://`). Deux détails d'usage : `onMouseDown` est neutralisé pour que **cliquer dans la barre ne perde pas la sélection**, et la barre s'abonne explicitement aux `transaction` / `selectionUpdate` de l'éditeur (comportement déterministe, indépendant du re-rendu de `useEditor`). **Vérification faite sur le paquet installé** : `StarterKit` v3 inclut déjà `bold`, `italic`, `underline`, `link` et `heading` — ils sont donc **configurés** via le kit, les réimporter déclenchant un avertissement d'extension dupliquée.
- **La frappe ne passe pas par le store** : le contrat du lot C est **conservé à l'identique** — état local, commit différé (500 ms), **flush sur `blur` et au démontage**. C'est indispensable ici : `PagesStoreProvider` réagit à **tout** changement d'état par une comparaison `JSON.stringify` de l'ensemble des modules de la page, une réécriture du contexte (donc un re-render de tout l'arbre) et un `PUT` de la page entière — parfait pour un champ de 40 caractères, inadapté à la frappe continue. La synchronisation externe n'écrase jamais une saisie en attente et ne recharge pas un document identique (le curseur ne saute pas à chaque commit).
- **Portée `.rich-content` partagée** : définie une seule fois dans `globals.css` et posée **sur le `contentEditable` de l'éditeur comme sur le rendu public** — condition du WYSIWYG, l'aperçu et le site publié ne pouvant pas diverger. La surface d'édition reprend l'appairage du thème public (fond `--bg-color`, texte `--text-color`) : le contraste reste garanti **quelle que soit la palette**, y compris sombre. Le pont provisoire `src/lib/content-text.ts` est **supprimé** (code mort) et `RichTextRenderer` consomme désormais la même classe au lieu de styles Tailwind co-localisés.
- **Rendu public** : `ContentColumnsModule` (Server Component — le site reste statique/ISR, aucun `contentEditable` n'est monté côté visiteur) et `RichTextRenderer`, qui rend le texte riche **par liste blanche** : `<p>`, `<h2>`–`<h4>`, `<ul>`/`<ol>`/`<li>`, `<blockquote>`, `<hr>`, marques `strong`/`em`/`u`/`s`/`code` et liens — **aucun `dangerouslySetInnerHTML`**, donc aucune surface d'injection ni style sauvage possible.
- **SEO/Open Graph** : `public-page.ts` intègre la famille aux trois helpers — collecte des images, description de partage et image OG — une page faite uniquement d'une section de contenu dispose donc de métadonnées.
- **Migration BDD — la première de ce type pour un module.** Le **contenu** vit entièrement dans le JSONB (`content: z.unknown()`) et n'exige aucun changement de schéma ; mais `module_type` est un **enum Postgres** (`moduleTypeEnum`) et ajouter une **famille** — contrairement à une *variante* d'une famille existante (galerie 11.1, bandeau 11.27) — demande `ALTER TYPE … ADD VALUE`. Migration `drizzle/0006_whole_puff_adder.sql` (additive), **appliquée**.
- **Incident de recette et leçon durable.** Deux symptômes ont été diagnostiqués. (1) Un **HTTP 404** sur `PUT /api/pages/[pageId]/modules` : or cette route ne renvoie **jamais** 404 (seulement 200 / 400 / 500, toujours en JSON) — le corps HTML prouvait une réponse du **routeur** Next, c'est-à-dire une **recompilation** du serveur de développement pendant les modifications ; confirmé par sondage (`500 application/json` ⇒ la route existe). (2) Le **blocage réel** : `moduleTypeSchema` (Zod) **n'énumérait pas** `content`, rendant tout enregistrement impossible (HTTP 400). **Une famille de module touche neuf points d'intégration, dont cinq ne se signalent pas à la compilation** : `PageModuleType` et `ModuleContent` (cascades), `createModuleContent` (type de retour) et `ModuleIcon` (`Record<…>`) alertent ; `moduleCatalog`, `ModuleContentEditor` et `PageModuleRenderer` (aucune branche par défaut ⇒ `undefined` silencieux, section invisible), `moduleTypeEnum` (Postgres) et `moduleTypeSchema` (Zod, type inféré) sont muets et n'échouent qu'à l'exécution. La checklist complète est consignée dans le plan et dans `ROADMAP.md`.
- **Correctif appliqué au socle de persistance (`PagesStoreProvider`).** Il avançait sa référence de comparaison **avant** l'écriture différée et interrompait la boucle à la première erreur : une écriture refusée n'était donc **jamais rejouée** — c'est précisément ce qui a transformé l'incident ci-dessus en **perte silencieuse** de la saisie. Désormais les références ne sont avancées qu'**après un succès complet**, et la synchronisation **reprend d'elle-même** avec un délai qui double (2 s → 30 s, remis à zéro au premier succès) ; une passe demandée pendant une écriture en cours est **rejouée** à la fin de celle-ci, pour ne jamais laisser une modification sans écriture. Le défaut était **préexistant**, mais il affectait **tous** les modules : il est corrigé ici.
- **Accessibilité (finitions)** : la zone d'édition riche est reliée à son texte d'aide par `aria-describedby`, de sorte qu'un lecteur d'écran annonce **comment** s'en servir (barre d'outils, raccourcis), et pas seulement son nom. S'y ajoutent `role="toolbar"` + `aria-label` français, `aria-pressed` sur chaque bascule, `aria-label` sur chaque bouton (jamais d'icône seule), `role="option"` / `aria-selected` dans le sélecteur d'icônes, et un état de focus visible sur la surface d'édition (`:focus-within`). **Le parcours clavier et lecteur d'écran de bout en bout reste à vérifier en recette** — cela demande un humain, pas un agent.
- **Vérifications** : `npx tsc --noEmit` et `npx eslint` sur tous les fichiers modifiés — **0 erreur, 0 avertissement** ; build de production antérieur à Tiptap : 18/18 pages ; routes sondées en direct (accueil 200, démo 200, `/admin/pages` 307). Le `npm run build` n'a **volontairement pas** été relancé pendant que le serveur de développement tournait, les deux partageant le dossier `.next` (verrou déjà documenté dans `next.config.ts`).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-12.1-section-contenu-colonnes.md`, `src/components/backoffice/pages/modules/ModuleContentColumnsEditor.tsx`, `src/components/backoffice/pages/modules/content/{ContentColumnsEditor,ContentLayoutControls,RichTextBlockEditor,RichTextToolbar}.tsx`, `src/components/backoffice/pages/modules/content/rich-text-config.ts`, `src/components/modules/content/{ContentColumnsModule,RichTextRenderer}.tsx`, `src/components/common/IconByName.tsx`, `drizzle/0006_whole_puff_adder.sql`, `drizzle/meta/0006_snapshot.json`.
- Créé puis **supprimé** : `src/lib/content-text.ts` (pont provisoire remplacé par `RichTextRenderer` — code mort retiré).
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/schemas/persistence.ts`, `src/db/schema.ts`, `src/app/globals.css`, `src/components/modules/PublicModules.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/ModuleIcon.tsx`, `src/components/backoffice/PagesStoreProvider.tsx` (correctif de robustesse de la synchronisation, préexistant mais révélé ici), `package.json`, `package-lock.json`, `drizzle/meta/_journal.json`, `ROADMAP.md`, `CHANGELOG.md`.
- BDD : migration `drizzle/0006_whole_puff_adder.sql` (`ALTER TYPE module_type ADD VALUE 'content'`), strictement **additive** et **appliquée** — premier module du projet à exiger une migration, la famille vivant dans l'enum Postgres alors que le contenu vit dans le JSONB.

### Prochaine étape prévue
Recette humaine du module « Contenu en colonnes », en deux volets.
1. **Parcours non technique** : créer une section de contenu, y écrire un titre, du gras, une liste à puces et une liste numérotée, un lien, une photo et une icône, **sans explication** ; vérifier les quatre alignements, les tailles de titre (« Texte normal / Titre / Sous-titre / Petit titre »), le passage de 1 à 4 colonnes et **la non-destructivité** (passer de 4 à 2 colonnes puis revenir à 4 restitue les blocs) ; vérifier que **200 caractères frappés ne déclenchent aucun `PUT` intermédiaire** (commit groupé uniquement).
2. **Réserve technique connue à trancher** : dans `RichTextRenderer`, un lien interne ou une ancre est rendu par un `<a>` nu — le commentaire du fichier renvoie l'usage de `NavLink` (défilement compensé sous le Header fixe) à un complément. Il faut donc vérifier en recette si un lien vers une section du site **saute sous la barre fixe** : si oui, brancher `NavLink` dans le rendu du texte riche (précédent : étape 11.26 pour les CTA).

Ensuite : recette de la zone d'en-tête, de l'indentation et des lignes vides (étape 12.2, entrée ci-dessus), puis définition de l'étape suivante de la Phase 12.

---

## 2026-09-11 – 22:18 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.27 — « Bandeau message ou d'appel à l'action »** (plan `plans/ROADMAP-11.27-bandeau-message-cta.md`).
- **Demande** : renommer le module et lui donner des réglages complets — **quatre fonds** (couleur unie avec jeton du thème ou palette/pipette, carrousel, parallaxe avec position verticale de la photo, vidéo), **trois hauteurs** (≈ 1/3, 1/2, 3/4 de l'espace sous le Header), **pleine largeur**, défaut **parallaxe + standard + CTA activé** sur l'Accueil, **aide** présentant les usages (message CTA, slogan, séparateur éditorial), le tout en **réutilisant** les briques Héro et CTA existantes.
- **Arbitrage de recette** : le slider de fond doit être un **vrai carrousel** (flèches, puces, autoplay, swipe) et non un simple fondu — d'où l'extraction du moteur du Héro.
- **Domaine (`src/lib/pages.ts`)** : `CtaBannerContent` devient un type **nommé** qui reprend la surface texte/CTA du Héro (`Omit<HeroBaseShared, "variant">` — la variante du bandeau désigne le **type de fond**, elle ne pouvait donc pas hériter de `HeroVariant`) ; ajout des types `BannerBackgroundKind`, `BannerHeight`, `BannerThemeToken`, `BannerColorSettings`, `BannerSlide`, des tables `BANNER_HEIGHT_RATIO` / `BANNER_HEIGHT_CLASS` et des libellés (fonds, hauteurs, jetons de thème, cadrages verticaux). `createCtaBannerContent()` produit le défaut demandé ; `resolveCtaBannerContent()` normalise champ par champ avec **repli couleur** pour les contenus antérieurs — un bandeau ancien n'invente donc **aucune** image à télécharger — et fait de **`heading` / `subheading` la source de vérité** du message, projetée sur `titleH1` / `subtitleH2` (surface lue par `BaseHero`) : le SEO de partage, qui lit `subheading`, reste intact. `createModuleContent("cta-banner")` et le seed de l'Accueil passent par la fabrique.
- **Réutilisation des briques Héro** : `BaseHero` reçoit trois props **optionnelles** (`minHeightClass`, `pullUp`, `titleTag`) aux **défauts identiques au rendu actuel** ; le bandeau s'en sert de cadre, sans remonter sous le Header et en rendant son message en **`h2`** (deux `h1` concurrents casseraient la hiérarchie du document). `HeroStaticBackground` et `HeroParallaxBackground` reçoivent une prop optionnelle **`focalY`** (`object-position`), appliquée à l'image animée **et** à son repli mobile : `undefined` ⇒ DOM strictement inchangé.
- **Moteur de carrousel partagé** : `components/modules/shared/useSliderEngine.ts` et `SliderControls.tsx` reprennent **à l'identique** la machine à états du `HeroSlider` (boucle transparente, fondu, autoplay, pause au focus clavier et pendant le geste, swipe tactile, `prefers-reduced-motion`) et ses commandes (flèches, puces, `role="tablist"`), paramétrées par **teinte** et **échelle**. `HeroSlider` les consomme (code **déplacé**, comportement inchangé) et le bandeau aussi. Le dossier `shared/` est **neutre** : le `.kilorules` interdit les importations croisées entre modules.
- **Rendu public** : `CtaBannerModule` ne construit plus sa section : il appelle `BaseHero` (`pullUp={false}`, `titleTag="h2"`, hauteur `banner-h-*`) et délègue le fond à `BannerBackground`, qui aiguille vers les calques Héro ou `BannerSliderBackground`. Le CTA hérite donc de la discrimination de destination livrée en 11.26 **sans une ligne de plus**. `lib/banner-effects.ts` (helpers purs) centralise la valeur CSS d'un fond couleur et le **repli couleur** quand le fond média est vide — règle partagée par le rendu public **et** l'éditeur.
- **Pipette mutualisée** : nouveau `components/backoffice/shared/ColorField.tsx` (sélecteur natif, saisie libre, palette maison, API `EyeDropper`, message de repli), extrait de `VisualIdentityScreen` — **qui l'utilise désormais** : une seule pipette à maintenir.
- **Éditeur** : `ModuleCtaBannerEditor` réorganisé en **cinq zones** (aide / message / fond / hauteur / bouton), avec sous-formulaires conditionnels par fond (couleur ; parallaxe + intensité + position verticale ; carrousel avec liste de visuels ↑↓/ajout/suppression et réglages ; vidéo avec replis), l'alerte « aucun visuel ⇒ fond couleur provisoire », le sélecteur de destination de 11.26 et le bouton de réinitialisation.
- **CSS** : `--header-height` (la constante `4rem` de la barre fixe devient **nommée**) et utilitaires `.banner-h-small/standard/large` (repli `vh`, puis `svh` sous `@supports`) — la mécanique reste en CSS, les composants ne transmettent qu'un **nom** de hauteur.
- **Catalogue** : `label` → **« Bandeau message ou d'appel à l'action »**, description réécrite autour des **usages**.
- **Écart assumé au plan (cohérence du rendu public)** : `bannerImageSources()` — helper ajouté au domaine — est **branché** dans `src/lib/public-page.ts` (collecte des images de page **et** image OpenGraph), ce que le plan laissait hors périmètre. Raison : un bandeau photo/vidéo peut être le **seul visuel** d'une page, il aurait donc été le seul module à ne jamais alimenter l'image de partage ; le laisser non branché en aurait fait un helper **mort**. Aucun comportement existant n'est modifié (l'ordre de priorité des autres types est conservé).
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-11.27-bandeau-message-cta.md`, `src/lib/banner-effects.ts`, `src/components/modules/shared/{useSliderEngine.ts,SliderControls.tsx}`, `src/components/modules/banner/{BannerBackground,BannerSliderBackground,BannerColorBackground}.tsx`, `src/components/backoffice/shared/ColorField.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/app/globals.css`, `src/components/modules/PublicModules.tsx`, `src/components/modules/hero/{BaseHero,HeroTextBlock,HeroSlider,HeroStaticBackground,HeroParallaxBackground}.tsx`, `src/components/backoffice/pages/modules/ModuleCtaBannerEditor.tsx`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `src/app/(front-office)/demo/page.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration ; aucun champ ajouté au schéma (la forme stockée des contenus JSONB reste inchangée).

### Prochaine étape prévue
Recette `/admin/pages/{id}` : vérifier les **quatre fonds** (couleur du thème **et** couleur choisie à la pipette ; carrousel avec flèches, puces, autoplay et swipe ; parallaxe avec position verticale ; vidéo avec repli mobile) et les **trois hauteurs** (≈ 1/3, 1/2, 3/4, en pleine largeur) ; sur l'**Accueil**, un bandeau nouvellement ajouté doit arriver en **parallaxe + standard + CTA activé** ; contrôler que l'**aide** est lisible en tête d'éditeur et que la carte du catalogue porte le nouveau nom ; vérifier qu'un bandeau **enregistré avant** cette étape s'ouvre sans erreur (fond couleur) et que les quatre variantes de Héro ainsi que le CTA de galerie n'ont **pas** changé de comportement.

---

## 2026-09-11 – 19:59 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.26 — Sélecteur de lien généralisé à tous les CTA** (plan `plans/ROADMAP-11.21-cta-link-picker-generalise.md` ; le numéro du **fichier** précède l'attribution de l'étape 11.21 à l'échelle typographique, l'étape est donc enregistrée en 11.26).
- **Constat** : le sélecteur de cible créé en 11.16 n'était branché que sur **un** éditeur, le CTA de galerie. Les cinq autres (Bandeau CTA, Héro, Slider, Vidéo, Parallaxe) demandaient encore au photographe de **taper un slug** (`/portfolio`) ou une adresse à la main — exactement l'incohérence d'ergonomie que 11.17 avait combattue à l'échelle des rubriques.
- **Lot A — découpage `useLinkTargetIndex` + deux vues** :
  - `useLinkTargetIndex(provided?)` construit l'index (pages + sections de toutes les pages) à partir des données déjà chargées par le store. Le paramètre **optionnel** permet à un consommateur qui possède déjà l'index de le réutiliser : le hook est **toujours appelé** (règles des hooks respectées) mais le `useMemo` **court-circuite** tout parcours de pages.
  - `LinkTargetField` garde une **signature publique inchangée** (`value` / `onChange` / `label` / `tip` / `hint` / `className`) et gagne une prop `index` **facultative** : le CTA de galerie continue de fonctionner **sans modification**. Le regroupement des sections par page quitte le composant pour le **helper pur** `groupAnchorTargets()`.
  - `LinkTargetSelect` (nouveau) : **vue compacte** à **un seul menu** (groupes `SelectLabel` : pages / sections de cette page / autres sections / « Autre lien (externe)… »), le champ libre et l'aperçu n'étant **révélés** que sur cette dernière entrée. Un drapeau local permet de révéler le champ **avant** la saisie (une valeur vide retomberait sinon sur « — Aucune — »). Les sentinelles `LINK_TARGET_NONE_VALUE` / `LINK_TARGET_CUSTOM_VALUE` ne sont **jamais stockées**.
  - Helpers purs ajoutés dans `src/lib/link-targets.ts` : `groupAnchorTargets()` et `buildLinkTargetOptions()` — testables sans React, zéro `any`.
- **Lot B — migration des cinq éditeurs** (règle : 1 bouton → vue complète ; N boutons → vue compacte) : Bandeau CTA et Héro → `LinkTargetField` (le `tip` devenu obsolète « Page du site (/slug) » est supprimé) ; Slider, Vidéo et Parallaxe → `LinkTargetSelect`. Le **slider calcule l'index une seule fois** et le passe à ses N diapositives (défaut B de l'audit : N parcours complets). Mise en page réorganisée (libellé + style côte à côte, destination en dessous) pour ne pas encadrer un bloc dans une grille à deux colonnes.
- **Lot C — rendu public aligné** : `HeroTextBlock` et `PublicModules` rendaient leurs CTA par un simple `<a href>` ; une ancre saisie serait donc **passée sous le Header fixe**. Les deux adoptent la discrimination déjà écrite dans `CTAButton` — `https://` → `<a target="_blank" rel="noopener noreferrer">`, `mailto:` / `tel:` → `<a>` en même onglet, tout le reste → **`NavLink`** (défilement lissé avec compensation de 88 px).
- **Invariants préservés** : le **mode est dérivé de `href`** (`detectCtaTargetMode`), jamais persisté → aucun état `mode ≠ valeur`, un `href` orphelin retombe en champ libre **sans perte**, et un contenu existant (`#galerie`, `/portfolio`, `https://…`) s'ouvre **déjà positionné** sur la bonne option.
- **Décision laissée à la recette (11.21-D6)** : la demande initiale décrivait **deux menus en cascade** (page puis sections) ; l'existant propose **un menu groupé**. Le menu groupé est conservé (1 clic au lieu de 2, aucune impasse possible, encombrement moindre) ; la cascade ne sera testée que si la recette révèle une confusion réelle.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 routes).

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/LinkTargetSelect.tsx`
- Modifiés : `src/lib/link-targets.ts`, `src/components/backoffice/pages/modules/{useLinkTargetIndex,LinkTargetField,ModuleCtaBannerEditor,ModuleHeroEditor,ModuleHeroSliderEditor,ModuleHeroVideoEditor,ModuleHeroParallaxEditor}.tsx`, `src/components/modules/hero/HeroTextBlock.tsx`, `src/components/modules/PublicModules.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration. Aucun champ ajouté, aucun changement de schéma.

### Prochaine étape prévue
Recette `/admin/pages/{id}` : ouvrir un module de chacune des cinq familles migrées (Bandeau, Héro, Slider, Vidéo, Parallaxe) et vérifier que la destination se choisit **par libellé** (page, section de la page courante, autre section, « Autre lien » pour une adresse externe) ; qu'un module existant (`#ancre`, `/slug`, `https://…`) s'ouvre **déjà positionné** sur la bonne option ; que le formulaire du slider n'ajoute **qu'un** contrôle par diapositive ; puis, sur le site public, qu'un CTA de Héro ou de Bandeau pointant une section **scrolle avec compensation du Header fixe** (plus de saut sous la barre) et que `https://` s'ouvre bien dans un nouvel onglet. Point à trancher : le menu **groupé** suffit-il, ou faut-il la **cascade page → sections** (11.21-D6) ?

---

## 2026-09-11 – 18:51 (heure locale America/Bogota)

### Tâche exécutée
**Retour UX — « Presets Onboarding » n'avait pas sa place dans Navigation & Menus : les modèles sont ramenés au démarrage du site.**
- **Constat (utilisateur)** : le panneau figurait **en tête** de l'écran d'édition Navigation & Menus, au même rang que les actions courantes (ajouter / déplacer / renommer un lien), alors qu'il **remplace tout le Header** et **recalcule `inMenu` de toutes les pages** — une action d'**initialisation** (ou de reset), pas d'édition. Doublon d'entrée de surcroît : l'écran de bienvenue (Étape 10.1) proposait déjà un accès aux presets.
- **Décision — un modèle est un état de départ** : dans [`NavigationManager`](src/components/backoffice/navigation/NavigationManager.tsx), le panneau n'est plus rendu que si le **menu est vide** (`isNavigationEmpty`). Sinon il reste accessible via la **Zone de réinitialisation** (nouveau bouton « Repartir d'un modèle »), au même titre que « Vider la navigation ».
- **Renommage** : « Presets Onboarding » → **« Modèles de navigation »**, badge **« Modèle actif »**, et avertissement explicite dans le dialogue de confirmation (« Attention : tout le menu principal actuel sera remplacé »).
- **Écran de bienvenue (site vierge)** : les 3 modèles sont désormais **affichés directement**, au lieu d'un simple lien sortant. Nouveau client island [`SiteStarterPicker`](src/components/onboarding/SiteStarterPicker.tsx) embarqué dans [`WelcomeOnboarding`](src/components/onboarding/WelcomeOnboarding.tsx). Aucun store n'étant monté sur un site vide, l'application passe par l'API serveur existante `POST /api/navigation/presets` (nouveau helper [`persistApplyPreset`](src/lib/persistence-client.ts)) ; après application, l'écran propose l'étape suivante — créer et publier la page d'accueil.
- **Correctif de fond découvert — placeholders de modèles purgés** : les cibles d'un modèle (`/series`, `/galeries`, `/prestations#mariages`…) sont des placeholders **intentionnels** « page à créer ». Or la purge automatique des liens morts (serveur [`pruneOrphanNavigation`](src/db/repositories/navigation.repository.ts) et client [`PagesNavigationSync`](src/components/backoffice/navigation/PagesNavigationSync.tsx)) les supprimait : **un modèle appliqué sur un site vierge était aussitôt annulé au rechargement**. Nouveau prédicat pur [`isPurgableOrphanNavEntry()`](src/lib/navigation.ts) (orphelin **et** hors cibles de modèles), utilisé par les deux purges ; les ancres du seed restent nettoyées et le badge informatif « Lien mort » est inchangé. Helpers d'aperçu ajoutés au modèle pur (`presetRootLabels`, `presetChildLabels`).
- Vérifications : `tsc --noEmit` OK (sources) ; `eslint` OK sur tous les fichiers modifiés ; `npm run build` OK (18 pages).

### Incident d'environnement de développement (cache Turbopack) — cause & correctif
- **Cause racine** : le dossier `.next/dev` a été supprimé **alors qu'un serveur `next dev` tournait**, et `npm run build` a été lancé **en parallèle** — deux écrivains sur le même cache Turbopack. La base de cache est devenue incohérente (`Unable to open static sorted file … introuvable`), puis **verrouillée par le serveur de dev encore actif**, d'où des `Accès refusé (os error 5)` à l'écriture du fichier `00000008.meta` et à la suppression du dossier (le serveur en cours détenait les fichiers).
- **Correctif retenu** : `experimental.turbopackFileSystemCacheForDev: false` dans [`next.config.ts`](next.config.ts:1). Le cache persistant de développement est **activé par défaut** dans Next 16.3.4 ; le désactiver rend `next dev` déterministe et le soustrait à ce dossier verrouillé. Utiliser **`experimental.turbopackFileSystemCacheForDev`** (et non `turbopackPersistentCaching`) : c'est bien la clé lue par `isFileSystemCacheEnabledForDev()`.
- **Validation** : une instance `next dev` lancée avec cette configuration affiche `✓ Ready` **sans aucun message « Persisting failed »** ; `npm run build` reste OK.
- **Régénération** : le reliquat `.next/dev/cache` (vide ou verrouillé) est **inerte** avec l'option désactivée ; le supprimer après un redémarrage de Windows si l'on souhaite récupérer l'espace, puis réactiver l'option si désiré.
- **Règle à retenir** : ne jamais lancer `npm run build` pendant que `npm run dev` tourne, et ne jamais supprimer `.next` sous un serveur Next actif.

### Fichiers créés ou modifiés
- Créé : `src/components/onboarding/SiteStarterPicker.tsx`
- Modifiés : `src/lib/navigation.ts`, `src/lib/persistence-client.ts`, `src/components/backoffice/navigation/{NavigationManager,PresetOnboardingPanel,PagesNavigationSync}.tsx`, `src/db/repositories/navigation.repository.ts`, `src/components/onboarding/WelcomeOnboarding.tsx`, `next.config.ts`, `plans/ROADMAP-4.4-nav-presets-onboarding.md`, `CHANGELOG.md`
- BDD : **aucune** migration. Schéma et contrat de données inchangés.

### Prochaine étape prévue
Recette : sur un site vierge, appliquer un modèle depuis l'écran de bienvenue puis **recharger** → le menu doit **persister** (plus de purge) ; dans Navigation & Menus, vérifier que le panneau n'apparaît **que** si le menu est vide, et qu'il est accessible (et refermable) via « Repartir d'un modèle » sinon.

---

## 2026-09-10 – 22:31 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Étape 11.19 : Héro vidéo, seconde passe — suppression définitive de l'« image fantôme »** (constat de recette après 11.18 : *« le problème existe toujours, mais maintenant avec en plus un fond noir qui apparaît un bref instant avant l'image fantôme puis la vidéo »*).
- **Ce que 11.18 avait manqué** : elle avait corrigé deux défauts réels (branche desktop montée dès le SSR, image déclarée deux fois) mais **conservait le rôle de poster de chargement** attribué à la photo de secours — or c'est précisément ce rôle qui produit l'image fantôme : une image décodée avant le premier plan vidéo **est** montrée, aucun fondu ne peut l'empêcher. Pire, l'état initial « indécis » (`null`) alors introduit ajoutait une **frame au fond noir** avant la photo, d'où deux transitions parasites au lieu d'une.
- **Nouvelle répartition des rôles — un média, un seul rôle** : `videoUrl` = habillage animé ; `fallbackMobile` = **remplace la vidéo sur téléphone** ; `posterDesktop` = **image de repli si la vidéo ne peut pas être lue** (fichier absent ou illisible, mouvement réduit) — **jamais pendant le chargement**. Le champ est renommé en conséquence dans l'éditeur (« **Image de repli — ordinateur (optionnelle)** ») et son aide explique ce nouveau rôle.
- **Pendant le téléchargement** : fond **anthracite**, au même ton que l'overlay du Héro — donc perçu comme une intention et non comme un défaut. La vidéo se **révèle en fondu** dès la première image décodée (`onLoadedData`, plus précoce et plus fiable que `onPlaying`, et qui couvre aussi un autoplay bloqué par le navigateur : l'image fixe du premier plan reste visible).
- **Images de repli choisies en CSS** (`md:hidden` / `hidden md:block`) et non plus en JavaScript : elles sont présentes dès le HTML du serveur, **sans frame « indécise »** — ce qui supprime le passage au noir introduit en 11.18. Le JavaScript ne décide plus que du **montage de la vidéo**.
- **Décision assumée et documentée** : entre « une image fantôme à chaque visite » et « un fond neutre pendant le chargement », le second préserve l'effet recherché. Il n'existe pas de moyen d'afficher une image *sans* qu'elle soit vue.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/modules/hero/HeroVideoBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration.

### Prochaine étape prévue
Recette du Héro vidéo : au rechargement (cache froid **et** chaud), la séquence doit être **une seule transition** — fond anthracite puis vidéo en fondu — sans aucune image intercalée ; sur téléphone, la photo 9:16 doit s'afficher immédiatement (et jamais la version ordinateur) ; en `prefers-reduced-motion`, l'image de repli doit apparaître à la place de la vidéo ; et si le visiteur a renseigné une URL vidéo invalide, l'image de repli doit prendre le relais.

---

## 2026-09-10 – 22:23 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Étape 11.18 : correctif « flash » du Héro vidéo** (remontée de recette : *« lorsque l'on charge une page qui a un module Hero Video, un bref instant on aperçoit ce qui paraît être la Photo de secours — ordinateur. Ce qui tue l'UX attendu. »*).
- **Cause 1 — mauvaise branche au premier rendu** [`HeroVideoBackground`](src/components/modules/hero/HeroVideoBackground.tsx) : `isDesktop` était initialisé à **`true`**, donc le HTML rendu côté serveur **et** le premier rendu client montaient la branche **desktop** — y compris sur téléphone. On voyait donc brièvement la photo de secours **ordinateur** avant la bascule vers la photo mobile. → L'état initial devient **indécis** (`null`) : **rien n'est monté** tant que les media queries ne sont pas résolues (fond anthracite neutre pendant une frame). Aucune image erronée n'est plus affichée, sur aucun écran.
- **Cause 2 — photo de secours affichée deux fois** : elle l'était à la fois par l'attribut `poster` de `<video>` **et** par un `<img>` superposé — soit **deux images lourdes** téléchargées en concurrence avec la vidéo, ce qui retardait d'autant le premier plan vidéo et **prolongeait** le flash. → **Un seul mécanisme** subsiste (le `<img>`), **fondu en sortie** (`onPlaying`) dès que la vidéo produit réellement une image, et `preload="metadata"` remplacé par **`preload="auto"`**.
- **Guidage de contenu** [`ModuleHeroVideoEditor`](src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx) : l'aide du champ « Photo de secours — ordinateur (optionnelle) » invite désormais à choisir une image **extraite de la vidéo** (son premier plan) — le fondu devient alors invisible — ou à la laisser vide pour un fond sombre pendant le chargement.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/components/modules/hero/HeroVideoBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration. Aucun changement de schéma ni de contrat de données.

### Prochaine étape prévue
Recette du Héro vidéo sur une page réelle : recharger plusieurs fois (cache vidéo vide puis chaud) et confirmer qu'**aucune image** n'apparaît avant la vidéo sur ordinateur ; vérifier sur **téléphone** (et en émulation mobile) que c'est bien la photo 9:16 qui s'affiche, jamais la version ordinateur ; contrôler enfin que le `prefers-reduced-motion` affiche bien une image fixe sans vidéo.

---

## 2026-09-10 – 22:15 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Étape 11.17 : Ergonomie des éditeurs de modules — zones, portée et libellés** (plan [`plans/ROADMAP-11.17-editor-zones-ux.md`](plans/ROADMAP-11.17-editor-zones-ux.md), validé).
- **Diagnostic (cause racine)** : un module déplié empilait **quatre échelles** différentes — le bloc, la galerie, les albums, la photo — dans un même flux vertical sans aucun marqueur de niveau ([`ModuleGalleryEditor`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx) ≈ 35 contrôles à plat). Le découpage « RÉGLAGES / CONTENU » de [`ModuleRow`](src/components/backoffice/pages/ModuleRow.tsx) recopiait la structure technique (scalaires vs JSONB). D'où des retours d'usage tous formulés « de quoi ? ».
- **Lot A — libellés non techniques** [`pages.ts`](src/lib/pages.ts) : `Masonry` → **`Mosaïque (hauteurs libres)`**, `Uniforme` → `Grille régulière`, `Light/Normal/Strong` → **`Légère/Normale/Marquée`**, `Light/Medium/Normal/Strong` → **`Très discrète/Discrète/Normale/Forte`**, `Animation active` → `Zoom et élévation douce`, `Gallery Static/Dynamic/Portfolio` → **`Galerie fixe/interactive/portfolio`**. Panneaux : « Mise en page » → **« Disposition des photos »**, « Finitions & effets » → **« Cadre et finition des photos »**, « Diaporama (Lightbox) » → **« Agrandissement et diaporama »**, « Afficher les informations EXIF » → **« Afficher les réglages de l'appareil photo »**, « Afficher la légende » → « Afficher le titre et la description de la photo ». Alignement des `id`/`htmlFor` intra-document (`GalleryHoverPanel`, `LinkTargetField`).
- **Lot A — deux corrections de véracité** : l'aide « Titre d'affichage » annonçait un libellé « visible dans le bandeau **et le menu du site** » — vérification faite par recherche, `module.title` n'est **jamais** rendu sur le site public (il n'alimente que le bandeau et les dialogues du back-office) ; l'aide est corrigée et le champ renommé **« Nom de la section dans le back-office »**. L'en-tête d'album affiche désormais **`Album n — {nom}`** au lieu d'un simple numéro.
- **Lot B — réglages techniques sortis du flux** : les trois champs scalaires (`title`, `anchorId`, `animation`) sont regroupés dans une zone **« Réglages avancés » repliée**, en fin de formulaire ([`ModuleRow`](src/components/backoffice/pages/ModuleRow.tsx)) ; le rappel « Module visible / masqué » (redondant avec le Toggle Eye et le badge du bandeau) est supprimé.
- **Lot B — doublon réel supprimé** : « Animation au survol de la photo » était exposée **deux fois** — dans [`ModuleSettingsForm`](src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) et dans [`GalleryLayoutPanel`](src/components/backoffice/pages/modules/gallery/GalleryLayoutPanel.tsx) — les deux écrivant `layout.hoverAnimation`. Le réglage vit désormais dans le seul [`GalleryHoverPanel`](src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx) (nouveau), avec le voile dégradé, à l'intérieur de la zone « Apparence des photos ».
- **Lot C — composant partagé [`EditorZone`](src/components/backoffice/pages/modules/EditorZone.tsx)** : titre qui **nomme la cible**, **phrase de portée obligatoire**, teinte d'accent, repli **sans dépendance nouvelle** (`@radix-ui/react-collapsible` n'est pas installé → état local + `aria-expanded`/`aria-controls`, un `<h5>` ne pouvant être enfant d'un `<button>`). Quatre teintes **génériques** en tokens CSS ([`globals.css`](src/app/globals.css) : `--zone-content/style/detail/action`) servent d'accent de bordure et de pastille, jamais de fond plein (contraste préservé). Convention visuelle : **bordure pleine + accent = zone**, **pointillés = sous-bloc** ([`EditorSubZone`](src/components/backoffice/pages/modules/EditorZone.tsx)).
- **Lot C — refonte du panneau Galerie** en **4 zones** — Les albums · Apparence des photos (Disposition / Cadre et finition / Au survol) · Agrandissement et diaporama · Bouton d'appel à l'action — plus une **barre d'ancres collante** en tête (liens `#id` natifs, le défilement lissé étant déjà global). Les panneaux enfants ne portent plus leur propre cadre ni leur titre.
- **Décision — onglets écartés** : le formulaire est déjà dans un accordéon ; les onglets cacheraient les valeurs par défaut (« Effet = Aucun », « Aucun affichage ») qu'il faut pouvoir reconnaître d'un coup d'œil ; ces réglages s'ajustent en regardant le résultat. Porte de sortie documentée : **deux onglets au maximum**, jamais plus fin.
- **Lot D — généralisation aux 9 autres éditeurs** : Héro statique (4 zones, bouton isolé), Héro slider, Héro vidéo, Héro parallaxe, À propos, Services, FAQ, Contact, Bandeau CTA. Les `RubricTitle` locaux (3 duplications) sont remplacés par `EditorZone`.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK.

### Fichiers créés ou modifiés
- Créés : `src/components/backoffice/pages/modules/EditorZone.tsx`, `src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx`, `plans/ROADMAP-11.17-editor-zones-ux.md`
- Modifiés : `src/lib/pages.ts`, `src/components/backoffice/pages/ModuleRow.tsx`, `src/components/backoffice/pages/modules/{ModuleSettingsForm,ModuleContentEditor,ModuleGalleryEditor,ModuleHeroEditor,ModuleHeroSliderEditor,ModuleHeroVideoEditor,ModuleHeroParallaxEditor,ModuleAboutEditor,ModuleServicesEditor,ModuleFaqEditor,ModuleContactEditor,ModuleCtaBannerEditor}.tsx`, `src/components/backoffice/pages/modules/gallery/{AlbumManagerPanel,GalleryLayoutPanel,EffectSettingsPanel,LightboxSettingsPanel,GalleryCtaPanel}.tsx`, `src/app/globals.css`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration. **Aucun champ ajouté ni retiré** ; rendu public **inchangé**.

### Prochaine étape prévue
Recette `/admin/pages/{id}` : ouvrir un module de chaque famille et vérifier que chaque zone annonce bien sa cible et sa portée, que la barre d'ancres saute correctement à chaque rubrique, que « Réglages avancés » est replié par défaut (et que l'identifiant comme l'animation restent éditables), que les quatre teintes sont lisibles en thème clair, puis vérifier sur le site public que le rendu des sections est **strictement identique** à l'avant-refonte.

---

## 2026-09-10 – 20:02 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Étape 11.16 : UX « Galeries & Portfolio » — vocabulaire « Album » et sélecteur de cible du CTA** (plan [`plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md`](plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md), validé).
- **Vocabulaire « Album »** : « Thématique 1 » → **« Album 1 »**, « Photos de la thématique » → **« Photos de l'album »**, et alignement de tout le panneau (`Albums de la galerie`, `Ajouter un album`, `Affichage sur les couvertures`, `Quand afficher ces informations ?`, `Que faut-il afficher ?` → `Le nom de l'album` / `Le nombre de photos`, `Nom de l'album`, `Description de l'album`, 3 `aria-label`, état vide, libellé par défaut `Nouvel album`). Motif : l'UI contredisait le code (`GalleryAlbum`, `AlbumManagerPanel`, `galleryAlbumSchema`) et **« thème » est déjà le vocabulaire de l'identité visuelle** (« Par défaut du thème », `heroTextTone`) — collision sémantique réelle pour un non-technicien. **Aucune clé persistée renommée, aucune migration, aucun impact public/SEO.**
- **Bloc « Affichage sur les couvertures »** (ex-« Badge de l'album », libellé rejeté comme jargon web) : le panneau est restructuré en **trois questions** — **quand** afficher (`badge.display`), **quoi** afficher (nom / nombre de photos), **comment** (position / style). La portée était par ailleurs trompeuse : ce réglage est **global à la galerie** (il s'applique à toutes les couvertures), d'où le pluriel.
- **Nouveau réglage `badge.display`** : « Affiché en permanence » (défaut) / « Affiché au survol de la photo » / « Aucun affichage ». Champ **optionnel** dans `galleryBadgeSchema` + repli sur `always` dans `resolveGalleryBadge` → **aucune migration BDD**, rendu des contenus existants strictement inchangé. En mode « Aucun affichage », les réglages de contenu, de position et de style sont **masqués** (aucun réglage contradictoire).
- **Repli tactile du mode « au survol »** (point critique) : Tailwind compile `group-hover:` sous `@media (hover: hover)` — sur téléphone et tablette, le texte serait resté **invisible en permanence**, donc le nom de l'album jamais lisible. L'opacité passe désormais par l'utilitaire CSS `.cover-text-hover` ([`globals.css`](src/app/globals.css)), **hors `@layer`** pour primer sur les utilitaires Tailwind : masqué uniquement sous `(hover: hover) and (pointer: fine)`, révélé au `:hover` **et** au `:focus-within` (clavier), transition supprimée sous `prefers-reduced-motion`, et **toujours visible au doigt**.
- **Sélecteur de cible du CTA** [`LinkTargetField`](src/components/backoffice/pages/modules/LinkTargetField.tsx) : sous « Lien du bouton », **deux menus** — **« Aller vers une page du site »** (pages triées alphabétiquement, collator `fr`) et **« Aller vers une section de page »** (ancres de tous les modules, groupées par page via `SelectGroup`/`SelectLabel`, page en cours signalée) — **plus le champ libre conservé** (« Ou collez un lien » : `https://`, `mailto:`, `tel:`). Le mode est **DÉRIVÉ de `href`, jamais stocké** → exclusion mutuelle automatique via l'option sentinelle « — Aucune — », zéro état incohérent, repli en champ libre pour un `href` orphelin (aucune perte silencieuse).
- **Aperçu de la destination** : phrase en clair (« Vous serez emmené vers : Portfolio › Galerie mariage ») + avertissement si la cible est un **brouillon**, une **section masquée** ou une **cible introuvable**.
- **Helpers purs** [`link-targets.ts`](src/lib/link-targets.ts) : `collectPageTargets`, `collectAnchorTargets` (dédoublonnage par page, `#ancre` pour la page courante, `/slug#ancre` sinon via `pageHrefFor` — jamais `pageHref` seul, pour éviter le slug d'un ancien accueil démis), `detectCtaTargetMode`, `describeLinkTarget`, `compareLabelFr` (accents + tri numérique).
- **Contexte** [`CurrentPageContext`](src/components/backoffice/pages/CurrentPageContext.tsx) posé par [`ModuleDndList`](src/components/backoffice/pages/ModuleDndList.tsx) : expose la page en cours d'édition aux éditeurs, sans prop drilling sur 4 niveaux. Hors Provider, `useCurrentPage()` retourne `{ pageId: null }` (aucune exception) → champ réutilisable ailleurs (ex. CTA du Héro).
- **Défilement du CTA** [`CTAButton`](src/components/modules/gallery/CTAButton.tsx) : les liens internes (`/page`, `#ancre`, `/page#ancre`) passent par **`NavLink`** → défilement lissé **avec compensation du Header fixe** (auparavant un saut brut passait sous la barre) ; URL absolues en `_blank` + `rel="noopener noreferrer"` ; `mailto:`/`tel:` en `<a>` simple (même onglet).
- **Vocabulaire de l'UI de cible** (D-3 révisée) : « sous-page », « page de niveau 1/2 » **proscrits** — « Niveau 1/2 » est le vocabulaire du module **Navigation** et qualifie une position dans un menu, pas une page (les items de niveau 2 du seed sont des liens `custom` vers des **ancres**, cf. [`navigation.ts`](src/lib/navigation.ts)). Le mot « ancre » n'apparaît que dans l'infobulle « i ».
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créés : `src/lib/link-targets.ts`, `src/components/backoffice/pages/CurrentPageContext.tsx`, `src/components/backoffice/pages/modules/LinkTargetField.tsx`, `plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md`
- Modifiés : `src/components/backoffice/pages/modules/gallery/{AlbumManagerPanel,GalleryCtaPanel}.tsx`, `src/components/backoffice/pages/ModuleDndList.tsx`, `src/components/modules/gallery/{CTAButton,GalleryAlbumBadge,GalleryItem,GalleryGrid,GalleryManager,LightboxModal}.tsx`, `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/app/globals.css`, `src/app/(front-office)/demo/page.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration.

### Prochaine étape prévue
Recette `/admin/pages/{id}` sur une galerie Portfolio : libellés « Album n » / « Photos de l'album (n) », sélection d'une page puis d'une ancre (bascule automatique de l'autre menu sur « Aucune »), ancre de la page courante (`#ancre`) vs autre page (`/slug#ancre`), lien externe via le champ libre, alerte « brouillon » / « masquée », puis clic du bouton sur le site public (défilement sous le Header fixe). Cas limite : renommer le slug d'une page cible → le lien retombe en champ libre sans être perdu.

---

## 2026-09-10 – 13:41 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Correctifs après recette (Étapes 11.9 → 11.15)**.
- **11.9 — Gallery Dynamic** : ouverture au **clic simple** (au lieu du double-clic), avec garde-fou de 300 ms empêchant le clic résiduel du double-clic de refermer la modale ; le double-clic reste dédié au cycle de zoom **dans** la Lightbox. [`GalleryCtaPanel`](src/components/backoffice/pages/modules/gallery/GalleryCtaPanel.tsx) affiche désormais une **alerte** (icône + texte) quand le bouton CTA est activé sans libellé ou sans lien (les trois variantes).
- **11.10 — Lightbox, pan fiable & fluidité** [`LightboxModal`](src/components/modules/gallery/LightboxModal.tsx) : l'état de glissement est armé **avant** `setPointerCapture` (avec `try/catch`), le déplacement est piloté par des **écouteurs fenêtre** (`pointermove/up/cancel`, nettoyés au démontage), transform `translate3d` + `transformOrigin: center`, `user-select: none`, `overscroll-behavior: contain` → **plus d'ascenseur natif** en mode zoomé, glissement fluide au clic maintenu, borné. **Préchargement** des images voisines (n−1 / n+1) pour une navigation quasi instantanée.
- **11.11 — Anneau coloré** [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx) : la modalité d'ouverture (clavier vs souris) est propagée de la vignette jusqu'à la Lightbox ; le focus n'est restauré sur la vignette **que** pour une ouverture clavier (plus de bordure rose après un clic souris), et l'anneau de focus est rendu discret.
- **11.12 — Galeries vides par défaut** [`pages.ts`](src/lib/pages.ts) : `createGalleryStaticContent` / `createGalleryDynamicContent` démarrent **sans photo** et `createGalleryPortfolioContent` **sans album** (ajout dynamique d'autant de thématiques que souhaité) ; messages d'aide dans l'éditeur ; le **seed** n'instancie plus de galerie vide (Accueil et Portfolio).
- **11.13 — WebP qualité 80 à l'upload** [`/api/media`](src/app/api/media/route.ts) : conversion **sharp → WebP q80** (orientation EXIF appliquée, métadonnées retirées) avant Storage pour JPEG/PNG/WebP/AVIF ; **SVG, GIF animés et vidéos** conservés tels quels ; **repli sur l'original** si la conversion échoue ; `mimeType`/extension `.webp`, `size` du WebP ; **EXIF lu sur l'original**, dimensions et blur calculés sur le WebP.
- **11.14 — Lazy loading & qualité** : prop `quality` ajoutée à [`MediaImage`](src/components/common/MediaImage.tsx) (utilisée à **80** dans la Lightbox et les grilles) ; toutes les photos de galerie restent en **lazy loading** (seule la première en `priority`), image active de la Lightbox en chargement immédiat.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/modules/gallery/{GalleryManager,GalleryItem,GalleryGrid,LightboxModal}.tsx`, `src/components/backoffice/pages/modules/gallery/GalleryCtaPanel.tsx`, `src/components/common/MediaImage.tsx`, `src/lib/pages.ts`, `src/app/api/media/route.ts`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune** migration.

### Prochaine étape prévue
Nouvelle passe de recette `/demo` : Gallery Dynamic au clic simple (sans fermeture parasite), pan au clic maintenu sans ascenseur, cycle de zoom fit → 1,5× → 2,5×, absence d'anneau rose après un clic souris, fluidité du diaporama (préchargement + WebP), galeries vides à la création puis import multiple/dossier complet, alerte CTA incomplet.

---

## 2026-09-10 – 12:11 (heure locale America/Bogota)

### Tâche exécutée
**Phase 11 — Rubrique « Galeries & Portfolio » : Gallery Static, Gallery Dynamic, Gallery Portfolio** (plan [`plans/ROADMAP-11.1-galleries-portfolio.md`](plans/ROADMAP-11.1-galleries-portfolio.md) validé).
- **Architecture** : famille unique `type: "gallery"` à **variantes discriminées dans le JSONB** (`static` / `dynamic` / `portfolio`) — pattern de la rubrique Héro, **aucune migration BDD** (`module_type` conserve `gallery`). `GalleryVariant` (mode d'affichage) renommé `GalleryDisplayMode` + `layout.display`, avec **lecture rétro-compatible** de l'ancien `layout.variant` ; un contenu sans `variant` bascule vers `static` (legacy « Galerie photo masonry »).
- **Domaine** [`pages.ts`](src/lib/pages.ts) : `GalleryContent` (`GalleryStaticContent` / `GalleryDynamicContent` / `GalleryPortfolioContent`), effets exclusifs (`GalleryEffectSettings` light/normal/strong), ombre (`none`→`strong`), bordure (épaisseur + couleur), CTA, réglages Lightbox (zoom 1,5× / 2,5×, EXIF, légendes), albums imbriqués (`GalleryAlbum`), badges paramétrables, fabriques par variante, `resolveGalleryContent` (rétro-compat.), `galleryImageSources`, `galleryAlbumCover/PhotoCount`, `ModuleVariant` généralisé, catalogue à **3 cartes**.
- **Schémas** [`persistence.ts`](src/lib/schemas/persistence.ts) : `galleryContentSchema` (union discriminée, miroir du domaine). [`public-page.ts`](src/lib/public-page.ts) : collecte SEO/OG des images galerie **albums inclus**.
- **Effets** [`gallery-effects.ts`](src/lib/gallery-effects.ts) : mapping pur effet + intensité → styles (Passe-partout de Musée, Sous-Verre/glassmorphism, Polaroid papier glacé + reflet), ombre nacre et bordure indépendantes.
- **Rendu public** : [`GalleryManager`](src/components/modules/gallery/GalleryManager.tsx) orchestre les 3 variantes ; [`GalleryGrid`](src/components/modules/gallery/GalleryGrid.tsx) (uniforme/masonry, colonnes responsives par variables CSS) ; [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx) (`MediaImage` lazy, ratio réservé anti-CLS, effets, survol, curseurs selon variante, double-clic/ clic simple) ; [`GalleryAlbumBadge`](src/components/modules/gallery/GalleryAlbumBadge.tsx) ; [`CTAButton`](src/components/modules/gallery/CTAButton.tsx) (conditions habituelles show + label + href).
- **Lightbox unique** [`LightboxModal`](src/components/modules/gallery/LightboxModal.tsx) partagée Dynamic (toutes les images) + Portfolio (album exclusif) : clavier ← →, Échap, **focus trap**, ARIA, restauration du focus, scroll verrouillé, **Zoom HD**, **plein écran**, **cycle de zoom fit → 1,5× → 2,5× → fit**, **pan au clic maintenu** borné et **sans scroll** (molette neutralisée).
- **Back-Office** : [`ModuleGalleryEditor`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx) (routeur par variante) + panneaux [`ImportMediaPanel`](src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx) (multiple + dossier non compressé), [`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx) (CRUD, réordonnancement, masquage), [`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx) (thématiques + badges), `GalleryLayoutPanel`, `EffectSettingsPanel`, `GalleryCtaPanel`, `LightboxSettingsPanel`, `fields`.
- **Responsivité** : colonnes dégradées automatiquement (≤1024 → min(cols,3) ; ≤640 → min(cols,2) ; ≤400 → 1) et typographies fluides `clamp()` (titres, badges, légendes Polaroid).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK ; `npm run build` OK.

### Fichiers créés ou modifiés
- Créés : `src/lib/gallery-effects.ts` ; `src/components/modules/gallery/{GalleryManager,GalleryGrid,GalleryItem,GalleryAlbumBadge,LightboxModal,CTAButton}.tsx` ; `src/components/backoffice/pages/modules/gallery/{ImportMediaPanel,GalleryImagesPanel,AlbumManagerPanel,GalleryLayoutPanel,EffectSettingsPanel,GalleryCtaPanel,LightboxSettingsPanel,fields}.tsx` ; `plans/ROADMAP-11.1-galleries-portfolio.md`
- Modifiés : `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/lib/public-page.ts`, `src/app/globals.css`, `src/components/modules/PublicModules.tsx`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/modules/{ModuleGalleryEditor,ModuleSettingsForm}.tsx`, `src/app/(front-office)/demo/page.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- Supprimé : `src/components/modules/GalleryGrid.tsx` (logique migrée vers `src/components/modules/gallery/`)
- BDD : **aucune** migration (contenu JSONB uniquement).

### Prochaine étape prévue
Contrôle visuel `/demo` : Gallery Static (aucune interaction, Passe-partout + CTA), Gallery Dynamic (double-clic → diaporama, aucun voile au survol), Gallery Portfolio (clic simple → album exclusif + badges) ; cycle de zoom fit → 1,5× → 2,5× et pan au clic maintenu ; import multiple et dossier non compressé depuis `/admin/pages` ; responsivité mobile / tablette / desktop.

---

## 2026-09-11 – 09:41 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20 — Gestion des albums du Portfolio par grille de vignettes** (plan [`plans/ROADMAP-11.20-albums-thumbnail-grid.md`](plans/ROADMAP-11.20-albums-thumbnail-grid.md)) — **Lots A + B + C** livrés (ordre retenu : A+B+C → E → D).
- **Constat** : chaque album était rendu **intégralement déplié** ([`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx)) → hauteur proportionnelle à *albums × photos* (600 vignettes pour 30 albums × 20 photos).
- **LOT A — champ `hidden` (aucune migration)** : [`GalleryAlbum.hidden`](src/lib/pages.ts:1389) + `createGalleryAlbum` (`hidden: false`) + normalisation `record.hidden === true` (**repli `false`** : les albums existants restent visibles) ; [`galleryAlbumSchema`](src/lib/schemas/persistence.ts:275) → `hidden: z.boolean().optional()`. **Branchements publics** : [`GalleryManager`](src/components/modules/gallery/GalleryManager.tsx:74) (album masqué non affiché), [`galleryImageSources()`](src/lib/pages.ts:1990) (exclusion des albums masqués du **SEO/OG**) et [`PublicModules`](src/components/modules/PublicModules.tsx:75) (si tout est masqué, la section galerie n'est pas rendue).
- **LOT B — grille de vignettes** : nouveaux [`AlbumThumbnail.tsx`](src/components/backoffice/pages/modules/gallery/AlbumThumbnail.tsx) (couverture `MediaImage` lazy, **n° d'ordre**, compte de photos, actions **au survol ET au focus clavier**, badge **« Masqué »** permanent, mention « Aucune photo — invisible sur le site ») et [`AlbumGrid.tsx`](src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx) (tuile **« Nouvel album » en 1ʳᵉ cellule**, grille 2/3/4 colonnes, état vide, réordonnancement **↑ / ↓ accessible** hors glisser, création → ouverture + focus) ; [`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx) réduit à la **composition** (compteur, phrase de portée, bloc « Affichage sur les couvertures », grille).
- **LOT C — vue d'album en place** : formulaire **pleine largeur** (retour « ← Tous les albums », nom, description, sélecteur de couverture, réutilisation **telle quelle** de [`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx)) — **sans route ni persistance supplémentaire** ; garde-fou **dérivé** (album disparu ⇒ retour à la grille, sans `setState` en effet).
- **Décisions appliquées** : A-2 (un album ne porte que son contenu — pas les réglages de galerie), A-4/D-5 (le glisser-déposer ne sera **jamais** le seul moyen de réordonner), D-6 (numéro d'ordre affiché), D-9 (réutilisation de `GalleryImagesPanel`).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créés : `src/components/backoffice/pages/modules/gallery/AlbumThumbnail.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/gallery/GalleryManager.tsx`, `src/components/modules/PublicModules.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx`, `CHANGELOG.md`
- BDD : **aucune migration** (`hidden` optionnel, repli `false`).

### Prochaine étape prévue
**LOT E** — import groupé « un dossier parent → chaque sous-dossier devient un album » (`webkitRelativePath`, cas limites §6.1 du plan), puis **LOT D** — glisser-déposer sur la grille **précédé du prototype obligatoire** (24 albums / 3 lignes, Échap) avec repli documenté ; mise à jour de [`ROADMAP.md`](ROADMAP.md) (Étape 11.20) en fin de parcours.

---

## 2026-09-11 – 16:25 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.25 — Indicateur de page d'accueil dans la liste des pages** (demande : *« je souhaite que cette maison apparaisse grisée claire et que le fait de cliquer la rende noire indiquant ainsi qu'il s'agit de la page d'accueil ; le survol de cette icône ouvrira un tooltip indiquant "Ceci est votre page d'accueil" »*).

**Ce qui n'allait pas.** La maison n'était affichée **que sur les pages qui n'étaient pas l'accueil** ([`PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx)) : la page d'accueil, elle, portait un badge « Accueil » et **aucune maison**. Conséquences : nulle part la couleur ne disait « c'est l'accueil », puisqu'il manquait justement la maison sur cette ligne ; et la ligne de l'accueil, privée d'un bouton, **décalait ses icônes** d'un cran par rapport aux autres (alignement incohérent d'une ligne à l'autre).

**Ce qui a été fait.**
- La maison est désormais affichée **sur chaque ligne**, et c'est sa **couleur** qui porte l'information :
  · **grise et cliquable** → cette page n'est pas l'accueil ; le clic la désigne comme accueil (`setHomePage`) ;
  · **noire et non interactive** → c'est l'accueil du site.
- Tooltips explicites : « **Ceci est votre page d'accueil** » sur la page d'accueil — votre formulation, mot pour mot — et « Définir cette page comme page d'accueil » sur les autres, où votre phrase aurait été **fausse** (elle affirmerait une chose qui n'est pas encore vraie).
- L'alignement est réparé : le `size-9` de l'indicateur reproduit exactement la taille du bouton voisin.

**Deux pièges techniques évités — c'est le cœur de cette étape.**
1. **`disabled` était inutilisable ici.** [`ui/button.tsx`](src/components/ui/button.tsx) porte `disabled:pointer-events-none` : un bouton désactivé **ne reçoit aucun survol**, donc le **tooltip ne se serait jamais affiché** — or c'est précisément l'exigence. L'état « accueil » est donc rendu par un **indicateur** (`<span role="img">` avec `title` + `aria-label`), pas par un bouton désactivé.
2. **Un bouton désactivé mais focusable reste un piège au clavier** : on tombe dessus avec Tab, on l'active, il ne se passe rien. Un indicateur n'est pas une action — il ne doit pas être dans l'ordre de tabulation. Le nouveau rendu respecte cela.

**Accessibilité** : le `title` seul ne suffit jamais (il n'est pas exposé de façon fiable aux technologies d'assistance, et il n'apparaît qu'au survol) — un `aria-label` explicite l'accompagne, distinct selon que la page est l'accueil ou non. Et la couleur **n'est pas le seul signal** de l'information : la ligne de l'accueil conserve son **badge « Accueil »** (non demandé à la suppression — c'est le pendant **textuel** de la maison noire, pour les personnes qui ne distinguent pas les niveaux de gris) et son URL canonique `/` reste visible dans la colonne « URL ».

- **Aucune donnée, aucun schéma, aucun comportement de navigation modifiés** : uniquement le rendu de la cellule d'actions.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers modifiés
- `src/components/backoffice/pages/PagesManager.tsx` (indicateur de page d'accueil), `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette : dans « Pages », la maison doit être **grise sur toutes les lignes sauf une**, la **noire** ; le survol de la grise doit proposer de définir la page comme accueil, et le survol de la noire doit afficher « Ceci est votre page d'accueil » ; un clic sur une maison grise doit basculer l'accueil (l'ancienne accueil redevenant grise).

---

## 2026-09-11 – 16:00 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.24 — Désambiguïsation des deux boutons d'aperçu du Back-Office** (constat de recette : *« un bouton "Aperçu du site" est présent en haut à droite dans le header du tableau de bord, et si je sélectionne une page, un bouton "Aperçu" figure également en haut à droite… cela me semble être un doublon, perturbant pour le UX »*).

**Diagnostic — deux commandes distinctes, une seule apparence.** L'analyse a montré que les deux boutons ne font **pas** la même chose :

| Bouton | Emplacement | Destination |
|---|---|---|
| « Aperçu du site » ([`admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx)) | barre du tableau de bord — **toutes** les pages d'administration | `/` (accueil du site) |
| « Aperçu » ([`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx)) | en-tête de la page éditée | `pageHref(page.slug)` (**la page en cours**) |

Mais trois facteurs les faisaient percevoir comme un doublon : **des libellés quasi identiques** (« Aperçu » / « Aperçu du site ») alors que les destinations diffèrent ; **la même position** (colonne de droite de deux barres superposées, même icône `ExternalLink`, même ouverture en nouvel onglet) ; et une **identité réelle** lorsque la page éditée *est* l'accueil, les deux pointant alors vers la même URL.

**Décision retenue (choix du propriétaire du produit) : conserver les deux, lever l'ambiguïté par le libellé.** Le bouton contextuel devient « **Aperçu de la page** ». Motif : chacun conserve son utilité — l'aperçu **contextuel** montre ce qu'on est en train d'éditer, l'aperçu **global** reste le seul recours sur les écrans sans aperçu (médias, navigation, profil, identité visuelle, liste des pages). Supprimer l'un des deux aurait retiré une fonction réelle.
- Une variante plus structurelle avait été proposée — **déplacer** « Aperçu du site » dans la barre latérale, hors de la zone d'actions du compte (où il voisine aujourd'hui avec « Déconnexion » et l'avatar, sans rapport avec eux) : elle a été **écartée**, le renommage suffisant.
- Le commentaire d'en-tête de [`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx) documente désormais **pourquoi** les deux libellés sont distincts, afin qu'une simplification future ne les refusionne pas.

**Aucun changement de comportement** : mêmes destinations, même ouverture en nouvel onglet, mêmes styles. Seul le texte change.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers modifiés
- `src/components/backoffice/pages/PageEditor.tsx` (libellé « Aperçu » → « Aperçu de la page » + commentaire d'en-tête), `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette : vérifier que depuis l'édition d'une page, « Aperçu de la page » ouvre bien **cette page**, et que « Aperçu du site » (barre du tableau de bord) ouvre toujours l'**accueil** — les deux libellés doivent être lisibles sans ambiguïté côte à côte.

---

## 2026-09-11 – 15:30 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.23 — Module « Galerie Portfolio » : libellés, dédoublonnage du parcours d'import et famille d'effets de survol cumulables.** Quatre demandes, appliquées de façon complète et sans régression.

**1. Libellés de la zone des albums** ([`ModuleGalleryEditor.tsx`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx))
- Titre de zone et entrée de la barre d'ancres : « Les albums » → **« Les albums de la Galerie Portfolio »**. Le pluriel a été respecté (« albums » et non « album ») — une coquille dans la formulation initiale.
- Compteur ([`AlbumManagerPanel.tsx`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx)) : « N albums » → **« Nombre d’Albums actuellement créés : N »**, N étant le nombre **réel** d'albums (`albums.length`), donc toujours à jour.
- Un **niveau d'annotation en phrase** a été ajouté au barème typographique ([`editor-type.ts`](src/components/backoffice/pages/modules/editor-type.ts), niveau **ML-b**) : les capitales du micro-libellé ML convenaient à une étiquette de deux mots, pas à une phrase entière.

**2. Suppression du parcours d'import d'albums en doublon** — la demande était explicite et a été suivie **intégralement**.
- Le bloc encadré « Importer un dossier d'albums », son paragraphe d'explication et son bouton « Choisir un dossier d'albums » sont **retirés** de la zone : la création d'albums passe désormais par **un seul parcours**, la tuile « + Nouvel album » de la grille.
- Le composant [`AlbumFolderImportPanel.tsx`](src/components/backoffice/pages/modules/gallery/AlbumFolderImportPanel.tsx) est **supprimé du projet** (fichier supprimé, plus aucun import).
- **Aucun résidu** : la prop devenue inutile `demo` a été retirée de `AlbumManagerPanel` (elle ne servait qu'au bloc supprimé), et la phrase de cadrage qui renvoyait au parcours disparu — « *Un dossier importé devient un album* » — a été **réécrite** ; elle aurait décrit une fonctionnalité inexistante. Vérification par recherche : plus aucune référence, plus aucun style ni gestionnaire d'événement orphelin.
- **Ce qui demeure** : l'import de **photos** dans un album (dossier complet ou sélection multiple) reste disponible dans la vue d'album via [`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx) — c'est le parcours conservé, avec la tuile « + Nouvel album ».

**3. Famille d'effets de survol, optionnels et cumulables** (le cœur de l'étape)
- **Deux effets demandés au minimum** : **Zoom** et **Élévation douce**, désormais **réglables finement** (zoom 100–118 %, élévation 0–16 px) — ils étaient auparavant **codés en dur** (`scale-105` / `-translate-y-1`).
- **Quatre effets premium ajoutés**, choisis pour leur valeur perçue et leur coût :
  · **Parallaxe** (0–12 px) — l'image glisse dans son cadre, profondeur immédiate ;
  · **Brillance discrète** — un reflet diagonal traverse la vignette ;
  · **Saturation et contraste** — les couleurs se ravivent ;
  · **Bordure lumineuse** — un liseré à la couleur d'accent du thème.
- **Chaque effet s'active indépendamment et se cumule** : l'interrupteur général (`hoverAnimation`) commande la famille, chaque sous-effet a son propre réglage, et **« Accentuation de la lisibilité » a été découplée** de l'interrupteur (elle fonctionnait auparavant uniquement si l'animation était active) — elle peut donc s'utiliser seule ou avec n'importe quelle combinaison.
- **Persistance** : nouvelle famille `layout.hoverEffects` (`zoom`, `lift`, `parallax`, `shine`, `saturate`, `glow`) dans le JSONB du module. **Aucune migration** : le champ est `optional()` dans le schéma zod, et la lecture applique un **repli champ par champ** (`resolveGalleryHoverEffects`) — un contenu enregistré avant cette étape conserve donc **exactement** son rendu, les valeurs par défaut reproduisant l'ancien comportement (zoom 105 %, élévation 4 px, aucun effet d'ambiance).
- **Performance** : uniquement `transform`, `filter` et `box-shadow`, composés par le GPU — aucun recalcul de mise en page. `will-change` est volontairement absent (le promouvoir en permanence consommerait de la mémoire pour un effet fugace).
- **Accessibilité** : les effets ne se déclenchent que sur un appareil à **survol réel** (`hover: hover` et `pointer: fine`), ne s'appliquent pas sur écran tactile (l'affichage reste stable), et le **focus clavier** produit les **mêmes** effets que la souris. Sous `prefers-reduced-motion: reduce`, ils ne sont pas seulement accélérés : ils sont **supprimés** (`transform`, `filter`, `box-shadow` neutralisés) — un zoom instantané au survol demeure une variation brutale pour les personnes sensibles au mouvement.
- **Choix technique** : les valeurs sont transmises en **variables CSS** posées sur le conteneur de grille ([`GalleryGrid`](src/components/modules/gallery/GalleryGrid.tsx) via `galleryHoverCssVars()`), la mécanique vivant dans [`globals.css`](src/app/globals.css). Trois raisons : un style en ligne ne peut pas décrire un état `:hover` ; la neutralisation `prefers-reduced-motion` se fait **en un seul endroit** ; le bornage des valeurs est centralisé dans le domaine.

**4. « Accentuation de la lisibilité »** ([`GalleryHoverPanel.tsx`](src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx))
- Libellé « Voile dégradé au survol » → **« Accentuation de la lisibilité »**.
- Description remplacée par le texte demandé, **mot pour mot** en variante Portfolio : « *Lors du survol de la couverture de l'album, assombrit l'image depuis le bas de la couverture vers le haut pour améliorer la lisibilité du texte.* »
- **Vérification demandée** : l'effet **correspond** à cette description — le dégradé existant (`from-black/70 via-black/10 to-transparent`) assombrit bien **depuis le bas vers le haut** — il s'applique au **survol** (et au focus clavier) et il est **compatible avec les effets cumulés** (calque indépendant, désormais découplé de l'interrupteur général). Aucun changement de rendu n'était donc nécessaire, seulement de libellé, de description et de découplage.
- Sur les variantes `static` / `dynamic`, la description emploie « photo » au lieu de « couverture d'album » : la formulation fournie aurait été fausse sur ces variantes, qui n'affichent aucun album.

### Validations
- `npx tsc --noEmit` : **OK**
- `npm run lint` : **OK**
- `npm run build` : **OK — 18 pages**
- BDD : **aucune migration**.
- Contrôle d'orphelins : recherche de `AlbumFolderImportPanel` → plus aucune référence hors note historique.

### Diff — fichiers touchés (périmètre demandé uniquement)
| Fichier | Nature |
|---|---|
| `src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx` | titre de zone + entrée d'ancres |
| `src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx` | compteur en phrase, retrait du bloc d'import, prop `demo` retirée, phrase de cadrage corrigée |
| `src/components/backoffice/pages/modules/gallery/AlbumFolderImportPanel.tsx` | **supprimé** |
| `src/components/backoffice/pages/modules/editor-type.ts` | niveau d'annotation en phrase (ML-b) |
| `src/lib/pages.ts` | type `GalleryHoverEffects`, champ `hoverEffects`, défauts, repli champ par champ |
| `src/lib/gallery-effects.ts` | `galleryHoverCssVars()` |
| `src/lib/schemas/persistence.ts` | `galleryHoverEffectsSchema` optionnel |
| `src/app/globals.css` | mécanique des effets + neutralisation `prefers-reduced-motion` |
| `src/components/modules/gallery/GalleryGrid.tsx` | variables CSS de survol |
| `src/components/modules/gallery/GalleryItem.tsx` | classes `hv-*`, brillance, découplage de l'accentuation de lisibilité |
| `src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx` | famille d'effets + libellé et description |

### Incidence technique (transparence)
Une écriture de fichier a produit un **fichier parasite** (`src/components/back`), dû à une troncature du chemin côté outil. Détecté immédiatement, **supprimé**, et la modification a été rejouée par retouches ciblées : l'arborescence est propre et `AlbumManagerPanel.tsx` porte bien les changements attendus.

### Prochaine étape prévue
Recette visuelle de la famille d'effets : activer l'interrupteur général puis **cumuler** zoom + élévation + parallaxe + brillance + saturation, vérifier la réponse au **focus clavier**, et contrôler qu'aucun effet ne subsiste avec « réduire les animations » activé dans le système. *Reste ouvert, non traité : les chaînes publiques `alt` / `aria-label` de `GalleryGrid` qui disent encore « photo » pour une couverture d'album.*

---

## 2026-09-11 – 14:25 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.22 — Une police unique pour le Back-Office, indépendante du thème du site public** (demande : *« supprime toute dépendance aux polices assujetties au thème choisi par l'utilisateur… impose une police unique pour l'ensemble du back-office, indépendante des préférences de thème front-office »*).

**Ce qui était en place.** Le layout **racine** ([`layout.tsx`](src/app/layout.tsx)) chargeait le duo éditorial du thème « Éclat Minéral & Nacre » sur `<html>` — Cormorant Garamond (`--font-heading`) et Plus Jakarta Sans (`--font-body`) — et [`globals.css`](src/app/globals.css) l'appliquait **globalement** :

| Règle, avant 11.22 | Effet sur le Back-Office |
|---|---|
| `body { font-family: var(--font-body); letter-spacing: 0.02em }` | l'administration héritait de la police **et de l'interlettrage éditorial** (+0,02 em, pénalisant sous 13 px) |
| `h1…h6 { font-family: var(--font-heading) }` — **globale** | **tous** les titres du back-office en **serif** Cormorant, y compris les titres de zone (N1) et de sous-zone (N3) de l'échelle 11.21 — réglés en sans-serif semibold et rendus en serif. La hiérarchie de 11.21 était donc **partiellement annulée par cette règle** |
| `@theme { --font-sans: var(--font-body) }` | un `font-sans` dans le back-office ramenait la police du site public |
| `var(--font-heading)` en style inline | titre de `/admin/login` en serif |

**Correctif — quatre décisions.**

1. **Nouvelle police d'application** : `Inter` déclarée dans le layout racine via `next/font` (variable `--font-admin`, `display: "swap"`, sous-ensemble latin). Inter est **variable** : toutes les graisses tiennent dans **un seul fichier**, donc aucun téléchargement multiple — c'est le critère « performante ». Choisie pour une interface **dense** : x-hauteur élevée (lisible à 11–13 px), chiffres tabulaires (tableaux, compteurs, hex), neutralité — le standard éprouvé des tableaux de bord.
2. **La police d'application devient le défaut** : `body { font-family: var(--font-admin) }`, et l'interlettrage `0.02em` **quitte** le niveau global.
3. **Le duo éditorial est restreint au site public** : `body:not(:has(.admin))` porte `--font-body` + l'interlettrage, et `:where(body:not(:has(.admin))) :is(h1…h6)` porte la serif. Le `:where()` **préserve la spécificité d'origine (0,0,1)** : les utilitaires de graisse des titres publics (`font-light`, `font-semibold`…) continuent de l'emporter, exactement comme avant — aucun risque de régression sur le site.
4. **`--font-sans` suit la police d'application**, pour qu'aucun utilitaire ne ramène la police du site dans l'administration.

**Le piège évité — et c'est le point technique de cette étape.** La police a été posée sur **`<body>`, pas sur le conteneur `.admin`**. Motif : les **dialogues, menus et feuilles de Radix** (Dialog, Select, Sheet) sont montés dans un **portail rattaché à `<body>`**, donc **en dehors** de `.admin`. Une police posée sur `.admin` les aurait laissés en police éditoriale — soit précisément l'incohérence à supprimer (« applique-la à tous les composants, menus, dialogues »). En ciblant `<body>`, **les portails héritent correctement sans aucune modification de composant**. Le marqueur `.admin` (déjà présent sur le conteneur du layout d'administration) sert simplement à distinguer les deux mondes, sans ajouter de `<div>` à la page publique — dont le chrome est enfant direct de `<body>`.

**Ce qui reste volontairement inchangé :**
- [`VisualIdentityScreen`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) conserve `var(--font-heading)` dans ses **aperçus** : il **simule le rendu du site public**. Ce n'est donc pas une incohérence mais la seule police juste à cet endroit, et elle est désormais isolée.
- **`font-mono`** : réservé aux **valeurs techniques** (slug, ancre `#contact`, code hex, nom de fichier, ratio d'image), et il utilise la pile monospace **du système** — aucune dépendance au thème, aucun téléchargement. Une police proportionnelle y nuirait à l'alignement des chiffres. Décision documentée dans [`globals.css`](src/app/globals.css).

**Réserve assumée** : le ciblage repose sur `:has()` (supporté par tous les navigateurs actuels). En son absence, le site public s'afficherait en police d'application — **dégradation visuelle, jamais fonctionnelle**.

**Observation annexe, non traitée ici** : les jetons de **palette** du back-office (`--background`, `--primary`…) sont définis sur `.admin`, donc **hors** des portails : un dialogue ouvert dans l'administration peut déjà emprunter la palette du `:root` éditorial. C'est un défaut **préexistant**, de même nature que celui corrigé ici pour les polices — il mériterait la même approche (`body:not(:has(.admin))` pour la palette). À traiter dans une étape dédiée.

- **Aucune donnée, aucun schéma, aucun comportement, aucune structure DOM, aucun rendu des composants modifiés** : uniquement la déclaration d'une police et la répartition des familles.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages — le build valide aussi le téléchargement d'Inter par `next/font`).

### Fichiers créés ou modifiés
- Modifiés : `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(back-office)/admin/login/page.tsx`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette visuelle : vérifier qu'un **dialogue** (édition d'une photo) et un **menu déroulant** s'affichent bien en Inter — c'est le cas le plus révélateur, puisque ces éléments vivent hors du conteneur `.admin`. Puis contrôler que le site public a **strictement** conservé son rendu (Cormorant sur les titres, Plus Jakarta dans le corps, interlettrage 0,02 em) sur `/`, une page `[slug]` et `/demo`. Envisager ensuite d'étendre la même approche aux **jetons de palette** (voir l'observation annexe).

---

## 2026-09-11 – 13:45 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.21 — Échelle typographique des éditeurs de modules** (constat de recette : *« il est difficile de distinguer les titres des sous-titres et des libellés… conséquence catastrophique pour le UX »*, avec inversion des tailles signalée par le propriétaire).

**Le constat était exact, et mesurable.** Relevé réel dans le code **avant** cette étape :

| Rôle | Avant | |
|---|---|---|
| Valeur saisie / placeholder | **16 px** (mobile) / **14 px** (bureau) | [`input.tsx`](src/components/ui/input.tsx:11) |
| Titre de zone | **13 px / 600** | [`EditorZone.tsx`](src/components/backoffice/pages/modules/EditorZone.tsx) |
| Sous-titre de sous-zone | **12 px / 500** | idem |
| Libellé de champ | **12 px / 500** | [`form-fields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) |
| Aide | 12 px / 400 | idem |

⇒ **quatre rôles partageaient 12 px**, et surtout : le **sous-titre et le libellé de champ étaient rigoureusement identiques** (même taille, même graisse, même couleur) — le lecteur ne pouvait pas savoir si une ligne était un titre de groupe ou un nom de champ. Et le **titre de zone (13 px) était plus petit que le texte saisi (14/16 px)** : la hiérarchie était inversée, comme signalé.

**Correctif — une échelle unique, chaque niveau distingué par au moins deux critères** (taille, graisse, couleur), parce qu'un écart d'un pixel ne se perçoit pas. Nouvelle source unique [`editor-type.ts`](src/components/backoffice/pages/modules/editor-type.ts) :

| Niveau | Rôle | Après |
|---|---|---|
| **N0** | Nom du module (accordéon) | 15 px / 600 — **déjà en place** dans [`ModuleRow`](src/components/backoffice/pages/ModuleRow.tsx:145) |
| **N1** | Titre de zone | **14 px / 600** |
| N2 | Portée de la zone | 12 px / 400 gris |
| **N3** | Sous-titre de sous-zone | **13 px / 600** |
| **N4** | Libellé de champ | **12 px / 600** |
| N5 | Aide / explication | **11 px / 400** |
| ML | Micro-libellé (compteur) | 11 px / 500 **CAPITALES** espacées, gris |
| C | Contenu saisi | **14 px (16 px mobile) — inchangé** |

**L'échelle n'est pas une invention** : N0 = 15 px / 600 et le second niveau de l'accordéon (13 px) étaient **déjà** les valeurs de [`ModuleRow`](src/components/backoffice/pages/ModuleRow.tsx). C'est le **formulaire** qui s'en écartait ; il s'y aligne. Un nouvel éditeur ne choisit plus ses tailles, il prend un **niveau**.

**Second marqueur : la géométrie.** La taille est un signal fragile (zoom, fatigue visuelle, rendu) ; l'indentation ne l'est pas. Le contenu d'une zone est décalé d'un cran, celui d'une sous-zone d'un cran de plus (`EDITOR_INDENT`) : l'imbrication se lit sans comparer quoi que ce soit.

**Localisation : trois composants partagés, dix éditeurs corrigés d'un coup** — [`EditorZone.tsx`](src/components/backoffice/pages/modules/EditorZone.tsx) (titre de zone, portée, sous-titre), [`form-fields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) (libellé, aides de `TextField` / `TextAreaField` / `SelectField`) et [`gallery/fields.tsx`](src/components/backoffice/pages/modules/gallery/fields.tsx) (`ColorField`, `SwitchField`). Aucun éditeur de module n'a été retouché un par un.

**Alignement des styles concurrents** : les titres en `text-xs font-semibold uppercase tracking-wider text-muted-foreground` — un **cinquième système** typographique — sont rattachés à l'échelle. Deviennent **N3** les titres **structurels** : « Ce que le visiteur voit en haut de la galerie » ([`ModuleGalleryEditor`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx)), `{title}` de [`ImportMediaPanel`](src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx), « Importer un dossier d'albums » ([`AlbumFolderImportPanel`](src/components/backoffice/pages/modules/gallery/AlbumFolderImportPanel.tsx)), « Photos de l'album (n) » ([`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx)), « Questions (n) », « Prestations (n) », « Sections de la page », et les catégories de [`AddSectionSheet`](src/components/backoffice/pages/AddSectionSheet.tsx). Restent **ML** (annotations, capitales conservées) : le compteur d'albums « 9 albums » et « Album 3 / 9 ». `SidebarNav` et `PagesManager` étaient déjà conformes.

**Décision assumée** : **le texte saisi n'est pas réduit.** Sous 16 px, iOS zoome automatiquement la page dès qu'un champ reçoit le focus — un défaut pire que celui corrigé. C'est la seule exception de l'échelle, et elle ne touche que le *contenu*, jamais la *structure*.

- **Aucune donnée, aucun schéma, aucun comportement, aucun rendu public modifiés** : uniquement de la typographie, de l'indentation et l'organisation des classes.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/editor-type.ts`
- Modifiés : `EditorZone.tsx`, `form-fields.tsx`, `gallery/fields.tsx`, `gallery/ImportMediaPanel.tsx`, `gallery/GalleryImagesPanel.tsx`, `gallery/AlbumFolderImportPanel.tsx`, `gallery/AlbumCoverBadgePanel.tsx`, `gallery/AlbumManagerPanel.tsx`, `gallery/AlbumEditorPanel.tsx`, `ModuleGalleryEditor.tsx`, `ModuleFaqEditor.tsx`, `ModuleServicesEditor.tsx`, `PageEditor.tsx`, `AddSectionSheet.tsx`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette visuelle sur trois éditeurs contrastés (Héro, Galerie, FAQ) : vérifier que les quatre niveaux se distinguent **de loin** (titre de module > titre de zone > sous-titre > libellé), que l'aide ne se confond plus avec un libellé, et que l'indentation rend l'imbrication lisible sans comparaison. Si un niveau reste ambigu à l'écran, il se règle désormais **en un seul endroit** : `editor-type.ts`.

---

## 2026-09-11 – 13:20 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20.c — Réorganisation de la zone « Apparence » + correctif de l'arrondi avec encadrement.** Demande du propriétaire du produit, après deux constats de recette : les libellés ne décrivaient pas le bon objet (« photos » en Portfolio) et l'arrondi *semblait* incompatible avec l'encadrement.

**1. Nouvelle organisation de la zone**, conforme à la structure demandée :

| Niveau | Intitulé |
|---|---|
| Zone (titre) | « **Apparence de la galerie d'Albums** » (Portfolio) / « Apparence de la galerie de photos » (static, dynamic) |
| Zone (portée) | « Ces réglages valent pour **toute la galerie d'albums** — ils ne concernent jamais un album en particulier. » |
| Sous-titre 1 | « **Disposition des couvertures des albums dans la galerie Portfolio** » → nombre de colonnes, écart horizontal, écart vertical, **Format d'affichage** |
| Sous-titre 2 | « **Format des couvertures des albums** » → **1.** Effet de finition (+ intensité + paramètres contextuels), **2.** Arrondi, **3.** Encadrement (+ épaisseur, couleur), **4.** Ombre portée, **5.** Effets au survol, **6.** Affichage des infos en pied de couverture |

**2. Trois déplacements, aucun réglage perdu.**
- **L'arrondi quitte « Disposition de la grille »** et rejoint l'encadrement dans « Format » ([`EffectSettingsPanel`](src/components/backoffice/pages/modules/gallery/EffectSettingsPanel.tsx)). C'est le point clé du correctif UX : l'arrondi et l'encadrement se **complètent**, mais se réglaient dans deux sous-blocs différents — impossible de juger leur combinaison, d'où l'impression d'incompatibilité. Les voici côte à côte, dans l'ordre.
- **Le bloc « Affichage sur les couvertures » quitte la zone 1** pour le sous-titre « Format » : nouveau composant [`AlbumCoverBadgePanel`](src/components/backoffice/pages/modules/gallery/AlbumCoverBadgePanel.tsx). Il décrit l'**aspect** d'une couverture, pas le **contenu** de la galerie. La zone 1 ([`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx)) ne contient donc plus que le contenu — compteur, phrase de portée, import groupé, grille.
- **« Effets au survol » passe juste après « Ombre portée »**, et non plus dans un troisième sous-bloc séparé.

**3. Correctif technique — rayons concentriques** ([`gallery-effects.ts`](src/lib/gallery-effects.ts), [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx)).
- **Cause établie** : l'image intérieure recevait **le même rayon** que le cadre extérieur, alors qu'elle est enchâssée de l'épaisseur de l'encadrement **et** de la marge de l'effet (passe-partout 10/18/28 px, sous-verre 15 px, Polaroid). Deux arcs décalés apparaissaient dans chaque coin, la couleur de fond affleurait entre eux : l'arrondi *paraissait* cassé.
- **Correctif** : `rayon intérieur = max(0, rayon extérieur − épaisseur enchâssée)`, via deux fonctions nouvelles — `galleryEffectPadding()` (rend la marge **mesurable** au lieu de la dupliquer) et `galleryConcentricRadius()`. Arrondi, encadrement, ombre et effet de finition restent **indépendants et cumulables** : aucun n'a été rendu exclusif, puisqu'un cadre fin à coins arrondis est un besoin courant et que l'ancien comportement était un défaut de rendu, non une incompatibilité.

**4. Vocabulaire selon la variante** : `galleryItemWording()` ([`pages.ts`](src/lib/pages.ts)) centralise « couvertures d'albums » ↔ « photos » ; [`EffectSettingsPanel`](src/components/backoffice/pages/modules/gallery/EffectSettingsPanel.tsx) et [`GalleryHoverPanel`](src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx) reçoivent `variant`. Les libellés restant **neutres** (« Format d'affichage », « Nombre de colonnes ») le sont à dessein : `static` et `dynamic` n'ont pas d'albums, et écrire « couvertures » en dur y aurait menti.

- **Aucune donnée, aucun schéma, aucun rendu public modifiés** : uniquement de l'organisation, des libellés et le calcul des rayons.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/gallery/AlbumCoverBadgePanel.tsx`
- Modifiés : `src/lib/gallery-effects.ts`, `src/lib/pages.ts`, `src/components/modules/gallery/GalleryItem.tsx`, `src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx`, `src/components/backoffice/pages/modules/gallery/EffectSettingsPanel.tsx`, `src/components/backoffice/pages/modules/gallery/GalleryLayoutPanel.tsx`, `src/components/backoffice/pages/modules/gallery/GalleryHoverPanel.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Points ouverts (assumés)
- Le champ s'appelle **« Format d'affichage »** (validé en 11.20.b) alors que la dernière liste le nomme « Type d'affichage » : conservé tel quel, à trancher au besoin en un mot.
- **Non traité** : les chaînes **publiques** qui parlent encore de « photo » pour une couverture d'album ([`GalleryGrid`](src/components/modules/gallery/GalleryGrid.tsx) : `alt` et `aria-label`) — même famille de défaut, mais hors du périmètre demandé ici.

---

## 2026-09-11 – 12:35 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20.b — « Format d'affichage » : libellés lisibles et explication portée par chaque option** (constat de recette : *« type de grille / grilles régulières / mosaïque me semblaient difficiles à comprendre »*).
- **Renommage** ([`pages.ts`](src/lib/pages.ts:1427)) : le champ « **Type de grille** » devient « **Format d'affichage** » et ses deux options « *Grille régulière* » / « *Mosaïque (hauteurs libres)* » deviennent « **Toutes au même format** » / « **Chacune à son format** ». Motif : les anciens libellés nommaient la **technique** (une grille, une mosaïque) là où l'utilisateur veut savoir quel **résultat** il obtient. Nouveau dictionnaire `galleryDisplayDescriptions`.
- **Vocabulaire neutre à dessein** (« vignettes ») : ces libellés sont **partagés par les trois variantes** — ils restent donc vrais qu'il s'agisse de photos (static / dynamic) ou de **couvertures d'albums** (portfolio). C'est le titre de la **zone** qui peut, lui, nommer les couvertures.
- **Nouveauté d'interface réutilisable — explication **par option**** : [`SelectItem`](src/components/ui/select.tsx:102) accepte désormais une prop `description?`, et `SelectField` la propage depuis ses options ([`form-fields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx:180)). L'explication s'affiche **sous le libellé, dans la liste déroulante**. Elle est rendue **hors de `ItemText`** — point technique décisif : Radix recopie le contenu d'`ItemText` dans le **champ fermé**, une explication placée à l'intérieur aurait donc pollué le déclencheur. Sans `description`, la structure et les classes d'origine sont **strictement conservées** : aucun risque de régression sur les autres menus. Tous les menus du back-office peuvent désormais s'en servir.
- **Aide sous le champ supprimée** : la phrase « Grille régulière : toutes les photos ont la même hauteur… » redirait ce que chaque option explique maintenant au contact de l'option elle-même. Le champ gagne à la place un tooltip « i » sur ce que le réglage **ne** fait pas (« cela ne change que la forme des cases, jamais les images »).
- **Périmètre strictement présentationnel** : les valeurs stockées (`uniform` / `masonry`), le calcul de la grille ([`GalleryGrid`](src/components/modules/gallery/GalleryGrid.tsx:101)), le rendu public et le schéma JSONB sont **inchangés**.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts`, `src/components/backoffice/pages/modules/gallery/GalleryLayoutPanel.tsx`, `src/components/backoffice/pages/modules/form-fields.tsx`, `src/components/ui/select.tsx`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Restent à planifier, **non implémentés à ce stade** : (1) la réorganisation de la zone « Apparence » selon la liste validée sur le fond (titre « Apparence de la galerie d'Albums », libellés adaptés à la variante, **déplacement** du bloc « Affichage sur les couvertures » depuis la zone 1) ; (2) le **correctif des rayons concentriques** dans [`GalleryItem`](src/components/modules/gallery/GalleryItem.tsx:82), qui rend l'arrondi et l'encadrement réellement cumulables — le diagnostic est établi (rayon intérieur identique au rayon extérieur alors que l'image est enchâssée), le correctif reste à écrire ; (3) l'alignement des chaînes publiques qui parlent encore de « photo » pour une couverture d'album.

---

## 2026-09-11 – 10:55 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20.a — séparation de la vue d'album du Portfolio : la barre d'accent change *réellement* de couleur** (seconde passe, après un correctif insuffisant — cf. l'entrée 10:35).
- **Constat de recette** : *« la barre verticale au-dessus du bouton n'a pas changé de couleur par rapport à la partie sous le bouton »*. **Exact, et voici pourquoi** : le correctif de 10:35 avait ajouté un bandeau **imbriqué** à accent `--primary` **dans** la vue d'album — mais la vue d'album était toujours rendue **à l'intérieur** de la `EditorZone` « Les albums », dont la `border-l-4` (`--zone-content`) court sur **toute** la hauteur de la zone. Le bandeau, étant un **enfant**, s'affichait **en retrait du `p-3`** de la zone : on obtenait donc **deux barres parallèles** (bleu glacier à gauche, `--primary` 12 px plus à droite) au lieu d'un **changement de couleur de la barre**. Le correctif était cosmétique, pas structurel.
- **Correctif structurel retenu** : sortir la vue d'album de la zone « Les albums ».
  - L'état `editingAlbumId` est **remonté** de [`AlbumGrid`](src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx) vers [`ModuleGalleryEditor`](src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx).
  - La vue d'album y est rendue dans une `EditorZone` **sœur**, de teinte **`detail`** (vert d'eau `--zone-detail`), **distincte** de `--zone-content` (bleu glacier) : **la barre verticale change donc de couleur au-dessus du bouton de retour**, et la zone porte son propre titre (« Album en cours d'édition ») et sa phrase de portée (nommant l'album modifié).
  - **Aucune modification du design system** : teinte **existante** réutilisée (variante b retenue) ; aucun jeton CSS ajouté.
- **Découpage des composants** :
  - nouveau [`AlbumEditorPanel.tsx`](src/components/backoffice/pages/modules/gallery/AlbumEditorPanel.tsx) — formulaire d'album (nom, description, couverture, photos) et en-tête « Retour vers la galerie des Albums », **sans cadre ni titre propres** (fournis par la zone porteuse) ;
  - [`AlbumGrid.tsx`](src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx) **réduit à la seule grille** (prop `onOpenAlbum`, plus d'état d'édition) — le glisser-déposer, les ↑/↓ et l'annonce `aria-live` sont inchangés ;
  - [`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx) ne contient plus que les réglages de la **galerie entière** et **masque la grille** pendant l'édition (`editingAlbumId !== null`), avec une note qui l'explique.
- **Garde-fou conservé** : `editingAlbum` reste un **état dérivé** — si l'album disparaît (suppression), il redevient `null`, la zone d'album disparaît et la grille réapparaît seule. Le focus clavier est posé en tête de la vue d'album à l'ouverture.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/gallery/AlbumEditorPanel.tsx`
- Modifiés : `src/components/backoffice/pages/modules/ModuleGalleryEditor.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette : la barre doit passer du **bleu glacier** (réglages de galerie) au **vert d'eau** (album) **au-dessus** du bouton « Retour vers la galerie des Albums », puis les points déjà listés (§10 du plan).

---

## 2026-09-11 – 10:35 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20 — deux ajustements d'ergonomie de la vue d'album (Portfolio), relevés en recette.**
- **Libellé du retour** : « Tous les albums » → **« Retour vers la galerie des Albums »** ([`AlbumGrid.tsx`](src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx)).
- **Confusion de rattachement corrigée** — constat : *« tout ce qui se trouve au-dessus du bouton Retour … est associé aux paramètres d'édition de l'album en cours d'édition, car relié par la même couleur de la barre verticale »*. **Cause racine** : la vue d'album est rendue **à l'intérieur** de la `EditorZone` « Les albums », qui porte la barre d'accent `--zone-content` (bleu glacier). Le formulaire d'album héritait donc de **la même barre verticale** que le compteur d'albums, le panneau d'import de dossier et les réglages des couvertures — quatre choses de **portées différentes** présentées comme un seul bloc.
- **Correctif** : un **bandeau d'en-tête teinté** ouvre désormais la vue d'album, avec sa **propre barre d'accent `--primary`** (couleur d'accent du thème, **distincte des quatre teintes de zone** définies en 11.17), un titre qui **nomme la cible** (« Album en cours d'édition », principe P1 du 11.17) et une phrase de **portée** explicite rappelant que les réglages situés au-dessus portent sur la **galerie entière** et non sur l'album ouvert (principe P2). Le bouton de retour passe en `variant="outline"` dans ce bandeau, et l'indicateur « Album N / M » le rejoint sur la même ligne (`flex-wrap` pour les écrans étroits).
- **Aucun changement de comportement ni de données** : purement présentationnel ; le focus clavier reste posé sur le bandeau à l'ouverture de la vue (§4.3).
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx`, `plans/ROADMAP-11.20-albums-thumbnail-grid.md` (libellé de retour mis à jour), `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Poursuite de la recette manuelle de l'Étape 11.20 (§10 du plan) : vérifier que la séparation de teinte est bien perçue entre les réglages de galerie et le formulaire d'album, puis les points déjà listés (24/30 albums, `Échap`, clavier, masquage public + métadonnées de partage, non-régression `static` / `dynamic`).

---

## 2026-09-11 – 10:05 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20 — LOT D : glisser-déposer sur la grille d'albums** (plan [`plans/ROADMAP-11.20-albums-thumbnail-grid.md`](plans/ROADMAP-11.20-albums-thumbnail-grid.md), §5 — dernier lot du chantier).
- **Prototype : non exécuté comme exercice manuel d'une heure.** Le risque visé par le plan (`@hello-pangea/dnd` sur une **grille qui s'enroule** : disposition qui change sous le curseur, *placeholder* animé qui saute) a été **supprimé par le choix de mécanisme** plutôt que mesuré : `@hello-pangea/dnd` n'est éprouvé dans ce projet que sur une **liste verticale** ([`ModuleDndList`](src/components/backoffice/pages/ModuleDndList.tsx)), alors que le **HTML5 natif** y tourne **déjà sur une grille qui s'enroule** — [`GalleryImagesPanel`](src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx), grille de vignettes 3/4/6 colonnes avec actions au survol : forme **identique** à la grille d'albums. C'est le repli du plan, appliqué au bon niveau : on ne tente pas la bibliothèque incertaine, on réutilise le mécanisme déjà en service sur la même forme d'interface.
- **Go : HTML5 natif** (`draggable` + `dragover` / `drop` / `dragend`), **sans dépendance nouvelle** (D-8). Aucun réordonnancement en direct : l'ordre n'est modifié **qu'au dépôt** — la grille ne saute donc pas pendant le geste, et `Échap` restitue un ordre d'origine intact **par construction**, non par restauration d'un instantané.
- **Ergonomie** : indicateur de dépôt (anneau sur la cible), vignette déplacée atténuée, curseur `grab`/`grabbing`, et **garde** empêchant un glisser de partir de la barre d'actions (`data-album-actions`) — masquer / éditer / ↑ / ↓ / supprimer restent des clics purs.
- **Accessibilité (§5.2, décision A-4)** : le glisser **n'est pas** le seul moyen de réordonner — les **↑ / ↓** de chaque vignette sont conservés et restent le chemin **clavier** ; le glisser est une **commodité**, disponible **en plus**. Déplacement **annoncé** aux lecteurs d'écran (`role="status"`, `aria-live="polite"`, texte `sr-only`), y compris l'annulation par `Échap`.
- **À vérifier en recette manuelle** — le critère du plan ne peut pas être mesuré par l'agent (pas de navigateur) : déplacer la **première** vignette vers la **dernière** position d'une grille de **24 albums** sans saut de grille ; `Échap` en cours de geste ; réordonnancement **↑ / ↓** au clavier ; mise à jour **immédiate** du numéro d'ordre ; et répercussion du nouvel ordre sur la **grille publique**.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src/components/backoffice/pages/modules/gallery --max-warnings=0` OK ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/pages/modules/gallery/AlbumThumbnail.tsx` (prop `dnd` optionnelle, repère `data-album-actions`, styles de glisser / dépôt), `src/components/backoffice/pages/modules/gallery/AlbumGrid.tsx` (état de glisser, `Échap`, dépôt, annonce `aria-live`), `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
Recette manuelle de l'Étape 11.20 (§10 du plan) : volumétrie 30 albums, cohérence public / back-office du **masquage** (grille publique **et** métadonnées de partage), album **sans photo** signalé, parcours **clavier** complet, non-régression des variantes `static` / `dynamic` (CTA, badge, diaporama, disposition) et des contenus Portfolio enregistrés **avant** ce chantier.

---

## 2026-09-11 – 10:00 (heure locale America/Bogota)

### Tâche exécutée
**Étape 11.20 — LOT E : import groupé « un dossier parent → chaque sous-dossier devient un album »** (plan [`plans/ROADMAP-11.20-albums-thumbnail-grid.md`](plans/ROADMAP-11.20-albums-thumbnail-grid.md)).
- **Constat** : la grille rend la **gestion** des albums confortable, pas leur **création** — créer trente albums à la main reste trente fois le même geste.
- **Mécanique** : `webkitRelativePath` expose le chemin relatif de chaque fichier (`Mariage/IMG_001.jpg`) ; le **premier** segment est le dossier racine choisi, le **deuxième** nomme l'album. Regroupement en mémoire, **aucun envoi** avant validation de l'opérateur.
- **Nouveau composant** [`AlbumFolderImportPanel.tsx`](src/components/backoffice/pages/modules/gallery/AlbumFolderImportPanel.tsx) : bouton « Choisir un dossier d'albums », **analyse affichée avant import** (liste des albums détectés avec nombre de photos et fichiers refusés par dossier), puis bouton « Créer N albums et importer M photos » (le second clic **est** la confirmation).
- **Cas limites §6.1 traités** : photos **à la racine** → album au nom du dossier parent ; sous-dossier **sans image exploitable** → ignoré **et signalé** (aucun album vide créé) ; fichiers refusés (non-image ou > 15 Mo) **comptés par dossier** ; **volume important** → avertissement + **confirmation explicite** au-delà de `RECOMMENDED_BATCH = 50` photos ; **album de même nom déjà présent** → création d'un nouvel album (aucune fusion silencieuse).
- **Synthèse finale** en `role="status"` : albums créés, fichiers ignorés, envois en échec, dossiers vides. Un groupe dont **tous** les envois échouent est abandonné (aucun album vide enregistré).
- **Réutilisation** : `createGalleryAlbum()` (couverture = première photo via `coverImageId: null`) et les visuels de galerie au **format exact** de `GalleryImagesPanel`.
- **Zéro duplication** : `ALLOWED_IMAGE_TYPES`, `MAX_FILE_BYTES`, `RECOMMENDED_BATCH` et `baseNameWithoutExtension()` sont désormais **exportés** depuis [`ImportMediaPanel.tsx`](src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx), avec un nouveau prédicat partagé `isUsableImageFile()` utilisé par **les deux** panneaux d'import (le contrat de filtrage reste donc identique).
- Branchement dans [`AlbumManagerPanel`](src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx) juste avant la grille. **Le comportement de l'import de dossier simple est inchangé** (contrat de filtre identique, code partagé).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src/components/backoffice/pages/modules/gallery --max-warnings=0` OK.

### Fichiers créés ou modifiés
- Créé : `src/components/backoffice/pages/modules/gallery/AlbumFolderImportPanel.tsx`
- Modifiés : `src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx`, `src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx`, `ROADMAP.md`, `CHANGELOG.md`
- BDD : **aucune migration**.

### Prochaine étape prévue
**LOT D** — glisser-déposer sur la grille, **précédé du prototype obligatoire** (critère mesurable : première → dernière position d'une grille de 24 albums, sans saut de grille, position intermédiaire conservée, Échap pour revenir à l'ordre d'origine) ; **go/no-go** consigné ici, y compris en cas d'échec avec le repli « Déplacer à la position… » (les ↑/↓ restent en place dans tous les cas).

---

## 2026-09-09 – 22:11 (heure locale America/Bogota)

### Tâche exécutée
**Amendement 10.1.a — Liens de navigation orphelins & site vierge** (plan [`plans/ROADMAP-10.1-site-starter-onboarding.md`](plans/ROADMAP-10.1-site-starter-onboarding.md))
- **Cause identifiée** : `PagesNavigationSync` nettoie bien les entrées **liées à une page** (et la FK cascade en BDD), mais les entrées **`custom` (`pageId: null`)** — ancres du seed (`/portfolio#mariages`…), placeholders de presets (`/series`, `/galeries`), liens manuels — **n'étaient jamais nettoyées** → liens résiduels dans `/admin/navigation` et dans le Header.
- **Domaine** [`navigation.ts`](src/lib/navigation.ts) : `internalHrefSlug(href)` (`/portfolio#mariages` → `portfolio` ; `/` → `""` ; `#ancre`/`https://…` → `null`) et `isOrphanNavEntry(entry, slugs)` (liens internes morts uniquement — externes et ancres locales préservés).
- **Serveur** : `listPageSlugs()` ([`pages.repository.ts`](src/db/repositories/pages.repository.ts)) + **`pruneOrphanNavigation()`** ([`navigation.repository.ts`](src/db/repositories/navigation.repository.ts), réutilise `saveNavigation`) ; appel dans [`loadInitialData`](src/db/load-initial-data.ts) **uniquement si 0 page** → purge douce et ciblée (aucune suppression de placeholder sur un site qui a des pages).
- **Client** [`PagesNavigationSync`](src/components/backoffice/navigation/PagesNavigationSync.tsx) : **étape 5** — suppression immédiate des entrées `custom` orphelines (Header racine/sous-menu + Footer).
- **Action explicite** : `clearNavigation(area | "all")` ([`NavigationStoreProvider`](src/components/backoffice/navigation/NavigationStoreProvider.tsx)) + carte **« Zone de réinitialisation »** avec confirmation destructrice dans [`NavigationManager`](src/components/backoffice/navigation/NavigationManager.tsx) → Header/Footer vidés, persistés par `PUT /api/navigation`.
- **Onboarding autonome** [layout front-office](src/app/(front-office)/layout.tsx) : si `dbAvailable && !hasHomepage && 0 page` → rendu **sans Header/Footer** (aucune barre de nav vide/résiduelle).
- **Informatif** [`NavEntryRow`](src/components/backoffice/navigation/NavEntryRow.tsx) : badge **« Lien mort »** sur une entrée interne sans cible (site avec pages — pas de suppression auto).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts`, `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`, `src/components/backoffice/navigation/PagesNavigationSync.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationManager.tsx`, `src/components/backoffice/navigation/NavEntryRow.tsx`, `src/app/(front-office)/layout.tsx`, `plans/ROADMAP-10.1-site-starter-onboarding.md`, `CHANGELOG.md`
- BDD : **aucune** migration (réutilise `saveNavigation`).

### Prochaine étape prévue
Vérifier : supprimer toutes les pages → `/admin/navigation` **vide**, `/` **sans barre de navigation** (onboarding), `F5` stable ; « Vider la navigation » → menu vidé et persisté ; liens externes/ancres locales conservés ; badge « Lien mort » visible sur un lien interne sans cible.

---

## 2026-09-09 – 21:52 (heure locale America/Bogota)

### Tâche exécutée
**Étape 10.1 — Démarrage de site & Onboarding public** (plan [`plans/ROADMAP-10.1-site-starter-onboarding.md`](plans/ROADMAP-10.1-site-starter-onboarding.md) validé) : suppression des **données fantômes** (seed) et écran public `WelcomeOnboarding`.
- **Principe** : le seed n'est plus un défaut implicite des stores → **fallback serveur explicite uniquement si la BDD est injoignable**.
- **BDD** [`schema.ts`](src/db/schema.ts) : colonne **`pages.is_home`** + **index unique partiel** (`uniques par photographe`) ; migration [`0005_jittery_turbo.sql`](drizzle/0005_jittery_turbo.sql) (générée + backfill `slug = '' → is_home = true` éditée à la main) — **`db:migrate` appliqué**.
- **Domaine** [`pages.ts`](src/lib/pages.ts) : `SitePage.isHome`, `pageHrefFor(page)` (accueil → `/`), `demotedHomeSlug(pageId)` ; seed enrichi.
- **Fini les fantômes** : [`getPublicPage`](src/lib/public-page.ts) ne retombe plus sur le seed **quand la BDD répond** ; **`getHomepageState()`** renvoie `ready | draft | missing` (un accueil brouillon ≠ onboarding) ; ✅ `PagesStoreProvider` et ✅ `navigation-store` ont un **défaut vide**.
- **Loader** [`load-initial-data.ts`](src/db/load-initial-data.ts) : `pages`/`navigation` **toujours fournis si BDD OK (même vides)** + `hasHomepage` ; seed explicite si BDD down ; **plus d'auto-seed** (`ensureTenantSeeded` n'est plus appelé — reste en opt-in `npm run db:seed`).
- **Repository** [`pages.repository.ts`](src/db/repositories/pages.repository.ts) : `getHomePage`, **`setHomePage` transactionnel** (ancien accueil démis + slug libéré, nouveau accueil en slug `""`), `ensurePhotographerProfile` à la demande (FK mode démo).
- **API** [`POST /api/pages/[pageId]/home`](src/app/api/pages/[pageId]/home/route.ts) + `persistSetHomePage`.
- **UI Pages** [`PagesManager`](src/components/backoffice/pages/PagesManager.tsx) : badge **« Accueil »** + action **« Définir comme page d'accueil »** ; [`PageMetadataForm`](src/components/backoffice/pages/PageMetadataForm.tsx) : `isHome` déduit de la page (plus du slug vide) — le parcours « page blanche » est **débloqué**.
- **Écran public** [`WelcomeOnboarding`](src/components/onboarding/WelcomeOnboarding.tsx) (Server Component) rendu par [`/`](src/app/(front-office)/page.tsx) quand `missing` : 200 + **`noindex`**, 2 variantes (visiteur → CTA `/admin/login` ; admin → CTA `/admin/pages` et `/admin/navigation`). Accueil `draft` → 404.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages, route `/api/pages/[pageId]/home` présente).

### Fichiers créés ou modifiés
- Créés : `src/components/onboarding/WelcomeOnboarding.tsx`, `src/app/api/pages/[pageId]/home/route.ts`, `drizzle/0005_jittery_turbo.sql`, `plans/ROADMAP-10.1-site-starter-onboarding.md`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/db/repositories/pages.repository.ts`, `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/navigation-store.ts`, `src/lib/persistence-client.ts`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/PagesManager.tsx`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/app/(front-office)/page.tsx`, `CHANGELOG.md`
- BDD : `pages.is_home` + index partiel + backfill (migration 0005).

### Prochaine étape prévue
Scénarios DoD à vérifier par l'utilisateur : supprimer toutes les pages → `F5` sur `/` (aucune recréation, écran d'onboarding, menu vide) ; cas anon/admin ; créer une 1ʳᵉ page → **Définir comme page d'accueil** → **Publier** → `/` la sert. *Reporté en v2* : `site_mode`, reset in-app, support `?redirect=` après login.

---

## 2026-09-09 – 20:36 (heure locale America/Bogota)

### Tâche exécutée
**Module « Identité visuelle / Logo » — amendement 9.1.b** (demandes utilisateur) :
1. **échelle de taille calibrée** (ligne 1 ≈ +25 % du texte du menu ; ligne 1 ≈ +20 % de la ligne 2) + **2 niveaux supérieurs ajoutés** ;
2. **couleur par défaut des deux lignes = `#1E293B`** ;
3. **palette sur mesure** (2 rangées) + **pipette écran** (échantillonnage hors onglet).
- **Domaine** [`visual-identity.ts`](src/lib/visual-identity.ts) : `VisualIdentityTextSize` passe à **5 niveaux** (`small, medium, large, xlarge, xxlarge`) ; `textSizeLabels` (Petite · Moyenne (défaut) · Grande · Très grande · Énorme) ; **`TEXT_LINE_PX` recalibré** — ligne 1 : 14/18/22/25/30 px, ligne 2 : 12/15/18/21/25 px (défaut **18/15** = ratio 1,2 exact et ≈ +28,6 % vs menu 14 px) ; `TEXT_SIZE_LETTER_SPACING` sur 5 niveaux ; **défauts couleur `#1E293B`** pour les 2 lignes ; palettes **`VISUAL_IDENTITY_NEUTRALS`** (8) + **`VISUAL_IDENTITY_ACCENTS`** (10) ; `readSize` tolérant étendu.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : enum taille 5 niveaux + défauts couleur `#1E293B`.
- **Écran** [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : color picker sur **2 rangées** (neutres puis accents) ; bouton **« Pipette »** par ligne utilisant l'**EyeDropper API** (`new EyeDropper().open()`) → prélèvement **n'importe où à l'écran, y compris hors de l'onglet** ; détection de support (message si non supporté) ; note des nouvelles métriques.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : aucun changement de logique — applique les nouvelles px/espacements par ligne via `TEXT_LINE_PX` / `TEXT_SIZE_LETTER_SPACING`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/visual-identity.ts`, `src/lib/schemas/persistence.ts`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `plans/ROADMAP-9.1-visual-identity-logo.md`, `CHANGELOG.md`
- BDD : **aucune** migration (JSONB — tokens de taille inchangés, valeurs px recalculées à l'affichage).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → « Moyenne » (défaut) doit paraître nettement plus grande que le menu ; tester « Très grande »/« Énorme » ; utiliser la **pipette** pour échantillonner une couleur hors onglet ; vérifier que les deux lignes valent `#1E293B` par défaut.

---

## 2026-09-09 – 20:25 (heure locale America/Bogota)

### Tâche exécutée
**Module « Identité visuelle / Logo » — amendement 9.1.a** (demande utilisateur) :
1. **Paramètres typographiques distincts par ligne** (ligne 1 et ligne 2 indépendantes) ;
2. **Fond d'aperçu neutre médian** (ni blanc ni noir) pour vérifier la lisibilité d'un texte blanc, noir ou gris.
- **Domaine pur** [`visual-identity.ts`](src/lib/visual-identity.ts) : `VisualIdentityTextLine { value, color, size, weight }`, `text: { line1, line2 }` ; `TEXT_LINE_PX` (ligne 1 → 12/14/16 px ; ligne 2 → 10/12/13 px), `TEXT_SIZE_LETTER_SPACING`, `VISUAL_IDENTITY_PREVIEW_BG = "#808080"`, **`normalizeVisualIdentity()`** (rétro-compat de l'ancienne forme plate v1 → v2, sans lever) ; fichier **sans `"use client"`** → importable côté serveur.
- **Store séparé** [`visual-identity-store.ts`](src/lib/visual-identity-store.ts) (nouveau, `"use client"`) : snapshot/hydratation/subscription + `useVisualIdentity()`.
- **Zod v2** [`persistence.ts`](src/lib/schemas/persistence.ts) : `line1` (max 35, graisse 600 par défaut) et `line2` (max 45, graisse 400) avec chacun couleur/taille/graisse.
- **Repository** [`visual-identity.repository.ts`](src/db/repositories/visual-identity.repository.ts) : décodage via `normalizeVisualIdentity` puis Zod (contenus JSONB existants **migrés à la volée**, aucune migration SQL nécessaire).
- **Écran** [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : composant `TextLineFields` réutilisé → **rubrique « Ligne 1 » et « Ligne 2 » avec contrôles indépendants** (texte, couleur + presets, taille, graisse) ; **fond d'aperçu `#808080`** (aperçu en direct + encadré « Logo actuel »), repli `siteName` en gris foncé lisible.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : chaque ligne applique **ses propres** couleur/taille/graisse/espacement.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages).

### Fichiers créés ou modifiés
- Créés : `src/lib/visual-identity-store.ts`
- Modifiés : `src/lib/visual-identity.ts`, `src/lib/schemas/persistence.ts`, `src/db/repositories/visual-identity.repository.ts`, `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `src/components/layout/Header.tsx`, `plans/ROADMAP-9.1-visual-identity-logo.md`, `CHANGELOG.md`
- BDD : **aucune** migration (JSONB — normalisation applicative).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → régler séparément Ligne 1 et Ligne 2 (couleur/taille/graisse propres) → aperçu sur fond gris : les textes blanc, noir et gris doivent rester lisibles → « Enregistrer » → Header conforme.

---

## 2026-09-09 – 19:59 (heure locale America/Bogota)

### Tâche exécutée
**Nouveau module « Identité visuelle / Logo » (ROADMAP 9.1)** — configuration **100 % manuelle** de l'espace marque du Header (plan [`plans/ROADMAP-9.1-visual-identity-logo.md`](plans/ROADMAP-9.1-visual-identity-logo.md) validé)
- **BDD** [`schema.ts`](src/db/schema.ts) : table **`site_visual_identity`** (1 ligne/photographe, `data` **JSONB typé** `VisualIdentity`, timestamps). Migration **`drizzle/0004_steady_mikhail_rasputin.sql`** (générée + **RLS owner-only** ajoutée à la main) — **`db:migrate` appliqué avec succès**.
- **Domaine** [`visual-identity.ts`](src/lib/visual-identity.ts) (nouveau) : types (`VisualIdentityMode`, tailles, graisses), `DEFAULT_VISUAL_IDENTITY` (**champs vierges**, aucun pré-remplissage Profil), `TEXT_SIZE_METRICS` (12/10 · 14/12 · 16/13 px + espacement auto), contraintes (35/45 car., logo 2 Mo / 200×60), palette, `isVisualIdentityEmpty`, store module + `useVisualIdentity()`.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : `VisualIdentitySchema` (enums + défauts, **tolérant**, longueurs max appliquées).
- **Repository** [`visual-identity.repository.ts`](src/db/repositories/visual-identity.repository.ts) (nouveau) : `getVisualIdentity` / `upsertVisualIdentity` ; [`load-initial-data.ts`](src/db/load-initial-data.ts) : `visualIdentity?`.
- **Provider** [`VisualIdentityProvider.tsx`](src/components/backoffice/visual-identity/VisualIdentityProvider.tsx) (nouveau) : hydratation post-montage + persistance débouncée 400 ms ; monté dans les layouts [front-office](src/app/(front-office)/layout.tsx) et [admin](src/app/(back-office)/admin/layout.tsx).
- **API** [`/api/visual-identity`](src/app/api/visual-identity/route.ts) (nouveau, GET/PUT) + [`persistVisualIdentity`](src/lib/persistence-client.ts).
- **Écran** [`/admin/identite-visuelle`](src/app/(back-office)/admin/identite-visuelle/page.tsx) + [`VisualIdentityScreen.tsx`](src/components/backoffice/visual-identity/VisualIdentityScreen.tsx) : sélecteur **Texte | Logo**, rubrique Texte (2 lignes 35/45, couleur `input type=color` + 10 presets + Hex/RGBA, taille 3 positions, graisse 3 positions, espacement auto), rubrique Logo (**drag & drop**, SVG/PNG/JPG/WebP, **≤ 2 Mo**, altText, rendu **≤ 200×60 `object-contain`**), **aperçu en direct**, « Enregistrer » (flush BDD + états).
- **Sidebar** [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx) : entrée exacte **« Identité visuelle / Logo »** (icône Palette) → `/admin/identite-visuelle`.
- **Header** [`Header.tsx`](src/components/layout/Header.tsx) : la marque rend le **mode Texte** (2 lignes stylées) ou le **mode Logo** (≤ 200×60) ; **repli `siteName`** si non configuré (aucun lien avec Profil).
- **SVG** : [`/api/media`](src/app/api/media/route.ts) accepte `image/svg+xml` + [`extensionFromMime`](src/lib/supabase/storage.ts:23) mappe `svg`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (18 pages, routes `/admin/identite-visuelle` et `/api/visual-identity`).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-9.1-visual-identity-logo.md`, `src/lib/visual-identity.ts`, `src/db/repositories/visual-identity.repository.ts`, `src/app/api/visual-identity/route.ts`, `src/components/backoffice/visual-identity/VisualIdentityProvider.tsx`, `src/components/backoffice/visual-identity/VisualIdentityScreen.tsx`, `src/app/(back-office)/admin/identite-visuelle/page.tsx`, `drizzle/0004_steady_mikhail_rasputin.sql`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/lib/schemas/persistence.ts`, `src/lib/persistence-client.ts`, `src/components/backoffice/SidebarNav.tsx`, `src/components/layout/Header.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `src/app/api/media/route.ts`, `src/lib/supabase/storage.ts`, `CHANGELOG.md`
- BDD : nouvelle table `site_visual_identity` + migration 0004 appliquée (RLS owner).

### Prochaine étape prévue
Test utilisateur : `/admin/identite-visuelle` → mode Texte (2 lignes, couleur/taille/graisse) ou Logo (SVG/PNG ≤ 2 Mo) → « Enregistrer » → le Header reflète immédiatement la configuration ; **F5** → conservée (BDD).

---

## 2026-09-09 – 19:19 (heure locale America/Bogota)

### Tâche exécutée
**Header — la marque (gauche) n'est plus auto-complétée par le module « Profil »** (demande utilisateur : une fonctionnalité dédiée « Nom + baseline ou logo à télécharger » sera développée ultérieurement pour cet espace)
- [`Header.tsx`](src/components/layout/Header.tsx) : la zone **marque (gauche)** revient à l'affichage **statique `siteName`** — suppression de l'auto-complétion depuis le Profil pour le **nom** (`profile.brandName`) et le **logo** (`profile.logoUrl`) ; le **favicon** (onglet navigateur, hors zone marque) reste alimenté par le Profil.
- Le module Profil conserve sa **persistance BDD** (8.2) ; seules les injections Header (nom/logo) sont retirées — aucun impact sur `/admin/profile`, Footer ni l'API `/api/profile`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (16 pages).

### Fichiers créés ou modifiés
- Modifiés : `src/components/layout/Header.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Fonctionnalité dédiée (ultérieure) : configurer l'espace marque du Header (nom + baseline et/ou logo à télécharger) via un module/réglage dédié du Back-Office.

---

## 2026-09-09 – 19:05 (heure locale America/Bogota)

### Tâche exécutée
**Correctif « Persistance BDD refusée (HTTP 400) — Email invalide »** (module Profil)
- **Cause** : `OwnerProfileSchema` validait `publicEmail`/`contactFormEmail` avec `z.string().email(...)` ; toute valeur non conforme (ex. email saisi sans TLD ou texte libre) faisait échouer **`PUT /api/profile` → 400**, bloquant la sauvegarde du profil entier (le Provider en débounce journalisait l'erreur et « Enregistrer » échouait).
- **Correctif** [`persistence.ts`](src/lib/schemas/persistence.ts:229) : emails passés en **texte libre** (`z.string().default("")`) — la persistance n'est plus jamais bloquée par un email ; l'indication de format reste portée par `type="email"` dans [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx). Retrait du log de debug temporaire et message d'échec `save()` rendu générique (« base de données indisponible ou erreur serveur »).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/schemas/persistence.ts`, `src/components/backoffice/profile/ProfileScreen.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Test utilisateur : saisir un profil avec un email « libre » (ex. sans TLD) → « Enregistrer » → message vert BDD (plus de 400) → F5 → données conservées.

---

## 2026-09-09 – 18:33 (heure locale America/Bogota)

### Tâche exécutée
**Module Profil — persistance BDD durable (ROADMAP 8.2)** — corrige « les infos entrées dans Profil ne sont pas sauvegardées » (diagnostic : état uniquement en mémoire, perdu au rechargement)
- **BDD** [`schema.ts`](src/db/schema.ts) : nouvelle table **`site_owner_profile`** (1 ligne/photographe : `photographer_id` PK/FK → `profiles`, profil complet en `data` **JSONB typé** `OwnerProfile`, timestamps). Migration **`drizzle/0003_serious_clea.sql`** (générée par `db:generate` puis éditée à la main) : **RLS owner-only** (`authenticated`, `photographer_id = auth.uid()` ; SELECT/INSERT/UPDATE/DELETE) — aucune lecture `anon`. **`db:migrate` appliqué avec succès** (Supabase joignable).
- **Repository** [`owner-profile.repository.ts`](src/db/repositories/owner-profile.repository.ts) (nouveau, serveur) : `getOwnerProfile` (decode Zod tolérant → `null` si absente) + `upsertOwnerProfile` (`onConflictDoUpdate`, PK).
- **Domaine** [`owner-profile.ts`](src/lib/owner-profile.ts) : ajout de **`hydrateOwnerProfile(profile)`** (fusion `DEFAULT`) + retrait du log de debug temporaire. [`persistence.ts`](src/lib/schemas/persistence.ts) : `OwnerProfileSchema` assoupli (noms autorisés vides, cohérent avec le fallback Header `siteName`).
- **Hydratation SSR** [`load-initial-data.ts`](src/db/load-initial-data.ts) : `SiteInitialData.profile` chargé côté serveur.
- **Provider** [`OwnerProfileProvider.tsx`](src/components/backoffice/profile/OwnerProfileProvider.tsx) (nouveau, client) : hydratation unique post-montage + **persistance débouncée (400 ms)** quand BDD dispo (ignorant 1er rendu & hydratation) ; monté dans le layout **[front-office](src/app/(front-office)/layout.tsx)** (Header/Footer) et le layout **[admin](src/app/(back-office)/admin/layout.tsx)**.
- **API** [`/api/profile`](src/app/api/profile/route.ts) (nouveau) : `GET` (profil) + `PUT` (upsert validé `OwnerProfileSchema`, scope `resolvePhotographerId`) ; [`persistence-client.ts`](src/lib/persistence-client.ts) : `persistOwnerProfile`.
- **UI** [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx) : « Enregistrer » = **flush immédiat réel** (PUT) avec retours d'état — succès « Profil enregistré dans la base de données » (vert) ; échec/hors-BDD → « Base de données indisponible : conservé en mémoire, sera perdu au rechargement » (rouge, plus de faux « en mémoire »).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (16 pages, route `/api/profile` présente).

### Fichiers créés ou modifiés
- Créés : `src/db/repositories/owner-profile.repository.ts`, `src/components/backoffice/profile/OwnerProfileProvider.tsx`, `src/app/api/profile/route.ts`, `drizzle/0003_serious_clea.sql`, `plans/ROADMAP-8.2-owner-profile-persistence.md`
- Modifiés : `src/db/schema.ts`, `src/db/load-initial-data.ts`, `src/lib/owner-profile.ts`, `src/lib/persistence-client.ts`, `src/lib/schemas/persistence.ts`, `src/components/backoffice/profile/ProfileScreen.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `CHANGELOG.md`
- BDD : nouvelle table `site_owner_profile` + migration 0003 appliquée (RLS owner).

### Prochaine étape prévue
Test utilisateur : saisir/modifier `/admin/profile` → « Enregistrer » (message vert BDD) → **F5** → les données restent (hydratées depuis la BDD). Sans Supabase, message rouge explicite attendu.

---

## 2026-09-09 – 17:57 (heure locale America/Bogota)

### Tâche exécutée
**Module Hero Parallaxe — échelle d'intensité étendue à 7 niveaux « par force »** (demande utilisateur : les niveaux créés étaient trop légers ; ajouter 4 niveaux supérieurs + renommer par force d'intensité)
- **Domaine** [`pages.ts`](src/lib/pages.ts:669) : `ParallaxSpeed` passe de 3 à **7 tokens** `very-light | light | medium | pronounced | strong | very-strong | extreme` ; ordre Select + libellés « force » **« Très léger / Léger / Modéré / Marqué / Fort / Très fort / Extrême »** ; `PARALLAX_FACTOR` retravaillé (`0.07 → 0.60`) et nouveau **`PARALLAX_OVERSCAN`** (`0.10 → 0.44`) ; résolveur `resolveHeroParallaxContent` **rétro-compatible** (l'ancien token `subtle` de l'Étape 7.4 → `very-light` ; `medium`/`strong` conservés).
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts:131) : `parallaxSpeedSchema` = `z.enum` des 7 niveaux.
- **Rendu** [`HeroParallaxBackground.tsx`](src/components/modules/hero/HeroParallaxBackground.tsx) : l'**overscan de l'image devient proportionnel à l'intensité** (`top`/`height` en style inline au lieu de `top-[-12%] h-[124%]` fixes) et le **plafond de déplacement** passe de 12 % fixe à `rect.height * overscan` → les niveaux « Fort / Très fort / Extrême » produisent un effet réellement marqué (défilement jusqu'à ±44 % de la hauteur) ; dépendance `overscan` ajoutée (eslint 0 warning).
- **Éditeur** [`ModuleHeroParallaxEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx) : rubrique ⚙️ affiche les 7 libellés + tooltip « i » expliquant l'échelle (« Modéré » = classique).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroParallaxBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée (contenus JSONB rétro-compatibles via le résolveur).

### Prochaine étape prévue
Contrôle visuel navigateur (desktop ≥ 1024 px) : tester chaque niveau « Très léger → Extrême » au défilement — les niveaux forts doivent montrer un décalage nettement plus ample ; vérifier qu'aucune bordure d'image n'apparaît sur les plus fortes amplitudes.

---

## 2026-09-09 – 17:45 (heure locale America/Bogota)

### Tâche exécutée
**Correctif runtime SSR — « Missing getServerSnapshot » (module Profil)** (signalé après la phase 8.1)
- **Cause** : [`owner-profile.ts`](src/lib/owner-profile.ts) (`useOwnerProfile`) appelait `useSyncExternalStore(subscribeOwnerProfile, getOwnerProfileSnapshot)` **sans le 3ᵉ argument `getServerSnapshot`**. Le [`Header`](src/components/layout/Header.tsx:241) étant un Client Component rendu en SSR via le layout serveur async [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx:55), React 19 / Next 16.3.4 levait une erreur runtime « Missing getServerSnapshot … Will revert to client rendering » (le store Navigation passe déjà ce 3ᵉ argument — voir [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx:174)).
- **Correctif** [`owner-profile.ts`](src/lib/owner-profile.ts) : ajout de **`getOwnerProfileServerSnapshot()`** (retourne le snapshot du module, comme `getNavigationServerSnapshot`) passé en 3ᵉ argument de `useSyncExternalStore` ; suppression des logs de debug temporaires ajoutés pour la validation.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (SSR des pages front-office `/`, `/[slug]`, `/demo` régénéré sans erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/owner-profile.ts`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Contrôle visuel navigateur (aucune erreur SSR à l’ouverture d’une page publique). Ensuite : **étoffer l’échelle d’intensité du module Hero Parallaxe** (4 niveaux supérieurs demandés par l’utilisateur) — à planifier (étiquette/niveaux, facteurs d’amplitude, rétro-compatibilité `parallaxSpeed` stocké, Zod).

---

## 2026-09-09 – 17:27 (heure locale America/Bogota)

### Tâche exécutée
**Module Profil — ajustements finaux UI demandés par l’utilisateur** (écran [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx))
- 🏷️ Rubrique « 📍 Contacts & adresses » : libellé **« Email de contact public » → « Email de contact »** et toggle **« Utiliser l’email public pour les formulaires » → « Utiliser l’email pour recevoir les formulaires »** (tips mis à jour en cohérence).
- ℹ️ Ajout d’un **tooltip « i »** sur « Client idéal / Persona » (explique le persona à un non-technique et son usage IA).
- 📄 Remplacement des deux champs « PDF — Présentation / Bio (URL) » et « PDF — CV (URL) » par un **champ unique de téléchargement** « Téléchargements d’informations complémentaires (Bio, CV, actualités…) » (accepte `.doc, .pdf, .docx, .jpg, .jpeg, .png`), qui alimente `profile.documents` (multi-fichiers, liste de noms retirables) — documents destinés à une **analyse ultérieure par l’assistant IA** (cf. fiche : « … analysés plus tard par l’IA »).
- **Domaine/Zod déjà alignés** : [`owner-profile.ts`](src/lib/owner-profile.ts) (`documents: string[]`, `DEFAULT` `[]`) et [`persistence.ts`](src/lib/schemas/persistence.ts) (`OwnerProfileSchema.documents`) — aucune régression.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (route `/admin/profile` présente).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/profile/ProfileScreen.tsx`, `CHANGELOG.md`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur du rendu (`/admin/profile`) puis persistance BDD `site_owner_profile` + endpoint mot de passe réel (Supabase) et analyse IA des `documents`.

---

## 2026-09-09 – 16:48 (heure locale America/Bogota)

### Tâche exécutée
**Phase 8 – Module « Profil » (`site_owner_profile`)** — MVP validé (plan [`plans/ROADMAP-8.1-owner-profile.md`](plans/ROADMAP-8.1-owner-profile.md))
- **Domaine** [`src/lib/owner-profile.ts`](src/lib/owner-profile.ts) (nouveau) : type `OwnerProfile` (Identité/Contacts/Légal/IA), `DEFAULT_OWNER_PROFILE`, constantes (grammaticalPerson, communicationStyle), **store partagé** (module) + hook **`useOwnerProfile()`** (update) et **`getAIContextPrompt(profile)`**.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : `OwnerProfileSchema` + `ProfileSecuritySchema` (force : majuscule/chiffre/symbole/8 min, correspondance).
- **Back-Office** : route **`/admin/profile`** (page.tsx) + entrée sidebar **« Profil »** ([`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx)) + écran [`ProfileScreen.tsx`](src/components/backoffice/profile/ProfileScreen.tsx) en **4 rubriques** avec tooltips « i » : 🏢 Identité & visuels (logo upload + vignette, favicon…), 📍 Contacts & adresses (toggles affichage, email formulaire masqué si même email, réseaux sociaux), ⚖️ Légal & ligne éditoriale IA (statut/SIRET/TVA/publication, personne/style, persona, PDF), 🔒 Sécurité & mot de passe (currentPassword obligatoire, force, confirmation, revoke ; MVP : validation + message démo — endpoint réel Supabase/email à connecter).
- **Intégrations Builder** : [`Header.tsx`](src/components/layout/Header.tsx) — **brandName/logo** du Profil (repli `siteName`) + **favicon** dynamique ; [`Footer.tsx`](src/components/layout/Footer.tsx) — marque ©, **réseaux sociaux** du Profil fusionnés, ligne **mentions légales** (statut/SIRET/directeur publication).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (dépend de Supabase/Resend)** : persistance BDD `site_owner_profile`, endpoint `POST /api/profile/password` + révocation sessions + email d’alerte.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-8.1-owner-profile.md`, `src/lib/owner-profile.ts`, `src/app/(back-office)/admin/profile/page.tsx`, `src/components/backoffice/profile/ProfileScreen.tsx`
- Modifiés : `src/lib/schemas/persistence.ts`, `src/components/backoffice/SidebarNav.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

### Prochaine étape prévue
Validation utilisateur (`/admin/profile` + nav/footer alimentés) puis persistance BDD du profil + sécurité réelle (Supabase/Resend).

---

## 2026-09-09 – 16:08 (heure locale America/Bogota)

### Tâche exécutée
**Correctif — sous-menu de la barre de navigation qui ne se refermait pas après un clic**
- **Cause** : le dropdown desktop était piloté **uniquement par le survol CSS** (`group-hover`) ; après un clic sur un enfant du sous-menu, le pointeur restant dans le groupe, le panneau ne se refermait pas.
- **Correctif** [`Header.tsx`](src/components/layout/Header.tsx) : `DesktopNavMenu` passe d’un dropdown CSS à un **dropdown contrôlé par état React** (`openId`) — ouvert au survol/focus du groupe, **fermé** à la sortie de la souris, **après activation d’un lien (parent ou enfant)** (`onNavigate` → `closeAfterNavigate`) et si le focus quitte le panneau (`onBlur`). Le menu mobile (Sheet + Accordion) se refermait déjà via `onNavigate`.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK.

### Fichiers créés ou modifiés
- Modifiés : `src/components/layout/Header.tsx`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (ouvrir un sous-menu desktop puis cliquer un lien → le menu doit se refermer ; survol hors du menu → fermeture ; navigation clavier).

---

## 2026-09-09 – 15:45 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.4 : Hero Parallaxe (`variant: "parallax"`)** (plan [`plans/ROADMAP-7.4-hero-parallax.md`](plans/ROADMAP-7.4-hero-parallax.md) validé : héritage `BaseHero`, parallaxe GPU desktop ≥1024px, désactivation mobile verrouillée)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `ParallaxSpeed` (subtle/medium/strong), `HeroParallaxContent extends HeroBaseShared` (`media: HeroStaticMedia`, `parallaxSpeed`, `disableOnMobile: true`) ; `HeroContent` élargie `static | slider | video | parallax` ; `PARALLAX_FACTOR`, libellés ; fabrique `createHeroParallaxContent`, `resolveHeroParallaxContent`, `heroParallaxImageSources` ; carte catalogue **« Hero Parallaxe »** ; `createModuleContent(type, variant?)` gère `"parallax"`.
- **Zod** [`persistence.ts`](src/lib/schemas/persistence.ts) : schéma `heroParallaxContentSchema` (media static + `parallaxSpeed` + `disableOnMobile: z.literal(true)`) ajouté à `heroContentSchema`.
- **Front** : [`HeroParallaxBackground.tsx`](src/components/modules/hero/HeroParallaxBackground.tsx) (client) — desktop **≥1024px** : image surdimensionnée translatée `translate3d` (GPU, `will-change-transform`) pilotée au scroll dans un `requestAnimationFrame` (amplitude `PARALLAX_FACTOR[speed]`), suspendue hors viewport via IntersectionObserver ; **mobile/reduced-motion : aucune animation** → `<picture>` fixe `object-cover` ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) branche `parallax` → `BaseHero` + background.
- **Back-Office** : [`ModuleHeroParallaxEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx) en **3 rubriques** — 🖼️ Image Parallaxe & Fallback (desktop 16:9 HD requis, mobile 9:16 fixe obligatoire, tablette 4:3, tooltips), 📝 Textes & Bouton hérités, ⚙️ Intensité (`parallax_speed`, mobile désactivé verrouillé) ; aiguillage [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx).
- **Helpers** : [`public-page.ts`](src/lib/public-page.ts) variante `parallax` (images collectées, OG = desktop).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : contrôle visuel (ajouter un « Hero Parallaxe ») : desktop ≥1024px = profondeur au scroll, mobile < 1024px = image fixe.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.4-hero-parallax.md`, `src/components/modules/hero/HeroParallaxBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroParallaxEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`).

### Prochaine étape prévue
Validation utilisateur (parallaxe desktop / mobile fixe) — rubrique Héro désormais complète (static, slider, video, parallax) sur la base commune `BaseHero`.

---

## 2026-09-09 – 15:10 (heure locale America/Bogota)

### Tâche exécutée
**Diagnostic & correctif — liens dupliqués (~70) dans « Menu principal – Header »**
- **Diagnostic** : la table `navigation_entries` contenait des **doublons accumulés** (plusieurs lignes par page/lien) ; `getNavigation` les lisait tels quels → le menu Header affichait une liste énorme de liens jamais créés.
- **Correctif** [`navigation.repository.ts`](src/db/repositories/navigation.repository.ts) : déduplication **à la lecture** `dedupeNavigationRows` — une seule entrée conservée par `(zone, parent, page_id OU href)`, la première occurrence (position la plus faible) est gardée, les **enfants orphelins** d'un parent-doublon retiré sont eux-mêmes retirés. La BDD est ensuite **nettoyée automatiquement** à la prochaine sauvegarde (`saveNavigation` = delete + insert de la liste dédupliquée).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/db/repositories/navigation.repository.ts`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (recharger `/admin/navigation` : la liste Header doit redevenir courte) ; au besoin, purge SQL manuelle des doublons en base ou déclencher une modification de menu pour nettoyer.

---

## 2026-09-09 – 15:00 (heure locale America/Bogota)

### Tâche exécutée
**Dashboard Pages — Réordonnancement vertical des pages (Drag & Drop sur poignée)**
- **Store** [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : nouvelle action **`movePage(from, to)`** (helper `reorderModules`, immuable) exposée dans `PagesStoreValue`.
- **Écran** [`PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) : la liste « Pages » affiche désormais les pages dans **l'ordre du store** (le tri « mis à jour » est retiré de l'écran) et chaque ligne dispose d'une **colonne poignée ⋮⋮** à gauche — **glisser-déposer vertical** (`@hello-pangea/dnd`, comme les sections d'une page : `DragDropContext`/`Droppable` (tbody)/`Draggable` (tr), `dragHandleProps` sur la poignée uniquement, ombre `ring` pendant le drag). `onDragEnd` → `movePage(source.index, destination.index)`.
- A11y : poignée en bouton avec `aria-label`/`title` ; zone draggable limitée à la poignée (les clics sur la ligne restent libres pour éditer/supprimer).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Note** : l'ordre est réordonné dans le store (conservé en session) ; la persistance BDD d'un ordre de pages reste une extension future (aucune colonne d'ordre en base pour l'instant).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/PagesManager.tsx`
- Aucune table/enum BDD modifiée.

### Prochaine étape prévue
Validation utilisateur (glisser-déposer des pages dans le Dashboard) puis extension éventuelle : persistance de l'ordre des pages (colonne position / endpoint).

---

## 2026-09-09 – 14:15 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.3 : Hero Vidéo (`variant: "video"`)** (plan [`plans/ROADMAP-7.3-hero-video.md`](plans/ROADMAP-7.3-hero-video.md) validé : héritage 100 % `BaseHero`, fallback mobile < 768px, poster desktop au chargement, schémas Zod)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `HeroVideoMedia` (`videoUrl`, `loop`, `posterDesktop` 16:9 optionnel, `fallbackMobile` 9:16 obligatoire) & `HeroVideoContent extends HeroBaseShared` (variant `"video"`) ; `HeroContent` élargie `static | slider | video` ; `DEMO_HERO_VIDEO_URL` (MP4 bucket Google stable) ; fabrique `createHeroVideoContent`, `resolveHeroVideoContent`, `heroVideoImageSources` ; catalogue carte **« Hero Vidéo »** ; `createModuleContent(type, variant?)` gère `"video"`.
- **Zod** [`src/lib/schemas/persistence.ts`](src/lib/schemas/persistence.ts) : schémas Héro (`heroOverlaySchema`, `fontWeightSchema`, `artSourceSchema`, `heroSharedSchema`, variantes static/slider/video) et export **`heroContentSchema`** (union `z.discriminatedUnion("variant", …)`) pour la validation de persistance.
- **Front** : [`HeroVideoBackground.tsx`](src/components/modules/hero/HeroVideoBackground.tsx) (client) — `<video>` HTML5 `autoPlay muted loop playsInline controls={false}` `object-cover` + poster desktop au chargement ; **< 768px : vidéo non montée, image fallback 9:16 affichée** (`matchMedia` + `prefers-reduced-motion` → poster) ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) branche `video` → `BaseHero` + `HeroVideoBackground` (textes/overlay/CTA centrés partagés).
- **Back-Office** : [`ModuleHeroVideoEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx) en **3 rubriques** — 🎬 Média Vidéo & Fallback (URL, loop, fallback mobile obligatoire 9:16 + alt, poster desktop 16:9, tooltips), 📝 Textes & Bouton hérités (overlay, H1/H2/desc, tone, graisses, CTA), ⚙️ Réglages & Performance (muted/playsinline toujours actifs) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx) bascule `video`.
- **Helpers publics** : [`public-page.ts`](src/lib/public-page.ts) (variante `video` : images poster/fallback collectées, OG = poster) .
- **Upload vidéo (post-feedback)** : possibilité d’**uploader une vidéo MP4/WebM ou de coller une URL** (au choix) dans la rubrique Média de l’éditeur Hero Vidéo — `MediaUploadButton` accepte désormais un paramètre `accept` ; route [`/api/media`](src/app/api/media/route.ts) élargie (`video/mp4`, `video/webm`, 50 Mo max ; upload brut **sans** sharp/EXIF/blur pour les vidéos) ; mapping d’extension dans [`storage.ts`](src/lib/supabase/storage.ts).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : contrôle visuel (ajouter un « Hero Vidéo » dans `/admin/pages`) : desktop = vidéo autoplay/boucle avec poster ; mobile (< 768px) = photo fallback 9:16 ; uploader/remplacer la vidéo par la sienne.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.3-hero-video.md`, `src/components/modules/hero/HeroVideoBackground.tsx`, `src/components/backoffice/pages/modules/ModuleHeroVideoEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/lib/schemas/persistence.ts`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`).

### Prochaine étape prévue
Validation utilisateur (rendu vidéo desktop/mobile) puis extension Héro restante : **HeroParallax** (`HeroContent` + `BaseHero`).

---

## 2026-09-09 – 12:20 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.2 : Hero Slider (`variant: "slider"`)** (plan [`plans/ROADMAP-7.2-hero-slider.md`](plans/ROADMAP-7.2-hero-slider.md) validé : D-2 refactor `HeroTextBlock` partagé, D-3 overlay/textes **par slide** + poids/réglages **au module**, D-4 réordonnancement ↑/↓, D-6 un seul `h1` actif)
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : `HeroSliderSlide` (art-direction `<picture>` + textes/CTA/overlay/tone par slide), `HeroSliderSettings` + `HeroAutoplaySpeed` + `HeroSliderTransition`, `HeroSliderContent` ; `HeroContent` élargie `static | slider` ; constantes/labels (vitesses, transitions, `DEFAULT_HERO_SLIDER_SETTINGS`) ; fabriques `createHeroSliderSlide`/`createHeroSliderContent` (3 slides pré-chargées picsum + alt SEO) ; `resolveHeroSliderContent` (slides/settings partiels normalisés) ; `heroSliderImageSources` ; `moduleCatalog` carte **« Hero Slider »** (`id hero-slider`, `variant slider`) ; `createModuleContent(type, variant?)` & `createModule` (passe la variante).
- **Front** : refactor **`HeroTextBlock`** (nouveau [`src/components/modules/hero/HeroTextBlock.tsx`](src/components/modules/hero/HeroTextBlock.tsx)) — bloc texte/CTA partagé (h1 géant clamp/h2/p, poids, tone, CTA, alignement `center`/`bottom-left`) ; [`BaseHero.tsx`](src/components/modules/hero/BaseHero.tsx) refactorisé dessus (static inchangé) ; **`HeroSlider.tsx`** (nouveau, client) — slides empilées GPU, transition `slide` (translateX) / `fade` (opacité), autoplay (pause survol/focus), flèches desktop, puces, **swipe tactile** pointer events (`touch-action pan-y`), `prefers-reduced-motion` + retour boucle sans glissade, A11y `aria-hidden` slides inactives ; orchestrateur [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) bascule `variant` static/slider.
- **Back-Office** : **`ModuleHeroSliderEditor.tsx`** (nouveau) en **3 rubriques** — 🖼️ Slides & Photos (ajout `+ slide`, suppression, réordonnancement ↑/↓, 3 `ArtSourceField` par slide), 📝 Textes & Boutons par slide (overlay segmenté, H1/H2/paragraphe, tone, CTA, graisses globales), ⚙️ Réglages du Slider (autoplay/vitesse, transition glissement/fondu, flèches, puces) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx) bascule par variante ; [`ModuleSettingsForm.tsx`](src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) masque l'animation générique pour **static uniquement**.
- **Helpers/démo** : [`public-page.ts`](src/lib/public-page.ts) multi-variantes (`collectImageUrls`, `publicDescription` 1re slide, `publicOgImage`) ; démo [`demo/page.tsx`](src/app/(front-office)/demo/page.tsx) ajoute un HeroSlider (3 slides).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK. **Restant (utilisateur)** : validation visuelle `/demo` (autoplay, transitions, swipe tactile, flèches/puces, overlay, texte bas-gauche desktop/centré mobile) et édition d'un « Hero Slider » dans `/admin/pages`.
- **Correctif assombrissement (post-feedback)** : le voile (`overlay_level`) était appliqué en `background-color` sur le conteneur de la slide (donc **sous** l’image) dans `HeroSlider` — déplacé vers un `<div>` **au-dessus de l’image** (`absolute inset-0 z-[2]`) dans chaque slide ; voile du `BaseHero` (HeroStatic) garanti au-dessus du fond via `z-[2]`.
- **Correctif moteur slider (post-feedback)** : suppression de la **rupture de cycle** en mode « Glissement » — ajout d’un **clone de la 1re slide** en fin de piste : au retour automatique, la piste ramène sur la vraie 1re slide **sans transition** (visuel identique, aucun saut brutal) ; suppression de la pause autoplay au **simple survol** (pause conservée au focus clavier et pendant le geste tactile) → démarrage stable et régulier.
- **Correctif pleine hauteur / responsif (post-feedback)** : sections Héro (slider & statique) recalées pour occuper l’espace **du bas de la barre de navigation (`h-16` fixe) jusqu’au bas de l’écran** (`min-h-[calc(100svh-4rem)]` + `-mt-4`) avec fallback **`dvh`** (`supports-[height:100dvh]:min-h-[calc(100dvh-4rem)]`) pour tenir compte de la barre d’adresse mobile ; dans `/demo`, le **HeroSlider est désormais le premier module** (héro plein écran en haut de page) pour valider ce comportement.
- **Correctif racine pleine hauteur (post-feedback) — mode « Glissement »** : la piste était un enfant **dans le flux** (`h-full` sur un parent à hauteur auto) → hauteur non résolue et vide sous les visuels. La piste est désormais **`absolute inset-0`** dans la section : elle remplit réellement toute la hauteur (≥ `min-h-[calc(100svh-4rem)]`) et chaque slide la couvre (`object-cover`), sans vide en bas, sur desktop et mobile.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.2-hero-slider.md`, `src/components/modules/hero/HeroTextBlock.tsx`, `src/components/modules/hero/HeroSlider.tsx`, `src/components/backoffice/pages/modules/ModuleHeroSliderEditor.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/components/modules/hero/BaseHero.tsx`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/modules/ModuleSettingsForm.tsx`, `src/app/(front-office)/demo/page.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`) ; enum Zod `persistence.ts` inchangée.

### Prochaine étape prévue
Validation utilisateur (rendu + éditeur HeroSlider) puis extensions Héro (HeroVideo / HeroParallax via `HeroContent` + `BaseHero`).

---

## 2026-09-09 – 11:05 (heure locale America/Bogota)

### Tâche exécutée
**Phase 7 (Modules « prêts à l'emploi ») – Étape 7.1 : Rubrique Héro — HeroStatic & base commune `BaseHero`**
- **Plan validé** : [`plans/ROADMAP-7.1-hero-static-basehero.md`](plans/ROADMAP-7.1-hero-static-basehero.md). Décision structurante : **famille `hero` unique + discriminant `variant`** (aucune migration d'enum BDD) ; nommage camelCase groupé ; animation d'entrée **source unique** = `module.animation` ; `textTone` sémantique ; injection défauts = fabrique riche + résolveur (pattern `resolveGalleryLayout`).
- **Domaine** [`src/lib/pages.ts`](src/lib/pages.ts) : types Héro (`HeroVariant`, `HeroOverlayLevel`, `HeroTextTone`, `FontWeightClass`, `HeroCtaStyle`, `HeroStaticMedia`, `HeroBaseShared`, `HeroStaticContent`, union `ModuleContent` ouverte `{ type: "hero" } & HeroStaticContent`) ; constantes (`HERO_OVERLAY_OPACITY`, ordres/libellés Select, `DEFAULT_HERO_SHARED`, `DEFAULT_HERO_STATIC_MEDIA` picsum 16:9/4:3/9:16) ; `createHeroStaticContent`, `cloneArtSource/cloneHeroStaticMedia`, `heroStaticArtSources`, **`resolveHeroContent`** (upgrade legacy `hero` simple + fusion des défauts, zéro `any`) ; catalogue `moduleCatalog` → `ModuleCatalogEntry` (clé `id` + `variant`), carte « Hero Statique » ; `createModule(type, seq, variant?)` sélectionne l'entrée par type+variant ; seeds Accueil migrés vers le contenu static.
- **Rendu public** : [`src/components/modules/hero/BaseHero.tsx`](src/components/modules/hero/BaseHero.tsx) (structure commune : overlay `overlayLevel` auto-inversé selon `textTone`, textes H2 `clamp()`/H3/paragraphe avec graisses, CTA `ctaShow`+`ctaStyle`, ancre, animation) ; [`HeroStaticBackground.tsx`](src/components/modules/hero/HeroStaticBackground.tsx) (`<picture>` art-direction : desktop ≥1024, tablette ≥768 avec **repli auto desktop**, `<img>` mobile 9:16, alt SEO, `fetchpriority`) ; [`RevealHero.tsx`](src/components/modules/hero/RevealHero.tsx) (client, IntersectionObserver GPU + `motion-reduce`) ; [`HeroModule.tsx`](src/components/modules/hero/HeroModule.tsx) (orchestrateur `resolveHeroContent` → `BaseHero`) ; [`PublicModules.tsx`](src/components/modules/PublicModules.tsx) route `hero` vers le nouveau module (ancien `HeroModule` inline supprimé).
- **Back-Office** : [`ModuleHeroEditor.tsx`](src/components/backoffice/pages/modules/ModuleHeroEditor.tsx) réécrit en **3 rubriques** (🖼️ Images de fond — 3 `ArtSourceField` à vignettes/ratios/tooltips ; 📝 Textes & Bouton — overlay, textes, tone, graisses, CTA switch+style ; 🎬 Animations & Effets — pilotée par `module.animation`) ; nouveau [`ArtSourceField.tsx`](src/components/backoffice/pages/modules/ArtSourceField.tsx) (vignette + upload + alt SEO + URL) ; [`form-fields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) enrichi (`HelpTip`/`LabelWithTip`, prop `tip`, `SelectField` générique) ; [`ModuleContentEditor.tsx`](src/components/backoffice/pages/modules/ModuleContentEditor.tsx)/[`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx)/[`ModuleSettingsForm.tsx`](src/components/backoffice/pages/modules/ModuleSettingsForm.tsx) (animation transmise au Héro, sélecteur générique masqué pour la famille `hero`) ; [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) `addModule(pageId, type, variant?)` ; [`AddSectionSheet.tsx`](src/components/backoffice/pages/AddSectionSheet.tsx)/[`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx) `onAdd(entry)` + clé `id`.
- **SEO/helpers & démo** : [`src/lib/public-page.ts`](src/lib/public-page.ts) (`collectImageUrls` multi-sources, `publicDescription`, `publicOgImage` via `heroStaticArtSources`/`resolveHeroContent`) ; [`demo/page.tsx`](src/app/(front-office)/demo/page.tsx) hero art-direction 3 images (desktop/tablet/mobile).
- **Ajustement sémantique & typographique (post-validation)** : la section Héro porte le **titre principal `<h1>`** de la page → `titleH2` devient `titleH1`, `subtitleH3` devient `subtitleH2` (balise `<h2>`), graisses `weightH1`/`weightH2`/`weightText` ; `descriptionText` conservée (`<p>`). Schéma TS, `BaseHero` (H1 géant `clamp()` + H2), seeds/démo et libellés/tooltips de l'éditeur ajustés (voir §9 du plan).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint` (fichiers modifiés) OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — compilation + TypeScript + génération statique). **Restant (environnement utilisateur)** : validation visuelle `/demo` & `/` (art-direction, overlay, clamp, CTA, animation), pages `/admin/pages` (rubriques Héro) ; BDD : JSONB legacy normalisé à la lecture par `resolveHeroContent`.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-7.1-hero-static-basehero.md`, `src/components/modules/hero/BaseHero.tsx`, `src/components/modules/hero/HeroStaticBackground.tsx`, `src/components/modules/hero/RevealHero.tsx`, `src/components/modules/hero/HeroModule.tsx`, `src/components/backoffice/pages/modules/ArtSourceField.tsx`
- Modifiés : `src/lib/pages.ts`, `src/lib/public-page.ts`, `src/components/modules/PublicModules.tsx`, `src/app/(front-office)/demo/page.tsx`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/pages/AddSectionSheet.tsx`, `src/components/backoffice/pages/PageEditor.tsx`, `src/components/backoffice/pages/ModuleRow.tsx`, `src/components/backoffice/pages/modules/ModuleHeroEditor.tsx`, `src/components/backoffice/pages/modules/ModuleContentEditor.tsx`, `src/components/backoffice/pages/modules/ModuleSettingsForm.tsx`, `src/components/backoffice/pages/modules/form-fields.tsx`
- Aucune table/enum BDD modifiée (`module_type` conserve `hero`) ; enum Zod `persistence.ts` inchangée.

### Prochaine étape prévue
Validation utilisateur (rendu `/demo` & `/`, éditeur 3 rubriques, bascule responsive) puis extensions Héro (Slider/Video/Parallax via `HeroContent` + `BaseHero`) et médiathèque.

---

## 2026-09-07 – 16:06 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.3 : Pages Publiques Dynamiques `/[slug]`, SEO & Proxy Next 16**
- **Plan validé** : [`plans/ROADMAP-6.3-dynamic-pages.md`](plans/ROADMAP-6.3-dynamic-pages.md) (validé, arbitrages par défaut : **Option A** — rendu dynamique on-demand ; home = Accueil ; description = 1er module texte ; **bascule proxy immédiate**). L'Étape 6.3 raccorde les modules publics (6.2) au routeur Next et consolide l'infra.
- **Helper serveur** [`src/lib/public-page.ts`](src/lib/public-page.ts) : `getPublicPage(slug)` (BDD tenant démo via `getPagesWithModules` → filtre `published`, sinon **fallback seed** `seedPages`/`buildSeedModules` ; résolution **EXIF/blur** via `resolveMediaMetaByUrls`) + `publicDescription` (1er module texte) & `publicOgImage` ; `null` pour slug inconnu/brouillon → `notFound()`.
- **Routage public** : [`src/app/(front-office)/[slug]/page.tsx`](src/app/(front-office)/[slug]/page.tsx) (dynamique ƒ — `generateMetadata` SEO : titre, description, OG, canonical ; rendu `PageModuleRenderer`, H1 sr-only si la page ne débute pas par un Hero) ; page racine [`/`](src/app/(front-office)/page.tsx) réécrite pour rendre l'**Accueil** (slug vide) avec `generateMetadata`.
- **Proxy Next 16** : [`src/proxy.ts`](src/proxy.ts) (nouvelle convention — garde `/admin`, session, `/admin/login` exemptée, fallback démo) ; [`src/middleware.ts`](src/middleware.ts) supprimé (plus d'avertissement de dépréciation au build).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — **`/` statique** (seed Accueil), **`/[slug]` dynamique ƒ**, `/demo` statique, proxy reconnu ; avertissements « fs/zlib » des modules natifs non bloquants). **Restant (environnement utilisateur)** : validation visuelle `/`, `/portfolio`, `/prestations`, `/a-propos` (rendus seed/BDD), `/contact` & inconnu → 404, métadonnées SEO/OG ; avec BDD : pages réelles + EXIF galerie.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.3-dynamic-pages.md`, `src/lib/public-page.ts`, `src/app/(front-office)/[slug]/page.tsx`, `src/proxy.ts`
- Modifiés : `src/app/(front-office)/page.tsx` (Accueil dynamique) ; `src/middleware.ts` supprimé ; `ROADMAP.md` (6.3 `[x]`)
- Aucune table/éditeur/contrat modifié ; routes statiques (`/demo`, `/admin/*`) prioritaires sur `/[slug]`.

### Prochaine étape prévue
**Validation utilisateur** (pages publiques + SEO + 404 ; BDD si configurée) puis suite du ROADMAP (prochaines phases fonctionnelles : espaces clients/galeries privées, devis/agenda, ou consolidation RLS/PostgREST selon la feuille de route).

---

## 2026-09-07 – 15:37 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.2 : Rendu Public Optimisé des Galeries & Lightbox EXIF**
- **Plan validé** : [`plans/ROADMAP-6.2-gallery-optimization.md`](plans/ROADMAP-6.2-gallery-optimization.md) (validé, arbitrages par défaut : **Option A** — bibliothèque de renderers + route `/demo` ; EXIF au survol **et** en Lightbox ; résolution EXIF par URL via la table `media`). L'Étape 6.2 crée la couche de **rendu public** des modules du Page Builder, optimisée (`MediaImage`) avec **Lightbox EXIF**.
- **Renderers publics** [`src/components/modules/PublicModules.tsx`](src/components/modules/PublicModules.tsx) : `PageModuleRenderer` (aiguillage par `module.type`) + `HeroModule` (**MediaImage priority** — LCP), `AboutModule` (image-texte), `GalleryModule` (grille → `GalleryGrid`), `ServicesModule`, `CtaBannerModule`, `FaqModule` (détails natifs accessibles), `ContactModule` — styles « Éclat Minéral & Nacre », Server Components (seule la galerie embarque un sous-composant client).
- **Galerie + Lightbox EXIF** [`src/components/modules/GalleryGrid.tsx`](src/components/modules/GalleryGrid.tsx) (Client) : grille `MediaImage` lazy + survol (EXIF optionnel), **Lightbox** plein écran (navigation ←/→, Échap, compteur) affichant les puces EXIF (focale, f/, vitesse, ISO, boîtier, objectif). Utilitaire [`src/lib/media-exif.ts`](src/lib/media-exif.ts) (`exifChipsFromData`/`exifLineFromData`, client-safe).
- **Données média** : [`src/lib/media-resolve.ts`](src/lib/media-resolve.ts) (serveur) — `resolveMediaMetaByUrls(urls, photographerId)` : EXIF & blur depuis la table `media` (repli `{}` sans BDD).
- **Page de démonstration** [`/demo`](src/app/(front-office)/demo/page.tsx) (sous Front-Office, statique) : Hero/About/Galerie(+EXIF démo)/CTA via `PageModuleRenderer` — valide lazy, WebP/AVIF, placeholders, Lightbox EXIF et LCP/CLS (sans BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — **nouvelle route statique `/demo`** ; avertissements non bloquants « fs/zlib » des modules natifs + note de dépréciation Next 16 « middleware → proxy » documentée). **Restant (environnement utilisateur)** : validation visuelle `/demo` ; avec BDD `media` : EXIF/blur réels résolus par URL ; migration du middleware vers la convention `proxy` Next 16 à prévoir.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.2-gallery-optimization.md`, `src/lib/media-exif.ts`, `src/lib/media-resolve.ts`, `src/components/modules/PublicModules.tsx`, `src/components/modules/GalleryGrid.tsx`, `src/app/(front-office)/demo/page.tsx`
- Modifiés : `ROADMAP.md` (6.2 `[x]`)
- Aucune table, aucun éditeur Back-Office ni contrat `PageModule` modifié ; aucune route publique dynamique générique (réservée étape suivante « pages publiques »).

### Prochaine étape prévue
**Validation utilisateur** (`/demo` : Hero prioritaire, galerie lazy + Lightbox EXIF clavier, EXIF réel si BDD `media`) puis **Phase 6 – Étape 6.3** : Pages publiques dynamiques (routage `/slug` depuis la BDD, rendu des modules publiés) & consolidation (migration middleware → proxy Next 16).

---

## 2026-09-07 – 15:21 (heure locale America/Bogota)

### Tâche exécutée
**Phase 6 (Stockage Médias & Performance) – Étape 6.1 : Supabase Storage, Media Library Back-Office & Métadonnées EXIF**
- **Plan validé** : [`plans/ROADMAP-6.1-media-storage.md`](plans/ROADMAP-6.1-media-storage.md) (plan fourni et validé par l'utilisateur, arbitrages par défaut : **Supabase Storage**, table **`media`**, **sharp à l'upload**, **Picker dans MediaFields**). L'Étape 6.1 couvre la gestion/optimisation des images : stockage bucket `portfolio-media`, **Media Library** Back-Office, extraction **EXIF** et **blur placeholders**, wrapper **`next/image`** et **sélecteur d'images** branché sur les modules du Page Builder — avec **fallback démo**.
- **Schéma** : table **`media`** ajoutée à [`src/db/schema.ts`](src/db/schema.ts) (id, `photographer_id` FK→profiles CASCADE, url, filename, size, mime_type, width/height, `exif_data` JSONB, `blur_data_url`, created_at). Migration [`drizzle/0002_dapper_lethal_legion.sql`](drizzle/0002_dapper_lethal_legion.sql) (générée puis éditée) : table + **RLS media** (Owner RW / Public RO) + **bucket & politiques Storage** (`portfolio-media` : lecture publique, écritures Owner via préfixe `auth.uid()`), enregistrée au journal.
- **Serveur** : repository [`media.repository.ts`](src/db/repositories/media.repository.ts) (`listMedia`, `getMedia`, `createMedia`, `deleteMedia`) ; helpers [`src/lib/supabase/storage.ts`](src/lib/supabase/storage.ts) (upload/suppression/`storagePathFromUrl`, bucket) + `isStorageConfigured` ; Route Handlers `GET`/`POST /api/media` ([`route.ts`](src/app/api/media/route.ts) — upload multipart, **`exifr`** EXIF, **`sharp`** dimensions + **blur data URI**, Owner authentifié) et `DELETE /api/media/[id]` (objet + ligne). Dépendances `exifr` + `sharp` ajoutées.
- **UI Back-Office** : page `/admin/media` + [`MediaLibrary.tsx`](src/components/backoffice/media/MediaLibrary.tsx) (grille responsive, upload, suppression avec Dialog, **puces EXIF** : focale/f/ISO/vitesse/boîtier/objectif, mode démo lecture seule) ; [`MediaPicker.tsx`](src/components/backoffice/media/MediaPicker.tsx) (Dialog + bouton `MediaPickButton`) intégré à [`MediaFields.tsx`](src/components/backoffice/pages/modules/form-fields.tsx) (pré-remplit `url`/`alt` des modules hero/about) ; entrée **« Médias »** active dans [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx).
- **Rendu/performance** : `next.config.ts` — `images.remotePatterns` (Supabase + démo picsum) ; composant [`MediaImage.tsx`](src/components/common/MediaImage.tsx) (wrapper `next/image`, `blurDataURL`, repli `<img>` natif sûr) ; client média [`src/lib/media-client.ts`](src/lib/media-client.ts) (`useMediaAssets`, upload/delete, jeu de démo hors-BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — route `/admin/media` en statique + API `/api/media` & `/api/media/[id]` ; avertissements non bloquants « Couldn't load fs/zlib » liés aux modules natifs optionnels à la génération). **Restant (environnement utilisateur)** : Supabase Storage n'étant pas configuré ici → mode démo (upload/suppression désactivés) ; validation de bout en bout avec Supabase (bucket 0002, upload→EXIF/blur→ligne `media`, RLS Owner, suppression) à effectuer.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-6.1-media-storage.md`, `src/db/repositories/media.repository.ts`, `src/lib/supabase/storage.ts`, `src/lib/media-client.ts`, `src/components/common/MediaImage.tsx`, `src/components/backoffice/media/{MediaLibrary,MediaPicker}.tsx`, `src/app/(back-office)/admin/media/page.tsx`, `src/app/api/media/route.ts`, `src/app/api/media/[id]/route.ts`, `drizzle/0002_dapper_lethal_legion.sql`
- Modifiés : `src/db/schema.ts` (table `media`), `next.config.ts` (remotePatterns), `src/components/backoffice/SidebarNav.tsx` (Médias), `src/components/backoffice/pages/modules/form-fields.tsx` (MediaFields + picker), `package.json` (exifr, sharp), `drizzle/meta/_journal.json`, `ROADMAP.md` (Phase 6, 6.1 `[x]`)
- Aucune modification des contrats des modules existants (`MediaFields` reste `{url, alt}`) ; aucune table hors `media`.

### Prochaine étape prévue
**Validation utilisateur** (avec Supabase Storage configuré : migration 0002 → upload→EXIF/blur→`media`, RLS Owner, suppression, `MediaPicker` dans un module) puis **Phase 6 – Étape 6.2** : rendu public optimisé des galeries (`MediaImage` dans les modules publiés, WebP/AVIF, placeholders) & éventuels Crop/éditeur.

---

## 2026-09-07 – 15:01 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.4 : Auth Supabase, Row Level Security (RLS) & Middleware Back-Office**
- **Plan validé** : [`plans/ROADMAP-5.4-auth-rls.md`](plans/ROADMAP-5.4-auth-rls.md) (plan fourni et validé par l'utilisateur, arbitrages par défaut : **Option A** — Drizzle scoping + RLS défense, `profiles.id = auth.uid()`, tenant démo public, CTA → `/admin/login`). L'Étape 5.4 introduit l'**authentification réelle du photographe** (Supabase Auth) et la **sécurisation** des données (RLS Owner/Public), avec **fallback démo** quand Supabase n'est pas configuré.
- **Dépendances** : `@supabase/supabase-js` + `@supabase/ssr` ajoutées.
- **Clients & couche Supabase** [`src/lib/supabase/`](src/lib/supabase) : `demo.ts` (`isSupabaseConfigured`/`getSupabaseEnv` — valeurs factices ignorées), `server.ts` (`createServerClient` @supabase/ssr, cookies Next), `browser.ts` (`createBrowserClient`), `middleware.ts` (`updateSession` — refresh session + retour `user`), `session.ts` (`getCurrentPhotographerId` = `auth.uid()`, `resolvePhotographerId` avec repli `DEMO_PROFILE_ID`), `auth.ts` (Server Actions `loginAction`/`signOutAction`).
- **Middleware** [`src/middleware.ts`](src/middleware.ts) (nouveau) : matcher `/admin/:path*` — rafraîchit la session, redirige les **non connectés** vers `/admin/login` (`/admin/login` exempté) ; **mode démo** (Supabase non configuré) → aucune garde.
- **Connexion / Déconnexion** : page [`/admin/login`](src/app/(back-office)/admin/login/page.tsx) (serveur) + formulaire client [`LoginForm.tsx`](src/components/backoffice/auth/LoginForm.tsx) (email/mot de passe → `loginAction`, message « mode démo » sans Supabase) ; bouton **Déconnexion** conditionnel dans le layout admin (session active) ; CTA publics « Connexion » du Header redirigés vers `/admin/login`.
- **RLS & trigger (SQL)** : migration [`drizzle/0001_auth_rls.sql`](drizzle/0001_auth_rls.sql) (éditée à la main + enregistrée au journal) — fonction/trigger `handle_new_user` (`profiles.id = auth.uid()` auto-créé à l'inscription) ; politiques **Owner RW** (`profiles`/`pages`/`page_modules`/`navigation_entries` via `photographer_id = auth.uid()` ou sous-requête sur la page propriétaire) et **Public RO** (`pages.status = 'published'`, modules `is_visible = true`, navigation `hidden = false` + page liée publiée). RLS conservée « défense en profondeur » (Option A : accès applicatif Drizzle scope par session).
- **Scoping session (5.3)** : Route Handlers `/api/pages`, `/api/navigation`, `/api/navigation/presets` utilisent `resolvePhotographerId()` (authentifié sinon tenant démo) ; `loadInitialData(photographerId)` alimente le layout admin avec l'id **authentifié** (repli démo), le Front-Office `/` conservant le tenant démo.
- Vérifications : `npx tsc --noEmit` OK ; `npx eslint src` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — route `/admin/login` en statique, **Proxy (Middleware)** détecté ; routes publiques/API inchangées). **Restant (environnement utilisateur)** : Supabase n'étant pas configuré ici, le **mode démo** est actif (garde inactive) — validation de bout en bout avec Supabase réelle (création d'utilisateur → trigger `profiles`, connexion `/admin/login`, isolation RLS Owner/Public, déconnexion) à effectuer.

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.4-auth-rls.md`, `src/middleware.ts`, `src/lib/supabase/{demo,server,browser,middleware,session,auth}.ts`, `src/components/backoffice/auth/LoginForm.tsx`, `src/app/(back-office)/admin/login/page.tsx`, `drizzle/0001_auth_rls.sql`
- Modifiés : `package.json` (@supabase/*), `src/app/api/pages/route.ts`, `src/app/api/navigation/route.ts`, `src/app/api/navigation/presets/route.ts` (scoping session), `src/db/load-initial-data.ts` (`photographerId` param), `src/app/(back-office)/admin/layout.tsx` (session + déconnexion), `src/components/layout/Header.tsx` (CTA `/admin/login`), `drizzle/meta/_journal.json`, `ROADMAP.md` (5.4 `[x]`)
- **Aucun composant métier Back-Office/Page Builder modifié** (contrats préservés) ; aucune table ajoutée (politiques/trigger seulement).

### Prochaine étape prévue
**Validation utilisateur** (avec Supabase configuré : création utilisateur → `profiles` auto, connexion `/admin/login`, isolation RLS, déconnexion) puis suite de la feuille de route (phase suivante à définir — consolidation RLS/PostgREST ou volet suivant du ROADMAP).

---

## 2026-09-07 – 14:03 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.3 : Persistance CRUD (API Route Handlers & Synchronisation BDD)**
- **Plan validé** : [`plans/ROADMAP-5.3-crud-persistence.md`](plans/ROADMAP-5.3-crud-persistence.md) (plan fourni et validé par l'utilisateur). L'Étape 5.3 connecte les **actions d'édition** des stores (PagesStore & NavigationStore) à la BDD : chaque mutation locale (optimiste) est **persistée** quand la BDD est disponible, avec **fallback transparent** hors-BDD (l'app tourne toujours sans Supabase) et **préservation totale des contrats UI**.
- **Repositories d'écriture** : [`pages.repository.ts`](src/db/repositories/pages.repository.ts) — `createPage(photographerId, page)` (id explicite), `updatePage(pageId, data)`, `deletePage(pageId)` (cascade modules + nav via FK), `updateModules(pageId, modules)` (remplacement **transacté** de la liste ordonnée, ids préservés, contenu JSONB resserré au domaine) ; [`navigation.repository.ts`](src/db/repositories/navigation.repository.ts) — `saveNavigation(photographerId, navigation)` (remplacement Header/Footer transacté, arborescence aplatie `parent_id`/`position`) et `applyPreset(photographerId, presetId)` (atomique : recalcule `is_in_menu` des pages + remplace le Header, Footer intact).
- **Validation zod** : [`src/lib/schemas/persistence.ts`](src/lib/schemas/persistence.ts) (nouveau, zéro `any`) — `pageMetadataSchema`, `moduleSchema`, `updateModulesPayloadSchema`, `navEntrySchema` (auto-référencé via `z.ZodType<NavEntryValue>`), `saveNavigationPayloadSchema`, `applyPresetPayloadSchema`. Dépendance `zod` ajoutée.
- **Route Handlers** (serveur, tenant de démo `DEMO_PROFILE_ID`) : `POST /api/pages`, `PATCH /api/pages/[pageId]`, `DELETE /api/pages/[pageId]`, `PUT /api/pages/[pageId]/modules`, `PUT /api/navigation`, `POST /api/navigation/presets` — corps validés zod (400) / erreurs BDD (500).
- **Branchement des stores (fallback préservé)** : prop optionnelle `persistenceEnabled` (défaut `false`) transmise par les layouts via **`dbAvailable`** exposé par [`load-initial-data.ts`](src/db/load-initial-data.ts). [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : effet de **diff** état précédent/courant → appels granulaire (`create`/`update`/`delete` page + `updateModules`) ; [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : effet différencié (JSON) → `PUT /api/navigation`. Appels fire-and-forget via [`src/lib/persistence-client.ts`](src/lib/persistence-client.ts) (erreurs journalisées, aucune régression UI). La **synchro inter-stores** `PagesNavigationSync` reste côté client et sa persistance transite par ces mêmes écritures (état final cohérent en BDD).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack — pages inchangées + **5 routes API** listées `/api/pages`, `/api/pages/[pageId]`, `/api/pages/[pageId]/modules`, `/api/navigation`, `/api/navigation/presets`) ; ESLint `npx eslint src` OK (0 erreur, 0 avertissement). **Restant (environnement utilisateur)** : avec `DATABASE_URL` + migration/seed 5.1, vérifier la persistance CRUD de bout en bout (créer/éditer/supprimer une page, réordonner les modules, éditer/masquer/réordonner la nav, appliquer un preset → rechargement `F5` = état conservé, contrôlable via `db:studio`).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.3-crud-persistence.md`, `src/lib/schemas/persistence.ts`, `src/lib/persistence-client.ts`, `src/app/api/pages/route.ts`, `src/app/api/pages/[pageId]/route.ts`, `src/app/api/pages/[pageId]/modules/route.ts`, `src/app/api/navigation/route.ts`, `src/app/api/navigation/presets/route.ts`
- Modifiés : `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts` (`dbAvailable`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `package.json` (zod), `ROADMAP.md` (5.3 `[x]`)
- **Aucun composant UI métier ni hook modifié** (contrats préservés) ; aucune table ajoutée.

### Prochaine étape prévue
**Validation utilisateur** (BDD configurée : migration + seed puis test CRUD persistant + preset via `db:studio`) puis **Phase 5 – Étape 5.4** : Activation RLS/Auth (`@supabase/supabase-js`, politiques owner/public, branchement `profiles.auth_user_id`) — les politiques RLS posées en 5.1 restent vides jusqu'ici (accès serveur « service »).

---

## 2026-09-07 – 13:31 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.2 : Hydratation SSR des Stores depuis la BDD**
- **Plan validé** : [`plans/ROADMAP-5.2-ssr-db-hydration.md`](plans/ROADMAP-5.2-ssr-db-hydration.md) (architecture fournie et validée par l'utilisateur). L'Étape 5.2 connecte les stores React/Client (Pages & Navigation) aux **données réelles PostgreSQL** via l'**hydratation SSR** — avec **fallback gracieux** sur le seed en mémoire et **préservation totale des contrats UI** (aucun composant/hook/formulaire modifié).
- **Repository layer** : [`src/db/repositories/pages.repository.ts`](src/db/repositories/pages.repository.ts) — `getPagesWithModules(photographerId)` (pages + modules ordonnés, mappers BDD → domaine : `is_in_menu`→`inMenu`, `is_visible`→`hidden = !is_visible`, `content` JSONB typé `ModuleContent`) ; [`src/db/repositories/navigation.repository.ts`](src/db/repositories/navigation.repository.ts) — `getNavigation(photographerId)` (reconstitution de l'**arborescence** Header Niveau 1 + Niveau 2 via `parent_id` et Footer, tri par `position`). Couches **purement serveur**.
- **Connexion paresseuse** : [`src/db/index.ts`](src/db/index.ts) réécrit — `getDatabase()` crée l'instance **au premier appel uniquement** (plus aucun throw à l'import → le build reste vert sans BDD) ; `connect_timeout: 5` ajouté au client `postgres` (fallback rapide si BDD injoignable). [`src/db/constants.ts`](src/db/constants.ts) (nouveau) : `DEMO_PROFILE_ID`/`DEMO_EMAIL`/`DEMO_DISPLAY_NAME` partagés — [`src/db/seed.ts`](src/db/seed.ts) adapté (constantes + `getDatabase()`).
- **Loader SSR** : [`src/db/load-initial-data.ts`](src/db/load-initial-data.ts) (nouveau) — `loadInitialData()` : charge les données du tenant de démo via les repositories et retourne `{ pages?, navigation? }` ; **tout échec BDD (ou données vides) → `{}`** (les Providers basculent sur le seed en mémoire).
- **Providers étendus (prop `initialData`)** : [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) — `initialData?: PagesInitialData` (init `useState` = données fournies sinon `createInitialState`) ; [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) — `initialData?: NavigationSnapshot` + hydratation **unique par session** via **`hydrateNavigation`** ajouté à [`navigation-store.ts`](src/lib/navigation-store.ts) (garde-fou module `hydrated` : aucun écrasement des mutations lors des remontages SPA `/admin` ↔ `/`).
- **Layouts / Server Components (async)** : [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) transmet `initial.navigation` au `NavigationStoreProvider` ; [`(back-office)/admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) transmet `initial.pages` + `initial.navigation` aux deux Providers. Contrats de props internes inchangés — aucun composant métier touché.
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4 / Turbopack — routes inchangées `/`, `/admin`, `/admin/navigation`, `/admin/pages`, `/admin/pages/[id]` ; la BDD étant absente de l'environnement, le **fallback seed** est actif → aucune dépendance réseau au build). **Restant (environnement utilisateur)** : avec `DATABASE_URL` + migration/seed 5.1, vérifier que `/admin/*` et `/` sont hydratés depuis la BDD au rechargement (une modification BDD visible après hydratation).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.2-ssr-db-hydration.md`, `src/db/repositories/pages.repository.ts`, `src/db/repositories/navigation.repository.ts`, `src/db/load-initial-data.ts`, `src/db/constants.ts`
- Modifiés : `src/db/index.ts` (connexion paresseuse + `connect_timeout`), `src/db/seed.ts`, `src/lib/navigation-store.ts` (`hydrateNavigation`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/NavigationStoreProvider.tsx`, `src/app/(front-office)/layout.tsx`, `src/app/(back-office)/admin/layout.tsx`, `ROADMAP.md` (5.2 `[x]`)
- **Aucun composant UI métier ni route modifiés** (contrats préservés) ; aucune table ajoutée.

### Prochaine étape prévue
**Validation utilisateur** (avec BDD configurée : migration + seed puis vérification de l'hydratation SSR sur `/admin/*` et `/`) puis **Phase 5 – Étape 5.3** : Persistance des actions (CRUD optimiste via Route Handlers + Drizzle) et activation RLS/Auth (remplacement de la réconciliation client `PagesNavigationSync` par des transactions serveur).

---

## 2026-09-07 – 13:03 (heure locale America/Bogota)

### Tâche exécutée
**Phase 5 (Intégration BDD & Persistance) – Étape 5.1 : Schéma BDD PostgreSQL / Drizzle ORM & Migrations**
- **Plan validé** : [`plans/ROADMAP-5.1-database-schema.md`](plans/ROADMAP-5.1-database-schema.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 5.1 pose la **fondation Drizzle ORM** (PostgreSQL/Supabase) pour le Volet 2 : le jeu de données mock (`seedPages` + `buildSeedModules` + `buildSeedNavigation`) est modélisé en **tables** et peuplé par un **seed initial**, **sans aucun changement de comportement** des composants UI (Étapes 3.x → 4.5).
- **Schéma** [`src/db/schema.ts`](src/db/schema.ts) (nouveau, zéro `any`) : enums `page_status`, `module_type`, `module_animation`, `nav_zone`, `nav_kind` + tables **`profiles`** (ancrage tenant minimal), **`pages`** (mapping `SitePage` — `photographer_id` FK, `slug`/`title`/`menu_title`/`status`/`is_in_menu`, unicité `(photographer_id, slug)`), **`page_modules`** (mapping `PageModule` — `page_id` FK CASCADE, `module_type`, `order_index`, `is_visible = !hidden`, `animation`, `anchor_id`, `layout_variant`, **`content` JSONB typé `$type<ModuleContent>()`**), **`navigation_entries`** (mapping `NavMenuEntry` — `zone`, `kind`, `hidden`, `auto`, `page_id` FK→`pages`, **`parent_id` auto-jointure FK CASCADE pour le Niveau 2**, `position` ; index `nav_zone_order_idx`, `nav_page_id_idx`, `nav_parent_id_idx`). Types d'insertion dérivés (`PageInsert`, …) exportés.
- **Configuration & client** : [`drizzle.config.ts`](drizzle.config.ts) (racine — `schema`/`out`/`dialect postgresql`/`dbCredentials.url` depuis `.env.local`) ; [`src/db/index.ts`](src/db/index.ts) (client Drizzle singleton `postgres-js` conservé sur `globalThis` sous HMR, erreur explicite si `DATABASE_URL` absente) ; scripts `db:generate`, `db:migrate`, `db:seed`, `db:studio` ajoutés dans [`package.json`](package.json) ; dépendances `drizzle-orm` + `postgres` et dev `drizzle-kit`, `tsx`, `dotenv` ; `DATABASE_URL` (échantillon) ajouté à [`.env.example`](.env.example).
- **Migration générée** : `drizzle/0000_calm_rockslide.sql` (enums, 4 tables, FK CASCADE y compris l'**auto-jointure** `parent_id`, index, unicité) + **activation RLS** (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`) ajoutée en fin de migration — **aucune politique** posée (accès serveur « service » ; politiques owner/public à l'étape Auth 5.x).
- **Seed initial** [`src/db/seed.ts`](src/db/seed.ts) (nouveau, `tsx`, **idempotent**) : réutilise les helpers métier (`seedPages`, `buildSeedModules`, `pageHref`) — reset du tenant de démo (id fixe, cascade) puis insertion de `profiles` (demo), des **5 pages**, de leurs **modules par défaut** (`order_index` 1..n, `content` JSONB) et des **`navigation_entries`** (Header 5 racines `auto` liées aux pages + sous-menu **Portfolio** 3 `custom` en Niveau 2 via `parent_id` + Footer manuel sans l'Accueil).
- **Transition progressive (blueprint §5 du plan)** : 5.1 = infra pure (app intacte) → 5.2 hydration SSR via prop `initialData` (contrat de props inchangé) → 5.3 CRUD optimiste via Route Handlers + RLS/Auth. Draft SQL historique `-----PourMémoSQLeditor-CreationTable.md` conservé (obsolète, documenté).
- Vérifications : `npx tsc --noEmit` OK ; `npm run lint` OK (0 erreur, 0 avertissement) ; `npm run build` OK (Next.js 16.3.4, TypeScript terminé — routes inchangées `/`, `/admin`, `/admin/navigation`, `/admin/pages`, `/admin/pages/[id]` : aucun fichier UI/app modifié). **Restant (environnement utilisateur)** : renseigner `DATABASE_URL` dans `.env.local` puis `npm run db:migrate` et `npm run db:seed` (2 passes pour vérifier l'idempotence) — hors exécution possible dans cet environnement (pas de BDD accessible).

### Fichiers créés ou modifiés
- Créés : `plans/ROADMAP-5.1-database-schema.md`, `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`, `drizzle/0000_calm_rockslide.sql` (+ `drizzle/meta/*`)
- Modifiés : `package.json` (dépendances + scripts `db:*`), `.env.example` (`DATABASE_URL`), `ROADMAP.md` (Phase 5 créée, 5.1 `[x]`)
- **Aucun** fichier `src/components/**`, `src/app/**`, `src/lib/{pages,navigation,navigation-store}.ts` modifié — application intacte ; aucune route ni table SaaS ajoutée.

### Prochaine étape prévue
**Validation utilisateur** : configurer `DATABASE_URL` (Supabase pooler ou locale `supabase start`) → `npm run db:migrate` + `npm run db:seed` (×2 pour l'idempotence) → inspection `db:studio` puis **Phase 5 – Étape 5.2** : Hydration SSR des stores via la BDD (prop `initialData`, fallback seed) sans changer le contrat des composants.

---

## 2026-09-07 – 12:39 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Gestionnaire de Menu & Navigation) – Étape 4.5 : Rendu Front-Office dynamique du Header & Footer**
- **Plan validé** : [`plans/ROADMAP-4.5-front-navigation.md`](plans/ROADMAP-4.5-front-navigation.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.5 **branche enfin le Front-Office public sur le store de navigation** construit aux Étapes 4.1 → 4.4 : le Header et le Footer cessent d'être des composants statiques alimentés par [`site.ts`](src/lib/site.ts) pour **consommer dynamiquement les zones `header` / `footer`** du `NavigationStore`. **Décision structurante** : le `NavigationStore` devient un **store partagé au niveau module** (singleton en mémoire + `useSyncExternalStore`) consommé par `/admin` **ET** `/` — les modifications et Presets Onboarding du Back-Office sont **visibles immédiatement sur le site public** au sein d'une même session (un rechargement plein réinitialise sur le seed — limite du mock, persistance BDD à venir).
- **Store module partagé** [`src/lib/navigation-store.ts`](src/lib/navigation-store.ts) (nouveau, zéro `any`) : état `{ navigation, appliedPresetId }` en singleton, `getNavigationSnapshot`, `getNavigationServerSnapshot` (SSR/hydratation stable), `subscribeNavigation`, `setNavigationState(updater)` (notification de tous les abonnés). [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) réécrit en **fine couche** `useSyncExternalStore(subscribeNavigation, getNavigationSnapshot, getNavigationServerSnapshot)` exposant **la même valeur de contexte** (navigation, `appliedPresetId`, actions) — **aucun consommateur Back-Office ne change** (`PagesNavigationSync`, `NavigationManager`, `PresetOnboardingPanel`, `NavEntryForm`…).
- **Composant utilitaire** [`src/components/common/NavLink.tsx`](src/components/common/NavLink.tsx) (nouveau) : résolution **unifiée** des cibles — URL externe `https://…` → `<a target="_blank" rel="noopener noreferrer">` ; `/route` → Next `<Link>` (navigation App Router) ; `#ancre` (même page) → défilement lisse avec **offset du Header fixe** ; `/route#ancre` → si déjà sur `/route` défilement lisse, sinon `router.push` puis défilement après changement de route (effet borné, `requestAnimationFrame`, aucun `setState` synchrone — règle ESLint). `onNavigate` (fermeture menu mobile/dropdown), état actif `aria-current="page"` via `usePathname`, respect de `prefers-reduced-motion`.
- **Header** [`src/components/layout/Header.tsx`](src/components/layout/Header.tsx) : devient `"use client"` et lit `getEntries("header")` ; chrome (barre fixe `h-16`, glassmorphism nacré, marque serif, CTA « Connexion ») **conservé à l'identique**. **Desktop** (`hidden md:flex`) : Niveau 1 en liens directs ou **« parents » à chevron** avec **menu déroulant Niveau 2** au survol/focus (`group-hover` / `group-focus-within`, `pointer-events` neutralisé quand masqué). **Mobile** (sous `md`) : **burger → Sheet Radix** latéral ; racine sans enfant = lien pleine largeur, parent = **Accordion** (Trigger libellé + chevron, Content = enfants) ; CTA en pied de Sheet ; fermeture après activation (`onNavigate`).
- **Footer** [`src/components/layout/Footer.tsx`](src/components/layout/Footer.tsx) : devient `"use client"` et lit `getEntries("footer")` — la colonne **« Navigation »** liste les entrées **visibles** via `<NavLink>` ; les blocs marque + réseaux sociaux (`socialLinks`) et mentions légales (`legalLinks`) restent alimentés par `site.ts` (hors store). Structure, styles et copyright inchangés.
- **Layout public** [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) : monte `<NavigationStoreProvider>` autour de `<Header /> / <main> / <Footer />` — grâce au store module partagé, l'instance et celle du layout `/admin` lisent le même état en mémoire (Provider sans nœud DOM : les enfants restent directs du `<body>` en `flex flex-col`).
- **Filtre `hidden !== true` appliqué à chaque niveau** (racine + sous-menu, Header ET Footer) : « masquer » = ne pas rendre (pas supprimer), cohérent avec le Back-Office ; le `hidden` d'une entrée `page` brouillon est maintenu par la synchro côté `/admin` (store partagé → le public en hérite). Rendu public **SSR** (Client Components rendus côté serveur → balisage présent au premier chargement, pas de flash, contenu indexable).
- **Périmètre documenté & validé** : aucune route de page publique créée (les liens peuvent pointer vers des routes inexistantes — comme l'actuel `site.ts`) ; persistance BDD/Supabase hors périmètre (limite du mock : rechargement plein = retour au seed) ; `PagesStore`/`PagesNavigationSync` inutiles côté public (le store embarque déjà `href`/`hidden`/`label` résolus) ; aucune modification de charte « Éclat Minéral » ; schéma BDD inchangé.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4, compilation + passe TypeScript réussies) ; `npm run lint` OK (0 erreur, 0 avertissement). La validation interactive par l'utilisateur (`npm run dev`, cf. §8 du plan) reste à effectuer.

### Fichiers créés ou modifiés
- Créés : `src/lib/navigation-store.ts`, `src/components/common/NavLink.tsx`, `plans/ROADMAP-4.5-front-navigation.md`
- Modifiés : `src/components/backoffice/navigation/NavigationStoreProvider.tsx` (fine couche `useSyncExternalStore` sur le store module), `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/app/(front-office)/layout.tsx` (Provider monté), `ROADMAP.md` (4.5 `[x]`)
- Aucune dépendance nouvelle (Sheet/Accordéon/Button shadcn déjà présents), aucune route publique ajoutée, aucun changement de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** sur `/` (Header seed : Niveau 1 + sous-menu Portfolio au survol/focus Desktop ; redimensionner sous `md` → burger/Sheet/Accordéon ; ancre `#…`/`/page#…` → défilement fluide sans passage sous le Header fixe ; URL externe → `_blank` ; `/admin/navigation` → masquer un item ou appliquer un **Preset** → retour SPA sur `/` : Header/Footer publics reflètent l'état ; Footer colonne Navigation dynamique ; `F5` → retour au seed — limite mock documentée) puis **suite de la feuille de route** (l'intégration BDD/Supabase reste la prochaine grande étape une fois les volets mock consolidés).

---

## 2026-09-07 – 12:11 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.4 : Injection des Presets Onboarding de Navigation (Artiste, Commercial, Passionné)**
- **Plan validé** : [`plans/ROADMAP-4.4-nav-presets-onboarding.md`](plans/ROADMAP-4.4-nav-presets-onboarding.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.4 introduit les **Presets de Navigation Onboarding** (spec §7.2-D) dans l'écran Navigation (`/admin/navigation`) : le photographe choisit un **profil d'activité** et le menu principal est reconstruit selon une structure « starter » — *Artiste / Auteur* (Portfolio · Séries · À propos · Contact), *Photographe Pro / Commercial* (Accueil · Prestations avec sous-menu Mariage/Portrait/Corporate · À propos · Contact) et *Passionné / Semi-Pro* (Accueil · Galeries · Contact).
- **Sémantique validée (option retenue)** : appliquer un preset **devient la structure de référence** — l'application est **atomique sur les deux stores** : (1) recalcule le flag `inMenu` de toutes les pages existantes (`updatePage` — pages retenues → `true`, pages vitrines non retenues → `false`) puis (2) **remplace le Header** (`applyPreset`). La synchro auto [`PagesNavigationSync`](src/components/backoffice/navigation/PagesNavigationSync.tsx) est alors **idempotente** (aucun ré-ajout parasite de page `inMenu`, aucune entrée auto orpheline). **Footer inchangé**.
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) : types `NavPresetId` (`"artiste" | "commercial" | "passionne"`), `NavPresetTarget` (cible `page` par slug ou `href` directe), `NavPresetNode` (sous-menu Niveau 2 en `children`), `NavPreset`, catalogue **`NAV_PRESETS`** (mapping documenté — « Tarifs » fusionné dans la page seed « Prestations & Tarifs », « RDV/CTA » → item Contact, « Connexion » = item final placeholder) et **`resolveNavPreset`** (helper **pur** → `{ header, inMenuByPageSlug }` : page trouvée → entrée `page` **auto** cohérente avec la synchro (`hidden` si brouillon) ; page absente → entrée `custom` **manuelle** placeholder `/<slug>` ; cible `href` → entrée `custom` manuelle).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : état `appliedPresetId` (badge « Preset actif ») + action **`applyPreset(header, presetId)`** (remplace le Header, Footer intact) ; toute **mutation manuelle** (`addEntry`, `updateEntry`, `removeEntry`, `relocateEntry`, `moveNavItem`, `moveEntry`) **réinitialise** `appliedPresetId` à `null` (menu personnalisé) ; `useMemo` dépend de `appliedPresetId` pour propager le badge aux consommateurs.
- **Écran** : nouveau [`PresetOnboardingPanel.tsx`](src/components/backoffice/navigation/PresetOnboardingPanel.tsx) (composant **présentational** — 3 cartes de profil `NAV_PRESETS` avec aperçu racine + sous-menu, badge « Preset actif », Dialog de confirmation détaillant le remplacement du menu et la réorganisation des pages) intégré en tête de [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) ; orchestration **`handleApplyPreset`** (`resolveNavPreset` → `updatePage` pour chaque `inMenu` modifié → `applyPreset`). Couplage inter-stores assumé et documenté (Layout `/admin` : `PagesStoreProvider` > `NavigationStoreProvider`).
- **Périmètre documenté & validé** : Footer jamais modifié ; Front-Office public toujours **non branché** sur le store mock (Server Component via `site.ts`, répété depuis 4.1) ; aucune création automatique de pages (placeholders `custom` manuels — un éventuel doublon futur avec une page créée ensuite reste un choix manuel du photographe) ; ancres de sous-menu en chaînes libres (aucun couplage fort aux modules) ; schéma BDD inchangé.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/navigation`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement). La validation interactive par l'utilisateur (`npm run dev`) reste à effectuer.

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts` (presets + `resolveNavPreset`), `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager}.tsx` (`appliedPresetId`/`applyPreset` + panel + orchestration), `ROADMAP.md` (4.4 `[x]`)
- Créés : `plans/ROADMAP-4.4-nav-presets-onboarding.md`, `src/components/backoffice/navigation/PresetOnboardingPanel.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (appliquer chaque preset → structure conforme au mapping, badge « Preset actif », retrait des pages non retenues dans `/admin/pages` sans réapparition ; édition manuelle → badge « personnalisé ») puis **suite de la feuille de route** (`ROADMAP.md` — l'intégration BDD/Supabase reste la prochaine grande étape une fois les volets mock consolidés).

---

## 2026-09-07 – 11:49 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.3 : Sous-menus Niveau 2, Drag & Drop et liens ancres/externes**
- **Plan validé** : [`plans/ROADMAP-4.3-navigation-advanced.md`](plans/ROADMAP-4.3-navigation-advanced.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.3 fait passer l'écran Navigation (`/admin/navigation`) d'une arborescence **plate** (4.1/4.2) à une arborescence **hiérarchique restructurable** (spec §7.2-D & §8) : **sous-menus de Niveau 2** dans le **Header uniquement** (le Footer reste plat), **re-structuration par Drag & Drop** (`@hello-pangea/dnd`) et **cibles de lien unifiées** (pages internes, ancres `#…`, chemins `/page#ancre`, URL externes `https://…`).
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) : `NavMenuEntry.children?: NavMenuEntry[]` (Niveau 2, profondeur **max 2**) ; `NavItemKind` renommé `"link"` → `"custom"` (lien personnalisé) ; **`normalizeHref` centralisé/exporté** (ancres, relatif + ancre, URL externes) ; helpers **purs** : `hasNavChildren`, `findNavEntry`, `findNavParentId`, `insertNavEntry`, `updateNavEntry`/`removeNavEntry` (**récursifs**, suppression = cascade du sous-menu), `moveNavEntryAcross` (déplacement entre listes racine/enfant, `structuredClone`) ; seed : **sous-menu de démonstration** sous « Portfolio » (enfants manuels Mariages/Portraits/Corporate → `/portfolio#…`).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : actions passées en **arbres** — `addEntry(area, entry, parentId?)`, `updateEntry`/`removeEntry` récursifs, `relocateEntry(area, id, toParentId)` (déplacement via formulaire), `moveNavItem(area, source, destination)` (DnD). Garde-fous : **Footer plat** (tout `parentId` ignoré), **profondeur max 2** (un item qui porte un sous-menu ne peut pas être imbriqué), refus d'auto-parent.
- **Synchro** [`PagesNavigationSync.tsx`](src/components/backoffice/navigation/PagesNavigationSync.tsx) : parcours du Header devenu **récursif** (racine + sous-menus) — une entrée `auto` (page `inMenu`) peut être **imbriquée** et reste retrouvée/purgée où qu'elle soit ; Footer inchangé ; règles 4.2 conservées (aucune boucle inter-stores, liens libres `pageId: null` et ordre jamais touchés).
- **Écran** [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) : **un `DragDropContext` par zone** (aucun glisser Header ↔ Footer). Le Header porte une liste racine + **une zone enfant par item de Niveau 1** (toujours montée → cible de dépôt fiable, car `@hello-pangea/dnd` ne mesure pas un droppable ajouté pendant le glisser) : déposer un lien de Niveau 1 dans la zone d'un autre l'**imbrique** (Niveau 2), le déposer dans la racine le **désimbrique**. Le Footer reste **plat** (réordonnancement simple). [`NavEntryRow.tsx`](src/components/backoffice/navigation/NavEntryRow.tsx) : **poignée `GripVertical`** (seule zone draggable — pattern `ModuleRow`), marqueur « Sous-menu » + icône pour le Niveau 2, **retrait des boutons ↑/↓** (provisoires 4.1). Suppression d'un parent = **cascade du sous-menu** (Dialog de confirmation « + n liens »).
- **Formulaire** [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) : type **« Lien personnalisé »** (`custom` — ancres/URL via `normalizeHref` importé) + champ **« Rattachement »** (Header : racine ou item de Niveau 1 ; **verrouillé à la racine** si l'item édité possède déjà un sous-menu) ; payload `{ label, kind, href, pageId, parentId }` → `addEntry(parentId)` / `relocateEntry`.
- **Montage sans SSR** : [`NavigationManagerScreen.tsx`](src/components/backoffice/navigation/NavigationManagerScreen.tsx) (nouveau, `dynamic(…, { ssr: false })`, miroir de `PageEditorScreen`) monté par [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) — `@hello-pangea/dnd` jamais rendu côté serveur.
- **Périmètre documenté & validé** : le **rendu public** (Header `/`) n'est **pas branché** sur le store mock (Server Component alimenté par `site.ts` — répété depuis 4.1, le branchage viendra avec l'intégration BDD/Supabase). Les **ancres sont saisies en texte libre** (aucun couplage fort avec les modules des pages, cf. plan §0.3). La validation interactive par l'utilisateur (`npm run dev`) reste à effectuer.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/navigation.ts` (arbre `children`, `kind custom`, `normalizeHref`, helpers), `src/components/backoffice/navigation/{NavigationStoreProvider,PagesNavigationSync,NavigationManager,NavEntryRow,NavEntryForm}.tsx`, `src/app/(back-office)/admin/navigation/page.tsx` (wrapper ssr:false), `ROADMAP.md` (4.3 `[x]`, 4.4 `[IN_PROGRESS]`)
- Créés : `plans/ROADMAP-4.3-navigation-advanced.md`, `src/components/backoffice/navigation/NavigationManagerScreen.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (réordonner par poignée ; imbriquer/désimbriquer un lien au Header ; refus d'imbriquer un parent avec sous-menu ; « Rattachement » du formulaire ; cascade de suppression ; synchro auto même imbriquée ; normalisation `#ancre` / `/page#ancre` / `https://…`) puis **Phase 4 – Étape 4.4** : Injection des Presets Onboarding de Navigation (Artiste, Commercial, Passionné).

---

## 2026-09-05 – 22:10 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.2 : Rattachement dynamique des pages (Navigation ↔ Pages)**
- **Plan validé** : [`plans/ROADMAP-4.2-pages-nav-sync.md`](plans/ROADMAP-4.2-pages-nav-sync.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.2 interconnecte automatiquement la gestion des Pages et l'arborescence de Navigation (spec §7.2-D) : création (option « Ajouter au menu »), mise à jour MenuTitle/slug, dépublication (masquage) et suppression (cascade / anti-liens orphelins).
- **Prérequis structurant (corrigé vs proposition initiale)** : le `NavigationStoreProvider` était **local à la route** `/admin/navigation` (4.1) — une synchro depuis `/admin/pages` était impossible. Le Provider navigation est **globalisé dans le Layout `/admin`** (au même niveau que `PagesStoreProvider`) ; retrait du Provider local de la page [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) (rend désormais directement `NavigationManager`).
- **Modèle Pages** [`src/lib/pages.ts`](src/lib/pages.ts) : `inMenu: boolean` ajouté à `SitePage` + `PageMetadataDraft` (source de vérité du rattachement auto, future colonne `pages.show_in_menu`) ; `seedPages` passées à `inMenu: true` ; `createPage`/`updatePage` propagent `inMenu` via le spread du draft.
- **Modèle Navigation** [`src/lib/navigation.ts`](src/lib/navigation.ts) : `NavMenuEntry.pageId: string | null` (lien stable vers `SitePage`) + `NavMenuEntry.auto: boolean` (entrée **auto** gérée par `inMenu` vs **manuelle**) ; `createNavEntry` étendu (`pageId`, `auto`) ; `buildSeedNavigation` : Header en entrées **auto**, Footer en entrées **manuelles** (purgé seulement à la suppression d'une page).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) : payload `NewNavEntry` (+ `pageId`/`auto`), `addEntry` enrichi ; Provider désormais **global** (commentaire d'en-tête mis à jour).
- **Pont de synchronisation** [`PagesNavigationSync.tsx`](src/components/backoffice/navigation/PagesNavigationSync.tsx) (nouveau, `"use client"`, rend `null`, monté sous les deux Providers dans le Layout `/admin`) : réconciliation **idempotente** — (1) toute page `inMenu` sans entrée Header `pageId` → ajout d'une entrée **auto** ; (2) mise à jour `label`/`href`/`hidden` de toutes les entrées liées (auto ET manuelles, Header/Footer) quand la page existe ; (3) retrait du Header **uniquement des entrées auto** dont la page quitte le menu ; (4) cascade : retrait de toute entrée liée dont la page n'existe plus. Garde-fous : liens libres (`pageId: null`) et ordre jamais touchés ; comparaison avant `setState` → aucune boucle Pages ↔ Navigation.
- **Formulaire de page** [`PageMetadataForm.tsx`](src/components/backoffice/pages/PageMetadataForm.tsx) : option **« Ajouter au menu principal »** (`Switch`, pré-rempli `initial?.inMenu`) — **cochée par défaut à la création** (rattachement automatique attendu, désactivable). [`PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) transmet `inMenu` dans le draft.
- **Écran Navigation** [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) : les pages cibles sont typées `{ id, menuTitle, href }` — la sélection « Page du site » retient le **`pageId`** et remplit `label` (`menuTitle`) + `href` ; le payload soumis (`NavEntryFormData`) porte `pageId`. [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) adapté (mapping `id`, `handleSubmit` avec `pageId`).
- **Corrections post-validation (retours utilisateur)** : (a) un lien ajouté **manuellement** dans l'écran Navigation était immédiatement purgé par la réconciliation quand la page cible avait `inMenu` non coché → introduction du marqueur `auto` : seules les entrées **auto** sont retirées quand la page quitte le menu, les **manuelles** ne sont purgées que si la page est supprimée ; (b) l'option « Ajouter au menu » est désormais **cochée par défaut** pour qu'une nouvelle page apparaisse automatiquement ; (c) correction de la zone cible de `updateEntry` (le point 2 traitait le Footer en Header).
- **Périmètre documenté & validé** : le **rendu public** (Header `/`) n'est **pas branché** sur le store mock (Server Component alimenté par `site.ts`) — le branchage des menus sur le site public viendra avec l'intégration BDD/Supabase (répété depuis 4.1). La synchro Pages ↔ Navigation fonctionne dans le Back-Office.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/navigation`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts` (`inMenu`), `src/lib/navigation.ts` (`pageId` + `auto`), `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager,NavEntryForm}.tsx`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/app/(back-office)/admin/layout.tsx` (Providers + sync globalisés), `src/app/(back-office)/admin/navigation/page.tsx` (Provider retiré), `ROADMAP.md`
- Créés : `plans/ROADMAP-4.2-pages-nav-sync.md`, `src/components/backoffice/navigation/PagesNavigationSync.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (créer une page avec « Ajouter au menu » → apparition dans `/admin/navigation` ; modifier menuTitle/slug → mise à jour ; dépublier → masquée ; supprimer → purgée Header & Footer) puis **Phase 4 – Étape 4.3** : Re-structuration par Drag & Drop du Menu (éléments de Niveau 1, sous-menus de Niveau 2, liens vers ancres/externes).

---

## 2026-09-05 – 21:10 (heure locale America/Bogota)

### Tâche exécutée
**Phase 4 (Back-Office Gestionnaire de Menu & Navigation) – Étape 4.1 : Écran « Navigation & Menus » (organisation de l'arborescence du Header / Footer) — `/admin/navigation`**
- **Plan validé** : [`plans/ROADMAP-4.1-navigation.md`](plans/ROADMAP-4.1-navigation.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 4.1 crée l'écran d'administration des menus du site (spec §7.2-D) : listes ordonnées Header/Footer, CRUD d'items (libellé + cible), **Toggle Eye** (masquer sans supprimer) et réordonnancement ↑/↓. Périmètre **strict** : arborescence plate ; les sous-menus Niveau 2 + Drag & Drop + ancres/externes restent en **4.3**, le rattachement auto des pages en **4.2**, les presets en **4.4**.
- **Modèle** [`src/lib/navigation.ts`](src/lib/navigation.ts) (nouveau, logique pure, zéro `any`) : types `NavArea` ("header"/"footer"), `NavItemKind` ("page"/"link"), `NavMenuEntry {id, label, kind, href, hidden}`, `SiteNavigation` ; fabriques `createNavEntry`, `buildSeedNavigation` (Header depuis `seedPages` — Accueil + pages vitrines ; Footer sans l'Accueil), helper pur `moveNavEntry` (↑/↓). Mappage futur table `nav_items` documenté (schéma BDD non modifié).
- **Store** [`NavigationStoreProvider.tsx`](src/components/backoffice/navigation/NavigationStoreProvider.tsx) (nouveau, Provider client **local à la route**) : état `{header, footer}` seedé par `buildSeedNavigation` ; actions `getEntries`, `addEntry`, `updateEntry`, `removeEntry`, `moveEntry` (mutations clonantes) ; hook `useNavigationStore` = seule porte d'accès.
- **Écran** : [`NavigationManager.tsx`](src/components/backoffice/navigation/NavigationManager.tsx) (zones « Menu principal — Header » et « Navigation du pied de page — Footer », compteurs, états vides, Dialog ajout/édition + confirmation suppression) ; [`NavEntryRow.tsx`](src/components/backoffice/navigation/NavEntryRow.tsx) (badge type Page/Lien, cible `href` mono, Toggle Eye `Eye`/`EyeOff` + badge « Masqué », ↑/↓ désactivés aux extrémités, édition, suppression) ; [`NavEntryForm.tsx`](src/components/backoffice/navigation/NavEntryForm.tsx) (Dialog : libellé + type de cible — « Page du site » (Select alimenté par `usePagesStore`) ou « Lien libre » (Input slug/URL préfixé `/`), validation légère).
- **Routes & intégration** : page serveur [`navigation/page.tsx`](src/app/(back-office)/admin/navigation/page.tsx) (metadata + `<NavigationStoreProvider><NavigationManager /></NavigationStoreProvider>`) ; nouveau [`SidebarNav.tsx`](src/components/backoffice/SidebarNav.tsx) (Client Component isolé pour `usePathname` — calcule l'entrée active « Pages »/« Navigation » selon la route, conserve les entrées « À venir » désactivées) branché dans [`admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) qui reste **Server Component** ; l'entrée sidebar « Navigation » passe de désactivée à fonctionnelle.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/app/(back-office)/admin/layout.tsx` (sidebar « Navigation » active + extraction `SidebarNav`), `ROADMAP.md`
- Créés : `plans/ROADMAP-4.1-navigation.md`, `src/lib/navigation.ts`, `src/components/backoffice/navigation/{NavigationStoreProvider,NavigationManager,NavEntryRow,NavEntryForm}.tsx`, `src/components/backoffice/SidebarNav.tsx`, route `src/app/(back-office)/admin/navigation/page.tsx`
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route publique, aucun changement Front-Office (Header/Footer/`site.ts` inchangés) ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/navigation` : sidebar → Navigation actif, lister/masquer/↑/↓, ajouter/éditer/supprimer un lien page ou libre) puis **Phase 4 – Étape 4.2** : Rattachement dynamique des pages (mise en lien automatique du `MenuTitle` des pages créées dans la navigation).

---

## 2026-09-05 – 20:08 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.4 : Formulaire CRUD en vue dépliée (édition des contenus & réglages de chaque module) — éditeur `/admin/pages/[id]`**
- **Plan validé** : [`plans/ROADMAP-3.4-crud-expanded.md`](plans/ROADMAP-3.4-crud-expanded.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 3.4 remplace la **Vue Dépliée « lecture seule »** de l'Étape 3.3 par un **formulaire CRUD complet** contrôlé par le store, persistant en **temps réel sans rechargement** (spec §7.2-B « Vue Dépliée - CRUD »).
- **Modèle typé (union discriminé, zéro `any`)** [`src/lib/pages.ts`](src/lib/pages.ts) : nouveaux types `MediaField`, `ServiceItem`, `FaqItem`, `GalleryImage` et `ModuleContent` (union discriminé par `type`, 7 familles — hero, about, services, cta-banner, gallery, faq, contact) ; `PageModule` étendu avec `content: ModuleContent` (+ `layoutVariant?: string` **réservé** pour le futur Layout Switcher, non édité en 3.4) ; fabrique `createModuleContent(type)` (contenus par défaut riches, `crypto.randomUUID()` pour les items, instance neuve à chaque appel) ; `createModule` intègre `content` ; `buildSeedModules` conserve sa signature + surcharge seed du Hero de l'Accueil ; constantes `moduleAnimationLabels`/`moduleAnimationOrder` (déplacées depuis `ModuleRow`).
- **Store** [`PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) : nouvelle action `updateModule(pageId, moduleId, patch: Partial<PageModule>)` — mutation clonante fusionnant le patch et rafraîchissant `updatedAt` de la page ; le `content` est committé **en bloc** (jamais partiel) pour préserver le typage de l'union.
- **Dossier de formulaires** `src/components/backoffice/pages/modules/` (nouveau) : `form-fields.tsx` (champs partagés accessibles via `useId` : `TextField`, `TextAreaField`, `MediaFields` URL+Alt) ; `ModuleSettingsForm.tsx` (réglages généraux : Titre d'affichage, Ancre `#id` avec validation légère + **alerte d'ancre dupliquée** non bloquante, Animation via `Select`) ; `ModuleContentEditor.tsx` (routeur discriminé sur `content.type`, switch exhaustif TS, aucun cast) ; 7 éditeurs de famille : `ModuleHeroEditor`, `ModuleAboutEditor`, `ModuleServicesEditor` (liste items titre/description/prix), `ModuleCtaBannerEditor`, `ModuleGalleryEditor` (liste visuels URL+Alt), `ModuleFaqEditor` (liste question/réponse), `ModuleContactEditor` (email/téléphone/adresse). Listes avec ajout/suppression (clés `item.id` stables), ordre conservé (réordonnancement d'images hors périmètre 3.4).
- **Intégration** [`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) : la Vue Dépliée remplace le récapitulatif par deux sections (« Réglages » → `ModuleSettingsForm`, « Contenu » → `ModuleContentEditor`) séparées par un `Separator` ; le bandeau 3.3 (poignée, œil, suppression, chevron) inchangé. [`ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) : câblage `handleUpdateModule` (→ `updateModule`) + `hasDuplicateAnchor` (détection d'ancre partagée). Compatibilité Drag & Drop préservée : poignée seule draggable, champs hors du trigger, saisies (flèches/Tab) non interceptées.
- **Portée volontairement allégée (assumé, validé par l'utilisateur)** : upload média non branché (placeholder URL — l'upload R2/Sharp viendra avec l'intégration stockage), 2e bouton CTA, variantes internes (`layoutVariant` réservé), assistants IA — enrichissements planifiés dans des phases ultérieures une fois les briques BDD/stockage/IA intégrées (spec §8).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement).

### Fichiers créés ou modifiés
- Modifiés : `src/lib/pages.ts` (types de contenu + fabriques + labels animation), `src/components/backoffice/PagesStoreProvider.tsx` (action `updateModule`), `src/components/backoffice/pages/ModuleRow.tsx` (formulaires dans la Vue Dépliée), `src/components/backoffice/pages/ModuleDndList.tsx` (câblage updateModule + ancre dupliquée), `ROADMAP.md`
- Créés : `plans/ROADMAP-3.4-crud-expanded.md`, dossier `src/components/backoffice/pages/modules/` (`form-fields.tsx`, `ModuleSettingsForm.tsx`, `ModuleContentEditor.tsx`, `ModuleHeroEditor.tsx`, `ModuleAboutEditor.tsx`, `ModuleServicesEditor.tsx`, `ModuleCtaBannerEditor.tsx`, `ModuleGalleryEditor.tsx`, `ModuleFaqEditor.tsx`, `ModuleContactEditor.tsx`)
- Aucune dépendance nouvelle, aucun composant UI nouveau, aucune route nouvelle, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (ouvrir un module → modifier titre/ancre/animation, saisir les contenus, ajouter/supprimer des items, vérifier la persistance au repli/rouverture et le drag) puis **Phase 4 – Étape 4.1** : Écran « Navigation & Menus » (Interface d'organisation de l'arborescence du Header/Footer).

---

## 2026-09-05 – 16:35 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.3 : Composant Accordéon Compact (Drag handle, nom du module, Toggle Eye de masquage, suppression) — éditeur de page `/admin/pages/[id]`**
- **Plan validé** : [`plans/ROADMAP-3.3-accordion-compact.md`](plans/ROADMAP-3.3-accordion-compact.md) (architecture rédigée en mode Architect, validée par l'utilisateur). L'Étape 3.3 transforme le bandeau provisoire de 3.2 en **gestionnaire Accordéon Compact** (spec §7.2-B) : Vue Compacte repliable (poignée DnD, libellé cliquable + chevron, Toggle Eye, suppression avec confirmation) et Vue Dépliée en **récapitulatif lecture seule** préparant le CRUD de l'Étape 3.4.
- **Store** [`src/components/backoffice/PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) (modifié) : nouvelle action `setModuleHidden(pageId, moduleId, hidden)` — mutation clonante qui pilote le champ `hidden` déjà présent sur `PageModule` (jusqu'ici inexploité). Sémantique : `hidden = true` → le module n'est pas rendu sur le site public (masqué sans suppression).
- **Canvas DnD + Accordéon** [`src/components/backoffice/pages/ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) (modifié) : l'`Accordion` Radix (`type="single"` `collapsible`, valeur = `module.id`) est intégré **à l'intérieur** du conteneur `Droppable` ; état contrôlé `openModuleId` (un seul module déplié à la fois, l'état suit l'item après réordonnancement) ; handlers `handleRemove` (referme l'accordéon si l'item supprimé était ouvert) et `handleToggleHidden`. `DragDropContext`/`Draggable` et `moveModule` inchangés (DnD 3.2 préservé, poignée = unique zone de drag).
- **Item accordéon compact** [`src/components/backoffice/pages/ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) (réécrit) : devient un `AccordionPrimitive.Item` (ref `innerRef` + `draggableProps` posées sur l'item racine). Bandeau : poignée `GripVertical` (`dragHandleProps`), trigger personnalisé (icône `ModuleIcon`, numéro + titre, meta catégorie · ancre, chevron rotatif) — **boutons frères, aucun `<button>` imbriqué** ; Toggle Eye (`Eye`/`EyeOff`, `aria-pressed`, tooltip) ; suppression `Trash2` → **`Dialog` de confirmation** (avertissement si le module est visible sur le site). Rendu « Masqué » : badge « Masquée », `EyeOff`, libellé estompé, fond grisé. Vue Dépliée (`AccordionContent`) : récapitulatif lecture seule (Type, Catégorie, Ancre `#…`, Animation avec libellés français, Visibilité) + encart « L'édition détaillée du contenu arrive à l'étape 3.4 » (aucun champ éditable — périmètre 3.4).
- **Ajustement post-validation (retour utilisateur)** : augmentation de la lisibilité des titres de sections accordéon — titre passé en `text-[15px] leading-6 font-semibold`, meta en `text-[13px] leading-5`, padding vertical du trigger élargi (`py-1.5`).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur, 0 avertissement — suppression d'une directive `eslint-disable react-hooks/refs` devenue inutile dans `ModuleDndList`).

### Fichiers créés ou modifiés
- Modifiés : `src/components/backoffice/PagesStoreProvider.tsx` (action `setModuleHidden`), `src/components/backoffice/pages/ModuleDndList.tsx` (Accordéon contrôlé + handlers), `src/components/backoffice/pages/ModuleRow.tsx` (réécriture AccordionItem compact + taille des titres), `ROADMAP.md`
- Créés : `plans/ROADMAP-3.3-accordion-compact.md`
- Aucune dépendance nouvelle, aucun composant UI nouveau (`accordion.tsx`/`dialog.tsx` déjà injectés), aucune route nouvelle, aucun changement Front-Office ni de schéma BDD.

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/pages` → « Ouvrir l'éditeur » → déplier/replier un module, masquer/afficher à l'œil, réordonner au drag, supprimer avec confirmation) puis **Phase 3 – Étape 3.4** : Formulaire CRUD en vue dépliée (Édition des champs textuels, boutons CTA, ancres `#id` et médias) — la vue dépliée de 3.3 (récapitulatif lecture seule + encart) fournit le conteneur réutilisé.

---

## 2026-09-05 – 15:30 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.2 : Conteneur Drag & Drop des modules (`@hello-pangea/dnd`) + menu « + Ajouter une section » (éditeur de page `/admin/pages/[id]`)**
- **Plan validé** : [`plans/ROADMAP-3.2-pagebuilder-dnd.md`](plans/ROADMAP-3.2-pagebuilder-dnd.md) (architecture rédigée en mode Architect, validée par l'utilisateur).
- **Store mock global au Back-Office** — [`src/components/backoffice/PagesStoreProvider.tsx`](src/components/backoffice/PagesStoreProvider.tsx) (nouveau, Client Component) : Provider React Context posé dans le Layout Dashboard (Server Component conservé) autour de la zone de contenu ; porte l'état partagé `pages` + `modulesByPage` (initialisation unique `seedPages` + `buildSeedModules(slug)` par page). Hook `usePagesStore` (le seul accès) : `getPage`, `createPage`, `updatePage`, `deletePage` (supprime aussi les modules), `getModules`, `addModule`, `removeModule`, `moveModule`. Mutations clonantes, `updatedAt` ISO, zéro `any`.
- **Modèle étendu** [`src/lib/pages.ts`](src/lib/pages.ts) : types `PageModuleType` (hero/about/services/cta-banner/gallery/faq/contact), `ModuleAnimation`, `PageModule` (id/type/title/hidden/animation/anchorId, mappe 1:1 vers la future table `page_modules`), `ModuleMeta` + catalogue `moduleCatalog` (7 modules, 6 catégories — spec §8) ; fabriques `createModule` (id `randomUUID`, ancres indexées), `buildSeedModules(slug)` (modules par défaut par page seed ; pages créées = canvas vide) ; helper pur `reorderModules` (Drag & Drop).
- **Refactor liste** [`src/components/backoffice/pages/PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) : l'état local `useState` de l'Étape 3.1 **remonte dans le store** (comportement CRUD conservé) ; nouvelle action « Ouvrir l'éditeur » (icône `LayoutTemplate` + titre cliquable) → `router.push("/admin/pages/[id]")`. La page serveur [`(back-office)/admin/pages/page.tsx`](src/app/(back-office)/admin/pages/page.tsx) cesse de passer `initialPages` (seed dans le Provider).
- **Éditeur de page** (route dynamique [`[id]/page.tsx`](src/app/(back-office)/admin/pages/[id]/page.tsx) + `PageEditorScreen.tsx` monté via `next/dynamic ssr:false` pour isoler `@hello-pangea/dnd` de l'hydratation SSR) : [`PageEditor.tsx`](src/components/backoffice/pages/PageEditor.tsx) — en-tête (retour, titre + statut `Badge` + slug + compteur, « Aperçu » nouvel onglet, « + Ajouter une section »), canvas (liste DnD ou état vide « Cette page est vide »), état « Page introuvable » si id absent du store.
- **Drag & Drop** [`ModuleDndList.tsx`](src/components/backoffice/pages/ModuleDndList.tsx) : `DragDropContext`/`Droppable` (droppableId par page)/`Draggable` (`draggableId` stable = `module.id`) ; `onDragEnd` → `moveModule` (via `reorderModules`). [`ModuleRow.tsx`](src/components/backoffice/pages/ModuleRow.tsx) : bandeau compact (poignée `GripVertical` en `dragHandleProps`, `ModuleIcon`, libellé + catégorie + ancre, suppression `Trash2`). Désactivation ciblée `react-hooks/refs` documentée (pattern d'adaptateur officiel de la lib).
- **Catalogue « + Ajouter une section »** [`AddSectionSheet.tsx`](src/components/backoffice/pages/AddSectionSheet.tsx) : `Sheet` latérale droite (shadcn/ui injectée [`src/components/ui/sheet.tsx`](src/components/ui/sheet.tsx), wrapper Radix Dialog déjà présent) ; catalogue groupé par catégorie → clic = `addModule(pageId, type)` (ajout en fin de canvas). [`ModuleIcon.tsx`](src/components/backoffice/pages/ModuleIcon.tsx) : mapping type → icône lucide centralisé.
- **Dépendance** : installation de `@hello-pangea/dnd@^18.0.1` (compatible React 19, installée sans conflit de peerDependencies).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes `/`, `/_not-found`, `/admin`, `/admin/pages` en statique + `/admin/pages/[id]` en dynamique) ; `npm run lint` OK (0 erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/app/(back-office)/admin/layout.tsx` (Provider englobant), `src/app/(back-office)/admin/pages/page.tsx` (sans prop), `src/lib/pages.ts`, `src/components/backoffice/pages/PagesManager.tsx` (store + éditeur), `ROADMAP.md`, `package.json` & `package-lock.json` (`@hello-pangea/dnd`)
- Créés : `plans/ROADMAP-3.2-pagebuilder-dnd.md`, `src/components/backoffice/PagesStoreProvider.tsx`, `src/components/ui/sheet.tsx`, `src/app/(back-office)/admin/pages/[id]/page.tsx`, `src/components/backoffice/pages/{PageEditor,PageEditorScreen,ModuleDndList,ModuleRow,AddSectionSheet,ModuleIcon}.tsx`
- Supprimés : fichiers journaux temporaires de build (`_build-3-2.txt`, `_build-3-2.log`)

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/admin/pages` → « Ouvrir l'éditeur » → réordonner les modules au glisser-déposer, ajouter/supprimer des sections, état vide sur nouvelle page) puis **Phase 3 – Étape 3.3** : Composant Accordéon Compact (Drag handle, nom du module, Toggle Eye de masquage, suppression) — l'Étape 3.2 a fourni le bandeau provisoire réutilisé.

---

## 2026-09-05 – 14:05 (heure locale America/Bogota)

### Tâche exécutée
**Phase 3 (Back-Office Page Builder) – Étape 3.1 : Métadonnées de Page (restructuration des routes en groupes + Dashboard `/admin` + gestionnaire de Pages CRUD simulé)**
- **Restructuration `src/app` en route groups** (conforme ARCHITECTURE.md §2 / plan §1.1) : layout racine [`src/app/layout.tsx`](src/app/layout.tsx) neutralisé (`<html>/<body>` + fonts + metadata uniquement) ; création du route group [`(front-office)/layout.tsx`](src/app/(front-office)/layout.tsx) reprenant à l'identique le chrome public (Header + `main pt-20` + Footer) et déplacement de la page d'accueil vers [`(front-office)/page.tsx`](src/app/(front-office)/page.tsx) (copie conforme, rendu `/` inchangé). Suppression de l'ancien `src/app/page.tsx` et du fichier orphelin accidentel `src/app/------(front-office)` (résidu de la session interrompue). URLs publiques préservées (les route groups n'ajoutent aucun segment).
- **Portée `.admin`** dans [`src/app/globals.css`](src/app/globals.css) : palette neutre « épurée & haut contraste » (fond blanc, surfaces grises `zinc`, primaire sombre `#18181b`, destructif rouge net) appliquée sur le conteneur du Layout Dashboard — aucun token du Front-Office modifié hors portée.
- **Chrome Dashboard** [`(back-office)/admin/layout.tsx`](src/app/(back-office)/admin/layout.tsx) (Server Component, `class="admin"`, Desktop-first) : barre latérale fixe `w-60` (marque « Administration », nav « Pages » active, entrées « À venir » désactivées avec tooltip) + barre supérieure (lien « Aperçu du site » `/` + avatar initiales) + zone contenu `flex-1` (pas de `pt-20`, pas de Header/Footer public). Point d'entrée [`(back-office)/admin/page.tsx`](src/app/(back-office)/admin/page.tsx) : `redirect("/admin/pages")`.
- **Composants UI injectés** dans `src/components/ui/` (convention shadcn/ui moderne `data-slot`, cohérente avec Button/Input/Dialog existants) : `label.tsx` (Radix Label), `select.tsx` (Radix Select complet), `switch.tsx` (Radix Switch), `badge.tsx` (variants `default`/`secondary`/`outline`/`success`/`warning`/`destructive`), `textarea.tsx`, `separator.tsx`. Dépendances installées : `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-separator`.
- **Modèle & helpers** [`src/lib/pages.ts`](src/lib/pages.ts) : types `PageStatus`, `SitePage` (mappe 1:1 vers la future table `pages`), `PageMetadataDraft` ; helpers `slugify` (NFD + retrait des accents), `slugFromTitle`, `uniqueSlug`, `pageHref` ; jeu de données `seedPages` (miroir de `mainNav`). TypeScript strict, zéro `any`, aucune dépendance.
- **Formulaire** [`src/components/backoffice/pages/PageMetadataForm.tsx`](src/components/backoffice/pages/PageMetadataForm.tsx) (Client Component, création/édition) : Titre H1/SEO (Input requis), MenuTitle (Input, max 28, compteur), Slug URL (Input éditable + préfixe `/` + bouton « Régénérer », auto-suggestion depuis le titre tant que le slug n'est pas saisi manuellement ; slug vide autorisé pour la page d'accueil), Statut (`Select` Brouillon/Publié). Validation légère côté client (requis + unicité du slug affichée en temps réel), messages d'erreur accessibles (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Écran de gestion** [`src/components/backoffice/pages/PagesManager.tsx`](src/components/backoffice/pages/PagesManager.tsx) (Client Component, persistance simulée `useState`) : barre d'actions (titre + compteurs + « + Nouvelle page »), liste tableau Desktop-first (Page + MenuTitle, URL `/slug` ouvrable, `Badge` Statut Publié/Brouillon, Mis à jour formaté `fr-FR`, actions éditer/supprimer), Dialog création/édition embarqué (`PageMetadataForm`, unicité hors page courante), Dialog de confirmation de suppression (avertissement si page publiée). Mutations : `crypto.randomUUID()` + `updatedAt` ISO + tri récentes d'abord.
- **Page serveur** [`(back-office)/admin/pages/page.tsx`](src/app/(back-office)/admin/pages/page.tsx) : titre metadata + `<PagesManager initialPages={seedPages} />` (prépare le futur SSR Supabase sans changer le contrat de props).
- Correction du typage du layout racine : remplacement de `LayoutProps<"/">` (scaffold) par `{ children: ReactNode }` (le layout racine englobe désormais `/` et `/admin`).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/`, `/_not-found`, `/admin`, `/admin/pages`).

### Fichiers créés ou modifiés
- Modifiés : `src/app/layout.tsx`, `src/app/globals.css`, `ROADMAP.md`, `package.json` & `package-lock.json` (dépendances Radix Label/Select/Switch/Separator)
- Créés : `src/app/(front-office)/page.tsx`, `src/app/(back-office)/admin/layout.tsx`, `src/app/(back-office)/admin/page.tsx`, `src/app/(back-office)/admin/pages/page.tsx`, `src/lib/pages.ts`, `src/components/backoffice/pages/PageMetadataForm.tsx`, `src/components/backoffice/pages/PagesManager.tsx`, `src/components/ui/{label,select,switch,badge,textarea,separator}.tsx`
- Supprimés : `src/app/page.tsx` (déplacé), `src/app/------(front-office)` (orphelin accidentel)

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** (`/` inchangé ; `/admin` → `/admin/pages` : chrome Dashboard, liste seed, création/édition/suppression de pages) puis **Phase 3 – Étape 3.2** : Conteneur Drag & Drop des modules (`@hello-pangea/dnd`) & menu « + Ajouter une section » dans l'éditeur de page.

---

## 2026-09-05 – 13:19 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.3 : création du Canvas central de la Page d'Accueil (`/`) reliant le Header et le Footer**
- `src/app/page.tsx` (réécrit) : remplacement du scaffold Next.js par le **Canvas central vierge** du Front-Office — section pleine hauteur `min-h-[calc(100svh-5rem)]` (compense le Header fixe `h-16` + offset `pt-20` du RootLayout) entre le Header et le Footer, halo nacré doux en arrière-plan (`bg-accent/25` + `blur-3xl`, aucun code couleur en dur), sur-titre « Photographe professionnel » (Plus Jakarta, `tracking-[0.3em]`), marque `siteName` en Cormorant Garamond (`text-5xl`→`lg:text-7xl`, `font-light`), accroche et doubles CTA (`Button` `size="lg"` default → `/portfolio` et outline → `/contact`). Placeholder « Page de garde » destiné à être alimenté par les modules du Page Builder (SPECIFICATIONS-V8.md §3.2).
- Les liens CTA pointent vers les routes `/portfolio` et `/contact` créées dans les phases ultérieures (pattern inchangé du Header).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Modifiés : `src/app/page.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** — la Phase 2 (Frame Global Front-Office : Header, Footer, Canvas d'accueil) est alors complète ; passage à la **Phase 3 – Back-Office Page Builder (Étape 3.1 : Métadonnées de Page)**.

---

## 2026-09-05 – 13:15 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.2 : création du composant `Footer` et intégration dans le RootLayout**
- `src/components/layout/Footer.tsx` (créé) : Server Component statique (aucun `"use client"`) — fond surface nacrée `bg-[var(--surface-color)]` + bordure haute perle `border-t border-[var(--border-color)]` ; marque en Cormorant Garamond (`var(--font-heading)`) reliée à l'accueil, textes/liens secondaires en Plus Jakarta Sans (`var(--font-body)`) ; blocs « Navigation » (réutilisation `mainNav`), « Informations » (mentions légales `legalLinks`) et marque + réseaux sociaux (`socialLinks` Instagram/Pinterest, liens externes `target="_blank" rel="noopener noreferrer"` avec icône `ArrowUpRight`) ; ligne basse avec copyright dynamique (`© {year} {siteName}`, année en cours calculée au rendu). Props optionnelles `siteName` / `navItems` / `socialItems` / `legalItems` / `year` (générique et réutilisable).
- `src/lib/site.ts` (étendu) : ajout des sources de config partagées — `socialLinks` (Instagram, Pinterest) et `legalLinks` (Mentions légales, Politique de confidentialité, CGU/CGV, Gestion des cookies) pointant vers leurs futurs slugs (affichage en modales prévu en phase ultérieure, spec §3.1).
- `src/app/layout.tsx` : import et placement de `<Footer />` en bas du `<body>`, après le `<main className="flex-1 pt-20">` (le `flex-1` maintient le Footer en bas de page sur les contenus courts).
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Créés : `src/components/layout/Footer.tsx`
- Modifiés : `src/lib/site.ts`, `src/app/layout.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.3** : création du Canvas central vierge reliant le Header et le Footer sur la Page d'Accueil (`/`).

---

## 2026-09-05 – 13:02 (heure locale America/Bogota)

### Tâche exécutée
**Phase 2 (Frame Global / Front-Office) – Étape 2.1 : création du composant `Header` fixe (glassmorphism nacré) et intégration dans le RootLayout**
- `src/lib/site.ts` (créé) : source unique et découplée de la config du site — `siteName` (TODO : à brancher sur les réglages du photographe), type `NavItem` et `mainNav` (Accueil, Portfolio, Prestations, À propos, Contact) pointant vers les futurs slugs (le Header reste fonctionnel en attendant la création des routes).
- `src/components/layout/Header.tsx` (créé) : Server Component statique (aucun `"use client"`) — glassmorphism nacré (`glass` + bordure basse perle `border-b border-[var(--border-color)]/60`), barre `fixed inset-x-0 top-0 z-50` (hauteur `h-16`), marque en Cormorant Garamond (`var(--font-heading)`) reliée à l'accueil, nav desktop `hidden md:flex` avec hover doux sur accent nacré (`hover:bg-accent/40`), CTA `Button` shadcn `variant="outline" size="sm" asChild` → `Link /login`. Props optionnelles `siteName` / `navItems` / `ctaLabel` (générique et réutilisable, prévu Footer Étape 2.2).
- `src/app/layout.tsx` : import de `<Header />`, placement en tête du `<body>` + compensation `pt-20` (5rem = `h-16` + 16px) sur le conteneur `<main className="flex-1 pt-20">` pour que le contenu défile sous la barre fixe sans être masqué.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur — routes statiques `/` et `/_not-found`).

### Fichiers créés ou modifiés
- Créés : `src/lib/site.ts`, `src/components/layout/Header.tsx`
- Modifiés : `src/app/layout.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.2** : création du composant `Footer` fixe (Réseaux sociaux, mentions légales, copyright).

---

## 2026-09-05 – 12:48 (heure locale America/Bogota)

### Tâche exécutée
**Phase 1 (Socle Technique) – Étape 1.3 : configuration des Design Tokens du thème « Éclat Minéral & Nacre » (`globals.css`) + injection des composants de base `shadcn/ui`**
- `src/app/globals.css` : remplacement du scaffold par les variables « produit » du thème (`--bg-color`, `--surface-color`, `--surface-color-soft`, `--text-color`, `--accent-color`, `--accent-color-strong`, `--border-color`, `--text-muted`) et typographies (`--font-body` / `--font-heading`) ; mapping sémantique `shadcn/ui` (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, radius) ; signature premium (ombre nacre `shadow-pearl` / `shadow-pearl-sm`, utility `glass` de glassmorphism, easing `ease-silk`) ; garde-fou `@media (prefers-reduced-motion: reduce)` ; mode sombre de secours.
- `src/app/layout.tsx` : duo typographique « Éditorial & Luxe » via `next/font` (Cormorant Garamond titres + Plus Jakarta Sans corps), `lang="fr"`, `metadata` mis à jour.
- Installation des dépendances `shadcn/ui` : `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-slot`, `@radix-ui/react-accordion`, `@radix-ui/react-dialog`.
- Création : `src/lib/utils.ts` (helper `cn`), `components.json` (config `shadcn/ui`) et des composants `src/components/ui/{button,input,accordion,dialog}.tsx`.
- Vérifications : `npx tsc --noEmit` OK ; `npm run build` OK (Next.js 16.3.4 / Turbopack, 0 erreur).

### Fichiers créés ou modifiés
- Modifiés : `src/app/globals.css`, `src/app/layout.tsx`, `package.json` & `package-lock.json` (dépendances shadcn/ui)
- Créés : `src/lib/utils.ts`, `components.json`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/accordion.tsx`, `src/components/ui/dialog.tsx`

### Prochaine étape prévue
**Validation utilisateur via `npm run dev`** puis **Phase 2 – Étape 2.1** : création du composant `Header` fixe (Nom du photographe, barre de navigation, bouton de connexion).

---

## 2026-09-05 – 12:35 (heure locale America/Bogota)

### Tâche exécutée
**Phase 1 (Socle Technique) – Finalisation : déplacement du scaffold Next.js de `tmp_scaffold/` vers la racine du workspace**
- Déplacement vers la racine de `src/` (App Router), `public/`, `node_modules/`, des fichiers de configuration et des fichiers racine du scaffold.
- Contournement d'un blocage Windows sur le renommage de dossiers hérités via `robocopy /MOVE` (copie fichier par fichier puis suppression source).
- Suppression des reliquats : `tmp_scaffold/.next` (cache régénéré), `tmp_scaffold/tsconfig.json` et `tmp_scaffold/README.md` (versions racine conservées), puis suppression du dossier temporaire `tmp_scaffold/`.
- Renommage du paquet `tmp_scaffold` → `saas-portfolio-photographe` (`package.json` + `package-lock.json`).
- Vérification d'intégrité : `npm run build` réussi et `npx tsc --noEmit` sans erreur (mode strict conservé).

### Fichiers créés ou modifiés
- Déplacés à la racine : `package.json`, `package-lock.json`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `src/` (`src/app/...`), `public/`, `node_modules/`
- Modifiés : `package.json` & `package-lock.json` (nom du paquet) ; `tsconfig.json` (config racine conservée, complétée par Next : `plugins.next`, includes `.next/types`)
- Supprimés : `tmp_scaffold/` (intégralement)

### Prochaine étape prévue
**ROADMAP – Étape 1.3 `[IN_PROGRESS]`** : configuration des Design Tokens du thème « Éclat Minéral » (fichier `globals.css` de l'application) et injection des composants de base `shadcn/ui` (Button, Input, Accordion, Dialog) dans `src/components/ui/`.

