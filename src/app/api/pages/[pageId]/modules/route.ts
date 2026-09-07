/**
 * ============================================================================
 * API — PUT /api/pages/[pageId]/modules : remplacement des modules (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Persiste la liste **complète ordonnée** des modules d'une page (couvre
 * ajout, suppression, réordonnancement, masquage et édition). Corps validé par
 * `updateModulesPayloadSchema` (zod).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { updateModules } from "@/db/repositories/pages.repository";
import { updateModulesPayloadSchema } from "@/lib/schemas/persistence";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const body: unknown = await request.json();
    const payload = updateModulesPayloadSchema.parse(body);
    await updateModules(pageId, payload.modules);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Requête invalide", issues: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
