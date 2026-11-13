import { pool } from "@/db"
import categoriasJson from "@/data/documento-categorias-118.json"
import documentosCompletosJson from "@/data/documentos-oficiales-89-completos.json"
import { PLANTILLA_VEHICULAR_BASE64 } from "@/data/plantilla-vehicular-base64"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export interface CategoryData {
  id: string
  nombre: string
  descripcion: string | null
  parent_id: string | null
  nivel: number | null
  orden: number | null
  created_at: string
  updated_at: string
}

export interface DocumentoCompletoData {
  id: string
  titulo: string
  categoria_id: string | null
  direccion_id: string | null
  subcategoria_id: string | null
  tipo_documental: string | null
  autor: string
  estado: string
  archivo: string | null
  nombre_archivo: string | null
  tipo_archivo: string | null
  tamano: string | null
  descripcion: string | null
  version: string | null
  es_vigente: boolean | null
  familia_codigo: string | null
  fecha_emision: string | null
  numero_correlativo: number | null
  disponibilidad_archivo: string | null
}

const CATEGORIAS_OFICIALES: CategoryData[] = categoriasJson as CategoryData[]
const DOCUMENTOS_OFICIALES: DocumentoCompletoData[] = documentosCompletosJson as DocumentoCompletoData[]

/**
 * Sobrescribe en disco las plantillas vehiculares para garantizar que ningún
 * archivo contenga la lista de personal / nómina errónea, sino el formulario limpio.
 */
function asegurarPlantillasVehicularesEnDisco() {
  try {
    const buffer = Buffer.from(PLANTILLA_VEHICULAR_BASE64, "base64")
    const targets = [
      join(process.cwd(), "public", "documentos", "doc_003_formulario_de_solicitud_de_mantenimiento_y_reparacion_vehicu.xlsx"),
      join(process.cwd(), "public", "documentos", "doc_074_formulario_de_solicitud_de_mantenimiento_y_reparacion_vehicu.xlsx"),
      join(process.cwd(), "public", "documentos", "doc_087_formulario_de_solicitud_de_mantenimiento_y_reparacion_vehicu.xlsx"),
      join(process.cwd(), "public", "documentos", "cl0vnhhi2zlvqci42m9ufkgd_doc_074_formulario_de_solicitud_de_mante.xlsx"),
      join(process.cwd(), "public", "documentos", "documentos AGBC", "AGBC.F.ADF.001 Formulario de Solicitud de Mantenimiento y Reparación Vehicular.xlsx"),
    ]

    for (const targetPath of targets) {
      try {
        const dir = join(targetPath, "..")
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        writeFileSync(targetPath, buffer)
      } catch (errFile) {
        console.warn(`[AGBC Sync] No se pudo sobrescribir ${targetPath}:`, errFile)
      }
    }
  } catch (e) {
    console.warn("[AGBC Sync] Error al restaurar plantillas vehiculares limpias:", e)
  }
}

/**
 * Sincroniza de forma completa, segura e idempotente las 118 Categorías Jerárquicas oficiales
 * (4 Direcciones, 12 Subcategorías y 102 Tipos documentales)
 * y los 89 Documentos Institucionales con sus títulos, fechas, archivos, tamaños y metadatos auténticos.
 */
export async function sincronizarJerarquiaCategorias(force: boolean = false) {
  const client = await pool.connect()

  try {
    // 0. Eliminar la restricción obsoleta UNIQUE("nombre") que impedía que diferentes áreas
    //    tengan categorías con el mismo nombre (ej. "Reglamentos", "Manuales", "Procedimientos").
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
      ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "fecha_emision" varchar(100);
      ALTER TABLE "documentos" ADD COLUMN IF NOT EXISTS "numero_correlativo" integer;
    `)

    // 1. Restaurar plantillas vehiculares limpias en disco
    asegurarPlantillasVehicularesEnDisco()

    console.log(
      `[AGBC Jerarquía] Sincronizando 118 categorías oficiales y 89 documentos institucionales...`
    )

    // 2. Insertar / Actualizar las 118 categorías en orden de niveles (Nivel 1, Nivel 2, Nivel 3)
    const validCatIds = new Set<string>()
    const ordenadas = [...CATEGORIAS_OFICIALES].sort((a, b) => (a.nivel || 1) - (b.nivel || 1))

    for (const cat of ordenadas) {
      validCatIds.add(cat.id)
      await client.query(
        `
        INSERT INTO "documento_categorias" (
          "id", "nombre", "descripcion", "parent_id", "nivel", "orden", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("id") DO UPDATE SET
          "nombre" = EXCLUDED."nombre",
          "descripcion" = EXCLUDED."descripcion",
          "parent_id" = EXCLUDED."parent_id",
          "nivel" = EXCLUDED."nivel",
          "orden" = EXCLUDED."orden",
          "updated_at" = EXCLUDED."updated_at"
      `,
        [
          cat.id,
          cat.nombre,
          cat.descripcion,
          cat.parent_id,
          cat.nivel,
          cat.orden,
          new Date(cat.created_at),
          new Date(cat.updated_at),
        ]
      )
    }

    // 3. Limpiar categorías obsoletas (como las 7 categorías planas sin hijos)
    const idsCatArray = Array.from(validCatIds)
    if (idsCatArray.length > 0) {
      await client.query(
        `
        UPDATE "documentos" 
        SET "categoria_id" = NULL 
        WHERE "categoria_id" != ALL($1)
      `,
        [idsCatArray]
      )

      await client.query(
        `
        DELETE FROM "documento_categorias" 
        WHERE id != ALL($1)
      `,
        [idsCatArray]
      )
    }

    // 4. Sincronizar los 89 Documentos Oficiales Completos con sus títulos, fechas, tamaños y archivos
    const validDocIds = new Set<string>()
    let sincronizadosDocs = 0

    for (const doc of DOCUMENTOS_OFICIALES) {
      validDocIds.add(doc.id)
      await client.query(
        `
        INSERT INTO "documentos" (
          "id", "titulo", "categoria_id", "direccion_id", "subcategoria_id", "tipo_documental",
          "autor", "estado", "archivo", "nombre_archivo", "tipo_archivo", "tamano",
          "descripcion", "version", "es_vigente", "familia_codigo", "fecha_emision",
          "numero_correlativo", "disponibilidad_archivo", "created_at", "updated_at"
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, NOW(), NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "titulo" = EXCLUDED."titulo",
          "categoria_id" = EXCLUDED."categoria_id",
          "direccion_id" = EXCLUDED."direccion_id",
          "subcategoria_id" = EXCLUDED."subcategoria_id",
          "tipo_documental" = EXCLUDED."tipo_documental",
          "autor" = EXCLUDED."autor",
          "estado" = EXCLUDED."estado",
          "archivo" = EXCLUDED."archivo",
          "nombre_archivo" = EXCLUDED."nombre_archivo",
          "tipo_archivo" = EXCLUDED."tipo_archivo",
          "tamano" = EXCLUDED."tamano",
          "descripcion" = EXCLUDED."descripcion",
          "version" = EXCLUDED."version",
          "es_vigente" = EXCLUDED."es_vigente",
          "familia_codigo" = EXCLUDED."familia_codigo",
          "fecha_emision" = EXCLUDED."fecha_emision",
          "numero_correlativo" = EXCLUDED."numero_correlativo",
          "disponibilidad_archivo" = EXCLUDED."disponibilidad_archivo",
          "updated_at" = NOW()
      `,
        [
          doc.id,
          doc.titulo,
          doc.categoria_id,
          doc.direccion_id,
          doc.subcategoria_id,
          doc.tipo_documental,
          doc.autor || "AGBC Institucional",
          doc.estado || "publicado",
          doc.archivo,
          doc.nombre_archivo,
          doc.tipo_archivo,
          doc.tamano,
          doc.descripcion,
          doc.version || "v1.0",
          doc.es_vigente !== false,
          doc.familia_codigo,
          doc.fecha_emision,
          doc.numero_correlativo,
          doc.disponibilidad_archivo || "disponible",
        ]
      )
      sincronizadosDocs++
    }

    // 5. Limpieza específica de la v2 accidental de RE-SOA sin dirección ni subárea
    try {
      await client.query(`
        DELETE FROM "documentos"
        WHERE (
          LOWER(COALESCE("familia_codigo", '')) = 're-soa'
          OR LOWER("titulo") LIKE '%organizaci%n administrativa%'
          OR LOWER("titulo") LIKE '%re-soa%'
        )
        AND "version" ILIKE '%2%'
        AND ("direccion_id" IS NULL OR "subcategoria_id" IS NULL);

        DELETE FROM "notificaciones"
        WHERE LOWER("titulo") LIKE '%organizaci%n administrativa%'
          AND LOWER("titulo") LIKE '%v2%'
          AND "created_at" >= '2026-11-10';
      `)
    } catch (cleanErr) {
      console.warn("[AGBC Jerarquía] Advertencia limpiando versión accidental RE-SOA:", cleanErr)
    }

    console.log(
      `[AGBC Jerarquía] ✅ Sincronización exitosa: 118 categorías activas y ${sincronizadosDocs} documentos oficiales sincronizados al 100%. Los documentos subidos por usuarios se preservan íntegramente.`
    )

    return {
      success: true,
      totalCategorias: CATEGORIAS_OFICIALES.length,
      documentosSincronizados: sincronizadosDocs,
    }
  } catch (error: any) {
    console.error("[AGBC Jerarquía] Error durante la sincronización de jerarquía:", error)
    throw error
  } finally {
    client.release()
  }
}
