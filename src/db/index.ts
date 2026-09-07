/**
 * ============================================================================
 * CLIENT D'ACCÈS BDD — Drizzle / PostgreSQL (Supabase), Étapes 5.1 → 5.2
 * ----------------------------------------------------------------------------
 * Fournit l'instance Drizzle partagée (singleton) via **`getDatabase()`**.
 *
 * - Connexion **paresseuse** : l'instance n'est créée qu'au premier appel (et
 *   jamais à l'import) → le build Next et les rendus restent **verts même sans
 *   `DATABASE_URL`** (les repositories/layouts basculent alors sur le fallback
 *   seed en mémoire, cf. Étape 5.2).
 * - `DATABASE_URL` (`.env.local`) : chaîne Supabase « transaction pooler »
 *   (`:6543`) ou base locale `supabase start` (`:54322`).
 * - Singleton robuste en développement : conservé sur `globalThis` (évite la
 *   multiplication des pools sous HMR Next.js).
 *
 * Référence : plans/ROADMAP-5.1-database-schema.md §2.3 + plans/ROADMAP-5.2
 * ============================================================================
 */

import { config } from "dotenv";
import {
  drizzle,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Charge `.env.local` (convention Next.js du projet) avant de lire l'environnement.
config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL ?? "";

/** Type de l'instance Drizzle exposée (schéma complet). */
export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __drizzleDb?: Database;
};

/** Construit une instance Drizzle (nouveau pool) — appelée une seule fois. */
function createDatabase(url: string): Database {
  // Pool adapté au serveur Next.js (connexion limitée) + délai de connexion
  // court : si la BDD est injoignable (ex. build sans accès réseau), l'échec
  // remonte vite et les repositories/layouts basculent sur le fallback seed.
  const client = postgres(url, { max: 1, connect_timeout: 5 });
  return drizzle(client, { schema });
}

/**
 * Retourne l'instance Drizzle **singleton**, en la créant paresseusement.
 * Lève une erreur explicite uniquement si `DATABASE_URL` est absente et qu'un
 * appel BDD est réellement tenté (seed, repository sans fallback).
 */
export function getDatabase(): Database {
  if (connectionString === "") {
    throw new Error(
      "DATABASE_URL est introuvable : renseignez-la dans .env.local (voir .env.example) pour utiliser la BDD."
    );
  }
  globalForDb.__drizzleDb ??= createDatabase(connectionString);
  return globalForDb.__drizzleDb;
}

/** Expose le schéma complet (types & tables) pour les futurs modules. */
export * as schemaTables from "./schema";
