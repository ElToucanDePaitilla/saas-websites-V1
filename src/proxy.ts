/**
 * ============================================================================
 * PROXY NEXT.JS 16 — Protection de la zone Back-Office (Étape 6.3)
 * ----------------------------------------------------------------------------
 * Remplace l'ancienne convention `middleware.ts` (dépréciée en Next 16) :
 *   - rafraîchit la session Supabase (cookies) pour `/admin/*` ;
 *   - non connecté → redirection `/admin/login` (exemptée) ;
 *   - mode démo (Supabase non configuré) → aucune garde.
 * ============================================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/demo";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLoginRoute = pathname === "/admin/login";
  if (pathname.startsWith("/admin") && !isLoginRoute && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
