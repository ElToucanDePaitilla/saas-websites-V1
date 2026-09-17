# Contact — hiérarchie Nom/Slogan, espacement des blocs, libellés en gras

**Objectif :** dans le **rendu public** du module Contact (container 2, coordonnées), donner une vraie hiérarchie d'identité (Nom en H2, Slogan en H3), doubler l'espace entre les blocs d'information et renforcer les intitulés affichés.

**Périmètre :** rendu public uniquement (`src/components/modules/contact/ContactInfoBlock.tsx` + son CSS). L'éditeur back-office n'est pas touché.

---

## Décisions

| # | Sujet | Décision |
|---|---|---|
| D1 | Nom | `<p class="contact-info__name">` → `<h2 class="module-h2">` : échelle H2 du site (2,34 rem ; 2,81 rem ≥ 640 px ; poids 300). |
| D2 | Slogan | `<p class="contact-info__slogan">` → `<h3 class="contact-info__slogan">`, à **l'échelle actuelle du nom** : `clamp(1.25rem, 1.05rem + 0.8vw, var(--h3-size))`, interligne 1,3, police heading, couleur `--text-muted`. |
| D3 | Espacement blocs | `1,5 rem → 3 rem` entre Identité / Adresse / Coordonnées (le `gap-6` devient `gap-12`). |
| D4 | Espacement lignes | `0,75 rem → 1,5 rem` entre les lignes de coordonnées (Téléphone, Mobile, E-mail, Horaires, Zone d'intervention). |
| D5 | Libellés en gras | `<dt>` (Téléphone, Mobile, E-mail, Horaires, Zone d'intervention) : `font-weight: 600 → 700`. |
| D6 | Identité | Nom + Slogan regroupés dans un conteneur `grid gap-1` : c'est un bloc, et sa marge interne ne dépend plus d'un `margin-top` négatif. |

---

## Tâches (ordonnées)

1. **`src/components/modules/contact/ContactInfoBlock.tsx`**
   - Nom : remplacer `<p className="contact-info__name">{info.name}</p>` par `<h2 className="module-h2">{info.name}</h2>` (même condition `showName` + non vide).
   - Slogan : `<p>` → `<h3 className="contact-info__slogan">` (même condition `showSlogan` + non vide).
   - Envelopper nom + slogan dans `<div className="grid gap-1">`, rendu **seulement** si l'un des deux est visible et non vide. Le conteneur racine reste `contact-info grid gap-12`.
   - Mettre à jour le doc-comment d'en-tête : il affirme aujourd'hui « aucun niveau de titre ici ». Nouvelle règle à écrire : le **chapeau** porte le H2/H3 de la section ; le bloc **Identité** porte son propre H2 (nom) et H3 (slogan) — conséquence assumée : deux H2 dans la section quand le chapeau et le nom sont tous deux remplis.
   - `hasVisibleContactInfo` et la logique de masquage : **inchangées**.

2. **`src/app/globals.css` — section « MODULE « CONTACT » »**
   - Supprimer la règle `.contact-info__name` (remplacée par `.module-h2`).
   - `.contact-info__slogan` : ajouter `font-family: var(--font-heading)`, porter `font-size` au `clamp(1.25rem, 1.05rem + 0.8vw, var(--h3-size))` et `line-height: 1.3`, supprimer `margin-top: -0.75rem` ; conserver `color: var(--text-muted)`.
   - `.contact-info__lines` : `gap: 0.75rem → 1.5rem`.
   - `.contact-info__lines dt` : `font-weight: 600 → 700` (le reste — taille, capitales, interlettrage, couleur — inchangé).
   - Commenter le *pourquoi* (la convention du fichier) : les deux espacements doublés séparent les blocs d'information ; le négatif disparaît au profit du conteneur Identité.

3. **`CHANGELOG.md`** — nouvelle entrée datée (format habituel) : hiérarchie Nom H2 / Slogan H3, espacements doublés (1,5 → 3 rem et 0,75 → 1,5 rem), `<dt>` en 700, et la conséquence « deux H2 quand chapeau + nom sont remplis ».

---

## Points de vigilance

- **Titrage** : `PublicModulesList` n'attribue le `h1` qu'au premier Héro — inchangé. La section peut désormais contenir **deux H2** (chapeau + nom) et un H3 (slogan). C'est conforme à l'invariant (« un seul h1 »), mais l'assertion de recette « h2 = 1 par section contact » devient fausse et doit être mise à jour.
- **Ordre DOM** : chapeau → colonne C2 (h2 nom, h3 slogan) → formulaire. L'ordre des niveaux reste h2, h2, h3 — valide.
- **Cas limites** : nom vide / masqué → H3 seul dans le bloc Identité ; les deux vides → bloc Identité absent, les espacements des blocs restants sont inchangés.
- **Ne pas** toucher à `contact-info__address`, `contact-info__preline`, ni au formulaire/aux réseaux sociaux.
- Le CSS est **hors `@layer`** : les règles contact priment sur les utilitaires Tailwind à spécificité égale. `gap-12` est un utilitaire, il n'entre pas en conflit avec `.contact-info__*`.

---

## Validation

- `npx tsc --noEmit` → 0 ; `npm run lint` → 0 erreur / 0 avertissement.
- `/demo` → 200 (serveur de développement) ; dans `contact-11` : `<h2` = **2** (chapeau + nom), `<h3` = **1** (slogan) ; `h1` de la page toujours **1**.
- Le nom est bien un `<h2 class="module-h2">` et le slogan un `<h3 class="contact-info__slogan">` (assertion HTML).
- CSS compilé (extraire le `href` CSS du HTML puis `Contains`) : `.contact-info__lines` porte `gap: 1.5rem`, `dt` porte `font-weight: 700`, `.contact-info__slogan` porte le `clamp(... var(--h3-size))`, et `.contact-info__name` n'est **plus** émis.
- Recette visuelle navigateur (non mesurable ici) : nom à l'échelle du titre de section, slogan intermédiaire, blocs nettement séparés, intitulés franchement gras.

---

## Hors périmètre

- Éditeur back-office (sous-zones et libellés de champs) : non modifiés.
- Aucune donnée, aucun schéma, aucune migration : ces réglages sont purement typographiques et de mise en page.
- Aucun réglage exposé au photographe (pas de nouveau champ de contenu).

---

## Note pour l'exécution

Le plan demande des modifications de **fichiers source** (`ContactInfoBlock.tsx`, `globals.css`, `CHANGELOG.md`) : basculer sur un agent d'implémentation pour les appliquer et lancer la validation.
