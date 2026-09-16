export const CATEGORIAS_VALIDAS = [
  "Normativas",
  "Circulares",
  "Formularios",
  "Instructivos",
  "Manuales",
  "Reglamentos",
] as const

export type CategoriaValida = (typeof CATEGORIAS_VALIDAS)[number]

/**
 * Normaliza un texto eliminando acentos y espacios extra para búsqueda de palabras clave
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Remueve la extensión de un nombre de archivo
 */
export function obtenerNombreSinExtension(nombreArchivo: string): string {
  const ultimoPunto = nombreArchivo.lastIndexOf(".")
  if (ultimoPunto === -1) return nombreArchivo.trim()
  return nombreArchivo.substring(0, ultimoPunto).trim()
}

/**
 * Detecta una de las 6 categorías oficiales de AGBC a partir del nombre del archivo.
 * Si no hay una palabra clave clara, retorna null (marcado como "Revisar").
 */
export function detectarCategoria(nombreArchivo: string): CategoriaValida | null {
  const nombreBase = obtenerNombreSinExtension(nombreArchivo)
  const norm = normalizar(nombreBase)

  // 1. REGLAMENTOS
  if (
    norm.includes("reglamento") ||
    norm.includes("reglam") ||
    /\bre\s*\-/i.test(nombreBase) ||
    /\b(re sabs|re sap|re soa|re scg|re sp|re spo|re st)\b/i.test(norm)
  ) {
    return "Reglamentos"
  }

  // 2. CIRCULARES
  if (
    norm.includes("circular") ||
    norm.includes("circulares") ||
    /\bcirc?\b/i.test(norm)
  ) {
    return "Circulares"
  }

  // 3. INSTRUCTIVOS
  if (
    norm.includes("instructivo") ||
    norm.includes("instructivos") ||
    norm.includes("instruccion")
  ) {
    return "Instructivos"
  }

  // 4. FORMULARIOS
  if (
    norm.includes("formulario") ||
    norm.includes("formularios") ||
    norm.includes("ficha") ||
    norm.includes("acta") ||
    norm.includes("reporte") ||
    norm.includes("recibo") ||
    norm.includes("matriz") ||
    norm.includes("kardex") ||
    norm.includes("notificacion") ||
    norm.includes("solicitud") ||
    /\bagbc\.f\./i.test(nombreBase) ||
    norm.includes("quejas") ||
    norm.includes("reclamacion")
  ) {
    return "Formularios"
  }

  // 5. MANUALES & PROCEDIMIENTOS / GUÍAS
  if (
    norm.includes("manual") ||
    norm.includes("manuales") ||
    norm.includes("guia") ||
    norm.includes("organigrama") ||
    norm.includes("procedimiento") ||
    norm.includes("procedimientos") ||
    norm.includes("politica") ||
    norm.includes("politicas") ||
    norm.includes("codigo de etica") ||
    norm.includes("codigo")
  ) {
    return "Manuales"
  }

  // 6. NORMATIVAS
  if (
    norm.includes("normativa") ||
    norm.includes("normativas") ||
    norm.includes("norma") ||
    norm.includes("normas") ||
    norm.includes("resolucion") ||
    norm.includes("decreto") ||
    norm.includes("ley") ||
    norm.includes("estatuto")
  ) {
    return "Normativas"
  }

  return null // Revisar
}

/**
 * Genera un título corto y conciso a partir del nombre del archivo.
 * Ejemplo:
 * - "Reglamento Específico del Sistema de Administracion de Bienes y Servicios (RE-SABS)" -> "Reglamento (RE-SABS)"
 * - "Manual de Procedimientos para la Gestión Documental" -> "Manual de Gestión Documental"
 */
export function generarTituloCorto(nombreArchivo: string): string {
  let raw = obtenerNombreSinExtension(nombreArchivo)

  // 1. Quitar prefijos comunes de código de archivo como "doc_001_", "AGBC.F.ADF.001 ", "RA-01 ", etc.
  raw = raw.replace(/^doc[_\s-]*\d+[_\s-]*/i, "")
  raw = raw.replace(/^agbc\.[a-z]\.[a-z]+\.\d+\s+/i, "")
  raw = raw.replace(/^(ra|r\.a\.|ds|d\.s\.)\s*[\d\-_/]+\s+/i, "")
  raw = raw.trim()

  // 2. Extraer acrónimo o código entre paréntesis si existe (ej. (RE-SABS), (SIGEC), (CN-08), (FELCN))
  const matchParentesis = raw.match(/\(([^)]+)\)/)
  const acronimo = matchParentesis ? matchParentesis[1].trim() : null

  // Identificar el tipo principal
  let tipoPrincipal = ""
  const norm = normalizar(raw)

  if (norm.startsWith("reglamento")) tipoPrincipal = "Reglamento"
  else if (norm.startsWith("manual")) tipoPrincipal = "Manual"
  else if (norm.startsWith("instructivo")) tipoPrincipal = "Instructivo"
  else if (norm.startsWith("circular")) tipoPrincipal = "Circular"
  else if (norm.startsWith("formulario")) tipoPrincipal = "Formulario"
  else if (norm.startsWith("procedimiento")) tipoPrincipal = "Procedimiento"
  else if (norm.startsWith("politica")) tipoPrincipal = "Política"
  else if (norm.startsWith("guia")) tipoPrincipal = "Guía"
  else if (norm.startsWith("normativa") || norm.startsWith("norma")) tipoPrincipal = "Normativa"
  else if (norm.startsWith("ficha")) tipoPrincipal = "Ficha"
  else if (norm.startsWith("acta")) tipoPrincipal = "Acta"
  else if (norm.startsWith("reporte")) tipoPrincipal = "Reporte"
  else if (norm.startsWith("codigo")) tipoPrincipal = "Código"

  // Si tiene acrónimo y es un documento institucional tipo "Reglamento ... (RE-SABS)" o "Guía ... (SIGEC)"
  if (acronimo && tipoPrincipal && (acronimo.includes("-") || acronimo.length <= 15)) {
    // Si el acrónimo ya incluye el tipo o es suficientemente descriptivo:
    return `${tipoPrincipal} (${acronimo})`
  }

  // 3. Limpiar frases redundantes y palabras de relleno
  let limpio = raw
  // Quitar el acrónimo del final si no lo usamos directamente
  limpio = limpio.replace(/\s*\([^)]+\)\s*$/, "")

  // Quitar conectores largos
  limpio = limpio.replace(/\bde procedimientos para la\b/gi, "de")
  limpio = limpio.replace(/\bde procedimientos para el\b/gi, "de")
  limpio = limpio.replace(/\bde procesos y procedimientos de\b/gi, "de")
  limpio = limpio.replace(/\bde procesos y procedimientos para\b/gi, "para")
  limpio = limpio.replace(/\bespecifico del sistema de\b/gi, "de")
  limpio = limpio.replace(/\bespecifica del sistema de\b/gi, "de")
  limpio = limpio.replace(/\bespecifico para el\b/gi, "de")
  limpio = limpio.replace(/\bespecifico de\b/gi, "de")
  limpio = limpio.replace(/\boperativo para la\b/gi, "de")
  limpio = limpio.replace(/\boperativo de\b/gi, "de")
  limpio = limpio.replace(/\bpara el uso mantenimiento y reparacion de los\b/gi, "de mantenimiento de")
  limpio = limpio.replace(/\bpara la asignacion y control de uso de\b/gi, "de")
  limpio = limpio.replace(/\bpara el diagnostico diseno y rediseno\b/gi, "de diseño")
  limpio = limpio.replace(/\bpara la atencion y tratamiento de\b/gi, "de atención de")
  limpio = limpio.replace(/\bpara la ejecucion de recursos del\b/gi, "de recursos de")
  limpio = limpio.replace(/\bpara el cumplimiento oportuno de la\b/gi, "de")
  limpio = limpio.replace(/\s+/g, " ").trim()

  // Si quedó muy largo (> 55 caracteres), acortar inteligentemente
  if (limpio.length > 55) {
    const palabras = limpio.split(" ")
    if (palabras.length > 6) {
      limpio = palabras.slice(0, 6).join(" ")
    }
  }

  // Capitalizar primera letra de cada palabra clave o estilo título
  return capitalizarTitulo(limpio)
}

function capitalizarTitulo(str: string): string {
  const palabrasMenores = new Set(["de", "del", "la", "las", "el", "los", "en", "y", "a", "por", "para", "con", "sin", "yo"])
  
  return str
    .split(" ")
    .map((palabra, index) => {
      if (!palabra) return ""
      const lower = palabra.toLowerCase()
      // Mantener acrónimos en mayúscula (ej. SABS, SIGEC, FELCN, AGBC, RE-SABS)
      if (palabra.length >= 2 && palabra === palabra.toUpperCase() && !palabrasMenores.has(lower)) {
        return palabra
      }
      if (index > 0 && palabrasMenores.has(lower)) {
        return lower
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    })
    .join(" ")
}
