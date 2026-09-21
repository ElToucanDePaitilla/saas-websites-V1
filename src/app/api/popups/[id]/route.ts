/**
 * ============================================================================
 * API — DELETE /api/popups/[id] : suppression d'une pop-up
 * ----------------------------------------------------------------------------
 * Scopée au photographe authentifié (`deletePopUp` filtre `id AND
 * photographer_id`) : l'id ne suffit pas. Les pages qui la portaient sont
 * détachées par la FK `ON DELETE SET NULL` — la page survit sans pop-up.
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deletePopUp } from "@/db/repositories/popup.repository";
import { resolvePhotographerId } from "@/lib/supabase/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const photographerId = await resolvePhotographerId();
    await deletePopUp(photographerId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/popups/[id] failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
