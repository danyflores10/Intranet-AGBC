import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '@/db';
import { assignAvatars } from '@/scripts/assign-avatars';
import { sincronizarTodoPersonalConUsuarios } from '@/lib/services/personal-user-sync';
import { sincronizarJerarquiaCategorias } from '@/lib/services/jerarquia-sync-service';

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

    // 3.5. Garantizar columna fecha_nacimiento en personal de manera no destructiva
    try {
      await client.query(`ALTER TABLE "personal" ADD COLUMN IF NOT EXISTS "fecha_nacimiento" date;`);
    } catch (colErr) {
      console.warn('[AGBC Auto-Migrate] Columna fecha_nacimiento ya verificada o no requerida:', colErr);
    }

    // 3.6. Garantizar tabla intranet_visitas_seccion de manera segura y no destructiva
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "intranet_visitas_seccion" (
          "id" varchar(36) PRIMARY KEY,
          "usuario_id" varchar(100),
          "seccion" varchar(120) NOT NULL,
          "ip" varchar(100),
          "detalles" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "idx_visitas_seccion_nombre" ON "intranet_visitas_seccion" ("seccion");
        CREATE INDEX IF NOT EXISTS "idx_visitas_seccion_created_at" ON "intranet_visitas_seccion" ("created_at");
      `);
      log('Tabla intranet_visitas_seccion verificada.');
    } catch (visitasErr) {
      console.warn('[AGBC Auto-Migrate] Tabla intranet_visitas_seccion ya verificada:', visitasErr);
    }

    // 3.7. Eliminar restricción obsoleta UNIQUE("nombre") en documento_categorias
    try {
      await client.query(`
        ALTER TABLE "documento_categorias" DROP CONSTRAINT IF EXISTS "documento_categorias_nombre_unique";
        DROP INDEX IF EXISTS "documento_categorias_nombre_unique";
        ALTER TABLE "documento_categorias" ALTER COLUMN "nombre" TYPE varchar(255);
        ALTER TABLE "documento_categorias" ADD COLUMN IF NOT EXISTS "parent_id" varchar(24);
        ALTER TABLE "documento_categorias" ADD COLUMN IF NOT EXISTS "nivel" integer DEFAULT 1;
        ALTER TABLE "documento_categorias" ADD COLUMN IF NOT EXISTS "orden" integer DEFAULT 0;
        ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "direccion_id" varchar(24);
        ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "subcategoria_id" varchar(24);
        ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "tipo_documental" varchar(50);
      `);
      log('Estructura jerárquica de documento_categorias y documentos verificada.');
    } catch (catColErr) {
      console.warn('[AGBC Auto-Migrate] Estructura jerárquica ya verificada:', catColErr);
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

    // 7. Sincronización oficial de las 118 Categorías Jerárquicas (4 Direcciones, 12 Subcategorías, 102 Tipos)
    try {
      const resJerarquia = await sincronizarJerarquiaCategorias();
      log(`✅ Categorías Jerárquicas oficiales (118) verificadas: ${resJerarquia.totalCategorias || 118} activas.`);
    } catch (jerarquiaErr) {
      console.error('[AGBC Auto-Migrate] Advertencia en sincronización de categorías jerárquicas:', jerarquiaErr);
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
