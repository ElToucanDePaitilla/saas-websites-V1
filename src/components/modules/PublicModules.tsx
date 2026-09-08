import { MediaImage } from "@/components/common/MediaImage";
import { GalleryGrid } from "@/components/modules/GalleryGrid";
import { Button } from "@/components/ui/button";
import type { PageModule } from "@/lib/pages";

/**
 * ============================================================================
 * MODULES PUBLICS — renderers Front-Office du Page Builder (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Chaque renderer consomme un `PageModule` (contenu typé `ModuleContent`) et
 * produit le rendu « vitrine » du site :
 *   - `MediaImage` systématique (lazy, WebP/AVIF, blur) ;
 *   - Hero en `priority` (LCP) ;
 *   - Galerie → `GalleryGrid` (grille + Lightbox EXIF, client) ;
 *   - styles via variables CSS « Éclat Minéral & Nacre ».
 * Server Components (statique) — seule la galerie embarque un sous-composant
 * client (`GalleryGrid`) pour la Lightbox.
 * ============================================================================
 */

/** Hero (contenu : titre + accroche + CTA + média). */
export function HeroModule({ module }: { module: PageModule }) {
  const content =
    module.content.type === "hero" ? module.content : null;
  if (!content) return null;

  const hasImage = content.media.url !== "";

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] w-full -mt-4 items-center justify-center overflow-hidden bg-background px-6">
      {hasImage ? (
        <div className="absolute inset-0" aria-hidden="true">
          <MediaImage
            src={content.media.url}
            alt={content.media.alt || content.heading}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      ) : null}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2
          id={module.anchorId}
          style={{ fontFamily: "var(--font-heading)" }}
          className="text-4xl font-light tracking-wide text-white sm:text-5xl lg:text-6xl"
        >
          {content.heading}
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
          {content.subheading}
        </p>
        {content.ctaLabel && content.ctaHref ? (
          <Button asChild size="lg" className="mt-8">
            <a href={content.ctaHref}>{content.ctaLabel}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** Image + texte (contenu `about`). */
export function AboutModule({ module }: { module: PageModule }) {
  const content = module.content.type === "about" ? module.content : null;
  if (!content) return null;

  return (
    <section
      id={module.anchorId}
      className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8"
    >
      {content.media.url ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--surface-color)]">
          <MediaImage
            src={content.media.url}
            alt={content.media.alt || "À propos"}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div>
        <h2
          style={{ fontFamily: "var(--font-heading)" }}
          className="text-3xl font-light tracking-wide sm:text-4xl"
        >
          {content.heading}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[var(--text-muted)]">
          {content.text}
        </p>
      </div>
    </section>
  );
}

/** Galerie (contenu `gallery`) — grille + Lightbox EXIF (client). */
export function GalleryModule({
  module,
  exifByUrl,
}: {
  module: PageModule;
  exifByUrl?: Record<string, unknown>;
}) {
  const content = module.content.type === "gallery" ? module.content : null;
  if (!content) return null;
  if (content.images.length === 0) return null;

  return (
    <section id={module.anchorId} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {content.heading ? (
        <h2
          style={{ fontFamily: "var(--font-heading)" }}
          className="mb-8 text-3xl font-light tracking-wide sm:text-4xl"
        >
          {content.heading}
        </h2>
      ) : null}
      <GalleryGrid
        images={content.images}
        exifByUrl={exifByUrl}
        layout={content.layout}
      />
    </section>
  );
}

/** Cartes de prestations (contenu `services`). */
export function ServicesModule({ module }: { module: PageModule }) {
  const content = module.content.type === "services" ? module.content : null;
  if (!content) return null;

  return (
    <section id={module.anchorId} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h2
        style={{ fontFamily: "var(--font-heading)" }}
        className="text-3xl font-light tracking-wide sm:text-4xl"
      >
        {content.heading}
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{content.intro}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {content.items.map((item) => (
          <article key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6">
            <h3 className="text-lg font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {item.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">{item.price}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Bandeau CTA (contenu `cta-banner`). */
export function CtaBannerModule({ module }: { module: PageModule }) {
  const content = module.content.type === "cta-banner" ? module.content : null;
  if (!content) return null;

  return (
    <section
      id={module.anchorId}
      className="mx-auto my-10 max-w-7xl rounded-2xl bg-accent/30 px-6 py-16 text-center sm:px-8"
    >
      <h2
        style={{ fontFamily: "var(--font-heading)" }}
        className="text-3xl font-light tracking-wide"
      >
        {content.heading}
      </h2>
      <p className="mt-3 text-[var(--text-muted)]">{content.subheading}</p>
      {content.ctaLabel && content.ctaHref ? (
        <Button asChild size="lg" className="mt-6">
          <a href={content.ctaHref}>{content.ctaLabel}</a>
        </Button>
      ) : null}
    </section>
  );
}

/** FAQ (contenu `faq`) — rendu natif accessible (aucun état client). */
export function FaqModule({ module }: { module: PageModule }) {
  const content = module.content.type === "faq" ? module.content : null;
  if (!content) return null;

  return (
    <section id={module.anchorId} className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2
        style={{ fontFamily: "var(--font-heading)" }}
        className="mb-8 text-center text-3xl font-light tracking-wide"
      >
        {content.heading}
      </h2>
      <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
        {content.items.map((item) => (
          <details key={item.id} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium">
              {item.question}
              <span aria-hidden="true" className="transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Contact (contenu `contact`). */
export function ContactModule({ module }: { module: PageModule }) {
  const content = module.content.type === "contact" ? module.content : null;
  if (!content) return null;

  return (
    <section
      id={module.anchorId}
      className="mx-auto grid max-w-4xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2"
    >
      <div>
        <h2
          style={{ fontFamily: "var(--font-heading)" }}
          className="text-3xl font-light tracking-wide"
        >
          {content.heading}
        </h2>
        <p className="mt-3 text-[var(--text-muted)]">{content.intro}</p>
      </div>
      <ul className="space-y-3 text-sm">
        {content.email ? <li>Email : {content.email}</li> : null}
        {content.phone ? <li>Téléphone : {content.phone}</li> : null}
        {content.address ? <li>Adresse : {content.address}</li> : null}
      </ul>
    </section>
  );
}

/** Aiguillage du rendu public par type de module. */
export function PageModuleRenderer({
  module,
  exifByUrl,
}: {
  module: PageModule;
  exifByUrl?: Record<string, unknown>;
}) {
  switch (module.content.type) {
    case "hero":
      return <HeroModule module={module} />;
    case "about":
      return <AboutModule module={module} />;
    case "gallery":
      return <GalleryModule module={module} exifByUrl={exifByUrl} />;
    case "services":
      return <ServicesModule module={module} />;
    case "cta-banner":
      return <CtaBannerModule module={module} />;
    case "faq":
      return <FaqModule module={module} />;
    case "contact":
      return <ContactModule module={module} />;
  }
}
