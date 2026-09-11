import { pageHrefFor, type PageModule, type SitePage } from "@/lib/pages";

/**
 * ============================================================================
 * CIBLES DE LIEN — helpers purs (Étape 11.2)
 * ----------------------------------------------------------------------------
 * Alimente le sélecteur de lien du CTA (galeries) sans jamais dépendre de React :
 * les fonctions sont pures, testables et utilisables côté client uniquement
 * (elles consomment les données déjà chargées par les stores).
 *
 * Principe fondateur (D-2 du plan 11.2) : **le mode d'une cible est DÉRIVÉ de la
 * chaîne `href`, jamais stocké**. Conséquences :
 *   - aucune migration : `GalleryCtaSettings.href` reste une simple chaîne ;
 *   - aucun état « mode ≠ valeur » possible ;
 *   - un `href` orphelin (slug renommé, ancre supprimée) retombe en `custom`
 *     (champ libre) au lieu d'être perdu silencieusement.
 *
 * Vocabulaire (D-3 révisée / D-10) : on nomme la **cible**, jamais une
 * hiérarchie. Les mots « sous-page », « niveau 1 », « niveau 2 » sont proscrits
 * dans l'UI : « Niveau 1/2 » est le vocabulaire du module Navigation et qualifie
 * une position dans un menu, pas une page.
 *
 * Référence : plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md §2.1
 * ============================================================================
 */

/** Mode de destination déduit d'un `href`. */
export type CtaTargetMode = "none" | "page" | "anchor" | "custom";

/** Cible « page du site » proposée par le premier menu. */
export type PageTarget = {
  /** Valeur stockée dans `href` (ex. `/prestations`, `/` pour l'accueil). */
  href: string;
  /** Libellé affiché (titre de la page). */
  label: string;
  /** Titre de la page — clé de tri et de regroupement. */
  pageTitle: string;
  /** Page en brouillon : signalée, jamais filtrée (D-8). */
  draft: boolean;
};

/** Cible « section de page » (ancre d'un module) proposée par le second menu. */
export type AnchorTarget = {
  /** `#ancre` si la section est sur la page courante, sinon `/slug#ancre`. */
  href: string;
  /** Libellé affiché (titre lisible de la section, jamais l'identifiant). */
  label: string;
  /** Identifiant de la page hôte — clé de regroupement fiable. */
  pageId: string;
  /** Titre de la page hôte — libellé du groupe. */
  pageTitle: string;
  /** Identifiant d'ancre brut, sans `#` (ex. `galerie-mariage`). */
  anchorId: string;
  /** Section de la page en cours d'édition (suffixe « (page en cours) »). */
  isCurrentPage: boolean;
  /** Section masquée du site public : signalée, jamais filtrée (D-8). */
  hidden: boolean;
  /** Page hôte en brouillon : signalée, jamais filtrée (D-8). */
  draft: boolean;
};

/** Index des cibles connues, utilisé pour dériver le mode d'un `href`. */
export type LinkTargetIndex = {
  pages: PageTarget[];
  anchors: AnchorTarget[];
};

/** Aperçu lisible de la destination choisie (D-11). */
export type LinkTargetPreview = {
  /** Phrase de confirmation affichée sous les menus. */
  text: string;
  /** Avertissement (brouillon, section masquée, cible introuvable) — ou null. */
  warning: string | null;
};

/**
 * Comparateur alphabétique français : insensible à la casse et aux accents,
 * avec tri numérique (`2024` avant `2025`, `page-2` avant `page-10`).
 */
const labelCollator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});

/** Compare deux libellés en français (accents et nombres gérés). */
export function compareLabelFr(left: string, right: string): number {
  return labelCollator.compare(left, right);
}

/** URL externe ou protocole d'action (jamais résolue en cible interne). */
const EXTERNAL_HREF_PATTERN = /^(https?:\/\/|mailto:|tel:)/i;

/** true si le `href` est externe (`https://`, `mailto:`, `tel:`). */
export function isExternalHref(href: string): boolean {
  return EXTERNAL_HREF_PATTERN.test(href.trim());
}

/**
 * Cibles « page du site » : toutes les pages du store, triées par titre.
 * L'accueil est résolu via `pageHrefFor` (→ `/`), ce qui évite le piège du
 * slug d'un ancien accueil démis (`/accueil-ancien-xxxx`).
 */
export function collectPageTargets(
  pages: readonly SitePage[]
): PageTarget[] {
  return pages
    .map<PageTarget>((page) => ({
      href: pageHrefFor(page),
      label: page.title.trim() !== "" ? page.title : page.menuTitle,
      pageTitle: page.title,
      draft: page.status === "draft",
    }))
    .sort((left, right) => compareLabelFr(left.label, right.label));
}

/**
 * Cibles « section de page » : toutes les ancres non vides de tous les modules,
 * dédoublonnées par page, triées par page puis par libellé de section.
 *
 * La page courante (`currentPageId`) produit une ancre locale (`#ancre`) ;
 * toute autre page produit un chemin absolu (`/slug#ancre`).
 */
export function collectAnchorTargets(
  pages: readonly SitePage[],
  modulesByPage: Readonly<Record<string, readonly PageModule[]>>,
  currentPageId: string | null
): AnchorTarget[] {
  const targets: AnchorTarget[] = [];

  for (const page of pages) {
    const modules = modulesByPage[page.id] ?? [];
    const seenAnchors = new Set<string>();
    const isCurrentPage = page.id === currentPageId;
    const pageHref = pageHrefFor(page);

    for (const pageModule of modules) {
      const anchorId = pageModule.anchorId.trim();
      // Ancre vide (module sans repère) ou doublon dans la même page : ignoré.
      if (anchorId === "" || seenAnchors.has(anchorId)) {
        continue;
      }
      seenAnchors.add(anchorId);

      const sectionLabel =
        pageModule.title.trim() !== "" ? pageModule.title.trim() : anchorId;

      targets.push({
        href: isCurrentPage ? `#${anchorId}` : `${pageHref}#${anchorId}`,
        label: sectionLabel,
        pageId: page.id,
        pageTitle: page.title,
        anchorId,
        isCurrentPage,
        hidden: pageModule.hidden === true,
        draft: page.status === "draft",
      });
    }
  }

  return targets.sort((left, right) => {
    const byPage = compareLabelFr(left.pageTitle, right.pageTitle);
    return byPage !== 0 ? byPage : compareLabelFr(left.label, right.label);
  });
}

/**
 * Déduit le mode d'un `href` à partir des cibles connues (D-2 et D-5).
 *
 * | Forme de `href`                                  | Mode     |
 * |--------------------------------------------------|----------|
 * | vide                                             | `none`   |
 * | `https://…`, `mailto:…`, `tel:…`                 | `custom` |
 * | présent dans les ancres connues                  | `anchor` |
 * | présent dans les pages connues                   | `page`   |
 * | toute autre valeur (cible orpheline)             | `custom` |
 *
 * Le repli en `custom` est volontaire : le champ libre affiche alors la valeur
 * telle quelle, et rien n'est perdu.
 */
export function detectCtaTargetMode(
  href: string,
  index: LinkTargetIndex
): CtaTargetMode {
  const value = href.trim();
  if (value === "") {
    return "none";
  }
  if (isExternalHref(value)) {
    return "custom";
  }
  if (index.anchors.some((target) => target.href === value)) {
    return "anchor";
  }
  if (index.pages.some((target) => target.href === value)) {
    return "page";
  }
  return "custom";
}

/**
 * Décrit en clair la destination choisie (D-11) — le photographe n'a pas à
 * déchiffrer `/portfolio#mariages`.
 */
export function describeLinkTarget(
  href: string,
  index: LinkTargetIndex
): LinkTargetPreview {
  const value = href.trim();

  if (value === "") {
    return { text: "Aucune destination choisie.", warning: null };
  }

  if (isExternalHref(value)) {
    return {
      text: "Lien externe : le bouton s'ouvrira dans un nouvel onglet.",
      warning: null,
    };
  }

  const anchor = index.anchors.find((target) => target.href === value);
  if (anchor) {
    const warnings: string[] = [];
    if (anchor.draft) {
      warnings.push("la page est en brouillon");
    }
    if (anchor.hidden) {
      warnings.push("cette section est masquée sur le site public");
    }
    return {
      text: `Vous serez emmené vers : ${anchor.pageTitle} › ${anchor.label}`,
      warning:
        warnings.length > 0
          ? `Attention : ${warnings.join(" et ")}.`
          : null,
    };
  }

  const page = index.pages.find((target) => target.href === value);
  if (page) {
    return {
      text: `Vous serez emmené vers : ${page.label}`,
      warning: page.draft
        ? "Attention : cette page est en brouillon, le bouton ne fonctionnera pas sur le site public."
        : null,
    };
  }

  return {
    text: `Lien personnalisé : ${value}`,
    warning:
      "Cette destination n'existe plus dans le site (page renommée ou section supprimée). Le lien a été conservé tel quel.",
  };
}
