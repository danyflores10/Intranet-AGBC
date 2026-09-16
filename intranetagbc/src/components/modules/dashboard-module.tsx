"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  FileTextIcon,
  UsersIcon,
  MegaphoneIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  BellIcon,
  PartyPopperIcon,
  HomeIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MapPinIcon,
  Building2Icon,
  EyeIcon,
  ShieldAlertIcon,
  MailIcon,
  ExternalLinkIcon,
  SparklesIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  RotateCwIcon,
  PauseIcon,
  PlayIcon,
  TableIcon,
  SearchIcon,
  PhoneIcon,
  FileIcon,
  FileSpreadsheetIcon,
  ArrowUpRightIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PERMISOS } from "@/lib/auth/permisos"
import { puedeAcceder, crearContextoAcceso } from "@/lib/rbac"

interface EventoRow {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  fechaInicio: string
  fechaFin: string | null
  color: string | null
  notificar: boolean
  createdAt: Date
}

interface NotificacionRow {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  enlace: string | null
  createdAt: Date
}

interface PersonalItem {
  id: string
  nombre?: string
  nombres?: string
  apellidos?: string
  cargo: string
  unidad?: string
  area?: string
  regional?: string
  email: string | null
  telefono: string | null
  foto: string | null
  estado: string
}

interface DocumentoItem {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string | null
  nombreArchivo: string | null
  tipoArchivo: string | null
  tamano: string | null
  archivo: string | null
  estado: string
  createdAt: Date
}

interface UsuarioItem {
  id: string
  name: string
  firstName?: string
  lastNamePaternal?: string
  email: string
  institutionalEmail?: string
  emailVerified?: boolean
  isActive?: boolean
  roles?: Array<{ id: string; name: string }> | string[]
  createdAt?: string
}

interface ComunicadoItem {
  id: string
  titulo: string
  contenido?: string | null
  resumen?: string | null
  imagen?: string | null
  archivoUrl?: string | null
  archivoNombre?: string | null
  archivoTipo?: string | null
  destacado?: boolean
  createdAt?: Date
}

interface SucursalItem {
  id: string
  nombre: string
  departamento: string
  direccion: string
  telefono: string | null
  esCentral?: boolean
}

function getDocTypeInfo(doc: DocumentoItem) {
  const rawExt = (
    doc.tipoArchivo ||
    doc.nombreArchivo?.split(".").pop() ||
    doc.archivo?.split(".").pop() ||
    doc.categoria ||
    ""
  ).toLowerCase()

  if (rawExt.includes("pdf")) {
    return {
      label: "PDF",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      boxClass: "bg-gradient-to-br from-red-50 to-red-100/70 border-red-200 text-red-600",
      iconClass: "text-red-600",
      tag: "PDF Oficial",
    }
  }
  if (rawExt.includes("xls") || rawExt.includes("sheet") || rawExt.includes("csv") || rawExt.includes("excel")) {
    return {
      label: "EXCEL",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      boxClass: "bg-gradient-to-br from-emerald-50 to-emerald-100/70 border-emerald-200 text-emerald-600",
      iconClass: "text-emerald-600",
      tag: "Hoja de Cálculo",
    }
  }
  if (rawExt.includes("doc") || rawExt.includes("word")) {
    return {
      label: "WORD",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      boxClass: "bg-gradient-to-br from-blue-50 to-blue-100/70 border-blue-200 text-blue-600",
      iconClass: "text-blue-600",
      tag: "Documento Word",
    }
  }
  if (rawExt.includes("ppt") || rawExt.includes("powerpoint") || rawExt.includes("presentacion")) {
    return {
      label: "PPT",
      badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
      boxClass: "bg-gradient-to-br from-orange-50 to-orange-100/70 border-orange-200 text-orange-600",
      iconClass: "text-orange-600",
      tag: "Presentación",
    }
  }
  return {
    label: doc.categoria?.toUpperCase() || "OFICIAL",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    boxClass: "bg-gradient-to-br from-[#FFCC00]/20 to-[#FFCC00]/40 border-amber-200 text-[#002F6C]",
    iconClass: "text-[#002F6C]",
    tag: "Documento AGBC",
  }
}

interface Props {
  counts: {
    documentos: number
    personal: number
    comunicados: number
    usuarios: number
  }
  user: { name: string; email: string; roles: string[]; permissions: string[] }
  eventos?: EventoRow[]
  notificaciones?: NotificacionRow[]
  personal?: PersonalItem[]
  documentos?: DocumentoItem[]
  usuarios?: UsuarioItem[]
  comunicados?: ComunicadoItem[]
  sucursales?: SucursalItem[]
}

const TODOS_LOS_ACCESOS = [
  { id: "roles", label: "Gestión de Roles", desc: "Permisos y RBAC", href: "/roles", icon: ShieldAlertIcon, permission: PERMISOS.ROLES.VER },
  { id: "auditoria", label: "Auditoría y Logs", desc: "Historial del sistema", href: "/auditoria", icon: ShieldCheckIcon, permission: PERMISOS.AUDITORIA.VER },
  { id: "sucursales", label: "Oficinas Regionales", desc: "Sucursales del país", href: "/sucursales", icon: Building2Icon, permission: PERMISOS.SUCURSALES.VER },
  { id: "secciones", label: "Secciones Landing", desc: "Visibilidad pública", href: "/secciones-landing", icon: EyeIcon, permission: PERMISOS.CONTENIDOS.VER },
  { id: "rrhh", label: "Personal / RRHH", desc: "Nómina de empleados", href: "/rrhh", icon: UsersIcon, permission: PERMISOS.RRHH.VER },
  { id: "documentos", label: "Documentos", desc: "Repositorio digital", href: "/documentos", icon: FileTextIcon, permission: PERMISOS.DOCUMENTOS.VER },
  { id: "comunicaciones", label: "Comunicados", desc: "Publicaciones oficiales", href: "/comunicaciones", icon: MegaphoneIcon, permission: PERMISOS.COMUNICADOS.VER },
  { id: "usuarios", label: "Usuarios", desc: "Cuentas y accesos", href: "/usuarios", icon: UserIcon, permission: PERMISOS.USUARIOS.VER },
]

const MAX_TARJETAS_POR_CARRUSEL = 6
const TABLE_PAGE_SIZE = 10

export function DashboardModule({
  counts,
  user,
  notificaciones = [],
  personal = [],
  documentos = [],
  usuarios = [],
  comunicados = [],
  sucursales = [],
}: Props) {
  // Contexto de control de accesos RBAC
  const accessContext = useMemo(
    () =>
      crearContextoAcceso({
        id: (user as any).id || "user-session",
        name: user.name,
        email: user.email,
        roles: Array.isArray(user.roles) ? user.roles.map((r: any) => (typeof r === "string" ? r : r.name)) : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      }),
    [user]
  )

  const puedeVerUsuarios = puedeAcceder({ permissions: [PERMISOS.USUARIOS.VER] }, accessContext)
  const puedeVerRoles = puedeAcceder({ permissions: [PERMISOS.ROLES.VER] }, accessContext)
  const puedeVerAuditoria = puedeAcceder({ permissions: [PERMISOS.AUDITORIA.VER] }, accessContext)
  const puedeVerPersonal = puedeAcceder({ permissions: [PERMISOS.RRHH.VER] }, accessContext)
  const puedeVerDocumentos = puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.VER] }, accessContext)
  const puedeVerComunicados = puedeAcceder({ permissions: [PERMISOS.COMUNICADOS.VER] }, accessContext)
  const puedeVerSucursales = puedeAcceder({ permissions: [PERMISOS.SUCURSALES.VER] }, accessContext)
  const puedeVerSecciones = puedeAcceder({ permissions: [PERMISOS.CONTENIDOS.VER] }, accessContext)

  // Accesos directos permitidos según el rol del usuario
  const allowedAccesos = useMemo(() => {
    return TODOS_LOS_ACCESOS.filter((item) => {
      if (!item.permission) return true
      return puedeAcceder({ permissions: [item.permission] }, accessContext)
    })
  }, [accessContext])

  const defaultShortcuts = useMemo(() => {
    return allowedAccesos.map((a) => a.id).slice(0, 4)
  }, [allowedAccesos])

  // Pestañas disponibles según permisos
  const availableTabs = useMemo(() => {
    const list: Array<{ id: "personal" | "documentos" | "comunicados" | "usuarios"; label: string; count: number; icon: any }> = []
    if (puedeVerPersonal) {
      list.push({ id: "personal", label: `Personal (${personal.length})`, count: personal.length, icon: UsersIcon })
    }
    if (puedeVerDocumentos) {
      list.push({ id: "documentos", label: `Documentos (${documentos.length})`, count: documentos.length, icon: FileTextIcon })
    }
    if (puedeVerComunicados) {
      list.push({ id: "comunicados", label: `Comunicados (${comunicados.length})`, count: comunicados.length, icon: MegaphoneIcon })
    }
    if (puedeVerUsuarios) {
      list.push({ id: "usuarios", label: `Usuarios (${usuarios.length})`, count: usuarios.length, icon: UserIcon })
    }
    return list
  }, [puedeVerPersonal, puedeVerDocumentos, puedeVerComunicados, puedeVerUsuarios, personal.length, documentos.length, comunicados.length, usuarios.length])

  // Estado de vista: Tabla (por defecto) o Carrusel
  const [viewMode, setViewMode] = useState<"table" | "carousel">("table")

  // Estado pestaña activa
  const [activeTab, setActiveTab] = useState<"personal" | "documentos" | "comunicados" | "usuarios">(
    availableTabs[0]?.id ?? "personal"
  )

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id)
    }
  }, [availableTabs, activeTab])

  // Filtro de búsqueda y paginación en Vista Tabla
  const [tableSearch, setTableSearch] = useState("")
  const [tablePage, setTablePage] = useState(1)

  // Reset de búsqueda y página al cambiar de pestaña
  useEffect(() => {
    setTableSearch("")
    setTablePage(1)
  }, [activeTab])
  
  // Paginación y ángulo para vista carrusel
  const [paginaGrupo, setPaginaGrupo] = useState(0)
  const [rotationAngle, setRotationAngle] = useState(0)

  // Modo edición de accesos directos
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false)
  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agbc_admin_shortcuts")
      if (saved) {
        setSelectedShortcuts(JSON.parse(saved))
      } else {
        setSelectedShortcuts(defaultShortcuts)
      }
    } catch {
      setSelectedShortcuts(defaultShortcuts)
    }
  }, [defaultShortcuts])

  const activeSelectedShortcuts = useMemo(() => {
    const valid = selectedShortcuts.filter((id) => allowedAccesos.some((a) => a.id === id))
    return valid.length > 0 ? valid : defaultShortcuts
  }, [selectedShortcuts, allowedAccesos, defaultShortcuts])

  // Tarjetas métricas superiores
  const availableStatCards = useMemo(() => {
    const cards = []
    if (puedeVerPersonal) {
      cards.push({
        label: "Personal",
        sublabel: "Nómina y Equipo",
        count: counts.personal,
        icon: UsersIcon,
        href: "/rrhh",
        badge: "RRHH",
        cardStyle: "bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100",
        iconStyle: "bg-[#FFCC00]/25 text-[#002F6C] group-hover:bg-[#FFCC00] group-hover:text-[#002F6C]",
        badgeStyle: "text-[#002F6C] bg-amber-100/90",
      })
    }
    if (puedeVerDocumentos) {
      cards.push({
        label: "Documentos",
        sublabel: "Repositorio Digital",
        count: counts.documentos,
        icon: FileTextIcon,
        href: "/documentos",
        badge: "Archivos",
        cardStyle: "bg-gradient-to-br from-sky-50 via-blue-50/60 to-white border-sky-200/90 hover:border-[#0E5296]/50 hover:shadow-md hover:shadow-sky-100",
        iconStyle: "bg-[#0E5296]/15 text-[#0E5296] group-hover:bg-[#0E5296] group-hover:text-white",
        badgeStyle: "text-[#0E5296] bg-sky-100/90",
      })
    }
    if (puedeVerComunicados) {
      cards.push({
        label: "Comunicados",
        sublabel: "Boletines Oficiales",
        count: counts.comunicados,
        icon: MegaphoneIcon,
        href: "/comunicaciones",
        badge: "Noticias",
        cardStyle: "bg-gradient-to-br from-yellow-50 via-amber-50/50 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100",
        iconStyle: "bg-[#FFCC00]/25 text-[#002F6C] group-hover:bg-[#FFCC00] group-hover:text-[#002F6C]",
        badgeStyle: "text-[#002F6C] bg-amber-100/90",
      })
    }
    if (puedeVerUsuarios) {
      cards.push({
        label: "Usuarios",
        sublabel: "Cuentas y Accesos",
        count: counts.usuarios,
        icon: UserIcon,
        href: "/usuarios",
        badge: "Seguridad",
        cardStyle: "bg-gradient-to-br from-blue-50 via-sky-50/50 to-white border-blue-200/90 hover:border-[#0E5296]/50 hover:shadow-md hover:shadow-blue-100",
        iconStyle: "bg-[#0E5296]/15 text-[#0E5296] group-hover:bg-[#0E5296] group-hover:text-white",
        badgeStyle: "text-[#0E5296] bg-blue-100/90",
      })
    }
    if (puedeVerSucursales) {
      cards.push({
        label: "Sucursales",
        sublabel: "Cobertura Nacional",
        count: sucursales.length > 0 ? sucursales.length : 9,
        icon: Building2Icon,
        href: "/sucursales",
        badge: "Regional",
        cardStyle: "bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100",
        iconStyle: "bg-[#FFCC00]/25 text-[#002F6C] group-hover:bg-[#FFCC00] group-hover:text-[#002F6C]",
        badgeStyle: "text-[#002F6C] bg-amber-100/90",
      })
    }
    if (puedeVerAuditoria) {
      cards.push({
        label: "Auditoría",
        sublabel: "Logs de Actividad",
        count: "Activo",
        icon: ShieldCheckIcon,
        href: "/auditoria",
        badge: "Control",
        cardStyle: "bg-gradient-to-br from-sky-50 via-blue-50/40 to-white border-sky-200/90 hover:border-[#0E5296]/50 hover:shadow-md hover:shadow-sky-100",
        iconStyle: "bg-[#0E5296]/15 text-[#0E5296] group-hover:bg-[#0E5296] group-hover:text-white",
        badgeStyle: "text-[#0E5296] bg-sky-100/90",
      })
    }
    return cards
  }, [counts, puedeVerPersonal, puedeVerDocumentos, puedeVerComunicados, puedeVerUsuarios, puedeVerSucursales, puedeVerAuditoria, sucursales.length])

  // ── Filtrado y Paginación para Vista Tabla ──
  const filteredPersonal = useMemo(() => {
    const q = tableSearch.toLowerCase().trim()
    if (!q) return personal
    return personal.filter((p) => {
      const nom = `${p.nombre || ""} ${p.nombres || ""} ${p.apellidos || ""}`.toLowerCase()
      const car = (p.cargo || "").toLowerCase()
      const are = `${p.area || ""} ${p.unidad || ""} ${p.regional || ""}`.toLowerCase()
      const em = (p.email || "").toLowerCase()
      return nom.includes(q) || car.includes(q) || are.includes(q) || em.includes(q)
    })
  }, [personal, tableSearch])

  const filteredDocumentos = useMemo(() => {
    const q = tableSearch.toLowerCase().trim()
    if (!q) return documentos
    return documentos.filter((d) => {
      const tit = (d.titulo || "").toLowerCase()
      const desc = (d.descripcion || "").toLowerCase()
      const cat = (d.categoria || "").toLowerCase()
      const nom = (d.nombreArchivo || "").toLowerCase()
      return tit.includes(q) || desc.includes(q) || cat.includes(q) || nom.includes(q)
    })
  }, [documentos, tableSearch])

  const filteredComunicados = useMemo(() => {
    const q = tableSearch.toLowerCase().trim()
    if (!q) return comunicados
    return comunicados.filter((c) => {
      const tit = (c.titulo || "").toLowerCase()
      const res = (c.resumen || "").toLowerCase()
      const con = (c.contenido || "").toLowerCase()
      return tit.includes(q) || res.includes(q) || con.includes(q)
    })
  }, [comunicados, tableSearch])

  const filteredUsuarios = useMemo(() => {
    const q = tableSearch.toLowerCase().trim()
    if (!q) return usuarios
    return usuarios.filter((u) => {
      const nom = (u.name || "").toLowerCase()
      const em = (u.email || "").toLowerCase()
      const inst = (u.institutionalEmail || "").toLowerCase()
      return nom.includes(q) || em.includes(q) || inst.includes(q)
    })
  }, [usuarios, tableSearch])

  // Items de la pestaña activa en vista tabla
  const currentTableList = useMemo(() => {
    switch (activeTab) {
      case "personal":
        return filteredPersonal
      case "documentos":
        return filteredDocumentos
      case "comunicados":
        return filteredComunicados
      case "usuarios":
        return filteredUsuarios
      default:
        return []
    }
  }, [activeTab, filteredPersonal, filteredDocumentos, filteredComunicados, filteredUsuarios])

  const tableTotalPages = Math.max(1, Math.ceil(currentTableList.length / TABLE_PAGE_SIZE))
  const paginatedTableList = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE
    return currentTableList.slice(start, start + TABLE_PAGE_SIZE)
  }, [currentTableList, tablePage])

  // ── Items para el Carrusel 3D ──
  const allCurrentItems = useMemo(() => {
    switch (activeTab) {
      case "personal":
        return personal
      case "documentos":
        return documentos
      case "comunicados":
        return comunicados
      case "usuarios":
        return usuarios
      default:
        return []
    }
  }, [activeTab, personal, documentos, comunicados, usuarios])

  const totalPaginasCarrusel = Math.max(1, Math.ceil(allCurrentItems.length / MAX_TARJETAS_POR_CARRUSEL))
  const current6Items = useMemo(() => {
    const start = paginaGrupo * MAX_TARJETAS_POR_CARRUSEL
    return allCurrentItems.slice(start, start + MAX_TARJETAS_POR_CARRUSEL)
  }, [allCurrentItems, paginaGrupo])

  useEffect(() => {
    setPaginaGrupo(0)
    setRotationAngle(0)
  }, [activeTab])

  useEffect(() => {
    setRotationAngle(0)
  }, [paginaGrupo])

  const toggleShortcut = (id: string) => {
    setSelectedShortcuts((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      if (typeof window !== "undefined") {
        localStorage.setItem("agbc_admin_shortcuts", JSON.stringify(next))
      }
      return next
    })
  }

  const moveShortcut = (index: number, direction: "left" | "right") => {
    setSelectedShortcuts((prev) => {
      const next = [...prev]
      const targetIndex = direction === "left" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      if (typeof window !== "undefined") {
        localStorage.setItem("agbc_admin_shortcuts", JSON.stringify(next))
      }
      return next
    })
  }

  const notifsNoLeidas = notificaciones.filter((n) => !n.leida)
  const numItems = current6Items.length
  const stepAngle = numItems > 0 ? 360 / Math.max(numItems, 6) : 60

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/15 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
              Panel de Control Principal
            </h1>
            <span className="rounded-full bg-[#0E5296] text-[#FFCC00] text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
              AGBC Oficial
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Bienvenido al sistema unificado de información, comunicaciones y gestión de la Agencia Boliviana de Correos.
          </p>
        </div>

        {/* Interruptor de Vista: Tabla / Carrusel */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-white border-2 border-[#002F6C]/15 p-1 shadow-xs">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-[#0E5296] text-white shadow-xs"
                : "text-slate-600 hover:text-[#002F6C] hover:bg-slate-100"
            }`}
          >
            <TableIcon className={`h-3.5 w-3.5 ${viewMode === "table" ? "text-[#FFCC00]" : ""}`} />
            <span>Vista Tabla</span>
          </button>
          <button
            onClick={() => setViewMode("carousel")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "carousel"
                ? "bg-[#0E5296] text-white shadow-xs"
                : "text-slate-600 hover:text-[#002F6C] hover:bg-slate-100"
            }`}
          >
            <RotateCwIcon className={`h-3.5 w-3.5 ${viewMode === "carousel" ? "text-[#FFCC00]" : ""}`} />
            <span>Vista Carrusel</span>
          </button>
        </div>
      </div>

      {/* ── Accesos Directos de Administración ── */}
      {allowedAccesos.length > 0 && (
        <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-blue-50/70 via-amber-50/40 to-blue-50/60 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#002F6C]/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-xs">
                <SparklesIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#002F6C]">
                    Accesos Directos de Administración
                  </h3>
                  {isEditingShortcuts && (
                    <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2.5 py-0.5 text-[10px] font-black uppercase animate-pulse">
                      Modo Edición
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {isEditingShortcuts
                    ? "Reordena o activa/desactiva las herramientas que deseas ver en tu acceso rápido."
                    : "Herramientas de gestión rápida. Haz clic en el lápiz para personalizar."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditingShortcuts ? (
                <button
                  onClick={() => setIsEditingShortcuts(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                >
                  <CheckIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                  Guardar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingShortcuts(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#002F6C]/20 px-3.5 py-1.5 text-xs font-bold text-[#002F6C] shadow-xs transition-all cursor-pointer"
                  title="Personalizar accesos directos"
                >
                  <PencilIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                  Personalizar
                </button>
              )}
            </div>
          </div>

          {/* Accesos Activos Actuales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5">
            {activeSelectedShortcuts.map((id, index) => {
              const item = allowedAccesos.find((a) => a.id === id)
              if (!item) return null
              const Icon = item.icon

              return (
                <div
                  key={item.id}
                  className={`group relative flex items-center justify-between rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                    isEditingShortcuts
                      ? "border-[#0E5296] bg-blue-50/80 shadow-md ring-2 ring-[#FFCC00]/40"
                      : "border-[#002F6C]/10 bg-white/90 hover:bg-white hover:border-[#0E5296]/40 hover:shadow-md cursor-pointer"
                  }`}
                >
                  <Link
                    href={isEditingShortcuts ? "#" : item.href}
                    onClick={(e) => {
                      if (isEditingShortcuts) e.preventDefault()
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E5296] to-[#002F6C] text-[#FFCC00] shadow-xs">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#002F6C] truncate">{item.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{item.desc}</p>
                    </div>
                  </Link>

                  {isEditingShortcuts && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => moveShortcut(index, "left")}
                        disabled={index === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#002F6C] shadow-xs hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Mover a la izquierda"
                      >
                        <ArrowLeftIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveShortcut(index, "right")}
                        disabled={index === activeSelectedShortcuts.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#002F6C] shadow-xs hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="Mover a la derecha"
                      >
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Catálogo de selección disponible en edición */}
          {isEditingShortcuts && (
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#002F6C] mb-2.5">
                Herramientas Disponibles:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allowedAccesos.map((item) => {
                  const isSelected = activeSelectedShortcuts.includes(item.id)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleShortcut(item.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#0E5296] bg-[#0E5296]/10 text-[#002F6C] font-bold ring-1 ring-[#0E5296]/30"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? "bg-[#0E5296] text-[#FFCC00]" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-[11px] truncate">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tarjetas Métricas Superiores ── */}
      {availableStatCards.length > 0 && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(
            6,
            Math.max(2, availableStatCards.length)
          )} gap-4 transition-all duration-300 ${
            isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
          }`}
        >
          {availableStatCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${card.cardStyle}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${card.badgeStyle}`}
                >
                  {card.badge}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${card.iconStyle}`}
                >
                  <card.icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-[#002F6C]">{card.count}</div>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{card.label}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{card.sublabel}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN PRINCIPAL: VISTA TABLA (PREDETERMINADA) O VISTA CARRUSEL 3D        */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {availableTabs.length > 0 && (
        <div
          className={`rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-b from-blue-50/70 via-amber-50/40 to-blue-100/30 p-5 sm:p-6 shadow-sm transition-all duration-300 ${
            isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
          }`}
        >
          {/* Pestañas de Navegación de Entidades */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#002F6C]/10 gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white/80 border border-[#002F6C]/15 p-1.5 shadow-xs">
              {availableTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t.id
                      ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/20"
                      : "text-slate-600 hover:text-[#002F6C] hover:bg-white/60"
                  }`}
                >
                  <t.icon className={`h-3.5 w-3.5 ${activeTab === t.id ? "text-[#FFCC00]" : ""}`} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Enlace al módulo completo */}
            <Link
              href={
                activeTab === "personal"
                  ? "/rrhh"
                  : activeTab === "documentos"
                  ? "/documentos"
                  : activeTab === "comunicados"
                  ? "/comunicaciones"
                  : "/usuarios"
              }
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0E5296] hover:text-[#002F6C] hover:underline"
            >
              <span>Ir al módulo completo</span>
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* VISTA 1: TABLAS MODERNAS Y ORDENADAS (PREDETERMINADA)              */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {viewMode === "table" ? (
            <div className="mt-4 space-y-4">
              {/* Barra de Búsqueda y Resumen */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-3.5 rounded-2xl border border-[#002F6C]/10 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value)
                      setTablePage(1)
                    }}
                    placeholder={`Buscar en ${activeTab}...`}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E5296]/30 bg-slate-50/50"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => {
                        setTableSearch("")
                        setTablePage(1)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Mostrando {paginatedTableList.length} de {currentTableList.length} registros
                  </span>
                  <span className="text-xs font-bold text-[#0E5296] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Página {tablePage} de {tableTotalPages}
                  </span>
                </div>
              </div>

              {/* Contenedor de la Tabla Activa */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                {activeTab === "personal" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                        <th className="py-3 px-4">Funcionario / Cargo</th>
                        <th className="py-3 px-4">Área & Regional</th>
                        <th className="py-3 px-4">Correo Institucional</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedTableList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No se encontraron funcionarios que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        paginatedTableList.map((p: any) => {
                          const fullName = `${p.nombre || p.nombres || ""} ${p.apellidos || ""}`.trim()
                          const initials = `${fullName[0] || "P"}`.toUpperCase()
                          const isActivo = p.estado === "activo"
                          return (
                            <tr key={p.id} className="hover:bg-blue-50/40 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black text-xs shadow-2xs overflow-hidden">
                                    {p.foto ? (
                                      <img src={p.foto} alt={fullName} className="h-full w-full object-cover" />
                                    ) : (
                                      <span>{initials}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#002F6C] truncate">{fullName || "Sin nombre"}</p>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">{p.cargo || "Funcionario"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-700 truncate">{p.area || p.unidad || "Oficina Central"}</p>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3 text-[#0E5296]" />
                                  {p.regional || "Nacional"}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-700 truncate">{p.email || "—"}</p>
                                {p.telefono && (
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <PhoneIcon className="h-3 w-3 text-emerald-600" />
                                    {p.telefono}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                                    isActivo
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${isActivo ? "bg-emerald-500" : "bg-slate-400"}`} />
                                  {p.estado || "activo"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href="/rrhh"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-[#0E5296] text-[#0E5296] hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                                >
                                  <span>Ver en RRHH</span>
                                  <ArrowUpRightIcon className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "documentos" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                        <th className="py-3 px-4">Documento & Tipo</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4">Tamaño & Fecha</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedTableList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No se encontraron documentos que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        paginatedTableList.map((d: any) => {
                          const typeInfo = getDocTypeInfo(d)
                          return (
                            <tr key={d.id} className="hover:bg-blue-50/40 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-black text-xs shadow-2xs ${typeInfo.boxClass}`}
                                  >
                                    {typeInfo.label}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#002F6C] truncate">{d.titulo}</p>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">
                                      {d.nombreArchivo || d.descripcion || "Sin descripción"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold">
                                  {d.categoria || "General"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-700">{d.tamano || "—"}</p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString("es-BO") : "—"}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                                    d.estado === "publicado"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {d.estado || "publicado"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href="/documentos"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-[#0E5296] text-[#0E5296] hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                                >
                                  <span>Ver Documento</span>
                                  <ArrowUpRightIcon className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "comunicados" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                        <th className="py-3 px-4">Comunicado / Titular</th>
                        <th className="py-3 px-4">Resumen</th>
                        <th className="py-3 px-4">Fecha de Publicación</th>
                        <th className="py-3 px-4 text-center">Destacado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedTableList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No se encontraron comunicados que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        paginatedTableList.map((c: any) => (
                          <tr key={c.id} className="hover:bg-blue-50/40 transition-colors group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFCC00] to-amber-400 text-[#002F6C] font-black shadow-2xs overflow-hidden">
                                  {c.imagen ? (
                                    <img src={c.imagen} alt={c.titulo} className="h-full w-full object-cover" />
                                  ) : (
                                    <MegaphoneIcon className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#002F6C] truncate">{c.titulo}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">Oficial AGBC</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <p className="text-slate-600 line-clamp-1">{c.resumen || c.contenido || "—"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-700">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-BO") : "—"}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {c.destacado ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                                  ★ Destacado
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href="/comunicaciones"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-[#0E5296] text-[#0E5296] hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                              >
                                <span>Ver Comunicado</span>
                                <ArrowUpRightIcon className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === "usuarios" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Correo Institucional</th>
                        <th className="py-3 px-4">Roles Asignados</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedTableList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No se encontraron usuarios que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        paginatedTableList.map((u: any) => {
                          const initials = `${u.name?.[0] || "U"}`.toUpperCase()
                          const rolesList = Array.isArray(u.roles)
                            ? u.roles.map((r: any) => (typeof r === "string" ? r : r.name))
                            : []
                          return (
                            <tr key={u.id} className="hover:bg-blue-50/40 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] font-black text-xs shadow-2xs">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#002F6C] truncate">{u.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 truncate">{u.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-700 truncate">{u.institutionalEmail || u.email}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {rolesList.length > 0 ? (
                                    rolesList.map((r: string) => (
                                      <span
                                        key={r}
                                        className="inline-flex items-center rounded-md bg-[#0E5296]/10 px-2 py-0.5 text-[10px] font-bold text-[#0E5296]"
                                      >
                                        {r}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-xs">Sin rol</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Activo
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href="/usuarios"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-[#0E5296] text-[#0E5296] hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                                >
                                  <span>Ver en Usuarios</span>
                                  <ArrowUpRightIcon className="h-3 w-3" />
                                </Link>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Paginador de la Tabla */}
              {tableTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Página {tablePage} de {tableTotalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                      <span>Anterior</span>
                    </button>
                    <button
                      onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                      disabled={tablePage === tableTotalPages}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────────── */
            /* VISTA 2: CARRUSEL 3D CILÍNDRICO                                    */
            /* ─────────────────────────────────────────────────────────────────── */
            <div className="relative mt-2 flex items-center justify-center py-4 w-full">
              {numItems > 1 && (
                <button
                  onClick={() => setRotationAngle((prev) => prev + stepAngle)}
                  className="absolute left-2 md:left-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-[#002F6C] shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Girar carrusel a la izquierda"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              )}

              <div className="relative h-[400px] w-full flex items-center justify-center" style={{ perspective: "1100px" }}>
                {numItems === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <LayoutDashboardIcon className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No hay registros disponibles</p>
                  </div>
                ) : (
                  <div
                    className="relative h-full w-full flex items-center justify-center transition-transform duration-700 ease-out"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: `rotateY(${rotationAngle}deg)`,
                    }}
                  >
                    {current6Items.map((item, idx) => {
                      const FIXED_RADIUS = 270
                      const faceAngle = numItems === 1 ? 0 : idx <= numItems / 2 ? idx * 60 : (idx - numItems) * 60
                      const visualAngle = numItems === 1 ? 0 : (((faceAngle + rotationAngle) % 360) + 360) % 360
                      const isFront = numItems === 1 || visualAngle < 35 || visualAngle > 325
                      const isSide = (visualAngle >= 35 && visualAngle <= 85) || (visualAngle >= 275 && visualAngle <= 325)

                      return (
                        <div
                          key={(item as { id: string }).id ?? idx}
                          onClick={() => {
                            if (numItems > 1) setRotationAngle(-faceAngle)
                          }}
                          className="absolute w-[245px] h-[320px] rounded-3xl border-2 transition-all duration-500 select-none cursor-pointer flex flex-col justify-between p-4.5"
                          style={{
                            transform: `rotateY(${faceAngle}deg) translateZ(${FIXED_RADIUS}px)`,
                            backfaceVisibility: "hidden",
                            zIndex: isFront ? 30 : isSide ? 20 : 10,
                            opacity: isFront ? 1 : isSide ? 0.75 : 0.35,
                            transformOrigin: "center center",
                            background: isFront
                              ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,247,255,0.95) 100%)"
                              : "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,247,255,0.8) 100%)",
                            borderColor: isFront ? "#0E5296" : "rgba(0,47,108,0.15)",
                            boxShadow: isFront
                              ? "0 20px 35px -10px rgba(0, 47, 108, 0.25), 0 0 0 1px rgba(14, 82, 150, 0.2)"
                              : "0 10px 20px -5px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {/* Render según pestaña activa */}
                          {activeTab === "personal" && (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      (item as PersonalItem).estado === "activo"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {(item as PersonalItem).estado || "activo"}
                                  </span>
                                  <UsersIcon className="h-4 w-4 text-[#0E5296]" />
                                </div>
                                <div className="flex flex-col items-center text-center mt-1">
                                  <div className="h-16 w-16 rounded-2xl bg-[#FFCC00] border-2 border-white shadow-md flex items-center justify-center font-black text-[#002F6C] text-xl overflow-hidden mb-2">
                                    {(item as PersonalItem).foto ? (
                                      <img
                                        src={(item as PersonalItem).foto!}
                                        alt={(item as PersonalItem).nombre || "Foto"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{((item as PersonalItem).nombre || "P")[0]?.toUpperCase()}</span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-black text-[#002F6C] line-clamp-2">
                                    {(item as PersonalItem).nombre ||
                                      `${(item as PersonalItem).nombres || ""} ${(item as PersonalItem).apellidos || ""}`}
                                  </h4>
                                  <p className="text-[11px] text-slate-600 font-bold mt-0.5 line-clamp-1">
                                    {(item as PersonalItem).cargo}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                                    {(item as PersonalItem).area || (item as PersonalItem).unidad || "AGBC"}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                                  {(item as PersonalItem).email || "Sin correo"}
                                </span>
                                <Link
                                  href="/rrhh"
                                  className="text-[10px] font-black text-[#0E5296] hover:underline"
                                >
                                  Ver →
                                </Link>
                              </div>
                            </>
                          )}

                          {activeTab === "documentos" && (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                      getDocTypeInfo(item as DocumentoItem).badgeClass
                                    }`}
                                  >
                                    {getDocTypeInfo(item as DocumentoItem).label}
                                  </span>
                                  <FileTextIcon className="h-4 w-4 text-[#0E5296]" />
                                </div>
                                <div className="mt-1">
                                  <div
                                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center font-black text-xs shadow-xs mb-3 ${
                                      getDocTypeInfo(item as DocumentoItem).boxClass
                                    }`}
                                  >
                                    {getDocTypeInfo(item as DocumentoItem).label}
                                  </div>
                                  <h4 className="text-xs font-black text-[#002F6C] line-clamp-2">
                                    {(item as DocumentoItem).titulo}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1">
                                    {(item as DocumentoItem).descripcion ||
                                      (item as DocumentoItem).nombreArchivo ||
                                      "Documento oficial"}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500">
                                  {(item as DocumentoItem).tamano || "Archivo"}
                                </span>
                                <Link
                                  href="/documentos"
                                  className="text-[10px] font-black text-[#0E5296] hover:underline"
                                >
                                  Abrir →
                                </Link>
                              </div>
                            </>
                          )}

                          {activeTab === "comunicados" && (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-[#002F6C] border border-amber-200">
                                    Oficial
                                  </span>
                                  <MegaphoneIcon className="h-4 w-4 text-[#0E5296]" />
                                </div>
                                {(item as ComunicadoItem).imagen ? (
                                  <div className="h-24 w-full rounded-2xl overflow-hidden border border-slate-200 mb-2 shadow-2xs">
                                    <img
                                      src={(item as ComunicadoItem).imagen!}
                                      alt={(item as ComunicadoItem).titulo}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-50 to-amber-50 border border-slate-200 flex items-center justify-center mb-2">
                                    <MegaphoneIcon className="h-6 w-6 text-[#0E5296]/40" />
                                  </div>
                                )}
                                <h4 className="text-xs font-black text-[#002F6C] line-clamp-2">
                                  {(item as ComunicadoItem).titulo}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                                  {(item as ComunicadoItem).resumen || (item as ComunicadoItem).contenido || ""}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {(item as ComunicadoItem).createdAt
                                    ? new Date((item as ComunicadoItem).createdAt!).toLocaleDateString("es-BO")
                                    : "AGBC"}
                                </span>
                                <Link
                                  href="/comunicaciones"
                                  className="text-[10px] font-black text-[#0E5296] hover:underline"
                                >
                                  Leer →
                                </Link>
                              </div>
                            </>
                          )}

                          {activeTab === "usuarios" && (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0E5296] border border-blue-200">
                                    Cuenta
                                  </span>
                                  <UserIcon className="h-4 w-4 text-[#0E5296]" />
                                </div>
                                <div className="flex flex-col items-center text-center mt-2">
                                  <div className="h-16 w-16 rounded-2xl bg-[#0E5296] text-[#FFCC00] border-2 border-white shadow-md flex items-center justify-center font-black text-2xl mb-2">
                                    {((item as UsuarioItem).name || "U")[0]?.toUpperCase()}
                                  </div>
                                  <h4 className="text-xs font-black text-[#002F6C] line-clamp-2">
                                    {(item as UsuarioItem).name}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                    {(item as UsuarioItem).institutionalEmail || (item as UsuarioItem).email}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400">Activo</span>
                                <Link
                                  href="/usuarios"
                                  className="text-[10px] font-black text-[#0E5296] hover:underline"
                                >
                                  Gestionar →
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {numItems > 1 && (
                <button
                  onClick={() => setRotationAngle((prev) => prev - stepAngle)}
                  className="absolute right-2 md:right-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-[#002F6C] shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Girar carrusel a la derecha"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Selector de Grupos de Páginas en Carrusel */}
          {viewMode === "carousel" && totalPaginasCarrusel > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 border-t border-[#002F6C]/10 mt-2">
              <button
                onClick={() => setPaginaGrupo((prev) => Math.max(0, prev - 1))}
                disabled={paginaGrupo === 0}
                className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#002F6C] shadow-2xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                <span>Anterior Grupo</span>
              </button>
              <span className="text-xs font-bold text-slate-600 px-2">
                Grupo {paginaGrupo + 1} de {totalPaginasCarrusel}
              </span>
              <button
                onClick={() => setPaginaGrupo((prev) => Math.min(totalPaginasCarrusel - 1, prev + 1))}
                disabled={paginaGrupo === totalPaginasCarrusel - 1}
                className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#002F6C] shadow-2xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <span>Siguiente Grupo</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Notificaciones y Avisos ── */}
      <div
        className={`transition-all duration-300 ${
          isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
        }`}
      >
        <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-amber-50/80 via-blue-50/40 to-yellow-50/60 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#002F6C]/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFCC00] to-amber-400 text-[#002F6C] shadow-xs">
                  <BellIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#002F6C]">Notificaciones y Avisos</h3>
                  <p className="text-xs text-slate-600 font-medium">Avisos dirigidos a tu cuenta</p>
                </div>
              </div>
              {notifsNoLeidas.length > 0 && (
                <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-xs font-black shadow-xs">
                  {notifsNoLeidas.length} nuevas
                </span>
              )}
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {notificaciones.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                  <BellIcon className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No tienes notificaciones pendientes</p>
                  <p className="text-xs text-slate-500 mt-0.5">Te avisaremos cuando haya actualizaciones.</p>
                </div>
              ) : (
                notificaciones.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      !n.leida
                        ? "bg-white/95 border-[#0E5296]/30 shadow-xs hover:border-[#0E5296]"
                        : "bg-white/85 border-[#002F6C]/10"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        !n.leida ? "bg-[#0E5296] text-[#FFCC00]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <BellIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-[#002F6C] truncate">{n.titulo}</h4>
                        <span className="text-[10px] text-slate-400 font-medium ml-2 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString("es-BO")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mt-1">{n.mensaje}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#002F6C]/10 flex items-center justify-between text-xs text-slate-600">
            <span>Centro de notificaciones institucionales</span>
            <Link href="/notificaciones" className="font-black text-[#0E5296] hover:text-[#002F6C] hover:underline">
              Ver todas las notificaciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
