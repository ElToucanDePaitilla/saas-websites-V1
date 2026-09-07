"use server";

/**
 * ============================================================================
 * SERVER ACTIONS — Authentification Back-Office (Étape 5.4)
 * ----------------------------------------------------------------------------
 * `loginAction` : connexion email/mot de passe (crée la session HttpOnly) puis
 * redirection `/admin`. `signOutAction` : fin de session puis `/admin/login`.
 *
 * En mode démo (Supabase non configuré) `createClient` lève — la page
 * `/admin/login` affiche alors un message « mode démo » (aucun formulaire).
 * ============================================================================
 */

import { redirect } from "next/navigation";

import { createClient } from "./server";

/** Résultat d'une action de connexion (erreur éventuelle, sinon redirection). */
export type LoginActionResult = {
  error?: string;
};

/** Connecte le photographe (email/mot de passe) et ouvre la session. */
export async function loginAction(formData: FormData): Promise<LoginActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (email === "" || password === "") {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect("/admin");
}

/** Termine la session et redirige vers `/admin/login`. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
