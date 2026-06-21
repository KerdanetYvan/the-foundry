import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(sql);

// Si les migrations ont été appliquées manuellement, bootstrappe la table de tracking
// pour que drizzle ne re-joue pas les migrations déjà appliquées.
// Drizzle stocke le tracking dans drizzle.__drizzle_migrations
// Si les migrations 0000/0001 ont été appliquées manuellement, on bootstrappe le tracking.
const [trackingRow] = await sql`
  SELECT COUNT(*)::int AS cnt FROM drizzle.__drizzle_migrations
`.catch(() => [null]);
if (trackingRow?.cnt === 0) {
  const [invitationsExists] = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitations'
  `;
  const [usersExists] = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  `;
  if (invitationsExists && usersExists) {
    console.log("Bootstrap: migrations manuelles détectées, initialisation du tracking...");
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0001_spicy_ronan', 1782012171804)`;
  }
}

await migrate(db, { migrationsFolder: join(__dirname, "../drizzle") });
await sql.end();
console.log("✓ Migrations appliquées");
