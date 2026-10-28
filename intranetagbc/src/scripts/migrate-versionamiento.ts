import { db } from "../db"
import { sql } from "drizzle-orm"

async function runMigration() {
  console.log("Iniciando migración de base de datos para versionamiento e importaciones...")

  // 1. Agregar columnas a la tabla documentos si no existen
  await db.execute(sql`
    ALTER TABLE documentos 
    ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'v1.0',
    ADD COLUMN IF NOT EXISTS es_vigente BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS familia_codigo VARCHAR(150),
    ADD COLUMN IF NOT EXISTS fecha_emision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS numero_correlativo INTEGER,
    ADD COLUMN IF NOT EXISTS disponibilidad_archivo VARCHAR(30) DEFAULT 'disponible';
  `)
  console.log("Columnas de versionamiento agregadas a 'documentos'.")

  // 2. Crear tabla catalogo_importaciones
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS catalogo_importaciones (
      id VARCHAR(24) PRIMARY KEY,
      nombre_archivo VARCHAR(255) NOT NULL,
      total_procesados INTEGER DEFAULT 0,
      nuevos INTEGER DEFAULT 0,
      actualizados INTEGER DEFAULT 0,
      sin_cambios INTEGER DEFAULT 0,
      faltan_archivo INTEGER DEFAULT 0,
      detalles TEXT,
      usuario_id VARCHAR(24) REFERENCES users(id),
      usuario_nombre VARCHAR(150),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `)
  console.log("Tabla 'catalogo_importaciones' verificada / creada.")

  // 3. Crear índices para rendimiento
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS doc_familia_idx ON documentos(familia_codigo);
    CREATE INDEX IF NOT EXISTS doc_vigente_idx ON documentos(es_vigente);
    CREATE INDEX IF NOT EXISTS doc_correlativo_idx ON documentos(numero_correlativo);
    CREATE INDEX IF NOT EXISTS cat_imp_created_idx ON catalogo_importaciones(created_at);
  `)
  console.log("Índices creados.")

  console.log("Migración completada con éxito.")
  process.exit(0)
}

runMigration().catch(err => {
  console.error("Error en migración:", err)
  process.exit(1)
})

