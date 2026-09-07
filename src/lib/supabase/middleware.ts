/**
 * ============================================================================
 * MIDDLEWARE SUPABASE — rafraîchissement de session (Étape 5.4)
 * ----------------------------------------------------------------------------
 * Utilisé par `src/middleware.ts` : crée le client serveur depuis la requête,
 * **rafraîchit** la session (échange des cookies) et retourne l'utilisateur
 * courant pour la garde `/admin`.
 *
 * En mode démo (Supabase non configuré) : aucune opération — `user: null`.
 * ============================================================================
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./demo";

export interface SessionCheck {
  supabaseResponse: NextResponse;
  user: { id: string; email?: string | null } | null;
}

/** Rafraîchit la session et retourne l'utilisateur courant (ou null). */
export async function updateSession(
  request: NextRequest
): Promise<SessionCheck> {
  let supabaseResponse = NextResponse.next({ request });
  const config = getSupabaseEnv();
  if (!config) {
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
