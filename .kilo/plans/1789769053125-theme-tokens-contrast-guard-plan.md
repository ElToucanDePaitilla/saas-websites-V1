# Plan — Jetons de thème & garde de contraste (zéro changement visuel)

## Objectif
Formaliser la convention « 4 rôles CSS + foreground de CTA + seuils WCAG » **sans modifier le rendu actuel** : aucun pixel ne doit changer. Les correctifs de contraste constatés sont isolés dans un lot 2 séparé, à valider plus tard à l'œil.

## Décisions validées
- **Périmètre : zéro changement visuel.** Aucune valeur de couleur n'est modifiée ; le travail est documentation + garde de contraste.
- **Ne pas séparer `--accent` (surface de survol shadcn) de `--accent-color` (CTA).** Conservé tel quel : la séparation repeindrait les survols de ~27 endroits (back-office + Header).
- **Ne pas unifier `--primary-foreground` sur `--accent-foreground`.** Dans `.admin`, ils diffèrent volontairement (`#ffffff` vs `#18181b`). Le couple CTA de référence est `--primary` + `--primary-foreground`.
- **Aucun nouveau framework de test.** Le projet n'a pas de runner ; la garde est un script Node lancé via `tsx` (déjà en devDependency).

## Constat (audit du code existant)
- L'architecture demandée est **déjà en place** : `:root`, `.dark` et `.admin` déclarent `--bg-color`, `--surface-color`, `--text-color`, `--accent-color` (+ `--accent-color-strong`, `--border-color`, `--text-muted`), et `@theme inline` expose les tokens shadcn (`--color-primary`, `--color-accent-foreground`, …).
- `--accent-foreground` et `--primary-foreground` **existent déjà**, avec les bonnes valeurs pour les thèmes actuels (clair/sombre : `#1a1a1a` ; admin : `#ffffff` sur primaire sombre).
- Le code contourne déjà localement le problème (commentaire `globals.css` vers la ligne 1213 : le module contact prend `--text-color`, « jamais `--primary` — rose très clair, quasi invisible »).
- **Non-conformités constatées — HORS périmètre (lot 2)** :
  - `src/components/modules/PublicModules.tsx:136` : prix en `text-primary` → `#e8d8d7` sur blanc ≈ **1,38:1**.
  - `--text-muted` (`rgba(26,26,26,0.6)`) ≈ 4,54:1 sur blanc mais ≈ **4,29:1** sur `--surface-color` → sous AA.
  - `--ring` clair (`#d8c3c2`) < 3:1 (focus, WCAG 1.4.11).
  - `src/components/ui/button.tsx` variante `destructive` : `text-white` au lieu de `--destructive-foreground` (`#faf8f8`).

## Tâches (ordonnées)
1. **`src/app/globals.css` — bloc de documentation, sans changer une seule déclaration.**
   Ajouter un commentaire au-dessus de `:root` qui fixe la convention :
   - les 4 rôles (`--bg-color`, `--text-color`, `--accent-color`, `--surface-color`) et leurs dérivés (`--accent-color-strong`, `--primary-foreground`, `--accent-foreground`) ;
   - la règle du texte de CTA : accent clair → texte sombre, accent foncé → blanc, toujours ≥ 4,5:1 ;
   - les seuils : texte ≥ 4,5:1 (AA), éléments non textuels / focus ≥ 3:1 ;
   - la frontière : **hex autorisé dans les tokens** (`:root`/`.dark`/`.admin`), **interdit dans un composant ou un bouton** ; seule exception, le texte posé sur photo (Héro, bandeaux) ;
   - la note explicite : `--primary` ≠ `--accent-color` dans `.admin` est **volontaire** (primaire sombre de productivité), ne pas « corriger ».
   - **Contrainte de revue** : le diff de ce fichier ne doit contenir **que des lignes de commentaire**.

2. **`scripts/check-contrast.ts` — garde WCAG autonome (nouveau fichier).**
   Fonctions pures : `relativeLuminance(hex)`, `contrastRatio(a, b)`, `readableForeground(bg)`.
   Table des thèmes (clair, sombre, admin) avec les valeurs lues dans `globals.css`, et la liste des paires :
   - **obligatoires** (échec ⇒ code de sortie 1) : `--text-color` sur `--bg-color`, `--text-color` sur `--surface-color`, `--primary-foreground` sur `--primary`, `--accent-foreground` sur `--accent-color` ;
   - **secondaires** (avertissement seulement) : `--text-muted` sur `--surface-color`, `--accent-color-strong`/`--ring` sur `--bg-color` (non-textuel, seuil 3:1).
   Sortie console lisible par thème et par paire.

3. **`package.json` — script `"check:contrast": "tsx scripts/check-contrast.ts"`.**
   Aucune dépendance ajoutée (`tsx` déjà présent).

4. **`PROJECT_CONTEXT.md` — section « Palette CSS Root ».**
   Y reporter la convention : les 4 rôles, la règle du foreground, les seuils AA, la règle anti-hex (tokens vs composants), l'exception texte-sur-photo, et le renvoi au script `check:contrast`.

5. **`src/components/ui/button.tsx` — commentaire de renvoi uniquement.**
   Ajouter (sans modifier une seule classe) un commentaire indiquant que les couleurs de bouton viennent exclusivement des tokens (`bg-primary text-primary-foreground`, `border-border`, `--destructive-foreground`) et renvoyant à la convention de `globals.css`. Aucun changement de rendu.

## Validation
- `npx tsc --noEmit` → **0** ; `npm run lint` → **0 erreur / 0 avertissement**.
- `npm run check:contrast` → paires **obligatoires OK** ; les paires secondaires signalées en avertissement (attendu : `--text-muted` sur surface et `--ring` clair).
- `git diff src/app/globals.css` → **uniquement des commentaires** (aucune déclaration modifiée).
- Contrôle visuel : `/demo` et un écran back-office (ex. `/admin/bandeau-alerte`) **identiques avant/après** (capture ou comparaison d'inspection).
- Ne pas lancer `npm run build` tant que `next dev` occupe le port 3000 (`.next` partagé) — règle du projet.

## Risques
- **Dérive du périmètre** : « en profiter » pour retoucher une valeur romprait le zéro-changement. La revue doit exiger un diff de `globals.css` composé seulement de commentaires, et l'absence de toute classe modifiée dans `button.tsx`.
- **Duplication WCAG** : le script embarque sa propre logique. À promouvoir dans `src/lib/` le jour où un vrai système de thèmes dynamiques arrivera — aujourd'hui, la garder dans le script évite du code mort (convention du projet).
- **Faux sentiment de conformité** : la garde vérifie les **paires de tokens**, pas les usages dans les composants. Le lot 2 devra auditer les usages (`text-primary`, `text-white`).

## Hors périmètre — lot 2 (correctifs visibles, à valider séparément)
- Prix des prestations : `text-primary` → `text-[var(--text-color)]` (corrige 1,38:1).
- `--text-muted` : 0,6 → 0,65/0,7 (AA sur `--surface-color`).
- `--ring` clair : porter le focus à ≥ 3:1.
- `Button` `destructive` : `text-white` → `--destructive-foreground`.
- **Rejeté** : séparation `--accent` shadcn / `--accent-color` (repeint ~27 survols).

## Questions ouvertes
- Option tâche 5 (commentaire de renvoi dans `button.tsx`) : incluse car strictement sans effet visuel. À retirer si l'on veut limiter le lot à la documentation et à la garde.

## Suite
Le plan n'introduit aucune édition de code fonctionnelle : un agent d'implémentation peut l'exécuter tel quel. Toute modification de source doit être faite après avoir quitté le mode Plan.
