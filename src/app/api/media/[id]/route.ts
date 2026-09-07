/**
 * ============================================================================
 * API — DELETE /api/media/[id] (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Supprime l'objet Storage puis la ligne `media` (Owner authentifié uniquement).
 * En mode démo (Storage non configuré) : indisponible (503).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deleteMedia, getMedia } from "@/db/repositories/media.repository";
import { isStorageConfigured } from "@/lib/supabase/demo";
import { createClient } from "@/lib/supabase/server";
import { deleteImage, storagePathFromUrl } from "@/lib/supabase/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase Storage non configuré (mode démo)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentification requise." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const asset = await getMedia(user.id, id);
    if (!asset) {
      return NextResponse.json(
        { ok: false, error: "Média introuvable." },
        { status: 404 }
      );
    }

    const objectPath = storagePathFromUrl(asset.url);
    if (objectPath) {
      await deleteImage(supabase, objectPath);
    }
    await deleteMedia(user.id, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
