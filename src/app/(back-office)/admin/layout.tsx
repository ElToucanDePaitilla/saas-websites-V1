import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { PagesStoreProvider } from "@/components/backoffice/PagesStoreProvider";
import { SidebarNav } from "@/components/backoffice/SidebarNav";
import { PagesNavigationSync } from "@/components/backoffice/navigation/PagesNavigationSync";
import { NavigationStoreProvider } from "@/components/backoffice/navigation/NavigationStoreProvider";
import { Button } from "@/components/ui/button";
import { loadInitialData } from "@/db/load-initial-data";
import { siteName } from "@/lib/site";
import { signOutAction } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/demo";
import { createClient } from "@/lib/supabase/server";
import { resolvePhotographerId } from "@/lib/supabase/session";

/**
 * ============================================================================
 * LAYOUT — Back-Office `/admin` : chrome du Dashboard « Pages & Navigation »
 * ----------------------------------------------------------------------------
 * Server Component (aucun `"use client"`). Portée `.admin` sur le conteneur
 * racine : la palette neutre « épurée & haut contraste » (PROJECT_CONTEXT.md
 * §1.2) est héritée par tous les descendants — le Front-Office (route group
 * `(front-office)`) n'est pas affecté.
 *
 * Structure (Desktop-first) :
 *   - Barre latérale fixe (`hidden lg:flex`, largeur `w-60`) : marque du
 *     Dashboard + navigation déléguée au composant client `SidebarNav`
 *     (détermine l'entrée active selon la route via `usePathname`, Étape 4.1).
 *   - Barre supérieure : lien « Aperçu du site » (`/`) + placeholder utilisateur.
 *   - Zone de contenu `flex-1` (pas de `pt-20` : pas de Header public fixe ici).
 *
 * Références : plans/ROADMAP-3.1-pagemetadata.md §1.7 —
 *              plans/ROADMAP-4.1-navigation.md §1.6 — ARCHITECTURE.md §2.
 * ============================================================================
 */

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Étape 5.2/5.4 : état initial chargé côté serveur depuis la BDD pour le
  // photographe **authentifié** (auth.uid()), repli tenant démo sinon ; puis
  // transmis aux stores via la prop `initialData`.
  const photographerId = await resolvePhotographerId();
  const initial = await loadInitialData(photographerId);

  // Étape 5.4 : détecte une session photographe active (pour la déconnexion).
  const authConfigured = isSupabaseConfigured();
  let authenticated = false;
  if (authConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticated = Boolean(user);
    } catch {
      authenticated = false;
    }
  }

  return (
    <div className="admin flex min-h-svh w-full bg-muted/40 text-foreground">
      {/* ---- Barre latérale (Desktop-first) ---- */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Marque du Dashboard */}
        <Link
          href="/admin/pages"
          className="flex h-14 items-center gap-2 border-b border-border px-5"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            P
          </span>
          <span className="text-sm font-semibold tracking-wide">
            Administration
          </span>
        </Link>

        {/* Navigation (client : état actif selon la route) */}
        <SidebarNav />

        <div className="border-t border-border p-3">
          <p className="px-3 text-[11px] text-muted-foreground">
            {siteName} — Dashboard
          </p>
        </div>
      </aside>

      {/* ---- Colonne principale ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <p className="text-sm font-medium">Tableau de bord</p>
          <div className="flex items-center gap-2">
            {authConfigured && authenticated ? (
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Déconnexion
                </Button>
              </form>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Aperçu du site
              </Link>
            </Button>
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            >
              {siteName
                .split(" ")
                .map((part) => part.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase() || "A"}
            </span>
          </div>
        </header>

        {/*
          Zone de contenu — englobée par les stores mock globaux (Pages + Modules)
          et Navigation (globalisés en 4.2 pour permettre la synchronisation
          Pages ↔ Navigation via `PagesNavigationSync`).
        */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <PagesStoreProvider
            initialData={initial.pages}
            persistenceEnabled={initial.dbAvailable}
          >
            <NavigationStoreProvider
              initialData={initial.navigation}
              persistenceEnabled={initial.dbAvailable}
            >
              <PagesNavigationSync />
              {children}
            </NavigationStoreProvider>
          </PagesStoreProvider>
        </main>
      </div>
    </div>
  );
}
