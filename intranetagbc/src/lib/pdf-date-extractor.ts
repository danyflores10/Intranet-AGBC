import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { join } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import * as XLSX from "xlsx"

const execFileAsync = promisify(execFile)

const MESES: Record<string, string> = {
  enero: "enero",
  febrero: "febrero",
  marzo: "marzo",
  abril: "abril",
  mayo: "mayo",
  junio: "junio",
  julio: "julio",
  agosto: "agosto",
  septiembre: "septiembre",
  setiembre: "septiembre",
  octubre: "octubre",
  noviembre: "noviembre",
  diciembre: "diciembre",
}

const MESES_REGEX = Object.keys(MESES).join("|")

/**
 * Intenta extraer la fecha oficial de emisión desde un archivo PDF
 * Inspecciona las primeras 5-6 hojas y las últimas 5 hojas.
 * Si encuentra día, mes y año retorna ej. "21 de agosto de 2018".
 * Si solo encuentra el año, retorna ej. "2024".
 * Si no encuentra fecha, retorna null.
 */
export async function extractDateFromPdfFile(filePath: string): Promise<string | null> {
  if (!existsSync(filePath)) {
    return null
  }

  // 1. Intentar con script de Python (PyMuPDF) si está disponible en el servidor
  try {
    const scriptPath = join(process.cwd(), "scripts", "extract_pdf_date.py")
    if (existsSync(scriptPath)) {
      const { stdout } = await execFileAsync("python", [scriptPath, filePath], { timeout: 6000 })
      const parsed = JSON.parse(stdout.trim())
      if (parsed && typeof parsed.fecha === "string" && parsed.fecha.trim().length > 0) {
        return parsed.fecha.trim()
      }
    }
  } catch (err) {
    // Continuar a fallback interno en Node.js
  }

  // 2. Fallback nativo Node.js sin dependencias externas:
  //    Leer los primeros y últimos bloques de bytes en busca de patrones de fecha
  try {
    const buffer = readFileSync(filePath)
    const rawHead = buffer.subarray(0, Math.min(buffer.length, 120000)).toString("latin1")
    const dateFromHead = extractDateFromText(rawHead)
    if (dateFromHead) return dateFromHead

    if (buffer.length > 120000) {
      const rawTail = buffer.subarray(buffer.length - 80000).toString("latin1")
      const dateFromTail = extractDateFromText(rawTail)
      if (dateFromTail) return dateFromTail
    }
  } catch (bufErr) {
    console.warn("[pdf-date-extractor] Fallback error:", bufErr)
  }

  return null
}

/**
 * Extrae fecha u oficial año de emisión desde un archivo Excel (XLSX / XLS)
 */
export function extractDateFromExcelBuffer(buffer: Buffer): string | null {
  try {
    const wb = XLSX.read(buffer, { type: "buffer" })
    if (!wb.SheetNames || wb.SheetNames.length === 0) return null

    // Inspeccionar la primera hoja
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) return null

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
    // Buscar en las primeras 25 filas
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r]
      if (!Array.isArray(row)) continue
      for (const cell of row) {
        if (!cell) continue
        const str = String(cell).trim()
        const found = extractDateFromText(str)
        if (found) return found
      }
    }
  } catch (e) {
    console.warn("[extractDateFromExcelBuffer] Error:", e)
  }
  return null
}

/**
 * Extrae fecha de una cadena de texto sin procesar
 */
export function extractDateFromText(text: string): string | null {
  if (!text || typeof text !== "string") return null

  // 1. Fecha completa en español: ej. "14 de mayo de 2018"
  const regexFull = new RegExp(
    `\\b([0-3]?\\d)\\s+de\\s+(${MESES_REGEX})\\s+de\\s+(20[12]\\d|19\\d\\d)\\b`,
    "i"
  )
  const matchFull = text.match(regexFull)
  if (matchFull) {
    const day = parseInt(matchFull[1], 10)
    const month = matchFull[2].toLowerCase()
    const year = matchFull[3]
    return `${day} de ${MESES[month] || month} de ${year}`
  }

  // 2. Fecha corta numérica: ej. "14/05/2018" o "14-05-2018"
  const regexShort = /\b([0-3]?\d)[/.-]([01]?\d)[/.-](20[12]\d|19\d\d)\b/
  const matchShort = text.match(regexShort)
  if (matchShort) {
    const day = parseInt(matchShort[1], 10)
    const mNum = parseInt(matchShort[2], 10)
    const year = matchShort[3]
    const mNames = [
      "",
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ]
    if (mNum >= 1 && mNum <= 12) {
      return `${day} de ${mNames[mNum]} de ${year}`
    }
  }

  // 3. Solo año institucional: ej. "2024", "2021", "2019"
  const regexYear = /\b(20[12]\d)\b/
  const matchYear = text.match(regexYear)
  if (matchYear) {
    return matchYear[1]
  }

  return null
}

