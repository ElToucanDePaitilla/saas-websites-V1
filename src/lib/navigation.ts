/**
 * ============================================================================
 * MODÈLE « NAVIGATION » & HELPERS — Back-Office (Étapes 4.1 → 4.3)
 * ----------------------------------------------------------------------------
 * Modèle des menus du site (Header / Footer) administrés depuis l'écran
 * « Navigation & Menus » (`/admin/navigation`), conforme à la spec §7.2-D.
 *
 * Étape 4.3 (ce fichier) :
 *   - hiérarchie **Niveau 2 (sous-menus)** portée par `NavMenuEntry.children`
 *     — **Header uniquement** (menu horizontal principal avec sous-menus
 *     déroulants, spec §7.2-D & §8). Le **Footer reste plat** (1 niveau) ;
 *   - profondeur **strictement limitée à 2** : un item de Niveau 2 n'est jamais
 *     parent ; seuls les items de Niveau 1 du Header exposent une zone enfant ;
 *   - type de cible unifié `kind: "page" | "custom"` (l'ex-`"link"` 4.1/4.2 est
 *     renommé `custom`) : « Page du site » (`pageId` non nul, synchronisée) ou
 *     « Lien personnalisé » (`pageId: null`, jamais synchronisé) acceptant une
 *     ancre locale (`#…`), un chemin relatif avec ancre (`/page#ancre`) ou une
 *     URL externe (`https://…`) via `normalizeHref` ;
 *   - helpers **purs** de manipulation de l'arbre (ajout, mise à jour,
 *     suppression récursive, déplacement entre listes racine/enfant) utilisés
 *     par le store et par la réconciliation Pages ↔ Navigation.
 *
 * Conçu pour mapper 1:1 vers la future table `nav_items` (zone, label, href,
 * `hidden`, ordre = position dans la liste du parent, `parent_id` nullable :
 * racine = `NULL`, enfant = `id` du parent) — aucune dépendance externe,
 * TypeScript strict, zéro `any`.
 *
 * Références : plans/ROADMAP-4.1-navigation.md §1.1 —
 *              plans/ROADMAP-4.2-pages-nav-sync.md §1.2 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.1
 * ============================================================================
 */

import { pageHref, seedPages, type SitePage } from "./pages";

/** Zone de menu administrée (spec §7.2-D : Header / Footer). */
export type NavArea = "header" | "footer";

/**
 * Type de cible d'un item de menu (4.3).
 * - `"page"` : page interne (lien stable `pageId`, synchronisée avec PagesStore) ;
 * - `"custom"` : lien personnalisé (`pageId: null`, jamais synchronisé) — ancre
 *   locale, chemin + ancre ou URL externe (ex-`"link"` des Étapes 4.1/4.2).
 */
export type NavItemKind = "page" | "custom";

/**
 * Item de menu — mappe vers la future table `nav_items`
 * (le `parent_id` du Niveau 2 est représenté par `children`, 4.3).
 */
export interface NavMenuEntry {
  id: string; // identifiant stable (mock : crypto.randomUUID())
  label: string; // libellé affiché dans le menu
  kind: NavItemKind; // "page" (interne) | "custom" (ancre / URL / libre)
  href: string; // cible : "/portfolio" (page), "#ancre", "/page#ancre", "https://…"
  hidden: boolean; // Toggle Eye (masquer sans supprimer)
  pageId: string | null; // lien stable vers SitePage (null = lien libre, non synchronisé)
  /**
   * Entrée « automatique » : créée/maintenue par la synchro Pages ↔ Navigation
   * pour une page `inMenu`. `true` = purgée si la page quitte le menu ;
   * `false` = entrée manuelle (jamais purgée par `inMenu`, seulement si la page
   * est supprimée).
   */
  auto: boolean;
  /**
   * Sous-menu de Niveau 2 (4.3) — **Header uniquement**, profondeur max 2.
   * Absent/vide pour le Footer (plat) et pour les items de Niveau 2.
   */
  children?: NavMenuEntry[];
}

/** Navigation complète du site, par zone. */
export interface SiteNavigation {
  header: NavMenuEntry[];
  footer: NavMenuEntry[];
}

/**
 * Crée un item de menu (id stable + valeurs fournies, sans enfant).
 * `pageId` : id de la page liée pour les entrées de type `page` (null pour un
 * lien libre — l'entrée n'est alors jamais synchronisée avec les pages).
 * `auto` : `true` si l'entrée est gérée par la synchro Pages ↔ Navigation
 * (créée/maintenue pour une page `inMenu`) ; `false` (défaut) pour une entrée
 * manuelle ajoutée dans l'écran Navigation.
 */
export function createNavEntry(
  kind: NavItemKind,
  label: string,
  href: string,
  pageId: string | null = null,
  auto = false
): NavMenuEntry {
  return {
    id: crypto.randomUUID(),
    label,
    kind,
    href,
    hidden: false,
    pageId,
    auto,
  };
}

/**
 * Normalise une saisie de cible « Lien personnalisé » (4.3, centralisé ici) :
 *   - vide → `""` ;
 *   - déjà préfixé par `/`, `http://`, `https://` ou `#` → conservé tel quel
 *     (couvre ancre locale `#contact`, chemin relatif + ancre
 *     `/a-propos#equipe`, URL externe `https://…`) ;
 *   - sinon (slug nu) → préfixé `/`.
 */
export function normalizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

/** true si l'item porte un sous-menu non vide (parent de Niveau 1, 4.3). */
export function hasNavChildren(entry: NavMenuEntry): boolean {
  return (entry.children?.length ?? 0) > 0;
}

/* --------------------------------------------------------------------------
   LIENS ORPHELINS (Étape 10.1.a) — entrées `custom` sans `pageId` pointant
   vers une page interne inexistante (ancres du seed, placeholders de presets…).
   -------------------------------------------------------------------------- */

/**
 * Slug interne ciblé par un `href` :
 *   - `"/portfolio#mariages"` → `"portfolio"` ; `"/"` → `""` ;
 *   - `""`, `"#ancre"` (locale) ou `"https://…"` (externe) → `null` (jamais
 *     considéré orphelin).
 */
export function internalHrefSlug(href: string): string | null {
  const trimmed = href.trim();
  if (trimmed === "" || !trimmed.startsWith("/")) {
    return null;
  }
  const path = trimmed.split("#")[0] ?? "";
  if (path === "/") {
    return "";
  }
  const slug = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return slug === "" ? null : slug;
}

/**
 * Vrai si l'entrée est un **lien interne mort** : elle n'est rattachée à aucune
 * page (`pageId === null`) et son `href` cible un slug qui n'existe plus.
 * Les entrées rattachées à une page sont gérées par la cascade (FK + synchro).
 */
export function isOrphanNavEntry(
  entry: NavMenuEntry,
  slugs: ReadonlySet<string>
): boolean {
  if (entry.pageId !== null) {
    return false;
  }
  const slug = internalHrefSlug(entry.href);
  if (slug === null) {
    return false;
  }
  return !slugs.has(slug);
}

/**
 * Recherche récursive d'un item par id dans une liste racine (descend dans les
 * `children`). Retourne `undefined` si introuvable.
 */
export function findNavEntry(
  list: NavMenuEntry[],
  id: string
): NavMenuEntry | undefined {
  for (const entry of list) {
    if (entry.id === id) {
      return entry;
    }
    if (entry.children && entry.children.length > 0) {
      const found = findNavEntry(entry.children, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Retourne l'id du parent d'un item (ou `null` si l'item est à la racine ou
 * introuvable). Utile pour pré-remplir le champ « Rattachement » du formulaire.
 */
export function findNavParentId(
  list: NavMenuEntry[],
  id: string
): string | null {
  for (const entry of list) {
    if (entry.id === id) {
      return null;
    }
    if (entry.children?.some((child) => child.id === id)) {
      return entry.id;
    }
  }
  return null;
}

/**
 * Ajoute un item à la fin de la liste visée (racine si `parentId` est `null`,
 * sinon sous-liste `children` du parent). Helper pur — retourne la nouvelle
 * liste racine. Si le parent visé n'existe pas, la liste est retournée inchangée.
 */
export function insertNavEntry(
  list: NavMenuEntry[],
  parentId: string | null,
  entry: NavMenuEntry
): NavMenuEntry[] {
  if (parentId === null) {
    return [...list, entry];
  }
  return list.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), entry] };
    }
    return item;
  });
}

/**
 * Met à jour un item par id (fusion du patch) — **récursif** : cherche à la
 * racine puis dans les `children`. Helper pur — retourne la nouvelle liste.
 */
export function updateNavEntry(
  list: NavMenuEntry[],
  id: string,
  patch: Partial<NavMenuEntry>
): NavMenuEntry[] {
  return list.map((item) => {
    if (item.id === id) {
      return { ...item, ...patch };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: updateNavEntry(item.children, id, patch) };
    }
    return item;
  });
}

/**
 * Supprime un item par id — **récursif** (retire le sous-arbre complet quand
 * l'item est un parent de Niveau 1 : suppression = cascade du sous-menu).
 * Helper pur — retourne la nouvelle liste.
 */
export function removeNavEntry(list: NavMenuEntry[], id: string): NavMenuEntry[] {
  return list
    .filter((item) => item.id !== id)
    .map((item) =>
      item.children && item.children.length > 0
        ? { ...item, children: removeNavEntry(item.children, id) }
        : item
    );
}

/** Position source/destination d'un déplacement DnD (parentId null = racine). */
export type NavMovePosition = {
  /** Id du parent contenant la liste visée (null = liste racine). */
  parentId: string | null;
  /** Index dans la liste visée. */
  index: number;
};

/**
 * Résout (dans un arbre **cloné**) la liste correspondant à un `parentId`
 * (`null` → liste racine). Retourne `null` si le parent n'existe pas.
 */
function resolveChildList(
  list: NavMenuEntry[],
  parentId: string | null
): NavMenuEntry[] | null {
  if (parentId === null) {
    return list;
  }
  for (const item of list) {
    if (item.id === parentId) {
      if (!item.children) {
        item.children = [];
      }
      return item.children;
    }
  }
  return null;
}

/**
 * Déplace un item (avec son sous-arbre) de la liste source vers la liste
 * destination. Helper pur — retourne la nouvelle liste racine, ou `null` si un
 * invariant est violé (parent introuvable, index hors bornes, auto-parent).
 *
 * Remarque : les garde-fous métier (Footer racine, profondeur max 2, pas
 * d'imbrication d'un parent qui a des enfants) sont appliqués par le store
 * **avant** l'appel — ce helper ne gère que la mécanique du déplacement.
 */
export function moveNavEntryAcross(
  list: NavMenuEntry[],
  source: NavMovePosition,
  destination: NavMovePosition
): NavMenuEntry[] | null {
  const next = structuredClone(list);
  const sourceList = resolveChildList(next, source.parentId);
  const destinationList = resolveChildList(next, destination.parentId);
  if (sourceList === null || destinationList === null) {
    return null;
  }
  if (source.index < 0 || source.index >= sourceList.length) {
    return null;
  }
  if (destination.index < 0 || destination.index > destinationList.length) {
    return null;
  }
  const moved = sourceList[source.index];
  if (!moved) {
    return null;
  }
  // Auto-parent (déposer un item dans sa propre zone enfant) : refus.
  if (destination.parentId !== null && destination.parentId === moved.id) {
    return null;
  }
  // Même liste, même position : aucun changement (on renvoie la liste d'origine).
  if (sourceList === destinationList && source.index === destination.index) {
    return list;
  }
  const [removed] = sourceList.splice(source.index, 1);
  if (removed === undefined) {
    return null;
  }
  destinationList.splice(destination.index, 0, removed);
  return next;
}

/**
 * Déplace un élément de `from` vers `to` dans une liste (helper pur, non-mutant —
 * réordonnancement plat : Footer, ou cas même-liste d'un sous-menu). Conserve
 * l'ancien `moveNavEntry` des Étapes 4.1/4.2 sous le nom `reorderNavList`.
 */
export function reorderNavList<T>(list: T[], from: number, to: number): T[] {
  if (
    from < 0 ||
    from >= list.length ||
    to < 0 ||
    to >= list.length ||
    from === to
  ) {
    return list;
  }
  const next = Array.from(list);
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return list;
  }
  next.splice(to, 0, moved);
  return next;
}

/**
 * Menu de départ : construit le Header depuis `seedPages` (Accueil + pages
 * vitrines) et le Footer (colonne Navigation, sans l'Accueil). Libellé =
 * `menuTitle` de chaque page ; cible = `pageHref(slug)` ; `pageId` = id de la
 * page seed (permet la synchro Pages ↔ Navigation de l'Étape 4.2).
 *
 * Le Header est constitué d'entrées **auto** (miroir des pages `inMenu`) ; le
 * Footer est **manuel** (`auto: false`, purgé uniquement si la page est
 * supprimée — jamais par le retrait du menu).
 *
 * Étape 4.3 : ajout d'un **sous-menu de démonstration** (Niveau 2) sous
 * « Portfolio » — enfants **manuels** (`auto: false`, `kind: "custom"`) pointant
 * vers des ancres de la page Portfolio, pour visualiser l'imbrication dès le
 * seed. Les enfants manuels ne sont jamais purgés par la synchro tant que la
 * page parent existe.
 */
export function buildSeedNavigation(): SiteNavigation {
  const header: NavMenuEntry[] = seedPages.map((page) =>
    createNavEntry("page", page.menuTitle, pageHref(page.slug), page.id, true)
  );

  // Démo Niveau 2 : sous-menu manuel sous l'entrée de la page « Portfolio ».
  const portfolio = seedPages.find((page) => page.slug === "portfolio");
  if (portfolio) {
    const portfolioEntry = header.find((entry) => entry.pageId === portfolio.id);
    if (portfolioEntry) {
      portfolioEntry.children = [
        createNavEntry(
          "custom",
          "Mariages",
          `${pageHref(portfolio.slug)}#mariages`
        ),
        createNavEntry(
          "custom",
          "Portraits",
          `${pageHref(portfolio.slug)}#portraits`
        ),
        createNavEntry(
          "custom",
          "Corporate",
          `${pageHref(portfolio.slug)}#corporate`
        ),
      ];
    }
  }

  // Footer : même liste sans la page d'accueil (racine "/").
  const footer: NavMenuEntry[] = seedPages
    .filter((page) => page.slug !== "")
    .map((page) =>
      createNavEntry("page", page.menuTitle, pageHref(page.slug), page.id, false)
    );

  return { header, footer };
}

/* ==========================================================================
   PRESETS ONBOARDING DE NAVIGATION (Étape 4.4 — spec §7.2-D)
   --------------------------------------------------------------------------
   Un preset Onboarding est une structure de menu « starter » selon le profil
   d'activité du photographe. Il référence des pages **par slug** :
     - cible `{ kind: "page", slug }` : résolue contre les pages courantes —
       page trouvée → entrée `page` **auto** (pageId renseigné, inMenu true) ;
       page absente → entrée `custom` **manuelle** (placeholder `/<slug>`,
       « page à créer ») ;
     - cible `{ kind: "href", href }` : entrée `custom` **manuelle** directe
       (ancres de sous-menu `/prestations#mariages`, URL… — jamais résolue).
   `resolveNavPreset` est **pure** (zéro setState) : elle retourne le nouveau
   Header à poser + la table des `inMenu` à appliquer aux pages existantes.
   Référence : plans/ROADMAP-4.4-nav-presets-onboarding.md §1 & §2.
   ========================================================================== */

/** Identifiants des trois profils d'Onboarding (spec §7.2-D). */
export type NavPresetId = "artiste" | "commercial" | "passionne";

/** Cible d'un nœud de preset. */
export type NavPresetTarget =
  | { kind: "page"; slug: string } // page existante recherchée par slug ("" = Accueil)
  | { kind: "href"; href: string }; // placeholder / ancre / URL, jamais résolue

/** Nœud d'arborescence d'un preset (seuls les nœuds racine portent des enfants). */
export interface NavPresetNode {
  label: string; // libellé preset (survolé par le menuTitle si page résolue)
  target: NavPresetTarget;
  children?: NavPresetNode[]; // sous-menu Niveau 2 (Header) — profondeur max 2
}

/** Preset Onboarding complet (catalogue §2 du plan 4.4). */
export interface NavPreset {
  id: NavPresetId;
  profile: string; // ex. "Artiste / Auteur"
  tagline: string; // sous-titre affiché dans la carte UI
  nodes: NavPresetNode[]; // arborescence du menu principal (Header)
}

/**
 * Catalogue des presets de navigation Onboarding (spec §7.2-D), adapté au jeu
 * de pages du mock (Accueil, Portfolio, Prestations, À propos, Contact).
 *
 * Notes de mapping documentées :
 *   - spec « Tarifs » distinct de « Prestations » → fusionné dans la page seed
 *     « Prestations & Tarifs » (aucun placeholder `/tarifs`) ;
 *   - spec « RDV / Contact (Bouton CTA) » → représenté par l'item Contact ;
 *   - « Connexion » **absent des presets** : le Header public possède déjà son
 *     bouton dédié (chrome fixe) — aucune entrée de menu dédiée requise ;
 *   - « Séries » / « Galeries » : cibles `page` absentes → placeholders
 *     `custom` (auto-liés si le photographe crée un jour la page du même slug).
 */
export const NAV_PRESETS: readonly NavPreset[] = [
  {
    id: "artiste",
    profile: "Artiste / Auteur",
    tagline: "Portfolio épuré, centré sur l'image et la narration.",
    nodes: [
      { label: "Portfolio", target: { kind: "page", slug: "portfolio" } },
      { label: "Séries", target: { kind: "page", slug: "series" } },
      { label: "À propos", target: { kind: "page", slug: "a-propos" } },
      { label: "Contact", target: { kind: "page", slug: "contact" } },
    ],
  },
  {
    id: "commercial",
    profile: "Photographe Pro / Commercial",
    tagline: "Prestations détaillées et sous-menu par type de shooting.",
    nodes: [
      { label: "Accueil", target: { kind: "page", slug: "" } },
      {
        label: "Prestations",
        target: { kind: "page", slug: "prestations" },
        children: [
          {
            label: "Mariage",
            target: { kind: "href", href: "/prestations#mariages" },
          },
          {
            label: "Portrait",
            target: { kind: "href", href: "/prestations#portraits" },
          },
          {
            label: "Corporate",
            target: { kind: "href", href: "/prestations#corporate" },
          },
        ],
      },
      { label: "À propos", target: { kind: "page", slug: "a-propos" } },
      { label: "Contact", target: { kind: "page", slug: "contact" } },
    ],
  },
  {
    id: "passionne",
    profile: "Passionné / Semi-Pro",
    tagline: "Menu court : galeries et prise de contact immédiates.",
    nodes: [
      { label: "Accueil", target: { kind: "page", slug: "" } },
      { label: "Galeries", target: { kind: "page", slug: "galeries" } },
      { label: "Contact", target: { kind: "page", slug: "contact" } },
    ],
  },
];

/** Résultat de `resolveNavPreset`. */
export interface ResolvedNavPreset {
  /** Nouvelles entrées racine du Header (auto + placeholders custom). */
  header: NavMenuEntry[];
  /** Pages existantes → nouveau flag `inMenu` (les absentes = false). */
  inMenuByPageSlug: Record<string, boolean>;
}

/**
 * Résout récursivement une liste de nœuds de preset en entrées de menu.
 * Règles (cf. en-tête du bloc) : page trouvée → `page` auto (label = menuTitle,
 * href = pageHref, `hidden` = draft, inMenu true) ; page absente → `custom`
 * manuelle (placeholder) ; `href` → `custom` manuelle.
 */
function resolvePresetNodes(
  nodes: NavPresetNode[],
  pageBySlug: Map<string, SitePage>,
  inMenuByPageSlug: Record<string, boolean>
): NavMenuEntry[] {
  return nodes.map((node) => {
    const children =
      node.children && node.children.length > 0
        ? resolvePresetNodes(node.children, pageBySlug, inMenuByPageSlug)
        : [];

    if (node.target.kind === "href") {
      const entry = createNavEntry(
        "custom",
        node.label,
        normalizeHref(node.target.href)
      );
      if (children.length > 0) {
        entry.children = children;
      }
      return entry;
    }

    const page = pageBySlug.get(node.target.slug);
    if (page) {
      inMenuByPageSlug[page.slug] = true;
      // Entrée auto cohérente avec la synchro (label/menuTitle, hidden si draft)
      // → aucune correction ultérieure de `PagesNavigationSync` (badge stable).
      const entry = createNavEntry(
        "page",
        page.menuTitle,
        pageHref(page.slug),
        page.id,
        true
      );
      entry.hidden = page.status === "draft";
      if (children.length > 0) {
        entry.children = children;
      }
      return entry;
    }

    // Page absente → placeholder custom manuel (jamais purgé par la synchro).
    const entry = createNavEntry(
      "custom",
      node.label,
      normalizeHref(`/${node.target.slug}`)
    );
    if (children.length > 0) {
      entry.children = children;
    }
    return entry;
  });
}

/**
 * Résout un preset Onboarding en (1) nouveau Header et (2) table des `inMenu`
 * à appliquer aux pages existantes. Helper **pur** — ne mute aucun store.
 */
export function resolveNavPreset(
  presetId: NavPresetId,
  pages: SitePage[]
): ResolvedNavPreset {
  const preset = NAV_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return { header: [], inMenuByPageSlug: {} };
  }

  const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
  const inMenuByPageSlug: Record<string, boolean> = Object.fromEntries(
    pages.map((page) => [page.slug, false])
  );

  const header = resolvePresetNodes(
    preset.nodes,
    pageBySlug,
    inMenuByPageSlug
  );

  return { header, inMenuByPageSlug };
}

/* ==========================================================================
   APERÇU & CIBLES DES MODÈLES (Étapes 4.4 / 10.1.a)
   --------------------------------------------------------------------------
   Deux besoins complémentaires :

     1. **Aperçu** — libellés affichés dans les cartes de modèles (Back-Office
        et écran de bienvenue), dérivés du catalogue `NAV_PRESETS` ;
     2. **Purge** — les cibles d'un modèle (« page à créer », ancres de
        sous-menu) sont des placeholders **intentionnels** structurant le menu
        avant que les pages n'existent. Ils ne doivent donc PAS être purgés
        comme des liens morts par la synchro client (`PagesNavigationSync`) ni
        par le nettoyage serveur (`pruneOrphanNavigation`) — sinon appliquer un
        modèle sur un site vierge serait aussitôt annulé.
   ========================================================================== */

/** Libellés des items racine d'un modèle (aperçu de carte UI). */
export function presetRootLabels(presetId: NavPresetId): string[] {
  const preset = NAV_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return [];
  }
  return preset.nodes.map((node) => node.label);
}

/** Libellés des items de Niveau 2 d'un modèle, toutes racines confondues. */
export function presetChildLabels(presetId: NavPresetId): string[] {
  const preset = NAV_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return [];
  }
  return preset.nodes.flatMap((node) =>
    (node.children ?? []).map((child) => child.label)
  );
}

/** Hrefs ciblés par le catalogue de modèles (pages résolues ou placeholders). */
const PRESET_TARGET_HREFS: ReadonlySet<string> = (() => {
  const hrefs = new Set<string>();
  const collect = (nodes: readonly NavPresetNode[]): void => {
    for (const node of nodes) {
      hrefs.add(
        node.target.kind === "href"
          ? normalizeHref(node.target.href)
          : normalizeHref(`/${node.target.slug}`)
      );
      if (node.children && node.children.length > 0) {
        collect(node.children);
      }
    }
  };
  for (const preset of NAV_PRESETS) {
    collect(preset.nodes);
  }
  return hrefs;
})();

/** Vrai si le `href` est une cible structurelle d'un modèle Onboarding. */
export function isPresetTargetHref(href: string): boolean {
  return PRESET_TARGET_HREFS.has(normalizeHref(href));
}

/**
 * Vrai si l'entrée est un lien mort **éligible à la purge automatique** :
 * orpheline (page interne inexistante) **et** non intentionnelle (hors cibles
 * de modèles). Les placeholders de modèles sont donc préservés.
 */
export function isPurgableOrphanNavEntry(
  entry: NavMenuEntry,
  slugs: ReadonlySet<string>
): boolean {
  return isOrphanNavEntry(entry, slugs) && !isPresetTargetHref(entry.href);
}
