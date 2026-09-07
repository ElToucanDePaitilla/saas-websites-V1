"use client";

/**
 * ============================================================================
 * CLIENT SUPABASE — CÔTÉ NAVIGATEUR (Étape 5.4)
 * ----------------------------------------------------------------------------
 * `createBrowserClient` (@supabase/ssr) : partage la session (cookies) entre
 * les composants clients. Utilisé uniquement côté navigateur.
 *
 * Lève une erreur si Supabase n'est pas configuré (mode démo — appeler
 * `isSupabaseConfigured()` avant).
 * ============================================================================
 */

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./demo";

/** Crée le client Supabase navigateur (session partagée). */
export function createClient() {
  const config = getSupabaseEnv();
  if (!config) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(config.url, config.anonKey);
}
