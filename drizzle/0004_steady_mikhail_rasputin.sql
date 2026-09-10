-- ============================================================================
-- MIGRATION 9.1 — « Identité visuelle / Logo » (site_visual_identity)
-- ----------------------------------------------------------------------------
-- 1. Table : 1 ligne par photographe (photographer_id PK/FK → profiles.id) ;
--    configuration manuelle (modes texte/logo) en `data` jsonb typé
--    `VisualIdentity` (validé `VisualIdentitySchema`).
-- 2. RLS owner-only (éditée à la main, comme 0003) : le propriétaire
--    authentifié lit/écrit sa propre ligne. AUCUNE lecture `anon` : le Header
--    public est alimenté côté serveur (rôle service) via l'hydratation SSR.
-- ============================================================================
--> statement-breakpoint
CREATE TABLE "site_visual_identity" (
	"photographer_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_visual_identity" ADD CONSTRAINT "site_visual_identity_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ---- RLS : SITE_VISUAL_IDENTITY (owner uniquement, pas de lecture anon) ------
ALTER TABLE public.site_visual_identity ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "site_visual_identity_owner_select" ON public.site_visual_identity;--> statement-breakpoint
CREATE POLICY "site_visual_identity_owner_select"
ON public.site_visual_identity FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_visual_identity_owner_insert" ON public.site_visual_identity;--> statement-breakpoint
CREATE POLICY "site_visual_identity_owner_insert"
ON public.site_visual_identity FOR INSERT
TO authenticated
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_visual_identity_owner_update" ON public.site_visual_identity;--> statement-breakpoint
CREATE POLICY "site_visual_identity_owner_update"
ON public.site_visual_identity FOR UPDATE
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_visual_identity_owner_delete" ON public.site_visual_identity;--> statement-breakpoint
CREATE POLICY "site_visual_identity_owner_delete"
ON public.site_visual_identity FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());