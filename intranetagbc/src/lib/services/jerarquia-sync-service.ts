import { db, pool } from "@/db"
import { documentoCategorias, documentos } from "@/db/schema"
import { eq, inArray, sql } from "drizzle-orm"
import categoriasJson from "@/data/documento-categorias-118.json"
import mappingJson from "@/data/documentos-mapping-89.json"

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

export interface DocumentMappingData {
  id: string
  titulo: string
  direccion_id: string | null
  subcategoria_id: string | null
  tipo_documental: string | null
  categoria_id: string | null
}

const CATEGORIAS_OFICIALES: CategoryData[] = categoriasJson as CategoryData[]
const DOCUMENTOS_MAPPING: DocumentMappingData[] = mappingJson as DocumentMappingData[]

/**
 * Sincroniza de forma segura e idempotente las 118 Categorías Jerárquicas oficiales
 * (4 Direcciones, 12 Subcategorías y 102 Tipos documentales)
 * y mapea los 89 documentos a sus carpetas correspondientes.
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
    `)

    // 1. Verificar conteo actual
    const countCheck = await client.query(`
      SELECT count(*) as total, 
             count(CASE WHEN nivel = 1 THEN 1 END) as nivel1,
             count(CASE WHEN nivel = 2 THEN 1 END) as nivel2,
             count(CASE WHEN nivel = 3 THEN 1 END) as nivel3
      FROM "documento_categorias"
    `)

    const currentTotal = parseInt(countCheck.rows[0]?.total || "0", 10)
    const currentNivel2 = parseInt(countCheck.rows[0]?.nivel2 || "0", 10)

    if (!force && currentTotal >= 118 && currentNivel2 >= 12) {
      return {
        alreadySynced: true,
        total: currentTotal,
        message: "Estructura de 118 categorías ya sincronizada correctamente.",
      }
    }

    console.log(
      `[AGBC Jerarquía] Sincronizando 118 categorías oficiales (estado actual: ${currentTotal} categorías, ${currentNivel2} subcategorías)...`
    )

    // 2. Insertar / Actualizar las 118 categorías en orden de niveles (Nivel 1, Nivel 2, Nivel 3)
    const validIds = new Set<string>()

    // Ordenar por nivel ascendente para garantizar que los parents existan primero
    const ordenadas = [...CATEGORIAS_OFICIALES].sort((a, b) => (a.nivel || 1) - (b.nivel || 1))

    for (const cat of ordenadas) {
      validIds.add(cat.id)
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
    const idsArray = Array.from(validIds)
    if (idsArray.length > 0) {
      // Reasignar temporalmente si algún doc apunta a una categoría que se va a borrar
      const invalidQuery = await client.query(
        `
        SELECT id, nombre FROM "documento_categorias"
        WHERE id != ALL($1)
      `,
        [idsArray]
      )

      if (invalidQuery.rows.length > 0) {
        console.log(
          `[AGBC Jerarquía] Limpiando ${invalidQuery.rows.length} categorías obsoletas sin jerarquía...`
        )
        // Desvincular de documentos antes de eliminar
        await client.query(
          `
          UPDATE "documentos" 
          SET "categoria_id" = NULL 
          WHERE "categoria_id" != ALL($1)
        `,
          [idsArray]
        )

        await client.query(
          `
          DELETE FROM "documento_categorias" 
          WHERE id != ALL($1)
        `,
          [idsArray]
        )
      }
    }

    // 4. Actualizar mapeo de los 89 documentos a sus respectivas carpetas jerárquicas
    let mappedDocsCount = 0
    for (const doc of DOCUMENTOS_MAPPING) {
      const res = await client.query(
        `
        UPDATE "documentos"
        SET 
          "direccion_id" = COALESCE($1, "direccion_id"),
          "subcategoria_id" = COALESCE($2, "subcategoria_id"),
          "tipo_documental" = COALESCE($3, "tipo_documental"),
          "categoria_id" = COALESCE($4, "categoria_id")
        WHERE "id" = $5 OR LOWER(TRIM("titulo")) = LOWER(TRIM($6))
      `,
        [
          doc.direccion_id,
          doc.subcategoria_id,
          doc.tipo_documental,
          doc.categoria_id,
          doc.id,
          doc.titulo,
        ]
      )
      if (res.rowCount && res.rowCount > 0) {
        mappedDocsCount += res.rowCount
      }
    }

    console.log(
      `[AGBC Jerarquía] ✅ Sincronización exitosa: 118 categorías activas y ${mappedDocsCount} documentos vinculados a la jerarquía.`
    )

    return {
      success: true,
      totalCategorias: CATEGORIAS_OFICIALES.length,
      documentosMapeados: mappedDocsCount,
    }
  } catch (error: any) {
    console.error("[AGBC Jerarquía] Error durante la sincronización de jerarquía:", error)
    throw error
  } finally {
    client.release()
  }
}

