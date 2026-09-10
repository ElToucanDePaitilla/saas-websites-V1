/**
 * ============================================================================
 * API — POST /api/pages/[pageId]/home : désigner la page d'accueil (10.1)
 * ----------------------------------------------------------------------------
 * Désigne la page cible comme **accueil du site** (`is_home`) de manière
 * transactionnelle côté repository : l'ancien accueil est démis (slug libéré)
 * et la page cible reçoit le slug canonique `""` (servi sur `/`).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { setHomePage } from "@/db/repositories/pages.repository";
import { resolvePhotographerId } from "@/lib/supabase/session";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const photographerId = await resolvePhotographerId();
    await setHomePage(photographerId, pageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
