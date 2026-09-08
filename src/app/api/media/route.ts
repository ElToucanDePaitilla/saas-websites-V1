/**
 * ============================================================================
 * API MEDIA — GET /api/media (liste) & POST /api/media (upload) (Étape 6.1)
 * ----------------------------------------------------------------------------
 * - GET  : liste des médias du photographe authentifié (repli tenant démo).
 * - POST : upload multipart (file) → Storage `portfolio-media/{uid}/…` +
 *   extraction EXIF (`exifr`), dimensions & blur placeholder (`sharp`) +
 *   insertion ligne `media`. Owner authentifié uniquement (401 sinon).
 * En mode démo (Storage non configuré) : upload indisponible (503).
 * ============================================================================
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import exifr from "exifr";
import sharp from "sharp";

import { listMedia, createMedia } from "@/db/repositories/media.repository";
import {
  ensurePhotographerProfile,
  resolvePhotographerId,
} from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { isStorageConfigured } from "@/lib/supabase/demo";
import { uploadImage } from "@/lib/supabase/storage";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo

/** Génère un placeholder flou (data URI) via sharp — null si échec. */
async function buildBlurDataUrl(buffer: Buffer): Promise<string | null> {
  try {
    const small = await sharp(buffer)
      .resize({ width: 16, height: 16, fit: "inside" })
      .jpeg({ quality: 40 })
      .toBuffer();
    return `data:image/jpeg;base64,${small.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const photographerId = await resolvePhotographerId();
    const items = await listMedia(photographerId);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  const photographerId = user.id;
  // Garantit profiles(id = auth.uid()) avant l'insertion `media` (FK).
  await ensurePhotographerProfile(photographerId, user.email ?? null);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Fichier vide ou supérieur à 15 Mo." },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Type de fichier non autorisé (image requise)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload Storage (préfixe propriétaire) puis URL publique.
    const uploaded = await uploadImage(supabase, photographerId, file, file.type);

    // Métadonnées : dimensions + EXIF (toléré si absent).
    let width: number | null = null;
    let height: number | null = null;
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    } catch {
      // dimensions non disponibles
    }

    let exifData: unknown = {};
    try {
      exifData = (await exifr.parse(buffer)) ?? {};
    } catch {
      // EXIF absent (ex. export WebP) → {}
    }

    const blurDataUrl = await buildBlurDataUrl(buffer);

    const asset = await createMedia(photographerId, {
      url: uploaded.publicUrl,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      width,
      height,
      exifData,
      blurDataUrl,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
