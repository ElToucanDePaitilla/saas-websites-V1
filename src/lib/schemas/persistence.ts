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

/** Familles de modules (PageModuleType). */
const moduleTypeSchema = z.enum([
  "hero",
  "about",
  "services",
  "cta-banner",
  "gallery",
  "faq",
  "contact",
]);

/** Animations d'entrée (ModuleAnimation). */
const moduleAnimationSchema = z.enum([
  "default",
  "fade-up",
  "fade-in",
  "scale-in",
  "none",
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
