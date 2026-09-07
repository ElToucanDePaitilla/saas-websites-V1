CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photographer_id" uuid NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"exif_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"blur_data_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_photographer_id_profiles_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- RLS : MEDIA (Étape 6.1)
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "media_owner_all" ON public.media;--> statement-breakpoint
CREATE POLICY "media_owner_all"
ON public.media FOR ALL
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "media_public_read" ON public.media;--> statement-breakpoint
CREATE POLICY "media_public_read"
ON public.media FOR SELECT
TO anon
USING (true);--> statement-breakpoint
-- STORAGE : bucket `portfolio-media` + politiques (Étape 6.1)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_media_public_read" ON storage.objects;--> statement-breakpoint
CREATE POLICY "portfolio_media_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-media');--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_media_owner_insert" ON storage.objects;--> statement-breakpoint
CREATE POLICY "portfolio_media_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_media_owner_update" ON storage.objects;--> statement-breakpoint
CREATE POLICY "portfolio_media_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);--> statement-breakpoint
DROP POLICY IF EXISTS "portfolio_media_owner_delete" ON storage.objects;--> statement-breakpoint
CREATE POLICY "portfolio_media_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);