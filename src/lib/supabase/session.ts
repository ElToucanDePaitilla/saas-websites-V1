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

import { getDatabase } from "@/db";
import { DEMO_PROFILE_ID } from "@/db/constants";
import { profiles } from "@/db/schema";

import { isSupabaseConfigured } from "./demo";
import { createClient } from "./server";

/**
 * Garantit l'existence du profil `profiles(id = auth.uid())` — requis par les
 * FK des écritures (`pages`, `media`, `navigation_entries`). Upsert idempotent
 * (utile si l'utilisateur a été créé avant la migration 0001 / son trigger).
 * Échec toléré (lectures/seed démo inchangées).
 */
export async function ensurePhotographerProfile(
  id: string,
  email: string | null
): Promise<void> {
  try {
    const database = getDatabase();
    await database
      .insert(profiles)
      .values({
        id,
        email: email && email.trim() !== "" ? email : `auth-${id}@placeholder`,
        displayName: "",
      })
      .onConflictDoNothing({ target: profiles.id });
  } catch {
    // BDD indisponible → ignoré (fallback seed/démo).
  }
}

/** Retourne l'id du photographe authentifié (`auth.uid()`), sinon `null`. */
export async function getCurrentPhotographerId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  // Profil garanti avant toute écriture scopée (corrige la FK manquante).
  await ensurePhotographerProfile(user.id, user.email ?? null);
  return user.id;
}

/**
 * Retourne l'id du photographe à utiliser : celui de la session quand il est
 * authentifié, sinon le **tenant de démo** (lecture publique / mode démo).
 */
export async function resolvePhotographerId(): Promise<string> {
  const photographerId = await getCurrentPhotographerId();
  return photographerId ?? DEMO_PROFILE_ID;
}

/**
 * Id du site à afficher côté **public** : si un photographe est connecté dans
 * la même session, son site (contenu modifié visible sur `/` et `/[slug]`) ;
 * sinon repli tenant de démo (mode démo / visiteur anonyme).
 */
export async function resolvePublicPhotographerId(): Promise<string> {
  const photographerId = await getCurrentPhotographerId();
  return photographerId ?? DEMO_PROFILE_ID;
}
