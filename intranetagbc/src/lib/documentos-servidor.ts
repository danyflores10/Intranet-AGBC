import { join } from "node:path"
import { existsSync } from "node:fs"

/**
 * Verifica si el archivo digital existe físicamente en el disco del servidor.
 * Solo para uso en Server Actions y scripts de Node.js.
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

