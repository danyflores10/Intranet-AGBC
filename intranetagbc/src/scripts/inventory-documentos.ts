import fs from "fs"
import path from "path"

const folder = "C:/Users/senol/Downloads/documentos AGBC"
const files = fs.readdirSync(folder)

export function cleanTitle(filename: string): { title: string; category: string } {
  let base = filename.replace(/\.[^/.]+$/, "")
  if (filename === "AGBC.SBS.GBS.PR.001 PROCEDIMIENTO PARA LA ASIGNACION Y CONTROL DE USO DE TELEFONOS Y FAX") {
    base = filename
  }

  // Remove leading document codes if present
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

const inventory = files.map((f, i) => {
  const fullPath = path.join(folder, f)
  const stat = fs.statSync(fullPath)
  let ext = path.extname(f).toLowerCase().replace(".", "")
  if (!ext) ext = "pdf"
  const { title, category } = cleanTitle(f)
  return {
    index: i + 1,
    originalName: f,
    extension: ext,
    sizeKB: (stat.size / 1024).toFixed(1),
    title,
    category,
    description: f,
    status: "publicado",
  }
})

console.log("=== INVENTARIO DE DOCUMENTOS AGBC ===")
console.log(`Total archivos: ${inventory.length}`)
const catCount: Record<string, number> = {}
inventory.forEach((item) => {
  catCount[item.category] = (catCount[item.category] || 0) + 1
  console.log(`[${item.index}] [${item.category}] [${item.extension.toUpperCase()}] ${item.title} -> ${item.originalName}`)
})
console.log("\nDesglose por categoría:", catCount)
