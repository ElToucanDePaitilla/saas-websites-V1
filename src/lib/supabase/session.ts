/**
 * ============================================================================
 * SESSION — résolution du photographe courant (Étape 5.4)
 * ----------------------------------------------------------------------------
 * Helpers **serveur** utilisés par les layouts, le loader d'hydratation et les
 * Route Handlers pour **scooper les données au photographe authentifié** :
 * `auth.uid()` = `profiles.id` (pattern 5.4).
 *
 * - `getCurrentPhotographerId()` : `auth.uid()` si connecté, sinon `null` ;
 * - `resolvePhotographerId()` : id authentifié **ou repli tenant démo** en
 *   mode non connecté / démo (accès public & démonstration).
 * ============================================================================
 */

import { DEMO_PROFILE_ID } from "@/db/constants";

import { isSupabaseConfigured } from "./demo";
import { createClient } from "./server";

/** Retourne l'id du photographe authentifié (`auth.uid()`), sinon `null`. */
export async function getCurrentPhotographerId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Retourne l'id du photographe à utiliser : celui de la session quand il est
 * authentifié, sinon le **tenant de démo** (lecture publique / mode démo).
 */
export async function resolvePhotographerId(): Promise<string> {
  const photographerId = await getCurrentPhotographerId();
  return photographerId ?? DEMO_PROFILE_ID;
}
