/**
 * ============================================================================
 * REPOSITORY SITE_OWNER_PROFILE — persistance du module « Profil » (Étape 8.2)
 * ----------------------------------------------------------------------------
 * Couche **purement serveur** (jamais importée par un Client Component) :
 *   - `getOwnerProfile(photographerId)` : lit la ligne unique du photographe et
 *     décode `data` (JSONB typé `OwnerProfile`) via `OwnerProfileSchema`
 *     (parse tolérant) — retourne `null` si absente ou invalide ;
 *   - `upsertOwnerProfile(photographerId, profile)` : insère ou remplace la
 *     ligne (PK = photographer_id) et met à jour `updated_at`.
 *
 * Aucune lecture publique : la marque (Header/Footer) est injectée côté serveur
 * (rôle service) via `loadInitialData` — RLS owner-only posée en migration 0003.
 *
 * Référence : plans/ROADMAP-8.2-owner-profile-persistence.md §D-2
 * ============================================================================
 */

import { eq, sql } from "drizzle-orm";

import type { OwnerProfile } from "../../lib/owner-profile";
import { OwnerProfileSchema } from "../../lib/schemas/persistence";
import { getDatabase } from "../index";
import { siteOwnerProfile } from "../schema";

/** Décode un `data` JSONB vers un `OwnerProfile` complet (tolérant). */
function decodeOwnerProfile(data: unknown): OwnerProfile | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const parsed = OwnerProfileSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Lecture du profil d'un photographe (ou `null` si aucune ligne). */
export async function getOwnerProfile(
  photographerId: string
): Promise<OwnerProfile | null> {
  const database = getDatabase();
  const rows = await database
    .select({ data: siteOwnerProfile.data })
    .from(siteOwnerProfile)
    .where(eq(siteOwnerProfile.photographerId, photographerId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return decodeOwnerProfile(row.data);
}

/** Écrit (insert ou upsert) le profil complet d'un photographe. */
export async function upsertOwnerProfile(
  photographerId: string,
  profile: OwnerProfile
): Promise<void> {
  const parsed = decodeOwnerProfile(profile);
  if (!parsed) {
    throw new Error("Profil invalide (validation OwnerProfileSchema refusée)");
  }
  const database = getDatabase();
  await database
    .insert(siteOwnerProfile)
    .values({
      photographerId,
      data: parsed,
    })
    .onConflictDoUpdate({
      target: siteOwnerProfile.photographerId,
      set: {
        data: sql`excluded.data`,
        updatedAt: sql`now()`,
      },
    });
}
