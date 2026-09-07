/**
 * ============================================================================
 * CONFIGURATION DRIZZLE KIT — Étape 5.1
 * ----------------------------------------------------------------------------
 * Pilote la génération (`db:generate`) et l'application (`db:migrate`) des
 * migrations PostgreSQL depuis `src/db/schema.ts` vers le dossier `drizzle/`.
 *
 * La variable `DATABASE_URL` est lue depuis `.env.local` (convention Next.js du
 * projet — jamais éditée ici) : chaîne Supabase « transaction pooler » (`:6543`)
 * pour le runtime/migrations, ou base locale `supabase start` (`:54322`) en dev.
 *
 * Référence : plans/ROADMAP-5.1-database-schema.md §2.2
 * ============================================================================
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Charge `.env.local` avant de lire `process.env.DATABASE_URL`.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
