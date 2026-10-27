import documentosFechasJson from "@/data/documentos-fechas.json"

export interface DocumentoFechaInfo {
  numero: number
  archivo: string
  titulo: string
  categoria: string
  direccion?: string
  subcategoria?: string
  tipoDocumental?: string
  extension: string
  tamano: string
  fechaOficial: string
  tipoFecha: "fecha_completa" | "anio" | "formato_plantilla" | "catalogo_operativo" | "guia_tutorial" | "sin_fecha" | "resolucion_administrativa" | "emision_oficial" | "gestion_oficial"
  resolucion: string | null
  todasFechas?: string[]
}

export const LISTA_DOCUMENTOS_OFICIALES: DocumentoFechaInfo[] = documentosFechasJson as DocumentoFechaInfo[]

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const mapaPorNumero = new Map<number, DocumentoFechaInfo>()
const mapaPorArchivo = new Map<string, DocumentoFechaInfo>()
const mapaPorTitulo = new Map<string, DocumentoFechaInfo>()

for (const item of LISTA_DOCUMENTOS_OFICIALES) {
  if (typeof item.numero === "number") {
    mapaPorNumero.set(item.numero, item)
  }
  if (item.archivo) {
    const raw = item.archivo.toLowerCase().trim()
    mapaPorArchivo.set(raw, item)
    const base = raw.replace(/^doc_\d+_/i, "")
    mapaPorArchivo.set(base, item)
  }
  if (item.titulo) {
    mapaPorTitulo.set(normalize(item.titulo), item)
  }
}

export function obtenerInfoDocumento(
  archivoOUrl?: string | null,
  titulo?: string | null,
  nombreArchivo?: string | null
): DocumentoFechaInfo | undefined {
  // 1. Extraer número oficial de doc_XXX_ si está presente en cualquier parámetro
  const candidates = [archivoOUrl, nombreArchivo, titulo].filter(Boolean) as string[]

  for (const c of candidates) {
    const numMatch = c.match(/doc_(\d+)_/i)
    if (numMatch) {
      const num = parseInt(numMatch[1], 10)
      if (mapaPorNumero.has(num)) {
        return mapaPorNumero.get(num)
      }
    }
  }

  // 2. Búsqueda por nombre de archivo exacto o base
  for (const c of [archivoOUrl, nombreArchivo].filter(Boolean) as string[]) {
    const clean = c.toLowerCase().trim()
    const base = clean.split("/").pop()?.split("\\").pop() || clean
    if (mapaPorArchivo.has(base)) return mapaPorArchivo.get(base)
    const baseSinDoc = base.replace(/^doc_\d+_/i, "")
    if (mapaPorArchivo.has(baseSinDoc)) return mapaPorArchivo.get(baseSinDoc)
  }

  // 3. Búsqueda por título normalizado (sin acentos ni puntuación)
  for (const c of candidates) {
    const norm = normalize(c)
    if (norm.length > 5) {
      if (mapaPorTitulo.has(norm)) return mapaPorTitulo.get(norm)
      // Coincidencia por subcadena
      for (const [key, val] of mapaPorTitulo.entries()) {
        if (key.length > 10 && (norm.includes(key) || key.includes(norm))) {
          return val
        }
      }
    }
  }

  return undefined
}

export function obtenerFechaOficialDocumento(
  archivoOUrl?: string | null,
  titulo?: string | null,
  nombreArchivo?: string | null,
  createdAtFallback?: Date | string | null
): string {
  const info = obtenerInfoDocumento(archivoOUrl, titulo, nombreArchivo)
  if (info?.fechaOficial && !info.fechaOficial.toLowerCase().includes("sin fecha")) {
    return info.fechaOficial
  }

  // Fallback a createdAt si existe
  if (createdAtFallback) {
    try {
      const d = new Date(createdAtFallback)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("es-BO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      }
    } catch {}
  }

  return info?.fechaOficial || "Sin fecha fija"
}
