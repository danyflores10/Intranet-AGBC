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
 * Obtiene el código canónico conciso de familia (por siglas):
 * Ej: 'RE-SABS', 'RE-SAP', 'RE-SOA', 'ETICA'.
 * Si el documento no pertenece a una familia multiversión conocida y no tiene
 * código asignado manualmente, devuelve cadena vacía "" (documento individual).
 */
export function obtenerCodigoFamiliaCanonica(titulo: string, familiaCodigoExistente?: string | null): string {
  if (familiaCodigoExistente && familiaCodigoExistente.trim() !== "" && familiaCodigoExistente.trim() !== "—") {
    return familiaCodigoExistente.trim().toUpperCase()
  }

  const norm = (titulo || "").toLowerCase()
  if (norm.includes("bienes y servicios") || norm.includes("sabs")) {
    return "RE-SABS"
  }
  if (norm.includes("personal") && (norm.includes("administracion") || norm.includes("administración") || norm.includes("sap"))) {
    return "RE-SAP"
  }
  if (norm.includes("organizacion administrativa") || norm.includes("organización administrativa") || norm.includes("soa")) {
    return "RE-SOA"
  }
  if (norm.includes("etica") || norm.includes("ética")) {
    return "ETICA"
  }
  return ""
}

/**
 * Normaliza el título de un documento para comparaciones de texto.
 */
export function normalizarFamiliaCanonica(titulo: string): string {
  return obtenerCodigoFamiliaCanonica(titulo)
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
    familiaCodigo?: string | null
    version?: string | null
    esVigente?: boolean | null
    archivo?: string | null
    nombreArchivo?: string | null
  }
>(documentosLista: T[]): DocumentoConVersion<T>[] {
  // Agrupar por código de familia explícito o canónico
  const grupos = new Map<string, T[]>()
  const individuales: T[] = []

  for (const doc of documentosLista) {
    const cod = obtenerCodigoFamiliaCanonica(doc.titulo, doc.familiaCodigo)
    if (!cod) {
      individuales.push(doc)
    } else {
      const lista = grupos.get(cod) || []
      lista.push(doc)
      grupos.set(cod, lista)
    }
  }

  const resultados: DocumentoConVersion<T>[] = []

  // 1. Procesar individuales (v1.0 • Vigente siempre)
  for (const doc of individuales) {
    const ver = doc.version || "v1.0"
    const vig = doc.esVigente !== undefined && doc.esVigente !== null ? doc.esVigente : true
    resultados.push({
      item: doc,
      familiaCodigo: "",
      version: ver,
      esVigente: vig,
      totalVersionesEnFamilia: 1,
      historialVersiones: [
        {
          id: doc.id,
          numeroCorrelativo: doc.numeroCorrelativo,
          version: ver,
          esVigente: vig,
          fechaEmision: doc.fechaEmision || "Sin fecha fija",
          titulo: doc.titulo,
          archivo: doc.archivo || doc.nombreArchivo,
        },
      ],
    })
  }

  // 2. Procesar familias multiversión
  for (const [codFamilia, lista] of grupos.entries()) {
    if (lista.length === 1) {
      const doc = lista[0]
      const ver = doc.version || "v1.0"
      const vig = doc.esVigente !== undefined && doc.esVigente !== null ? doc.esVigente : true
      resultados.push({
        item: doc,
        familiaCodigo: codFamilia,
        version: ver,
        esVigente: vig,
        totalVersionesEnFamilia: 1,
        historialVersiones: [
          {
            id: doc.id,
            numeroCorrelativo: doc.numeroCorrelativo,
            version: ver,
            esVigente: vig,
            fechaEmision: doc.fechaEmision || "Sin fecha fija",
            titulo: doc.titulo,
            archivo: doc.archivo || doc.nombreArchivo,
          },
        ],
      })
      continue
    }

    // Ordenar cronológicamente por fecha de emisión ascendente
    const ordenados = [...lista].sort((a, b) => {
      const timeA = parsearFechaParaOrden(a.fechaEmision)
      const timeB = parsearFechaParaOrden(b.fechaEmision)
      if (timeA !== timeB) return timeA - timeB
      const numA = a.numeroCorrelativo || 0
      const numB = b.numeroCorrelativo || 0
      if (numA !== numB) return numA - numB
      return a.titulo.localeCompare(b.titulo)
    })

    const total = ordenados.length

    // Historial ordenado
    const historial: InfoVersionDocumento[] = ordenados.map((doc, idx) => {
      const verNum = idx + 1
      const esUltimo = idx === total - 1
      const verStr = doc.version && doc.version.startsWith("v") ? doc.version : `v${verNum}.0`
      const vig = doc.esVigente !== undefined && doc.esVigente !== null ? doc.esVigente : esUltimo
      return {
        id: doc.id,
        numeroCorrelativo: doc.numeroCorrelativo,
        version: verStr,
        esVigente: vig,
        fechaEmision: doc.fechaEmision || "Sin fecha fija",
        titulo: doc.titulo,
        archivo: doc.archivo || doc.nombreArchivo,
      }
    })

    ordenados.forEach((doc, idx) => {
      const histItem = historial[idx]
      resultados.push({
        item: doc,
        familiaCodigo: codFamilia,
        version: histItem.version,
        esVigente: histItem.esVigente,
        totalVersionesEnFamilia: total,
        historialVersiones: historial,
      })
    })
  }

  return resultados
}
