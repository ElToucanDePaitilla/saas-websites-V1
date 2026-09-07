-- ============================================================================
-- MIGRATION 5.4 — Auth Supabase, RLS & isolation multi-tenant (plan 5.4 §3)
-- ----------------------------------------------------------------------------
-- Contenu édité à la main (politiques/trigger non exprimables en Drizzle).
--  1. Trigger `handle_new_user` : auto-création du profil à l'inscription
--     (`profiles.id = auth.uid()`).
--  2. Politiques RLS :
--     - Owner (authentifié) RW sur ses propres ressources (`auth.uid()`) ;
--     - Public (anon) RO : pages publiées (`status='published'`), modules
--       visibles des pages publiées, navigation non masquée (`hidden=false`).
-- À appliquer via `npm run db:migrate` sur la base Supabase (schéma `auth`
-- présent). Hors BDD Supabase, ce fichier n'est pas exécutable (documenté).
-- ============================================================================
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, '')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint
-- ---- RLS : PROFILES ---------------------------------------------------------
-- Owner : lecture / mise à jour de sa propre ligne uniquement.
DROP POLICY IF EXISTS "profiles_owner_select" ON public.profiles;--> statement-breakpoint
CREATE POLICY "profiles_owner_select"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;--> statement-breakpoint
CREATE POLICY "profiles_owner_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());--> statement-breakpoint
-- ---- RLS : PAGES ------------------------------------------------------------
DROP POLICY IF EXISTS "pages_owner_all" ON public.pages;--> statement-breakpoint
CREATE POLICY "pages_owner_all"
ON public.pages FOR ALL
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "pages_public_read" ON public.pages;--> statement-breakpoint
CREATE POLICY "pages_public_read"
ON public.pages FOR SELECT
TO anon
USING (status = 'published');--> statement-breakpoint
-- ---- RLS : PAGE_MODULES -----------------------------------------------------
DROP POLICY IF EXISTS "page_modules_owner_all" ON public.page_modules;--> statement-breakpoint
CREATE POLICY "page_modules_owner_all"
ON public.page_modules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_modules.page_id AND p.photographer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_modules.page_id AND p.photographer_id = auth.uid()
  )
);--> statement-breakpoint
DROP POLICY IF EXISTS "page_modules_public_read" ON public.page_modules;--> statement-breakpoint
CREATE POLICY "page_modules_public_read"
ON public.page_modules FOR SELECT
TO anon
USING (
  is_visible = true
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_modules.page_id AND p.status = 'published'
  )
);--> statement-breakpoint
-- ---- RLS : NAVIGATION_ENTRIES ------------------------------------------------
DROP POLICY IF EXISTS "navigation_entries_owner_all" ON public.navigation_entries;--> statement-breakpoint
CREATE POLICY "navigation_entries_owner_all"
ON public.navigation_entries FOR ALL
TO authenticated
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());--> statement-breakpoint
DROP POLICY IF EXISTS "navigation_entries_public_read" ON public.navigation_entries;--> statement-breakpoint
CREATE POLICY "navigation_entries_public_read"
ON public.navigation_entries FOR SELECT
TO anon
USING (
  hidden = false
  AND (
    page_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = navigation_entries.page_id AND p.status = 'published'
    )
  )
);
