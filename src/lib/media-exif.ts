/**
 * ============================================================================
 * EXIF — utilitaires de mise en forme (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Convertisseur pur d'un objet EXIF brut (colonne `media.exif_data` ou données
 * embarquées) vers des **puces lisibles** : « 50 mm », « f/1.8 », « 1/200 s »,
 * « ISO 100 », boîtier, objectif. Client-safe (aucun import serveur/BDD).
 *
 * Référence : plans/ROADMAP-6.2-gallery-optimization.md §0.2
 * ============================================================================
 */

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Convertit une valeur d'exposition en chaîne « 1/200 s » / « 2 s ». */
function formatExposure(value: number): string | null {
  if (value >= 1) return `${value} s`;
  const divisor = Math.round(1 / value);
  if (divisor >= 1) return `1/${divisor} s`;
  return null;
}

/**
 * Retourne les puces EXIF lisibles depuis une donnée EXIF brute.
 * Vide si aucune information exploitable (rendu sans EXIF — jamais bloquant).
 */
export function exifChipsFromData(exifData: unknown): string[] {
  if (!exifData || typeof exifData !== "object") {
    return [];
  }
  const raw = exifData as Record<string, unknown>;
  const chips: string[] = [];

  const focal = asNumber(raw.FocalLength);
  if (focal !== null) chips.push(`Focale ${focal} mm`);

  const fNumber = asNumber(raw.FNumber);
  if (fNumber !== null) chips.push(`f/${fNumber}`);

  const exposure =
    asNumber(raw.ExposureTime) ??
    asNumber(raw.exposureTime) ??
    asNumber(raw.exposure_time);
  const exposureText = exposure !== null ? formatExposure(exposure) : null;
  if (exposureText) chips.push(exposureText);

  const iso = asNumber(raw.ISO);
  if (iso !== null) chips.push(`ISO ${iso}`);

  const make = asString(raw.Make);
  const model = asString(raw.Model);
  const body = model || make;
  if (body) chips.push(body);

  const lens = asString(raw.LensModel);
  if (lens) chips.push(`Objectif ${lens}`);

  return chips.slice(0, 6);
}

/** Joins les puces en une ligne « 50 mm · f/1.8 · 1/200 s · ISO 100 ». */
export function exifLineFromData(exifData: unknown): string {
  return exifChipsFromData(exifData).join(" · ");
}
