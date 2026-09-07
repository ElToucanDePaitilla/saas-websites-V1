/**
 * ============================================================================
 * API — POST /api/pages : création d'une page (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Persiste une nouvelle page pour le tenant de démo (aucune auth encore —
 * RLS posée à l'étape Auth). Corps validé par `pageMetadataSchema` (zod).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { createPage } from "@/db/repositories/pages.repository";
import { pageMetadataSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const page = pageMetadataSchema.parse(body);
    // Étape 5.4 : le propriétaire est l'utilisateur authentifié (auth.uid()),
    // sinon repli tenant démo (mode démo / lecture publique).
    const photographerId = await resolvePhotographerId();
    await createPage(photographerId, page);
    return NextResponse.json({ ok: true }, { status: 201 });
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
