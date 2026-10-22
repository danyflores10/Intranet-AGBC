import documentosFechasJson from "@/data/documentos-fechas.json"

export interface DocumentoFechaInfo {
  numero: number
  archivo: string
  titulo: string
  categoria: string
  extension: string
  tamano: string
  fechaOficial: string
  tipoFecha: "fecha_completa" | "anio" | "formato_plantilla" | "catalogo_operativo" | "guia_tutorial" | "sin_fecha"
  resolucion: string | null
  todasFechas?: string[]
}

export const LISTA_DOCUMENTOS_OFICIALES: DocumentoFechaInfo[] = documentosFechasJson as DocumentoFechaInfo[]

const mapaPorArchivo = new Map<string, DocumentoFechaInfo>()
const mapaPorTitulo = new Map<string, DocumentoFechaInfo>()

for (const item of LISTA_DOCUMENTOS_OFICIALES) {
  if (item.archivo) {
    mapaPorArchivo.set(item.archivo.toLowerCase().trim(), item)
    // También sin prefijo doc_001_
    const baseSinPrefijo = item.archivo.replace(/^doc_\d+_/i, "").toLowerCase().trim()
    mapaPorArchivo.set(baseSinPrefijo, item)
  }
  if (item.titulo) {
    mapaPorTitulo.set(item.titulo.toLowerCase().trim(), item)
  }
}

export function obtenerInfoDocumento(
  nombreArchivo?: string | null,
  titulo?: string | null
): DocumentoFechaInfo | undefined {
  if (nombreArchivo) {
    const clean = nombreArchivo.toLowerCase().trim()
    if (mapaPorArchivo.has(clean)) return mapaPorArchivo.get(clean)
    const base = clean.split("/").pop()?.split("\\").pop() || clean
    if (mapaPorArchivo.has(base)) return mapaPorArchivo.get(base)
    const baseSinPrefijo = base.replace(/^doc_\d+_/i, "")
    if (mapaPorArchivo.has(baseSinPrefijo)) return mapaPorArchivo.get(baseSinPrefijo)
  }

  if (titulo) {
    const cleanT = titulo.toLowerCase().trim()
    if (mapaPorTitulo.has(cleanT)) return mapaPorTitulo.get(cleanT)
    for (const [key, val] of mapaPorTitulo.entries()) {
      if (cleanT.includes(key) || key.includes(cleanT)) return val
    }
  }

  return undefined
}

export function obtenerFechaOficialDocumento(
  nombreArchivo?: string | null,
  titulo?: string | null
): string {
  const info = obtenerInfoDocumento(nombreArchivo, titulo)
  return info?.fechaOficial || "Sin fecha fija"
}
