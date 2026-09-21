/**
 * ============================================================================
 * REPOSITORY SITE_POPUPS — pop-ups paramétrables
 * ----------------------------------------------------------------------------
 * Couche **purement serveur** (jamais importée par un Client Component) :
 *   - `listPopUps(photographerId)` : toutes les pop-ups du photographe, dans
 *     l'ordre de création (l'ordre de la liste porte la priorité d'affichage) ;
 *   - `getPopUp(photographerId, id)` : une pop-up, ou `null` ;
 *   - `upsertPopUp(photographerId, popup)` : insert ou update **scopé** au
 *     propriétaire — une pop-up dont l'id appartient à un autre photographe
 *     n'est jamais écrasée ;
 *   - `deletePopUp(photographerId, id)` : suppression scopée (`pages.popup_id`
 *     passe à `NULL` via la FK `ON DELETE SET NULL`).
 *
 * Décodage **tolérant** (même patron que `top-banner.repository`) :
 * `normalizePopUp` complète la forme JSONB, puis `PopUpSchema` la valide ; une
 * ligne inexploitable est écartée (id absent = pop-up non rattachable).
 *
 * Aucune lecture publique : la pop-up est alimentée côté serveur (rôle service)
 * via `loadInitialData` — RLS owner-only posée en migration 0014.
 * ============================================================================
 */

import { and, asc, eq } from "drizzle-orm";

import { normalizePopUp, type PopUp } from "../../lib/popup";
import { PopUpSchema } from "../../lib/schemas/persistence";
import { getDatabase } from "../index";
import { sitePopups } from "../schema";

/**
 * Décode un `data` JSONB vers une `PopUp` complète (tolérant) : normalise la
 * forme stockée, valide via Zod, puis écarte un identifiant vide — sans id, la
 * pop-up ne peut être ni rattachée à une page ni ciblée.
 */
function decodePopUp(data: unknown): PopUp | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const normalized = normalizePopUp(data);
  const parsed = PopUpSchema.safeParse(normalized);
  const popup = parsed.success ? parsed.data : normalized;
  return popup.id === "" ? null : popup;
}

/** Toutes les pop-ups d'un photographe (ordre de création = ordre de priorité). */
export async function listPopUps(photographerId: string): Promise<PopUp[]> {
  const database = getDatabase();
  const rows = await database
    .select({ data: sitePopups.data })
    .from(sitePopups)
    .where(eq(sitePopups.photographerId, photographerId))
    .orderBy(asc(sitePopups.createdAt));
  const popups: PopUp[] = [];
  for (const row of rows) {
    const popup = decodePopUp(row.data);
    if (popup) {
      popups.push(popup);
    }
  }
  return popups;
}

/** Une pop-up du photographe, ou `null` si absente / inexploitable. */
export async function getPopUp(
  photographerId: string,
  id: string
): Promise<PopUp | null> {
  const database = getDatabase();
  const rows = await database
    .select({ data: sitePopups.data })
    .from(sitePopups)
    .where(
      and(eq(sitePopups.photographerId, photographerId), eq(sitePopups.id, id))
    )
    .limit(1);
  const row = rows[0];
  return row ? decodePopUp(row.data) : null;
}

/**
 * Écrit une pop-up (insert ou update) **dans le périmètre du propriétaire**.
 *
 * `update … where id AND photographer_id` d'abord : si aucune ligne n'est
 * touchée, c'est une création. Un `onConflictDoUpdate` sur `id` seul écraserait
 * la pop-up d'un autre photographe qui aurait le même id — l'ownership est donc
 * vérifié explicitement.
 */
export async function upsertPopUp(
  photographerId: string,
  popup: PopUp
): Promise<void> {
  const parsed = decodePopUp(popup);
  if (!parsed) {
    throw new Error("Pop-up invalide (validation refusée)");
  }
  const database = getDatabase();
  await database.transaction(async (tx) => {
    const updated = await tx
      .update(sitePopups)
      .set({ data: parsed, updatedAt: new Date() })
      .where(
        and(
          eq(sitePopups.id, parsed.id),
          eq(sitePopups.photographerId, photographerId)
        )
      )
      .returning({ id: sitePopups.id });

    if (updated.length === 0) {
      await tx.insert(sitePopups).values({
        id: parsed.id,
        photographerId,
        data: parsed,
      });
    }
  });
}

/** Supprime une pop-up du photographe (les pages rattachées sont détachées). */
export async function deletePopUp(
  photographerId: string,
  id: string
): Promise<void> {
  const database = getDatabase();
  await database
    .delete(sitePopups)
    .where(
      and(eq(sitePopups.photographerId, photographerId), eq(sitePopups.id, id))
    );
}
