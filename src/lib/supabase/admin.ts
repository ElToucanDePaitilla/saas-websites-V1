/**
 * ============================================================================
 * CLIENT SUPABASE — ADMINISTRATION / `service_role` (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Créé **à la demande** et **jamais importé hors d'une route serveur**. La clé
 * `service_role` contourne la RLS : elle ne doit ni fuiter dans le bundle
 * client, ni être réexportée par un module partagé.
 *
 * Son seul usage dans ce lot : déposer une pièce jointe de contact sous le
 * préfixe `contact-attachments/{photographerId}/…`, que les politiques Storage
 * propriétaires (`portfolio_media_owner_insert`, préfixe `auth.uid()`) ne
 * couvrent pas — le visiteur n'a pas de session.
 *
 * Retourne `null` si Supabase ou la clé d'administration manque : l'appelant
 * décide alors d'un 503 explicite, jamais d'une exception.
 * ============================================================================
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleKey } from "@/lib/integrations";

import { getSupabaseEnv } from "./demo";

/** Client `service_role`, ou `null` si non configuré. */
export function createAdminClient(): SupabaseClient | null {
  const config = getSupabaseEnv();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    return null;
  }
  return createSupabaseClient(config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
