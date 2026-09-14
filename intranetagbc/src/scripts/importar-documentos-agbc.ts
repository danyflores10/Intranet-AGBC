import "dotenv/config"
import fs from "fs"
import path from "path"
import { createId } from "@paralleldrive/cuid2"
import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq, inArray, sql } from "drizzle-orm"

const SOURCE_FOLDER = "C:/Users/senol/Downloads/documentos AGBC"
const DEST_FOLDER = path.join(process.cwd(), "public", "documentos")

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function cleanTitleAndCategory(filename: string): { title: string; category: string } {
  let base = filename.replace(/\.[^/.]+$/, "")
  if (filename === "AGBC.SBS.GBS.PR.001 PROCEDIMIENTO PARA LA ASIGNACION Y CONTROL DE USO DE TELEFONOS Y FAX") {
    base = filename
  }

  // Remove leading document codes if present (e.g. AGBC.SAP.GRH.RE.001 or AGBC.F.ADF.001)
  let clean = base.replace(/^AGBC\.[A-Z0-9\.]+\s+/i, "").trim()

  // Determine category
  let category = "Normativas"
  const upper = filename.toUpperCase()

  if (upper.includes("REGLAMENTO")) {
    category = "Reglamentos"
  } else if (
    upper.includes("MANUAL") ||
    upper.includes("PROCEDIMIENTO") ||
    upper.includes("GUIA") ||
    upper.includes("GUÍA") ||
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
    upper.includes("NOTIFICACIÓN") ||
    upper.includes("REPORTE") ||
    upper.includes("T Y C DE ALQUILER")
  ) {
    category = "Formularios"
  } else if (upper.includes("CIRCULAR")) {
    category = "Circulares"
  } else if (
    upper.includes("POLITICA") ||
    upper.includes("POLÍTICA") ||
    upper.includes("CODIGO") ||
    upper.includes("CÓDIGO") ||
    upper.includes("ESTATUTO") ||
    upper.includes("ORGANIGRAMA") ||
    upper.includes("TARIFARIO") ||
    upper.includes("CATÁLOGO") ||
    upper.includes("CATALOGO") ||
    upper.includes("RA ") ||
    upper.includes("RESOLUCION")
  ) {
    category = "Normativas"
  }

  let title = clean
  // Title casing formatting if in ALL CAPS
  if (title === title.toUpperCase() && title.length > 5) {
    title = title.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, (l) => l.toUpperCase())
    title = title.replace(/\b(Agbc|Sigec|Sireco|Gescon|Senca|Felcn|Sigep|Mof|Mapro|Re-Sap|Re-Sabs|Re-Soa|Sap|Sabs|Soa|Ra|Cn-08)\b/gi, (m) => m.toUpperCase())
  }

  return { title, category }
}

function sanitizeForFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60)
}

async function main() {
  console.log("=== INICIANDO IMPORTACIÓN DE DOCUMENTOS AGBC ===")

  if (!fs.existsSync(SOURCE_FOLDER)) {
    console.error(`Error: Carpeta origen no existe: ${SOURCE_FOLDER}`)
    process.exit(1)
  }

  if (!fs.existsSync(DEST_FOLDER)) {
    fs.mkdirSync(DEST_FOLDER, { recursive: true })
    console.log(`Creada carpeta de destino: ${DEST_FOLDER}`)
  }

  // 1. Asegurar categorías en DB
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

  console.log("Categorías aseguradas:", Object.keys(catMap))

  // 2. Limpiar documentos mock con archivos inexistentes
  const existingDocs = await db.select().from(documentos)
  for (const doc of existingDocs) {
    if (doc.archivo) {
      const relativePath = doc.archivo.replace(/^\//, "")
      const fullPhysical = path.join(process.cwd(), "public", relativePath)
      if (!fs.existsSync(fullPhysical)) {
        console.log(`Eliminando registro de documento de prueba sin archivo físico: "${doc.titulo}" (${doc.archivo})`)
        await db.delete(documentos).where(eq(documentos.id, doc.id))
      }
    }
  }

  // 3. Leer todos los archivos de la carpeta
  const files = fs.readdirSync(SOURCE_FOLDER)
  console.log(`\nArchivos detectados en carpeta origen: ${files.length}`)

  let totalImportados = 0
  let totalOmitidos = 0
  const categoriasContador: Record<string, number> = {}

  for (let i = 0; i < files.length; i++) {
    const originalName = files[i]
    const sourcePath = path.join(SOURCE_FOLDER, originalName)
    const stat = fs.statSync(sourcePath)

    // Extensión y detección de PDF u otros formatos sin extensión convencional
    const extMatch = originalName.match(/\.(pdf|docx|doc|xlsx|xls|csv|txt|png|jpg|jpeg)$/i)
    let ext = extMatch ? extMatch[1].toLowerCase() : ""
    if (!ext) {
      const buf = Buffer.alloc(8)
      const fd = fs.openSync(sourcePath, "r")
      fs.readSync(fd, buf, 0, 8, 0)
      fs.closeSync(fd)
      if (buf.toString("utf8").startsWith("%PDF")) {
        ext = "pdf"
      } else {
        ext = "pdf"
      }
    }

    const { title, category } = cleanTitleAndCategory(originalName)
    const categoriaId = catMap[category] || catMap["Normativas"]

    // Generar nombre de archivo físico seguro
    const safeSlug = sanitizeForFileName(title)
    const destFileName = `doc_${String(i + 1).padStart(3, "0")}_${safeSlug}.${ext}`
    const destPath = path.join(DEST_FOLDER, destFileName)

    // Copiar archivo a public/documentos
    fs.copyFileSync(sourcePath, destPath)

    const url = `/documentos/${destFileName}`
    const tamano = formatSize(stat.size)

    // Verificar si ya existe por descripción (que es el nombre original del archivo)
    const [yaExiste] = await db
      .select()
      .from(documentos)
      .where(eq(documentos.descripcion, originalName))
      .limit(1)

    if (yaExiste) {
      // Actualizar archivo y metadatos
      await db
        .update(documentos)
        .set({
          titulo: title,
          categoriaId,
          autor: "AGBC Institucional",
          estado: "publicado",
          archivo: url,
          nombreArchivo: originalName,
          tipoArchivo: ext,
          tamano,
          descripcion: originalName,
        })
        .where(eq(documentos.id, yaExiste.id))
      console.log(`[${i + 1}/${files.length}] [ACTUALIZADO] [${category}] ${title}`)
    } else {
      await db.insert(documentos).values({
        id: createId(),
        titulo: title,
        categoriaId,
        autor: "AGBC Institucional",
        estado: "publicado",
        archivo: url,
        nombreArchivo: originalName,
        tipoArchivo: ext,
        tamano,
        descripcion: originalName,
      })
      console.log(`[${i + 1}/${files.length}] [IMPORTADO] [${category}] ${title}`)
    }

    totalImportados++
    categoriasContador[category] = (categoriasContador[category] || 0) + 1
  }

  // 4. Verificación final de la base de datos y archivos físicos
  const docsEnDb = await db.select().from(documentos)
  const filesEnPublic = fs.readdirSync(DEST_FOLDER)

  console.log("\n==========================================")
  console.log("=== RESUMEN FINAL DE IMPORTACIÓN ===")
  console.log("==========================================")
  console.log(`Total archivos encontrados en origen: ${files.length}`)
  console.log(`Total documentos importados/actualizados: ${totalImportados}`)
  console.log(`Total registros en base de datos: ${docsEnDb.length}`)
  console.log(`Total archivos físicos en public/documentos: ${filesEnPublic.length}`)
  console.log("\nDesglose por categorías:", categoriasContador)

  // Comprobar que ningún archivo dé 404
  let archivosFaltantes = 0
  for (const doc of docsEnDb) {
    if (doc.archivo) {
      const rel = doc.archivo.replace(/^\//, "")
      const physical = path.join(process.cwd(), "public", rel)
      if (!fs.existsSync(physical)) {
        console.error(`ALERTA: Archivo físico faltante para: ${doc.titulo} -> ${physical}`)
        archivosFaltantes++
      }
    }
  }

  if (archivosFaltantes === 0) {
    console.log("\n✓✓✓ VERIFICACIÓN EXITOSA: El 100% de los documentos tiene su archivo físico correspondiente en disco. Cero 404.")
  } else {
    console.error(`\n✗ ERROR: Se detectaron ${archivosFaltantes} documentos con archivos faltantes.`)
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Error en importación de documentos:", err)
  process.exit(1)
})
