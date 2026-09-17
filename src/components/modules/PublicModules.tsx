import { MediaImage } from "@/components/common/MediaImage";
import { BannerBackground } from "@/components/modules/banner/BannerBackground";
import { CardsModule } from "@/components/modules/cards/CardsModule";
import { ContactModule } from "@/components/modules/contact/ContactModule";
import { ContactMapModule } from "@/components/modules/contact-map/ContactMapModule";
import { ContentColumnsModule } from "@/components/modules/content/ContentColumnsModule";
import { GalleryManager } from "@/components/modules/gallery/GalleryManager";
import { BaseHero } from "@/components/modules/hero/BaseHero";
import { HeroModule } from "@/components/modules/hero/HeroModule";
import { bannerEffectiveVariant } from "@/lib/banner-effects";
import {
  BANNER_HEIGHT_CLASS,
  heroH1Text,
  resolveCtaBannerContent,
  resolveGalleryContent,
  type PageModule,
} from "@/lib/pages";

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
        {/* `module-h2` : taille, interligne, police et graisse viennent des
            jetons `--h2-*` (globals.css) — une seule échelle pour tous les H2
            éditoriaux du site, modules publics compris. */}
        <h2 className="module-h2">
          {content.heading}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[var(--text-muted)]">
          {content.text}
        </p>
      </div>
    </section>
  );
}

/**
 * Galerie (contenu `gallery`) — variantes static / dynamic / portfolio.
 * Le contenu JSONB est normalisé (`resolveGalleryContent`, rétro-compatible
 * legacy masonry → static) puis confié à `GalleryManager` (client) qui gère la
 * grille, les effets, le CTA et la Lightbox générique.
 */
export function GalleryModule({
  module,
  exifByUrl,
}: {
  module: PageModule;
  exifByUrl?: Record<string, unknown>;
}) {
  const content = module.content.type === "gallery" ? module.content : null;
  if (!content) return null;

  const resolved = resolveGalleryContent(content);
  // Étape 11.20 — les images des albums **masqués** ne comptent pas : si tout
  // est masqué, la section galerie n'est pas rendue (pas de grille vide).
  const hasVisibleImages =
    resolved.variant === "portfolio"
      ? resolved.albums
          .filter((album) => !album.hidden)
          .some((album) =>
            album.images.some((image) => image.url !== "" && !image.hidden)
          )
      : resolved.images.some((image) => image.url !== "" && !image.hidden);
  if (!hasVisibleImages) return null;

  return (
    <section id={module.anchorId} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <GalleryManager
        content={resolved}
        exifByUrl={exifByUrl}
        priorityFirst
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
      {/* `module-h2` : taille, interligne, police et graisse viennent des
          jetons `--h2-*` (globals.css) — une seule échelle pour tous les H2
          éditoriaux du site, modules publics compris. */}
      <h2 className="module-h2">
        {content.heading}
      </h2>
      <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{content.intro}</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {content.items.map((item) => (
          <article key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6">
            {/* `module-h3` : même échelle que le « Sous-titre » du texte riche
                (jetons `--h3-*`), pour qu'un titre de carte et un intertitre
                ne divergent pas d'une section à l'autre. */}
            <h3 className="module-h3">{item.title}</h3>
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

/**
 * Bandeau message ou d'appel à l'action (contenu `cta-banner`) — Étape 11.27.
 *
 * Séparateur **pleine largeur** dont la hauteur (petit / standard / grand) et le
 * fond (**couleur unie, carrousel, parallaxe, vidéo**) se règlent par module.
 *
 * Réutilisation assumée des briques existantes : le cadre est celui du Héro
 * (`BaseHero`), le message celui de `HeroTextBlock`. Le CTA hérite donc, sans
 * une ligne de plus ici, de la discrimination de destination livrée en 11.26
 * (ancre interne rendue par `NavLink` avec compensation du Header fixe, URL
 * absolue en nouvel onglet, `mailto:` / `tel:` en même onglet).
 *
 * Deux réglages de `BaseHero` sont adaptés au rôle de **séparateur** :
 * `titleTag="h2"` (un séparateur ne porte jamais le titre de la page) et
 * `pullUp={false}` (il ne remonte pas sous le Header, contrairement à un Héro
 * placé en tête de page).
 */
export function CtaBannerModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "cta-banner" ? module.content : null;
  if (!raw) return null;

  // Forme complète (upgrade legacy + défauts) — le rendu ne lit rien de brut.
  const content = resolveCtaBannerContent(raw);

  return (
    <BaseHero
      module={module}
      content={content}
      // Un aplat de couleur n'a pas besoin d'assombrissement ; un fond média, si.
      hasImage={bannerEffectiveVariant(content) !== "color"}
      minHeightClass={BANNER_HEIGHT_CLASS[content.height]}
      pullUp={false}
      titleTag="h2"
    >
      <BannerBackground content={content} />
    </BaseHero>
  );
}

/** FAQ (contenu `faq`) — rendu natif accessible (aucun état client). */
export function FaqModule({ module }: { module: PageModule }) {
  const content = module.content.type === "faq" ? module.content : null;
  if (!content) return null;

  return (
    <section id={module.anchorId} className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="module-h2 mb-8 text-center">
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

/**
 * Aiguillage du rendu public par type de module.
 *
 * `titleTag` est le **niveau de titre accordé par la page** (voir
 * `PublicModulesList`) : seul le module qui porte le titre de la page reçoit
 * `"h1"`, tous les autres `"h2"`. Les modules qui ne rendent pas de titre
 * l'ignorent simplement ; le bandeau, lui, décide du sien (`h2` — c'est un
 * séparateur).
 */
export function PageModuleRenderer({
  module,
  exifByUrl,
  titleTag,
  pageSlug = "",
  ownerAddress = "",
}: {
  module: PageModule;
  exifByUrl?: Record<string, unknown>;
  titleTag?: "h1" | "h2";
  /**
   * Slug de la page porteuse — transmis **uniquement** au module contact, dont
   * le formulaire en a besoin pour que le serveur résolve la page publiée et en
   * déduise le destinataire (14.1 D13). Aucun autre module ne le consomme.
   */
  pageSlug?: string;
  /**
   * Adresse du profil, transmise **uniquement** au module `contact-map` (14.2
   * D3). Résolue par le loader serveur et non par le composant : un Server
   * Component ne doit pas ouvrir une lecture BDD au milieu du rendu.
   */
  ownerAddress?: string;
}) {
  switch (module.content.type) {
    case "hero":
      return <HeroModule module={module} titleTag={titleTag} />;
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
      return <ContactModule module={module} pageSlug={pageSlug} />;
    case "contact-map":
      return (
        <ContactMapModule module={module} ownerAddress={ownerAddress} />
      );
    case "content":
      return <ContentColumnsModule module={module} />;
    case "cards":
      return <CardsModule module={module} />;
  }
}

/**
 * ============================================================================
 * LISTE DES MODULES PUBLICS — dont la « scène » du Hero Rideau
 * ----------------------------------------------------------------------------
 * Rend la liste complète des modules visibles d'une page. Tant qu'aucun Héro
 * « rideau » n'est présent, c'est un simple `map` — le rendu ne change pas d'un
 * octet. Dès qu'un rideau existe, la liste est découpée en trois morceaux :
 *
 *   1. **Les modules d'avant** — inchangés.
 *   2. **La scène** (`.hero-scene`) — le Héro rideau, puis un conteneur qui
 *      recouvre. C'est cette scène, et elle seule, qui donne au Héro la place
 *      de rester épinglé : `position: sticky` n'immobilise un élément que
 *      **tant que son conteneur continue**, et le conteneur du rideau est ici
 *      exactement « le rideau + ce qui doit passer devant lui ». La photo est
 *      donc figée pendant toute la traversée des sections suivantes, et jamais
 *      au-delà.
 *   3. **Le recouvrement** (`.hero-cover`) — les modules d'après, dans un
 *      **bloc pleine largeur** qui peint le fond du thème et passe à l'étage 1.
 *      C'est lui, le rideau : il couvre la photo de toute la largeur de l'écran,
 *      là où peindre le fond des sections une par une laissait la photo visible
 *      dans les marges (les sections publiques sont centrées et limitées en
 *      largeur : À propos et Prestations à 1280 px, FAQ à 768 px).
 *
 * Corollaire assumé, et seule limite du procédé : **un rideau doit avoir des
 * sections après lui**. Placé en dernière position, la scène s'arrête à la fin
 * de la photo, `sticky` n'a plus aucune course pour la retenir, et l'image
 * défile normalement avec la page — c'est ce que l'éditeur rappelle au
 * photographe.
 *
 * **Elle porte aussi l'unique `h1` de la page** (voir le calcul commenté plus
 * bas) : un seul module reçoit le niveau 1 — le Héro de tête dont le titre est
 * renseigné — tous les autres reçoivent `h2`, et la page ajoute un `h1`
 * invisible (titre de page) quand aucun module ne peut le porter. La règle
 * appartient à la page, pas aux modules : c'était le seul moyen de garantir
 * « un seul `h1`, jamais vide » sur les pages sans héro comme sur celles qui
 * empilent plusieurs héros ou un carrousel.
 * ============================================================================
 */
export function PublicModulesList({
  modules,
  pageTitle,
  exifByUrl,
  pageSlug = "",
  ownerAddress = "",
}: {
  modules: PageModule[];
  /**
   * Titre de la page (même valeur que `<title>` et l'Open Graph). Il devient le
   * `h1` **invisible** de la page quand aucun module ne peut le porter.
   */
  pageTitle: string;
  exifByUrl?: Record<string, unknown>;
  /**
   * Slug de la page — descendu jusqu'au formulaire contact (14.1 D13). Absent
   * sur une page qui n'ouvre pas d'écriture (démonstration), auquel cas aucun
   * formulaire ne pourra aboutir.
   */
  pageSlug?: string;
  /**
   * Adresse du profil — descendue jusqu'au module `contact-map` (14.2 D3).
   * Même tuyau que `pageSlug` : la page la résout une fois, la liste la
   * transmet, les modules qui l'ignorent ne la lisent pas.
   */
  ownerAddress?: string;
}) {
  // ---- Le titre de niveau 1, décidé UNE fois pour toute la page ------------
  // Règle unique, et la seule du projet : le `h1` va au **premier module**,
  // s'il est de la famille Héro et que son titre est renseigné. Partout
  // ailleurs — héro au milieu ou en fin de page (l'ajout de section place en
  // fin !), carrousel, titre vidé — le niveau redescend en `h2`, et la page
  // prend son titre de repli. Aucun module ne décide seul : sans cela, un
  // second héro, les diapositives d'un carrousel ou un titre vidé produisaient
  // plusieurs `h1`, voire un `h1` vide.
  const first = modules[0];
  const firstHeroContent =
    first && first.content.type === "hero" ? first.content : null;
  const firstHeroTitle = firstHeroContent
    ? heroH1Text(firstHeroContent).trim()
    : "";
  const h1ModuleId = first && firstHeroTitle !== "" ? first.id : null;

  const renderModule = (module: PageModule) => (
    <PageModuleRenderer
      key={module.id}
      module={module}
      exifByUrl={exifByUrl}
      titleTag={module.id === h1ModuleId ? "h1" : "h2"}
      pageSlug={pageSlug}
      ownerAddress={ownerAddress}
    />
  );

  // Repli : `sr-only` est un vrai texte (pas un `display: none`), donc lu par
  // les lecteurs d'écran **et** indexé — la page n'est jamais sans titre.
  const fallbackH1 =
    h1ModuleId === null ? <h1 className="sr-only">{pageTitle}</h1> : null;

  const curtainIndex = modules.findIndex(
    (module) =>
      module.content.type === "hero" && module.content.variant === "curtain"
  );

  if (curtainIndex === -1) {
    return (
      <>
        {fallbackH1}
        {modules.map(renderModule)}
      </>
    );
  }

  const before = modules.slice(0, curtainIndex);
  const curtain = modules[curtainIndex];
  const after = modules.slice(curtainIndex + 1);

  return (
    <>
      {fallbackH1}
      {before.map(renderModule)}
      <div className="hero-scene">
        {renderModule(curtain)}
        {after.length > 0 ? (
          <div className="hero-cover">{after.map(renderModule)}</div>
        ) : null}
      </div>
    </>
  );
}
