import { join } from "node:path"
import { existsSync } from "node:fs"

/**
 * Meses en español para parser de fechas oficiales
 */
const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

/**
 * Convierte un string de fecha (ej. "16 de junio de 2021", "2019", "05 de agosto de 2026")
 * a un timestamp numérico para ordenación cronológica exacta.
 */
export function parsearFechaParaOrden(fechaStr?: string | null): number {
  if (!fechaStr || fechaStr.trim() === "" || fechaStr === "—" || fechaStr === "Sin fecha fija") {
    return 0
  }

  const clean = fechaStr.toLowerCase().trim()

  // 1. Formato "DD de Mes de YYYY" (ej: "16 de junio de 2021")
  const regexFull = /(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/i
  const matchFull = clean.match(regexFull)
  if (matchFull) {
    const dia = parseInt(matchFull[1], 10)
    const mesNom = matchFull[2].toLowerCase()
    const anio = parseInt(matchFull[3], 10)
    const mesIdx = MESES[mesNom] !== undefined ? MESES[mesNom] : 0
    return new Date(anio, mesIdx, dia).getTime()
  }

  // 2. Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const t = new Date(clean).getTime()
    if (!isNaN(t)) return t
  }

  // 3. Formato DD/MM/YYYY
  const regexSlash = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
  const matchSlash = clean.match(regexSlash)
  if (matchSlash) {
    const dia = parseInt(matchSlash[1], 10)
    const mes = parseInt(matchSlash[2], 10) - 1
    const anio = parseInt(matchSlash[3], 10)
    return new Date(anio, mes, dia).getTime()
  }

  // 4. Solo Año (ej: "2019")
  const matchYear = clean.match(/\b(19\d{2}|20\d{2})\b/)
  if (matchYear) {
    return new Date(parseInt(matchYear[1], 10), 0, 1).getTime()
  }

  return 0
}

/**
 * Normaliza el título de un documento para extraer la FAMILIA BASE CANÓNICA.
 * Remueve resoluciones administrativas (ej. "R.A. N° 013 . 2019", "RA 40", "R.A. 11.18"),
 * siglas entre paréntesis ("(RE-SABS)", "(RE-SOA)"), años sueltos y caracteres especiales.
 *
 * Esto permite identificar con precisión si dos documentos son versiones del mismo
 * sin confundirlos con documentos distintos.
 */
export function normalizarFamiliaCanonica(titulo: string): string {
  if (!titulo) return ""

  let base = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Sin tildes

  // Remover sufijos y prefijos de resoluciones administrativas (ej: RA 17.18, R.A. N° 013 . 2019, RA 40)
  base = base.replace(/\br\.?a\.?\s*n?°?\s*\d+[\d\.\s\/\-_]*\d*/gi, " ")

  // Remover siglas técnicas de reglamentos específicos y manuales (ej: RE-SABS, RE-SOA, RE-SAP)
  base = base.replace(/\s*[\(\-–—\[]\s*re\-[a-z]+\s*[\)\-–—\]]?/gi, " ")
  base = base.replace(/\bre\-[a-z]+\b/gi, " ")
  base = base.replace(/\bsigec\b/gi, " sigec ")
  base = base.replace(/\bsigep\b/gi, " sigep ")

  // Remover años standalone entre 2010 y 2035
  base = base.replace(/\b20[1-3]\d\b/g, " ")

  // Remover palabras comunes de relleno o número
  base = base.replace(/\bno\b/gi, " ")
  base = base.replace(/\bnumero\b/gi, " ")
  base = base.replace(/\baprobacion\b/gi, " ")

  // Normalizar caracteres no alfanuméricos a espacios simples
  base = base.replace(/[^a-z0-9]/g, " ")
  base = base.replace(/\s+/g, " ").trim()

  return base
}

export interface InfoVersionDocumento {
  id?: string
  numeroCorrelativo?: number | null
  version: string
  esVigente: boolean
  fechaEmision: string
  titulo: string
  archivo?: string | null
}

export interface DocumentoConVersion<T> {
  item: T
  familiaCodigo: string
  version: string
  esVigente: boolean
  totalVersionesEnFamilia: number
  historialVersiones: InfoVersionDocumento[]
}

/**
 * Calcula y asigna inteligentemente las versiones (v1.0, v2.0, v3.0...)
 * y el estado de vigencia (Vigente vs Histórico) para una lista de documentos.
 */
export function calcularVersionesCatalogo<
  T extends {
    id?: string
    titulo: string
    fechaEmision?: string | null
    numeroCorrelativo?: number | null
    direccionId?: string | null
    subcategoriaId?: string | null
    archivo?: string | null
    nombreArchivo?: string | null
  }
>(documentosLista: T[]): DocumentoConVersion<T>[] {
  // Agrupar por familia canónica + subárea (para evitar colisiones entre áreas distintas)
  const grupos = new Map<string, T[]>()

  for (const doc of documentosLista) {
    const familiaSlug = normalizarFamiliaCanonica(doc.titulo)
    // Usar familiaSlug combinada con subcategoría si existe
    const subKey = doc.subcategoriaId ? `_${doc.subcategoriaId}` : ""
    const key = `${familiaSlug}${subKey}`

    const lista = grupos.get(key) || []
    lista.push(doc)
    grupos.set(key, lista)
  }

  const resultados: DocumentoConVersion<T>[] = []

  for (const [key, lista] of grupos.entries()) {
    // Si la familia tiene un solo documento: es v1.0 y siempre Vigente
    if (lista.length === 1) {
      const doc = lista[0]
      const familiaCodigo = normalizarFamiliaCanonica(doc.titulo).replace(/\s+/g, "-") || "doc"
      resultados.push({
        item: doc,
        familiaCodigo,
        version: "v1.0",
        esVigente: true,
        totalVersionesEnFamilia: 1,
        historialVersiones: [
          {
            id: doc.id,
            numeroCorrelativo: doc.numeroCorrelativo,
            version: "v1.0",
            esVigente: true,
            fechaEmision: doc.fechaEmision || "Sin fecha fija",
            titulo: doc.titulo,
            archivo: doc.archivo || doc.nombreArchivo,
          },
        ],
      })
      continue
    }

    // Múltiples versiones: ordenar cronológicamente por fecha de emisión ascendente
    // (el más antiguo es v1.0, el siguiente v2.0, y el más reciente es vX.0 y VIGENTE)
    const ordenados = [...lista].sort((a, b) => {
      const timeA = parsearFechaParaOrden(a.fechaEmision)
      const timeB = parsearFechaParaOrden(b.fechaEmision)
      if (timeA !== timeB) return timeA - timeB
      // Si tienen la misma fecha o año, desempatar por número correlativo o título
      const numA = a.numeroCorrelativo || 0
      const numB = b.numeroCorrelativo || 0
      if (numA !== numB) return numA - numB
      return a.titulo.localeCompare(b.titulo)
    })

    const total = ordenados.length
    const familiaCodigo = normalizarFamiliaCanonica(ordenados[0].titulo).replace(/\s+/g, "-") || "familia-doc"

    // Crear el historial de toda la familia
    const historial: InfoVersionDocumento[] = ordenados.map((doc, idx) => {
      const verNum = idx + 1
      const esUltimo = idx === total - 1
      return {
        id: doc.id,
        numeroCorrelativo: doc.numeroCorrelativo,
        version: `v${verNum}.0`,
        esVigente: esUltimo,
        fechaEmision: doc.fechaEmision || "Sin fecha fija",
        titulo: doc.titulo,
        archivo: doc.archivo || doc.nombreArchivo,
      }
    })

    // Asignar a cada documento su versión individual y referencia al historial completo
    ordenados.forEach((doc, idx) => {
      const verNum = idx + 1
      const esUltimo = idx === total - 1

      resultados.push({
        item: doc,
        familiaCodigo,
        version: `v${verNum}.0`,
        esVigente: esUltimo,
        totalVersionesEnFamilia: total,
        historialVersiones: historial,
      })
    })
  }

  return resultados
}

/**
 * Verifica si el archivo digital existe físicamente en el disco del servidor.
 */
export function verificarDisponibilidadFisica(archivoPath?: string | null): {
  disponible: boolean
  rutaRelativa?: string
} {
  if (!archivoPath || archivoPath.trim() === "" || archivoPath === "—") {
    return { disponible: false }
  }

  const clean = archivoPath.replace(/^\/?(documentos\/|api\/documentos\/)?/, "")
  const fullPath1 = join(process.cwd(), "public", "documentos", clean)
  const fullPath2 = join(process.cwd(), "public", clean)

  if (existsSync(fullPath1) || existsSync(fullPath2)) {
    return { disponible: true, rutaRelativa: `/api/documentos/${clean}` }
  }

  return { disponible: false }
}
