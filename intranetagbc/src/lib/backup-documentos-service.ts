import * as archiverLib from "archiver"
const archiver = ((archiverLib as any).default || archiverLib) as unknown as (
  format: string,
  options?: any
) => any
import { PassThrough, Readable } from "node:stream"
import fs from "node:fs"
import path from "node:path"
import * as XLSX from "xlsx"
import { db } from "@/db"
import { documentos } from "@/db/schema"
import {
  clasificarDocumento,
  obtenerGrupoJerarquico,
  ESTRUCTURA_JERARQUICA,
} from "@/lib/documentos-jerarquia"
import {
  LISTA_DOCUMENTOS_OFICIALES,
  obtenerFechaOficialDocumento,
} from "@/lib/documentos-fechas-map"
import { getCleanDocumentFileName } from "@/lib/document-download-helper"

function sanitizeFolderName(name: string): string {
  if (!name) return "General"
  return name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "General"
}

function resolvePhysicalPath(archivo?: string | null, nombreArchivo?: string | null): string | null {
  const rootDir = /* turbopackIgnore: true */ process.cwd()
  const publicDir = path.join(rootDir, "public")
  const rawCandidates: string[] = []
  if (archivo) rawCandidates.push(archivo)
  if (nombreArchivo) rawCandidates.push(nombreArchivo)

  for (const raw of rawCandidates) {
    const clean = raw.replace(/^\/+/, "").replace(/\.\./g, "").replace(/^documentos\//, "")
    const pathsToCheck = [
      path.join(publicDir, "documentos", clean),
      path.join(publicDir, "documentos", "documentos AGBC", clean),
      path.join(publicDir, clean),
      path.join(publicDir, "documentos", raw.replace(/^\/+/, "")),
      path.join(publicDir, "documentos", "documentos AGBC", raw.replace(/^\/+/, "")),
    ]

    for (const p of pathsToCheck) {
      if (fs.existsSync(p)) {
        try {
          if (fs.statSync(p).isFile()) return p
        } catch {}
      }
    }
  }
  return null
}

export interface BackupOptions {
  format?: "zip" | "rar"
}

export async function generarBackupDocumentosStream(options: BackupOptions = {}) {
  const fechaHoy = new Date().toISOString().slice(0, 10)
  const fechaFormateada = new Date().toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // 1. Obtener lista completa de documentos desde BD con timeout de seguridad y fallback a catálogo oficial
  let docs: any[] = []
  try {
    const dbDocs = await Promise.race([
      db.select().from(documentos),
      new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("Timeout conectando a BD")), 3500)),
    ])
    if (dbDocs && dbDocs.length > 0) {
      docs = dbDocs
    }
  } catch (err: any) {
    console.warn("Consulta a BD directa para backup no disponible o lenta, usando catálogo oficial completo:", err?.message)
  }

  if (docs.length === 0) {
    docs = LISTA_DOCUMENTOS_OFICIALES as any[]
  }

  // 2. Inicializar compresor ZIP optimizado
  const archive = archiver("zip", {
    zlib: { level: 6 },
    forceLocalTime: true,
  })

  const passthrough = new PassThrough()
  archive.pipe(passthrough)

  // 3. Crear carpetas de las 4 Direcciones y subáreas estructuradas
  const rootFolder = `Backup_Documental_AGBC_${fechaHoy}`

  // Registro de nombres utilizados por carpeta para evitar colisiones
  const usedPaths = new Set<string>()

  // Matriz de datos para el Catálogo Excel que acompañará el backup
  const excelRows: any[][] = [
    ["AGENCIA BOLIVIANA DE CORREOS - CORREOS DE BOLIVIA (AGBC)"],
    ["CATÁLOGO Y COPIA DE SEGURIDAD GENERAL DE DOCUMENTACIÓN INSTITUCIONAL"],
    ["Fecha de generación:", fechaFormateada],
    ["Total Documentos Respaldados:", docs.length],
    [],
    [
      "Nº",
      "TÍTULO DEL DOCUMENTO",
      "DIRECCIÓN",
      "SUB-ÁREA",
      "CATEGORÍA / TIPO JERÁRQUICO",
      "FECHA OFICIAL",
      "VERSIÓN",
      "VIGENCIA",
      "ESTADO DIGITAL",
      "UBICACIÓN EN CARPETA DE RESPALDO",
    ],
  ]

  let filesAddedCount = 0

  // 4. Procesar y agregar cada documento en su carpeta correspondiente
  docs.forEach((d: any, idx: number) => {
    const j = clasificarDocumento(d.archivo || d.nombreArchivo, d.titulo)
    const direccion = d.direccion || j.direccionNombre || "Dirección Administrativa Financiera"
    const subcategoria = d.subcategoria || j.subcategoriaNombre || "General"
    const tipoDoc = obtenerGrupoJerarquico(d.tipoDocumental, d.categoria, d.titulo)

    const cleanDir = sanitizeFolderName(direccion)
    const cleanSub = sanitizeFolderName(subcategoria)
    const cleanTipo = sanitizeFolderName(tipoDoc)

    const baseCleanFileName = getCleanDocumentFileName(d.titulo, d.tipoArchivo, d.archivo)

    // Evitar sobreescritura si dos documentos tienen el mismo título en la misma carpeta
    let finalFileName = baseCleanFileName
    let counter = 1
    let fullEntryPath = `${rootFolder}/${cleanDir}/${cleanSub}/${cleanTipo}/${finalFileName}`

    while (usedPaths.has(fullEntryPath)) {
      counter++
      const ext = path.extname(baseCleanFileName)
      const nameWithoutExt = path.basename(baseCleanFileName, ext)
      finalFileName = `${nameWithoutExt}_(${counter})${ext}`
      fullEntryPath = `${rootFolder}/${cleanDir}/${cleanSub}/${cleanTipo}/${finalFileName}`
    }
    usedPaths.add(fullEntryPath)

    const fechaOficial =
      d.fechaEmision ||
      obtenerFechaOficialDocumento(d.archivo, d.titulo, d.nombreArchivo, d.createdAt) ||
      "Sin fecha fija"

    const physicalPath = resolvePhysicalPath(d.archivo, d.nombreArchivo)

    if (physicalPath) {
      archive.file(physicalPath, { name: fullEntryPath })
      filesAddedCount++
    } else {
      // Documento registrado oficialmente pero con digitalización pendiente
      const textNotice = `AGENCIA BOLIVIANA DE CORREOS (AGBC)
REGISTRO OFICIAL DE DOCUMENTO INSTITUCIONAL
====================================================================
Título: ${d.titulo}
Nº Correlativo: ${d.numeroCorrelativo || idx + 1}
Dirección: ${direccion}
Subárea: ${subcategoria}
Categoría / Tipo: ${tipoDoc}
Fecha Oficial: ${fechaOficial}
Versión: ${d.version || "v1.0"}
Estado: ${d.esVigente !== false ? "Vigente (Obligatorio)" : "Histórico"}
Disponibilidad: Archivo físico registrado en catálogo; pendiente de escaneo/asociación digital.
====================================================================
`
      const noticePath = `${rootFolder}/${cleanDir}/${cleanSub}/${cleanTipo}/${path.basename(
        finalFileName,
        path.extname(finalFileName)
      )} [REGISTRO_PENDIENTE_DIGITALIZAR].txt`
      archive.append(textNotice, { name: noticePath })
    }

    excelRows.push([
      d.numeroCorrelativo || idx + 1,
      d.titulo,
      direccion,
      subcategoria,
      tipoDoc,
      fechaOficial,
      d.version || "v1.0",
      d.esVigente !== false ? "Vigente" : "Histórico",
      physicalPath ? "Archivo Digital Incluido" : "Digitalización Pendiente",
      `${cleanDir} > ${cleanSub} > ${cleanTipo} > ${finalFileName}`,
    ])
  })

  // 5. Generar e incluir la planilla Excel con el catálogo completo en la raíz del respaldo
  try {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelRows)
    ws["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 32 },
      { wch: 35 },
      { wch: 22 },
      { wch: 22 },
      { wch: 10 },
      { wch: 14 },
      { wch: 24 },
      { wch: 60 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Catálogo Oficial AGBC")
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    archive.append(excelBuffer, {
      name: `${rootFolder}/Catalogo_Documentos_Normativas_AGBC.xlsx`,
    })
  } catch (err) {
    console.error("Error generando Excel de respaldo:", err)
  }

  // 6. Incluir archivo informativo LEAME en la raíz
  const readmeText = `========================================================================
AGENCIA BOLIVIANA DE CORREOS - CORREOS DE BOLIVIA (AGBC)
COPIA DE SEGURIDAD GENERAL DE GESTIÓN DOCUMENTAL Y ARCHIVOS
========================================================================
Fecha de Generación: ${fechaFormateada}
Total de Documentos Registrados: ${docs.length}
Archivos Digitales Incorporados: ${filesAddedCount}

ESTRUCTURA DE CARPETAS ORGANIZADA POR 3 NIVELES JERÁRQUICOS:

1. NIVEL 1 - DIRECCIONES:
   ├── Dirección General Ejecutiva (DGE)
   ├── Dirección Administrativa Financiera (DAF)
   ├── Dirección de Operaciones (DO)
   └── Dirección Comercial (DC)

2. NIVEL 2 - SUB-ÁREAS OPERATIVAS:
   ├── Planificación, Legal, Auditoria Interna, Transparencia
   ├── Recursos Humanos, Tesorería Facturación y Cobranzas, Sistemas
   ├── Presupuesto y Adquisiciones, Contabilidad, Bienes y Servicios
   ├── Desarrollo de Calidad
   └── Relaciones Internacionales Marketing y Comunicación

3. NIVEL 3 - CATEGORÍAS DOCUMENTALES:
   ├── Reglamentos
   ├── Manuales
   ├── Procedimientos
   ├── Formularios
   ├── Instructivos
   ├── Normativas
   └── Circulares

ARCHIVOS EN LA RAÍZ:
- Catalogo_Documentos_Normativas_AGBC.xlsx: Planilla con todos los metadatos oficiales y detalle de ubicación.
- LEAME_RESPALDO_AGBC.txt: Este manual de contenido.
========================================================================
`
  archive.append(readmeText, { name: `${rootFolder}/LEAME_RESPALDO_AGBC.txt` })

  // Finalizar el empaquetado de manera asíncrona
  archive.finalize().catch((err: any) => {
    console.error("Error al finalizar el archivo de backup:", err)
    passthrough.destroy(err)
  })

  // Convertir a Web ReadableStream para Next.js App Router
  const webStream = Readable.toWeb(passthrough)

  const extension = options.format === "rar" ? "rar" : "zip"
  const fileName = `Backup_Documental_AGBC_${fechaHoy}.${extension}`

  return {
    stream: webStream,
    fileName,
    contentType: options.format === "rar" ? "application/x-rar-compressed" : "application/zip",
  }
}
