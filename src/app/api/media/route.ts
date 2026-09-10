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
  // SVG : requis par le module « Identité visuelle / Logo » (Étape 9.1).
  "image/svg+xml",
  "video/mp4",
  "video/webm",
]);
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 Mo (vidéos jusqu'à 50 Mo)

/** Formats convertis en WebP (SVG, GIF animés et vidéos exclus). */
const CONVERTIBLE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Qualité de compression WebP appliquée à la conversion (80 %). */
const WEBP_QUALITY = 80;

/**
 * Convertit un buffer image en **WebP qualité 80** (orientation EXIF appliquée,
 * métadonnées retirées). Retourne `null` en cas d'échec → repli sur l'original.
 */
async function convertToWebp(buffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(buffer)
      .rotate()
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Remplace l'extension d'un nom de fichier par `.webp`. */
function withWebpExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  return `${base}.webp`;
}

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
        { ok: false, error: "Type de fichier non autorisé (image ou vidéo MP4/WebM)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isVideo = file.type.startsWith("video/");

    // Conversion systématique en **WebP qualité 80** (JPEG/PNG/WebP/AVIF). Les
    // SVG, GIF animés et vidéos sont conservés tels quels ; si la conversion
    // échoue, on retombe sur l'original (jamais bloquant).
    let storedBuffer: Buffer = buffer;
    let storedMime = file.type;
    let storedName = file.name;
    if (CONVERTIBLE_MIME.has(file.type)) {
      const webp = await convertToWebp(buffer);
      if (webp) {
        storedBuffer = webp;
        storedMime = "image/webp";
        storedName = withWebpExtension(file.name);
      }
    }

    // Upload Storage (préfixe propriétaire) puis URL publique.
    const storedFile = new File([new Uint8Array(storedBuffer)], storedName, {
      type: storedMime,
    });
    const uploaded = await uploadImage(
      supabase,
      photographerId,
      storedFile,
      storedMime
    );

    // Métadonnées image (dimensions + EXIF + blur) — ignorées pour les vidéos.
    let width: number | null = null;
    let height: number | null = null;
    let exifData: unknown = {};
    let blurDataUrl: string | null = null;
    if (!isVideo) {
      try {
        const meta = await sharp(storedBuffer).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      } catch {
        // dimensions non disponibles
      }
      // EXIF lu depuis l'ORIGINAL : la conversion WebP retire les métadonnées.
      try {
        exifData = (await exifr.parse(buffer)) ?? {};
      } catch {
        // EXIF absent (ex. export WebP) → {}
      }
      blurDataUrl = await buildBlurDataUrl(storedBuffer);
    }

    const asset = await createMedia(photographerId, {
      url: uploaded.publicUrl,
      filename: storedName,
      size: storedBuffer.length,
      mimeType: storedMime,
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
