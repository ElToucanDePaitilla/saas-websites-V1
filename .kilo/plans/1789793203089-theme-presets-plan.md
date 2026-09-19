# Plan — Presets de thème (6 palettes opt-in, CSS seulement)

## Objectif
Ajouter six presets de thème sous forme de blocs CSS `.theme-<id>` dans `globals.css`, complets et validés par la garde `check:contrast`, **sans mécanisme de sélection** et **sans modifier le thème par défaut Nacre** ni le rendu actuel tant qu'aucun preset n'est actif. Le thème « Nacre & Éditorial » est exclu : c'est le `:root` existant.

## Décisions tranchées
1. **Sélection : CSS seulement** (choix utilisateur). Aucune colonne BDD, aucune migration, aucun provider, aucun sélecteur UI. Les classes restent dormantes jusqu'à un lot ultérieur.
2. **`galerie-luxe` (dark)** : bloc autonome (ses jetons encodent le sombre). Contrat documenté : un futur lot devra appliquer `dark` **et** `theme-galerie-luxe` ensemble, car `@custom-variant dark (&:is(.dark *))` ne réagit qu'à `.dark`. Le bloc est placé **après** `.dark` pour gagner en précédence.
3. **Ordre / élément d'application** : les blocs sont insérés **après `.admin` (l.261) et avant `@theme` (l.263)**, donc après `:root`, `.dark` et `.admin`. Ils doivent être appliqués au **même élément que `:root`, c'est-à-dire `<html>`** : les alias shadcn (`--primary`, `--accent`, `--ring`, `--background`, `--foreground`, `--border`, `--muted-foreground`, `--secondary-foreground`) sont déclarés une seule fois dans `:root` et leur `var()` y est résolu ; appliqués à un wrapper, ils resteraient résolus sur les valeurs par défaut. À documenter (le futur lot devra hisser le thème sur `<html>` ou re-déclarer les alias).
4. **Dérivés d'ambiance non couverts** : `--shadow-pearl-sm` (halo rosé) et `--star-color-empty` (#d9d3d0 rosé) sont hérités du thème Nacre par les presets clairs. Assumé (non porteurs de contraste), signalé comme suites possibles.
5. **Jetons additionnels** : seuls `galerie-luxe` reçoit `--star-color`, `--star-color-empty`, `--glass-bg`, `--glass-border`. Les presets clairs héritent des valeurs Nacre (or `#e0a82e`, verre blanc).

## Données à transcrire (couleurs validées ; ne pas réutiliser d'autres ratios)
Ratios **obligatoires** tous ≥ 4,5:1 ; le plus serré est sauge (`--accent-color` en texte sur `--bg-color` ≈ 4,95:1). La garde reste l'unique source des ratios.

| Jeton | corporate | tech-minimaliste | terre-atelier | sauge-cabinet | galerie-luxe | girly-baby |
|---|---|---|---|---|---|---|
| mode | light | light | light | light | dark | light |
| `--bg-color` | #ffffff | #fafafa | #fdfbf7 | #f4f6f4 | #121212 | #fff9fb |
| `--text-color` | #1e293b | #18181b | #2d241e | #1c2826 | #f5f5f5 | #2d1f25 |
| `--surface-color` | #f8fafc | #ffffff | #f4efea | #ffffff | #1e1e1e | #ffffff |
| `--surface-color-soft` | #f1f5f9 | #f4f4f5 | #ebe3db | #e8ebe8 | #2a2a2a | #fdebf2 |
| `--accent-color` | #1d4ed8 | #047857 | #b04d32 | #8c6311 | #d4af37 | #9e3b68 |
| `--accent-color-strong` | #1e40af | #065f46 | #8f3c24 | #6e4d0c | #f3c846 | #7d2b50 |
| `--border-color` | #e2e8f0 | #e4e4e7 | #e2d7cd | #d5dbd5 | #333333 | #f3d2e1 |
| `--text-muted` | #64748b | #71717a | #78685e | #5c6b68 | #a3a3a3 | #7d626e |
| `--primary-foreground` | #ffffff | #ffffff | #ffffff | #ffffff | #121212 | #ffffff |
| `--accent-foreground` | #ffffff | #ffffff | #ffffff | #ffffff | #121212 | #ffffff |
| `--secondary` | #f1f5f9 | #f4f4f5 | #ebe3db | #e8ebe8 | #2a2a2a | #fdebf2 |
| `--secondary-foreground` | #0f172a | #18181b | #2d241e | #1c2826 | #f5f5f5 | #2d1f25 |
| `--muted` | #f1f5f9 | #f4f4f5 | #ebe3db | #e8ebe8 | #2a2a2a | #fdebf2 |
| `--destructive` | #dc2626 | #dc2626 | #b91c1c | #b91c1c | #ef4444 | #be123c |
| `--destructive-foreground` | #ffffff | #ffffff | #ffffff | #ffffff | #ffffff | #ffffff |

Propres à `galerie-luxe` : `--star-color: #d4af37`, `--star-color-empty: #333333`, `--glass-bg: rgba(30, 30, 30, 0.75)`, `--glass-border: rgba(212, 175, 55, 0.2)`.

Interdits dans les presets : `--btn-text-color`, `--ring` et `--muted-foreground` (dérivent via `:root`), `--primary`, `--accent`, `--background`, `--foreground`, `--card`, `--popover`, `--border`, `--input`.

## Tâches (ordonnées)
1. **`src/app/globals.css` — section « PRESETS DE THÈME (opt-in) ».**
   - Insérer un en-tête de section commenté entre l.261 (fin de `.admin`) et l.263 (en-tête `@theme`). Rappeler : blocs dormants, appliqués à `<html>` uniquement, `--ring`/`--muted-foreground` non fournis car dérivés, `galerie-luxe` à coupler avec `.dark`.
   - Ajouter les 6 blocs `.theme-corporate`, `.theme-tech-minimaliste`, `.theme-terre-atelier`, `.theme-sauge-cabinet`, `.theme-galerie-luxe`, `.theme-girly-baby` avec les 14 jetons du tableau (16 pour `galerie-luxe` avec star/glass). Nommer les blocs selon l'id slug.
   - **Ne modifier aucune déclaration** de `:root`, `.dark`, `.admin`.
   - Étendre, **en commentaire uniquement**, le bloc « CONVENTION DES JETONS DE THÈME » (au-dessus de `:root`) d'une phrase : « Presets opt-in `.theme-<id>` : voir la section dédiée ; appliqués à `<html>` uniquement ».
2. **`scripts/check-contrast.ts` — étendre `THEMES`.**
   - Ajouter 6 entrées (mêmes clés de jetons résolus que `LIGHT`/`DARK` : inclure `--primary` = `--accent-color`, `--accent` = `--accent-color`, `--ring` = `--accent-color-strong`).
   - Paires **obligatoires** (identiques au reste) : `--text-color`/`--bg-color`, `--text-color`/`--surface-color`, `--primary-foreground`/`--primary`, `--accent-foreground`/`--accent`.
   - Paires **secondaires** : `--text-muted`/`--surface-color` (4,5), `--ring`/`--bg-color` (3, non textuel).
   - **Ajout recommandé, secondaire (avertissement)** pour tous les thèmes : `--primary` (utilisé comme texte par `link`/`text-primary`) sur le fond — `--bg-color` (clair/sombre) ou `--background` (admin) — seuil 4,5. Attendu : avertit sur Nacre clair (≈ 1,38:1, non-conformité du lot 2 déjà connue) et passe pour les presets. Ne pas passer cette paire en obligatoire : elle ferait échouer le thème par défaut.
   - Un helper de fabrique de paires est acceptable pour éviter 6 copies ; le style existant reste explicite.
3. **`PROJECT_CONTEXT.md` — section « Convention des jetons de thème ».**
   Ajouter la liste des 6 presets (id + libellé + mode), l'état « dormants, non sélectionnables », le contrat d'application `<html>`, le couplage `dark` + `theme-galerie-luxe`, et le renvoi à `npm run check:contrast`.
4. **Validation** (voir ci-dessous).

## Validation
- `npm run check:contrast` → **code 0** : 0 paire obligatoire en échec ; avertissements attendus uniquement sur Nacre clair (`--text-muted`/surface ≈ 4,48 ; `--ring`/bg ≈ 1,68 ; `--primary`/bg ≈ 1,38).
- `npx tsc --noEmit` → 0 ; `npm run lint` → 0.
- `git diff src/app/globals.css` → aucune déclaration de `:root`/`.dark`/`.admin` modifiée ; seuls ajouts = 1 section de presets + (éventuelle) phrase de commentaire.
- Contrôle visuel : `/demo` et `/admin/bandeau-alerte` identiques (aucun preset appliqué). Ne pas lancer `npm run build` si `next dev` occupe le port 3000.

## Risques
- **Résolution des alias** : un preset appliqué hors `<html>` ne fera pas suivre `--primary`/`--ring`/`--background` (var() résolu dans `:root`). Contrat à respecter par le futur lot de sélection.
- **Dérive de la snapshot** : la table `THEMES` du script duplique `globals.css` ; toute retouche de couleur doit être répercutée des deux côtés (commentaire déjà en tête du script).
- **Dormance** : sans mécanisme de sélection, aucun preset n'est visible en production ; c'est l'effet voulu du lot.
- **Héritage partiel** : `--shadow-pearl-sm` et `--star-color-empty` restent Nacre sur les presets clairs.

## Hors périmètre
- Persistance BDD (`theme` sur `site_visual_identity`), migration Drizzle, repository, provider, sélecteur UI, application runtime.
- Correctifs de contraste du lot 2 sur le thème par défaut (`text-primary` de `PublicModules.tsx:136`, `--text-muted`, `--ring`, `text-white` de `Button` `destructive`).

## Questions ouvertes (lot suivant)
- Mécanisme de sélection : classe statique hissée sur `<html>` via le layout racine, script client, ou re-déclaration des alias dans chaque preset pour permettre un wrapper.
- Faut-il surcharger `--star-color-empty` et `--shadow-pearl-sm` par preset ?
