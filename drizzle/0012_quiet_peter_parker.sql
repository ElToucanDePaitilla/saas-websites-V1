-- ============================================================================
-- MIGRATION — « Mini-bandeau Alerte / Promo » (site_top_banner)
-- ----------------------------------------------------------------------------
-- 1. Table : 1 ligne par photographe (photographer_id PK/FK → profiles.id) ;
--    hauteur, gaps, couleurs, typographie, mode défilant/statique et lien en
--    `data` jsonb typé `TopBanner` (validé `TopBannerSchema`).
-- 2. RLS owner-only (éditée à la main, comme 0004) : le propriétaire authentifié
--    lit/écrit sa propre ligne. AUCUNE lecture `anon` : le bandeau public est
--    alimenté côté serveur (rôle service) via l'hydratation SSR.
-- ============================================================================
--> statement-breakpoint
CREATE TABLE "site_top_banner" (
	"photographer_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_top_banner" ADD CONSTRAINT "site_top_banner_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ---- RLS : SITE_TOP_BANNER (owner uniquement, pas de lecture anon) ----------
-- Copie du motif de `site_visual_identity` (0004) : le bandeau public est
-- alimenté côté serveur (rôle service) via l'hydratation SSR ; aucune politique
-- `anon` n'est donc nécessaire, et en ajouter une exposerait le contenu privé.
ALTER TABLE public.site_top_banner ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "site_top_banner_owner_select" ON public.site_top_banner;--> statement-breakpoint
CREATE POLICY "site_top_banner_owner_select"
ON public.site_top_banner FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_top_banner_owner_insert" ON public.site_top_banner;--> statement-breakpoint
CREATE POLICY "site_top_banner_owner_insert"
ON public.site_top_banner FOR INSERT
TO authenticated
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_top_banner_owner_update" ON public.site_top_banner;--> statement-breakpoint
CREATE POLICY "site_top_banner_owner_update"
ON public.site_top_banner FOR UPDATE
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_top_banner_owner_delete" ON public.site_top_banner;--> statement-breakpoint
CREATE POLICY "site_top_banner_owner_delete"
ON public.site_top_banner FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());