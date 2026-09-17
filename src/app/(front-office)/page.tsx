import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { PublicModulesList } from "@/components/modules/PublicModules";
import {
  getHomepageState,
  publicDescription,
  publicOgImage,
} from "@/lib/public-page";
import { siteName } from "@/lib/site";

/**
 * ============================================================================
 * PAGE D'ACCUEIL `/` — 3 états explicites (Étape 10.1)
 * ----------------------------------------------------------------------------
 * La route racine résout la page marquée **`is_home`** en BDD :
 *   - `ready`   → rendu des modules (comportement historique) ;
 *   - `draft`   → `notFound()` (l'accueil existe mais n'est pas publié) ;
 *   - `missing` → écran **`WelcomeOnboarding`** (200 + `noindex`), au lieu du
 *     contenu de démonstration inventé en mémoire.
 * ============================================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomepageState();

  if (home.state === "missing") {
    return {
      title: `${siteName} — site en cours de configuration`,
      robots: { index: false, follow: false },
    };
  }
  if (home.state === "draft") {
    return {
      title: "Page introuvable",
      robots: { index: false, follow: false },
    };
  }

  const page = home.page;
  const description = publicDescription(page.modules);
  const ogImage = publicOgImage(page.modules);
  return {
    title: page.title,
    description,
    openGraph: {
      title: page.title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function Home() {
  const home = await getHomepageState();

  if (home.state === "missing") {
    return <WelcomeOnboarding />;
  }
  if (home.state === "draft") {
    // Accueil existant mais non publié → non visible publiquement.
    notFound();
  }

  const page = home.page;
  // Modules **visibles** uniquement (le Toggle Eye masque sur le site public).
  const visibleModules = page.modules.filter((module) => !module.hidden);

  return (
    <main className="flex-1">
      {/* Le titre de niveau 1 est décidé par la liste : un seul module le porte,
          sinon la page pose son titre en `sr-only` (jamais de page sans h1). */}
      <PublicModulesList
        modules={visibleModules}
        pageTitle={page.title}
        exifByUrl={page.exifByUrl}
        pageSlug={page.slug}
        ownerAddress={page.ownerAddress}
      />
    </main>
  );
}
