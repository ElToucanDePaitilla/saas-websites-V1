/**
 * ============================================================================
 * API — /api/top-banner : mini-bandeau Alerte / Promo (réglage global)
 * ----------------------------------------------------------------------------
 * - `GET` : retourne la configuration du photographe courant (`topBanner` ou
 *           `null`).
 * - `PUT` : remplace (upsert, 1 ligne/photographe) la configuration complète —
 *           corps validé par `TopBannerSchema` (zod). Scope : photographe
 *           authentifié (`resolvePhotographerId`), sinon tenant démo.
 *
 * La table `site_top_banner` doit exister **avant** tout `PUT` (migration
 * 0012 appliquée), sinon la route renvoie une erreur serveur : c'est la même
 * contrainte que pour l'identité visuelle, et la raison pour laquelle
 * `db:generate` précède l'édition manuelle des RLS puis `db:migrate`.
 * ============================================================================
 */

import { NextResponse } from "next/server";

import {
  getTopBanner,
  upsertTopBanner,
} from "@/db/repositories/top-banner.repository";
import { TopBannerSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function GET() {
  try {
    const photographerId = await resolvePhotographerId();
    const topBanner = await getTopBanner(photographerId);
    return NextResponse.json({ ok: true, topBanner });
  } catch (error) {
    console.error("GET /api/top-banner failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const topBanner = TopBannerSchema.parse(body);
    const photographerId = await resolvePhotographerId();
    await upsertTopBanner(photographerId, topBanner);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/top-banner failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
