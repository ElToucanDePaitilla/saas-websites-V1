# Plan — ROADMAP Étape 2.1 : Composant Header fixe (Front-Office)

## Objectif
Créer le composant `Header` du Front-Office — barre fixe en haut, esthétique
« glassmorphism nacré » du thème **Éclat Minéral & Nacre** — et l'intégrer dans le
RootLayout de l'application (visible sur toutes les pages).

## Références projet
- `SPECIFICATIONS-V8.md` §3.1 (Header : 5 presets, éléments, adaptation mobile) et §7.2-D (preset commercial).
- `PROJECT_CONTEXT.md` §2 (glassmorphism, ombre nacre, duo typographique).
- Thème déjà injecté dans `src/app/globals.css` (utility `glass`, tokens `--surface-color`, `--border-color`, `--accent-color`, fonts `--font-heading`/`--font-body`).
- Composant `Button` shadcn/ui déjà présent dans `src/components/ui/button.tsx`.
- Alias d'imports `@/*` → `./src/*` (tsconfig.json).

## 1. Fichiers concernés

### 1.1 Config partagée du site — `src/lib/site.ts` (nouveau)
Source unique et découplée du nom de marque et de la navigation, réutilisable
par le Header puis par le Footer (Étape 2.2).

```ts
export const siteName = "Prénom Nom"; // TODO : à brancher sur les réglages du photographe

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Prestations", href: "/prestations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];
```

> Les routes liées seront créées dans les phases ultérieures ; en attendant, les
> liens pointent vers leurs futurs slugs (le Header reste fonctionnel).

### 1.2 Composant — `src/components/layout/Header.tsx` (nouveau)
Composant **Server Component** (statique, aucun `"use client"`) pour rester léger
sur le Front-Office. Il consomme la config avec des valeurs par défaut, mais
accepte des props optionnelles pour être générique et réutilisable :

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteName, mainNav, type NavItem } from "@/lib/site";

type HeaderProps = {
  siteName?: string;
  navItems?: NavItem[];
  ctaLabel?: string;
};
```

**Structure sémantique proposée :**

```
<header role="banner" class="fixed inset-x-0 top-0 z-50 glass border-b border-[var(--border-color)]/60">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
    ── Marque (gauche) ─────────────────────────────────────────────
    <Link href="/" class="font-[var(--font-heading)] text-xl font-medium tracking-wide">
      {siteName}
    </Link>

    ── Navigation (centre/droite, desktop) ─────────────────────────
    <nav aria-label="Navigation principale" class="hidden items-center gap-1 md:flex">
      {navItems.map(item => <Link ...>{item.label}</Link>)}
    </nav>

    ── CTA Connexion (droite) ──────────────────────────────────────
    <div class="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/login">{ctaLabel}</Link>
      </Button>
    </div>
  </div>
</header>
```

**Points de style (thème) :**
- **Fixation** : `fixed inset-x-0 top-0 z-50` (hauteur `h-16`).
- **Glassmorphism nacré** : utility `glass` créée à l'Étape 1.3
  (`backdrop-filter: blur(12px)` + fond `rgba(255,255,255,.75)`) + bordure basse
  subtile `border-b border-[var(--border-color)]/60` pour le « découpage perle ».
- **Marque** : police serif `var(--font-heading)` (Cormorant Garamond) — identité
  artiste de la spec ; lien retour accueil.
- **Liens nav** : corps `var(--font-body)`, `text-sm`, hover doux sur accent
  nacré (ex. `hover:text-[var(--accent-color-strong)]`), état actif optionnel.
- **CTA** : `Button` shadcn `variant="outline"` + `size="sm"`, `asChild` autour
  d'un `Link` (vers route `/login` à venir) — remplacé plus tard par la modale
  d'authentification centralisée (Phase dédiée).
- **Responsive** : nav masquée sous `md` (`hidden md:flex`) ; marque + CTA
  toujours visibles. Le menu hamburger latéral sera ajouté à une étape dédiée
  (spec §3.1 « Adaptation Mobile »).

### 1.3 Intégration — `src/app/layout.tsx` (modifié)
Importer et placer `<Header />` au-dessus du contenu, puis compenser la hauteur
fixe de la barre pour que le contenu ne soit jamais masqué :

```tsx
import Header from "@/components/layout/Header";
// ...
<body className="min-h-full flex flex-col">
  <Header />
  <main className="flex-1 pt-20">{children}</main>
</body>
```

`pt-20` (5rem = 80px) = hauteur du header `h-16` (64px) + 16px de respiration,
garantissant que le contenu défile sous la barre translucide sans être coupé.

## 2. Ordre d'exécution (Code mode)
1. Créer `src/lib/site.ts` (config `siteName` + `mainNav`).
2. Créer `src/components/layout/Header.tsx`.
3. Intégrer `<Header />` dans `src/app/layout.tsx` (+ `pt-20` sur le conteneur `main`).
4. Valider : `npx tsc --noEmit` puis `npm run build` (contrôle zéro erreur).
5. Après validation visuelle utilisateur (`npm run dev`) : mettre à jour
   `CHANGELOG.md` et cocher l'Étape 2.1 dans `ROADMAP.md`.

## 3. Garde-fous / non-régression
- Ne pas modifier la structure ni les classes existantes du `<body>` au-delà de
  l'ajout du Header et de l'offset ; le layout actuel compile déjà.
- Composant sans état client (Server Component) : aucun impact JS sur le rendu statique.
- Toute classe custom fait référence aux variables CSS du thème
  (`var(--…)`) ou aux utilitaires créés (aucun code couleur en dur).
- Respect de la hiérarchie sémantique : `header` > `nav[aria-label]`, liens
  accessibles au clavier (par défaut).
