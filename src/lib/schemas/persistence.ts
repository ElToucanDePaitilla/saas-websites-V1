/**
 * ============================================================================
 * SCHÉMAS ZOD — Mutations de persistance BDD (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Valide les corps des requêtes d'écriture (Route Handlers `/api/*`) avant
 * tout accès BDD. Les valeurs correspondent aux types du **domaine** mock
 * (`SitePage`, `PageModule`, `NavMenuEntry`) — source unique des formes.
 *
 * Zéro `any` : les contenus JSONB de modules restent volontairement ouverts
 * (`unknown`) à la frontière (validés finement côté domaine à l'usage).
 * ============================================================================
 */

import { z } from "zod";

/** Statut de publication d'une page. */
const pageStatusSchema = z.enum(["draft", "published"]);

/**
 * Familles de modules (PageModuleType).
 *
 * ⚠️ Cette énumération est un **quatrième** point d'intégration d'une nouvelle
 * famille — et il ne se signale pas à la compilation, puisque Zod construit son
 * type par inférence. L'oublier ne casse ni `tsc`, ni le build : l'ajout du
 * module échoue seulement **à l'enregistrement**, avec un HTTP 400 au corps
 * JSON. À vérifier à chaque nouvelle famille (avec `moduleTypeEnum` côté
 * Postgres et les deux `switch` sans branche par défaut).
 */
const moduleTypeSchema = z.enum([
  "hero",
  "about",
  "services",
  "cta-banner",
  "gallery",
  "faq",
  "contact",
  // Étape 12.1 — « Contenu en colonnes ».
  "content",
  // Étape 13.1 — « Cards ».
  "cards",
  // Étape 14.2 — « Contact Map ».
  "contact-map",
]);

/** Animations d'entrée (ModuleAnimation). */
const moduleAnimationSchema = z.enum([
  "default",
  "fade-up",
  "fade-in",
  "scale-in",
  "none",
]);

/* --------------------------------------------------------------------------
   Schémas de CONTENU Héro (Étape 7.1→7.3) — validation de persistance.
   Mi­roir des types du domaine (src/lib/pages.ts). `heroContentSchema` est une
   union discriminée par `variant` : static / slider / video.
   -------------------------------------------------------------------------- */

const heroOverlaySchema = z.enum(["none", "light", "medium", "strong"]);
const heroTextToneSchema = z.enum(["light", "dark"]);
const fontWeightSchema = z.enum([
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
]);
const heroCtaStyleSchema = z.enum(["primary", "secondary", "outline"]);
const artSourceSchema = z.object({ url: z.string(), alt: z.string() });
const heroStaticMediaSchema = z.object({
  desktop: artSourceSchema,
  mobile: artSourceSchema,
  tablet: artSourceSchema.nullable(),
});

/** Champs partagés du bloc texte/CTA (BaseHero). */
const heroSharedSchema = z.object({
  overlayLevel: heroOverlaySchema,
  textTone: heroTextToneSchema,
  titleH1: z.string(),
  subtitleH2: z.string(),
  descriptionText: z.string(),
  weightH1: fontWeightSchema,
  weightH2: fontWeightSchema,
  weightText: fontWeightSchema,
  ctaShow: z.boolean(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  ctaStyle: heroCtaStyleSchema,
});

/** Variante « static » (HeroStatic). */
const heroStaticContentSchema = heroSharedSchema.extend({
  variant: z.literal("static"),
  media: heroStaticMediaSchema,
});

/** Réglages du moteur slider. */
const heroAutoplaySpeedSchema = z.union([
  z.literal(3000),
  z.literal(5000),
  z.literal(7000),
  z.literal(10000),
]);
const heroSliderSettingsSchema = z.object({
  autoplay: z.boolean(),
  autoplaySpeedMs: heroAutoplaySpeedSchema,
  transition: z.enum(["slide", "fade"]),
  showArrows: z.boolean(),
  showDots: z.boolean(),
});

/** Slide du HeroSlider. */
const heroSliderSlideSchema = heroSharedSchema
  .omit({ weightH1: true, weightH2: true, weightText: true })
  .extend({
    id: z.string().min(1),
    media: heroStaticMediaSchema,
  });

/** Variante « slider » (HeroSlider). */
const heroSliderContentSchema = z.object({
  variant: z.literal("slider"),
  slides: z.array(heroSliderSlideSchema),
  weightH1: fontWeightSchema,
  weightH2: fontWeightSchema,
  weightText: fontWeightSchema,
  settings: heroSliderSettingsSchema,
});

/** Médias d'un HeroVideo (fallback responsive). */
const heroVideoMediaSchema = z.object({
  videoUrl: z.string(),
  loop: z.boolean(),
  posterDesktop: artSourceSchema,
  fallbackMobile: artSourceSchema,
});

/** Variante « video » (HeroVideo). */
const heroVideoContentSchema = heroSharedSchema.extend({
  variant: z.literal("video"),
  media: heroVideoMediaSchema,
});

/** Intensité parallaxe (échelle « force » 7 niveaux). */
const parallaxSpeedSchema = z.enum([
  "very-light",
  "light",
  "medium",
  "pronounced",
  "strong",
  "very-strong",
  "extreme",
]);

/** Variante « parallax » (HeroParallax) — media static + intensité. */
const heroParallaxContentSchema = heroSharedSchema
  .extend({
    variant: z.literal("parallax"),
    media: heroStaticMediaSchema,
    parallaxSpeed: parallaxSpeedSchema,
    disableOnMobile: z.literal(true),
  });

/** Variante « curtain » (Hero Rideau) — média static, **aucun réglage propre** :
 *  l'épinglage de la section et le recouvrement par la suivante sont une
 *  mécanique CSS (`.hero-curtain`), sans paramètre à valider. */
const heroCurtainContentSchema = heroSharedSchema.extend({
  variant: z.literal("curtain"),
  media: heroStaticMediaSchema,
});

/** Union des contenus Héro validée (static / slider / video / parallax / curtain). */
export const heroContentSchema = z.discriminatedUnion("variant", [
  heroStaticContentSchema,
  heroSliderContentSchema,
  heroVideoContentSchema,
  heroParallaxContentSchema,
  heroCurtainContentSchema,
]);

/* --------------------------------------------------------------------------
   Schémas de CONTENU Galerie (Phase 11) — validation de persistance.
   Miroir des types du domaine (src/lib/pages.ts). `galleryContentSchema` est
   une union discriminée par `variant` : static / dynamic / portfolio.
   -------------------------------------------------------------------------- */

const galleryDisplayModeSchema = z.enum(["uniform", "masonry"]);
const galleryHoverAnimationSchema = z.enum(["active", "none"]);
const galleryShadowLevelSchema = z.enum([
  "none",
  "light",
  "medium",
  "normal",
  "strong",
]);
const galleryBorderSchema = z.object({
  enabled: z.boolean(),
  width: z.number(),
  color: z.string(),
});

/**
 * Famille d'effets de survol cumulables (Étape 11.23).
 *
 * **Tous les champs sont optionnels** : un contenu enregistré avant cette étape
 * reste valide sans modification, et `resolveGalleryHoverEffects` complète
 * champ par champ à la lecture (les valeurs par défaut reproduisent le rendu
 * historique). **Aucune migration BDD** — même technique que `badge.display`
 * (11.16) et `album.hidden` (11.20).
 */
const galleryHoverEffectsSchema = z.object({
  zoom: z.number().optional(),
  lift: z.number().optional(),
  parallax: z.number().optional(),
  shine: z.boolean().optional(),
  saturate: z.boolean().optional(),
  glow: z.boolean().optional(),
});

/** Mise en page d'une galerie (grille, espacements, finitions, survol). */
const galleryLayoutSchema = z.object({
  display: galleryDisplayModeSchema,
  columns: z.number(),
  gapHorizontal: z.number(),
  gapVertical: z.number(),
  radius: z.number(),
  shadow: galleryShadowLevelSchema,
  border: galleryBorderSchema,
  hoverAnimation: galleryHoverAnimationSchema,
  hoverOverlay: z.boolean(),
  /** Effets de survol cumulables (11.23) — optionnels : aucune migration. */
  hoverEffects: galleryHoverEffectsSchema.optional(),
});

/** Effet de finition exclusif + son paramétrage contextuel. */
const galleryEffectSchema = z.object({
  effect: z.enum(["none", "museum-pass", "glass", "polaroid"]),
  intensity: z.enum(["light", "normal", "strong"]),
  matColor: z.string(),
  matBevel: z.boolean(),
  glassBlur: z.number(),
  glassTint: z.string(),
  polaroidCaptionShow: z.boolean(),
  polaroidRotation: z.boolean(),
});

/** CTA de pied de galerie. */
const galleryCtaSchema = z.object({
  show: z.boolean(),
  label: z.string(),
  href: z.string(),
  style: heroCtaStyleSchema,
});

/** Réglages de Lightbox (zoom / EXIF / légendes). */
const galleryLightboxSchema = z.object({
  zoomEnabled: z.boolean(),
  zoomLevel1: z.number(),
  zoomLevel2: z.number(),
  showExif: z.boolean(),
  showCaption: z.boolean(),
});

/**
 * Affichage sur les couvertures d'albums (Portfolio).
 * `display` est **optionnel** : un contenu enregistré avant l'ajout du réglage
 * reste valide (`resolveGalleryBadge` applique alors « always »).
 */
const galleryBadgeSchema = z.object({
  display: z.enum(["none", "always", "hover"]).optional(),
  showLabel: z.boolean(),
  showCount: z.boolean(),
  position: z.enum([
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "center",
  ]),
  style: z.enum(["solid", "glass", "outline"]),
});

/** Visuel de galerie (GalleryImage). */
const galleryImageSchema = z.object({
  id: z.string().min(1),
  url: z.string(),
  alt: z.string(),
  filename: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  hidden: z.boolean().optional(),
});

/** Socle commun des trois variantes de galerie. */
const gallerySharedSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  layout: galleryLayoutSchema,
  effect: galleryEffectSchema,
  cta: galleryCtaSchema,
  lightbox: galleryLightboxSchema,
  badge: galleryBadgeSchema,
});

const galleryStaticContentSchema = gallerySharedSchema.extend({
  variant: z.literal("static"),
  images: z.array(galleryImageSchema),
});

const galleryDynamicContentSchema = gallerySharedSchema.extend({
  variant: z.literal("dynamic"),
  images: z.array(galleryImageSchema),
});

/** Album de galerie (GalleryAlbum). */
const galleryAlbumSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  description: z.string(),
  coverImageId: z.string().nullable(),
  images: z.array(galleryImageSchema),
  /** Masquage du site public (11.20) — **optionnel** : aucune migration. */
  hidden: z.boolean().optional(),
});

const galleryPortfolioContentSchema = gallerySharedSchema.extend({
  variant: z.literal("portfolio"),
  albums: z.array(galleryAlbumSchema),
});

/** Union des contenus Galerie validée (static / dynamic / portfolio). */
export const galleryContentSchema = z.discriminatedUnion("variant", [
  galleryStaticContentSchema,
  galleryDynamicContentSchema,
  galleryPortfolioContentSchema,
]);

/* --------------------------------------------------------------------------
   Schémas de CONTENU Cards (Étapes 13.1 → 13.3) — validation de persistance.
   Miroir des types du domaine (src/lib/pages.ts). Les quatre variantes
   (portrait / square / landscape / editorial) partagent un socle commun
   extensible, réuni par une **union discriminée par `variant`** (13.2) : la
   variante éditoriale n'ajoute que la forme de ses cartes. Les effets de
   survol, la bordure et les réglages apparus après coup sont **optionnels**,
   comme pour la galerie : un contenu enregistré sans eux reste valide et le
   résolveur du domaine complète champ par champ.
   -------------------------------------------------------------------------- */

const cardsColumnsSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
const cardsAlignSchema = z.enum(["left", "center"]);
const cardsPhotoFormatSchema = z.enum(["portrait", "square", "landscape"]);

const cardsHoverEffectsSchema = z.object({
  zoom: z.number().optional(),
  shine: z.boolean().optional(),
  saturate: z.boolean().optional(),
  glow: z.boolean().optional(),
});

/**
 * Bouton d'une carte : **son contenu seulement**.
 *
 * Le style (`primary` / `secondary` / `outline`) est un réglage de **section**
 * (`style.ctaStyle`) — trois boutons d'aspects différents dans une même rangée
 * se liraient comme trois éléments de nature différente. Les contenus
 * enregistrés en 13.1 portent encore un `cta.style` : il n'est plus écrit, plus
 * lu, et reste sans effet (le résolveur du domaine l'ignore).
 */
const cardCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const cardItemSchema = z.object({
  id: z.string().min(1),
  media: artSourceSchema,
  title: z.string(),
  text: z.string(),
  cta: cardCtaSchema,
});

/**
 * Document ProseMirror d'un corps de carte éditoriale (Étape 13.3).
 *
 * Miroir **minimal** de `RichTextDoc` : la clé `type: "doc"` et un tableau de
 * nœuds. La structure profonde n'est pas revalidée ici — le domaine la lit par
 * liste blanche (`resolveEditorialBody`) et le rendu par liste blanche aussi
 * (`RichTextRenderer`). Ce schéma décrit la forme, pas le contenu.
 */
const richTextDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).optional(),
});

/** Carte éditoriale : photo, corps riche, bouton (pas de titre ni texte). */
const editorialCardItemSchema = z.object({
  id: z.string().min(1),
  media: artSourceSchema,
  body: richTextDocSchema,
  cta: cardCtaSchema,
});

/** Contenu du module `cards` — exporté comme les autres familles, pour servir
 *  de miroir lisible du domaine.
 *
 *  `.optional()` sur `landscapeRatio`, `bodyRadius` et `bodyBorderWidth` : ces
 *  réglages sont apparus **après** les premières cartes enregistrées (13.1 et
 *  13.2). Les rendre obligatoires invaliderait des contenus existants ;
 *  facultatifs, ils sont complétés à la lecture par `resolveCardsContent`
 *  (même technique que `hoverEffects` en 11.23 et `album.hidden` en 11.20).
 *
 *  `variant: "classic"` — la valeur historique du format portrait — n'est plus
 *  produite, mais reste **lue** : le résolveur du domaine la traduit en
 *  `"portrait"`. Le schéma décrit donc ce que l'application écrit, pas ce
 *  qu'elle a pu écrire.
 */
const cardsSharedSchema = z.object({
  type: z.literal("cards"),
  heading: z.string(),
  subtitle: z.string(),
  intro: z.string(),
  layout: z.object({
    columns: cardsColumnsSchema,
    align: cardsAlignSchema,
    landscapeRatio: z.enum(["3:2", "4:3", "16:9"]).optional(),
    /** Cadrage photo de la variante `editorial` (13.3) — optionnel : aucun
     *  contenu antérieur ne le porte, le résolveur applique « portrait ». */
    editorialFormat: cardsPhotoFormatSchema.optional(),
  }),
  style: z.object({
    radius: z.number(),
    shadow: galleryShadowLevelSchema,
    border: galleryBorderSchema,
    bodyRadius: z.number().optional(),
    bodyBorderWidth: z.number().optional(),
    /** Style des boutons de la section (13.2.b) — optionnel : les contenus
     *  antérieurs n'ont que le style par carte, désormais ignoré. */
    ctaStyle: heroCtaStyleSchema.optional(),
    /** Affichage des boutons de la section (13.3) — optionnel : absent des
     *  contenus antérieurs, les boutons restaient affichés, donc défaut `true`. */
    ctaShow: z.boolean().optional(),
    hover: cardsHoverEffectsSchema.optional(),
  }),
  cards: z.array(cardItemSchema),
});

const cardsPortraitContentSchema = cardsSharedSchema.extend({
  variant: z.literal("portrait"),
});

const cardsSquareContentSchema = cardsSharedSchema.extend({
  variant: z.literal("square"),
});

const cardsLandscapeContentSchema = cardsSharedSchema.extend({
  variant: z.literal("landscape"),
});

/**
 * Variante `editorial` (Étape 13.3) : même socle, mais des cartes dont le corps
 * est un document riche — `cards` est donc **redéfini**, et non complété.
 * L'union discriminée par `variant` reste la même qu'avant : on ajoute une
 * branche, on ne change pas de mécanique.
 */
const cardsEditorialContentSchema = cardsSharedSchema.extend({
  variant: z.literal("editorial"),
  cards: z.array(editorialCardItemSchema),
});

/** Union des contenus Cards validée (portrait / square / landscape / editorial). */
export const cardsContentSchema = z.discriminatedUnion("variant", [
  cardsPortraitContentSchema,
  cardsSquareContentSchema,
  cardsLandscapeContentSchema,
  cardsEditorialContentSchema,
]);

/** Identifiant UUID (côté client : crypto.randomUUID()). */
const uuidSchema = z.string().min(1);

/** Métadonnées d'une page (payload création / mise à jour). */
export const pageMetadataSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1),
  menuTitle: z.string().min(1),
  slug: z.string(),
  status: pageStatusSchema,
  inMenu: z.boolean(),
});

/** Module de page (liste complète des modules d'une page). */
export const moduleSchema = z.object({
  id: uuidSchema,
  type: moduleTypeSchema,
  title: z.string(),
  hidden: z.boolean(),
  animation: moduleAnimationSchema,
  anchorId: z.string(),
  layoutVariant: z.string().optional(),
  content: z.unknown(),
});

/** Payload de remplacement des modules d'une page. */
export const updateModulesPayloadSchema = z.object({
  modules: z.array(moduleSchema),
});

/* --------------------------------------------------------------------------
   PROFIL propriétaire (Étape 8.1 — site_owner_profile)
   -------------------------------------------------------------------------- */

/** Personne grammaticale (IA). */
const grammaticalPersonSchema = z.enum(["vouvoyer", "tutoyer"]);
/** Style de communication (IA). */
const communicationStyleSchema = z.enum([
  "formal",
  "warm",
  "creative",
  "dynamic",
]);

/** Réseaux sociaux (URL libres). */
const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  x: z.string().optional(),
});

/** Profil du propriétaire / de la marque (source de vérité du Builder). */
export const OwnerProfileSchema = z.object({
  // Identité & visuels — noms autorisés vides : le Header retombe sur `siteName`
  // tant qu'ils ne sont pas renseignés (persistance tolérante au profil par défaut).
  ownerName: z.string().default(""),
  brandName: z.string().default(""),
  logoUrl: z.string().optional().default(""),
  faviconUrl: z.string().optional().default(""),
  businessSummary: z.string().default(""),
  businessSector: z.string().default(""),
  serviceArea: z.string().default(""),
  keywords: z.string().default(""),
  // Contacts & adresses — emails en TEXTE LIBRE (défaut "") : la persistance ne
  // doit jamais être bloquée par un email non conforme (public cible non
  // technique). L'indication de format reste portée par `type="email"` côté UI.
  address: z.string().optional().default(""),
  showAddress: z.boolean().default(true),
  publicEmail: z.string().default(""),
  showEmail: z.boolean().default(true),
  contactFormEmail: z.string().default(""),
  sameAsPublicEmail: z.boolean().default(true),
  socialLinks: socialLinksSchema.default({}),
  // Légal & ligne éditoriale (IA)
  legalStatus: z.string().optional().default(""),
  siret: z.string().optional().default(""),
  vatNumber: z.string().optional().default(""),
  publicationDirector: z.string().optional().default(""),
  grammaticalPerson: grammaticalPersonSchema.default("vouvoyer"),
  communicationStyle: communicationStyleSchema.default("warm"),
  targetAudience: z.string().optional().default(""),
  documents: z.array(z.string()).default([]),
});

/* --------------------------------------------------------------------------
   IDENTITÉ VISUELLE / LOGO (Étape 9.1 — site_visual_identity)
   -------------------------------------------------------------------------- */

const visualIdentityModeSchema = z.enum(["text", "logo"]);
const visualIdentityTextSizeSchema = z.enum([
  "small",
  "medium",
  "large",
  "xlarge",
  "xxlarge",
]);
const visualIdentityFontWeightSchema = z.enum(["400", "600", "700"]);

/** Une ligne de texte — **ses propres** paramètres (Étape 9.1.a). */
const visualIdentityTextLineSchema = z.object({
  value: z.string().default(""),
  color: z.string().default("#1E293B"),
  size: visualIdentityTextSizeSchema.default("medium"),
  weight: visualIdentityFontWeightSchema.default("600"),
});

/** Ligne 1 (max 35 caractères). */
const visualIdentityLine1Schema = visualIdentityTextLineSchema.extend({
  value: z.string().max(35, "35 caractères maximum").default(""),
});
/** Ligne 2 (max 45 caractères, graisse par défaut plus légère). */
const visualIdentityLine2Schema = visualIdentityTextLineSchema.extend({
  value: z.string().max(45, "45 caractères maximum").default(""),
  weight: visualIdentityFontWeightSchema.default("400"),
});

/** Configuration manuelle de l'espace marque du Header (texte ou logo). */
export const VisualIdentitySchema = z.object({
  mode: visualIdentityModeSchema.default("text"),
  text: z
    .object({
      line1: visualIdentityLine1Schema.default({
        value: "",
        color: "#1E293B",
        size: "medium",
        weight: "600",
      }),
      line2: visualIdentityLine2Schema.default({
        value: "",
        color: "#1E293B",
        size: "medium",
        weight: "400",
      }),
    })
    .default({
      line1: { value: "", color: "#1E293B", size: "medium", weight: "600" },
      line2: { value: "", color: "#1E293B", size: "medium", weight: "400" },
    }),
  logo: z
    .object({
      url: z.string().default(""),
      altText: z.string().default(""),
    })
    .default({ url: "", altText: "" }),
});

/** Protocole de changement de mot de passe sécurisé. */
export const ProfileSecuritySchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "8 caractères minimum avec majuscule, chiffre et symbole")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Au moins un symbole"),
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean().default(true),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/** Type de cible d'une entrée de navigation. */
const navKindSchema = z.enum(["page", "custom"]);

/** Zone de menu. */
const navZoneSchema = z.enum(["header", "footer"]);

/** Valeur (TypeScript) d'une entrée de navigation — forme arborescente. */
export interface NavEntryValue {
  id: string;
  label: string;
  kind: "page" | "custom";
  href: string;
  hidden: boolean;
  auto: boolean;
  pageId: string | null;
  children?: NavEntryValue[];
}

/** Schéma d'entrée de navigation (auto-référencé pour le Niveau 2). */
export const navEntrySchema: z.ZodType<NavEntryValue> = z.object({
  id: uuidSchema,
  label: z.string().min(1),
  kind: navKindSchema,
  href: z.string(),
  hidden: z.boolean(),
  auto: z.boolean(),
  pageId: z.string().nullable(),
  children: z.array(z.lazy(() => navEntrySchema)).optional(),
});

/** Navigation complète d'une zone (Header / Footer). */
export const navZonePayloadSchema = z.object({
  zone: navZoneSchema,
  entries: z.array(navEntrySchema),
});

/** Payload de remplacement complet de la navigation. */
export const saveNavigationPayloadSchema = z.object({
  header: z.array(navEntrySchema),
  footer: z.array(navEntrySchema),
});

/** Payload d'application d'un preset Onboarding. */
export const applyPresetPayloadSchema = z.object({
  presetId: z.enum(["artiste", "commercial", "passionne"]),
});

/** Types dérivés exposés aux route handlers. */
export type PageMetadataPayload = z.infer<typeof pageMetadataSchema>;
export type ModulePayload = z.infer<typeof moduleSchema>;
export type SaveNavigationPayload = z.infer<typeof saveNavigationPayloadSchema>;
