"use client"

import { useState, useRef, useTransition, useMemo } from "react"
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
import { clasificarDocumento, ESTRUCTURA_JERARQUICA } from "@/lib/documentos-jerarquia"
import { obtenerFechaOficialDocumento } from "@/lib/documentos-fechas-map"

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
  titulo: string
  direccionNueva: string
  direccionAnterior?: string
  subcategoriaNueva: string
  subcategoriaAnterior?: string
  tipoDocumentalNuevo: string
  tipoDocumentalAnterior?: string
  fechaOficialNueva?: string
  fechaOficialAnterior?: string
  descripcionNueva?: string
  descripcionAnterior?: string
  nombreArchivoExcel?: string
  archivoFisicoAsociado?: File
  urlExistente?: string
  estadoCambio: TipoCambio
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
  const [filtroCambio, setFiltroCambio] = useState<"todos" | "nuevo" | "modificado" | "sin_cambios">("todos")
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
  // 1. MANEJO DE ARCHIVOS EXCEL Y ARCHIVOS FÍSICOS
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
  // 2. PARSER Y MOTOR DE DIFERENCIAS (ANÁLISIS DE EXCEL)
  // ─────────────────────────────────────────────────────────────
  async function analizarCatalogo() {
    if (!excelFile) {
      toast.error("Debes cargar una planilla Excel con el catálogo")
      return
    }

    setIsAnalyzing(true)
    setProgressMsg("Leyendo archivo Excel...")

    try {
      const buffer = await excelFile.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const firstSheetName = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheetName]
      setExcelSheetName(firstSheetName)

      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
      if (!rawData || rawData.length < 2) {
        toast.error("El archivo Excel parece estar vacío o sin datos suficientes")
        setIsAnalyzing(false)
        return
      }

      // Buscar la fila de encabezados
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(rawData.length, 12); i++) {
        const row = rawData[i] || []
        const rowStr = row.map((cell) => String(cell || "").toLowerCase()).join(" ")
        if (
          rowStr.includes("titulo") ||
          rowStr.includes("documento") ||
          rowStr.includes("nombre") ||
          rowStr.includes("direccion") ||
          rowStr.includes("categoria")
        ) {
          headerRowIndex = i
          break
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 0 // fallback
      }

      const headers = (rawData[headerRowIndex] || []).map((h) => String(h || "").trim().toLowerCase())
      const dataRows = rawData.slice(headerRowIndex + 1)

      // Identificar índices de columnas
      const findColIdx = (patterns: string[]) => {
        return headers.findIndex((h) => patterns.some((p) => h.includes(p)))
      }

      const colTitulo = findColIdx(["titulo", "documento", "nombre del doc"])
      const colDireccion = findColIdx(["direccion", "dirección"])
      const colSubcategoria = findColIdx(["sub-area", "subarea", "subcategoria", "subcategoría", "area", "área"])
      const colTipo = findColIdx(["categoria", "categoría", "tipo", "tipo doc"])
      const colFecha = findColIdx(["fecha", "emision", "emisión", "oficial", "año"])
      const colDesc = findColIdx(["descripcion", "descripción", "detalle", "alcance"])
      const colArchivo = findColIdx(["archivo", "nombre de archivo", "fichero", "file"])
      const colId = findColIdx(["id", "codigo", "código", "nº", "n°"])

      // Map existing documents for matching
      const existingByNormTitle = new Map<string, DocExistente>()
      const existingByNormFile = new Map<string, DocExistente>()
      const existingById = new Map<string, DocExistente>()

      for (const d of existingDocs) {
        if (d.id) existingById.set(d.id.trim(), d)
        if (d.titulo) existingByNormTitle.set(normalizar(d.titulo), d)
        if (d.nombreArchivo) existingByNormFile.set(normalizar(d.nombreArchivo), d)
        if (d.archivo) existingByNormFile.set(normalizar(d.archivo), d)
      }

      const resultadoItems: ItemAnalizado[] = []

      for (const row of dataRows) {
        if (!row || row.length === 0) continue

        // Extraer campos
        const rawTitulo = colTitulo !== -1 ? String(row[colTitulo] || "").trim() : ""
        if (!rawTitulo || rawTitulo === "—" || rawTitulo.length < 3) continue

        const rawDireccion = colDireccion !== -1 ? String(row[colDireccion] || "").trim() : ""
        const rawSub = colSubcategoria !== -1 ? String(row[colSubcategoria] || "").trim() : ""
        const rawTipo = colTipo !== -1 ? String(row[colTipo] || "").trim() : ""
        const rawFecha = colFecha !== -1 ? String(row[colFecha] || "").trim() : ""
        const rawDesc = colDesc !== -1 ? String(row[colDesc] || "").trim() : ""
        const rawArchivo = colArchivo !== -1 ? String(row[colArchivo] || "").trim() : ""
        const rawId = colId !== -1 ? String(row[colId] || "").trim() : ""

        // Clasificación por defecto o inferida si viene vacía
        const autoClasif = clasificarDocumento(rawArchivo, rawTitulo)
        const direccionFinal = rawDireccion || autoClasif.direccionNombre
        const subcategoriaFinal = rawSub || autoClasif.subcategoriaNombre
        const tipoFinal = rawTipo || autoClasif.tipoDocumental

        // Buscar coincidencia en documentos existentes
        const normT = normalizar(rawTitulo)
        const normF = normalizar(rawArchivo)
        
        const docExistente =
          (rawId && existingById.get(rawId)) ||
          (normF && existingByNormFile.get(normF)) ||
          (normT && existingByNormTitle.get(normT))

        // Buscar si hay archivo físico cargado para este documento
        const matchedPhysicalFile = archivosFisicos.find((af) => {
          const normAF = normalizar(af.name)
          return (
            (normF && normAF === normF) ||
            normAF.includes(normT.slice(0, 20)) ||
            normT.includes(normAF.replace(/\.[^/.]+$/, "").slice(0, 20))
          )
        })

        if (!docExistente) {
          // ── NUEVO DOCUMENTO ──
          resultadoItems.push({
            titulo: rawTitulo,
            direccionNueva: direccionFinal,
            subcategoriaNueva: subcategoriaFinal,
            tipoDocumentalNuevo: tipoFinal,
            fechaOficialNueva: rawFecha || "Detectada al procesar",
            descripcionNueva: rawDesc,
            nombreArchivoExcel: rawArchivo || matchedPhysicalFile?.name,
            archivoFisicoAsociado: matchedPhysicalFile,
            estadoCambio: "nuevo",
            diferencias: ["Nuevo documento a registrar"],
            esExistente: false,
          })
        } else {
          // ── DOCUMENTO EXISTENTE: VERIFICAR CAMBIOS ──
          const diffs: string[] = []

          // Fecha oficial anterior
          const fechaAnt = obtenerFechaOficialDocumento(
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
          if (rawFecha && rawFecha !== "—" && rawFecha !== "Sin fecha fija" && rawFecha !== fechaAnt) {
            diffs.push(`Fecha Oficial: ${fechaAnt} ➔ ${rawFecha}`)
          }
          if (rawDesc && rawDesc !== "—" && rawDesc !== (docExistente.descripcion || "")) {
            diffs.push(`Descripción actualizada`)
          }
          if (matchedPhysicalFile) {
            diffs.push(`Reemplazo de archivo: ${matchedPhysicalFile.name}`)
          }

          const estado: TipoCambio = diffs.length > 0 ? "modificado" : "sin_cambios"

          resultadoItems.push({
            id: docExistente.id,
            titulo: rawTitulo || docExistente.titulo,
            direccionNueva: direccionFinal,
            direccionAnterior: dirAnt,
            subcategoriaNueva: subcategoriaFinal,
            subcategoriaAnterior: subAnt,
            tipoDocumentalNuevo: tipoFinal,
            tipoDocumentalAnterior: tipoAnt,
            fechaOficialNueva: rawFecha || fechaAnt,
            fechaOficialAnterior: fechaAnt,
            descripcionNueva: rawDesc || docExistente.descripcion || "",
            descripcionAnterior: docExistente.descripcion || "",
            nombreArchivoExcel: rawArchivo || docExistente.nombreArchivo || "",
            archivoFisicoAsociado: matchedPhysicalFile,
            urlExistente: docExistente.archivo || undefined,
            estadoCambio: estado,
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
    if (itemsAplicar.length === 0) {
      toast("No se detectaron cambios ni documentos nuevos para aplicar", { icon: "ℹ️" })
      return
    }

    setIsSubmitting(true)
    setProgressMsg("Subiendo archivos físicos...")

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
      setProgressMsg("Sincronizando catálogo en base de datos...")

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
          titulo: item.titulo,
          direccionNombre: item.direccionNueva,
          subcategoriaNombre: item.subcategoriaNueva,
          tipoDocumental: item.tipoDocumentalNuevo,
          fechaOficial: item.fechaOficialNueva,
          descripcion: item.descripcionNueva,
          archivoUrl: fileUrl,
          nombreArchivo: fileName,
          tipoArchivo: fileType,
          tamano: fileSize,
          accion: item.estadoCambio === "nuevo" ? "nuevo" : "actualizado",
        }
      })

      const resAction = await sincronizarCatalogoExcelAction(payload)

      if (resAction.success) {
        toast.success(
          `Catálogo sincronizado: ${resAction.nuevos} nuevos, ${resAction.actualizados} actualizados`
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

  // Filtrado de la tabla de análisis
  const itemsFiltrados = useMemo(() => {
    return itemsAnalizados.filter((item) => {
      const matchTipo =
        filtroCambio === "todos" || item.estadoCambio === filtroCambio
      const search = busquedaPrevia.toLowerCase().trim()
      const matchSearch =
        !search ||
        item.titulo.toLowerCase().includes(search) ||
        item.direccionNueva.toLowerCase().includes(search) ||
        item.subcategoriaNueva.toLowerCase().includes(search) ||
        item.tipoDocumentalNuevo.toLowerCase().includes(search)
      return matchTipo && matchSearch
    })
  }, [itemsAnalizados, filtroCambio, busquedaPrevia])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 rounded-3xl border-border/50 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Importar Catálogo de Documentos</DialogTitle>
        </DialogHeader>

        {/* ── Cabecera Temática AGBC ── */}
        <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black shadow-md">
              <UploadCloudIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Importar y Sincronizar Catálogo
                </h3>
                <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[9px] font-black uppercase">
                  AGBC
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Carga la planilla Excel y archivos adjuntos para validar altas y actualizaciones
              </p>
            </div>
          </div>

          {/* Stepper Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white border border-white/20">
            <span className={paso === "carga" ? "text-[#FFCC00]" : "text-emerald-300 flex items-center gap-1"}>
              {paso === "analisis" && <CheckIcon className="h-3.5 w-3.5" />} 1. Carga
            </span>
            <ArrowRightIcon className="h-3 w-3 text-white/40" />
            <span className={paso === "analisis" ? "text-[#FFCC00]" : "text-white/60"}>
              2. Previsualización y Validación
            </span>
          </div>
        </div>

        {/* ── Contenido Principal Scrollable ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {paso === "carga" ? (
            <div className="space-y-6">
              {/* ══════════════════════════════════════════════════════════ */}
              {/* SECCIÓN 1 (ARRIBA): SUBIR PLANILLA EXCEL DEL CATÁLOGO    */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="rounded-2xl border-2 border-dashed border-[#0E5296]/30 bg-gradient-to-br from-blue-50/50 via-sky-50/20 to-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0E5296] text-[#FFCC00] text-xs font-black">
                      1
                    </span>
                    <h4 className="text-sm font-black text-[#002F6C]">
                      Planilla Excel del Catálogo Documental
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Formatos soportados: .xlsx, .xls, .csv
                  </span>
                </div>

                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelSelect}
                  className="hidden"
                />

                {!excelFile ? (
                  <div
                    onClick={() => excelInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-blue-50/60 hover:border-[#0E5296] transition-all cursor-pointer group"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                      <FileSpreadsheetIcon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296]">
                      Haz clic para seleccionar el archivo Excel del Catálogo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      El sistema comparará automáticamente títulos, fechas y jerarquías con la base de datos
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-white border border-emerald-300 rounded-xl shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <FileSpreadsheetIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#002F6C]">{excelFile.name}</p>
                        <p className="text-[11px] text-slate-500">{formatBytes(excelFile.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => excelInputRef.current?.click()}
                        className="h-8 rounded-lg text-xs font-bold text-slate-600 hover:text-[#002F6C]"
                      >
                        Cambiar Excel
                      </Button>
                      <button
                        type="button"
                        onClick={() => setExcelFile(null)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* SECCIÓN 2 (ABAJO): SUBIR VARIOS ARCHIVOS ADJUNTOS         */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="rounded-2xl border-2 border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-yellow-50/20 to-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFCC00] text-[#002F6C] text-xs font-black">
                      2
                    </span>
                    <h4 className="text-sm font-black text-[#002F6C]">
                      Archivos Físicos Adjuntos (Varios documentos: PDF, Word, Excel, etc.)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {archivosFisicos.length} archivo(s) seleccionado(s)
                  </span>
                </div>

                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                  onChange={handleFilesSelect}
                  className="hidden"
                />

                <div
                  onClick={() => filesInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-amber-50/60 hover:border-amber-400 transition-all cursor-pointer group mb-3"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                    <LayersIcon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-black text-[#002F6C] group-hover:text-amber-700">
                    Haz clic para seleccionar múltiples archivos digitales
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, DOC, DOCX, XLS, XLSX correspondientes a los documentos del catálogo
                  </p>
                </div>

                {archivosFisicos.length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-2xs">
                    {archivosFisicos.map((af, idx) => (
                      <div key={`${af.name}_${idx}`} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileTextIcon className="h-4 w-4 text-[#0E5296] shrink-0" />
                          <span className="font-bold text-[#002F6C] truncate max-w-sm">{af.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({formatBytes(af.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArchivoFisico(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Banner informativo de validación */}
              <div className="flex items-start gap-3 rounded-2xl bg-blue-50/80 border border-blue-200 p-4 text-xs text-[#002F6C]">
                <InfoIcon className="h-5 w-5 text-[#0E5296] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">¿Cómo funciona la sincronización inteligente?</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Al hacer clic en <strong>Analizar y Validar</strong>, el sistema comparará cada fila del Excel con los documentos existentes. Detectará cuáles son <strong>documentos nuevos</strong> para crearlos en su jerarquía, cuáles sufrieron <strong>cambios en Dirección, Subcategoría, Fecha o Título</strong> para actualizarlos, y cuáles no han cambiado para dejarlos intactos. Podrás revisar todos los cambios antes de confirmar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════ */
            /* PASO 2: PREVISUALIZACIÓN Y REVISIÓN DE CAMBIOS (DIFF)     */
            /* ══════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              {/* KPIs de Cambios Detectados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Nuevos a Registrar
                  </span>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    +{totalNuevos}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Se crearán en la base de datos</span>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Con Cambios Detectados
                  </span>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">
                    {totalModificados}
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium">Se actualizarán fechas o jerarquías</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Sin Modificaciones
                  </span>
                  <div className="text-2xl font-black text-slate-700 mt-0.5">
                    {totalSinCambios}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Permanecen idénticos</span>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                    Archivos Físicos Listos
                  </span>
                  <div className="text-2xl font-black text-[#0E5296] mt-0.5">
                    {archivosFisicos.length}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Listos para vincular</span>
                </div>
              </div>

              {/* Filtros de Tabla Previa */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {(
                    [
                      { key: "todos", label: `Todos (${itemsAnalizados.length})` },
                      { key: "nuevo", label: `Nuevos (${totalNuevos})` },
                      { key: "modificado", label: `Con Cambios (${totalModificados})` },
                      { key: "sin_cambios", label: `Sin Cambios (${totalSinCambios})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFiltroCambio(f.key)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        filtroCambio === f.key
                          ? "bg-white text-[#002F6C] shadow-xs font-black"
                          : "text-slate-600 hover:text-[#002F6C]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Filtrar por título o dirección..."
                    value={busquedaPrevia}
                    onChange={(e) => setBusquedaPrevia(e.target.value)}
                    className="h-8 pl-8 text-xs bg-slate-50 rounded-xl"
                  />
                </div>
              </div>

              {/* Tabla de Diferencias y Validación */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[10px] uppercase font-black text-[#002F6C]">
                    <tr>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Documento</th>
                      <th className="py-2.5 px-3">Jerarquía Asignada</th>
                      <th className="py-2.5 px-3">Fecha Oficial</th>
                      <th className="py-2.5 px-3">Diferencias / Cambios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No hay elementos para mostrar con este filtro.
                        </td>
                      </tr>
                    ) : (
                      itemsFiltrados.map((item, idx) => (
                        <tr
                          key={`${item.titulo}_${idx}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.estadoCambio === "nuevo"
                              ? "bg-emerald-50/20"
                              : item.estadoCambio === "modificado"
                              ? "bg-amber-50/20"
                              : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.estadoCambio === "nuevo" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <SparklesIcon className="h-3 w-3" /> Nuevo
                              </span>
                            )}
                            {item.estadoCambio === "modificado" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                <RefreshCwIcon className="h-3 w-3" /> Con Cambios
                              </span>
                            )}
                            {item.estadoCambio === "sin_cambios" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Sin Cambios
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px]">
                            <p className="font-bold text-[#002F6C] truncate">{item.titulo}</p>
                            {item.nombreArchivoExcel && (
                              <p className="text-[10px] text-slate-400 font-mono truncate">
                                {item.nombreArchivoExcel}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="space-y-0.5 text-[11px]">
                              <p className="font-bold text-[#0E5296]">{item.direccionNueva}</p>
                              <p className="text-slate-600">{item.subcategoriaNueva} • {item.tipoDocumentalNuevo}</p>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-medium text-slate-700">
                            {item.fechaOficialNueva || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.diferencias.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Sin modificaciones</span>
                            ) : (
                              <div className="space-y-1">
                                {item.diferencias.map((diff, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="block text-[10.5px] font-semibold text-amber-800 bg-amber-50 rounded-md px-1.5 py-0.5 border border-amber-200/80 w-fit"
                                  >
                                    {diff}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Barra Inferior de Acciones ── */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex items-center justify-between">
          <div>
            {progressMsg && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#0E5296]">
                <Loader2Icon className="h-4 w-4 animate-spin text-[#0E5296]" />
                <span>{progressMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isAnalyzing || isSubmitting}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>

            {paso === "carga" ? (
              <Button
                type="button"
                onClick={analizarCatalogo}
                disabled={!excelFile || isAnalyzing}
                className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs gap-1.5 shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin text-[#FFCC00]" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 text-[#FFCC00]" />
                    Analizar y Validar Catálogo
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaso("carga")}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Volver a Carga
                </Button>
                <Button
                  type="button"
                  onClick={aplicarSincronizacion}
                  disabled={isSubmitting || (totalNuevos === 0 && totalModificados === 0)}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin text-[#FFCC00]" />
                      Aplicando Sincronización...
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon className="h-4 w-4 text-[#FFCC00]" />
                      Confirmar y Sincronizar ({totalNuevos + totalModificados} cambios)
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

