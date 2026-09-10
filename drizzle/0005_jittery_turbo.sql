-- ============================================================================
-- MIGRATION 10.1 — Page d'accueil explicite (`pages.is_home`)
-- ----------------------------------------------------------------------------
-- 1. Colonne `is_home` (défaut false) ;
-- 2. Index unique **partiel** : un seul accueil par photographe ;
-- 3. Backfill (édité à la main) : les accueils existants (slug vide) sont
--    marqués `is_home = true` → aucune régression pour les tenants actuels.
-- RLS : inchangée (`pages` possède déjà ses policies 0001).
-- ============================================================================
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "is_home" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pages_home_unique" ON "pages" USING btree ("photographer_id") WHERE "pages"."is_home";--> statement-breakpoint
-- ---- Backfill : l'accueil conventionnel (slug vide) devient is_home ---------
UPDATE "pages" SET "is_home" = true WHERE "slug" = '';