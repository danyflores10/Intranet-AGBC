"use client"

import { useState, useTransition, useRef, useMemo } from "react"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MegaphoneIcon,
  ImageIcon,
  UploadIcon,
  FileTextIcon,
  EyeIcon,
  CalendarIcon,
  DownloadIcon,
  Link2Icon,
  ExternalLinkIcon,
  LayoutGridIcon,
  TableIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  CheckCircle2Icon,
  SearchIcon,
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
type NoticiaSubTab = "todas" | "institucionales" | "facebook"
type AccesoCategoria = "todas" | "Links Internos" | "Links Públicos" | "Links Operativos" | "Consultas y Soporte"

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
  categoria?: string
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

function isNoticiaFacebook(n: NoticiaRow): boolean {
  return Boolean(
    (n.id && n.id.startsWith("noticia_fb_")) ||
    (n.enlace && n.enlace.includes("facebook.com")) ||
    (n.descripcion && n.descripcion.toLowerCase().includes("facebook"))
  )
}

export function ComunicacionesModule({ comunicados, noticias, accesosDirectos, usuario }: Props) {
  const [tab, setTab] = useState<Tab>("comunicados")
  const [noticiaSubTab, setNoticiaSubTab] = useState<NoticiaSubTab>("todas")
  const [accesoCategoria, setAccesoCategoria] = useState<AccesoCategoria>("todas")
  const [searchQuery, setSearchQuery] = useState("")

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
  const [accesoCategoriaForm, setAccesoCategoriaForm] = useState<string>("Links Operativos")
  const [accesoUploading, setAccesoUploading] = useState(false)

  const noticiaFileRef = useRef<HTMLInputElement>(null)
  const [noticiaImagenes, setNoticiaImagenes] = useState<string[]>([])
  const [noticiaUploading, setNoticiaUploading] = useState(false)
  const [noticiaTipoForm, setNoticiaTipoForm] = useState<"institucional" | "facebook">("institucional")
  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])

  const puedeCrear = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.CREAR] }, accessContext),
    [accessContext],
  )
  const puedeEditar = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.EDITAR] }, accessContext),
    [accessContext],
  )
  const puedeEliminar = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.ELIMINAR] }, accessContext),
    [accessContext],
  )

  const editCom = editItem && "contenido" in editItem ? (editItem as ComunicadoRow) : null
  const editNot = editItem && !("contenido" in editItem) ? (editItem as NoticiaRow) : null

  function resetFileState() {
    setArchivoUrl(null)
    setArchivoNombre(null)
    setArchivoTipo(null)
  }

  function openCreate() {
    setEditItem(null)
    resetFileState()
    setNoticiaImagenes([])
    setNoticiaTipoForm("institucional")
    if (tab === "accesos") {
      setEditAcceso(null)
      setAccesoImagen("")
      setAccesoCategoriaForm("Links Operativos")
      setAccesoDialogOpen(true)
    } else {
      setDialogOpen(true)
    }
  }

  function openEdit(item: ComunicadoRow | NoticiaRow) {
    setEditItem(item)
    if ("contenido" in item) {
      setArchivoUrl(item.archivoUrl)
      setArchivoNombre(item.archivoNombre)
      setArchivoTipo(item.archivoTipo)
    } else {
      const isFb = isNoticiaFacebook(item)
      setNoticiaTipoForm(isFb ? "facebook" : "institucional")
      try {
        const parsed = item.imagenes ? JSON.parse(item.imagenes) : []
        setNoticiaImagenes(Array.isArray(parsed) && parsed.length > 0 ? parsed : item.imagen ? [item.imagen] : [])
      } catch {
        setNoticiaImagenes(item.imagen ? [item.imagen] : [])
      }
    }
    setDialogOpen(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar 10MB")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/comunicado", { method: "POST", body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Error al subir archivo")
      }
      const data = await res.json()
      setArchivoUrl(data.url)
      setArchivoNombre(data.nombre)
      setArchivoTipo(data.tipo)
      toast.success("Archivo subido correctamente")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir")
    } finally {
      setUploading(false)
    }
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
          await actualizarComunicado((editItem as ComunicadoRow).id, payload)
          toast.success("Comunicado actualizado")
        } else {
          await crearComunicado(payload)
          toast.success("Comunicado creado")
        }
        setDialogOpen(false)
        setEditItem(null)
        resetFileState()
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  async function handleBannerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const imagenesJson = noticiaImagenes.length > 0 ? JSON.stringify(noticiaImagenes) : undefined
        const primeraImagen = noticiaImagenes[0] || undefined
        const enlaceInput = (fd.get("enlace") as string) || undefined

        if (editItem) {
          await actualizarBanner((editItem as NoticiaRow).id, {
            titulo: fd.get("titulo") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            enlace: enlaceInput,
            imagen: primeraImagen,
            imagenes: imagenesJson,
            activo: fd.get("activo") === "on",
          })
          toast.success("Noticia actualizada")
        } else {
          await crearBanner({
            titulo: fd.get("titulo") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            enlace: enlaceInput,
            imagen: primeraImagen,
            imagenes: imagenesJson,
            activo: fd.get("activo") === "on",
          })
          toast.success("Noticia creada")
        }
        setDialogOpen(false)
        setEditItem(null)
        setNoticiaImagenes([])
      } catch {
        toast.error("Error al guardar noticia")
      }
    })
  }

  async function handleNoticiaImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setNoticiaUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} supera 8MB`)
          continue
        }
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} no es una imagen`)
          continue
        }
        const fd = new FormData()
        fd.append("archivo", file)
        const res = await fetch("/api/upload/comunicado", { method: "POST", body: fd })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || "Error")
        }
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
          categoria: accesoCategoriaForm || "Links Operativos",
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
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    setAccesoUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/acceso", { method: "POST", body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Error")
      }
      const data = await res.json()
      setAccesoImagen(data.url)
      toast.success("Imagen subida")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen")
    } finally {
      setAccesoUploading(false)
    }
  }

  // ── Cálculos y Filtrados ──
  const noticiasInstitucionales = useMemo(() => {
    return noticias.filter((n) => !isNoticiaFacebook(n))
  }, [noticias])

  const noticiasFacebook = useMemo(() => {
    return noticias.filter((n) => isNoticiaFacebook(n))
  }, [noticias])

  const filteredComunicados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return comunicados
    return comunicados.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.contenido.toLowerCase().includes(q)
    )
  }, [comunicados, searchQuery])

  const filteredNoticias = useMemo(() => {
    let list = noticias
    if (noticiaSubTab === "institucionales") list = noticiasInstitucionales
    if (noticiaSubTab === "facebook") list = noticiasFacebook

    const q = searchQuery.toLowerCase().trim()
    if (!q) return list
    return list.filter(
      (n) =>
        n.titulo.toLowerCase().includes(q) ||
        (n.descripcion && n.descripcion.toLowerCase().includes(q))
    )
  }, [noticias, noticiasInstitucionales, noticiasFacebook, noticiaSubTab, searchQuery])

  const filteredAccesos = useMemo(() => {
    let list = accesosDirectos
    if (accesoCategoria !== "todas") {
      list = accesosDirectos.filter((a) => (a.categoria || "Links Operativos") === accesoCategoria)
    }

    const q = searchQuery.toLowerCase().trim()
    if (!q) return list
    return list.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(q))
    )
  }, [accesosDirectos, accesoCategoria, searchQuery])

  const currentList =
    tab === "comunicados"
      ? filteredComunicados
      : tab === "noticias"
      ? filteredNoticias
      : filteredAccesos

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setSearchQuery("")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <MegaphoneIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Gestión de Contenidos y Comunicaciones
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Publica comunicados oficiales, noticias institucionales y enlaces a sistemas externos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {puedeCrear && (
            <Button
              onClick={openCreate}
              className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-2xl shadow-md shadow-[#0E5296]/20 cursor-pointer text-xs"
            >
              <PlusIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
              Nuevo {tab === "comunicados" ? "Comunicado" : tab === "noticias" ? "Noticia" : "Acceso"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs de Navegación Principales ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-[#002F6C]/10 w-fit">
        {([
          { key: "comunicados" as Tab, label: "Comunicados Oficiales", icon: MegaphoneIcon, count: comunicados.length },
          { key: "noticias" as Tab, label: "Noticias", icon: ImageIcon, count: noticias.length },
          { key: "accesos" as Tab, label: "Accesos Directos", icon: Link2Icon, count: accesosDirectos.length },
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

      {/* ── Sub-categorías para Noticias ── */}
      {tab === "noticias" && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 border border-[#002F6C]/10 p-2.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#002F6C] mr-1">Subcategoría:</span>
            {[
              { key: "todas" as NoticiaSubTab, label: "Todas las Noticias", count: noticias.length },
              { key: "institucionales" as NoticiaSubTab, label: "Noticias Institucionales", count: noticiasInstitucionales.length },
              { key: "facebook" as NoticiaSubTab, label: "Redes Sociales (Facebook / Reels)", count: noticiasFacebook.length },
            ].map((sub) => (
              <button
                key={sub.key}
                onClick={() => setNoticiaSubTab(sub.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  noticiaSubTab === sub.key
                    ? "bg-[#0E5296] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#002F6C]"
                }`}
              >
                <span>{sub.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  noticiaSubTab === sub.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {sub.count}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              startTransition(async () => {
                const { sincronizarNoticiasManual } = await import("@/actions/comunicaciones")
                await sincronizarNoticiasManual()
                toast.success("Noticias sincronizadas exitosamente")
              })
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFCC00]/20 text-[#002F6C] border border-[#FFCC00]/40 hover:bg-[#FFCC00]/35 transition-colors cursor-pointer"
          >
            <SparklesIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            <span>Sincronizar Noticias (24h)</span>
          </button>
        </div>
      )}

      {/* ── Sub-categorías para Accesos Directos (PDF Oficial) ── */}
      {tab === "accesos" && (
        <div className="flex flex-wrap items-center gap-2 bg-white/70 border border-[#002F6C]/10 p-2.5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-[#002F6C] mr-1">Categorías PDF:</span>
          {[
            { key: "todas" as AccesoCategoria, label: "Todos los Sistemas", count: accesosDirectos.length },
            { key: "Links Internos" as AccesoCategoria, label: "Links Internos", count: accesosDirectos.filter(a => a.categoria === "Links Internos").length },
            { key: "Links Públicos" as AccesoCategoria, label: "Links Públicos", count: accesosDirectos.filter(a => a.categoria === "Links Públicos").length },
            { key: "Links Operativos" as AccesoCategoria, label: "Links Operativos", count: accesosDirectos.filter(a => (a.categoria || "Links Operativos") === "Links Operativos").length },
            { key: "Consultas y Soporte" as AccesoCategoria, label: "Consultas y Soporte", count: accesosDirectos.filter(a => a.categoria === "Consultas y Soporte").length },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setAccesoCategoria(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                accesoCategoria === cat.key
                  ? "bg-[#0E5296] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#002F6C]"
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                accesoCategoria === cat.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Tarjetas Métricas ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            <MegaphoneIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "comunicados" ? comunicados.length : tab === "noticias" ? noticias.length : accesosDirectos.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Total Registrados</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            <CheckCircle2Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "comunicados"
                ? comunicados.filter(c => c.estado === "publicado").length
                : tab === "noticias"
                ? noticias.filter(b => b.activo).length
                : accesosDirectos.filter(a => a.activo).length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Publicados / Activos</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-[#002F6C]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "comunicados"
                ? comunicados.filter(c => c.destacado).length
                : tab === "noticias"
                ? noticias.filter(b => !b.activo).length
                : accesosDirectos.filter(a => !a.activo).length}
            </div>
            <div className="text-xs text-slate-600 font-bold">
              {tab === "comunicados" ? "Destacados ⭐" : "En Borrador / Inactivos"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder={`Buscar en ${tab === "comunicados" ? "comunicados" : tab === "noticias" ? "noticias" : "sistemas"}...`}
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
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-amber-50/50 text-[11px] font-black uppercase text-[#002F6C] tracking-wider">
                <th className="py-3 px-4">Elemento / Título</th>
                {tab === "noticias" && <th className="py-3 px-4">Subcategoría / Fuente</th>}
                {tab === "accesos" && <th className="py-3 px-4">Categoría PDF</th>}
                <th className="py-3 px-4">Detalles / Enlace</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No hay registros disponibles en esta categoría.
                  </td>
                </tr>
              ) : (
                currentList.map((item: any) => {
                  const isFb = tab === "noticias" && isNoticiaFacebook(item)
                  return (
                    <tr key={item.id || item.clave} className="hover:bg-blue-50/30 transition-colors">
                      {/* Elemento / Título */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {tab === "comunicados" ? (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black shadow-xs">
                              <MegaphoneIcon className="h-5 w-5" />
                            </div>
                          ) : tab === "noticias" ? (
                            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {item.imagen ? (
                                <img src={item.imagen} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[#002F6C]">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                              {isFb && (
                                <span className="absolute bottom-0.5 right-0.5 rounded bg-[#1877F2] text-white p-0.5 text-[8px]">
                                  FB
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                              {item.imagen ? (
                                <img src={item.imagen} alt="" className="h-full w-full object-contain p-1" />
                              ) : (
                                <Link2Icon className="h-5 w-5 text-[#0E5296]" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0 max-w-[260px]">
                            <p className="font-bold text-[#002F6C] truncate">{item.titulo}</p>
                            {item.destacado && (
                              <span className="text-[10px] text-amber-600 font-bold">⭐ Destacado</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Subcategoría en Noticias */}
                      {tab === "noticias" && (
                        <td className="py-3 px-4">
                          {isFb ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 px-2.5 py-0.5 text-[10px] font-black uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                              Red Social (Facebook)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-700 px-2.5 py-0.5 text-[10px] font-black uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                              Noticia Institucional
                            </span>
                          )}
                        </td>
                      )}

                      {/* Categoría en Accesos Directos */}
                      {tab === "accesos" && (
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                            item.categoria === "Links Internos"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : item.categoria === "Links Públicos"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : item.categoria === "Consultas y Soporte"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}>
                            {item.categoria || "Links Operativos"}
                          </span>
                        </td>
                      )}

                      {/* Detalles / Enlace */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-slate-600 truncate font-medium">
                          {tab === "comunicados"
                            ? item.contenido
                            : tab === "noticias"
                            ? (item.descripcion || item.enlace || "—")
                            : item.url}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          (item.estado === "publicado" || item.activo) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${(item.estado === "publicado" || item.activo) ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {(item.estado === "publicado" || item.activo) ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 text-slate-500">
                        {tab === "accesos" ? "—" : formatDate(item.createdAt)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tab === "comunicados" && (
                            <button
                              onClick={() => {
                                setViewItem(item)
                                setViewOpen(true)
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Ver"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(tab === "accesos" || tab === "noticias") && item.enlace && (
                            <a
                              href={item.enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Abrir enlace externo"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          )}
                          {tab === "accesos" && item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Abrir enlace"
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </a>
                          )}
                          {puedeEditar && (
                            <button
                              onClick={() => {
                                if (tab === "accesos") {
                                  setEditAcceso(item)
                                  setAccesoImagen(item.imagen || "")
                                  setAccesoCategoriaForm(item.categoria || "Links Operativos")
                                  setAccesoDialogOpen(true)
                                } else {
                                  openEdit(item)
                                }
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              onClick={() => {
                                startTransition(async () => {
                                  if (tab === "comunicados") await eliminarComunicado(item.id)
                                  else if (tab === "noticias") await eliminarBanner(item.id)
                                  else await eliminarAccesoDirecto(item.clave)
                                  toast.success("Eliminado correctamente")
                                })
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

      {/* ── Modal Crear/Editar Comunicado o Noticia ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-xl rounded-3xl border-2 border-[#002F6C]/15 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#002F6C]">
              {editItem
                ? `Editar ${tab === "comunicados" ? "Comunicado" : "Noticia"}`
                : `Nueva ${tab === "comunicados" ? "Comunicado" : "Noticia"}`}
            </DialogTitle>
          </DialogHeader>

          {tab === "comunicados" ? (
            <form onSubmit={handleComSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Título del Comunicado *</Label>
                <Input name="titulo" required defaultValue={editCom?.titulo} placeholder="Ej: Rendición Pública de Cuentas" className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Contenido *</Label>
                <textarea
                  name="contenido"
                  required
                  defaultValue={editCom?.contenido}
                  placeholder="Escribe el texto del comunicado..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0E5296] min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Estado</Label>
                  <Select defaultValue={editCom?.estado ?? "publicado"} onValueChange={(v) => {
                    const el = document.getElementById("estado-com-hidden") as HTMLInputElement
                    if (el) el.value = v
                  }}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="estado" id="estado-com-hidden" defaultValue={editCom?.estado ?? "publicado"} />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="destacado" name="destacado" defaultChecked={editCom?.destacado} className="h-4 w-4 rounded" />
                  <label htmlFor="destacado" className="text-xs font-bold text-[#002F6C] cursor-pointer">⭐ Destacar en Inicio</label>
                </div>
              </div>

              {/* Subida de Archivo */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold text-[#002F6C]">Imagen o PDF Adjunto</Label>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                {!archivoUrl ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0E5296]/30 bg-blue-50/20 p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <UploadIcon className="h-6 w-6 text-[#0E5296] mb-1" />
                    <span className="text-xs font-bold text-[#002F6C]">{uploading ? "Subiendo..." : "Subir Imagen o PDF"}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-medium truncate max-w-[280px]">{archivoNombre || "Archivo adjunto"}</span>
                    <button type="button" onClick={() => setArchivoUrl(null)} className="text-red-500 hover:text-red-700">
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs">Cancelar</Button>
                <Button type="submit" disabled={isPending || uploading} className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs">
                  {isPending ? "Guardando..." : "Guardar Comunicado"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBannerSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Título de la Noticia / Publicación *</Label>
                <Input name="titulo" required defaultValue={editNot?.titulo} placeholder="Ej: Nueva sucursal en El Alto o Publicación de Facebook" className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Descripción / Texto</Label>
                <textarea
                  name="descripcion"
                  defaultValue={editNot?.descripcion || ""}
                  placeholder="Detalle o texto de la noticia..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0E5296] min-h-[90px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Enlace Externo o Facebook (Opcional)</Label>
                <Input name="enlace" defaultValue={editNot?.enlace || ""} placeholder="https://www.facebook.com/... o https://correos.gob.bo/..." className="rounded-xl text-xs" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" name="activo" defaultChecked={editNot?.activo ?? true} className="h-4 w-4 rounded" />
                <label htmlFor="activo" className="text-xs font-bold text-[#002F6C] cursor-pointer">Noticia Activa y Visible en Intranet</label>
              </div>

              {/* Subida de Imagen */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold text-[#002F6C]">Imagen o Previsualización</Label>
                <input ref={noticiaFileRef} type="file" accept="image/*" onChange={handleNoticiaImageUpload} className="hidden" />
                {noticiaImagenes.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => noticiaFileRef.current?.click()}
                    disabled={noticiaUploading}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0E5296]/30 bg-blue-50/20 p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-6 w-6 text-[#0E5296] mb-1" />
                    <span className="text-xs font-bold text-[#002F6C]">{noticiaUploading ? "Subiendo..." : "Subir Imagen de Portada"}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <img src={noticiaImagenes[0]} alt="Portada" className="h-10 w-16 object-cover rounded-lg" />
                    <button type="button" onClick={() => setNoticiaImagenes([])} className="text-red-500 hover:text-red-700">
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs">Cancelar</Button>
                <Button type="submit" disabled={isPending || noticiaUploading} className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs">
                  {isPending ? "Guardando..." : "Guardar Noticia"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Crear/Editar Acceso Directo ── */}
      <Dialog open={accesoDialogOpen} onOpenChange={(v) => !v && setAccesoDialogOpen(false)}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-[#002F6C]/15 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#002F6C]">
              {editAcceso ? "Editar Acceso Directo" : "Nuevo Acceso Directo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAccesoSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002F6C]">Nombre del Sistema / Aplicación *</Label>
              <Input name="titulo" required defaultValue={editAcceso?.titulo} placeholder="Ej: SIGEC o Sistema de Facturación" className="rounded-xl text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002F6C]">Categoría Institucional (PDF)</Label>
              <Select defaultValue={accesoCategoriaForm} onValueChange={(val) => setAccesoCategoriaForm(val)}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Links Internos">Links Internos</SelectItem>
                  <SelectItem value="Links Públicos">Links Públicos</SelectItem>
                  <SelectItem value="Links Operativos">Links Operativos</SelectItem>
                  <SelectItem value="Consultas y Soporte">Consultas y Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002F6C]">Descripción Corta</Label>
              <Input name="descripcion" defaultValue={editAcceso?.descripcion} placeholder="Ej: Plataforma de gestión institucional" className="rounded-xl text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#002F6C]">Enlace URL / Dirección IP *</Label>
              <Input name="url" required defaultValue={editAcceso?.url} placeholder="https://sigec.correos.gob.bo o http://172.65.10.55:8116" className="rounded-xl text-xs" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="acceso-activo" name="activo" defaultChecked={editAcceso?.activo ?? true} className="h-4 w-4 rounded" />
              <label htmlFor="acceso-activo" className="text-xs font-bold text-[#002F6C] cursor-pointer">Aplicación Activa y Visible</label>
            </div>

            {/* Subida de Icono */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-[#002F6C]">Icono / Logotipo de la Aplicación</Label>
              <input ref={accesoFileRef} type="file" accept="image/*" onChange={handleAccesoImageUpload} className="hidden" />
              {!accesoImagen ? (
                <button
                  type="button"
                  onClick={() => accesoFileRef.current?.click()}
                  disabled={accesoUploading}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0E5296]/30 bg-blue-50/20 p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <Link2Icon className="h-6 w-6 text-[#0E5296] mb-1" />
                  <span className="text-xs font-bold text-[#002F6C]">{accesoUploading ? "Subiendo icono..." : "Subir Logotipo del Sistema"}</span>
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <img src={accesoImagen} alt="App logo" className="h-10 w-10 object-contain rounded-lg bg-white p-1 shadow-xs" />
                  <button type="button" onClick={() => setAccesoImagen("")} className="text-red-500 hover:text-red-700">
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setAccesoDialogOpen(false)} className="rounded-xl text-xs">Cancelar</Button>
              <Button type="submit" disabled={isPending || accesoUploading} className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs">
                {isPending ? "Guardando..." : "Guardar Acceso Directo"}
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
              <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB800] via-[#0077EE] to-[#0E5296]" />

              <div className="flex items-center justify-between px-8 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <img src="/image/Logooriginal.png" alt="AGBC" className="h-10 object-contain dark:hidden" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                  <img src="/image/LogoAmarillo.png" alt="AGBC" className="h-10 object-contain hidden dark:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFB800]">Correos de Bolivia</p>
                  <p className="text-[10px] text-muted-foreground">Agencia Boliviana de Correos</p>
                </div>
              </div>

              <div className="px-8 pb-8 pt-2">
                <div className="text-center mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB800] mb-2">Comunicado</p>
                  <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{viewItem.titulo}</h2>
                  <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#FFB800] to-[#FFB800]" />
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
    </div>
  )
}
