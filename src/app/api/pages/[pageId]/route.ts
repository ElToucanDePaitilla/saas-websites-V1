/**
 * ============================================================================
 * API — PATCH /api/pages/[pageId] & DELETE /api/pages/[pageId] (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Met à jour les métadonnées d'une page (slug, titre, statut, `inMenu`) ou la
 * supprime (les FK CASCADE retirent modules et navigation liée). Corps PATCH
 * validé par `pageMetadataSchema` (zod).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { deletePage, updatePage } from "@/db/repositories/pages.repository";
import { pageMetadataSchema } from "@/lib/schemas/persistence";

type RouteContext = { params: Promise<{ pageId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const body: unknown = await request.json();
    const page = pageMetadataSchema.parse(body);
    await updatePage(pageId, page);
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    await deletePage(pageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
