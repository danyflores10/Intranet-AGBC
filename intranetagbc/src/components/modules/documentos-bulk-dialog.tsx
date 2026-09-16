"use client"

import { useState, useRef, useTransition, useMemo } from "react"
import {
  UploadIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  AlertTriangleIcon,
  Loader2Icon,
  Trash2Icon,
  RefreshCwIcon,
  FolderIcon,
  LayersIcon,
  SparklesIcon,
  CheckIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATEGORIAS_VALIDAS,
  detectarCategoria,
  generarTituloCorto,
  obtenerNombreSinExtension,
  type CategoriaValida,
} from "@/lib/documentos/clasificador"
import {
  importarDocumentosLote,
  type DocumentoImportItem,
  type ResultadoImportacionDocumentos,
} from "@/actions/documentos"

interface DocRowExisting {
  id: string
  titulo: string
  categoria: string | null
  categoriaId: string | null
  nombreArchivo: string | null
  descripcion: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  existingDocs: DocRowExisting[]
  categorias: Array<{ id: string; nombre: string }>
  onSuccess: () => void
}

interface FileItemState {
  id: string
  file: File
  nombreOriginal: string
  tamanoFormateado: string
  tipoExt: string
  titulo: string
  categoriaNombre: string | null
  descripcion: string
  estado: string
  esExistente: boolean
  docExistenteId?: string
  resultado?: "nuevo" | "actualizado" | "existente" | "error"
  errorMsg?: string
}

function getFileIcon(ext: string) {
  const t = ext.toLowerCase()
  if (t.includes("pdf")) return FileTextIcon
  if (t.includes("xls") || t.includes("csv") || t.includes("sheet")) return FileSpreadsheetIcon
  if (t.includes("doc") || t.includes("word")) return FileTextIcon
  return FileIcon
}

function getFileBadgeColor(ext: string) {
  const t = ext.toLowerCase()
  if (t.includes("pdf")) return "bg-red-50 text-red-700 border-red-200"
  if (t.includes("doc")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (t.includes("xls") || t.includes("csv")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function normalizar(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s]+/g, " ")
    .trim()
}

export function DocumentosBulkDialog({
  open,
  onClose,
  existingDocs,
  categorias,
  onSuccess,
}: Props) {
  const [fileItems, setFileItems] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [actualizarExistentes, setActualizarExistentes] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    currentFileName: string
    percent: number
  } | null>(null)
  const [importResult, setImportResult] = useState<ResultadoImportacionDocumentos | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Map of category names to DB IDs
  const catNameToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categorias) {
      map.set(normalizar(c.nombre), c.id)
    }
    return map
  }, [categorias])

  // Process newly selected files
  const processFiles = (files: FileList | File[]) => {
    const newItems: FileItemState[] = []

    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      const isAllowed = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "jpg", "png"].includes(ext)
      if (!isAllowed) {
        toast.error(`El archivo "${file.name}" no tiene un formato permitido (PDF, Word, Excel).`)
        return
      }

      const nombreSinExt = obtenerNombreSinExtension(file.name)
      const tituloGen = generarTituloCorto(file.name)
      const catDetectada = detectarCategoria(file.name)

      // Duplicate detection against existing DB records
      const normFile = normalizar(file.name)
      const normSinExt = normalizar(nombreSinExt)
      const normTitle = normalizar(tituloGen)

      const docExistente = existingDocs.find((d) => {
        const dFile = d.nombreArchivo ? normalizar(d.nombreArchivo) : ""
        const dDesc = d.descripcion ? normalizar(d.descripcion) : ""
        const dTit = d.titulo ? normalizar(d.titulo) : ""
        return (
          (dFile && (dFile === normFile || dFile === normSinExt)) ||
          (dDesc && (dDesc === normSinExt || dDesc === normFile)) ||
          (dTit && dTit === normTitle)
        )
      })

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        nombreOriginal: file.name,
        tamanoFormateado: formatBytes(file.size),
        tipoExt: ext,
        titulo: tituloGen,
        categoriaNombre: catDetectada,
        descripcion: nombreSinExt,
        estado: "publicado",
        esExistente: !!docExistente,
        docExistenteId: docExistente?.id,
      })
    })

    if (newItems.length > 0) {
      setFileItems((prev) => [...prev, ...newItems])
      setImportResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = ""
    }
  }

  const handleRemoveItem = (id: string) => {
    setFileItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof FileItemState, value: any) => {
    setFileItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleReset = () => {
    setFileItems([])
    setImportResult(null)
    setIsUploading(false)
    setUploadProgress(null)
  }

  // Execute bulk upload & import
  const handleExecuteImport = async () => {
    if (fileItems.length === 0) {
      toast.error("Seleccione al menos un documento para importar.")
      return
    }

    // Check if any items have unselected categories
    const sinCategoria = fileItems.filter((it) => !it.categoriaNombre)
    if (sinCategoria.length > 0) {
      toast.error(`Hay ${sinCategoria.length} documento(s) marcados como "Revisar". Seleccione su categoría antes de guardar.`)
      return
    }

    setIsUploading(true)
    const itemsToImport: DocumentoImportItem[] = []
    const uploadErrors: Array<{ archivo: string; titulo: string; estado: "error"; mensaje: string }> = []

    try {
      // Subir cada archivo de forma individual y segura para evitar límites de payload o respuestas HTML no válidas
      for (let i = 0; i < fileItems.length; i++) {
        const item = fileItems[i]
        setUploadProgress({
          current: i + 1,
          total: fileItems.length,
          currentFileName: item.nombreOriginal,
          percent: Math.round(((i + 1) / fileItems.length) * 100),
        })

        try {
          const fd = new FormData()
          fd.append("archivo", item.file)

          const res = await fetch("/api/upload/documento", {
            method: "POST",
            body: fd,
          })

          const resText = await res.text()
          let data: any
          try {
            data = JSON.parse(resText)
          } catch {
            throw new Error(`Respuesta no válida del servidor (${res.status}) al subir ${item.nombreOriginal}`)
          }

          if (!res.ok || !data.url) {
            throw new Error(data.error || `Error al procesar ${item.nombreOriginal}`)
          }

          const catId = item.categoriaNombre ? catNameToId.get(normalizar(item.categoriaNombre)) : undefined

          itemsToImport.push({
            id: item.docExistenteId,
            titulo: item.titulo.trim() || item.nombreOriginal,
            categoriaNombre: item.categoriaNombre,
            categoriaId: catId,
            descripcion: item.descripcion.trim() || item.nombreOriginal,
            estado: item.estado || "publicado",
            archivo: data.url,
            nombreArchivo: item.nombreOriginal,
            tipoArchivo: data.tipo || item.tipoExt,
            tamano: data.tamano || item.tamanoFormateado,
            esActualizacion: actualizarExistentes && item.esExistente,
          })
        } catch (err: any) {
          console.error(`Error subiendo archivo ${item.nombreOriginal}:`, err)
          uploadErrors.push({
            archivo: item.nombreOriginal,
            titulo: item.titulo,
            estado: "error",
            mensaje: err?.message || "Error al subir archivo",
          })
        }
      }

      if (itemsToImport.length > 0) {
        startTransition(async () => {
          try {
            const dbResult = await importarDocumentosLote(itemsToImport)
            const finalResult: ResultadoImportacionDocumentos = {
              nuevos: dbResult.nuevos,
              existentes: dbResult.existentes,
              actualizados: dbResult.actualizados,
              errores: dbResult.errores + uploadErrors.length,
              detalles: [...dbResult.detalles, ...uploadErrors],
            }
            setImportResult(finalResult)
            toast.success("Proceso de importación completado.")
            onSuccess()
          } catch (err: any) {
            toast.error(err?.message || "Error al registrar documentos en la base de datos.")
          } finally {
            setIsUploading(false)
            setUploadProgress(null)
          }
        })
      } else if (uploadErrors.length > 0) {
        setImportResult({
          nuevos: 0,
          existentes: 0,
          actualizados: 0,
          errores: uploadErrors.length,
          detalles: uploadErrors,
        })
        toast.error("No se pudo subir ningún archivo.")
        setIsUploading(false)
        setUploadProgress(null)
      }
    } catch (err: any) {
      toast.error(err?.message || "Error general en la subida.")
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  // Summary counts
  const countNuevos = fileItems.filter((i) => !i.esExistente).length
  const countExistentes = fileItems.filter((i) => i.esExistente).length
  const countRevisar = fileItems.filter((i) => !i.categoriaNombre).length

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isUploading && !isPending) {
          handleReset()
          onClose()
        }
      }}
    >
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-6xl max-h-[94vh] overflow-hidden p-0 gap-0 rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl bg-slate-50 flex flex-col">
        {/* Barra superior de acento institucional */}
        <div className="flex h-2 w-full">
          <div className="flex-1 bg-[#C41E3A]" />
          <div className="flex-1 bg-[#FFCC00]" />
          <div className="flex-1 bg-[#0E5296]" />
        </div>

        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
              <LayersIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-[#002F6C]">
                  Subir Varios Documentos (Importación Masiva)
                </DialogTitle>
                <span className="rounded-full bg-[#FFCC00]/20 text-[#002F6C] border border-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase">
                  AGBC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Reconocimiento inteligente, clasificación automática y prevención de duplicados para PDF, Word y Excel
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Zona de Arrastre / Selección de Archivos */}
          {fileItems.length === 0 && !importResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                isDragging
                  ? "border-[#0E5296] bg-blue-50/70 scale-[0.99]"
                  : "border-[#002F6C]/20 bg-white hover:border-[#0E5296] hover:bg-blue-50/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.png"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0E5296]/10 text-[#0E5296] mb-4">
                <UploadIcon className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[#002F6C] mb-1">
                Arrastra y suelta tus archivos aquí o haz clic para seleccionarlos
              </h3>
              <p className="text-xs text-slate-500 text-center max-w-md mb-4">
                Admite documentos en formato <strong>PDF</strong>, <strong>Word (.doc, .docx)</strong> y <strong>Excel (.xlsx, .xls, .csv)</strong>.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-600">
                <span className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-2.5 py-1">PDF</span>
                <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1">Word (.docx, .doc)</span>
                <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1">Excel (.xlsx, .xls)</span>
              </div>
            </div>
          )}

          {/* Si hay archivos seleccionados, mostrar tabla de reconocimiento interactiva */}
          {fileItems.length > 0 && !importResult && (
            <div className="space-y-4">
              {/* Progreso de subida */}
              {uploadProgress && (
                <div className="rounded-2xl border-2 border-[#0E5296]/30 bg-blue-50/80 p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#002F6C]">
                    <div className="flex items-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin text-[#0E5296]" />
                      <span>Subiendo archivo {uploadProgress.current} de {uploadProgress.total}:</span>
                      <span className="font-mono text-slate-600 truncate max-w-sm">{uploadProgress.currentFileName}</span>
                    </div>
                    <span className="font-mono font-black text-[#0E5296]">{uploadProgress.percent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0E5296] to-[#FFCC00] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Barra de estado y acciones rápidas */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#002F6C]/15 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-[#002F6C]">
                    {fileItems.length} archivos seleccionados:
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                    <CheckCircle2Icon className="h-3.5 w-3.5" />
                    {countNuevos} Nuevos
                  </span>
                  {countExistentes > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-bold">
                      <AlertTriangleIcon className="h-3.5 w-3.5" />
                      {countExistentes} Ya existen
                    </span>
                  )}
                  {countRevisar > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-xs font-bold">
                      <AlertCircleIcon className="h-3.5 w-3.5" />
                      {countRevisar} Requieren revisar categoría
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={actualizarExistentes}
                      onChange={(e) => setActualizarExistentes(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0E5296] focus:ring-[#0E5296]"
                    />
                    <span>Actualizar datos si el documento ya existe</span>
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl text-xs font-bold text-[#002F6C] border-[#002F6C]/20 hover:bg-blue-50"
                  >
                    <UploadIcon className="h-3.5 w-3.5 mr-1" />
                    Añadir más
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.png"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Tabla de archivos y clasificación */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                    <thead className="sticky top-0 z-10 bg-[#002F6C] text-white">
                      <tr className="text-[11px] font-black uppercase tracking-wider">
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 w-[260px]">Archivo Original</th>
                        <th className="py-3 px-3 w-[240px]">Título Generado</th>
                        <th className="py-3 px-3 w-[180px]">Categoría</th>
                        <th className="py-3 px-3">Descripción</th>
                        <th className="py-3 px-3 w-[120px]">Estado</th>
                        <th className="py-3 px-3 w-[110px]">Resultado</th>
                        <th className="py-3 px-2 w-10 text-center">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fileItems.map((item, idx) => {
                        const Icon = getFileIcon(item.tipoExt)
                        const badgeColor = getFileBadgeColor(item.tipoExt)
                        const isRevisar = !item.categoriaNombre

                        return (
                          <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Archivo */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 max-w-[200px]">
                                  <p className="font-bold text-slate-800 truncate" title={item.nombreOriginal}>
                                    {item.nombreOriginal}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-black uppercase border ${badgeColor}`}>
                                      {item.tipoExt}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {item.tamanoFormateado}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Título Generado */}
                            <td className="py-2.5 px-3">
                              <Input
                                value={item.titulo}
                                onChange={(e) => handleUpdateItem(item.id, "titulo", e.target.value)}
                                className="h-8 text-xs font-semibold bg-white border-slate-200 focus:border-[#0E5296] rounded-lg"
                                placeholder="Título del documento..."
                              />
                            </td>

                            {/* Categoría Detectada */}
                            <td className="py-2.5 px-3">
                              <Select
                                value={item.categoriaNombre || "REVISAR"}
                                onValueChange={(val) =>
                                  handleUpdateItem(item.id, "categoriaNombre", val === "REVISAR" ? null : val)
                                }
                              >
                                <SelectTrigger
                                  className={`h-8 text-xs rounded-lg font-bold ${
                                    isRevisar
                                      ? "border-red-400 bg-red-50 text-red-700"
                                      : "border-slate-200 bg-white text-[#002F6C]"
                                  }`}
                                >
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="REVISAR" className="text-red-600 font-bold">
                                    ⚠️ Revisar (Sin clasificar)
                                  </SelectItem>
                                  {CATEGORIAS_VALIDAS.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Descripción */}
                            <td className="py-2.5 px-3">
                              <Input
                                value={item.descripcion}
                                onChange={(e) => handleUpdateItem(item.id, "descripcion", e.target.value)}
                                className="h-8 text-xs bg-white border-slate-200 focus:border-[#0E5296] rounded-lg text-slate-600"
                                placeholder="Descripción del documento..."
                              />
                            </td>

                            {/* Estado */}
                            <td className="py-2.5 px-3">
                              <Select
                                value={item.estado}
                                onValueChange={(val) => handleUpdateItem(item.id, "estado", val)}
                              >
                                <SelectTrigger className="h-8 text-xs rounded-lg font-semibold border-slate-200 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="publicado">Publicado / Visible</SelectItem>
                                  <SelectItem value="borrador">Borrador</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Resultado / Indicador */}
                            <td className="py-2.5 px-3">
                              {isRevisar ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-black">
                                  Revisar
                                </span>
                              ) : item.esExistente ? (
                                actualizarExistentes ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-black">
                                    Actualizar
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-black">
                                    Ya existe
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-black">
                                  Nuevo
                                </span>
                              )}
                            </td>

                            {/* Quitar */}
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Quitar archivo"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Resumen Final de Importación */}
          {importResult && (
            <div className="space-y-6">
              {/* Tarjetas de métricas del resultado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                    <CheckCircle2Icon className="h-4 w-4" />
                    Nuevos Creados
                  </div>
                  <div className="text-2xl font-black text-emerald-900">
                    {importResult.nuevos}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                    <RefreshCwIcon className="h-4 w-4" />
                    Actualizados
                  </div>
                  <div className="text-2xl font-black text-blue-900">
                    {importResult.actualizados}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
                    <AlertTriangleIcon className="h-4 w-4" />
                    Ya Existentes (Omitidos)
                  </div>
                  <div className="text-2xl font-black text-amber-900">
                    {importResult.existentes}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
                    <AlertCircleIcon className="h-4 w-4" />
                    Con Errores
                  </div>
                  <div className="text-2xl font-black text-red-900">
                    {importResult.errores}
                  </div>
                </div>
              </div>

              {/* Detalle por archivo */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h4 className="text-xs font-black text-[#002F6C] uppercase tracking-wider mb-3">
                  Detalle de la operación por documento:
                </h4>
                <div className="max-h-[35vh] overflow-y-auto space-y-2">
                  {importResult.detalles.map((det, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-800 truncate">{det.titulo}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{det.archivo}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            det.estado === "nuevo"
                              ? "bg-emerald-100 text-emerald-800"
                              : det.estado === "actualizado"
                              ? "bg-blue-100 text-blue-800"
                              : det.estado === "existente"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {det.mensaje || det.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de diálogo con acciones */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset()
              onClose()
            }}
            disabled={isUploading || isPending}
            className="rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            {importResult ? "Cerrar" : "Cancelar"}
          </Button>

          {!importResult && fileItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={isUploading || isPending}
                className="rounded-xl text-xs font-bold text-slate-500 hover:text-red-600"
              >
                Limpiar lista
              </Button>
              <Button
                type="button"
                onClick={handleExecuteImport}
                disabled={isUploading || isPending}
                className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white font-black text-xs px-5 shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                {isUploading || isPending ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin text-[#FFCC00]" />
                    Procesando ({fileItems.length} docs)...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1.5 text-[#FFCC00]" />
                    Guardar e Importar {fileItems.length} Documento(s)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
