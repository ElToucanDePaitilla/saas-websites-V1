/**
 * ============================================================================
 * PRÉREMPLISSAGE DU MODULE CONTACT depuis le profil propriétaire (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Traduit un `OwnerProfile` (module `"use client"`, `src/lib/owner-profile.ts`)
 * en objet **pur** `ContactPrefill` — que `pages.ts` sait lire sans jamais
 * importer le profil.
 *
 * Invariant A1 : `pages.ts` n'importe **jamais** `owner-profile.ts`. Ce fichier
 * est le seul point de contact entre les deux mondes, et il n'en importe qu'un
 * **type** (`import type`) — effacé à la compilation, donc aucun couplage
 * runtime : le serveur peut importer ce module sans embarquer le code client.
 *
 * Deux règles de mappage :
 *   - **nom** : la marque prime sur le nom du propriétaire (c'est elle que le
 *     visiteur voit) ;
 *   - **réseaux sociaux** : seuls les six réseaux du profil sont repris, et une
 *     URL vide est **ignorée** (préférer l'absence à un lien creux).
 * ============================================================================
 */

import type { OwnerProfile, SocialLinks } from "./owner-profile";
import {
  createContactSocialLink,
  type ContactPrefill,
  type ContactSocialNetwork,
} from "./pages";

/**
 * Correspondance `SocialLinks` → catalogue contact.
 *
 * Écrite à la main plutôt que par `Object.entries` : elle rend explicite que
 * les six clés du profil sont **toutes** couvertes, et une clé ajoutée plus
 * tard dans `SocialLinks` ne compilera pas ici tant qu'elle n'aura pas été
 * rangée (ou délibérément écartée).
 */
const PREFILL_NETWORKS: Array<[keyof SocialLinks, ContactSocialNetwork]> = [
  ["instagram", "instagram"],
  ["facebook", "facebook"],
  ["linkedin", "linkedin"],
  ["youtube", "youtube"],
  ["tiktok", "tiktok"],
  ["x", "x"],
];

/** Construit l'objet de préremplissage du module contact. */
export function contactPrefillFromProfile(profile: OwnerProfile): ContactPrefill {
  const socialLinks = PREFILL_NETWORKS.flatMap(([key, network]) => {
    const url = (profile.socialLinks[key] ?? "").trim();
    return url === "" ? [] : [createContactSocialLink(network, url)];
  });

  return {
    name: profile.brandName.trim() || profile.ownerName.trim(),
    slogan: profile.businessSummary.trim(),
    email: profile.publicEmail.trim(),
    serviceArea: profile.serviceArea.trim(),
    address: { address1: profile.address.trim() },
    // Toujours présent (même vide) : la fabrique ne doit pas ajouter de faux
    // réseaux à un profil réel qui n'en a renseigné aucun.
    socialLinks,
  };
}
