CREATE TYPE "public"."module_animation" AS ENUM('default', 'fade-up', 'fade-in', 'scale-in', 'none');--> statement-breakpoint
CREATE TYPE "public"."module_type" AS ENUM('hero', 'about', 'services', 'cta-banner', 'gallery', 'faq', 'contact');--> statement-breakpoint
CREATE TYPE "public"."nav_kind" AS ENUM('page', 'custom');--> statement-breakpoint
CREATE TYPE "public"."nav_zone" AS ENUM('header', 'footer');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "navigation_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"zone" "nav_zone" NOT NULL,
	"label" text NOT NULL,
	"kind" "nav_kind" NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"auto" boolean DEFAULT false NOT NULL,
	"page_id" uuid,
	"parent_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"module_type" "module_type" NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"animation" "module_animation" DEFAULT 'default' NOT NULL,
	"anchor_id" text DEFAULT '' NOT NULL,
	"layout_variant" text DEFAULT 'default' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"menu_title" text NOT NULL,
	"status" "page_status" DEFAULT 'draft' NOT NULL,
	"is_in_menu" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "navigation_entries" ADD CONSTRAINT "navigation_entries_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_entries" ADD CONSTRAINT "navigation_entries_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_entries" ADD CONSTRAINT "navigation_entries_parent_id_navigation_entries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_modules" ADD CONSTRAINT "page_modules_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nav_zone_order_idx" ON "navigation_entries" USING btree ("photographer_id","zone","parent_id","position");--> statement-breakpoint
CREATE INDEX "nav_page_id_idx" ON "navigation_entries" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "nav_parent_id_idx" ON "navigation_entries" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "page_modules_page_order_idx" ON "page_modules" USING btree ("page_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_photographer_slug_unique" ON "pages" USING btree ("photographer_id","slug");
--> statement-breakpoint
-- Row Level Security activée sur toutes les tables (plans/ROADMAP-5.1 §0.3).
-- Aucune politique posée à ce stade : accès serveur « service » (bypass RLS) ;
-- les politiques owner / public seront ajoutées à l'étape Auth (5.x).
ALTER TABLE "navigation_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "page_modules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;