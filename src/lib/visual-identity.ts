/**
 * ============================================================================
 * MODULE « IDENTITÉ VISUELLE / LOGO » — domaine pur (Étape 9.1 + 9.1.a)
 * ----------------------------------------------------------------------------
 * Configuration **100 % manuelle** de l'espace marque du Header, en deux modes
 * exclusifs (`text` | `logo`). Depuis l'amendement 9.1.a, **chaque ligne de
 * texte possède ses propres paramètres** (valeur, couleur, taille, graisse).
 *
 * Ce fichier est **pur (aucun "use client", aucun React)** → importable côté
 * serveur (schéma BDD, repository/`normalizeVisualIdentity`) comme côté client.
 * Le store partagé + le hook vivent dans `visual-identity-store.ts`.
 * ============================================================================
 */

export type VisualIdentityMode = "text" | "logo";
export type VisualIdentityTextSize =
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "xxlarge";
export type VisualIdentityFontWeight = "400" | "600" | "700";

/** Une ligne de texte avec ses **propres** paramètres typographiques. */
export interface VisualIdentityTextLine {
  value: string;
  color: string;
  size: VisualIdentityTextSize;
  weight: VisualIdentityFontWeight;
}

/** Les deux lignes (paramètres distincts). */
export interface VisualIdentityTextConfig {
  line1: VisualIdentityTextLine;
  line2: VisualIdentityTextLine;
}

/** Logo téléversé (mode « logo »). */
export interface VisualIdentityLogoConfig {
  url: string;
  altText: string;
}

/** Configuration complète de l'espace marque. */
export interface VisualIdentity {
  mode: VisualIdentityMode;
  text: VisualIdentityTextConfig;
  logo: VisualIdentityLogoConfig;
}

/** Défauts : champs **vierges** (aucun pré-remplissage depuis le Profil). */
export const DEFAULT_VISUAL_IDENTITY: VisualIdentity = {
  mode: "text",
  text: {
    line1: { value: "", color: "#1E293B", size: "medium", weight: "600" },
    line2: { value: "", color: "#1E293B", size: "medium", weight: "400" },
  },
  logo: { url: "", altText: "" },
};

/** Ordre + libellés des modes (sélecteur segmenté). */
export const visualIdentityModeOrder: VisualIdentityMode[] = ["text", "logo"];
export const visualIdentityModeLabels: Record<VisualIdentityMode, string> = {
  text: "Texte",
  logo: "Logo",
};

/** Ordre + libellés des tailles. */
export const textSizeOrder: VisualIdentityTextSize[] = [
  "small",
  "medium",
  "large",
  "xlarge",
  "xxlarge",
];
export const textSizeLabels: Record<VisualIdentityTextSize, string> = {
  small: "Petite",
  medium: "Moyenne (défaut)",
  large: "Grande",
  xlarge: "Très grande",
  xxlarge: "Énorme",
};

/** Ordre + libellés des graisses. */
export const fontWeightOrder: VisualIdentityFontWeight[] = ["400", "600", "700"];
export const fontWeightLabels: Record<VisualIdentityFontWeight, string> = {
  "400": "Normal (400)",
  "600": "Semi-gras (600)",
  "700": "Gras (700)",
};

/**
 * Métriques px **par ligne** — échelle 5 niveaux calibrée (amendement 9.1.b) :
 *   - Ligne 1 « Moyenne » = 18 px ≈ +25 % du texte du menu (14 px, `text-sm`) ;
 *   - Ligne 2 = Ligne 1 ÷ 1,2 (⇒ Ligne 1 ≈ +20 % vs Ligne 2).
 */
export const TEXT_LINE_PX: Record<
  "line1" | "line2",
  Record<VisualIdentityTextSize, number>
> = {
  line1: { small: 14, medium: 18, large: 22, xlarge: 25, xxlarge: 30 },
  line2: { small: 12, medium: 15, large: 18, xlarge: 21, xxlarge: 25 },
};

/** Espacement (letter-spacing) calculé automatiquement selon la taille. */
export const TEXT_SIZE_LETTER_SPACING: Record<
  VisualIdentityTextSize,
  string
> = {
  small: "0.02em",
  medium: "0.03em",
  large: "0.035em",
  xlarge: "0.04em",
  xxlarge: "0.045em",
};

/** Contraintes (UI + logo) — alignées sur la fiche technique. */
export const VISUAL_IDENTITY_LIMITS = {
  line1Max: 35,
  line2Max: 45,
  logoMaxBytes: 2 * 1024 * 1024, // 2 Mo
  logoMaxWidth: 200,
  logoMaxHeight: 60,
} as const;

/** Fond **neutre médian** de l'aperçu (ni blanc ni noir) — lisibilité garantie. */
export const VISUAL_IDENTITY_PREVIEW_BG = "#808080";

/** Palette **neutres** (rangée 1 du color picker). */
export const VISUAL_IDENTITY_NEUTRALS: string[] = [
  "#FFFFFF",
  "#E5E7EB",
  "#9CA3AF",
  "#6B7280",
  "#374151",
  "#1E293B",
  "#111827",
  "#000000",
];

/** Palette **accents** (rangée 2 du color picker). */
export const VISUAL_IDENTITY_ACCENTS: string[] = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#10B981",
  "#84CC16",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
];

/** Palette complète (neutres + accents) — compat/usage simple. */
export const VISUAL_IDENTITY_COLOR_PRESETS: string[] = [
  ...VISUAL_IDENTITY_NEUTRALS,
  ...VISUAL_IDENTITY_ACCENTS,
];

/** Vrai si rien n'est configuré → le Header retombe sur `siteName`. */
export function isVisualIdentityEmpty(value: VisualIdentity): boolean {
  if (value.mode === "logo") {
    return value.logo.url.trim() === "";
  }
  return (
    value.text.line1.value.trim() === "" && value.text.line2.value.trim() === ""
  );
}

/* --------------------------------------------------------------------------
   NORMALISATION TOLÉRANTE (BDD) — gère l'ancienne forme plate (v1) et la
   nouvelle forme par ligne (v2), champ par champ, sans jamais lever.
   -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readSize(value: unknown, fallback: VisualIdentityTextSize): VisualIdentityTextSize {
  return typeof value === "string" &&
    (textSizeOrder as string[]).includes(value)
    ? (value as VisualIdentityTextSize)
    : fallback;
}

function readWeight(
  value: unknown,
  fallback: VisualIdentityFontWeight
): VisualIdentityFontWeight {
  return value === "400" || value === "600" || value === "700"
    ? value
    : fallback;
}

function readLine(
  raw: unknown,
  fallback: VisualIdentityTextLine
): VisualIdentityTextLine {
  if (!isRecord(raw)) {
    return fallback;
  }
  return {
    value: typeof raw.value === "string" ? raw.value : fallback.value,
    color: typeof raw.color === "string" ? raw.color : fallback.color,
    size: readSize(raw.size, fallback.size),
    weight: readWeight(raw.weight, fallback.weight),
  };
}

/** Normalise une valeur stockée (JSONB) vers la forme v2 « par ligne ». */
export function normalizeVisualIdentity(raw: unknown): VisualIdentity {
  if (!isRecord(raw)) {
    return DEFAULT_VISUAL_IDENTITY;
  }
  const mode: VisualIdentityMode = raw.mode === "logo" ? "logo" : "text";
  const textRaw = isRecord(raw.text) ? raw.text : {};
  // Forme v1 (plate) : `text.line1`/`text.line2` = chaînes + styles partagés.
  const isLegacy = typeof textRaw.line1 === "string";
  const legacyStyle = {
    color:
      typeof textRaw.color === "string"
        ? textRaw.color
        : DEFAULT_VISUAL_IDENTITY.text.line1.color,
    size: readSize(textRaw.size, DEFAULT_VISUAL_IDENTITY.text.line1.size),
    weight: readWeight(
      textRaw.weight,
      DEFAULT_VISUAL_IDENTITY.text.line1.weight
    ),
  };
  const line1: VisualIdentityTextLine = isLegacy
    ? { value: textRaw.line1 as string, ...legacyStyle }
    : readLine(textRaw.line1, DEFAULT_VISUAL_IDENTITY.text.line1);
  const line2: VisualIdentityTextLine = isLegacy
    ? {
        value: typeof textRaw.line2 === "string" ? textRaw.line2 : "",
        ...legacyStyle,
      }
    : readLine(textRaw.line2, DEFAULT_VISUAL_IDENTITY.text.line2);

  const logoRaw = isRecord(raw.logo) ? raw.logo : {};
  return {
    mode,
    text: { line1, line2 },
    logo: {
      url: typeof logoRaw.url === "string" ? logoRaw.url : "",
      altText: typeof logoRaw.altText === "string" ? logoRaw.altText : "",
    },
  };
}
