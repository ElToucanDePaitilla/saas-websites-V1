/**
 * ============================================================================
 * API — POST /api/navigation/presets : application d'un preset Onboarding
 * ----------------------------------------------------------------------------
 * Applique un preset de manière **atomique côté serveur** (Étape 5.3) :
 *   - recalcule `in_menu` des pages existantes ;
 *   - remplace le Header (Footer intact).
 * Corps validé par `applyPresetPayloadSchema` (zod).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { applyPreset } from "@/db/repositories/navigation.repository";
import { applyPresetPayloadSchema } from "@/lib/schemas/persistence";
import { resolvePhotographerId } from "@/lib/supabase/session";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const payload = applyPresetPayloadSchema.parse(body);
    // Étape 5.4 : propriétaire = utilisateur authentifié, sinon tenant démo.
    const photographerId = await resolvePhotographerId();
    await applyPreset(photographerId, payload.presetId);
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
