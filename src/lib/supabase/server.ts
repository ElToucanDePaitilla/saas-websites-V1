/**
 * ============================================================================
 * CLIENT SUPABASE — CÔTÉ SERVEUR (Étape 5.4)
 * ----------------------------------------------------------------------------
 * `createServerClient` (@supabase/ssr) avec lecture/écriture des cookies de
 * session Next.js. Utilisé par les layouts / Server Actions / Route Handlers
 * pour lire l'utilisateur authentifié (`auth.uid()` = `profiles.id`).
 *
 * Lève une erreur si Supabase n'est pas configuré — les appelants testent
 * `isSupabaseConfigured()` (mode démo) avant tout appel.
 * ============================================================================
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./demo";

/** Crée le client Supabase serveur (session par cookies HttpOnly). */
export async function createClient() {
  const config = getSupabaseEnv();
  if (!config) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Appelé depuis un Server Component : cookies non modifiables ici.
        }
      },
    },
  });
}
