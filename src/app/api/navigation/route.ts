/**
 * ============================================================================
 * API — PUT /api/navigation : remplacement Header/Footer (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Persiste la navigation complète du tenant de démo (Header Niveau 1 + Niveau 2
 * reconstruit en arborescence, Footer). Corps validé par
 * `saveNavigationPayloadSchema` (zod). Le client envoie l'arborescence ; le
 * repository aplatit vers `parent_id`/`position`.
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { saveNavigation } from "@/db/repositories/navigation.repository";
import { saveNavigationPayloadSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function PUT(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const payload = saveNavigationPayloadSchema.parse(body);
    // Étape 5.4 : propriétaire = utilisateur authentifié, sinon tenant démo.
    const photographerId = await resolvePhotographerId();
    await saveNavigation(photographerId, {
      header: payload.header,
      footer: payload.footer,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Requête invalide", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/navigation failed:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
