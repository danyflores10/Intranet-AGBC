/**
 * Utilidades para nombres limpios de descarga y detección de tipo de documento
 * para todo el sistema (Documentos, Mensajería, Notificaciones, etc.)
 */

export function normalizarExtension(tipoArchivo?: string | null, archivoUrl?: string | null): string {
  const raw = ((tipoArchivo || "") + " " + (archivoUrl || "")).toLowerCase()
  if (raw.includes("pdf")) return "pdf"
  if (raw.includes("xlsx") || raw.includes("spreadsheetml") || raw.includes("excel")) return "xlsx"
  if (raw.includes("xls")) return "xls"
  if (raw.includes("csv")) return "csv"
  if (raw.includes("docx") || raw.includes("wordprocessingml")) return "docx"
  if (raw.includes("doc")) return "doc"
  if (raw.includes("png")) return "png"
  if (raw.includes("jpg") || raw.includes("jpeg")) return "jpg"
  if (raw.includes("webp")) return "webp"
  if (raw.includes("zip")) return "zip"
  if (raw.includes("rar")) return "rar"

  // Intentar extraer de la url
  if (archivoUrl) {
    const ext = archivoUrl.split("?")[0].split(".").pop()?.toLowerCase()
    if (ext && ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) {
      return ext
    }
  }

  return "pdf"
}

export function getCleanDocumentFileName(
  titulo: string,
  tipoArchivo?: string | null,
  archivoUrl?: string | null
): string {
  if (!titulo || typeof titulo !== "string") {
    titulo = "Documento"
  }

  // Quitar códigos técnicos iniciales como doc_054_, hashes cuid o UUIDs
  let clean = titulo
    .replace(/^doc_\d+_/i, "")
    .replace(/^[a-z0-9]{24,32}_/i, "")
    .trim()

  // Limpiar caracteres no válidos para nombres de archivo en Windows/Linux
  clean = clean.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim()

  const ext = normalizarExtension(tipoArchivo, archivoUrl)

  // Si ya termina con la extensión correspondiente, preservarla
  const regexExt = new RegExp(`\\.${ext}$`, "i")
  if (regexExt.test(clean)) {
    return clean
  }

  // Si termina con otra extensión de 3-4 caracteres, removerla primero
  clean = clean.replace(/\.[a-z0-9]{3,4}$/i, "").trim()

  return `${clean}.${ext}`
}

export interface DocumentTypeInfo {
  isPdf: boolean
  isExcel: boolean
  isWord: boolean
  isImage: boolean
  ext: string
  label: string
  shortLabel: string
  badgeColor: string
}

export function getDocumentTypeInfo(
  tipoArchivo?: string | null,
  archivoUrl?: string | null
): DocumentTypeInfo {
  const ext = normalizarExtension(tipoArchivo, archivoUrl)

  if (ext === "pdf") {
    return {
      isPdf: true,
      isExcel: false,
      isWord: false,
      isImage: false,
      ext: "pdf",
      label: "Descargar PDF (.pdf)",
      shortLabel: "Descargar PDF",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
    }
  }

  if (["xlsx", "xls", "csv"].includes(ext)) {
    return {
      isPdf: false,
      isExcel: true,
      isWord: false,
      isImage: false,
      ext,
      label: `Descargar Excel (.${ext})`,
      shortLabel: "Descargar Excel",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }
  }

  if (["docx", "doc"].includes(ext)) {
    return {
      isPdf: false,
      isExcel: false,
      isWord: true,
      isImage: false,
      ext,
      label: `Descargar Word (.${ext})`,
      shortLabel: "Descargar Word",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    }
  }

  if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return {
      isPdf: false,
      isExcel: false,
      isWord: false,
      isImage: true,
      ext,
      label: `Descargar Imagen (.${ext})`,
      shortLabel: "Descargar Imagen",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    }
  }

  return {
    isPdf: false,
    isExcel: false,
    isWord: false,
    isImage: false,
    ext,
    label: `Descargar Archivo (.${ext})`,
    shortLabel: "Descargar Archivo",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
  }
}

export function getDownloadUrl(
  archivoUrl?: string | null,
  titulo?: string,
  tipoArchivo?: string | null
): string {
  if (!archivoUrl) return "#"

  const cleanName = getCleanDocumentFileName(titulo || "Documento", tipoArchivo, archivoUrl)
  let base = archivoUrl

  if (!base.startsWith("http://") && !base.startsWith("https://") && !base.startsWith("/api/documentos/")) {
    base = `/api/documentos/${base.replace(/^\/?(documentos\/)?/, "")}`
  }

  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}download=1&filename=${encodeURIComponent(cleanName)}`
}
