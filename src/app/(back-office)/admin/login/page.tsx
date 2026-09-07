import type { Metadata } from "next";

import { LoginForm } from "@/components/backoffice/auth/LoginForm";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Connexion — Administration",
};

/**
 * ============================================================================
 * PAGE — Connexion Back-Office `/admin/login` (Étape 5.4)
 * ----------------------------------------------------------------------------
 * Authentification du photographe (Supabase Auth, email/mot de passe). En mode
 * démo (auth non configurée), le formulaire invite à revenir au Back-Office.
 * ============================================================================
 */
export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-6 py-12">
      <div className="space-y-1.5 text-center">
        <h1
          style={{ fontFamily: "var(--font-heading)" }}
          className="text-2xl font-medium tracking-wide text-foreground"
        >
          {siteName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Administration — connexion photographe
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-xs">
        <LoginForm />
      </div>
    </div>
  );
}
