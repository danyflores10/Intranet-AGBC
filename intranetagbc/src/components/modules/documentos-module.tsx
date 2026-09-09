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
} from "@/actions/documentos"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import Image from "next/image"

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
  if (!tipo) return FileIcon
  if (tipo.includes("pdf")) return FileTextIcon
  if (tipo.includes("xls") || tipo.includes("csv") || tipo.includes("spreadsheet")) return FileSpreadsheetIcon
  if (tipo.includes("image") || tipo.includes("jpg") || tipo.includes("png") || tipo.includes("webp")) return ImageIcon
  return FileIcon
}

function getFileColor(tipo: string | null) {
  if (!tipo) return "#6B7280"
  if (tipo.includes("pdf")) return "#C41E3A"
  if (tipo.includes("doc")) return "#1976D2"
  if (tipo.includes("xls") || tipo.includes("csv") || tipo.includes("spreadsheet")) return "#2E7D32"
  if (tipo.includes("ppt") || tipo.includes("presentation")) return "#FF8800"
  if (tipo.includes("image") || tipo.includes("jpg") || tipo.includes("png")) return "#7B1FA2"
  return "#6B7280"
}

export function DocumentosModule({ documentos, categorias, usuario }: Props) {
  const [tab, setTab] = useState<Tab>("todos")
  const [searchQuery, setSearchQuery] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
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

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setSearchQuery("")
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
              {tab === "categorias" ? "Nueva Categoría" : "Nuevo Documento"}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/90 border-[#002F6C]/20 text-xs font-medium focus:border-[#0E5296]"
            />
          </div>
          <span className="text-xs font-bold text-[#0E5296] bg-white/80 border border-[#0E5296]/20 px-3 py-1.5 rounded-xl shadow-2xs">
            {currentList.length} encontrados
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA EN TABLA ESTRUCTURADA Y RESPONSIVA AGBC                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-4 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-amber-50/50 text-[11px] font-black uppercase text-[#002F6C] tracking-wider">
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
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No hay registros en {tab === "categorias" ? "Categorías" : tab === "archivos" ? "Archivos Adjuntos" : "Todos los Documentos"}.
                  </td>
                </tr>
              ) : (
                currentList.map((item: any) => {
                  const isCat = tab === "categorias"
                  const Icon = isCat ? FolderIcon : getFileIcon(item.tipoArchivo)
                  const iconColor = isCat ? "#FF8800" : getFileColor(item.tipoArchivo)

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
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
                              href={item.archivo}
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
                  href={previewDoc.archivo!}
                  download={previewDoc.nombreArchivo ?? "archivo"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                >
                  <DownloadIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                  Descargar
                </a>
              </div>

              <div className="flex-1 overflow-auto bg-muted/20" style={{ height: "70vh" }}>
                {previewDoc.tipoArchivo?.includes("pdf") ? (
                  <iframe src={previewDoc.archivo!} className="h-full w-full" title={previewDoc.titulo} />
                ) : previewDoc.tipoArchivo && ["jpg", "jpeg", "png", "webp", "gif"].some(ext => previewDoc.tipoArchivo!.includes(ext)) ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <Image
                      src={previewDoc.archivo!}
                      alt={previewDoc.titulo}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 h-full px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                      {(() => {
                        const Icon = getFileIcon(previewDoc.tipoArchivo)
                        return <Icon className="h-10 w-10 text-muted-foreground/30" />
                      })()}
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">Vista previa no disponible para este tipo de archivo</p>
                    <p className="text-xs text-muted-foreground/60">Descarga el archivo para visualizarlo</p>
                    <a
                      href={previewDoc.archivo!}
                      download={previewDoc.nombreArchivo ?? "archivo"}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                    >
                      <DownloadIcon className="h-4 w-4 text-[#FFB800]" />
                      Descargar archivo
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}