CREATE TABLE "site_popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "popup_id" uuid;--> statement-breakpoint
ALTER TABLE "site_popups" ADD CONSTRAINT "site_popups_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_popups_photographer_idx" ON "site_popups" USING btree ("photographer_id");--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_popup_id_site_popups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."site_popups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- ---- RLS : SITE_POPUPS (owner uniquement, pas de lecture anon) --------------
-- Copie du motif de `site_top_banner` (0012) : le rendu public est alimenté
-- côté serveur (rôle service) via `loadInitialData` ; aucune politique `anon`
-- n'est nécessaire, et en ajouter une exposerait des pop-ups non publiées.
ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "site_popups_owner_select" ON public.site_popups;--> statement-breakpoint
CREATE POLICY "site_popups_owner_select"
ON public.site_popups FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_popups_owner_insert" ON public.site_popups;--> statement-breakpoint
CREATE POLICY "site_popups_owner_insert"
ON public.site_popups FOR INSERT
TO authenticated
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_popups_owner_update" ON public.site_popups;--> statement-breakpoint
CREATE POLICY "site_popups_owner_update"
ON public.site_popups FOR UPDATE
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "site_popups_owner_delete" ON public.site_popups;--> statement-breakpoint
CREATE POLICY "site_popups_owner_delete"
ON public.site_popups FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());