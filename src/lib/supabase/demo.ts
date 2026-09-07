/**
 * ============================================================================
 * MODE DÉMO / CONFIG SUPABASE (Étape 5.4)
 * ----------------------------------------------------------------------------
 * Détecte si Supabase Auth est réellement configuré (variables
 * `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` **valides** —
 * les valeurs factices de `.env.example` sont ignorées).
 *
 * - `true`  → auth activée : middleware de protection `/admin`, login requis,
 *            repositories scopés par session ;
 * - `false` → **mode démo** : le middleware laisse passer, `/admin` reste
 *            accessible et les données utilisent le tenant démo
 *            (`DEMO_PROFILE_ID`).
 * ============================================================================
 */

/** Valeurs factices de `.env.example` — jamais considérées comme configurées. */
const PLACEHOLDER_URL = "https://your-project.supabase.co";
const PLACEHOLDER_ANON = "your-anon-key-here";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/** Retourne la config Supabase si valide, sinon `null` (mode démo). */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const realUrl =
    url.startsWith("https://") && !url.includes(PLACEHOLDER_URL);
  const realKey = anonKey !== "" && anonKey !== PLACEHOLDER_ANON;

  if (!realUrl || !realKey) {
    return null;
  }
  return { url, anonKey };
}

/** true si Supabase Auth est configuré (mode authentifié). */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/**
 * true si Supabase Storage est disponible (mêmes clés publiques que Auth —
 * le bucket `portfolio-media` est créé par la migration 0002).
 */
export function isStorageConfigured(): boolean {
  return isSupabaseConfigured();
}
