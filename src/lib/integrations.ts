/**
 * ============================================================================
 * INTÉGRATIONS EXTERNES — gardes de configuration (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Toute intégration externe (Resend, Turnstile, Storage) est **optionnelle au
 * rendu** (invariant A5) : son absence masque un widget ou désactive un envoi,
 * elle ne casse jamais une page. Ces gardes sont le point unique qui décide
 * « configuré / pas configuré ».
 *
 * Même esprit que `getSupabaseEnv()` (`src/lib/supabase/demo.ts`) : une valeur
 * **factice** de `.env.example` compte comme absente. Sans cela, un `.env.local`
 * recopié depuis l'exemple ferait croire à tort que Resend ou Turnstile est
 * actif, et la route tenterait des appels réseau qui échouent.
 * ============================================================================
 */

import { isStorageConfigured } from "./supabase/demo";

/**
 * Valeurs factices de `.env.example` — jamais considérées comme configurées.
 * Toute variable lue ici doit y figurer avec son placeholder.
 */
const PLACEHOLDERS = new Set([
  "re_123456789",
  "your-service-role-key-here",
  "your-turnstile-site-key",
  "your-turnstile-secret-key",
]);

/** Lit une variable d'environnement « réelle » (hors vide et hors factice). */
function realValue(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed === "" || PLACEHOLDERS.has(trimmed)) {
    return null;
  }
  return trimmed;
}

/* --------------------------------------------------------------------------
   RESEND — notification du propriétaire à la réception d'un message
   -------------------------------------------------------------------------- */

export interface ResendConfig {
  apiKey: string;
  /** Expéditeur vérifié chez Resend (ex. `site@votre-domaine.com`). */
  from: string;
}

/** Config Resend complète, ou `null`. Requiert la clé **et** l'expéditeur. */
export function getResendConfig(): ResendConfig | null {
  const apiKey = realValue(process.env.RESEND_API_KEY);
  const from = realValue(process.env.RESEND_FROM_EMAIL);
  if (!apiKey || !from) {
    return null;
  }
  return { apiKey, from };
}

/** true si l'e-mail de notification peut être envoyé. */
export function isContactMailConfigured(): boolean {
  return getResendConfig() !== null;
}

/* --------------------------------------------------------------------------
   CLOUDFLARE TURNSTILE — anti-robot (optionnel, jamais requis en démo)
   -------------------------------------------------------------------------- */

/** Clé **secrète** du serveur (vérification `siteverify`), ou `null`. */
export function getTurnstileSecret(): string | null {
  return realValue(process.env.TURNSTILE_SECRET_KEY);
}

/** Clé **publique** du widget (inlinée dans le bundle client), ou `null`. */
export function getTurnstileSiteKey(): string | null {
  return realValue(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

/**
 * true si Turnstile est **entièrement** configuré.
 *
 * Les deux clés sont exigées : avec la seule clé secrète, le serveur refuserait
 * toutes les soumissions faute de jeton, et le client n'aurait aucun widget pour
 * en produire — une panne silencieuse du formulaire.
 */
export function isTurnstileConfigured(): boolean {
  return getTurnstileSecret() !== null && getTurnstileSiteKey() !== null;
}

/* --------------------------------------------------------------------------
   STORAGE — upload des pièces jointes (service_role)
   -------------------------------------------------------------------------- */

/** Clé `service_role` Supabase, ou `null`. Jamais exposée au client. */
export function getServiceRoleKey(): string | null {
  return realValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * true si une pièce jointe peut être déposée dans le bucket.
 * Exige les deux : le bucket public (config Supabase) **et** la clé
 * `service_role` — le préfixe `contact-attachments/` n'est couvert par aucune
 * politique Storage propriétaire, l'upload passe donc forcément par le rôle
 * d'administration.
 */
export function isContactStorageConfigured(): boolean {
  return isStorageConfigured() && getServiceRoleKey() !== null;
}
