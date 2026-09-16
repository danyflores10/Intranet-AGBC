import "dotenv/config"
import fs from "fs"
import path from "path"
import { createId } from "@paralleldrive/cuid2"
import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq, sql } from "drizzle-orm"

const DOCS_DIR = path.join(process.cwd(), "public", "documentos")

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function deriveMetaFromFileName(fileName: string): { title: string; category: string; ext: string } {
  // Extract extension
  const extMatch = fileName.match(/\.(pdf|docx|doc|xlsx|xls|csv|txt|png|jpg|jpeg)$/i)
  const ext = extMatch ? extMatch[1].toLowerCase() : "pdf"

  // Remove prefix doc_001_ and extension
  let cleanName = fileName.replace(/^doc_\d+_/i, "").replace(/\.[^/.]+$/, "")

  // Format title
  let title = cleanName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())

  // Normalize acronyms
  title = title.replace(/\b(Agbc|Sigec|Sireco|Gescon|Senca|Felcn|Sigep|Mof|Mapro|Re-Sap|Re-Sabs|Re-Soa|Sap|Sabs|Soa|Ra|Cn-08)\b/gi, (m) => m.toUpperCase())

  // Determine category
  const upper = fileName.toUpperCase()
  let category = "Normativas"

  if (upper.includes("REGLAMENTO")) {
    category = "Reglamentos"
  } else if (
    upper.includes("MANUAL") ||
    upper.includes("PROCEDIMIENTO") ||
    upper.includes("GUIA") ||
    upper.includes("INSTRUCTIVO")
  ) {
    category = "Manuales"
  } else if (
    upper.includes("FORMULARIO") ||
    upper.includes("FICHA") ||
    upper.includes("KARDEX") ||
    upper.includes("ACTA") ||
    upper.includes("RECIBO") ||
    upper.includes("MATRIZ") ||
    upper.includes("NOTIFICACION") ||
    upper.includes("REPORTE") ||
    upper.includes("CASILLAS") ||
    upper.includes("VEHICULO") ||
    upper.includes("QUEJAS") ||
    upper.includes("RECLAMACION") ||
    upper.includes("DENUNCIA")
  ) {
    category = "Formularios"
  } else if (upper.includes("CIRCULAR")) {
    category = "Circulares"
  } else if (
    upper.includes("POLITICA") ||
    upper.includes("CODIGO") ||
    upper.includes("ORGANIGRAMA") ||
    upper.includes("CATALOGO") ||
    upper.includes("ARTICULOS")
  ) {
    category = "Normativas"
  }

  return { title, category, ext }
}

async function syncProductionDocs() {
  console.log("=== SINCRONIZANDO DOCUMENTOS DESDE PUBLIC/DOCUMENTOS ===")

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: Carpeta ${DOCS_DIR} no existe.`)
    process.exit(1)
  }

  // 1. Asegurar categorías
  const CATEGORIAS_DEFINIDAS = [
    { nombre: "Reglamentos", descripcion: "Reglamentos internos y normativas operativas" },
    { nombre: "Manuales", descripcion: "Manuales de procedimientos, organizacionales y de usuario" },
    { nombre: "Formularios", descripcion: "Formularios, fichas técnicas y reportes institucionales" },
    { nombre: "Normativas", descripcion: "Políticas, resoluciones administrativas y marcos regulatorios" },
    { nombre: "Circulares", descripcion: "Circulares e instructivos institucionales" },
  ]

  const catMap: Record<string, string> = {}
  for (const cat of CATEGORIAS_DEFINIDAS) {
    let [found] = await db
      .select()
      .from(documentoCategorias)
      .where(sql`LOWER(${documentoCategorias.nombre}) = LOWER(${cat.nombre})`)
      .limit(1)

    if (!found) {
      ;[found] = await db
        .insert(documentoCategorias)
        .values({
          id: createId(),
          nombre: cat.nombre,
          descripcion: cat.descripcion,
        })
        .returning()
    }
    catMap[cat.nombre] = found.id
  }

  // 2. Limpiar registros sin archivo físico
  const existingDocs = await db.select().from(documentos)
  for (const doc of existingDocs) {
    if (doc.archivo) {
      const relPath = doc.archivo.replace(/^\//, "")
      const physical = path.join(process.cwd(), "public", relPath)
      if (!fs.existsSync(physical)) {
        await db.delete(documentos).where(eq(documentos.id, doc.id))
        console.log(`[LIMPIEZA] Eliminado registro sin archivo físico: ${doc.titulo}`)
      }
    }
  }

  // 3. Registrar / actualizar todos los archivos físicos de public/documentos
  const files = fs.readdirSync(DOCS_DIR).filter((f) => {
    const extMatch = f.match(/\.(pdf|docx|doc|xlsx|xls|csv|txt|png|jpg|jpeg)$/i)
    return extMatch !== null
  })

  console.log(`Archivos físicos encontrados en public/documentos: ${files.length}`)

  let synced = 0
  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file)
    const stat = fs.statSync(filePath)
    const { title, category, ext } = deriveMetaFromFileName(file)
    const url = `/documentos/${file}`
    const tamano = formatSize(stat.size)
    const categoriaId = catMap[category] || catMap["Normativas"]

    // Buscar si ya existe por ruta de archivo
    const [found] = await db
      .select()
      .from(documentos)
      .where(eq(documentos.archivo, url))
      .limit(1)

    if (found) {
      await db
        .update(documentos)
        .set({
          categoriaId,
          estado: "publicado",
          tamano,
          tipoArchivo: ext,
        })
        .where(eq(documentos.id, found.id))
    } else {
      await db.insert(documentos).values({
        id: createId(),
        titulo: title,
        categoriaId,
        autor: "AGBC Institucional",
        estado: "publicado",
        archivo: url,
        nombreArchivo: file,
        tipoArchivo: ext,
        tamano,
        descripcion: file,
      })
    }
    synced++
  }

  const totalInDb = await db.select().from(documentos)
  console.log(`\n✓ Sincronización exitosa: ${synced} archivos procesados. Total en BD: ${totalInDb.length}. Cero 404.`)
  process.exit(0)
}

syncProductionDocs().catch((err) => {
  console.error("Error en sincronización:", err)
  process.exit(1)
})
