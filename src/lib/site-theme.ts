/**
 * ============================================================================
 * MODULE « THÈME DU SITE » — domaine pur (sélection d'apparence)
 * ----------------------------------------------------------------------------
 * Choisit l'une des 7 palettes du site public : « Nacre & Éditorial » (défaut,
 * `:root`) plus les 6 presets CSS `.theme-<id>` de `globals.css`.
 *
 * Ce fichier est **pur (aucun "use client", aucun React)** → importable côté
 * serveur (schéma BDD, `normalizeVisualIdentity`, layout SSR) comme côté client
 * (écran `/admin/apparence`, aperçu en direct).
 *
 * Pourquoi un wrapper et non `<html>` : le layout racine `src/app/layout.tsx`
 * rend `<html>` mais n'est **pas async** et ne connaît pas le photographe ;
 * seul `(front-office)/layout.tsx` le résout. Appliquer le thème sur un wrapper
 * `display: contents` de ce layout évite un layout racine async (FOUC +
 * désaccord d'hydratation). Les presets sont donc **auto-suffisants** (règle
 * d'alias partagée, même précédent que `.admin`). Le contrat « appliqué à
 * `<html>` uniquement » du lot presets est révisé ; voir `globals.css`.
 * ============================================================================
 */

/** Identifiants des palettes, dans l'ordre d'affichage de l'écran Apparence. */
export const SITE_THEME_IDS = [
  "nacre",
  "corporate",
  "tech-minimaliste",
  "terre-atelier",
  "sauge-cabinet",
  "galerie-luxe",
  "girly-baby",
] as const;

export type SiteThemeId = (typeof SITE_THEME_IDS)[number];

/** Défaut = « Nacre & Éditorial », déjà porté par `:root` (aucune classe). */
export const DEFAULT_SITE_THEME: SiteThemeId = "nacre";

/** Libellés affichés (l'ordre suit `SITE_THEME_IDS`). */
export const siteThemeLabels: Record<SiteThemeId, string> = {
  nacre: "Nacre & Éditorial (défaut)",
  corporate: "Corporate",
  "tech-minimaliste": "Tech minimaliste",
  "terre-atelier": "Terre & Atelier",
  "sauge-cabinet": "Sauge cabinet",
  "galerie-luxe": "Galerie luxe",
  "girly-baby": "Girly baby",
};

/**
 * Mode de chaque palette. Seul `galerie-luxe` est sombre : le layout public
 * couple alors la classe `dark` pour que les variantes `dark:` des composants
 * se déclenchent (`@custom-variant dark` ne réagit qu'à `.dark`).
 */
export const siteThemeModes: Record<SiteThemeId, "light" | "dark"> = {
  nacre: "light",
  corporate: "light",
  "tech-minimaliste": "light",
  "terre-atelier": "light",
  "sauge-cabinet": "light",
  "galerie-luxe": "dark",
  "girly-baby": "light",
};

/** Vrai si la valeur est un identifiant de palette connu (garde de type). */
export function isSiteThemeId(value: unknown): value is SiteThemeId {
  return (
    typeof value === "string" && (SITE_THEME_IDS as readonly string[]).includes(value)
  );
}

/** Lit une valeur stockée en tolérant : tout identifiant inconnu → défaut. */
export function readSiteTheme(value: unknown): SiteThemeId {
  return isSiteThemeId(value) ? value : DEFAULT_SITE_THEME;
}

/**
 * Classes CSS à poser sur le wrapper portant la palette :
 *   - `""` pour Nacre (déjà `:root`) ;
 *   - `theme-<id>` sinon, complété par ` dark` pour `galerie-luxe`.
 */
export function siteThemeWrapperClasses(id: SiteThemeId): string {
  if (id === DEFAULT_SITE_THEME) {
    return "";
  }
  const themeClass = `theme-${id}`;
  return siteThemeModes[id] === "dark" ? `${themeClass} dark` : themeClass;
}
