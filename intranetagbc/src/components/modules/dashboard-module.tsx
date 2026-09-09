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
  ci?: string
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
  nationalId?: string
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
  const esAdmin =
    accessContext.isAdmin ||
    (Array.isArray(user.roles) &&
      user.roles.some((r: any) =>
        typeof r === "string"
          ? ["administrador", "super_admin"].includes(r.toLowerCase())
          : ["administrador", "super_admin"].includes(r.name?.toLowerCase())
      ))

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

  // Pestañas disponibles para el carrusel 3D según permisos
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

  // Estado pestaña del carrusel (garantizando que esté permitida)
  const [activeTab, setActiveTab] = useState<"personal" | "documentos" | "comunicados" | "usuarios">(
    availableTabs[0]?.id ?? "comunicados"
  )

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id)
    }
  }, [availableTabs, activeTab])
  
  // Paginación por grupos de máximo 6 tarjetas
  const [paginaGrupo, setPaginaGrupo] = useState(0)

  // Ángulo de rotación del cilindro 3D (en grados)
  const [rotationAngle, setRotationAngle] = useState(0)

  // Modo edición de accesos directos
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false)
  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>([])

  // Cargar preferencias guardadas en cliente
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

  // Tarjetas métricas superiores filtradas según permisos RBAC
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

  // Lista completa de la pestaña seleccionada
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

  // Total de páginas (cada carrusel tiene como máximo 6 tarjetas)
  const totalPaginas = Math.max(1, Math.ceil(allCurrentItems.length / MAX_TARJETAS_POR_CARRUSEL))

  // 6 tarjetas activas para el cilindro 3D de la página actual
  const current6Items = useMemo(() => {
    const start = paginaGrupo * MAX_TARJETAS_POR_CARRUSEL
    return allCurrentItems.slice(start, start + MAX_TARJETAS_POR_CARRUSEL)
  }, [allCurrentItems, paginaGrupo])

  // Reset de página y ángulo al cambiar pestaña o de carrusel
  useEffect(() => {
    setPaginaGrupo(0)
    setRotationAngle(0)
  }, [activeTab])

  useEffect(() => {
    setRotationAngle(0)
  }, [paginaGrupo])

  // Guardar accesos directos
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
    const targetIndex = direction === "left" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= selectedShortcuts.length) return
    const next = [...selectedShortcuts]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    setSelectedShortcuts(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("agbc_admin_shortcuts", JSON.stringify(next))
    }
  }

  const notifsNoLeidas = notificaciones.filter((n) => !n.leida)

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase() || "AG"
  }

  const numItems = current6Items.length
  const stepAngle = 60

  return (
    <div className="relative flex flex-1 flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── OVERLAY OSCURECIDO (MODO EDICIÓN ESTILO WORD CABECERA) ── */}
      {isEditingShortcuts && (
        <div
          onClick={() => setIsEditingShortcuts(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        />
      )}

      {/* ── Banner Superior (Pastel Amarillo & Azul Moderno) ── */}
      <div className={`relative overflow-hidden rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-white via-blue-50/40 to-amber-50/40 p-6 shadow-sm transition-all duration-300 ${
        isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
      }`}>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#FFCC00]/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#0E5296]/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md shadow-[#0E5296]/20 ring-4 ring-white">
              <LayoutDashboardIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                  Panel de Control Institucional
                </h1>
                <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2.5 py-0.5 text-xs font-black uppercase shadow-xs">
                  AGBC
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                Hola, <span className="text-[#002F6C] font-bold">{user.name}</span>. Sistema centralizado de la Agencia Boliviana de Correos.
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 text-[#0E5296] font-bold">
                  <MailIcon className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                  {user.roles.length > 0 ? user.roles.join(", ").toUpperCase() : "USUARIO"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-[#FFCC00]" />
              Mi Perfil
            </Link>
          </div>
        </div>
      </div>

      {/* ── ACCESOS DIRECTOS DE ADMINISTRACIÓN (DIRECTO DEBAJO DEL PANEL) ── */}
      {esAdmin && (
        <div
          className={`relative rounded-3xl border-2 transition-all duration-300 ${
            isEditingShortcuts
              ? "z-50 bg-white border-[#FFCC00] shadow-2xl shadow-black/30 ring-8 ring-[#0E5296]/30 p-8 scale-[1.01]"
              : "border-2 border-[#002F6C]/15 bg-gradient-to-br from-amber-50/80 via-blue-50/40 to-amber-100/40 p-5.5 shadow-sm"
          }`}
        >
          {/* Cabecera con Botón de Edición (Lápiz) */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#002F6C]/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-xs">
                <ShieldAlertIcon className="h-4.5 w-4.5" />
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
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-[#0E5296] text-[#FFCC00]" : "bg-slate-100 text-slate-500"
                      }`}>
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

      {/* ── Tarjetas Métricas Superiores (Filtradas según rol y permisos) ── */}
      {availableStatCards.length > 0 && (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(6, Math.max(2, availableStatCards.length))} gap-4 transition-all duration-300 ${
          isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
        }`}>
          {availableStatCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl border p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${card.cardStyle}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${card.badgeStyle}`}>
                  {card.badge}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${card.iconStyle}`}>
                  <card.icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-[#002F6C]">
                  {card.count}
                </div>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {card.label}
                </p>
                <p className="text-[10px] font-medium text-slate-500 truncate">
                  {card.sublabel}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── CARRUSEL 3D ESTANDARIZADO CON PESTAÑAS CENTRADAS Y FLECHAS LATERALES ── */}
      {availableTabs.length > 0 && (
        <div className={`rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-b from-blue-50/70 via-amber-50/40 to-blue-100/30 p-6 shadow-sm transition-all duration-300 ${
          isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
        }`}>
          {/* Pestañas Centradas según permisos del usuario */}
          <div className="flex justify-center pb-5 border-b border-[#002F6C]/10">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-white/80 border border-[#002F6C]/15 p-1.5 shadow-xs">
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
          </div>

        {/* ── ESCENARIO CILÍNDRICO 3D CON GEOMETRÍA FIJA (IGUAL TAMAÑO EN TODAS LAS PESTAÑAS Y PÁGINAS) ── */}
        <div className="relative mt-2 flex items-center justify-center py-4 w-full">
          {/* Flecha izquierda lateral */}
          {numItems > 1 && (
            <button
              onClick={() => setRotationAngle((prev) => prev + stepAngle)}
              className="absolute left-2 md:left-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-[#002F6C] shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Girar carrusel a la izquierda"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}

          <div
            className="relative h-[400px] w-full flex items-center justify-center"
            style={{ perspective: "1100px" }}
          >
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
                  const faceAngle = numItems === 1 ? 0 : (idx <= numItems / 2 ? idx * 60 : (idx - numItems) * 60)
                  const visualAngle = numItems === 1 ? 0 : ((faceAngle + rotationAngle) % 360 + 360) % 360
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
                        transformStyle: "preserve-3d",
                        backgroundColor: "#FFFFFF",
                        borderColor: isFront ? "#0E5296" : "#CBD5E1",
                        boxShadow: isFront
                          ? "0 20px 35px -8px rgba(14, 82, 150, 0.3), 0 0 0 3px rgba(255, 204, 0, 0.55)"
                          : "0 10px 20px -5px rgba(0, 0, 0, 0.1)",
                        opacity: isFront ? 1 : isSide ? 0.9 : 0.45,
                      }}
                    >
                      {/* Contenido según la pestaña (ESTILO TARJETA IMAGEN 2) */}
                      {activeTab === "personal" && (() => {
                        const p = item as PersonalItem
                        const nombreCompleto = p.nombre || `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim() || "Funcionario"
                        const cargoStr = p.cargo || "Personal"
                        const areaStr = p.unidad || p.area || "Administración Central"
                        const regionalStr = p.regional || "CENTRAL"

                        return (
                          <>
                            {/* Header: Badge azul/oro + Estado Activo con punto verde */}
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                                {regionalStr}
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Activo
                              </span>
                            </div>

                            {/* Avatar cuadrado redondeado amarillo con iniciales o foto */}
                            <div className="flex flex-col items-center text-center my-auto">
                              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black text-2xl shadow-md mx-auto mb-1.5 overflow-hidden">
                                {p.foto ? (
                                  <img src={p.foto} alt={nombreCompleto} className="h-full w-full object-cover" />
                                ) : (
                                  <span>{getInitials(nombreCompleto)}</span>
                                )}
                              </div>
                              <h3 className="text-xs font-black text-[#002F6C] line-clamp-1">{nombreCompleto}</h3>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{cargoStr}</p>
                              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                <span>{p.ci ? `CI: ${p.ci}` : "Nómina"}</span>
                                <span>•</span>
                                <span className="truncate max-w-[90px]">{areaStr}</span>
                              </div>
                            </div>

                            {/* Footer: ID/Email + Botón circular */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                                {p.email ? p.email.split("@")[0] : "Personal AGBC"}
                              </span>
                              <Link
                                href="/rrhh"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-all shadow-xs"
                                title="Ver en RRHH"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </>
                        )
                      })()}

                      {activeTab === "documentos" && (() => {
                        const d = item as DocumentoItem
                        const docInfo = getDocTypeInfo(d)
                        return (
                          <>
                            {/* Header: Badge azul/oro + Tipo según software */}
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[9px] font-black uppercase tracking-wider truncate max-w-[120px]" title={d.categoria ?? undefined}>
                                {d.categoria || "DOCUMENTO"}
                              </span>
                              <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black border uppercase tracking-wider ${docInfo.badgeClass}`}>
                                {docInfo.label}
                              </span>
                            </div>

                            {/* Icono central dentro de caja con color según formato (PDF rojo, Excel verde, Word azul, etc.) */}
                            <div className="flex flex-col items-center text-center my-auto">
                              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border shadow-md mx-auto mb-1.5 ${docInfo.boxClass}`}>
                                <FileTextIcon className={`h-9 w-9 ${docInfo.iconClass}`} />
                              </div>
                              <h3 className="text-xs font-black text-[#002F6C] line-clamp-1">{d.titulo}</h3>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                {d.descripcion || "Documento oficial institucional"}
                              </p>
                              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                <span className={`font-bold ${docInfo.iconClass}`}>{docInfo.label}</span>
                                <span>•</span>
                                <span>{d.tamano || "Archivo"}</span>
                              </div>
                            </div>

                            {/* Footer: Tamaño + Botón circular de descarga */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                                {d.tamano || "Archivo AGBC"}
                              </span>
                              {d.archivo ? (
                                <a
                                  href={d.archivo}
                                  download={d.nombreArchivo ?? "documento"}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-all shadow-xs"
                                  title="Descargar archivo"
                                >
                                  <DownloadIcon className="h-3.5 w-3.5" />
                                </a>
                              ) : (
                                <Link
                                  href="/documentos"
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-all shadow-xs"
                                  title="Ver documentos"
                                >
                                  <EyeIcon className="h-3.5 w-3.5" />
                                </Link>
                              )}
                            </div>
                          </>
                        )
                      })()}

                      {activeTab === "comunicados" && (() => {
                        const c = item as ComunicadoItem
                        const hasImage = Boolean(c.imagen || (c.archivoUrl && (c.archivoUrl.endsWith(".png") || c.archivoUrl.endsWith(".jpg") || c.archivoUrl.endsWith(".jpeg") || c.archivoUrl.endsWith(".webp"))))
                        const hasPdf = Boolean(c.archivoUrl?.endsWith(".pdf") || c.archivoTipo?.includes("pdf"))

                        return (
                          <>
                            {/* Header: Badge azul/oro + Estado */}
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                                COMUNICADO
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Publicado
                              </span>
                            </div>

                            {/* Vista previa real de imagen o PDF en caja central */}
                            <div className="flex flex-col items-center text-center my-auto">
                              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] shadow-md mx-auto mb-1.5 overflow-hidden border border-amber-300">
                                {hasImage ? (
                                  <img
                                    src={(c.imagen || c.archivoUrl)!}
                                    alt={c.titulo}
                                    className="h-full w-full object-cover"
                                  />
                                ) : hasPdf ? (
                                  <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 w-full h-full p-1">
                                    <FileTextIcon className="h-7 w-7 text-red-600 mb-0.5" />
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.2 rounded-xs">PDF</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#0E5296]/10 to-[#FFCC00] w-full h-full">
                                    <MegaphoneIcon className="h-8 w-8 text-[#002F6C]" />
                                  </div>
                                )}
                              </div>
                              <h3 className="text-xs font-black text-[#002F6C] line-clamp-1">{c.titulo}</h3>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                                {c.resumen || c.contenido || "Aviso oficial institucional"}
                              </p>
                              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-BO") : "Reciente"}</span>
                                <span>•</span>
                                <span className="text-[#0E5296] font-bold">{hasPdf ? "Adjunto PDF" : hasImage ? "Con Imagen" : "Oficial"}</span>
                              </div>
                            </div>

                            {/* Footer: Fecha + Botón circular de lectura */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-BO") : "Reciente"}
                              </span>
                              <Link
                                href="/comunicaciones"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-all shadow-xs"
                                title="Leer comunicado"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </>
                        )
                      })()}

                      {activeTab === "usuarios" && (() => {
                        const u = item as UsuarioItem
                        const userDisplayRoles = Array.isArray(u.roles)
                          ? u.roles.map((r) => (typeof r === "string" ? r : r.name)).join(", ")
                          : "USUARIO"
                        return (
                          <>
                            {/* Header: Badge azul/oro + Estado */}
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[9px] font-black uppercase tracking-wider truncate max-w-[120px]" title={userDisplayRoles}>
                                {userDisplayRoles}
                              </span>
                              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                                u.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                              }`}>
                                <span className={`h-2 w-2 rounded-full ${u.isActive !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {u.isActive !== false ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            {/* Avatar cuadrado redondeado amarillo con iniciales */}
                            <div className="flex flex-col items-center text-center my-auto">
                              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black text-2xl shadow-md mx-auto mb-1.5">
                                {getInitials(u.name || "US")}
                              </div>
                              <h3 className="text-xs font-black text-[#002F6C] line-clamp-1">{u.name}</h3>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{u.institutionalEmail || u.email}</p>
                              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
                                <span>CI: {u.nationalId || "No reg."}</span>
                              </div>
                            </div>

                            {/* Footer: ID + Botón circular de gestionar */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                                {u.id.slice(0, 10)}...
                              </span>
                              <Link
                                href="/usuarios"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-all shadow-xs"
                                title="Gestionar usuario"
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Flecha derecha lateral */}
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

        {/* ── PAGINADO SENCILLO AL MEDIO ── */}
        <div className="mt-4 flex items-center justify-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={() => setPaginaGrupo((prev) => Math.max(0, prev - 1))}
            disabled={paginaGrupo === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <span className="text-xs font-bold text-slate-700">
            {paginaGrupo + 1} de {totalPaginas}
          </span>

          <div className="flex items-center gap-1.5 px-1">
            {Array.from({ length: totalPaginas }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPaginaGrupo(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  paginaGrupo === idx ? "w-6 bg-[#0E5296]" : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                title={`Página ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setPaginaGrupo((prev) => Math.min(totalPaginas - 1, prev + 1))}
            disabled={paginaGrupo >= totalPaginas - 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            title="Siguiente página"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      )}

      {/* ── Notificaciones y Avisos (Con fondo suave pastel visible) ── */}
      <div className={`transition-all duration-300 ${
        isEditingShortcuts ? "opacity-30 blur-[1px] pointer-events-none" : ""
      }`}>
        <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-amber-50/80 via-blue-50/40 to-yellow-50/60 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#002F6C]/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFCC00] to-amber-400 text-[#002F6C] shadow-xs">
                  <BellIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#002F6C]">
                    Notificaciones y Avisos
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Avisos dirigidos a tu cuenta
                  </p>
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
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      !n.leida ? "bg-[#0E5296] text-[#FFCC00]" : "bg-slate-100 text-slate-500"
                    }`}>
                      <BellIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-[#002F6C] truncate">
                          {n.titulo}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium ml-2 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString("es-BO")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mt-1">
                        {n.mensaje}
                      </p>
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
