import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteName } from "@/lib/site";
import { getCurrentPhotographerId } from "@/lib/supabase/session";

/**
 * ============================================================================
 * ÉCRAN D'ONBOARDING PUBLIC — aucune page d'accueil configurée (Étape 10.1)
 * ----------------------------------------------------------------------------
 * Server Component rendu sur `/` lorsque l'état de la page d'accueil est
 * `missing` (aucune page `is_home` en BDD). Il remplace l'ancien contenu de
 * démonstration inventé en mémoire (et évite un 404 brutal) :
 *   - **visiteur non connecté** → explication + CTA de connexion ;
 *   - **administrateur connecté** → guide « page blanche » ou « preset ».
 *
 * Référence : plans/ROADMAP-10.1-site-starter-onboarding.md §D-3
 * ============================================================================
 */

export async function WelcomeOnboarding() {
  const photographerId = await getCurrentPhotographerId();
  const isAdmin = photographerId !== null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
        {isAdmin ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuration du site
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Bienvenue sur votre nouveau site !
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              La route <span className="font-mono">/</span> affiche la{" "}
              <strong className="font-semibold text-foreground">
                page d’accueil
              </strong>{" "}
              de votre site (la page marquée comme telle dans votre Dashboard).
              Comme aucune page d’accueil n’existe pour le moment, cet écran
              s’affiche à la place d’une erreur.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  1 · Partir d’une page blanche
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Créez votre première page de zéro, puis définissez-la comme
                  page d’accueil depuis la liste des pages.
                </p>
                <Button asChild size="sm" className="w-fit">
                  <Link href="/admin/pages">
                    Accéder à Dashboard &gt; Pages
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  2 · Utiliser un preset
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Appliquez une structure de menu prête à l’emploi (Artiste,
                  Commercial, Passionné). Les presets agissent sur la
                  navigation : vous les personnaliserez ensuite.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-fit"
                >
                  <Link href="/admin/navigation">Choisir un preset</Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bientôt en ligne
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Site en cours de configuration
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Le propriétaire de « {siteName} » n’a pas encore publié de page
              d’accueil. Revenez un peu plus tard pour découvrir le site.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Vous êtes le propriétaire ? Connectez-vous pour créer et publier
              votre page d’accueil.
            </p>
            <Button asChild size="sm" className="mt-6 w-fit">
              <Link href="/admin/login">Se connecter au Dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
