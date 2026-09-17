/**
 * ============================================================================
 * API CONTACT — POST /api/contact (Étape 14.1)
 * ----------------------------------------------------------------------------
 * **Premier chemin d'écriture non authentifié** du projet. Le visiteur n'a pas
 * de session : rien de ce qu'il envoie ne doit pouvoir décider du destinataire,
 * du tenant ou de la légitimité d'un fichier. Le serveur re-dérive tout.
 *
 * Ordre de traitement (il est significatif) :
 *   1. **piège `_gotcha`** — rempli ⇒ 200 silencieux, aucune insertion, aucun
 *      e-mail (un robot ne doit pas apprendre que le champ est un piège) ;
 *   2. **Zod** — forme des champs texte ;
 *   3. **Turnstile** — `siteverify`, si configuré ;
 *   4. **page publiée** par `pageSlug` (D13) — en déduit `page_id`, le tenant et
 *      les réglages du formulaire ;
 *   5. **CGU** — exigée si la section le demande ;
 *   6. **destinataire serveur** (D12) — 422 s'il est absent ;
 *   7. **limitation de débit** comptée en base, par `ip_hash` salé ;
 *   8. **pièce jointe** — taille, extension, puis **signature binaire** (D6) ;
 *   9. **upload** Storage (`service_role`), insertion, puis e-mail (non bloquant).
 *
 * En mode démo (Supabase ou `DATABASE_URL` absent) : 503 explicite, comme
 * `/api/media`.
 * ============================================================================
 */

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  countRecentSubmissionsByIpHash,
  createContactSubmission,
  findPublishedContactPage,
  getContactRecipientEmail,
} from "@/db/repositories/contact-submissions.repository";
import { sendContactNotification } from "@/lib/emails/contact-notification";
import {
  getTurnstileSecret,
  isTurnstileConfigured,
} from "@/lib/integrations";
import {
  CONTACT_MAX_FILE_SIZE_MB,
  CONTACT_RATE_LIMIT_MAX,
  CONTACT_RATE_LIMIT_WINDOW_MINUTES,
  contactAttachmentFormat,
  contactAttachmentRejection,
  contactFileExtension,
  matchesContactAttachmentSignature,
} from "@/lib/pages";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/demo";
import { resolvePublicPhotographerId } from "@/lib/supabase/session";
import { uploadAttachment } from "@/lib/supabase/storage";

/**
 * Forme des champs texte.
 *
 * `senderEmail` est volontairement **texte libre** (la persistance du projet ne
 * bloque jamais un e-mail « non conforme »), avec un minimum pragmatique : un
 * message auquel on ne peut pas répondre n'a pas d'intérêt. La validation fine
 * d'adresse n'apporterait rien de plus ici et rejetterait des cas légitimes.
 */
const contactPayloadSchema = z.object({
  senderName: z.string().trim().min(1).max(200),
  senderEmail: z
    .string()
    .trim()
    .min(3)
    .max(320)
    .refine((value) => value.includes("@"), "Adresse e-mail invalide."),
  subject: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().min(1).max(20000),
  pageSlug: z.string().max(200).optional().default(""),
  acceptedCgu: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .default("false"),
  turnstileToken: z.string().max(4000).optional().default(""),
});

/** IP du visiteur derrière le proxy (Vercel/Supabase), ou `null`. */
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const real = request.headers.get("x-real-ip");
  return real && real.trim() !== "" ? real.trim() : null;
}

/** Hachage **salé** de l'IP — jamais l'IP en clair (rétention RGPD). */
function hashIp(ip: string): string {
  const salt = process.env.CONTACT_IP_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Vérifie un jeton Turnstile auprès de Cloudflare. */
async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null
): Promise<boolean> {
  if (token === "") {
    return false;
  }
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    if (!response.ok) {
      return false;
    }
    const data: unknown = await response.json().catch(() => null);
    return (
      typeof data === "object" &&
      data !== null &&
      (data as { success?: unknown }).success === true
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || (process.env.DATABASE_URL ?? "") === "") {
    return NextResponse.json(
      { ok: false, error: "Le formulaire n'est pas configuré (mode démo)." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    // 1. Champ piège — rejet **silencieux** : un 200 identique au succès.
    const gotcha = String(formData.get("_gotcha") ?? "");
    if (gotcha.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    // 2. Forme des champs.
    const parsed = contactPayloadSchema.safeParse({
      senderName: formData.get("senderName"),
      senderEmail: formData.get("senderEmail"),
      subject: formData.get("subject") ?? "",
      message: formData.get("message"),
      pageSlug: formData.get("pageSlug") ?? "",
      acceptedCgu: formData.get("acceptedCgu") ?? "false",
      turnstileToken: formData.get("turnstileToken") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Le formulaire est incomplet ou invalide." },
        { status: 400 }
      );
    }
    const { senderName, senderEmail, subject, message, pageSlug } = parsed.data;

    // 3. Anti-robot (optionnel).
    const ip = clientIp(request);
    if (isTurnstileConfigured()) {
      const secret = getTurnstileSecret();
      const valid =
        secret !== null &&
        (await verifyTurnstile(secret, parsed.data.turnstileToken, ip));
      if (!valid) {
        return NextResponse.json(
          { ok: false, error: "Vérification anti-robot refusée. Rechargez la page." },
          { status: 400 }
        );
      }
    }

    // 4. Page publiée → tenant + réglages du formulaire (D13).
    const photographerId = await resolvePublicPhotographerId();
    const page = await findPublishedContactPage(photographerId, pageSlug);
    if (!page) {
      return NextResponse.json(
        { ok: false, error: "Page inconnue ou non publiée." },
        { status: 422 }
      );
    }

    // 5. Consentement exigé par la section.
    if (page.form.requireCGU && parsed.data.acceptedCgu !== "true") {
      return NextResponse.json(
        { ok: false, error: "L'acceptation de la politique de confidentialité est requise." },
        { status: 400 }
      );
    }

    // 6. Destinataire résolu serveur (D12).
    const recipient = await getContactRecipientEmail(photographerId);
    if (!recipient) {
      return NextResponse.json(
        { ok: false, error: "Aucune adresse de réception n'est configurée." },
        { status: 422 }
      );
    }

    // 7. Limitation de débit (comptée en base, fiable en serverless).
    const ipHash = ip ? hashIp(ip) : null;
    if (ipHash) {
      const since = new Date(
        Date.now() - CONTACT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
      );
      const recent = await countRecentSubmissionsByIpHash(
        photographerId,
        ipHash,
        since
      );
      if (recent >= CONTACT_RATE_LIMIT_MAX) {
        return NextResponse.json(
          {
            ok: false,
            error: "Trop de messages envoyés récemment. Réessayez plus tard.",
          },
          { status: 429 }
        );
      }
    }

    // 8. Pièce jointe — plafond serveur, extension puis signature binaire.
    const fileEntry = formData.get("attachment");
    let attachmentPath: string | null = null;
    if (fileEntry instanceof File && fileEntry.size > 0) {
      // Le réglage d'éditeur ne peut pas ouvrir un puits de stockage : le
      // plafond serveur est le plus petit des deux (défense en profondeur).
      const effectiveForm = {
        ...page.form,
        maxFileSizeMB: Math.min(
          page.form.maxFileSizeMB,
          CONTACT_MAX_FILE_SIZE_MB
        ),
      };
      if (
        contactAttachmentRejection(
          { name: fileEntry.name, size: fileEntry.size },
          effectiveForm
        ) !== null
      ) {
        return NextResponse.json(
          { ok: false, error: "Pièce jointe refusée (taille ou format)." },
          { status: 400 }
        );
      }
      const extension = contactFileExtension(fileEntry.name);
      const format = contactAttachmentFormat(extension);
      if (!format) {
        return NextResponse.json(
          { ok: false, error: "Format de pièce jointe non autorisé." },
          { status: 400 }
        );
      }
      const head = new Uint8Array(await fileEntry.slice(0, 16).arrayBuffer());
      if (!matchesContactAttachmentSignature(format, head)) {
        return NextResponse.json(
          { ok: false, error: "Le contenu du fichier ne correspond pas à son format." },
          { status: 400 }
        );
      }
      const admin = createAdminClient();
      if (!admin) {
        return NextResponse.json(
          { ok: false, error: "Le stockage des pièces jointes n'est pas configuré." },
          { status: 503 }
        );
      }
      const uploaded = await uploadAttachment(
        admin,
        photographerId,
        fileEntry,
        format.extension,
        format.mime
      );
      // On stocke le **chemin** relatif : une URL publique signée expire.
      attachmentPath = uploaded.path;
    }

    // 9. Insertion (service_role via la connexion propriétaire), puis e-mail.
    await createContactSubmission({
      photographerId,
      pageId: page.pageId,
      senderName,
      senderEmail,
      subject,
      message,
      attachmentPath,
      acceptedCgu: parsed.data.acceptedCgu === "true",
      ipHash,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });

    // Non bloquant : la ligne est déjà en base, un e-mail refusé ne perd rien.
    await sendContactNotification(recipient, {
      senderName,
      senderEmail,
      subject,
      message,
      hasAttachment: attachmentPath !== null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Formulaire de contact :", error);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
