import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageModuleRenderer } from "@/components/modules/PublicModules";
import {
  getPublicPage,
  publicDescription,
  publicOgImage,
} from "@/lib/public-page";
import { siteName } from "@/lib/site";

/**
 * ============================================================================
 * PAGE D'ACCUEIL `/` — rendu de la page « Accueil » (slug vide) (Étape 6.3)
 * ----------------------------------------------------------------------------
 * Le contenu est résolu côté serveur (`getPublicPage("")` : BDD publiée →
 * fallback seed) puis rendu via `PageModuleRenderer` — métadonnées SEO
 * dynamiques (`generateMetadata`).
 * ============================================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPage("");
  if (!page) {
    return { title: siteName };
  }
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
  const page = await getPublicPage("");
  if (!page) {
    notFound();
  }

  // Modules **visibles** uniquement (le Toggle Eye masque sur le site public).
  const visibleModules = page.modules.filter((module) => !module.hidden);
  const firstIsHero = visibleModules[0]?.content.type === "hero";

  return (
    <main className="flex-1">
      {!firstIsHero ? <h1 className="sr-only">{page.title}</h1> : null}
      {visibleModules.map((module) => (
        <PageModuleRenderer
          key={module.id}
          module={module}
          exifByUrl={page.exifByUrl}
        />
      ))}
    </main>
  );
}
