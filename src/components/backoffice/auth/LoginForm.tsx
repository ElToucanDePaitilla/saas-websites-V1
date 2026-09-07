"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/demo";

/**
 * ============================================================================
 * FORMULAIRE DE CONNEXION — Back-Office `/admin/login` (Étape 5.4)
 * ----------------------------------------------------------------------------
 * Client Component : appelle la Server Action `loginAction` (session HttpOnly
 * Supabase) puis redirection `/admin`. Affiche une erreur le cas échéant.
 *
 * **Mode démo** (Supabase non configuré) : aucun formulaire — message
 * explicite + retour `/admin` (accès démo conservé).
 * ============================================================================
 */

export function LoginForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mode démo : Supabase Auth n&apos;est pas configuré. Le Back-Office
          reste accessible sans connexion (données du tenant de démonstration).
        </p>
        <Button asChild variant="outline">
          <Link href="/admin">Accéder au Back-Office</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = event.currentTarget;
      const result = await loginAction(new FormData(form));
      if (result?.error) {
        setError(result.error);
      }
    } catch (loginError) {
      // Redirection attendue (NEXT_REDIRECT) gérée par Next ; autre erreur → UI.
      if (
        loginError instanceof Error &&
        loginError.message.includes("NEXT_REDIRECT")
      ) {
        return;
      }
      setError("Une erreur inattendue est survenue lors de la connexion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="photographe@exemple.fr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
