-- ============================================================================
-- MIGRATION 14.1 — RLS du formulaire de contact (`contact_submissions`)
-- ----------------------------------------------------------------------------
-- Contenu édité à la main (politiques non exprimables en Drizzle), sur le
-- modèle de `0001_auth_rls.sql`.
--
-- Décisions (XML 14.1 §1) :
--   · l'insertion visiteur passe par la clé **service_role** dans la route
--     `/api/contact` — elle contourne la RLS, donc **aucune politique INSERT**
--     n'est créée. Sans session visiteur, une politique `TO anon` ouvrirait
--     l'écriture directe à quiconque possède la clé anonyme.
--   · le propriétaire lit et supprime ses propres messages (`auth.uid()`).
--   · AUCUNE politique de lecture publique : un message de contact n'est jamais
--     public, contrairement aux pages et médias.
--
-- Limite assumée et documentée : cette politique n'est **exercée par aucun
-- contrôle** dans ce lot. Supabase Studio agit en `service_role` et la
-- contourne, et aucune UI de consultation n'est livrée (décision D2).
-- ============================================================================
ALTER TABLE "contact_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Lecteur propriétaire (Supabase Studio, SQL direct, future UI).
DROP POLICY IF EXISTS "contact_submissions_owner_read" ON public.contact_submissions;--> statement-breakpoint
CREATE POLICY "contact_submissions_owner_read"
ON public.contact_submissions FOR SELECT
TO authenticated
USING (photographer_id = auth.uid());--> statement-breakpoint
-- Suppression propriétaire (suppression de la ligne ⇒ suppression de l'objet
-- Storage par la même action serveur, cf. rétention RGPD documentée).
DROP POLICY IF EXISTS "contact_submissions_owner_delete" ON public.contact_submissions;--> statement-breakpoint
CREATE POLICY "contact_submissions_owner_delete"
ON public.contact_submissions FOR DELETE
TO authenticated
USING (photographer_id = auth.uid());
