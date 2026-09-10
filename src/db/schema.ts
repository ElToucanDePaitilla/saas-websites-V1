/**
 * ============================================================================
 * SCHÉMA DRIZZLE — Volet 2 (Portfolio Photographe), Étape 5.1
 * ----------------------------------------------------------------------------
 * Modélise en PostgreSQL (Supabase) les entités aujourd'hui mock en mémoire :
 *   - `profiles`            : ancrage multi-tenant minimal (propriétaire) ;
 *   - `pages`               : mapping `SitePage` (src/lib/pages.ts) ;
 *   - `page_modules`        : mapping `PageModule` (src/lib/pages.ts) —
 *                             `content` JSONB typé `ModuleContent` ;
 *   - `navigation_entries`  : mapping `NavMenuEntry` (src/lib/navigation.ts) —
 *                             **auto-jointure** `parent_id` pour le Niveau 2
 *                             (Header), ordre = `position` par parent/zone.
 *
 * Contrats de données :
 *   - les types métier restent la source de vérité (pages.ts / navigation.ts) ;
 *   - `content` (JSONB) est typé `$type<ModuleContent>()` (import type-only —
 *     effacé à la compilation, aucun cycle ni `any`) ;
 *   - les garde-fous d'application (Footer plat, profondeur max 2) restent
 *     portés par le code (règles 4.3) — non exprimables proprement en SQL.
 *
 * RLS : activée sur chaque table (cf. migration finale — §0.3 du plan 5.1).
 * Référence : plans/ROADMAP-5.1-database-schema.md §1
 * ============================================================================
 */

import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { OwnerProfile } from "../lib/owner-profile";
import type { ModuleContent } from "../lib/pages";
import type { VisualIdentity } from "../lib/visual-identity";

/* --------------------------------------------------------------------------
   ENUMS — valeurs alignées sur les unions TypeScript des modèles mock
   -------------------------------------------------------------------------- */

/** Statut de publication d'une page (SitePage.status). */
export const pageStatusEnum = pgEnum("page_status", ["draft", "published"]);

/** Familles de modules du Page Builder (PageModuleType). */
export const moduleTypeEnum = pgEnum("module_type", [
  "hero",
  "about",
  "services",
  "cta-banner",
  "gallery",
  "faq",
  "contact",
]);

/** Animations d'entrée d'un module (ModuleAnimation). */
export const moduleAnimationEnum = pgEnum("module_animation", [
  "default",
  "fade-up",
  "fade-in",
  "scale-in",
  "none",
]);

/** Zone de menu (NavArea : header / footer). */
export const navZoneEnum = pgEnum("nav_zone", ["header", "footer"]);

/** Type de cible d'un item de menu (NavItemKind). */
export const navKindEnum = pgEnum("nav_kind", ["page", "custom"]);

/* --------------------------------------------------------------------------
   PROFILES — propriétaire / tenant minimal (multi-tenancy futur)
   -------------------------------------------------------------------------- */

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* --------------------------------------------------------------------------
   PAGES — métadonnées de page (mapping SitePage)
   -------------------------------------------------------------------------- */

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photographerId: uuid("photographer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    menuTitle: text("menu_title").notNull(),
    status: pageStatusEnum("status").notNull().default("draft"),
    isInMenu: boolean("is_in_menu").notNull().default(true),
    /**
     * Page d'accueil du site (Étape 10.1) : **source de vérité** de la route
     * `/` (au lieu du slug vide). Un seul accueil par photographe (index partiel).
     */
    isHome: boolean("is_home").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pages_photographer_slug_unique").on(
      table.photographerId,
      table.slug
    ),
    // Un seul accueil par photographe (index unique **partiel**).
    uniqueIndex("pages_home_unique")
      .on(table.photographerId)
      .where(sql`${table.isHome}`),
  ]
);

/* --------------------------------------------------------------------------
   PAGE_MODULES — modules ordonnés d'une page (mapping PageModule + JSONB)
   -------------------------------------------------------------------------- */

export const pageModules = pgTable(
  "page_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    moduleType: moduleTypeEnum("module_type").notNull(),
    title: text("title").notNull().default(""),
    orderIndex: integer("order_index").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    animation: moduleAnimationEnum("animation").notNull().default("default"),
    anchorId: text("anchor_id").notNull().default(""),
    layoutVariant: text("layout_variant").notNull().default("default"),
    content: jsonb("content").$type<ModuleContent>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("page_modules_page_order_idx").on(table.pageId, table.orderIndex),
  ]
);

/* --------------------------------------------------------------------------
   NAVIGATION_ENTRIES — entrées Header/Footer, auto-jointure Niveau 2
   (mapping NavMenuEntry)
   -------------------------------------------------------------------------- */

export const navigationEntries = pgTable(
  "navigation_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photographerId: uuid("photographer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    zone: navZoneEnum("zone").notNull(),
    label: text("label").notNull(),
    kind: navKindEnum("kind").notNull(),
    href: text("href").notNull().default(""),
    hidden: boolean("hidden").notNull().default(false),
    auto: boolean("auto").notNull().default(false),
    pageId: uuid("page_id").references(() => pages.id, {
      onDelete: "cascade",
    }),
    parentId: uuid("parent_id").references((): AnyPgColumn => navigationEntries.id, {
      onDelete: "cascade",
    }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("nav_zone_order_idx").on(
      table.photographerId,
      table.zone,
      table.parentId,
      table.position
    ),
    index("nav_page_id_idx").on(table.pageId),
    index("nav_parent_id_idx").on(table.parentId),
  ]
);

/* --------------------------------------------------------------------------
   MEDIA — images du photographe (Étape 6.1, plans/ROADMAP-6.1)
   -------------------------------------------------------------------------- */

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  photographerId: uuid("photographer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull().default(0),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  // Métadonnées EXIF (focale, ouverture, vitesse, ISO, boîtier, objectif…).
  exifData: jsonb("exif_data").notNull().default(sql`'{}'::jsonb`),
  // Placeholder flou (data URI) pour `next/image` (blurDataURL).
  blurDataUrl: text("blur_data_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* --------------------------------------------------------------------------
   SITE_OWNER_PROFILE — profil complet du photographe (Étape 8.2)
   --------------------------------------------------------------------------
   1 ligne par photographe (photographer_id = PK/FK → profiles.id). Le profil
   entier est stocké en `data` JSONB typé `OwnerProfile` (validé par
   `OwnerProfileSchema` aux frontières API). RLS owner-only (migration 0003) :
   pas de lecture `anon` — la marque publique (Header/Footer) est injectée côté
   serveur (rôle service) via l'hydratation SSR.
   -------------------------------------------------------------------------- */

export const siteOwnerProfile = pgTable("site_owner_profile", {
  photographerId: uuid("photographer_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<OwnerProfile>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* --------------------------------------------------------------------------
   SITE_VISUAL_IDENTITY — espace marque du Header (Étape 9.1)
   --------------------------------------------------------------------------
   1 ligne par photographe (photographer_id = PK/FK → profiles.id). Configuration
   **manuelle** (modes texte/logo) stockée en `data` JSONB typé `VisualIdentity`
   (validé par `VisualIdentitySchema`). RLS owner-only (migration 0004) ; le
   Header public est alimenté côté serveur via l'hydratation SSR.
   -------------------------------------------------------------------------- */

export const siteVisualIdentity = pgTable("site_visual_identity", {
  photographerId: uuid("photographer_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  data: jsonb("data")
    .$type<VisualIdentity>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* --------------------------------------------------------------------------
   TYPES D'INSERTION / SÉLECTION (dérivés — utilisés par le seed & le futur repo)
   -------------------------------------------------------------------------- */

export type ProfileInsert = typeof profiles.$inferInsert;
export type PageInsert = typeof pages.$inferInsert;
export type PageModuleInsert = typeof pageModules.$inferInsert;
export type NavigationEntryInsert = typeof navigationEntries.$inferInsert;
export type MediaInsert = typeof media.$inferInsert;
export type MediaRow = typeof media.$inferSelect;
