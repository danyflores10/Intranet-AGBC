"use client"

import { useState, useTransition, useRef } from "react"
import {
  PlusIcon, PencilIcon, Trash2Icon, MegaphoneIcon, ImageIcon,
  UploadIcon, FileTextIcon, EyeIcon, CalendarIcon, DownloadIcon, Link2Icon, ExternalLinkIcon,
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
  crearComunicado, actualizarComunicado, eliminarComunicado,
  crearBanner, actualizarBanner, eliminarBanner,
  crearAccesoDirecto, actualizarAccesoDirecto, eliminarAccesoDirecto,
} from "@/actions/comunicaciones"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Tab = "comunicados" | "noticias" | "accesos"

interface ComunicadoRow {
  id: string
  titulo: string
  contenido: string
  tipo: string
  estado: string
  destacado: boolean
  archivoUrl: string | null
  archivoNombre: string | null
  archivoTipo: string | null
  createdAt: Date
}

interface NoticiaRow {
  id: string
  titulo: string
  descripcion: string | null
  imagen: string | null
  imagenes: string | null
  activo: boolean
  enlace: string | null
  createdAt: Date
}

interface AccesoDirectoRow {
  clave: string
  titulo: string
  descripcion: string
  url: string
  activo: boolean
  imagen: string
  updatedAt: Date
}

interface Props {
  comunicados: ComunicadoRow[]
  noticias: NoticiaRow[]
  accesosDirectos: AccesoDirectoRow[]
  usuario: UsuarioRbac
}

function formatDate(dateStr: string | Date) {
  const d = typeof dateStr === "string" ? new Date(dateStr + "T12:00:00") : dateStr
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })
}

export function ComunicacionesModule({ comunicados, noticias, accesosDirectos, usuario }: Props) {
  const [tab, setTab] = useState<Tab>("comunicados")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState<ComunicadoRow | null>(null)
  const [editItem, setEditItem] = useState<ComunicadoRow | NoticiaRow | null>(null)
  const [accesoDialogOpen, setAccesoDialogOpen] = useState(false)
  const [editAcceso, setEditAcceso] = useState<AccesoDirectoRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const fileRef = useRef<HTMLInputElement>(null)
  const accesoFileRef = useRef<HTMLInputElement>(null)
  const [archivoUrl, setArchivoUrl] = useState<string | null>(null)
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null)
  const [archivoTipo, setArchivoTipo] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [accesoImagen, setAccesoImagen] = useState<string>("")
  const [accesoUploading, setAccesoUploading] = useState(false)

  const noticiaFileRef = useRef<HTMLInputElement>(null)
  const [noticiaImagenes, setNoticiaImagenes] = useState<string[]>([])
  const [noticiaUploading, setNoticiaUploading] = useState(false)

  const ctx = crearContextoAcceso(usuario)
  const puedeCrearCom = puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.CREAR] }, ctx)
  const puedeEditarCom = puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.EDITAR] }, ctx)
  const puedeEliminarCom = puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.ELIMINAR] }, ctx)
  const puedeCrearNot = puedeAcceder({ permissions: [PERMISOS.NOTICIAS.CREAR] }, ctx)
  const puedeEditarNot = puedeAcceder({ permissions: [PERMISOS.NOTICIAS.EDITAR] }, ctx)
  const puedeEliminarNot = puedeAcceder({ permissions: [PERMISOS.NOTICIAS.ELIMINAR] }, ctx)
  const puedeCrearAcc = puedeAcceder({ permissions: [PERMISOS.ACCESOS.CREAR] }, ctx)
  const puedeEditarAcc = puedeAcceder({ permissions: [PERMISOS.ACCESOS.EDITAR] }, ctx)
  const puedeEliminarAcc = puedeAcceder({ permissions: [PERMISOS.ACCESOS.ELIMINAR] }, ctx)

  const puedeCrear = tab === "comunicados" ? puedeCrearCom : tab === "noticias" ? puedeCrearNot : puedeCrearAcc

  function resetFileState() {
    setArchivoUrl(null)
    setArchivoNombre(null)
    setArchivoTipo(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function openCreate() {
    if (tab === "accesos") {
      setEditAcceso(null)
      setAccesoImagen("")
      setAccesoDialogOpen(true)
      return
    }
    setEditItem(null)
    resetFileState()
    setDialogOpen(true)
  }

  function openEdit(item: ComunicadoRow) {
    setEditItem(item)
    setArchivoUrl(item.archivoUrl)
    setArchivoNombre(item.archivoNombre)
    setArchivoTipo(item.archivoTipo)
    setDialogOpen(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("El archivo no puede superar 5MB"); return }
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) { toast.error("Solo se permiten imágenes y PDF"); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/comunicado", { method: "POST", body: fd })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error") }
      const data = await res.json()
      setArchivoUrl(data.url)
      setArchivoNombre(data.nombre)
      setArchivoTipo(data.tipo)
      toast.success("Archivo subido")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir")
    } finally { setUploading(false) }
  }

  async function handleComSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          titulo: fd.get("titulo") as string,
          contenido: fd.get("contenido") as string,
          estado: fd.get("estado") as string,
          destacado: fd.get("destacado") === "on",
          archivoUrl: archivoUrl ?? undefined,
          archivoNombre: archivoNombre ?? undefined,
          archivoTipo: archivoTipo ?? undefined,
        }
        if (editItem) {
          await actualizarComunicado(editItem.id, payload)
          toast.success("Comunicado actualizado")
        } else {
          await crearComunicado(payload)
          toast.success("Comunicado creado")
        }
        setDialogOpen(false); setEditItem(null); resetFileState()
      } catch { toast.error("Error al guardar") }
    })
  }

  async function handleBannerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const imagenesJson = noticiaImagenes.length > 0 ? JSON.stringify(noticiaImagenes) : undefined
        const primeraImagen = noticiaImagenes[0] || undefined
        if (editItem) {
          await actualizarBanner(editItem.id, {
            titulo: fd.get("titulo") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            enlace: (fd.get("enlace") as string) || undefined,
            imagen: primeraImagen,
            imagenes: imagenesJson,
            activo: fd.get("activo") === "on",
          })
          toast.success("Noticia actualizada")
        } else {
          await crearBanner({
            titulo: fd.get("titulo") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            enlace: (fd.get("enlace") as string) || undefined,
            imagen: primeraImagen,
            imagenes: imagenesJson,
            activo: fd.get("activo") === "on",
          })
          toast.success("Noticia creada")
        }
        setDialogOpen(false); setEditItem(null); setNoticiaImagenes([])
      } catch { toast.error("Error al guardar") }
    })
  }

  async function handleNoticiaImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setNoticiaUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} supera 5MB`); continue }
        if (!file.type.startsWith("image/")) { toast.error(`${file.name} no es una imagen`); continue }
        const fd = new FormData()
        fd.append("archivo", file)
        const res = await fetch("/api/upload/comunicado", { method: "POST", body: fd })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error") }
        const data = await res.json()
        setNoticiaImagenes((prev) => [...prev, data.url])
      }
      toast.success("Imagen(es) subida(s)")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen")
    } finally {
      setNoticiaUploading(false)
      if (noticiaFileRef.current) noticiaFileRef.current.value = ""
    }
  }

  async function handleAccesoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          titulo: (fd.get("titulo") as string).trim(),
          descripcion: ((fd.get("descripcion") as string) || "").trim(),
          url: (fd.get("url") as string).trim(),
          activo: fd.get("activo") === "on",
          imagen: accesoImagen,
        }
        if (editAcceso) {
          await actualizarAccesoDirecto(editAcceso.clave, payload)
          toast.success("Acceso directo actualizado")
        } else {
          await crearAccesoDirecto(payload)
          toast.success("Acceso directo creado")
        }
        setAccesoDialogOpen(false)
        setEditAcceso(null)
        setAccesoImagen("")
      } catch {
        toast.error("Error al guardar acceso directo")
      }
    })
  }

  async function handleAccesoImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("La imagen no puede superar 2MB"); return }
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return }
    setAccesoUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/acceso", { method: "POST", body: fd })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error") }
      const data = await res.json()
      setAccesoImagen(data.url)
      toast.success("Imagen subida")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen")
    } finally { setAccesoUploading(false) }
  }

  const editCom = editItem as ComunicadoRow | null

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-0">
          {([
            { key: "comunicados" as Tab, label: "Comunicados", icon: MegaphoneIcon },
            { key: "noticias" as Tab, label: "Noticias", icon: ImageIcon },
            { key: "accesos" as Tab, label: "Accesos directos", icon: Link2Icon },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t.key ? "border-[#FFB300] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {tab === "comunicados"
                ? "Gestión de comunicados"
                : tab === "noticias"
                  ? "Gestión de noticias"
                  : "Gestión de accesos directos"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "comunicados"
                ? "Comunicados que aparecen en la landing page"
                : tab === "noticias"
                  ? "Noticias visibles en la página principal"
                  : "Enlaces a sistemas y sitios institucionales (menú Aplicaciones)"}
            </p>
          </div>
          {puedeCrear && (
            <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20" onClick={openCreate}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nuevo {tab === "comunicados" ? "comunicado" : tab === "noticias" ? "noticia" : "acceso"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{tab === "comunicados" ? comunicados.length : tab === "noticias" ? noticias.length : accesosDirectos.length}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{tab === "comunicados" ? comunicados.filter(c => c.estado === "publicado").length : tab === "noticias" ? noticias.filter(b => b.activo).length : accesosDirectos.filter(a => a.activo).length}</div><div className="text-xs text-muted-foreground">{tab === "comunicados" ? "Publicados" : "Activos"}</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-amber-500">{tab === "comunicados" ? comunicados.filter(c => c.estado !== "publicado").length : tab === "noticias" ? noticias.filter(b => !b.activo).length : accesosDirectos.filter(a => !a.activo).length}</div><div className="text-xs text-muted-foreground">{tab === "comunicados" ? "Borrador/Pendiente" : "Inactivos"}</div></CardContent></Card>
        </div>

        {tab === "comunicados" && (
          <DataTable data={comunicados.map(c => ({ ...c, fecha: c.createdAt.toLocaleDateString("es-BO") }))} searchKey="titulo" searchPlaceholder="Buscar comunicado..."
            columns={[
              {
                key: "titulo", label: "Título", render: (row) => (
                  <button type="button" onClick={() => { setViewItem(row as unknown as ComunicadoRow); setViewOpen(true) }}
                    className="font-medium text-left hover:text-[#FFB300] transition-colors hover:underline">
                    {row.titulo}
                  </button>
                )
              },
              { key: "contenido", label: "Contenido", render: (row) => <span className="text-sm text-muted-foreground line-clamp-1">{row.contenido}</span> },
              {
                key: "archivoTipo", label: "Adjunto", render: (row) => {
                  if (!row.archivoUrl) return <span className="text-muted-foreground text-xs">—</span>
                  return row.archivoTipo === "imagen"
                    ? <span className="inline-flex items-center gap-1 text-xs text-blue-600"><ImageIcon className="h-3.5 w-3.5" />Imagen</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-red-600"><FileTextIcon className="h-3.5 w-3.5" />PDF</span>
                }
              },
              { key: "fecha", label: "Fecha" },
              { key: "destacado", label: "Destacado", render: (row) => <span>{row.destacado ? "⭐" : "—"}</span> },
              { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "publicado" | "borrador" | "pendiente"} /> },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button type="button" title="Ver" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 active:scale-95" onClick={() => { setViewItem(row as unknown as ComunicadoRow); setViewOpen(true) }}><EyeIcon className="h-4 w-4" /></button>
                {puedeEditarCom && (
                  <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => openEdit(row as unknown as ComunicadoRow)}><PencilIcon className="h-4 w-4" /></button>
                )}
                {puedeEliminarCom && (
                  <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => startTransition(async () => { await eliminarComunicado(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
                )}
              </div>
            )}
          />
        )}

        {tab === "noticias" && (
          <DataTable data={noticias.map(b => ({ ...b, fecha: b.createdAt.toLocaleDateString("es-BO") }))} searchKey="titulo" searchPlaceholder="Buscar noticia..."
            columns={[
              {
                key: "titulo", label: "Título", render: (row) => {
                  const noticia = row as unknown as NoticiaRow
                  const imgs: string[] = []
                  if (noticia.imagenes) { try { imgs.push(...JSON.parse(noticia.imagenes)) } catch { /* */ } }
                  else if (noticia.imagen) { imgs.push(noticia.imagen) }
                  return (
                    <div className="flex items-center gap-3">
                      {imgs.length > 0 ? (
                        <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/30 overflow-hidden border border-border/40 relative">
                          <img src={imgs[0]} alt={row.titulo} className="h-full w-full object-cover" />
                          {imgs.length > 1 && <span className="absolute bottom-0 right-0 text-[9px] font-bold bg-[#FFB300] text-[#1a1000] px-1 rounded-tl">+{imgs.length - 1}</span>}
                        </div>
                      ) : null}
                      <span className="font-medium">{row.titulo}</span>
                    </div>
                  )
                }
              },
              { key: "descripcion", label: "Descripción", render: (row) => <span className="text-sm text-muted-foreground">{row.descripcion || "—"}</span> },
              { key: "enlace", label: "Enlace", render: (row) => <span className="text-xs">{row.enlace || "—"}</span> },
              { key: "fecha", label: "Fecha" },
              { key: "activo", label: "Estado", render: (row) => <StatusBadge status={row.activo ? "activo" : "inactivo"} /> },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                {puedeEditarNot && (
                  <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => {
                    const noticia = row as unknown as NoticiaRow
                    setEditItem(noticia)
                    // Cargar imágenes existentes
                    const imgs: string[] = []
                    if (noticia.imagenes) {
                      try { imgs.push(...JSON.parse(noticia.imagenes)) } catch { /* ignore */ }
                    } else if (noticia.imagen) {
                      imgs.push(noticia.imagen)
                    }
                    setNoticiaImagenes(imgs)
                    setDialogOpen(true)
                  }}><PencilIcon className="h-4 w-4" /></button>
                )}
                {puedeEliminarNot && (
                  <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => startTransition(async () => { await eliminarBanner(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
                )}
              </div>
            )}
          />
        )}

        {tab === "accesos" && (
          <DataTable
            data={accesosDirectos.map((a) => ({
              ...a,
              fecha: a.updatedAt.toLocaleDateString("es-BO"),
            }))}
            searchKey="titulo"
            searchPlaceholder="Buscar acceso directo..."
            columns={[
              {
                key: "titulo",
                label: "Aplicación",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    {(row as unknown as AccesoDirectoRow).imagen ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/30 overflow-hidden border border-border/40">
                        <img src={(row as unknown as AccesoDirectoRow).imagen} alt={row.titulo} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFB300]/10">
                        <Link2Icon className="h-4 w-4 text-[#FF8800]" />
                      </div>
                    )}
                    <span className="font-medium">{row.titulo}</span>
                  </div>
                ),
              },
              {
                key: "url",
                label: "Enlace",
                render: (row) => (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[380px] items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <span className="truncate">{row.url}</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ),
              },
              {
                key: "descripcion",
                label: "Descripción",
                render: (row) => (
                  <span className="line-clamp-1 text-sm text-muted-foreground">
                    {row.descripcion || "—"}
                  </span>
                ),
              },
              { key: "fecha", label: "Actualizado" },
              {
                key: "activo",
                label: "Estado",
                render: (row) => <StatusBadge status={row.activo ? "activo" : "inactivo"} />,
              },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  title="Abrir enlace"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 active:scale-95"
                  onClick={() => window.open(row.url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </button>
                {puedeEditarAcc && (
                  <button
                    type="button"
                    title="Editar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95"
                    onClick={() => { setEditAcceso(row as unknown as AccesoDirectoRow); setAccesoImagen((row as unknown as AccesoDirectoRow).imagen || ""); setAccesoDialogOpen(true) }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
                {puedeEliminarAcc && (
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={isPending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => startTransition(async () => { await eliminarAccesoDirecto(row.clave); toast.success("Eliminado") })}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* ── Dialog crear/editar ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditItem(null); resetFileState() } }}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[860px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-0 gap-0 rounded-2xl border-border/50">
          <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]" /><div className="flex-1 bg-[#FFB300]" /><div className="flex-1 bg-[#2E7D32]" /></div>
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight break-words">
              {tab === "comunicados" ? (editItem ? "Editar comunicado" : "Nuevo comunicado") : (editItem ? "Editar noticia" : "Nueva noticia")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {tab === "comunicados" ? "Completa los datos para el comunicado institucional" : "Configura la noticia para la página principal"}
            </p>
          </DialogHeader>

          {tab === "comunicados" ? (
            <form onSubmit={handleComSubmit} className="px-6 pb-6 pt-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Título del comunicado *</Label>
                <Input name="titulo" required defaultValue={editCom?.titulo} placeholder="Ej: Rendición Pública de Cuentas Final 2025" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Contenido *</Label>
                <textarea name="contenido" required defaultValue={editCom?.contenido}
                  placeholder="Escribe el contenido del comunicado..."
                  className="flex w-full rounded-xl border border-input bg-transparent px-3 py-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[140px] resize-y" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Estado</Label>

                  <Select
                    defaultValue={editCom?.estado ?? "borrador"}
                    onValueChange={(value) => {
                      const input = document.getElementById("estado-hidden") as HTMLInputElement
                      if (input) input.value = value
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 👇 ESTE ES CLAVE */}
                  <input
                    type="hidden"
                    name="estado"
                    id="estado-hidden"
                    defaultValue={editCom?.estado ?? "borrador"}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="destacado" defaultChecked={editCom?.destacado} className="h-4 w-4 rounded border-input" />
                    <span className="text-sm font-medium">⭐ Destacado</span>
                  </label>
                </div>
              </div>

              {/* Zona archivo */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Imagen o PDF adjunto</Label>
                <p className="text-xs text-muted-foreground">Sube una imagen (JPG, PNG, WebP, GIF) o un archivo PDF. Máximo 5 MB.</p>
                {!archivoUrl ? (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 transition-colors hover:border-[#FFB300]/50 hover:bg-muted/40 disabled:opacity-50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB300]/10">
                      <UploadIcon className={`h-6 w-6 text-[#FFB300] ${uploading ? "animate-bounce" : ""}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{uploading ? "Subiendo archivo..." : "Haz clic para seleccionar un archivo"}</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF o PDF</p>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                    {archivoTipo === "imagen" && (
                      <div className="relative bg-muted/30 flex items-center justify-center p-4">
                        <img src={archivoUrl} alt={archivoNombre ?? "Preview"} className="max-h-[250px] rounded-lg object-contain shadow-md" />
                      </div>
                    )}
                    {archivoTipo === "pdf" && (
                      <div className="flex items-center justify-center gap-3 bg-muted/30 p-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
                          <FileTextIcon className="h-7 w-7 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold break-all">{archivoNombre}</p>
                          <p className="text-xs text-muted-foreground">Documento PDF</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {archivoTipo === "imagen" ? <ImageIcon className="h-4 w-4 text-[#FFB300] shrink-0" /> : <FileTextIcon className="h-4 w-4 text-red-500 shrink-0" />}
                        <span className="text-sm truncate">{archivoNombre}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => fileRef.current?.click()}>Reemplazar</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={resetFileState}><Trash2Icon className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileUpload} className="hidden" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetFileState() }} className="rounded-xl">Cancelar</Button>
                <Button type="submit" disabled={isPending || uploading}
                  className="rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20">
                  {isPending ? "Guardando..." : editItem ? "Guardar cambios" : "Publicar comunicado"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBannerSubmit} className="px-6 pb-6 pt-4 space-y-5">
              <div className="space-y-2"><Label className="text-sm font-semibold">Título *</Label><Input name="titulo" required defaultValue={(editItem as NoticiaRow | null)?.titulo} placeholder="Ej: Nueva convocatoria institucional" className="h-11 rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Descripción</Label><textarea name="descripcion" defaultValue={(editItem as NoticiaRow | null)?.descripcion ?? ""} placeholder="Describe brevemente la noticia..." className="flex w-full rounded-xl border border-input bg-transparent px-3 py-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-y" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Enlace (opcional)</Label><Input name="enlace" defaultValue={(editItem as NoticiaRow | null)?.enlace ?? ""} placeholder="https://..." className="h-11 rounded-xl" /></div>

              {/* Imagen de la noticia */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Imágenes de la noticia</Label>
                <p className="text-xs text-muted-foreground">Sube una o varias imágenes (JPG, PNG, WebP, GIF). Máximo 5 MB cada una. Las imágenes rotarán automáticamente en la landing.</p>

                {/* Galería de imágenes cargadas */}
                {noticiaImagenes.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {noticiaImagenes.map((img, idx) => (
                      <div key={idx} className="group relative rounded-xl border border-border/50 bg-muted/20 overflow-hidden aspect-video">
                        <img src={img} alt={`Imagen ${idx + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:text-red-400 hover:bg-transparent"
                            onClick={() => setNoticiaImagenes((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-[#FFB300] text-[#1a1000] px-1.5 py-0.5 rounded">Principal</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón agregar imagen */}
                <button type="button" onClick={() => noticiaFileRef.current?.click()} disabled={noticiaUploading}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-5 transition-colors hover:border-[#FFB300]/50 hover:bg-muted/40 disabled:opacity-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB300]/10">
                    <UploadIcon className={`h-5 w-5 text-[#FFB300] ${noticiaUploading ? "animate-bounce" : ""}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{noticiaUploading ? "Subiendo..." : noticiaImagenes.length > 0 ? "Agregar más imágenes" : "Seleccionar imágenes"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP o GIF</p>
                  </div>
                </button>
                <input ref={noticiaFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleNoticiaImageUpload} className="hidden" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="activo" defaultChecked={editItem ? (editItem as NoticiaRow).activo : true} className="h-4 w-4 rounded" />
                <span className="text-sm font-medium">Activo</span>
              </label>
              <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setNoticiaImagenes([]) }} className="rounded-xl">Cancelar</Button>
                <Button type="submit" disabled={isPending || noticiaUploading} className="rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20">
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={accesoDialogOpen} onOpenChange={(v) => { if (!v) { setAccesoDialogOpen(false); setEditAcceso(null); setAccesoImagen("") } }}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[760px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-0 gap-0 rounded-2xl border-border/50">
          <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]" /><div className="flex-1 bg-[#FFB300]" /><div className="flex-1 bg-[#2E7D32]" /></div>
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight break-words">
              {editAcceso ? "Editar acceso directo" : "Nuevo acceso directo"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configura enlaces a sistemas y sitios institucionales que se mostrarán en el menú Aplicaciones.
            </p>
          </DialogHeader>

          <form onSubmit={handleAccesoSubmit} className="space-y-5 px-6 pb-6 pt-4">
            {/* Imagen de la app */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Imagen / Logo de la aplicación</Label>
              <p className="text-xs text-muted-foreground">Sube el logo o ícono de la aplicación (JPG, PNG, WebP, GIF). Máximo 2 MB.</p>
              {!accesoImagen ? (
                <button type="button" onClick={() => accesoFileRef.current?.click()} disabled={accesoUploading}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 transition-colors hover:border-[#FFB300]/50 hover:bg-muted/40 disabled:opacity-50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB300]/10">
                    <UploadIcon className={`h-6 w-6 text-[#FFB300] ${accesoUploading ? "animate-bounce" : ""}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{accesoUploading ? "Subiendo imagen..." : "Haz clic para seleccionar una imagen"}</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP o GIF</p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                  <div className="relative bg-muted/30 flex items-center justify-center p-4">
                    <img src={accesoImagen} alt="Logo de la app" className="max-h-[160px] rounded-lg object-contain shadow-md" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="h-4 w-4 text-[#FFB300] shrink-0" />
                      <span className="text-sm truncate">Imagen cargada</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => accesoFileRef.current?.click()}>Reemplazar</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setAccesoImagen("")}><Trash2Icon className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              )}
              <input ref={accesoFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAccesoImageUpload} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nombre de la aplicación *</Label>
              <Input
                name="titulo"
                required
                defaultValue={editAcceso?.titulo}
                placeholder="Ej: Sistema de Gestión SIGEC"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Enlace (URL) *</Label>
              <Input
                name="url"
                type="url"
                required
                defaultValue={editAcceso?.url}
                placeholder="https://sigec.correos.gob.bo/login?url="
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descripción</Label>
              <Input
                name="descripcion"
                defaultValue={editAcceso?.descripcion}
                placeholder="Descripción corta para el acceso"
                className="h-11 rounded-xl"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={editAcceso ? editAcceso.activo : true}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm font-medium">Activo</span>
            </label>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAccesoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || accesoUploading}
                className="rounded-xl border-0 bg-gradient-to-r from-[#FFB300] to-[#FF8800] font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20"
              >
                {isPending ? "Guardando..." : editAcceso ? "Guardar cambios" : "Crear acceso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal ver comunicado (grande, profesional) ── */}
      <Dialog open={viewOpen} onOpenChange={(v) => { if (!v) { setViewOpen(false); setViewItem(null) } }}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[980px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-0 gap-0 rounded-2xl border-border/50">
          <DialogTitle className="sr-only">{viewItem?.titulo ?? "Vista previa de comunicado"}</DialogTitle>
          {viewItem && (
            <>
              <div className="flex h-2 w-full rounded-t-2xl overflow-hidden">
                <div className="flex-1 bg-[#C41E3A]" />
                <div className="flex-1 bg-[#FFB300]" />
                <div className="flex-1 bg-[#2E7D32]" />
              </div>

              <div className="flex items-center justify-between px-8 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <img src="/image/Logooriginal.png" alt="AGBC" className="h-10 object-contain dark:hidden" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  <img src="/image/LogoAmarillo.png" alt="AGBC" className="h-10 object-contain hidden dark:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFB300]">Correos de Bolivia</p>
                  <p className="text-[10px] text-muted-foreground">Agencia Boliviana de Correos</p>
                </div>
              </div>

              <div className="px-8 pb-8 pt-2">
                <div className="text-center mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB300] mb-2">Comunicado</p>
                  <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{viewItem.titulo}</h2>
                  <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FF8800]" />
                </div>

                <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDate(viewItem.createdAt)}</span>
                  </div>
                  <StatusBadge status={viewItem.estado as "publicado" | "borrador" | "pendiente"} />
                  {viewItem.destacado && <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold">⭐ Destacado</span>}
                </div>

                <div className="rounded-xl bg-muted/20 border border-border/30 p-6 mb-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewItem.contenido}</p>
                </div>

                {viewItem.archivoUrl && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Archivo adjunto</p>
                    {viewItem.archivoTipo === "imagen" ? (
                      <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/10 flex items-center justify-center p-4">
                        <img src={viewItem.archivoUrl} alt={viewItem.archivoNombre ?? "Imagen"} className="max-h-[400px] rounded-lg object-contain shadow-lg" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
                            <FileTextIcon className="h-7 w-7 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{viewItem.archivoNombre}</p>
                            <p className="text-xs text-muted-foreground">Documento PDF adjunto</p>
                          </div>
                          <a href={viewItem.archivoUrl} download={viewItem.archivoNombre ?? "documento.pdf"} className="shrink-0">
                            <Button variant="outline" size="sm" className="rounded-xl"><DownloadIcon className="mr-1 h-4 w-4" />Descargar</Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center border-t border-border/30 pt-5">
                  <p className="text-xs text-muted-foreground">Agradecemos de antemano su participación.</p>
                  <p className="mt-2 text-sm font-bold tracking-wide">CORREOS DE BOLIVIA</p>
                  <div className="mx-auto mt-1 h-0.5 w-12 bg-[#FFB300]" />
                  <p className="mt-2 text-[10px] text-muted-foreground">www.correos.gob.bo</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
