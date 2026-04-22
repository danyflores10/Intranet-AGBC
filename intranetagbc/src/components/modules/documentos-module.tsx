"use client"

import { useState, useTransition, useRef, useMemo } from "react"
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
  crearDocumento, actualizarDocumento, eliminarDocumento,
  crearCategoria, actualizarCategoria, eliminarCategoria,
} from "@/actions/documentos"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"

type Tab = "todos" | "archivos" | "categorias"

interface DocRow {
  id: string; titulo: string; categoria: string | null; categoriaId: string | null
  autor: string; estado: string; archivo: string | null; nombreArchivo: string | null; tipoArchivo: string | null
  tamano: string | null; descripcion: string | null; createdAt: Date
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null)
  const [editDoc, setEditDoc] = useState<DocRow | null>(null)
  const [editCat, setEditCat] = useState<Props["categorias"][0] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; nombre: string; tipo: string; tamano: string } | null>(null)
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
          autor: fd.get("autor") as string,
          categoriaId: (fd.get("categoriaId") as string) || undefined,
          estado: fd.get("estado") as string,
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
      } catch { toast.error("Error al guardar") }
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
      } catch { toast.error("Error al guardar") }
    })
  }

  function openCreateDoc() {
    if (!canCreateDocumento) {
      return
    }

    setEditDoc(null)
    setUploadedFile(null)
    setDialogOpen(true)
  }

  function openEditDoc(doc: DocRow) {
    if (!canEditDocumento) {
      return
    }

    setEditDoc(doc)
    if (doc.archivo && doc.nombreArchivo) {
      setUploadedFile({ url: doc.archivo, nombre: doc.nombreArchivo, tipo: doc.tipoArchivo ?? "", tamano: doc.tamano ?? "" })
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

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-0">
          {([
            { key: "todos" as Tab, label: "Todos los documentos", icon: FileTextIcon },
            { key: "archivos" as Tab, label: "Archivos", icon: UploadIcon },
            { key: "categorias" as Tab, label: "Categorías", icon: FolderIcon },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? "border-[#FFB300] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {tab === "todos" ? "Todos los documentos" : tab === "archivos" ? "Archivos subidos" : "Categorías"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "todos" ? "Repositorio centralizado de documentación" : tab === "archivos" ? "Documentos con archivos adjuntos para visualizar y descargar" : "Organiza documentos por tipo"}
            </p>
          </div>
          {canCreateDocumento ? (
            <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
              onClick={() => { if (tab === "categorias") { setEditCat(null); setCatDialogOpen(true) } else { openCreateDoc() } }}>
              <PlusIcon className="mr-2 h-4 w-4" />{tab === "categorias" ? "Nueva categoría" : "Nuevo documento"}
            </Button>
          ) : null}
        </div>

        {/* ── Tab: Todos los documentos ── */}
        {tab === "todos" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{documentos.length}</div><div className="text-xs text-muted-foreground">Total documentos</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{documentos.filter(d => d.estado === "publicado").length}</div><div className="text-xs text-muted-foreground">Publicados</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-amber-500">{documentos.filter(d => d.estado !== "publicado").length}</div><div className="text-xs text-muted-foreground">Pendientes / Borrador</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{docsConArchivo.length}</div><div className="text-xs text-muted-foreground">Con archivo adjunto</div></CardContent></Card>
            </div>
            <DataTable data={documentos.map(d => ({ ...d, fecha: d.createdAt.toLocaleDateString("es-BO") }))} searchKey="titulo" searchPlaceholder="Buscar documento..."
              columns={[
                { key: "titulo", label: "Título", render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.archivo ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: getFileColor(row.tipoArchivo) + "15" }}>
                        {(() => { const Icon = getFileIcon(row.tipoArchivo); return <Icon className="h-4 w-4" style={{ color: getFileColor(row.tipoArchivo) }} /> })()}
                      </div>
                    ) : null}
                    <div>
                      <span className="font-medium">{row.titulo}</span>
                      {row.nombreArchivo && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{row.nombreArchivo}</p>}
                    </div>
                  </div>
                )},
                { key: "categoria", label: "Categoría", render: (row) => <span>{row.categoria || "Sin categoría"}</span> },
                { key: "fecha", label: "Fecha" },
                { key: "autor", label: "Autor" },
                { key: "tamano", label: "Tamaño", render: (row) => <span className="text-xs text-muted-foreground">{row.tamano || "-"}</span> },
                { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "publicado" | "borrador" | "pendiente"} /> },
              ]}
              actions={(row) => (
                <div className="flex items-center justify-end gap-1.5">
                  {row.archivo && (
                    <>
                      <button type="button" title="Ver archivo" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 hover:shadow-md active:scale-95"
                        onClick={() => setPreviewDoc(row as unknown as DocRow)}><EyeIcon className="h-4 w-4" /></button>
                      <a href={row.archivo} download={row.nombreArchivo ?? "archivo"} title="Descargar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/10 hover:shadow-md active:scale-95">
                        <DownloadIcon className="h-4 w-4" /></a>
                    </>
                  )}
                  {canEditDocumento ? (
                    <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => openEditDoc(row as unknown as DocRow)}><PencilIcon className="h-4 w-4" /></button>
                  ) : null}
                  {canDeleteDocumento ? (
                    <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => handleDeleteDoc(row.id)}><Trash2Icon className="h-4 w-4" /></button>
                  ) : null}
                </div>
              )}
            />
          </>
        )}

        {/* ── Tab: Archivos ── */}
        {tab === "archivos" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{docsConArchivo.length}</div><div className="text-xs text-muted-foreground">Total archivos</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{docsConArchivo.filter(d => d.estado === "publicado").length}</div><div className="text-xs text-muted-foreground">Activos</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-amber-500">{docsSinArchivo.length}</div><div className="text-xs text-muted-foreground">Sin archivo</div></CardContent></Card>
            </div>

            {docsConArchivo.length === 0 ? (
              <Card className="border-border/40 border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <UploadIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">No hay archivos subidos</p>
                  <p className="text-xs text-muted-foreground/60">Crea un documento y adjunta un archivo</p>
                  {canCreateDocumento ? (
                    <Button size="sm" className="mt-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0" onClick={openCreateDoc}>
                      <PlusIcon className="h-4 w-4 mr-1" />Subir documento
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {docsConArchivo.map((doc) => {
                  const Icon = getFileIcon(doc.tipoArchivo)
                  const color = getFileColor(doc.tipoArchivo)
                  return (
                    <Card key={doc.id} className="group border-border/40 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#FFB300]/30 hover:-translate-y-0.5">
                      <CardContent className="p-0">
                        {/* Header con color del tipo */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30" style={{ backgroundColor: color + "08" }}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: color + "18" }}>
                            <Icon className="h-5 w-5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate group-hover:text-[#FF8800] transition-colors">{doc.titulo}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{doc.nombreArchivo}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5" style={{ backgroundColor: color + "15", color }}>
                            {doc.tipoArchivo ?? "?"}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Autor: <strong className="text-foreground">{doc.autor}</strong></span>
                            <span>{doc.tamano ?? "-"}</span>
                          </div>
                          {doc.categoria && (
                            <div className="flex items-center gap-1.5">
                              <FolderIcon className="h-3 w-3 text-[#FFB300]" />
                              <span className="text-xs text-muted-foreground">{doc.categoria}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <StatusBadge status={doc.estado as "publicado" | "borrador" | "pendiente"} />
                            <span className="text-[10px] text-muted-foreground ml-auto">{doc.createdAt.toLocaleDateString("es-BO")}</span>
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                            <button type="button" onClick={() => setPreviewDoc(doc)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                              <EyeIcon className="h-3.5 w-3.5" />Visualizar
                            </button>
                            <a href={doc.archivo!} download={doc.nombreArchivo ?? "archivo"} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                              <DownloadIcon className="h-3.5 w-3.5" />Descargar
                            </a>
                            {canEditDocumento ? (
                              <button type="button" onClick={() => openEditDoc(doc)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#FFB300]/10 hover:text-[#FF8800] transition-colors">
                                <PencilIcon className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Categorías ── */}
        {tab === "categorias" && (
          <DataTable data={categorias} searchKey="nombre" searchPlaceholder="Buscar categoría..."
            columns={[
              { key: "nombre", label: "Categoría", render: (row) => (
                <div className="flex items-center gap-2"><FolderIcon className="h-4 w-4 text-[#FFB300]" /><span className="font-medium">{row.nombre}</span></div>
              )},
              { key: "descripcion", label: "Descripción", render: (row) => <span className="text-muted-foreground text-sm">{row.descripcion || "-"}</span> },
            ]}
            actions={canEditDocumento || canDeleteDocumento
              ? (row) => (
                <div className="flex items-center justify-end gap-2">
                  {canEditDocumento ? (
                    <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditCat(row); setCatDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
                  ) : null}
                  {canDeleteDocumento ? (
                    <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => handleDeleteCategory(row.id)}><Trash2Icon className="h-4 w-4" /></button>
                  ) : null}
                </div>
              )
              : undefined}
          />
        )}
      </div>

      {/* ── Dialog crear/editar documento ── */}
      {canCreateDocumento || canEditDocumento ? (
        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditDoc(null); setUploadedFile(null) } }}>
          <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[600px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
            <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
            <DialogHeader className="px-6 pt-5 pb-0">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {editDoc ? "Editar documento" : "Nuevo documento"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editDoc ? "Modifica los datos del documento" : "Crea un documento y adjunta un archivo"}
              </p>
            </DialogHeader>

          <form onSubmit={handleDocSubmit} className="space-y-5 px-6 pb-6 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Título *</Label>
              <Input name="titulo" required defaultValue={editDoc?.titulo} placeholder="Nombre del documento" className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Autor *</Label>
                <Input name="autor" required defaultValue={editDoc?.autor} placeholder="Nombre del autor" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Categoría</Label>
                <select name="categoriaId" className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={editDoc?.categoriaId ?? ""}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Estado</Label>
                <select name="estado" className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" defaultValue={editDoc?.estado ?? "borrador"}>
                  <option value="borrador">Borrador</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="publicado">Publicado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Descripción</Label>
                <Input name="descripcion" defaultValue={editDoc?.descripcion ?? ""} placeholder="Descripción breve" className="h-11 rounded-xl" />
              </div>
            </div>

            {/* Upload de archivo */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Archivo adjunto</Label>
              {uploadedFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: getFileColor(uploadedFile.tipo) + "15" }}>
                    {(() => { const Icon = getFileIcon(uploadedFile.tipo); return <Icon className="h-5 w-5" style={{ color: getFileColor(uploadedFile.tipo) }} /> })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">{uploadedFile.tamano} — {uploadedFile.tipo.toUpperCase()}</p>
                  </div>
                  <button type="button" onClick={() => setUploadedFile(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all cursor-pointer ${
                    uploading ? "border-[#FFB300]/50 bg-[#FFB300]/5" : "border-border/50 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/5"
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
                      <p className="text-[10px] text-muted-foreground/60">PDF, DOC, DOCX, XLS, XLSX, PPT, JPG, PNG — Máx. 10MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setDialogOpen(false); setEditDoc(null); setUploadedFile(null) }}>Cancelar</Button>
              <Button type="submit" disabled={isPending || uploading} className="rounded-xl border-0 bg-gradient-to-r from-[#FFB300] to-[#FF8800] font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20">
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* ── Dialog Categorías ── */}
      {canCreateDocumento || canEditDocumento ? (
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
            <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
            <div className="p-6"><DialogHeader><DialogTitle>{editCat ? "Editar categoría" : "Nueva categoría"}</DialogTitle></DialogHeader>
            <form onSubmit={handleCatSubmit} className="space-y-4 pt-2">
              <div className="space-y-2"><Label className="text-sm font-semibold">Nombre *</Label><Input name="nombre" required defaultValue={editCat?.nombre} className="h-11 rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Descripción</Label><Input name="descripcion" defaultValue={editCat?.descripcion ?? ""} className="h-11 rounded-xl" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20">{isPending ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form></div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* ── Dialog Preview de archivo ── */}
      <Dialog open={!!previewDoc} onOpenChange={(v) => { if (!v) setPreviewDoc(null) }}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[900px] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border-border/50">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewDoc?.titulo ?? "Vista previa"}</DialogTitle>
          </DialogHeader>
          <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          {previewDoc && (
            <>
              <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: getFileColor(previewDoc.tipoArchivo) + "15" }}>
                    {(() => { const Icon = getFileIcon(previewDoc.tipoArchivo); return <Icon className="h-5 w-5" style={{ color: getFileColor(previewDoc.tipoArchivo) }} /> })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{previewDoc.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{previewDoc.nombreArchivo} — {previewDoc.tamano}</p>
                  </div>
                </div>
                <a href={previewDoc.archivo!} download={previewDoc.nombreArchivo ?? "archivo"}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-4 py-2 text-xs font-bold text-[#1a1000] shadow-md shadow-[#FFB300]/20 hover:shadow-lg transition-all">
                  <DownloadIcon className="h-3.5 w-3.5" />Descargar
                </a>
              </div>
              <div className="flex-1 overflow-auto bg-muted/20" style={{ height: "70vh" }}>
                {previewDoc.tipoArchivo?.includes("pdf") ? (
                  <iframe src={previewDoc.archivo!} className="h-full w-full" title={previewDoc.titulo} />
                ) : previewDoc.tipoArchivo && ["jpg", "jpeg", "png", "webp", "gif"].some(ext => previewDoc.tipoArchivo!.includes(ext)) ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <img src={previewDoc.archivo!} alt={previewDoc.titulo} className="max-h-full max-w-full object-contain rounded-xl shadow-lg" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 h-full px-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                      {(() => { const Icon = getFileIcon(previewDoc.tipoArchivo); return <Icon className="h-10 w-10 text-muted-foreground/30" /> })()}
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">Vista previa no disponible para este tipo de archivo</p>
                    <p className="text-xs text-muted-foreground/60">Descarga el archivo para visualizarlo</p>
                    <a href={previewDoc.archivo!} download={previewDoc.nombreArchivo ?? "archivo"}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-6 py-2.5 text-sm font-bold text-[#1a1000] shadow-md shadow-[#FFB300]/20 hover:shadow-lg transition-all">
                      <DownloadIcon className="h-4 w-4" />Descargar archivo
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
