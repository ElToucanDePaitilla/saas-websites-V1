/**
 * ============================================================================
 * REPOSITORY SITE_VISUAL_IDENTITY — « Identité visuelle / Logo » (Étape 9.1)
 * ----------------------------------------------------------------------------
 * Couche **purement serveur** (jamais importée par un Client Component) :
 *   - `getVisualIdentity(photographerId)` : lit la ligne unique du photographe
 *     et décode `data` (JSONB typé `VisualIdentity`) via `VisualIdentitySchema`
 *     (parse tolérant) — retourne `null` si absente ou invalide ;
 *   - `upsertVisualIdentity(photographerId, value)` : insère ou remplace la ligne
 *     (PK = photographer_id) et met à jour `updated_at`.
 *
 * Aucune lecture publique : le Header est alimenté côté serveur (rôle service)
 * via `loadInitialData` — RLS owner-only posée en migration 0004.
 *
 * Référence : plans/ROADMAP-9.1-visual-identity-logo.md §D-3
 * ============================================================================
 */

import { eq, sql } from "drizzle-orm";

import { VisualIdentitySchema } from "../../lib/schemas/persistence";
import {
  normalizeVisualIdentity,
  type VisualIdentity,
} from "../../lib/visual-identity";
import { getDatabase } from "../index";
import { siteVisualIdentity } from "../schema";

/**
 * Décode un `data` JSONB vers une `VisualIdentity` complète (tolérant) :
 * normalise d'abord l'ancienne forme plate (v1) vers la forme « par ligne »
 * (v2, Étape 9.1.a), puis valide via Zod. Retourne `null` si le stockage est
 * vide/inexploitable.
 */
function decodeVisualIdentity(data: unknown): VisualIdentity | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const normalized = normalizeVisualIdentity(data);
  const parsed = VisualIdentitySchema.safeParse(normalized);
  return parsed.success ? parsed.data : normalized;
}

/** Lecture de la configuration d'un photographe (ou `null` si aucune ligne). */
export async function getVisualIdentity(
  photographerId: string
): Promise<VisualIdentity | null> {
  const database = getDatabase();
  const rows = await database
    .select({ data: siteVisualIdentity.data })
    .from(siteVisualIdentity)
    .where(eq(siteVisualIdentity.photographerId, photographerId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return decodeVisualIdentity(row.data);
}

/** Écrit (insert ou upsert) la configuration complète d'un photographe. */
export async function upsertVisualIdentity(
  photographerId: string,
  value: VisualIdentity
): Promise<void> {
  const parsed = decodeVisualIdentity(value);
  if (!parsed) {
    throw new Error("Identité visuelle invalide (validation refusée)");
  }
  const database = getDatabase();
  await database
    .insert(siteVisualIdentity)
    .values({
      photographerId,
      data: parsed,
    })
    .onConflictDoUpdate({
      target: siteVisualIdentity.photographerId,
      set: {
        data: sql`excluded.data`,
        updatedAt: sql`now()`,
      },
    });
}
