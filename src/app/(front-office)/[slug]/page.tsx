import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageModuleRenderer } from "@/components/modules/PublicModules";
import {
  getPublicPage,
  publicDescription,
  publicOgImage,
} from "@/lib/public-page";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * ============================================================================
 * PAGE PUBLIQUE DYNAMIQUE — `/[slug]` (Étape 6.3)
 * ----------------------------------------------------------------------------
 * Charge une page **publiée** (BDD → fallback seed), génère ses **métadonnées
 * SEO** et rend ses modules via `PageModuleRenderer`. Slug inconnu / brouillon
 * → `notFound()` (404).
 * ============================================================================
 */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) {
    return { title: "Page introuvable" };
  }

  const description = publicDescription(page.modules);
  const ogImage = publicOgImage(page.modules);
  const canonical = page.slug === "" ? "/" : `/${page.slug}`;

  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) {
    notFound();
  }

  const firstIsHero = page.modules[0]?.content.type === "hero";

  return (
    <main className="flex-1">
      {/* Titre H1 accessible quand la page ne commence pas par un Hero. */}
      {!firstIsHero ? <h1 className="sr-only">{page.title}</h1> : null}
      {page.modules.map((module) => (
        <PageModuleRenderer
          key={module.id}
          module={module}
          exifByUrl={page.exifByUrl}
        />
      ))}
    </main>
  );
}
