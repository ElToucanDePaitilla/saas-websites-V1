# Contact — refonte visuelle à 4 conteneurs : cadres configurables, séparateurs, retrait « Informations pratiques »

**Objectif :** aligner le rendu public du module Contact sur le design à 4 conteneurs (chapeau, coordonnées, formulaire, réseaux), avec cadres **configurables par module** (épaisseur / couleur de thème / arrondi, défaut 2 px), séparateurs de sous-groupes, et nettoyer l'éditeur du back-office en retirant la rubrique « Informations pratiques » **sans supprimer son code**.

**Périmètre :** rendu public `src/components/modules/contact/*`, CSS `src/app/globals.css`, éditeur `ModuleContactEditor.tsx`, domaine `src/lib/pages.ts`, `/demo`. Aucune migration DB, aucun schéma, aucune route API.

> **État de départ (non commité) :** le lot précédent (14.1.b) a déjà livré nom en `<h2 class="module-h2">`, slogan en `<h3 class="contact-info__slogan">`, `gap-12` entre blocs, `<dt>` en 700. Ce plan part de cet état.

---

## Décisions (arbitrées avec l'utilisateur)

| # | Sujet | Décision |
|---|---|---|
| D1 | Stockage du cadre | **Par module**, dans `ContactStyleSettings` (JSONB `content.style.frame`). Aucune migration. Même modèle que `CardsStyleSettings.bodyRadius` / `bodyBorderWidth`. |
| D2 | Couleur de bordure | **Jeton de thème uniquement** : `border-color`, `accent-color`, `accent-color-strong`, `text-color`, `surface-color`. Pas de pipette, pas d'hex stocké. Suit le mode clair/sombre. |
| D3 | Défauts du cadre | `borderWidth: 1` (plage 0–8 ; **0 = sans cadre**), `borderColorToken: "border-color"`, `borderRadius: 2` (plage 0–24). |
| D4 | Structure C2 | Nom `h2.module-h2` + slogan `h3` conservés. Rubriques en `dt`/`dd` gras. **Séparateurs légers = bordures CSS** (`border-top`), pas de `<hr>`, pas de H3 de sous-groupe. |
| D5 | Chapeau | Le sous-titre **reste** un `<p class="contact-section__subtitle">` (pas de H3). |
| D6 | « Informations pratiques » | Retiré de l'éditeur **et** du rendu public, **code conservé** derrière un drapeau de domaine. Horaires / Zone d'intervention ne s'affichent plus dans le module Contact. |
| D7 | Cadres | Un **seul réglage** partagé par les conteneurs 2 et 3 (ils doivent « se faire écho »). Le formulaire est encadré même quand C2 est masqué. |
| D8 | Habillage des cartes | Bordure + padding uniquement, **aucun fond** (la surface nacrée de la page reste visible), conforme à la capture. |

---

## Tâches (ordonnées)

### 1. Domaine — `src/lib/pages.ts`

- **Types** (près de `ContactSocialStyle`, ~l. 4776) :
  ```ts
  export type ContactFrameColorToken =
    | "border-color" | "accent-color" | "accent-color-strong"
    | "text-color" | "surface-color";

  export interface ContactFrameSettings {
    /** 0 = pas de cadre. Borné 0..8 (domaine ET éditeur). */
    borderWidth: number;
    borderColorToken: ContactFrameColorToken;
    /** Arrondi des angles, en px (borné 0..24). */
    borderRadius: number;
  }
  ```
  Ajouter `frame: ContactFrameSettings` à `ContactStyleSettings`.
- **Catalogue d'éditeur** : `contactFrameColorTokenOrder: ContactFrameColorToken[]` et `contactFrameColorTokenLabels` (libellés descriptifs, dans l'esprit de `bannerThemeTokenLabels`). Ajouter `isContactFrameColorToken`.
- **Défauts** : `DEFAULT_CONTACT_FRAME` (`1`, `"border-color"`, `2`) ; l'inclure dans `createContactContent().style`.
- **Résolveur** : `resolveContactFrame(raw)` avec `readBoundedNumber` (0–8 / 0–24) et repli de jeton sur `DEFAULT_CONTACT_FRAME` ; l'appeler dans `resolveContactContent` → `style: { social: …, frame: resolveContactFrame(styleRaw.frame) }` (tolérant : contenu sans `frame` → défauts, pas de résurrection de texte).
- **Drapeau de préservation** (D6) — documenter le *pourquoi* : le sous-bloc « Informations pratiques » est retiré de la vue mais doit rester compilé et réutilisable. Exposer :
  ```ts
  /** `false` : la rubrique « Informations pratiques » (horaires, zone) est retirée
   *  de l'éditeur ET du rendu public, son code restant en place pour réemploi.
   *  Typé `boolean` explicitement pour éviter le narrowing d'un littéral `false`. */
  export const CONTACT_PRACTICAL_INFO_ENABLED: boolean = false;
  ```
  Ne **pas** supprimer `ContactInfoSettings.hours` / `.serviceArea`, `ContactVisibilitySettings.showHours` / `.showServiceArea`, leurs défauts ni leur résolution.
- **Aucun** autre type/catalogue modifié.

### 2. Rendu public — cadres

- Nouveau fichier `src/components/modules/contact/contactFrame.ts` :
  - type `CSSVars = CSSProperties & Record<\`--${string}\`, string>` (même idiome que `CardItem.tsx`) ;
  - `contactFrameCssVars(frame): CSSVars` → `"--contact-frame-border-width": \`${frame.borderWidth}px\``, `"--contact-frame-color": \`var(--${frame.borderColorToken})\``, `"--contact-frame-radius": \`${frame.borderRadius}px\``.
- `ContactInfoBlock.tsx` : la racine reste `contact-info grid gap-12`, on ajoute `contact-frame` et `style={contactFrameCssVars(info …)}` — le `frame` est passé en **prop** (le composant ne lit pas `content`). Mettre à jour le doc-comment : bordure posée en variables CSS, replis dans `globals.css`.
- `ContactModule.tsx` : envelopper `<ContactForm/>` dans `<div className="contact-frame contact-frame--form" style={contactFrameCssVars(content.style.frame)}>`. La grille C2/C3 (`lg:grid-cols-2` / `mx-auto max-w-2xl`) est inchangée ; quand C2 est masqué, le formulaire reste encadré et centré.
- `ContactInfoBlock.tsx` — retrait public « Informations pratiques » (D6) :
  - les deux entrées `<dl>` Horaires / Zone ne sont rendues que si `CONTACT_PRACTICAL_INFO_ENABLED` (drapeau de domaine) ;
  - **rendre le `<dl>` seulement s'il reste au moins une ligne** (téléphone/mobile/e-mail) : sinon un `<dl>` vide et un séparateur orphelin apparaîtraient quand seuls horaires/zone étaient renseignés ;
  - `hasVisibleContactInfo` : ne compter horaires/zone que si `CONTACT_PRACTICAL_INFO_ENABLED` ; le reste inchangé (`hasAddress`, `telHref`, logique de masquage).
- Le chapeau (C1) et les réseaux (C4) ne changent pas.

### 3. CSS — `src/app/globals.css`, section « MODULE « CONTACT » »

- Ajouter le cadre, à côté du commentaire `/* ---- Container 2 — coordonnées ---- */`, avec commentaire « pourquoi » (variables CSS, replis, 0 = sans cadre) :
  ```css
  .contact-frame {
    border: var(--contact-frame-border-width, 1px) solid
            var(--contact-frame-color, var(--border-color));
    border-radius: var(--contact-frame-radius, 2px);
    padding: 1.25rem;
  }
  @media (min-width: 640px) { .contact-frame { padding: 2rem; } }
  ```
- **Séparateurs de sous-groupes** (D4) : `.contact-info__address:not(:first-child), .contact-info__lines:not(:first-child) { border-top: 1px solid var(--border-color); }` — le `gap-12` (3 rem) fournit l'air, la règle marque la rupture ; pas de `padding-top` qui cumulerait.
- Ne pas toucher `.contact-info__name` (supprimée au lot précédent), `.contact-info__address` / `__preline`, `.contact-form`, ni `--h2-size` / `.module-h2` / `.module-h3`.

### 4. Éditeur — `src/components/backoffice/pages/modules/ModuleContactEditor.tsx`

- Nouvelle `EditorZone tone="style"` **« Cadres des conteneurs »** (après « Formulaire »), portée : « Ces réglages s'appliquent au bloc coordonnées ET au formulaire. » Contrôles :
  - `TextField type="number"` « Épaisseur du trait (px) » → `parseBounded(value, 0, 8)` existant, hint « 0 = sans cadre. » ;
  - `SelectField<ContactFrameColorToken>` « Couleur du trait » (options `contactFrameColorTokenOrder` / labels), hint « Couleur du thème : elle suit le mode clair/sombre. » ;
  - `TextField type="number"` « Arrondi des angles (px) » → `parseBounded(value, 0, 24)`, hint « 2 px par défaut. ».
  - `patch({ style: { ...style, frame: { ...style.frame, … } } })` (helper `patchFrameStyle`).
- Retirer la **vue** de `EditorSubZone title="Informations pratiques"` : la rendre sous `CONTACT_PRACTICAL_INFO_ENABLED ? … : null` (D6). Le JSX, les champs et les toggles restent **intacts** dans la source ; un seul booléen les réactive. Commenter la raison (réemploi prévu dans un autre module).
- Ne toucher à aucune autre zone.

### 5. `/demo` — `src/app/(front-office)/demo/page.tsx`

- `demoContactModule` : accepter un `frame?: Partial<ContactFrameSettings>` et le fusionner dans `style`.
- `contact-11` (complet) : cadre par défaut (1 px / border-color / 2 px).
- `contact-12` (C2 masqué) : cadre distinct (ex. `accent-color`, rayon 12) pour **prouver** que le réglage est bien porté par le module et qu'il s'applique au formulaire seul.

### 6. `CHANGELOG.md`

- Nouvelle entrée datée (format habituel : tâche, écarts assumés, mesures, fichiers) documentant : cadres configurables par module, séparateurs, retrait éditeur + rendu de « Informations pratiques » avec code conservé, et la **conséquence** : deux `h2` (chapeau + nom) déjà assumée, horaires/zone non éditables et non affichés dans ce module.

---

## Points de vigilance

- **Titrage** : inchangé — `PublicModulesList` garde le `h1` au premier Héro. `contact-11` doit rester `h2 = 2`, `h3 = 1`, page `h1 = 1`.
- **`hasVisibleContactInfo`** est consommé par `ContactModule` pour choisir la mise en page : le modifier sans exclure horaires/zone quand le drapeau est faux produirait un cadre quasi vide.
- **`<dl>` vide** : ne pas le rendre s'il ne contient plus de ligne (cf. §2).
- **Contenu existant** : avec `borderWidth: 1` par défaut, les pages déjà publiées gagnent un cadre après mise à jour (effet voulu de la refonte). Aucune donnée perdue : les champs horaires/zone restent en JSONB.
- **CSS hors `@layer`** : les utilitaires Tailwind (`gap-12`) ne collisionnent pas avec `.contact-frame` (rôles distincts).
- **Drapeau** : le typer `boolean` explicitement pour éviter un narrowing TS sur le littéral `false` et un éventuel avertissement lint.
- **Ne pas toucher** : formulaire (back-end, route `/api/contact`, upload, Turnstile), réseaux sociaux, DB/schéma, `site_visual_identity`, autres modules.

---

## Validation

- `npx tsc --noEmit` → 0 ; `npm run lint` → 0 erreur / 0 avertissement (le lint peut être long).
- `/demo` → 200. Dans la tranche `contact-11` :
  - `<h2` = 2, `<h3` = 1 ; page `<h1` = 1 ;
  - `contact-frame` apparaît **2×** (racine coordonnées + enveloppe formulaire) ; `contact-frame--form` 1× ;
  - variables inline présentes : `--contact-frame-border-width:1px`, `--contact-frame-color:var(--border-color)`, `--contact-frame-radius:2px` ;
  - « Horaires » et « Zone d’intervention » **absents** des deux sections contact.
- CSS compilé (extraire le `href` `.css` du HTML — un seul chunk — puis `Contains`) : `.contact-frame` porte `border-radius: var(--contact-frame-radius, 2px)` et `border: var(--contact-frame-border-width, 1px) solid var(--contact-frame-color, var(--border-color))` ; `.contact-info__address:not(:first-child)` et `.contact-info__lines:not(:first-child)` portent `border-top`.
- Éditeur (revue/`grep`) : `CONTACT_PRACTICAL_INFO_ENABLED` vaut `false` et garde le JSX `Informations pratiques` ; aucune sous-zone « Informations pratiques » rendue.
- Recette visuelle navigateur (non mesurable ici) : deux cartes encadrées, séparateurs entre Identité / Adresse / Coordonnées, réglages réactifs dans l'éditeur.

---

## Hors périmètre

- Réglage **global** de design system (table/store/API) : écarté (D1), le cadre est par module.
- Pipette hexadécimale (D2) : seuls les jetons de thème.
- Éditeur : les autres zones, le préremplissage, la persistance ; seuls l'ajout de la zone « Cadres » et le retrait de la vue « Informations pratiques ».
- Formulaire, anti-spam, pièces jointes, réseaux sociaux, base de données, `is_read`, titrage.

---

## Note pour l'exécution

Le plan modifie des **fichiers source** (`pages.ts`, `ContactInfoBlock.tsx`, `ContactModule.tsx`, `contactFrame.ts`, `globals.css`, `ModuleContactEditor.tsx`, `demo/page.tsx`, `CHANGELOG.md`) : basculer sur un agent d'implémentation pour les appliquer puis lancer la validation. Ne pas lancer `npm run build` si le serveur de développement occupe le port 3000 (`.next` partagé).
