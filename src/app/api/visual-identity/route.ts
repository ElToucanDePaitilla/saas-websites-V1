/**
 * ============================================================================
 * API — /api/visual-identity : espace marque du Header (Étape 9.1)
 * ----------------------------------------------------------------------------
 * - `GET` : retourne la configuration du photographe courant (`visualIdentity`
 *           ou `null`).
 * - `PUT` : remplace (upsert, 1 ligne/photographe) la configuration complète —
 *           corps validé par `VisualIdentitySchema` (zod). Scope : photographe
 *           authentifié (`resolvePhotographerId`), sinon tenant démo.
 *
 * Référence : plans/ROADMAP-9.1-visual-identity-logo.md §D-6
 * ============================================================================
 */

import { NextResponse } from "next/server";

import {
  getVisualIdentity,
  upsertVisualIdentity,
} from "@/db/repositories/visual-identity.repository";
import { VisualIdentitySchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function GET() {
  try {
    const photographerId = await resolvePhotographerId();
    const visualIdentity = await getVisualIdentity(photographerId);
    return NextResponse.json({ ok: true, visualIdentity });
  } catch (error) {
    console.error("GET /api/visual-identity failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const visualIdentity = VisualIdentitySchema.parse(body);
    const photographerId = await resolvePhotographerId();
    await upsertVisualIdentity(photographerId, visualIdentity);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/visual-identity failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
