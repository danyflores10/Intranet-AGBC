"use client"

import { useState, useRef, useMemo } from "react"
import {
  UploadCloudIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon,
  LayersIcon,
  ArrowRightIcon,
  SparklesIcon,
  RefreshCwIcon,
  SearchIcon,
  CheckIcon,
  Trash2Icon,
  FolderIcon,
  Building2Icon,
  CalendarIcon,
  Loader2Icon,
  EyeIcon,
  AlertCircleIcon,
  GitBranchIcon,
  HistoryIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  sincronizarCatalogoExcelAction,
  type ItemSincronizacionCatalogo,
} from "@/actions/catalogo-import"
import { clasificarDocumento } from "@/lib/documentos-jerarquia"
import { obtenerFechaOficialDocumento } from "@/lib/documentos-fechas-map"
import {
  calcularVersionesCatalogo,
  normalizarFamiliaCanonica,
  obtenerCodigoFamiliaCanonica,
} from "@/lib/documentos-versionador"

export interface DocExistente {
  id: string
  titulo: string
  direccion?: string | null
  subcategoria?: string | null
  tipoDocumental?: string | null
  archivo?: string | null
  nombreArchivo?: string | null
  tipoArchivo?: string | null
  tamano?: string | null
  descripcion?: string | null
  createdAt?: string | Date | null
  numeroCorrelativo?: number | null
  version?: string | null
  esVigente?: boolean | null
  familiaCodigo?: string | null
  fechaEmision?: string | null
  disponibilidadArchivo?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  existingDocs: DocExistente[]
  onSuccess: () => void
}

export type TipoCambio = "nuevo" | "modificado" | "sin_cambios"

export interface ItemAnalizado {
  id?: string
  numeroCorrelativo?: number
  titulo: string
  direccionNueva: string
  direccionAnterior?: string
  subcategoriaNueva: string
  subcategoriaAnterior?: string
  tipoDocumentalNuevo: string
  tipoDocumentalAnterior?: string
  fechaOficialNueva?: string
  fechaOficialAnterior?: string
  versionCalculada: string
  esVigenteCalculado: boolean
  familiaCodigo: string
  totalVersionesEnFamilia: number
  descripcionNueva?: string
  descripcionAnterior?: string
  nombreArchivoExcel?: string
  archivoFisicoAsociado?: File
  urlExistente?: string
  estadoCambio: TipoCambio
  disponibilidadArchivo: "disponible" | "falta_archivo"
  motivoDisponibilidad?: string
  diferencias: string[]
  esExistente: boolean
}

function normalizar(val?: string | null): string {
  if (!val) return ""
  return val
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImportarCatalogoDialog({
  open,
  onClose,
  existingDocs,
  onSuccess,
}: Props) {
  const [paso, setPaso] = useState<"carga" | "analisis">("carga")
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [excelSheetName, setExcelSheetName] = useState<string>("")
  const [archivosFisicos, setArchivosFisicos] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressMsg, setProgressMsg] = useState("")

  // Resultados del Análisis
  const [itemsAnalizados, setItemsAnalizados] = useState<ItemAnalizado[]>([])
  const [filtroCambio, setFiltroCambio] = useState<"todos" | "nuevo" | "modificado" | "sin_cambios" | "falta_archivo">("todos")
  const [busquedaPrevia, setBusquedaPrevia] = useState("")

  const excelInputRef = useRef<HTMLInputElement>(null)
  const filesInputRef = useRef<HTMLInputElement>(null)

  function reiniciarEstado() {
    setPaso("carga")
    setExcelFile(null)
    setExcelSheetName("")
    setArchivosFisicos([])
    setItemsAnalizados([])
    setFiltroCambio("todos")
    setBusquedaPrevia("")
    setIsAnalyzing(false)
    setIsSubmitting(false)
    setProgressMsg("")
  }

  function handleClose() {
    reiniciarEstado()
    onClose()
  }

  // ─────────────────────────────────────────────────────────────
  // 1. MANEJO DE ARCHIVOS (EXCEL Y ADJUNTOS FÍSICOS)
  // ─────────────────────────────────────────────────────────────
  function handleExcelSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Por favor selecciona un archivo Excel (.xlsx, .xls) válido")
      return
    }
    setExcelFile(file)
  }

  function handleFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setArchivosFisicos((prev) => {
      const combined = [...prev]
      for (const f of files) {
        if (!combined.some((item) => item.name === f.name && item.size === f.size)) {
          combined.push(f)
        }
      }
      return combined
    })
  }

  function removeArchivoFisico(index: number) {
    setArchivosFisicos((prev) => prev.filter((_, i) => i !== index))
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PARSER ROBUSTO Y MOTOR DE VERSIONAMIENTO Y DIFERENCIAS
  // ─────────────────────────────────────────────────────────────
  async function analizarCatalogo() {
    if (!excelFile) {
      toast.error("Debes cargar una planilla Excel con el catálogo")
      return
    }

    setIsAnalyzing(true)
    setProgressMsg("Leyendo archivo Excel y analizando estructura...")

    try {
      const buffer = await excelFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })

      // 1. Detección Inteligente de la Hoja del Catálogo Real (evita tablas dinámicas como Hoja2)
      let targetSheetName = wb.SheetNames[0]
      let maxScore = -1

      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name]
        if (!sheet) continue
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
        if (!sheetData || sheetData.length === 0) continue

        let score = 0
        const lowerName = name.toLowerCase()
        if (
          lowerName.includes("catalogo") ||
          lowerName.includes("catálogo") ||
          lowerName.includes("documento") ||
          lowerName.includes("normativa") ||
          lowerName.includes("agbc")
        ) {
          score += 60
        }

        // Inspeccionar las primeras 15 filas buscando encabezados clave
        for (let r = 0; r < Math.min(sheetData.length, 15); r++) {
          const rowText = (sheetData[r] || []).map((c) => String(c || "").toLowerCase().trim()).join(" ")
          if (rowText.includes("título") || rowText.includes("titulo")) score += 30
          if (rowText.includes("dirección") || rowText.includes("direccion")) score += 20
          if (rowText.includes("nº") || rowText.includes("n°")) score += 25
          if (rowText.includes("categoría") || rowText.includes("categoria")) score += 15
        }

        // Penalizar hojas de resumen muy pequeñas que sean solo tablas dinámicas
        if (sheetData.length >= 30) score += 40

        if (score > maxScore) {
          maxScore = score
          targetSheetName = name
        }
      }

      const ws = wb.Sheets[targetSheetName]
      setExcelSheetName(targetSheetName)

      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      if (!rawData || rawData.length < 2) {
        toast.error("El archivo Excel parece estar vacío o sin datos suficientes")
        setIsAnalyzing(false)
        return
      }

      // Buscar la fila de encabezados real de la tabla (debe tener al menos 3 columnas pobladas y contener títulos clave)
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(rawData.length, 25); i++) {
        const row = rawData[i] || []
        const rowTexts = row.map((cell) => String(cell || "").toLowerCase().trim())
        const nonEmptyCount = rowTexts.filter((t) => t !== "").length
        if (nonEmptyCount < 3) continue // Saltar banners, títulos institucionales o filas de metadatos

        const rowStr = rowTexts.join(" ")
        const hasTitulo = rowStr.includes("titulo") || rowStr.includes("título") || rowStr.includes("nombre")
        const hasDireccion = rowStr.includes("direccion") || rowStr.includes("dirección")
        const hasNum = rowStr.includes("nº") || rowStr.includes("n°") || rowStr.includes("num")
        const hasCat = rowStr.includes("categoria") || rowStr.includes("categoría") || rowStr.includes("tipo")

        if ((hasTitulo && (hasDireccion || hasNum || hasCat)) || (hasNum && hasDireccion)) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0 // fallback
      }

      const headers = (rawData[headerRowIndex] || []).map((h) => String(h || "").trim().toLowerCase())
      const dataRows = rawData.slice(headerRowIndex + 1)

      const findColIdx = (patterns: string[]) => {
        return headers.findIndex((h) => patterns.some((p) => h.includes(p)))
      }

      const colNum = findColIdx(["nº", "n°", "numero", "número", "num"])
      const colId = findColIdx(["id", "código sistema", "codigo sistema", "codigo"])
      const colTitulo = findColIdx(["título del documento", "titulo del documento", "título", "titulo", "nombre"])
      const colFamilia = findColIdx(["código de familia", "codigo de familia", "código familia", "codigo familia", "familia / código", "norma base", "familia", "norma"])
      const colDireccion = findColIdx(["direccion", "dirección"])
      const colSubcategoria = findColIdx(["sub-área", "sub-area", "subarea", "subcategoria", "subcategoría", "área", "area"])
      const colTipo = findColIdx(["categoría / tipo", "categoria / tipo", "categoria", "categoría", "tipo"])
      const colVersion = findColIdx(["versión", "version"])
      const colVigencia = findColIdx(["estado de vigencia", "vigencia"])
      const colFecha = findColIdx(["fecha de emisión", "fecha de emision", "fecha oficial", "fecha", "año"])
      const colDesc = findColIdx(["descripcion", "descripción", "detalle", "alcance"])
      const colArchivo = findColIdx(["enlace al documento", "enlace al archivo", "enlace", "archivo", "link"])
      const colCheck = findColIdx(["estado de archivo", "disponibilidad", "check"])

      // Pool de documentos existentes para matching ultra-preciso 1-a-1
      // Evita colisiones cuando existen números correlativos idénticos o documentos homónimos
      const availableDocsPool = [...existingDocs]

      // 1. Extraer filas válidas del Excel
      const rawRowsParsed: Array<{
        rawNum?: number
        rawId?: string
        rawTitulo: string
        rawDireccion: string
        rawSub: string
        rawTipo: string
        rawFamilia?: string
        rawVersion?: string
        rawVigencia?: string
        rawFecha: string
        rawDesc: string
        rawArchivo: string
        rawCheck: string
      }> = []

      for (const row of dataRows) {
        if (!row || row.length === 0) continue

        const rowTexts = row.map((cell) => String(cell || "").toLowerCase().trim())
        // Detener procesamiento si se detecta inicio de tabla secundaria (ej. ",NOMBRE,AREA,")
        if (rowTexts.includes("nombre") && (rowTexts.includes("area") || rowTexts.includes("área"))) {
          break
        }

        const rawTitulo = colTitulo !== -1 ? String(row[colTitulo] || "").trim() : ""
        if (!rawTitulo || rawTitulo === "—" || rawTitulo.length < 3) continue

        // Ignorar filas de metadatos de encabezado o tablas de resumen
        const lowerTit = rawTitulo.toLowerCase()
        if (
          lowerTit.startsWith("fecha de generación") ||
          lowerTit.startsWith("fecha de emision") ||
          lowerTit.startsWith("fecha de emisión") ||
          lowerTit.startsWith("total documentos") ||
          lowerTit.startsWith("agencia boliviana") ||
          lowerTit.startsWith("catálogo general") ||
          lowerTit === "nombre" ||
          lowerTit === "etiquetas de fila"
        ) {
          continue
        }

        const rawNumStr = colNum !== -1 ? String(row[colNum] || "").trim() : ""
        const rawNum = rawNumStr ? parseInt(rawNumStr, 10) : undefined

        const rawId = colId !== -1 ? String(row[colId] || "").trim() : undefined
        const rawDireccion = colDireccion !== -1 ? String(row[colDireccion] || "").trim() : ""
        const rawSub = colSubcategoria !== -1 ? String(row[colSubcategoria] || "").trim() : ""
        const rawTipo = colTipo !== -1 ? String(row[colTipo] || "").trim() : ""
        const rawFamiliaVal = colFamilia !== -1 ? String(row[colFamilia] || "").trim() : ""
        const rawFamilia = rawFamiliaVal && rawFamiliaVal !== "—" ? rawFamiliaVal : undefined
        const rawVersion = colVersion !== -1 ? String(row[colVersion] || "").trim() : undefined
        const rawVigencia = colVigencia !== -1 ? String(row[colVigencia] || "").trim() : undefined
        const rawFecha = colFecha !== -1 ? String(row[colFecha] || "").trim() : ""
        const rawDesc = colDesc !== -1 ? String(row[colDesc] || "").trim() : ""
        const rawArchivo = colArchivo !== -1 ? String(row[colArchivo] || "").trim() : ""
        const rawCheck = colCheck !== -1 ? String(row[colCheck] || "").trim() : ""

        rawRowsParsed.push({
          rawNum,
          rawId,
          rawTitulo,
          rawDireccion,
          rawSub,
          rawTipo,
          rawFamilia,
          rawVersion,
          rawVigencia,
          rawFecha,
          rawDesc,
          rawArchivo,
          rawCheck,
        })
      }

      // 2. Pre-calcular versiones automáticas de los documentos analizados respetando códigos de familia
      const versionesPrecalculadas = calcularVersionesCatalogo(
        rawRowsParsed.map((r) => ({
          numeroCorrelativo: r.rawNum,
          titulo: r.rawTitulo,
          fechaEmision: r.rawFecha,
          subcategoriaId: r.rawSub,
          familiaCodigo: r.rawFamilia,
          version: r.rawVersion,
          esVigente: r.rawVigencia ? r.rawVigencia.toLowerCase().includes("vigente") : undefined,
        }))
      )

      const mapVersionesPre = new Map<string, typeof versionesPrecalculadas[0]>()
      for (const vp of versionesPrecalculadas) {
        const k = `${vp.item.numeroCorrelativo || ""}_${normalizar(vp.item.titulo)}`
        mapVersionesPre.set(k, vp)
      }

      // 3. Evaluar cada registro contra la base de datos (Motor Diff)
      const resultadoItems: ItemAnalizado[] = []

      for (const row of rawRowsParsed) {
        const autoClasif = clasificarDocumento(row.rawArchivo, row.rawTitulo)
        const direccionFinal = row.rawDireccion || autoClasif.direccionNombre
        const subcategoriaFinal = row.rawSub || autoClasif.subcategoriaNombre
        const tipoFinal = row.rawTipo || autoClasif.tipoDocumental

        const normT = normalizar(row.rawTitulo)
        const normF = normalizar(row.rawArchivo)
        const famT = obtenerCodigoFamiliaCanonica(row.rawTitulo, row.rawFamilia)
        const yearT = row.rawFecha.match(/\b(20[1-3]\d)\b/)?.[1] || ""

        // Matching jerárquico inteligente 1-a-1 usando el pool de documentos disponibles
        let docExistente: DocExistente | undefined = undefined

        // 1. Número correlativo + Título + Subárea + Versión exacta
        let matchIdx = availableDocsPool.findIndex(
          (d) =>
            d.numeroCorrelativo === row.rawNum &&
            normalizar(d.titulo) === normT &&
            normalizar(d.subcategoria) === normalizar(row.rawSub) &&
            d.version === row.rawVersion
        )

        // 2. Número correlativo + Título + Subárea + Año
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT &&
              normalizar(d.subcategoria) === normalizar(row.rawSub) &&
              (d.fechaEmision || "").includes(yearT)
          )
        }

        // 3. Número correlativo + Título + Subárea
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT &&
              normalizar(d.subcategoria) === normalizar(row.rawSub)
          )
        }

        // 4. Número correlativo + Título + Versión + Año
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT &&
              d.version === row.rawVersion &&
              (d.fechaEmision || "").includes(yearT)
          )
        }

        // 5. Número correlativo + Título + Versión
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT &&
              d.version === row.rawVersion
          )
        }

        // 6. Número correlativo + Título + Año
        if (matchIdx === -1 && yearT) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT &&
              (d.fechaEmision || "").includes(yearT)
          )
        }

        // 7. Número correlativo + Título
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              d.numeroCorrelativo === row.rawNum &&
              normalizar(d.titulo) === normT
          )
        }

        // 8. ID de sistema si viene provisto
        if (matchIdx === -1 && row.rawId) {
          matchIdx = availableDocsPool.findIndex((d) => d.id === row.rawId)
        }

        // 9. Título normalizado + Año
        if (matchIdx === -1 && yearT) {
          matchIdx = availableDocsPool.findIndex(
            (d) =>
              normalizar(d.titulo) === normT &&
              (d.fechaEmision || "").includes(yearT)
          )
        }

        // 10. Título normalizado
        if (matchIdx === -1) {
          matchIdx = availableDocsPool.findIndex((d) => normalizar(d.titulo) === normT)
        }

        // 11. Número correlativo único en pool
        if (matchIdx === -1 && row.rawNum) {
          const byNum = availableDocsPool.filter((d) => d.numeroCorrelativo === row.rawNum)
          if (byNum.length === 1) {
            matchIdx = availableDocsPool.indexOf(byNum[0])
          }
        }

        if (matchIdx !== -1) {
          // Extraer del pool para garantizar que ningún documento sea duplicado o emparejado dos veces
          docExistente = availableDocsPool.splice(matchIdx, 1)[0]
        }

        // Buscar coincidencia en archivos físicos adjuntados en la sección inferior
        const matchedPhysicalFile = archivosFisicos.find((af) => {
          const normAF = normalizar(af.name)
          return (
            (normF && normAF === normF) ||
            normAF.includes(normT.slice(0, 20)) ||
            normT.includes(normAF.replace(/\.[^/.]+$/, "").slice(0, 20)) ||
            (row.rawNum && normAF.includes(`doc_${String(row.rawNum).padStart(3, "0")}`))
          )
        })

        // Versión calculada
        const vKey = `${row.rawNum || ""}_${normT}`
        const vInfo = mapVersionesPre.get(vKey)
        const versionCalculada = row.rawVersion || (docExistente?.version ? docExistente.version : (vInfo ? vInfo.version : "v1.0"))
        const esVigenteCalculado = row.rawVigencia
          ? row.rawVigencia.toLowerCase().includes("vigente")
          : (docExistente?.esVigente !== undefined && docExistente.esVigente !== null ? docExistente.esVigente : (vInfo ? vInfo.esVigente : true))
        const familiaCodigo = row.rawFamilia && row.rawFamilia !== "—"
          ? row.rawFamilia
          : (docExistente?.familiaCodigo ? docExistente.familiaCodigo : (vInfo?.familiaCodigo || obtenerCodigoFamiliaCanonica(row.rawTitulo, docExistente?.familiaCodigo)))
        const totalVersiones = vInfo ? vInfo.totalVersionesEnFamilia : 1

        // Detección de disponibilidad del archivo PDF
        const archivoRegistradoEnDb = Boolean(
          docExistente?.disponibilidadArchivo === "disponible" ||
          (docExistente?.archivo && docExistente.archivo.trim() !== "" && docExistente.archivo !== "—" && docExistente.disponibilidadArchivo !== "falta_archivo")
        )
        const checkReportado = row.rawCheck.toUpperCase().includes("FALTA") || row.rawCheck.toLowerCase().includes("no se encuentra")
        
        let disponibilidadFinal: "disponible" | "falta_archivo" = "disponible"
        let motivoDisp = ""

        if (matchedPhysicalFile) {
          disponibilidadFinal = "disponible"
          motivoDisp = `Archivo físico nuevo adjuntado (${matchedPhysicalFile.name})`
        } else if (checkReportado) {
          disponibilidadFinal = "falta_archivo"
          motivoDisp = "Reportado como FALTA PDF en el catálogo"
        } else if (docExistente?.archivo && archivoRegistradoEnDb) {
          disponibilidadFinal = "disponible"
          motivoDisp = "Archivo digital verificado en sistema"
        } else if (!docExistente && !matchedPhysicalFile) {
          disponibilidadFinal = "falta_archivo"
          motivoDisp = "Documento nuevo sin archivo físico adjuntado"
        } else if (docExistente && !archivoRegistradoEnDb) {
          disponibilidadFinal = "falta_archivo"
          motivoDisp = "Sin archivo digital registrado en el sistema"
        }

        if (!docExistente) {
          // ── NUEVO DOCUMENTO ──
          resultadoItems.push({
            numeroCorrelativo: row.rawNum,
            titulo: row.rawTitulo,
            direccionNueva: direccionFinal,
            subcategoriaNueva: subcategoriaFinal,
            tipoDocumentalNuevo: tipoFinal,
            fechaOficialNueva: row.rawFecha || "Detectada al procesar",
            versionCalculada,
            esVigenteCalculado,
            familiaCodigo,
            totalVersionesEnFamilia: totalVersiones,
            descripcionNueva: row.rawDesc,
            nombreArchivoExcel: row.rawArchivo || matchedPhysicalFile?.name,
            archivoFisicoAsociado: matchedPhysicalFile,
            estadoCambio: "nuevo",
            disponibilidadArchivo: disponibilidadFinal,
            motivoDisponibilidad: motivoDisp,
            diferencias: ["Nuevo documento a registrar en el catálogo oficial"],
            esExistente: false,
          })
        } else {
          // ── DOCUMENTO EXISTENTE: COMPARACIÓN DIFF ──
          const diffs: string[] = []

          const fechaAnt = docExistente.fechaEmision || obtenerFechaOficialDocumento(
            docExistente.archivo,
            docExistente.titulo,
            docExistente.nombreArchivo,
            docExistente.createdAt
          )

          const autoAnt = clasificarDocumento(
            docExistente.archivo || docExistente.nombreArchivo,
            docExistente.titulo
          )
          const dirAnt = docExistente.direccion || autoAnt.direccionNombre
          const subAnt = docExistente.subcategoria || autoAnt.subcategoriaNombre
          const tipoAnt = docExistente.tipoDocumental || autoAnt.tipoDocumental

          if (direccionFinal && normalizar(dirAnt) !== normalizar(direccionFinal)) {
            diffs.push(`Dirección: ${dirAnt} ➔ ${direccionFinal}`)
          }
          if (subcategoriaFinal && normalizar(subAnt) !== normalizar(subcategoriaFinal)) {
            diffs.push(`Subcategoría: ${subAnt} ➔ ${subcategoriaFinal}`)
          }
          if (tipoFinal && normalizar(tipoAnt) !== normalizar(tipoFinal)) {
            diffs.push(`Tipo: ${tipoAnt} ➔ ${tipoFinal}`)
          }
          if (
            row.rawFecha &&
            row.rawFecha !== "—" &&
            row.rawFecha !== "Sin fecha fija" &&
            fechaAnt &&
            fechaAnt !== "—" &&
            fechaAnt !== "Sin fecha fija" &&
            normalizar(row.rawFecha) !== normalizar(fechaAnt)
          ) {
            diffs.push(`Fecha Oficial: ${fechaAnt} ➔ ${row.rawFecha}`)
          }
          const dbVersion = docExistente.version?.trim() || "v1.0"
          if (row.rawVersion && row.rawVersion.trim() !== "" && row.rawVersion !== "—" && dbVersion !== versionCalculada) {
            diffs.push(`Versión: ${dbVersion} ➔ ${versionCalculada}`)
          }

          const dbVigente = docExistente.esVigente !== null && docExistente.esVigente !== undefined ? Boolean(docExistente.esVigente) : true
          if (row.rawVigencia && row.rawVigencia.trim() !== "" && dbVigente !== esVigenteCalculado) {
            diffs.push(`Vigencia: ${dbVigente ? "Vigente" : "Histórico"} ➔ ${esVigenteCalculado ? "Vigente" : "Histórico"}`)
          }

          const dbFamilia = docExistente.familiaCodigo?.trim() || "—"
          const excelFamilia = row.rawFamilia?.trim() || "—"
          if (excelFamilia !== "—" && dbFamilia !== "—" && dbFamilia !== excelFamilia) {
            diffs.push(`Familia: ${dbFamilia} ➔ ${excelFamilia}`)
          }
          if (row.rawDesc && row.rawDesc !== "—" && row.rawDesc !== (docExistente.descripcion || "")) {
            diffs.push(`Descripción actualizada`)
          }
          if (matchedPhysicalFile) {
            diffs.push(`Reemplazo de archivo digital: ${matchedPhysicalFile.name}`)
          }

          const estado: TipoCambio = diffs.length > 0 ? "modificado" : "sin_cambios"

          resultadoItems.push({
            id: docExistente.id,
            numeroCorrelativo: row.rawNum || docExistente.numeroCorrelativo || undefined,
            titulo: row.rawTitulo || docExistente.titulo,
            direccionNueva: direccionFinal,
            direccionAnterior: dirAnt,
            subcategoriaNueva: subcategoriaFinal,
            subcategoriaAnterior: subAnt,
            tipoDocumentalNuevo: tipoFinal,
            tipoDocumentalAnterior: tipoAnt,
            fechaOficialNueva: row.rawFecha || fechaAnt,
            fechaOficialAnterior: fechaAnt,
            versionCalculada,
            esVigenteCalculado,
            familiaCodigo,
            totalVersionesEnFamilia: totalVersiones,
            descripcionNueva: row.rawDesc || docExistente.descripcion || "",
            descripcionAnterior: docExistente.descripcion || "",
            nombreArchivoExcel: row.rawArchivo || docExistente.nombreArchivo || "",
            archivoFisicoAsociado: matchedPhysicalFile,
            urlExistente: docExistente.archivo || undefined,
            estadoCambio: estado,
            disponibilidadArchivo: disponibilidadFinal,
            motivoDisponibilidad: motivoDisp,
            diferencias: diffs,
            esExistente: true,
          })
        }
      }

      setItemsAnalizados(resultadoItems)
      setPaso("analisis")
      toast.success(`Análisis completado: ${resultadoItems.length} registros evaluados`)
    } catch (err: any) {
      console.error("Error analizando Excel:", err)
      toast.error(`Error al procesar Excel: ${err?.message || "Estructura inválida"}`)
    } finally {
      setIsAnalyzing(false)
      setProgressMsg("")
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. APLICAR IMPORTACIÓN / SINCRONIZACIÓN FINAL
  // ─────────────────────────────────────────────────────────────
  async function aplicarSincronizacion() {
    const itemsAplicar = itemsAnalizados.filter((item) => item.estadoCambio !== "sin_cambios")
    const totalSinCambiosCount = itemsAnalizados.filter((i) => i.estadoCambio === "sin_cambios").length
    const totalFaltaArchivoCount = itemsAnalizados.filter((i) => i.disponibilidadArchivo === "falta_archivo").length

    if (itemsAplicar.length === 0) {
      toast("No se detectaron cambios ni documentos nuevos para aplicar. El catálogo ya se encuentra 100% sincronizado.", { icon: "ℹ️" })
      return
    }

    setIsSubmitting(true)
    setProgressMsg("Subiendo archivos físicos asociados...")

    try {
      // 1. Subir archivos físicos seleccionados si los hay
      const uploadedMap = new Map<string, { url: string; nombre: string; tipo: string; tamano: string }>()

      if (archivosFisicos.length > 0) {
        const formData = new FormData()
        for (const file of archivosFisicos) {
          formData.append("archivos", file)
        }

        const resUpload = await fetch("/api/upload/documentos-bulk", {
          method: "POST",
          body: formData,
        })

        if (!resUpload.ok) {
          throw new Error("Error en el servidor al subir los archivos físicos")
        }

        const dataUpload = await resUpload.json()
        if (dataUpload.archivos && Array.isArray(dataUpload.archivos)) {
          for (const up of dataUpload.archivos) {
            uploadedMap.set(normalizar(up.nombre), up)
          }
        }
      }

      // 2. Preparar payload para la Server Action
      setProgressMsg("Sincronizando catálogo y recalculando versiones en base de datos...")

      const payload: ItemSincronizacionCatalogo[] = itemsAplicar.map((item) => {
        let fileUrl = item.urlExistente
        let fileName = item.nombreArchivoExcel
        let fileType = "pdf"
        let fileSize = undefined

        if (item.archivoFisicoAsociado) {
          const up = uploadedMap.get(normalizar(item.archivoFisicoAsociado.name))
          if (up) {
            fileUrl = up.url
            fileName = up.nombre
            fileType = up.tipo
            fileSize = up.tamano
          }
        }

        return {
          id: item.id,
          numeroCorrelativo: item.numeroCorrelativo,
          titulo: item.titulo,
          direccionNombre: item.direccionNueva,
          subcategoriaNombre: item.subcategoriaNueva,
          tipoDocumental: item.tipoDocumentalNuevo,
          version: item.versionCalculada,
          esVigente: item.esVigenteCalculado,
          familiaCodigo: item.familiaCodigo,
          fechaOficial: item.fechaOficialNueva,
          descripcion: item.descripcionNueva,
          archivoUrl: fileUrl,
          nombreArchivo: fileName,
          tipoArchivo: fileType,
          tamano: fileSize,
          disponibilidadArchivo: item.disponibilidadArchivo,
          accion: item.estadoCambio === "nuevo" ? "nuevo" : "actualizado",
          diferencias: item.diferencias,
        }
      })

      const resAction = await sincronizarCatalogoExcelAction(
        payload,
        excelFile?.name || "catalogo_documentos.xlsx",
        totalSinCambiosCount,
        totalFaltaArchivoCount
      )

      if (resAction.success) {
        toast.success(
          `Catálogo sincronizado exitosamente: ${resAction.nuevos} nuevos, ${resAction.actualizados} actualizados, ${resAction.sinCambios} sin cambios`
        )
        onSuccess()
        handleClose()
      } else {
        toast.error(`Sincronizado con observaciones: ${resAction.errores} errores`)
        if (resAction.nuevos > 0 || resAction.actualizados > 0) {
          onSuccess()
        }
      }
    } catch (err: any) {
      console.error("Error al aplicar sincronización:", err)
      toast.error(`Fallo al aplicar importación: ${err?.message || "Error desconocido"}`)
    } finally {
      setIsSubmitting(false)
      setProgressMsg("")
    }
  }

  // Métricas de análisis
  const totalNuevos = useMemo(
    () => itemsAnalizados.filter((i) => i.estadoCambio === "nuevo").length,
    [itemsAnalizados]
  )
  const totalModificados = useMemo(
    () => itemsAnalizados.filter((i) => i.estadoCambio === "modificado").length,
    [itemsAnalizados]
  )
  const totalSinCambios = useMemo(
    () => itemsAnalizados.filter((i) => i.estadoCambio === "sin_cambios").length,
    [itemsAnalizados]
  )
  const totalFaltanArchivo = useMemo(
    () => itemsAnalizados.filter((i) => i.disponibilidadArchivo === "falta_archivo").length,
    [itemsAnalizados]
  )

  // Filtrado de la tabla de análisis
  const itemsFiltrados = useMemo(() => {
    return itemsAnalizados.filter((item) => {
      let matchTipo = true
      if (filtroCambio === "nuevo") matchTipo = item.estadoCambio === "nuevo"
      else if (filtroCambio === "modificado") matchTipo = item.estadoCambio === "modificado"
      else if (filtroCambio === "sin_cambios") matchTipo = item.estadoCambio === "sin_cambios"
      else if (filtroCambio === "falta_archivo") matchTipo = item.disponibilidadArchivo === "falta_archivo"

      const q = busquedaPrevia.toLowerCase().trim()
      const matchBusqueda =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        item.direccionNueva.toLowerCase().includes(q) ||
        item.subcategoriaNueva.toLowerCase().includes(q) ||
        item.tipoDocumentalNuevo.toLowerCase().includes(q) ||
        item.versionCalculada.toLowerCase().includes(q) ||
        (item.fechaOficialNueva && item.fechaOficialNueva.toLowerCase().includes(q))

      return matchTipo && matchBusqueda
    })
  }, [itemsAnalizados, filtroCambio, busquedaPrevia])

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-[#002F6C]/20 rounded-3xl shadow-2xl">
        {/* Header Oficial AGBC */}
        <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] shadow-md ring-2 ring-white/20">
                <FileSpreadsheetIcon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Importar y Sincronizar Catálogo Documental
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-[#FFCC00]">
                    Catálogo Oficial AGBC
                  </span>
                </DialogTitle>
                <p className="text-xs text-blue-100 mt-0.5">
                  Carga una planilla Excel para validar cambios, detectar documentos nuevos, gestionar versiones históricas y verificar archivos digitales.
                </p>
              </div>
            </div>

            {/* Stepper Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-bold">
              <span
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  paso === "carga"
                    ? "bg-[#FFCC00] text-[#002F6C] shadow-xs"
                    : "text-blue-100"
                }`}
              >
                1. Carga de Archivos
              </span>
              <ArrowRightIcon className="h-3 w-3 text-white/50" />
              <span
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  paso === "analisis"
                    ? "bg-[#FFCC00] text-[#002F6C] shadow-xs"
                    : "text-blue-100"
                }`}
              >
                2. Validación & Comparador Diff
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PASO 1: CARGA DE EXCEL Y ARCHIVOS FÍSICOS
           ───────────────────────────────────────────────────────────── */}
        {paso === "carga" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Sección Superior: Archivo Excel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#002F6C] dark:text-blue-300 flex items-center gap-2">
                  <FileSpreadsheetIcon className="h-4 w-4 text-emerald-600" />
                  <span>Planilla Excel del Catálogo Institucional (.xlsx, .xls)</span>
                  <span className="text-red-500">*</span>
                </label>
                {excelFile && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2Icon className="h-3 w-3" />
                    Archivo listo para análisis
                  </span>
                )}
              </div>

              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelSelect}
                className="hidden"
              />

              {!excelFile ? (
                <div
                  onClick={() => excelInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 rounded-3xl p-8 text-center cursor-pointer bg-gradient-to-br from-emerald-50/40 via-white to-blue-50/30 dark:bg-slate-900 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 group-hover:scale-110 transition-transform shadow-xs">
                      <UploadCloudIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Haz clic aquí para seleccionar el archivo Excel del Catálogo
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Formatos soportados: <strong>.xlsx, .xls, .csv</strong> (Plantilla de 89 documentos, con direcciones, sub-áreas, fechas y versiones).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                      <FileSpreadsheetIcon className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                        {excelFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                        {formatBytes(excelFile.size)} • Listo para validación
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => excelInputRef.current?.click()}
                      className="text-xs rounded-xl font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    >
                      Cambiar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setExcelFile(null)}
                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sección Inferior: Carga de Varios Archivos Físicos */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#002F6C] dark:text-blue-300 flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-[#0E5296]" />
                    <span>Archivos Físicos Digitales (PDF, Word, Excel, etc.)</span>
                    <span className="text-xs text-slate-400 font-normal normal-case">(Opcional / Carga simultánea)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sube los documentos físicos faltantes o actualizados. El sistema los asociará automáticamente por nombre de archivo o título oficial.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => filesInputRef.current?.click()}
                  className="rounded-xl text-xs font-bold gap-1.5 border-[#0E5296]/30 text-[#002F6C] hover:bg-blue-50"
                >
                  <UploadCloudIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                  <span>Seleccionar Archivos</span>
                </Button>
              </div>

              <input
                ref={filesInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                onChange={handleFilesSelect}
                className="hidden"
              />

              {archivosFisicos.length === 0 ? (
                <div
                  onClick={() => filesInputRef.current?.click()}
                  className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-white dark:bg-slate-900 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    ¿Deseas adjuntar archivos PDF o documentos digitales nuevos?
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Puedes arrastrar o seleccionar varios archivos simultáneamente aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                    <span>{archivosFisicos.length} archivo(s) físico(s) listo(s) para asociar:</span>
                    <button
                      type="button"
                      onClick={() => setArchivosFisicos([])}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Limpiar lista
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {archivosFisicos.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon className="h-4 w-4 text-[#0E5296] shrink-0" />
                          <span className="truncate font-medium">{f.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArchivoFisico(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PASO 2: RESULTADOS DEL ANÁLISIS (DASHBOARD PREVIEW Y DIFF)
           ───────────────────────────────────────────────────────────── */}
        {paso === "analisis" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Banner Alerta si Faltan Archivos PDF */}
            {totalFaltanArchivo > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
                <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-black text-sm">
                    Atención: Se detectaron {totalFaltanArchivo} documentos sin archivo digital PDF
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Estos documentos están registrados en el Excel pero no cuentan con archivo físico en el servidor. Puedes importarlos con la marca <strong>FALTA PDF</strong> para completar sus metadatos y asociar el archivo posteriormente.
                  </p>
                </div>
              </div>
            )}

            {/* Tarjetas KPI de Estado */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                onClick={() => setFiltroCambio("todos")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  filtroCambio === "todos"
                    ? "border-[#002F6C] bg-blue-50/70 shadow-xs ring-2 ring-[#002F6C]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Evaluados</p>
                <p className="text-xl font-black text-[#002F6C] mt-0.5">{itemsAnalizados.length}</p>
                <p className="text-[10px] text-slate-400">Total en planilla</p>
              </div>

              <div
                onClick={() => setFiltroCambio("nuevo")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  filtroCambio === "nuevo"
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-2 ring-emerald-600/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Nuevos</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{totalNuevos}</p>
                <p className="text-[10px] text-emerald-600/70">A incorporar</p>
              </div>

              <div
                onClick={() => setFiltroCambio("modificado")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  filtroCambio === "modificado"
                    ? "border-blue-600 bg-blue-50 shadow-xs ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Modificados</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">{totalModificados}</p>
                <p className="text-[10px] text-blue-600/70">Con cambios detectados</p>
              </div>

              <div
                onClick={() => setFiltroCambio("sin_cambios")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  filtroCambio === "sin_cambios"
                    ? "border-slate-600 bg-slate-100 shadow-xs ring-2 ring-slate-600/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sin Cambios</p>
                <p className="text-xl font-black text-slate-700 mt-0.5">{totalSinCambios}</p>
                <p className="text-[10px] text-slate-400">Idénticos en BD</p>
              </div>

              <div
                onClick={() => setFiltroCambio("falta_archivo")}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  filtroCambio === "falta_archivo"
                    ? "border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Falta PDF</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">{totalFaltanArchivo}</p>
                <p className="text-[10px] text-amber-600/70">Sin archivo digital</p>
              </div>
            </div>

            {/* Barra de Filtros y Buscador Rápido */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  value={busquedaPrevia}
                  onChange={(e) => setBusquedaPrevia(e.target.value)}
                  placeholder="Filtrar por título, dirección, versión o fecha..."
                  className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Mostrando <strong>{itemsFiltrados.length}</strong> de {itemsAnalizados.length} documentos
              </p>
            </div>

            {/* Lista Interactiva de Documentos Analizados */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {itemsFiltrados.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                  No se encontraron documentos bajo el filtro seleccionado
                </div>
              ) : (
                itemsFiltrados.map((item, idx) => {
                  const esNuevo = item.estadoCambio === "nuevo"
                  const esModificado = item.estadoCambio === "modificado"
                  const esFaltaPdf = item.disponibilidadArchivo === "falta_archivo"

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        esNuevo
                          ? "bg-emerald-50/40 border-emerald-300 dark:border-emerald-800"
                          : esModificado
                          ? "bg-blue-50/40 border-blue-300 dark:border-blue-800"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Badges de Estado y Versión */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.numeroCorrelativo && (
                              <span className="text-[10px] font-black bg-[#002F6C] text-[#FFCC00] px-2 py-0.5 rounded-md">
                                Nº {item.numeroCorrelativo}
                              </span>
                            )}

                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                esNuevo
                                  ? "bg-emerald-600 text-white"
                                  : esModificado
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {esNuevo ? "NUEVO" : esModificado ? "MODIFICADO" : "SIN CAMBIOS"}
                            </span>

                            {/* Badge Versión */}
                            <span className="text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <GitBranchIcon className="h-2.5 w-2.5" />
                              {item.versionCalculada}
                            </span>

                            {/* Badge Vigencia */}
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                item.esVigenteCalculado
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {item.esVigenteCalculado ? "Vigente" : "Histórico"}
                            </span>

                            {/* Badge Disponibilidad PDF */}
                            {esFaltaPdf ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangleIcon className="h-2.5 w-2.5" />
                                FALTA PDF
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckIcon className="h-2.5 w-2.5" />
                                Archivo Digital OK
                              </span>
                            )}

                            {item.totalVersionesEnFamilia > 1 && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Familia: {item.totalVersionesEnFamilia} versiones
                              </span>
                            )}
                          </div>

                          {/* Título Oficial */}
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {item.titulo}
                          </h4>

                          {/* Jerarquía y Fecha */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2Icon className="h-3 w-3 text-slate-400" />
                              {item.direccionNueva}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FolderIcon className="h-3 w-3 text-slate-400" />
                              {item.subcategoriaNueva}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.tipoDocumentalNuevo}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3 text-slate-400" />
                              {item.fechaOficialNueva || "Sin fecha fija"}
                            </span>
                          </div>

                          {/* Desglose de Diferencias (Diffs) */}
                          {item.diferencias.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap gap-1.5">
                              {item.diferencias.map((d, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-blue-900 dark:text-blue-300"
                                >
                                  • {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Footer con Acciones */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            {paso === "analisis" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPaso("carga")}
                disabled={isSubmitting}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
              >
                ← Volver a Carga
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting || isAnalyzing}
              className="rounded-xl font-bold text-xs"
            >
              Cancelar
            </Button>

            {paso === "carga" ? (
              <Button
                type="button"
                size="sm"
                disabled={!excelFile || isAnalyzing}
                onClick={analizarCatalogo}
                className="bg-[#002F6C] hover:bg-[#0E5296] text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-sm px-4"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin text-[#FFCC00]" />
                    <span>{progressMsg || "Analizando..."}</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 text-[#FFCC00]" />
                    <span>Analizar Planilla y Validar</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting || totalNuevos + totalModificados === 0}
                onClick={aplicarSincronizacion}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-sm px-5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin text-[#FFCC00]" />
                    <span>{progressMsg || "Aplicando..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="h-4 w-4 text-[#FFCC00]" />
                    <span>
                      {totalNuevos + totalModificados === 0
                        ? "Catálogo Sincronizado (0 cambios)"
                        : `Confirmar e Importar (${totalNuevos} nuevos, ${totalModificados} modificados)`}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
