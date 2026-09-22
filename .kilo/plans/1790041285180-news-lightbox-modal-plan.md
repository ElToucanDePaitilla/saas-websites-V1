# Module « Actualités & expositions » — zoom en modale (visionneuse) au lieu du zoom sur place

**Objectif :** remplacer le zoom sur place de `news` (cycle `1 → 1,5 → 2` contraint à la largeur de la carte) par une **modale plein écran** qui affiche l'affiche au maximum de la fenêtre, avec zoom et **déplacement à la souris (curseur main)**. Aucune régression sur le reste du module.

**Ce plan remplace :** la décision **D5** du plan `.kilo/plans/1790040385470-news-expositions-plan.md` (« zoom sur place ») et retire le premier point du **§10 hors périmètre** (« Lightbox / visionneuse plein écran »). Toutes les autres décisions du plan d'origine restent valides — en particulier D2/D3/D4 (ratio 2:3 et largeur dérivée de la fenêtre pour l'aperçu **dans la carte**), D6 (ordre manuel), D7 (↑/↓ + dupliquer + supprimer), D9 (fond du cadre par jeton du thème) et D11 (résolveur JSONB).

---

## Décisions actées

| # | Sujet | Décision |
|---|---|---|
| **M1** | Composant de vue | **Réutiliser `LightboxModal`** (`src/components/modules/gallery/LightboxModal.tsx`) plutôt que réécrire une visionneuse. Il fournit déjà : plein écran, `object-contain`, double-clic de zoom `fit → 1,5× → 2,5× → fit`, **déplacement au pointeur borné aux limites de l'image avec curseurs `grab`/`grabbing`**, `role="dialog"` + `aria-modal` + focus trap + Échap + verrouillage du scroll, restitution du focus, préchargement. Réutiliser, c'est ne pas dupliquer la logique de pointer-capture — exactement le risque identifié au §9 du plan d'origine. |
| **M2** | Portée de la vue | **Parcours de toutes les affiches de la section** : la modale reçoit la liste des items rendus (URL non vide), dans l'ordre d'affichage. On obtient gratuitement ‹ n / total ›, les flèches ←/→ et le préchargement. Conséquence : une **seule** modale par section, montée à l'ouverture. (Passer un tableau d'un seul élément donnerait le comportement « une affiche » sans autre changement.) |
| **M3** | Déclencheurs | **Double-clic sur l'affiche** (raccourci, comme aujourd'hui) **et bouton `.news-card__zoom`** (chemin clavier/lecteur d'écran, obligatoire : le double-clic n'est ni focalisable ni atteignable). Le bouton n'est plus un basculeur : il perd `aria-pressed` et devient « Agrandir l'image ». La carte n'est toujours **pas** cliquable en simple clic (règle conservée). |
| **M4** | Zoom sur place | **Supprimé.** `--news-zoom`, son `transform: scale()`, sa `transition` et sa règle `prefers-reduced-motion` disparaissent. `--news-poster-fit` et `aspect-ratio: 2 / 3` **restent** : l'aperçu dans la carte est inchangé (D2/D3). Il n'y a plus qu'**un seul** zoom, celui de la modale. |
| **M5** | Réglages | **Aucun nouveau réglage persisté** : les paramètres de la visionneuse sont une **constante figée** (`zoomEnabled: true`, `zoomLevel1: 1.5`, `zoomLevel2: 2.5`, `showExif: false`, `showCaption: true`). `NewsStyleSettings`, `resolveNewsContent`, l'éditeur et la démo **ne changent pas**. Exposer ces réglages à l'éditeur est hors périmètre. |
| **M6** | Habillage de la modale | On garde le chrome **sombre** de `LightboxModal` (`bg-black/95`, contrôles blancs) : c'est le langage visuel existant pour « regarder une image en grand », et le modifier toucherait aussi les galeries. La précision à retenir : **D9 ne s'applique qu'au cadre de la carte** ; la visionneuse est volontairement hors jetons du thème. |
| **M7** | État du zoom à l'ouverture | La modale s'ouvre en **« fit »** : l'affiche entière est visible, donc rien à déplacer. La **main n'apparaît qu'une fois zoomé** (comportement actuel de `LightboxModal` : `cursor: zoom > 0 ? grab/grabbing : zoom-in`, et `handlePointerDown` sort si `zoom === 0`) — c'est cohérent : on ne promène pas une image qui tient déjà à l'écran. Ouvrir directement zoomé est hors périmètre. |
| **M8** | Localisation du composant partagé | `LightboxModal` **reste** dans `gallery/` et est importé par `news/`. Son extraction vers un emplacement neutre (`src/components/common/`) est notée en suivi, pas faite ici (un seul point de consommation supplémentaire ne justifie pas le déplacement). |

---

## Architecture retenue (une seule frontière client)

```text
NewsModule (Server)                       ← chapeau rendu côté serveur
└── NewsLightbox (Client)                 ← NOUVEAU : possède l'index ouvert + monte LightboxModal
    └── div.news-list  (délégation d'événements : onClick / onDoubleClick)
        └── NewsCard (Server) × n         ← inchangé hors poster
            ├── span.news-card__badge (Server)
            ├── div.news-card__media  data-news-media={index}   ← double-clic
            │   ├── MediaImage (Server→client next/image)
            │   └── button.news-card__zoom  data-news-open={index}  ← clic + clavier
            └── div.news-card__body (Server) : h3, date, texte, CTAButton
    └── LightboxModal (Client, monté seulement à l'ouverture)
```

Pourquoi la **délégation d'événements** plutôt qu'un contexte React ou des cartes clientes : `NewsCard` et `NewsModule` restent des **Server Components** (aucune donnée interactive descendue dans la carte), un seul composant client est ajouté, et le bouton reste un vrai `<button>` serveur (focusable, donc accessible). `closest("[data-news-open]")` / `closest("[data-news-media]")` distinguent les deux affordances : un clic sur le CTA ou sur le texte ne prend pas `[data-news-open]` et n'ouvre donc rien.

Le container `.news-list` est porté par `NewsLightbox` : il rend `{children}` (les cartes serveur) et la modale. C'est le patron déjà utilisé par le projet pour « Client Component qui reçoit un arbre serveur » (`GalleryManager` reçoit sa grille, `RevealHero` reçoit son contenu).

---

## Tâches d'implémentation (ordre)

### 1. `src/components/modules/news/NewsLightbox.tsx` — nouveau (Client)

- `"use client"`.
- Props : `{ images: GalleryImage[]; title: string; children: React.ReactNode }`.
- `const NEWS_LIGHTBOX_SETTINGS: GalleryLightboxSettings = { zoomEnabled: true, zoomLevel1: 1.5, zoomLevel2: 2.5, showExif: false, showCaption: true };` — constante de module, commentée (« figée volontairement : la visionneuse n'est pas un réglage d'éditeur, M5 »).
- État : `const [openIndex, setOpenIndex] = React.useState<number | null>(null)`.
- Délégation :
  - `onClick` : `const el = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-news-open]") : null;` si `el` non nul, `setOpenIndex(Number(el.dataset.newsOpen))` (garder la valeur si `Number.isInteger` et dans les bornes de `images`).
  - `onDoubleClick` : même chose sur `[data-news-media]`.
- Rendu : `<div className="news-list" onClick={…} onDoubleClick={…}>{children}</div>` puis, si `openIndex !== null` et `images.length > 0` :
  ```tsx
  <LightboxModal
    open
    images={images}
    initialIndex={openIndex}
    settings={NEWS_LIGHTBOX_SETTINGS}
    title={title}
    restoreFocus
    onClose={() => setOpenIndex(null)}
  />
  ```
  Monter/démonter au lieu de piloter `open` : c'est le patron de `GalleryManager` (l. 165‑176), et il est **nécessaire** ici car `LightboxModal` capture `initialIndex` via `useState` au montage.
- Ne **pas** passer `exifByUrl` (aucune métadonnée EXIF collectée pour les affiches de démo ; `showExif: false` de toute façon).

### 2. `src/components/modules/news/NewsCard.tsx` — modifier

- Ajouter la prop `index: number`.
- Supprimer l'import et l'usage de `NewsPosterZoom` ; rendre le poster directement dans la carte (même balisage que l'actuel `NewsPosterZoom`, sans état ni gestionnaire) :
  ```tsx
  <div className="news-card__media select-none" data-news-media={index}>
    <MediaImage src={item.media.url} alt={…} fill sizes="min(42rem, 100vw)" quality={85} priority={priority} className="news-card__img" />
    <button type="button" className="news-card__zoom" data-news-open={index}
      title="Agrandir l’affiche" aria-label="Agrandir l’affiche">
      Agrandir
    </button>
  </div>
  ```
- `touch-action: manipulation` et `select-none` : **conservés** (le double-tap mobile ne doit pas déclencher le zoom du navigateur ; le `select-none` évite la sélection au double-clic). Voir la règle CSS correspondante.
- Le reste de la carte (badge, `h3`, date, texte, `CTAButton`) ne change pas.

### 3. `src/components/modules/news/NewsModule.tsx` — modifier

- Construire la liste des images **après** le filtre `media.url !== ""` (mêmes items que ceux rendus, donc index alignés) :
  ```ts
  const images: GalleryImage[] = items.map((item) => ({
    id: item.id, url: item.media.url,
    alt: item.media.alt || item.title || "Affiche de l’actualité",
    title: item.title, description: item.text,
  }));
  ```
- Envelopper la liste : `<NewsLightbox images={images} title={content.heading}>{…cartes…}</NewsLightbox>` (le `title` alimente le préfixe du compteur et le `aria-label` de la modale).
- Passer `index` à `<NewsCard>` (`items.map((item, index) => …)`) — c'est un index **positionnel** (celui du tableau filtré), pas l'`id`, pour que la délégation soit triviale.
- Supprimer `priority` de `NewsCard` ? **Non** : `priority={index === 0}` reste (LCP de la première carte).

### 4. `src/components/modules/news/NewsPosterZoom.tsx` — supprimer

Plus aucun consommateur après 2 et 3. Le fichier disparaît (son rôle est absorbé par `NewsCard` + `NewsLightbox`).

### 5. `src/app/globals.css` — modifier le bloc § MODULE « NEWS »

- Dans `.news-card__img` : **supprimer** `transform: scale(var(--news-zoom, 1))`, `transform-origin` et `transition`. **Conserver** `width`, `height`, `object-fit: var(--news-poster-fit, cover)`.
- **Supprimer** le bloc `@media (prefers-reduced-motion: reduce) { .news-card__img { transition: none; } }` devenu sans objet.
- Dans `.news-card__media` : **conserver** `position/overflow/aspect-ratio/touch-action` et le commentaire sur le double-tap ; adapter le commentaire pour dire que le double-clic **ouvre la visionneuse** (et non « zoome sur place »).
- `.news-card__zoom` : mêmes styles ; ajuster le commentaire (bouton d'ouverture, plus basculeur). Le libellé court affiché est « Agrandir ».
- Retirer `--news-zoom` de partout (aucune autre occurrence attendue).

### 6. `src/components/modules/gallery/LightboxModal.tsx` — micro-correctif (recommandé)

- Ajouter `motion-reduce:transition-none` à la classe du bloc transformé (l. 509‑510) : neutralise la transition de zoom/déplacement quand `prefers-reduced-motion` est actif, conformément à la directive du projet (« neutraliser la transition, pas l'action »). Cette classe ne change rien pour les galeries hors `prefers-reduced-motion` ; elle comble un manque existant.
- **Aucun autre changement** : surtout pas le chrome ni la sémantique (`role="dialog"` est déjà correct ; la pop-up utilise Radix sans `Portal` pour rester dans le thème, mais `LightboxModal` est un `div` `fixed`, donc déjà hors `Portal`).

### 7. `CHANGELOG.md` — entrée

- Nouvelle section datée (heure locale America/Bogota) : tâche, décisions M1–M8, mesures (`tsc`, `lint`), recette `/demo` (voir §Validation), fichiers modifiés, prochaine étape.
- Mentionner explicitement que ce lot **révise D5 et §10** du plan `1790040385470-news-expositions-plan.md`.

### 8. Plan d'origine — mise à jour (optionnelle, mais recommandée)

Ajouter au plan `1790040385470-news-expositions-plan.md` une ligne « Révisé par le plan `1790041285180-news-lightbox-modal-plan.md` : D5 remplacé, §10 lightbox retiré du hors-périmètre ». Évite qu'une prochaine lecture prenne D5 pour la vérité.

---

## Validation

Automatique :
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur / 0 avertissement**.
- `npm run check:contrast` → **non requis** (aucun jeton de couleur ajouté ou modifié).
- **Ne pas lancer `npm run build` si `next dev` occupe le port 3000** (piège déjà documenté).

Recette `/demo` (`id="news-18"`), par assertions sur le HTML puis à la main dans le navigateur :
- La tranche contient toujours **4** cartes, 4 `h3`, 4 textes, 3 dates, 2 pastilles de chaque nature, aucun `h1` (non-régression des assertions existantes).
- Chaque carte expose `[data-news-media]` et un `button[data-news-open]` avec le **même index** ; l'ordre des index suit l'ordre du contenu (non trié).
- Dans le DOM servi : **plus aucune occurrence de `--news-zoom`** ; `.news-card__img` ne porte plus de `transform`.
- Aucun `role="dialog"` dans le HTML initial (la modale n'est montée qu'à l'ouverture).

Recette navigateur (non mesurable en ligne de commande) :
- Clic sur « Agrandir » → modale `role="dialog"`, `aria-modal`, compteur « ‹n› / 4 », affiche en `object-contain` **nettement plus large que la carte** ; Échap ferme et **le focus revient sur le bouton**.
- Double-clic sur l'affiche → même modale, au bon index.
- Dans la modale : double-clic → l'affiche passe à 1,5× puis 2,5× ; **le curseur devient une main** et le clic maintenu déplace l'image, **bornée** (on ne perd pas l'image hors cadre) ; le déplacement ne scrolle pas la page.
- Flèches ←/→ changent d'affiche et **réinitialisent** zoom et déplacement ; le titre et le texte de l'item s'affichent dans le pied ; **aucune puce EXIF**.
- Le scroll de la page est verrouillé pendant l'ouverture et restauré à la fermeture.
- Mobile : le double-tap sur l'affiche ne déclenche **pas** le zoom du navigateur (règle `touch-action: manipulation` conservée) ; le bouton reste utilisable.
- `prefers-reduced-motion: reduce` : plus de transition d'image dans la modale (aucune transition sur `.news-card__img` de toute façon).
- Non-régression galeries : ouvrir une Lightbox de Gallery Dynamic → comportement inchangé (le micro-correctif M/§6 est additif).

---

## Risques et pièges

- **Double-clic ≠ double ouverture.** Le double-clic sur `.news-card__media` produit aussi deux `click`, mais le média n'est **pas** `[data-news-open]` : seul le bouton l'est. Ne pas fusionner les deux attributs sur un même élément, sinon un simple clic ouvrirait la modale et la demi-seconde de double-clic deviendrait un artefact.
- **Garde anti-clic résiduel.** `LightboxModal` ignore les clics d'arrière-plan dans les 300 ms suivant l'ouverture (`openedAtRef`) : c'est ce qui évite que le second clic d'un double-clic referme la modale aussitôt. Ne pas retirer cette garde.
- **Index alignés.** La liste d'images **doit** être construite après le filtre `media.url !== ""` et avec le même `map`, sinon `data-news-open` désigne la mauvaise affiche.
- **`initialIndex` capturé au montage.** Si l'on montait la modale en permanence avec `open={false}`, l'index ne suivrait pas. La monter/démonter (patron `GalleryManager`) est la condition de bon fonctionnement.
- **Délégation typée.** `event.target` n'est pas un `Element` en toute généralité : garder `instanceof Element` avant `closest`, sinon erreur d'exécution sur un nœud texte.
- **`prefers-reduced-motion`** : le zoom reste une action explicite ; on neutralise la transition, jamais l'action (même arbitrage que le plan d'origine).
- **Chrome non thématisé (M6)** : c'est un choix, pas un oubli. Ne pas « corriger » `bg-black/95` en jeton du thème sans traiter les galeries.
- **Aucun réglage persisté (M5)** : ne pas ajouter `lightbox` à `NewsStyleSettings` « tant qu'on y est » — cela rouvrirait le domaine, l'éditeur, la démo et la recette.
- **`MediaImage`** n'expose pas `style` : ne pas tenter de porter le zoom de la modale par ce composant ; la modale transforme son propre conteneur (c'est déjà son fonctionnement).

---

## Hors périmètre

- Réglages de la visionneuse dans l'éditeur (niveaux de zoom, EXIF, légende) et tout champ ajouté à `NewsStyleSettings`.
- Vue « une seule affiche » sans navigation ‹ n / total › (réversible en passant un tableau d'un élément).
- Ouverture de la modale **déjà zoomée** pour pouvoir déplacer immédiatement.
- Chrome de la visionneuse aux jetons du thème (M6) et extraction de `LightboxModal` hors de `gallery/` (M8).
- Simple clic sur la carte pour ouvrir la modale (la carte reste non cliquable) ; badge, EXIF et partage social dans la modale.
- Toute autre famille de modules : `LightboxModal` n'évolue que par le micro-correctif `motion-reduce`.

---

## Points laissés en recette (assumés)

- Libellé et emplacement du bouton d'ouverture (« Agrandir », coin bas-droit de l'affiche) : à juger à l'œil ; une icône `Maximize2` est une option si le texte seul se lit mal sur une photo chargée.
- Niveau de zoom maximal (2,5× par défaut de la galerie) : suffisant pour lire un cartel, à confirmer sur une affiche dense.
- Pertinence d'un simple clic sur l'affiche pour ouvrir la modale (plus découvrable sur mobile) — écarté ici pour préserver la règle « la carte n'est pas cliquable », à rouvrir si la recette le justifie.
