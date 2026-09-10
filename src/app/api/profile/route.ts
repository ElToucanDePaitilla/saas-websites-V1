/**
 * ============================================================================
 * API — /api/profile : lecture & upsert du profil propriétaire (Étape 8.2)
 * ----------------------------------------------------------------------------
 * - `GET`  : retourne le profil du photographe courant (`profile` ou `null`).
 * - `PUT`  : remplace (upsert, 1 ligne par photographe) le profil complet —
 *            corps validé par `OwnerProfileSchema` (zod). Scope : photographe
 *            authentifié (`resolvePhotographerId`), sinon tenant démo.
 *
 * Référence : plans/ROADMAP-8.2-owner-profile-persistence.md §D-5
 * ============================================================================
 */

import { NextResponse } from "next/server";

import { getOwnerProfile, upsertOwnerProfile } from "@/db/repositories/owner-profile.repository";
import { OwnerProfileSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function GET() {
  try {
    const photographerId = await resolvePhotographerId();
    const profile = await getOwnerProfile(photographerId);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error("GET /api/profile failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const profile = OwnerProfileSchema.parse(body);
    const photographerId = await resolvePhotographerId();
    await upsertOwnerProfile(photographerId, profile);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/profile failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
