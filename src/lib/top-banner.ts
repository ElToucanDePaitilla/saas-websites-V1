/**
 * ============================================================================
 * MODULE « MINI-BANDEAU ALERTE / PROMO » — domaine pur
 * ----------------------------------------------------------------------------
 * Réglage **global du site** (1 ligne par photographe), rendu par le layout
 * front-office **au-dessus du Header public**. Ce n'est PAS une famille de
 * module Page Builder : il n'existe donc ni `PageModuleType`, ni entrée de
 * `moduleCatalog`, ni passage par `PageModuleRenderer` — le bandeau n'appartient
 * à aucune page et s'affiche sur toutes.
 *
 * Ce fichier est **pur (aucun "use client", aucun React)** → importable côté
 * serveur (schéma BDD, repository/`normalizeTopBanner`) comme côté client.
 * Le store partagé + le hook vivent dans `top-banner-store.ts`.
 *
 * Choix de réutilisation (plutôt que des réglages dédiés) :
 *   - les couleurs passent par `BannerColorSettings` / `BannerThemeToken`
 *     (thème ou valeur libre) : dupliquer une seconde pipette aurait créé deux
 *     palettes à maintenir — dont une seule aurait reçu les correctifs ;
 *   - le lien suit la convention du site (`NavLink`, mode **dérivé de `href`**),
 *     donc **aucun booléen « nouvel onglet »** à désynchroniser.
 *
 * Référence : .kilo/plans/1789748020058-marquee-ajustements-plan.md
 * ============================================================================
 */

import {
  bannerThemeTokenOrder,
  type BannerColorSettings,
  type BannerThemeToken,
} from "./pages";

/** Mode d'affichage du message : ruban qui défile ou texte fixe. */
export type TopBannerTextMode = "marquee" | "static";

/** Graisses autorisées (chaînes : posées telles quelles dans le CSS). */
export type TopBannerFontWeight = "400" | "500" | "600" | "700";

/** Interlettrage — nommé, traduit en une valeur `em` par le rendu. */
export type TopBannerLetterSpacing = "tight" | "normal" | "wide" | "wider";

/**
 * Gap optionnel autour de la barre : quand il est désactivé, sa valeur est
 * **conservée** (le photographe la retrouve s'il réactive), mais elle ne compte
 * ni dans la hauteur totale, ni dans le rendu.
 */
export interface TopBannerGapSetting {
  enabled: boolean;
  /** Valeur en px — bornée 0..15. */
  value: number;
}

/** Configuration complète du bandeau global. */
export interface TopBanner {
  enabled: boolean;
  /** Message affiché — une seule chaîne (le texte **est** le nom accessible). */
  text: string;
  /** Hauteur de la barre, en px — bornée 15..50 (défaut 32). */
  height: number;
  gapTop: TopBannerGapSetting;
  gapBottom: TopBannerGapSetting;
  gapColor: BannerColorSettings;
  background: BannerColorSettings;
  textColor: BannerColorSettings;
  /** Taille du message, en px — bornée 11..16 (défaut 12). */
  fontSize: number;
  fontWeight: TopBannerFontWeight;
  letterSpacing: TopBannerLetterSpacing;
  textMode: TopBannerTextMode;
  /** Durée d'un cycle de défilement, en secondes — bornée 20..60 (défaut 24). */
  durationSeconds: number;
  linkEnabled: boolean;
  linkHref: string;
}

/**
 * Défauts proposés pour les couleurs : fond « anthracite » et texte « fond du
 * thème ». Ce couple garantit un contraste dans les deux thèmes, sans figer de
 * valeur hexadécimale (les jetons suivent la charte).
 */
export const DEFAULT_TOP_BANNER: TopBanner = {
  enabled: false,
  text: "",
  height: 32,
  gapTop: { enabled: false, value: 0 },
  gapBottom: { enabled: false, value: 0 },
  gapColor: { source: "theme", token: "bg-color", value: "#FFFFFF" },
  background: { source: "theme", token: "text-color", value: "#1E293B" },
  textColor: { source: "theme", token: "bg-color", value: "#FFFFFF" },
  fontSize: 12,
  fontWeight: "500",
  letterSpacing: "normal",
  textMode: "marquee",
  durationSeconds: 24,
  linkEnabled: false,
  linkHref: "",
};

/** Ordre + libellés des modes (sélecteur d'édition). */
export const topBannerTextModeOrder: TopBannerTextMode[] = [
  "marquee",
  "static",
];
export const topBannerTextModeLabels: Record<TopBannerTextMode, string> = {
  marquee: "Défilant",
  static: "Statique",
};

/** Ordre + libellés des graisses. */
export const topBannerFontWeightOrder: TopBannerFontWeight[] = [
  "400",
  "500",
  "600",
  "700",
];
export const topBannerFontWeightLabels: Record<TopBannerFontWeight, string> = {
  "400": "Normal (400)",
  "500": "Médium (500)",
  "600": "Semi-gras (600)",
  "700": "Gras (700)",
};

/** Ordre + libellés des interlettrages. */
export const topBannerLetterSpacingOrder: TopBannerLetterSpacing[] = [
  "tight",
  "normal",
  "wide",
  "wider",
];
export const topBannerLetterSpacingLabels: Record<
  TopBannerLetterSpacing,
  string
> = {
  tight: "Serré",
  normal: "Normal (défaut)",
  wide: "Large",
  wider: "Très large",
};

/** Valeur CSS (`em`) associée à chaque interlettrage. */
export const TOP_BANNER_LETTER_SPACING_VALUE: Record<
  TopBannerLetterSpacing,
  string
> = {
  tight: "-0.01em",
  normal: "0.02em",
  wide: "0.08em",
  wider: "0.14em",
};

/** Bornes de saisie — partagées par l'éditeur et le résolveur. */
export const TOP_BANNER_LIMITS = {
  heightMin: 15,
  heightMax: 50,
  fontSizeMin: 11,
  fontSizeMax: 16,
  gapMax: 15,
  durationMin: 20,
  durationMax: 60,
} as const;

/** Nouvelle configuration par défaut, **clonée** (aucune référence partagée). */
export function createDefaultTopBanner(): TopBanner {
  return {
    ...DEFAULT_TOP_BANNER,
    gapTop: { ...DEFAULT_TOP_BANNER.gapTop },
    gapBottom: { ...DEFAULT_TOP_BANNER.gapBottom },
    gapColor: { ...DEFAULT_TOP_BANNER.gapColor },
    background: { ...DEFAULT_TOP_BANNER.background },
    textColor: { ...DEFAULT_TOP_BANNER.textColor },
  };
}

/** Hauteur **totale** occupée à l'écran (barre + gaps réellement actifs). */
export function topBannerTotalHeight(banner: TopBanner): number {
  const top = banner.gapTop.enabled ? banner.gapTop.value : 0;
  const bottom = banner.gapBottom.enabled ? banner.gapBottom.value : 0;
  return banner.height + top + bottom;
}

/**
 * true si le bandeau doit occuper l'écran. Un message vide ne produit pas de
 * barre vide (l'offset du Header reste alors à 0) : c'est le même pari que
 * `isVisualIdentityEmpty` — l'absence de contenu se voit, elle ne se compense
 * pas par un cadre.
 */
export function topBannerVisible(banner: TopBanner): boolean {
  return banner.enabled && banner.text.trim() !== "";
}

/* --------------------------------------------------------------------------
   NORMALISATION TOLÉRANTE (BDD) — champ par champ, jamais d'exception.
   Aucun texte n'est ressuscité : la *forme* est complétée, pas le *contenu*.
   -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Lit un nombre borné avec repli sur le défaut (valeur non finie ignorée). */
function readBoundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

/** Lit une chaîne avec repli (jamais de contenu inventé). */
function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function isTopBannerTextMode(value: unknown): value is TopBannerTextMode {
  return value === "marquee" || value === "static";
}

function isTopBannerFontWeight(
  value: unknown
): value is TopBannerFontWeight {
  return (
    typeof value === "string" &&
    (topBannerFontWeightOrder as string[]).includes(value)
  );
}

function isTopBannerLetterSpacing(
  value: unknown
): value is TopBannerLetterSpacing {
  return (
    typeof value === "string" &&
    (topBannerLetterSpacingOrder as string[]).includes(value)
  );
}

function isBannerThemeToken(value: unknown): value is BannerThemeToken {
  return (
    typeof value === "string" &&
    (bannerThemeTokenOrder as string[]).includes(value)
  );
}

/** Lit un gap : le booléen est typé, la valeur reste bornée même désactivée. */
function readGapSetting(
  raw: unknown,
  fallback: TopBannerGapSetting
): TopBannerGapSetting {
  const record = isRecord(raw) ? raw : {};
  return {
    enabled:
      typeof record.enabled === "boolean" ? record.enabled : fallback.enabled,
    value: readBoundedNumber(
      record.value,
      fallback.value,
      0,
      TOP_BANNER_LIMITS.gapMax
    ),
  };
}

/**
 * Lit une couleur (thème ou libre).
 *
 * Copie de la convention du bandeau `cta-banner` : `source` est réduite aux
 * deux valeurs connues, le jeton est validé contre la liste du thème, et la
 * valeur libre n'est retenue que si elle est renseignée. Une couleur `custom`
 * sans valeur retombe donc sur le défaut, jamais sur une chaîne vide qui
 * peindrait un fond transparent par accident.
 */
function readColorSetting(
  raw: unknown,
  fallback: BannerColorSettings
): BannerColorSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    source: record.source === "custom" ? "custom" : "theme",
    token: isBannerThemeToken(record.token) ? record.token : fallback.token,
    value:
      typeof record.value === "string" && record.value.trim() !== ""
        ? record.value
        : fallback.value,
  };
}

/** Normalise une valeur stockée (JSONB) vers une configuration complète. */
export function normalizeTopBanner(raw: unknown): TopBanner {
  if (!isRecord(raw)) {
    return createDefaultTopBanner();
  }
  const defaults = DEFAULT_TOP_BANNER;
  return {
    enabled:
      typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
    text: readString(raw.text, ""),
    height: readBoundedNumber(
      raw.height,
      defaults.height,
      TOP_BANNER_LIMITS.heightMin,
      TOP_BANNER_LIMITS.heightMax
    ),
    gapTop: readGapSetting(raw.gapTop, defaults.gapTop),
    gapBottom: readGapSetting(raw.gapBottom, defaults.gapBottom),
    gapColor: readColorSetting(raw.gapColor, defaults.gapColor),
    background: readColorSetting(raw.background, defaults.background),
    textColor: readColorSetting(raw.textColor, defaults.textColor),
    fontSize: readBoundedNumber(
      raw.fontSize,
      defaults.fontSize,
      TOP_BANNER_LIMITS.fontSizeMin,
      TOP_BANNER_LIMITS.fontSizeMax
    ),
    fontWeight: isTopBannerFontWeight(raw.fontWeight)
      ? raw.fontWeight
      : defaults.fontWeight,
    letterSpacing: isTopBannerLetterSpacing(raw.letterSpacing)
      ? raw.letterSpacing
      : defaults.letterSpacing,
    textMode: isTopBannerTextMode(raw.textMode)
      ? raw.textMode
      : defaults.textMode,
    durationSeconds: readBoundedNumber(
      raw.durationSeconds,
      defaults.durationSeconds,
      TOP_BANNER_LIMITS.durationMin,
      TOP_BANNER_LIMITS.durationMax
    ),
    linkEnabled:
      typeof raw.linkEnabled === "boolean"
        ? raw.linkEnabled
        : defaults.linkEnabled,
    linkHref: readString(raw.linkHref, ""),
  };
}
