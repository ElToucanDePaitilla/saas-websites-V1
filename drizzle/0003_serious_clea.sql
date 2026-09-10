-- ============================================================================
-- MIGRATION 8.2 — Persistance du module « Profil » (site_owner_profile)
-- ----------------------------------------------------------------------------
-- 1. Table : 1 ligne par photographe (photographer_id PK/FK → profiles.id) ;
--    profil complet en `data` jsonb typé `OwnerProfile` (validé Zod).
-- 2. RLS owner-only (éditée à la main, comme 0001) : le propriétaire
--    authentifié lit/écrit sa propre ligne. AUCUNE lecture `anon` : la marque
--    publique (Header/Footer) est injectée côté serveur (rôle service) via
--    l'hydratation SSR — pas d'exposition client des données privées.
-- ============================================================================
--> statement-breakpoint
CREATE TABLE "site_owner_profile" (
	"photographer_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_owner_profile" ADD CONSTRAINT "site_owner_profile_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ---- RLS : SITE_OWNER_PROFILE (owner uniquement, pas de lecture anon) --------
ALTER TABLE public.site_owner_profile ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "site_owner_profile_owner_select" ON public.site_owner_profile;--> statement-breakpoint
CREATE POLICY "site_owner_profile_owner_select"
ON public.site_owner_profile FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_owner_profile_owner_insert" ON public.site_owner_profile;--> statement-breakpoint
CREATE POLICY "site_owner_profile_owner_insert"
ON public.site_owner_profile FOR INSERT
TO authenticated
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_owner_profile_owner_update" ON public.site_owner_profile;--> statement-breakpoint
CREATE POLICY "site_owner_profile_owner_update"
ON public.site_owner_profile FOR UPDATE
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_owner_profile_owner_delete" ON public.site_owner_profile;--> statement-breakpoint
CREATE POLICY "site_owner_profile_owner_delete"
ON public.site_owner_profile FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());