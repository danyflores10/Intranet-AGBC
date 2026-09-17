import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '@/db';
import { assignAvatars } from '@/scripts/assign-avatars';
import { sincronizarTodoPersonalConUsuarios } from '@/lib/services/personal-user-sync';

/**
 * Servicio seguro de migración y sincronización automática para LOCALHOST y PRODUCCIÓN.
 * - 100% no destructivo: preserva todos los datos existentes.
 * - Baselines automáticos para bases de datos existentes.
 * - Ejecuta migraciones incrementales de Drizzle.
 * - Garantiza la configuración base de roles, permisos, categorías y avatares.
 */
export async function runAutoMigrations(options?: { silent?: boolean }) {
  const log = (msg: string) => {
    if (!options?.silent) {
      console.log(`[AGBC Auto-Migrate] ${msg}`);
    }
  };

  const client = await pool.connect();

  try {
    log('Iniciando verificación y sincronización de base de datos...');

    // 1. Asegurar esquema y tabla de migraciones de Drizzle
    await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    // 2. Verificar si la base de datos ya tiene tablas creadas (ej: "users")
    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
      LIMIT 1
    `);
    const hasExistingTables = (tableCheck.rowCount ?? 0) > 0;

    // 3. Verificar estado de la tabla de migraciones
    const migrationRows = await client.query(`
      SELECT id, hash, created_at FROM "drizzle"."__drizzle_migrations" 
      ORDER BY created_at ASC
    `);

    const migrationsDir = path.join(process.cwd(), 'drizzle');
    const journalFile = path.join(migrationsDir, 'meta', '_journal.json');

    if (fs.existsSync(journalFile)) {
      const journal = JSON.parse(fs.readFileSync(journalFile, 'utf-8'));
      const entries = journal.entries || [];

      // Si la BD ya tenía tablas preexistentes pero __drizzle_migrations estaba vacía,
      // registramos el baseline 0000 para evitar error "la relación users ya existe"
      if (hasExistingTables && migrationRows.rows.length === 0 && entries.length > 0) {
        const baselineEntry = entries[0];
        const baselineSqlFile = path.join(migrationsDir, `${baselineEntry.tag}.sql`);
        
        let hash = 'baseline_initial';
        if (fs.existsSync(baselineSqlFile)) {
          const content = fs.readFileSync(baselineSqlFile, 'utf-8');
          hash = crypto.createHash('sha256').update(content).digest('hex');
        }

        await client.query(
          `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
          [hash, baselineEntry.when]
        );
        log(`Baseline registrado correctamente: ${baselineEntry.tag} (${baselineEntry.when})`);
      }
    }

    client.release();

    // 4. Ejecutar migraciones incrementales de Drizzle
    log('Aplicando migraciones incrementales de Drizzle...');
    await migrate(db, { migrationsFolder: migrationsDir });
    log('✅ Migraciones de esquema aplicadas con éxito.');

    // 5. Sincronización suave de Personal y Usuarios (idempotente)
    try {
      await sincronizarTodoPersonalConUsuarios();
      log('✅ Sincronización de Personal y Usuarios verificada.');
    } catch (syncErr) {
      console.error('[AGBC Auto-Migrate] Advertencia en sincronización de usuarios:', syncErr);
    }

    // 6. Asignación no destructiva de avatares desde public/image/avatars
    try {
      await assignAvatars();
      log('✅ Asignación de avatares completada.');
    } catch (avatarErr) {
      console.error('[AGBC Auto-Migrate] Advertencia en asignación de avatares:', avatarErr);
    }

    log('🎉 Sincronización de base de datos finalizada exitosamente.');
    return { success: true };
  } catch (error) {
    try { client.release(); } catch {}
    console.error('❌ Error durante la migración automática de la base de datos:', error);
    throw error;
  }
}

// Ejecución directa desde CLI (ej: npm run db:migrate:auto)
if (process.argv[1]?.includes('auto-migrate')) {
  runAutoMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
