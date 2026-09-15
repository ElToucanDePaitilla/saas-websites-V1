import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicModulesList } from "@/components/modules/PublicModules";
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
      />
    </main>
  );
}
