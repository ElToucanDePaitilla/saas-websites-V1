/**
 * ============================================================================
 * REPOSITORY CONTACT_SUBMISSIONS — messages du formulaire (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Couche **purement serveur**. Elle porte les quatre opérations dont la route
 * `/api/contact` a besoin :
 *
 *   - `findPublishedContactPage(...)` — **D13** : résout la page **publiée** par
 *     son slug, et en déduit le `page_id` **et** les réglages du formulaire du
 *     module contact qu'elle porte. La page d'accueil (`is_home`, slug vide) est
 *     traitée à part : le routage public la sert sur `/`, mais un slug vide
 *     n'est pas une clé de recherche fiable (cf. `setHomePage`).
 *   - `getContactRecipientEmail(...)` — **D12** : lit le destinataire dans le
 *     profil (`contact_form_email`, repli `public_email`). Le payload visiteur
 *     n'en transporte jamais.
 *   - `countRecentSubmissionsByIpHash(...)` — limitation de débit comptée **en
 *     base** (fiable en serverless, contrairement à un compteur mémoire).
 *   - `createContactSubmission(...)` — l'insertion, avec la valeur **réelle**
 *     du consentement CGU.
 *
 * L'insertion passe par `getDatabase()` (connexion `DATABASE_URL`, rôle
 * propriétaire) : elle contourne la RLS, ce qui est exactement le besoin du
 * service_role sans dépendre d'un client Supabase JS.
 * ============================================================================
 */

import { and, count, eq, gte } from "drizzle-orm";

import {
  resolveContactContent,
  type ContactFormSettings,
} from "../../lib/pages";
import { getDatabase } from "../index";
import { contactSubmissions, pageModules, pages } from "../schema";

/** Page publiée trouvée + réglages du formulaire qu'elle porte. */
export interface PublishedContactPage {
  pageId: string;
  form: ContactFormSettings;
}

/**
 * Résout la page **publiée** d'un slug et le formulaire de son module contact.
 *
 * Slug vide → page d'accueil (`is_home`), pas une recherche par slug vide. Une
 * page sans module contact retourne `null` : sans formulaire, il n'y a rien à
 * recevoir.
 */
export async function findPublishedContactPage(
  photographerId: string,
  slug: string
): Promise<PublishedContactPage | null> {
  const database = getDatabase();

  const targetCondition =
    slug === ""
      ? and(
          eq(pages.photographerId, photographerId),
          eq(pages.isHome, true),
          eq(pages.status, "published")
        )
      : and(
          eq(pages.photographerId, photographerId),
          eq(pages.slug, slug),
          eq(pages.status, "published")
        );

  const pageRows = await database
    .select({ id: pages.id })
    .from(pages)
    .where(targetCondition)
    .limit(1);
  const page = pageRows[0];
  if (!page) {
    return null;
  }

  const moduleRows = await database
    .select({ content: pageModules.content })
    .from(pageModules)
    .where(
      and(
        eq(pageModules.pageId, page.id),
        eq(pageModules.moduleType, "contact"),
        eq(pageModules.isVisible, true)
      )
    )
    .limit(1);
  const contactModule = moduleRows[0];
  if (!contactModule) {
    return null;
  }

  return {
    pageId: page.id,
    form: resolveContactContent(contactModule.content).form,
  };
}

/**
 * Destinataire du formulaire pour un photographe (D12).
 *
 * Ordre : `contact_form_email`, puis repli sur `public_email`. `null` si aucun
 * des deux n'est renseigné — la route répond alors 422 (on n'invente jamais
 * d'adresse).
 */
export async function getContactRecipientEmail(
  photographerId: string
): Promise<string | null> {
  // Import local pour éviter de charger le décodeur Zod du profil tant qu'on
  // n'en a pas besoin (le route handler est déjà serveur).
  const { getOwnerProfile } = await import("./owner-profile.repository");
  const profile = await getOwnerProfile(photographerId);
  if (!profile) {
    return null;
  }
  const contact = profile.contactFormEmail.trim();
  const publicEmail = profile.publicEmail.trim();
  const email = contact !== "" ? contact : publicEmail;
  return email !== "" ? email : null;
}

/** Nombre de messages du même `ip_hash` pour ce tenant depuis `since`. */
export async function countRecentSubmissionsByIpHash(
  photographerId: string,
  ipHash: string,
  since: Date
): Promise<number> {
  const database = getDatabase();
  const rows = await database
    .select({ value: count() })
    .from(contactSubmissions)
    .where(
      and(
        eq(contactSubmissions.photographerId, photographerId),
        eq(contactSubmissions.ipHash, ipHash),
        gte(contactSubmissions.createdAt, since)
      )
    );
  return rows[0]?.value ?? 0;
}

/** Données d'insertion d'un message (aucun identifiant de tenant du payload). */
export interface ContactSubmissionInput {
  photographerId: string;
  pageId: string | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  attachmentPath: string | null;
  acceptedCgu: boolean;
  ipHash: string | null;
  userAgent: string | null;
}

/** Insère un message et retourne son identifiant. */
export async function createContactSubmission(
  input: ContactSubmissionInput
): Promise<string> {
  const database = getDatabase();
  const [row] = await database
    .insert(contactSubmissions)
    .values(input)
    .returning({ id: contactSubmissions.id });
  if (!row) {
    throw new Error("Échec de l'enregistrement du message de contact.");
  }
  return row.id;
}
