/**
 * ============================================================================
 * API — /api/popups : pop-ups paramétrables (liste + upsert)
 * ----------------------------------------------------------------------------
 * - `GET`  : retourne toutes les pop-ups du photographe courant (`popups`).
 * - `PUT`  : insère ou remplace **une** pop-up (id fourni par le client) —
 *            corps validé par `PopUpSchema` (zod). Scope : photographe
 *            authentifié (`resolvePhotographerId`), sinon tenant démo.
 *
 * Calqué sur `/api/top-banner` et `/api/pages/[pageId]` : `ZodError` → 400,
 * toute autre erreur → 500. La table `site_popups` doit exister **avant** tout
 * `PUT` (migration 0014 appliquée, RLS owner-only comprise).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { listPopUps, upsertPopUp } from "@/db/repositories/popup.repository";
import { PopUpSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function GET() {
  try {
    const photographerId = await resolvePhotographerId();
    const popups = await listPopUps(photographerId);
    return NextResponse.json({ ok: true, popups });
  } catch (error) {
    console.error("GET /api/popups failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const popup = PopUpSchema.parse(body);
    const photographerId = await resolvePhotographerId();
    await upsertPopUp(photographerId, popup);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Requête invalide", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/popups failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
