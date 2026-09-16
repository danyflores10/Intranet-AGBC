"use client"

import { useState, useTransition, useRef, useMemo, useEffect } from "react"
import {
  PlusIcon,
  FileTextIcon,
  FolderIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  DownloadIcon,
  FileIcon,
  FileSpreadsheetIcon,
  ImageIcon,
  XIcon,
  Loader2Icon,
  LayoutGridIcon,
  TableIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  SparklesIcon,
  LayersIcon,
  CheckSquareIcon,
  SquareIcon,
  AlertTriangleIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  crearDocumento, actualizarDocumento, eliminarDocumento,
  crearCategoria, actualizarCategoria, eliminarCategoria,
  enviarDocumentosAPapeleraLote, eliminarDocumentosPermanenteLote,
} from "@/actions/documentos"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import Image from "next/image"
import { DocumentContentViewer } from "@/components/modules/document-content-viewer"
import { DocumentosBulkDialog } from "@/components/modules/documentos-bulk-dialog"

export function getDocumentUrl(archivo: string | null): string {
  if (!archivo) return ""
  if (archivo.startsWith("http://") || archivo.startsWith("https://")) return archivo
  if (archivo.startsWith("/api/documentos/")) return archivo
  const clean = archivo.replace(/^\/?(documentos\/)?/, "")
  return `/api/documentos/${clean}`
}

type Tab = "todos" | "archivos" | "categorias"

interface DocRow {
  id: string
  titulo: string
  categoria: string | null
  categoriaId: string | null
  autor: string
  estado: string
  archivo: string | null
  nombreArchivo: string | null
  tipoArchivo: string | null
  tamano: string | null
  descripcion: string | null
  createdAt: Date
}

interface Props {
  documentos: DocRow[]
  categorias: Array<{ id: string; nombre: string; descripcion: string | null; createdAt: Date }>
  usuario: UsuarioRbac
}

function getFileIcon(tipo: string | null) {
  const t = (tipo || "").toLowerCase()
  if (t.includes("pdf")) return FileTextIcon
  if (t.includes("xls") || t.includes("csv") || t.includes("spreadsheet") || t.includes("sheet") || t.includes("excel")) return FileSpreadsheetIcon
  if (t.includes("doc") || t.includes("word")) return FileTextIcon
  if (t.includes("image") || t.includes("jpg") || t.includes("png") || t.includes("webp")) return ImageIcon
  return FileIcon
}

function getFileColor(tipo: string | null) {
  const t = (tipo || "").toLowerCase()
  if (t.includes("pdf")) return "#C41E3A"
  if (t.includes("doc") || t.includes("word")) return "#1976D2"
  if (t.includes("xls") || t.includes("csv") || t.includes("spreadsheet") || t.includes("sheet") || t.includes("excel")) return "#2E7D32"
  if (t.includes("ppt") || t.includes("presentation")) return "#FF8800"
  if (t.includes("image") || t.includes("jpg") || t.includes("png") || t.includes("webp")) return "#7B1FA2"
  return "#6B7280"
}

function buildPagination(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total]
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total]
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

export function DocumentosModule({ documentos, categorias, usuario }: Props) {
  const [tab, setTab] = useState<Tab>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null)
  const [editDoc, setEditDoc] = useState<DocRow | null>(null)
  const [editCat, setEditCat] = useState<Props["categorias"][0] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; nombre: string; tipo: string; tamano: string } | null>(null)
  const [categoriaId, setCategoriaId] = useState("")
  const [estado, setEstado] = useState("borrador")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])

  const canCreateDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.CREAR] }, accessContext),
    [accessContext],
  )

  const canEditDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.EDITAR] }, accessContext),
    [accessContext],
  )

  const canDeleteDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.ELIMINAR] }, accessContext),
    [accessContext],
  )

  const docsConArchivo = documentos.filter((d) => d.archivo)
  const docsSinArchivo = documentos.filter((d) => !d.archivo)

  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setSearchQuery("")
    setCurrentPage(1)
    setSelectedDocIds([])
  }

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSelectAllDocs = () => {
    if (selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0) {
      setSelectedDocIds([])
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id))
    }
  }

  const handleBulkEnviarPapelera = async () => {
    if (selectedDocIds.length === 0) return
    setIsProcessingBulk(true)
    try {
      const res = await enviarDocumentosAPapeleraLote(selectedDocIds)
      if (res.success) {
        toast.success(`${res.count} documento(s) movido(s) a papelera`)
        setSelectedDocIds([])
      } else {
        toast.error("Error al mover documentos a papelera")
      }
    } catch {
      toast.error("Error al procesar la acción masiva")
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleBulkEliminarPermanente = async () => {
    if (selectedDocIds.length === 0) return
    setIsProcessingBulk(true)
    try {
      const res = await eliminarDocumentosPermanenteLote(selectedDocIds)
      if (res.success) {
        toast.success(`${res.count} documento(s) eliminado(s) permanentemente`)
        setSelectedDocIds([])
        setShowPermanentDeleteModal(false)
      } else {
        toast.error("Error al eliminar documentos permanentemente")
      }
    } catch {
      toast.error("Error al procesar la eliminación permanente")
    } finally {
      setIsProcessingBulk(false)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      setCategoriaId(editDoc?.categoriaId ?? "")
      setEstado(editDoc?.estado ?? "borrador")
    }
  }, [dialogOpen, editDoc])

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/documento", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al subir archivo")
        return
      }
      setUploadedFile(data)
      toast.success("Archivo subido correctamente")
    } catch {
      toast.error("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  async function handleDocSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (editDoc && !canEditDocumento) {
      toast.error("No tienes permiso para editar documentos")
      return
    }

    if (!editDoc && !canCreateDocumento) {
      toast.error("No tienes permiso para crear documentos")
      return
    }

    startTransition(async () => {
      try {
        const payload: Record<string, string | undefined> = {
          titulo: fd.get("titulo") as string,
          categoriaId: categoriaId || undefined,
          estado,
          descripcion: ((fd.get("descripcion") as string) || "").trim() || undefined,
        }

        if (uploadedFile) {
          payload.archivo = uploadedFile.url
          payload.nombreArchivo = uploadedFile.nombre
          payload.tipoArchivo = uploadedFile.tipo
          payload.tamano = uploadedFile.tamano
        }

        if (editDoc) {
          await actualizarDocumento(editDoc.id, payload)
          toast.success("Documento actualizado")
        } else {
          await crearDocumento(payload as Parameters<typeof crearDocumento>[0])
          toast.success("Documento creado")
        }

        setDialogOpen(false)
        setEditDoc(null)
        setUploadedFile(null)
        setCategoriaId("")
        setEstado("borrador")
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  async function handleCatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (editCat && !canEditDocumento) {
      toast.error("No tienes permiso para editar categorías")
      return
    }

    if (!editCat && !canCreateDocumento) {
      toast.error("No tienes permiso para crear categorías")
      return
    }

    startTransition(async () => {
      try {
        if (editCat) {
          await actualizarCategoria(editCat.id, {
            nombre: fd.get("nombre") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
          })
          toast.success("Categoría actualizada")
        } else {
          await crearCategoria({
            nombre: fd.get("nombre") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
          })
          toast.success("Categoría creada")
        }
        setCatDialogOpen(false)
        setEditCat(null)
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  function openCreateDoc() {
    if (!canCreateDocumento) {
      return
    }

    setEditDoc(null)
    setUploadedFile(null)
    setCategoriaId("")
    setEstado("borrador")
    setDialogOpen(true)
  }

  function openEditDoc(doc: DocRow) {
    if (!canEditDocumento) {
      return
    }

    setEditDoc(doc)
    setCategoriaId(doc.categoriaId ?? "")
    setEstado(doc.estado ?? "borrador")

    if (doc.archivo && doc.nombreArchivo) {
      setUploadedFile({
        url: doc.archivo,
        nombre: doc.nombreArchivo,
        tipo: doc.tipoArchivo ?? "",
        tamano: doc.tamano ?? "",
      })
    } else {
      setUploadedFile(null)
    }

    setDialogOpen(true)
  }

  function handleDeleteDoc(documentId: string) {
    if (!canDeleteDocumento) {
      toast.error("No tienes permiso para eliminar documentos")
      return
    }

    startTransition(async () => {
      try {
        await eliminarDocumento(documentId)
        toast.success("Movido a papelera")
      } catch {
        toast.error("Error al eliminar")
      }
    })
  }

  function handleDeleteCategory(categoryId: string) {
    if (!canDeleteDocumento) {
      toast.error("No tienes permiso para eliminar categorías")
      return
    }

    startTransition(async () => {
      try {
        await eliminarCategoria(categoryId)
        toast.success("Eliminada")
      } catch {
        toast.error("Error al eliminar")
      }
    })
  }

  const filteredDocs = useMemo(() => {
    return documentos.filter((d) =>
      d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.descripcion && d.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.categoria && d.categoria.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.nombreArchivo && d.nombreArchivo.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [documentos, searchQuery])

  const filteredArchivos = useMemo(() => {
    return docsConArchivo.filter((d) =>
      d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.nombreArchivo && d.nombreArchivo.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [docsConArchivo, searchQuery])

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) =>
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [categorias, searchQuery])

  const currentList = tab === "todos" ? filteredDocs : tab === "archivos" ? filteredArchivos : filteredCategorias
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize))
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <FileTextIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Gestión Documental y Archivos
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Repositorio centralizado de manuales, normativas, circulares y formularios oficiales
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreateDocumento && tab !== "categorias" && (
            <Button
              variant="outline"
              className="border-2 border-[#0E5296] bg-white hover:bg-blue-50/90 text-[#002F6C] font-black rounded-2xl shadow-xs cursor-pointer text-xs transition-all"
              onClick={() => setBulkDialogOpen(true)}
            >
              <LayersIcon className="mr-1.5 h-4 w-4 text-[#0E5296]" />
              Subir varios documentos
            </Button>
          )}
          {canCreateDocumento && (
            <Button
              className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-2xl shadow-md shadow-[#0E5296]/20 cursor-pointer text-xs"
              onClick={() => {
                if (tab === "categorias") {
                  setEditCat(null)
                  setCatDialogOpen(true)
                } else {
                  openCreateDoc()
                }
              }}
            >
              <PlusIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
              {tab === "categorias" ? "Nueva Categoría" : "Subir nuevo documento"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs de Navegación ── */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-[#002F6C]/10 w-fit">
        {([
          { key: "todos" as Tab, label: "Todos los Documentos", icon: FileTextIcon, count: documentos.length },
          { key: "archivos" as Tab, label: "Archivos Adjuntos", icon: UploadIcon, count: docsConArchivo.length },
          { key: "categorias" as Tab, label: "Categorías", icon: FolderIcon, count: categorias.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              tab === t.key
                ? "bg-[#0E5296] text-[#FFCC00] shadow-md shadow-[#0E5296]/20"
                : "text-slate-600 hover:text-[#002F6C] hover:bg-white/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.label}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              tab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tarjetas Métricas en Pastel Amarillo y Azul ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "categorias" ? categorias.length : documentos.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">
              {tab === "categorias" ? "Total Categorías" : "Total Documentos"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            <CheckCircle2Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {documentos.filter((d) => d.estado === "publicado").length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Publicados / Vigentes</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-[#002F6C]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {docsConArchivo.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Con Archivo Descargable</div>
          </div>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder={`Buscar en ${tab}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-white/90 border-[#002F6C]/20 text-xs font-medium focus:border-[#0E5296]"
            />
          </div>
          <span className="text-xs font-bold text-[#0E5296] bg-white/80 border border-[#0E5296]/20 px-3 py-1.5 rounded-xl shadow-2xs">
            {currentList.length} encontrados
          </span>
        </div>
      </div>

      {/* ── Barra Flotante de Selección Múltiple ── */}
      {tab === "todos" && selectedDocIds.length > 0 && (
        <div className="rounded-2xl border-2 border-[#0E5296]/30 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-[#0E5296] animate-ping" />
            <div>
              <span className="text-xs font-black text-[#002F6C]">
                {selectedDocIds.length} documento(s) seleccionado(s)
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Acciones masivas sobre los documentos seleccionados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDocIds([])}
              className="h-8 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Deseleccionar todos
            </Button>
            {canDeleteDocumento && (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingBulk}
                  onClick={handleBulkEnviarPapelera}
                  className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                  Enviar a papelera ({selectedDocIds.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingBulk}
                  onClick={() => setShowPermanentDeleteModal(true)}
                  className="h-8 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  Eliminar permanentemente ({selectedDocIds.length})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA EN TABLA ESTRUCTURADA Y RESPONSIVA AGBC                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-4 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-amber-50/50 text-[11px] font-black uppercase text-[#002F6C] tracking-wider">
                {tab === "todos" && (
                  <th className="py-3 px-3 text-center w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllDocs}
                      className="text-[#002F6C] hover:text-[#0E5296] transition-colors p-0.5 cursor-pointer"
                      title={selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
                    >
                      {selectedDocIds.length > 0 && selectedDocIds.length === filteredDocs.length ? (
                        <CheckSquareIcon className="h-4 w-4 text-[#0E5296]" />
                      ) : (
                        <SquareIcon className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4">{tab === "categorias" ? "Categoría" : "Documento"}</th>
                <th className="py-3 px-4">{tab === "categorias" ? "Descripción" : "Categoría / Detalle"}</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={tab === "todos" ? 6 : 5} className="py-12 text-center text-slate-400 font-medium">
                    No hay registros en {tab === "categorias" ? "Categorías" : tab === "archivos" ? "Archivos Adjuntos" : "Todos los Documentos"}.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item: any) => {
                  const isCat = tab === "categorias"
                  const Icon = isCat ? FolderIcon : getFileIcon(item.tipoArchivo)
                  const iconColor = isCat ? "#FF8800" : getFileColor(item.tipoArchivo)

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      {tab === "todos" && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectDoc(item.id)}
                            className="text-[#0E5296] hover:scale-110 transition-transform p-0.5 cursor-pointer"
                          >
                            {selectedDocIds.includes(item.id) ? (
                              <CheckSquareIcon className="h-4 w-4 text-[#0E5296]" />
                            ) : (
                              <SquareIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black shadow-xs">
                            <Icon className="h-5 w-5" style={{ color: iconColor }} />
                          </div>
                          <div>
                            <p className="font-bold text-[#002F6C]">{isCat ? item.nombre : item.titulo}</p>
                            {!isCat && item.nombreArchivo && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.nombreArchivo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-slate-600 truncate">
                          {isCat ? (item.descripcion || "—") : (item.categoria || "Sin categoría")}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          (isCat || item.estado === "publicado") ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${(isCat || item.estado === "publicado") ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {isCat ? "Activo" : item.estado === "publicado" ? "Vigente" : "Borrador"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-BO") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCat && item.archivo && (
                            <button
                              onClick={() => setPreviewDoc(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Ver archivo"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {!isCat && item.archivo && (
                            <a
                              href={`${getDocumentUrl(item.archivo)}?download=1`}
                              download={item.nombreArchivo ?? "documento"}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              title="Descargar"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </a>
                          )}
                          {canEditDocumento && (
                            <button
                              onClick={() => {
                                if (isCat) {
                                  setEditCat(item)
                                  setCatDialogOpen(true)
                                } else {
                                  openEditDoc(item)
                                }
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteDocumento && (
                            <button
                              onClick={() => {
                                if (isCat) handleDeleteCategory(item.id)
                                else handleDeleteDoc(item.id)
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Centrada al pie de tabla */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 pt-3 border-t border-[#002F6C]/10 text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {buildPagination(currentPage, totalPages).map((item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-slate-400">
                        ...
                      </span>
                    )
                  }
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? "bg-[#0E5296] text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Siguiente página"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Página {currentPage} de {totalPages} • Mostrando {Math.min(currentList.length, (currentPage - 1) * pageSize + 1)} - {Math.min(currentList.length, currentPage * pageSize)} de {currentList.length} registros
            </span>
          </div>
        )}
      </div>

      {canCreateDocumento || canEditDocumento ? (
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            if (!v) {
              setDialogOpen(false)
              setEditDoc(null)
              setUploadedFile(null)
              setCategoriaId("")
              setEstado("borrador")
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-150 max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
            <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden">
              <div className="flex-1 bg-[#C41E3A]" />
              <div className="flex-1 bg-[#FFB300]" />
              <div className="flex-1 bg-[#2E7D32]" />
            </div>

            <DialogHeader className="px-6 pt-5 pb-0">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {editDoc ? "Editar documento" : "Nuevo documento"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editDoc ? "Modifica los datos del documento" : "Crea un documento y adjunta un archivo"}
              </p>
            </DialogHeader>

            <form onSubmit={handleDocSubmit} className="space-y-4 px-6 pb-6 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Título del documento *</Label>
                <Input name="titulo" required defaultValue={editDoc?.titulo} placeholder="Ej. Resolución Administrativa N° 045/2026" className="h-11 w-full rounded-xl border-slate-200 focus:border-[#0E5296] text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Categoría</Label>
                <Select
                  value={categoriaId || "__none__"}
                  onValueChange={(value) => setCategoriaId(value === "__none__" ? "" : value)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 text-sm">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin categoría</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Descripción</Label>
                <Input name="descripcion" defaultValue={editDoc?.descripcion ?? ""} placeholder="Descripción breve del contenido o alcance" className="h-11 w-full rounded-xl border-slate-200 text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Estado de publicación</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 text-sm">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publicado">Publicado (Visible)</SelectItem>
                    <SelectItem value="borrador">Borrador (Interno)</SelectItem>
                    <SelectItem value="pendiente">Pendiente de revisión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Archivo adjunto</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: getFileColor(uploadedFile.tipo) + "15" }}>
                      {(() => {
                        const Icon = getFileIcon(uploadedFile.tipo)
                        return <Icon className="h-5 w-5" style={{ color: getFileColor(uploadedFile.tipo) }} />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{uploadedFile.tamano} — {uploadedFile.tipo.toUpperCase()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all cursor-pointer ${uploading ? "border-[#FFB300]/50 bg-[#FFB300]/5" : "border-border/50 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/5"
                      }`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileUpload(file)
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                        e.target.value = ""
                      }}
                    />
                    {uploading ? (
                      <>
                        <Loader2Icon className="h-8 w-8 text-[#FFB300] animate-spin" />
                        <p className="text-sm font-medium text-[#FF8800]">Subiendo archivo...</p>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">Arrastra un archivo o haz clic para seleccionar</p>
                        <p className="text-[10px] text-muted-foreground/60">PDF, DOC, DOCX, XLS, XLSX, PPT, JPG, PNG — Sin límite de tamaño</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditDoc(null)
                    setUploadedFile(null)
                    setCategoriaId("")
                    setEstado("borrador")
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || uploading}
                  className="rounded-xl border-0 bg-[#0E5296] hover:bg-[#002F6C] font-bold text-white shadow-md shadow-[#0E5296]/20 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {canCreateDocumento || canEditDocumento ? (
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
            <div className="h-1.5 w-full bg-[#0E5296]" />
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>{editCat ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCatSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nombre *</Label>
                  <Input name="nombre" required defaultValue={editCat?.nombre} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <Input name="descripcion" defaultValue={editCat?.descripcion ?? ""} className="h-11 rounded-xl" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isPending} className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white border-0 font-bold shadow-md shadow-[#0E5296]/20 cursor-pointer">
                    {isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={!!previewDoc} onOpenChange={(v) => { if (!v) setPreviewDoc(null) }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-225 max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border-border/50">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewDoc?.titulo ?? "Vista previa"}</DialogTitle>
          </DialogHeader>

          <div className="h-1.5 w-full bg-[#0E5296]" />

          {previewDoc && (
            (() => {
              const fileEffectiveUrl = getDocumentUrl(previewDoc.archivo)
              const downloadUrl = `${fileEffectiveUrl}?download=1`

              return (
                <>
                  <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: getFileColor(previewDoc.tipoArchivo) + "15" }}>
                        {(() => {
                          const Icon = getFileIcon(previewDoc.tipoArchivo)
                          return <Icon className="h-5 w-5" style={{ color: getFileColor(previewDoc.tipoArchivo) }} />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{previewDoc.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">{previewDoc.nombreArchivo} — {previewDoc.tamano}</p>
                      </div>
                    </div>
                    <a
                      href={downloadUrl}
                      download={previewDoc.nombreArchivo ?? "archivo"}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                    >
                      <DownloadIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                      Descargar
                    </a>
                  </div>

                  <div className="flex-1 overflow-auto bg-muted/20" style={{ height: "70vh" }}>
                    {(() => {
                      const t = (previewDoc.tipoArchivo || "").toLowerCase()
                      const fileUrl = (previewDoc.archivo || "").toLowerCase()
                      const fileName = (previewDoc.nombreArchivo || "").toLowerCase()
                      
                      const isPdf = t.includes("pdf") || fileUrl.endsWith(".pdf") || fileName.endsWith(".pdf")
                      const isImage = ["jpg", "jpeg", "png", "webp", "gif"].some(ext => t.includes(ext) || fileUrl.endsWith("." + ext) || fileName.endsWith("." + ext))
                      const isExcel = t.includes("xls") || t.includes("sheet") || t.includes("csv") || fileUrl.endsWith(".xlsx") || fileUrl.endsWith(".xls") || fileUrl.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")
                      const isWord = t.includes("doc") || t.includes("word") || fileUrl.endsWith(".docx") || fileUrl.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".doc")

                      if (isPdf) {
                        return (
                          <div className="flex flex-col h-full w-full">
                            <iframe src={fileEffectiveUrl} className="flex-1 w-full border-0 min-h-[500px]" title={previewDoc.titulo} />
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 bg-slate-100/80 px-4 py-2 text-xs">
                              <span className="font-mono text-slate-500 truncate max-w-sm">{previewDoc.nombreArchivo}</span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={fileEffectiveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 font-medium text-slate-700 shadow-2xs transition-colors"
                                >
                                  <EyeIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                                  Abrir en nueva ventana
                                </a>
                                <a
                                  href={downloadUrl}
                                  download={previewDoc.nombreArchivo ?? "documento.pdf"}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E5296] hover:bg-[#002F6C] px-3 py-1.5 font-bold text-white shadow-2xs transition-colors"
                                >
                                  <DownloadIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                                  Descargar PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      if (isImage) {
                        return (
                          <div className="flex h-full items-center justify-center p-6">
                            <img
                              src={fileEffectiveUrl}
                              alt={previewDoc.titulo}
                              className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                            />
                          </div>
                        )
                      }

                      if (isExcel || isWord) {
                        return (
                          <DocumentContentViewer
                            url={fileEffectiveUrl}
                            fileName={previewDoc.nombreArchivo ?? previewDoc.titulo}
                            title={previewDoc.titulo}
                            tipoArchivo={previewDoc.tipoArchivo}
                          />
                        )
                      }

                      const formatName = "Archivo Institucional"
                      const formatBadgeColor = "bg-slate-100 text-slate-800 border-slate-300"
                      const Icon = getFileIcon(previewDoc.tipoArchivo)

                      return (
                        <div className="flex flex-col items-center justify-center gap-5 h-full px-6 py-8">
                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl shadow-sm border" style={{ backgroundColor: getFileColor(previewDoc.tipoArchivo) + "12", borderColor: getFileColor(previewDoc.tipoArchivo) + "30" }}>
                            <Icon className="h-12 w-12" style={{ color: getFileColor(previewDoc.tipoArchivo) }} />
                          </div>

                          <div className="text-center max-w-md space-y-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs ${formatBadgeColor}`}>
                              {formatName}
                            </span>
                            <h4 className="text-base font-bold text-[#002F6C] line-clamp-2">{previewDoc.titulo}</h4>
                            <p className="text-xs text-slate-500 font-mono">{previewDoc.nombreArchivo}</p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 max-w-md w-full shadow-xs text-xs space-y-2 text-slate-600">
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-400">Categoría:</span>
                              <span className="font-bold text-[#0E5296]">{previewDoc.categoria || "General"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-400">Tamaño:</span>
                              <span className="font-medium text-slate-700">{previewDoc.tamano || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-400">Estado:</span>
                              <span className="font-medium text-emerald-600 font-bold capitalize">{previewDoc.estado}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <a
                              href={downloadUrl}
                              download={previewDoc.nombreArchivo ?? "documento"}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer hover:scale-105"
                            >
                              <DownloadIcon className="h-4 w-4 text-[#FFB800]" />
                              Descargar / Abrir Archivo
                            </a>
                            <a
                              href={fileEffectiveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-[#002F6C] shadow-xs transition-all cursor-pointer"
                            >
                              <EyeIcon className="h-4 w-4 text-[#0E5296]" />
                              Abrir en nueva pestaña
                            </a>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </>
              )
            })()
          )}
        </DialogContent>
      </Dialog>

      <DocumentosBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        existingDocs={documentos}
        categorias={categorias}
        onSuccess={() => {}}
      />

      {/* ── Modal de Confirmación Fuerte para Eliminación Permanente ── */}
      <Dialog open={showPermanentDeleteModal} onOpenChange={setShowPermanentDeleteModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-2xs">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-red-600">
                  Confirmar Eliminación Permanente
                </DialogTitle>
                <p className="text-[11px] text-slate-500 font-medium">
                  Esta acción es destructiva y definitiva
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <strong className="text-red-600 font-black">{selectedDocIds.length} documento(s)</strong>?
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800 font-semibold flex items-start gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                Los documentos seleccionados serán eliminados por completo de la base de datos y no podrán ser recuperados desde la papelera institucional.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPermanentDeleteModal(false)}
              disabled={isProcessingBulk}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleBulkEliminarPermanente}
              disabled={isProcessingBulk}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
            >
              {isProcessingBulk ? (
                <>
                  <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar permanentemente"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}