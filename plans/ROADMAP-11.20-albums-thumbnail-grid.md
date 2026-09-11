# ROADMAP — Étape 11.20 : Gestion des albums du Portfolio par grille de vignettes

> **Statut** : PLANIFIÉ — en attente de validation
> **Périmètre** : Back-Office (`AlbumManagerPanel` et ses composants) + filtrage public des albums masqués.
> **Dépendance nouvelle** : aucune (`@hello-pangea/dnd` est déjà installé et utilisé).
> **Aucune migration BDD** : le seul champ ajouté (`hidden`) est **optionnel**.

---

## 0. Contexte

### 0.1 Le problème actuel

Chaque album est rendu **intégralement déplié, en permanence**
([`AlbumManagerPanel.tsx:193`](../src/components/backoffice/pages/modules/gallery/AlbumManagerPanel.tsx)) :
nom, photo de couverture, description, **puis tout le `GalleryImagesPanel`** (panneau d'import,
bouton d'ajout, grille de vignettes, dialogue d'édition).

**La hauteur du panneau est donc proportionnelle à (nombre d'albums × nombre de photos).** Trente
albums de vingt photos représentent six cents vignettes montées dans le DOM. Le constat d'usage est
exact : la liste devient vite ingérable, et la création de plusieurs dizaines d'albums — cas annoncé
comme fréquent — est impraticable.

### 0.2 La solution retenue : une grille de vignettes, une par album

Proposition validée par le propriétaire du produit : la section Albums devient une **succession de
vignettes** (une par album) affichant la couverture et le nom, avec des **actions CRUD au survol**
— masquer, éditer, supprimer — et un **réordonnancement par glisser-déposer**.

Pourquoi cette forme est supérieure à une liste de lignes repliables (première piste étudiée) :

1. **Fidélité au rendu public.** Le Portfolio s'affiche comme une grille de couvertures ; le
   back-office montre donc **ce que verra le visiteur**, sans traduction mentale.
2. **Elle sort le formulaire de l'album hors de la liste**, ce qui règle les deux problèmes d'un
   coup : plus de hauteur proportionnelle au contenu, et un album s'édite **en pleine largeur**.
3. **Le motif existe déjà dans l'application.** [`GalleryImagesPanel.tsx:211`](../src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx)
   affiche une grille de vignettes avec actions au survol (œil / crayon / poubelle) et
   glisser-déposer pour réordonner. La proposition décrit **ce composant, transposé aux albums** :
   il y a une symétrie à rétablir entre « une galerie gère ses photos » et « la galerie portfolio
   gère ses albums ».
4. **Elle ajoute une fonctionnalité attendue** : masquer un album (cf. §2).

### 0.3 Les quatre ajustements retenus

| # | Ajustement | Motif |
|---|---|---|
| **A-1** | « Masquer un album » exige un **nouveau champ persisté** `hidden` (absent du modèle) | Sans lui, la fonctionnalité est impossible ; trois points de branchement sont à traiter (§2) |
| **A-2** | Le formulaire d'album reprend les réglages **propres à l'album**, **pas** ceux de la galerie | Disposition, effets, ombre, bordure, CTA, badge et diaporama appartiennent à la **galerie entière** ; les dupliquer par album multiplierait les réglages et créerait des contradictions |
| **A-3** | L'édition d'un album se fait **en place**, sans nouvelle route | Une route imbriquée imposerait de réhydrater le store client et de gérer l'état d'accordéon, pour un gain nul |
| **A-4** | Le glisser-déposer doit avoir un **repli accessible** | Le DnD est inaccessible au clavier et techniquement incertain sur une grille qui s'enroule (§5) |

---

## 1. Inventaire de l'existant

| Élément | État | Conséquence pour ce chantier |
|---|---|---|
| [`GalleryAlbum`](../src/lib/pages.ts:1389) | `id`, `label`, `description`, `coverImageId`, `images` | **Pas de `hidden`** → lot A |
| [`createGalleryAlbum()`](../src/lib/pages.ts:1889) | Crée un album vide | À compléter avec `hidden: false` |
| `readGalleryAlbum` (normalisation JSONB) | Lit `label`, `description`, `coverImageId`, `images` | À compléter (repli `false`) |
| [`galleryAlbumSchema`](../src/lib/schemas/persistence.ts) | Schéma zod de l'album | `hidden` **optionnel** → aucune migration |
| [`galleryAlbumCover()`](../src/lib/pages.ts:1990) | Couverture : image désignée, sinon première disponible | Réutilisé par la vignette du back-office |
| [`galleryAlbumPhotoCount()`](../src/lib/pages.ts:2005) | Compte les photos visibles (URL non vide, non masquées) | Réutilisé pour l'indicateur de la vignette |
| [`galleryImageSources()`](../src/lib/pages.ts:1981) | Images « visibles » d'un contenu galerie — **point unique** alimentant le SEO/OG | À étendre au filtrage des albums masqués |
| [`GalleryManager`](../src/components/modules/gallery/GalleryManager.tsx:71) | Branche portfolio : ignore déjà une couverture absente ou masquée | Point d'insertion du filtre `album.hidden` |
| **Comportement existant à préserver** | Un album **sans photo de couverture n'apparaît pas** sur le site | Le back-office doit le **signaler explicitement** (§3.2) |

---

## 2. Lot A — Champ `hidden` sur l'album

### 2.1 Modèle et normalisation

- [`GalleryAlbum`](../src/lib/pages.ts:1389) : ajouter `hidden: boolean`.
- [`createGalleryAlbum()`](../src/lib/pages.ts:1889) : `hidden: false`.
- `readGalleryAlbum` : `hidden: record.hidden === true` — repli sur `false`, donc **les albums
  enregistrés avant ce lot restent visibles** (même technique que `badge.display` en 11.16).
- [`galleryAlbumSchema`](../src/lib/schemas/persistence.ts) : `hidden: z.boolean().optional()`.

### 2.2 Branchements publics — trois points, pas un de plus

1. **Grille portfolio** ([`GalleryManager.tsx:74`](../src/components/modules/gallery/GalleryManager.tsx)) :
   ignorer un album `hidden` avant même de chercher sa couverture.
2. **SEO / Open Graph** ([`galleryImageSources()`](../src/lib/pages.ts:1981)) : exclure les images des
   albums masqués — sinon les photos d'un album retiré continueraient d'apparaître dans les
   métadonnées de partage. *À vérifier pendant l'implémentation : la fonction est documentée comme
   retournant les images « visibles » ; si elle filtre déjà les images masquées, seule la condition
   sur l'album est à ajouter.*
3. **Vérification d'absence d'autres consommateurs** : rechercher tout autre usage de
   `content.albums` côté public avant de conclure.

### 2.3 Critères d'acceptation (Lot A)

- [ ] Un album existant (sans champ `hidden` en base) reste **affiché** après le lot.
- [ ] Masquer un album le retire de la grille publique **et** des métadonnées de partage.
- [ ] Le masquage n'affecte ni les autres albums, ni le CTA, ni le diaporama.
- [ ] `tsc` / `eslint` / `build` verts.

---

## 3. Lot B — Grille de vignettes d'albums

### 3.1 Anatomie d'une vignette

```
┌─────────────────────────┐
│                         │   ← couverture (MediaImage, lazy, ratio stable)
│       couverture        │
│  ①                  👁 ✎ 🗑 │   ← n° d'ordre en haut à gauche ; actions en bas à droite
├─────────────────────────┤
│ Mariage                 │   ← nom (ou « à nommer »)
│ 24 photos               │   ← compte de photos visibles
└─────────────────────────┘
```

- **Couverture** : `galleryAlbumCover(album)` via `MediaImage` (lazy, `sizes` adaptés). Album sans
  photo → **cellule en pointillés** avec la mention « Aucune photo — invisible sur le site ». Ce
  signalement est important : le comportement public actuel (album sans couverture = absent) est
  aujourd'hui **invisible** dans le back-office, ce qui laisse croire à un bug.
- **Numéro d'ordre** affiché (①②③…). Dans une grille, l'ordre de lecture est moins évident qu'en
  liste verticale : le numéro lève l'ambiguïté et rend le réordonnancement vérifiable.
- **Actions** : œil (masquer/afficher), crayon (ouvrir la vue album), poubelle (supprimer **avec
  confirmation**, comme le fait déjà `ModuleRow`). Révélées au survol **et au focus clavier**
  (`group-focus-within`), pour ne pas être inaccessibles au clavier.
- **Badge « Masqué »** visible en permanence sur une vignette masquée (jamais seulement au survol :
  le masquage doit être lisible d'un coup d'œil).

### 3.2 Tuile « ＋ Nouvel album »

**Première cellule de la grille**, pas un bouton séparé en tête ou en pied : c'est le motif des
applications photos, et il rend inutile de « remonter » ou de « descendre » pour ajouter — ce qui
répond mieux à la demande initiale qu'un bouton dupliqué.

Comportement après création : **créer, ouvrir aussitôt la vue album et y amener le focus**, afin
d'enchaîner naturellement le nommage et l'import. (Aujourd'hui `addAlbum` ajoute en fin de liste sans
rien montrer : l'album naît hors de l'écran.)

### 3.3 État vide

La tuile seule, centrée, avec la phrase déjà présente : « Chaque dossier importé devient un album. »

### 3.4 Découpage technique

| Fichier | Rôle |
|---|---|
| `gallery/AlbumGrid.tsx` (nouveau) | Grille, tuile d'ajout, état vide, gestion de l'ordre et de l'édition |
| `gallery/AlbumThumbnail.tsx` (nouveau) | Une vignette : couverture, nom, compte, actions, badge « Masqué » |
| `AlbumManagerPanel.tsx` | Ne conserve que la composition : phrase de portée, bloc « Affichage sur les couvertures », puis la grille |

Le bloc **« Affichage sur les couvertures »** reste **au-dessus** de la grille, inchangé : c'est un
réglage **global à toutes les couvertures**, sa phrase de portée le dit déjà explicitement.

### 3.5 Critères d'acceptation (Lot B)

- [ ] Une vignette par album, avec couverture, nom, nombre de photos et numéro d'ordre.
- [ ] Les actions sont atteignables **au clavier**, pas seulement à la souris.
- [ ] Un album masqué est signalé sans avoir à le survoler.
- [ ] Un album sans photo est signalé comme invisible sur le site.
- [ ] Ajouter un album ouvre sa vue et y place le focus.
- [ ] La grille reste lisible avec **30 albums** (objectif de recette explicite).

---

## 4. Lot C — Vue d'album, en place

### 4.1 Structure

Remplacement de la grille par le formulaire de l'album, **dans la même zone**, avec :

- un lien de retour **« ← Tous les albums »** ;
- **Nom de l'album** (champ texte) ;
- **Description** (zone de texte) ;
- **Photo de couverture** (sélecteur, options = photos visibles de l'album) ;
- **Photos de l'album** : réutilisation **telle quelle** de
  [`GalleryImagesPanel`](../src/components/backoffice/pages/modules/gallery/GalleryImagesPanel.tsx)
  — import multiple, import par dossier, glisser-déposer, œil, édition par photo.

### 4.2 Ce que l'album ne porte PAS (décision A-2)

Disposition, effets de finition, ombre, bordure, badge de couverture, diaporama et CTA **restent des
réglages de la galerie**, réglés une fois dans leurs zones respectives. Un album n'en porte aucun.

Justification : ce sont des choix de **présentation d'ensemble** ; les dupliquer par album
conduirait à trente jeux de réglages et à des combinaisons incohérentes (album 1 en Polaroid, album 2
sous verre). L'album est une **unité de contenu**, pas une galerie.

### 4.3 État et garde-fous

- État local `editingAlbumId` dans `AlbumGrid` — **aucune route, aucune persistance**.
- Si l'album édité est supprimé (ou devient introuvable), **revenir automatiquement à la grille** :
  jamais d'écran vide.
- La sortie de la vue album ne perd rien : chaque frappe persiste instantanément (modèle existant).

### 4.4 Critères d'acceptation (Lot C)

- [ ] Éditer puis revenir à la grille conserve toutes les modifications.
- [ ] Supprimer l'album en cours d'édition ramène à la grille sans erreur.
- [ ] Les réglages de galerie (disposition, effets, CTA, badge, diaporama) sont **inchangés** par ce lot.

---

## 5. Lot D — Glisser-déposer sur la grille

### 5.1 Prototype d'abord (obligatoire)

`@hello-pangea/dnd` est éprouvé dans ce projet pour une **liste verticale simple**
([`ModuleDndList.tsx:92`](../src/components/backoffice/pages/ModuleDndList.tsx)). Une grille
qui **s'enroule** est un cas beaucoup moins confortable : en franchissant une ligne, la disposition
change sous le curseur et l'animation du placeholder saute.

**Un prototype d'une heure précède l'engagement**, avec un critère de succès mesurable :

> Déplacer une vignette de la première à la dernière position d'une grille de 24 albums (3 lignes de
> 8) sans que la grille saute, sans perte de position intermédiaire, et avec un retour arrière
> possible (Échap).

**Si le prototype échoue**, plan de repli assumé et documenté : conserver les ↑/↓ **et** ajouter une
action « Déplacer à la position… » (saisie du numéro) — moins agréable, mais fiable et accessible.

### 5.2 Accessibilité (décision A-4)

Le glisser-déposer est **inaccessible au clavier** et doit rester une **commodité**, pas le seul moyen
de réordonner. Conserver en parallèle un déplacement non glissé. Le projet soigne cette dimension
partout ailleurs (chaque action de la grille de photos porte un `aria-label` explicite) : régresser
ici serait incohérent.

### 5.3 Critères d'acceptation (Lot D)

- [ ] Réordonner par glisser-déposer modifie **l'ordre public** de la grille.
- [ ] Le numéro d'ordre se met à jour immédiatement après un déplacement.
- [ ] Un moyen de réordonner **sans glisser** existe et est accessible au clavier.
- [ ] Une annulation (Échap) restitue l'ordre d'origine.

---

## 6. Lot E — Import groupé : un dossier de sous-dossiers = N albums

**Lot indépendant des précédents**, et le plus rentable en temps gagné par le photographe : la
grille rend la **gestion** confortable, pas la **création**. Créer trente albums à la main reste
trente fois le même geste.

[`ImportMediaPanel`](../src/components/backoffice/pages/modules/gallery/ImportMediaPanel.tsx:16)
sait déjà importer **un dossier complet** (`webkitdirectory`). Un seul cran à monter :

> **Choisir un dossier parent → chaque sous-dossier devient un album.**

Le navigateur expose le chemin relatif de chaque fichier (`webkitRelativePath`) : `Mariage/IMG_001.jpg`
désigne sans ambiguïté l'album « Mariage ». Un geste crée donc N albums, chacun avec ses photos, sa
couverture (première photo) et son compte déjà justes.

### 6.1 Cas limites à traiter

| Cas | Comportement retenu |
|---|---|
| Photos **à la racine** du dossier choisi | Regroupées dans un album au nom du dossier parent |
| Sous-dossier **sans image exploitable** | Ignoré (aucun album vide créé) |
| Fichiers refusés (MIME, > 15 Mo) | Comptabilisés dans la synthèse existante, par dossier si possible |
| Volume important | Rappel du lot conseillé (`RECOMMENDED_BATCH = 50`) et **confirmation** avant création massive |
| Album de même nom déjà présent | **Créer un nouvel album** (comportement prévisible ; pas de fusion silencieuse) |

### 6.2 Critères d'acceptation (Lot E)

- [ ] Un dossier contenant 3 sous-dossiers d'images crée 3 albums nommés d'après les dossiers.
- [ ] Chaque album reçoit ses photos et une couverture cohérente.
- [ ] Aucun album vide n'est créé pour un sous-dossier sans image.
- [ ] L'import du dossier **simple** (sans sous-dossier) conserve son comportement actuel.

---

## 7. Décisions d'architecture

- **D-1 — La vignette est le mode de liste.** Une grille, pas une liste de lignes.
- **D-2 — `hidden` est optionnel** (`z.boolean().optional()`, repli `false`) : aucune migration.
- **D-3 — Un album ne porte pas les réglages de présentation de la galerie** (disposition, effets,
  ombre, bordure, badge, diaporama, CTA). L'album est une unité de contenu.
- **D-4 — L'édition d'un album se fait en place**, sans route ni persistance supplémentaire.
- **D-5 — Le glisser-déposer n'est jamais le seul moyen de réordonner.**
- **D-6 — Le numéro d'ordre est toujours affiché**, la grille n'ayant pas d'axe de lecture évident.
- **D-7 — Un album invisible sur le site (sans photo, ou masqué) doit être signalé dans le
  back-office.** Aucune différence silencieuse entre ce que le photographe voit et ce que voit le
  visiteur.
- **D-8 — Aucune dépendance nouvelle.**
- **D-9 — Réutilisation de `GalleryImagesPanel`** pour les photos d'album : même outil que les
  variantes static et dynamic, ce qui réalise la symétrie demandée à coût quasi nul.

---

## 8. Hors périmètre (assumé)

- **Limitation d'affichage dans un album volumineux.** Un album de 300 photos affichera toujours 300
  vignettes ; la pleine largeur de la vue album rend cela bien plus supportable qu'aujourd'hui, mais
  un plafond (« voir les 276 autres ») reste à décider si les albums sont volumineux en pratique.
- **Duplication d'un album** (copier nom, description, couverture) : utile pour créer des séries,
  mais non demandé — à évaluer après la recette du lot E, qui couvre déjà le besoin de création en
  masse.
- **Filtre/recherche d'album** : la grille le rend beaucoup moins nécessaire qu'une liste ; à
  réévaluer seulement si la recette montre une gêne à partir de ~40 albums.
- **Réordonnancement de couverture** (choisir la photo n° 1 par glisser) : déjà couvert par le
  sélecteur de couverture du lot C.

---

## 9. Séquencement

| Ordre | Lot | Dépendance | Effet |
|---|---|---|---|
| 1 | **A — `hidden`** | — | Fonctionnalité demandée, prérequis du lot B |
| 2 | **B — Grille de vignettes** | A | Remplace réellement le panneau actuel |
| 3 | **C — Vue d'album** | B | Sort le formulaire de la liste |
| 4 | **D — Glisser-déposer** | B, prototype validé | Réordonner sans 29 clics |
| 5 | **E — Import groupé** | — (indépendant) | Le plus gros gain de temps |

Chaque lot est **livrable et recettable séparément** : si un lot doit être reporté, les précédents
tiennent debout.

---

## 10. Validation

Par lot, avant passage au suivant :

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Contrôles manuels :

1. **Volumétrie** — créer 30 albums et vérifier que la grille reste parcourable sans défilement
   excessif (objectif de recette, pas une impression).
2. **Cohérence public / back-office** — masquer un album : il disparaît du site ; le signaler
   « Masqué » dans la grille ; vérifier qu'il ne réapparaît pas dans les métadonnées de partage.
3. **Album sans photo** — la vignette le signale ; il est bien absent du site.
4. **Clavier** — atteindre les actions d'une vignette sans souris ; réordonner sans glisser.
5. **Non-régression** — variantes `static` et `dynamic` inchangées ; CTA, badge, diaporama et
   disposition de la galerie inchangés.
6. **Données existantes** — un contenu Portfolio enregistré avant ce chantier s'affiche à
   l'identique.

---

## 11. Suivi documentaire

- Mettre à jour [`ROADMAP.md`](../ROADMAP.md) (Étape 11.20) et [`CHANGELOG.md`](../CHANGELOG.md).
- Consigner dans le CHANGELOG : l'ajout du champ `hidden` (optionnel, sans migration), la nouvelle
  organisation du panneau, et le résultat du **prototype de glisser-déposer** — y compris en cas
  d'échec, avec le repli retenu.
