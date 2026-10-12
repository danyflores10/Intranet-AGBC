"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpDownIcon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FilterIcon,
  LayersIcon,
  LogInIcon,
  LogOutIcon,
  PencilIcon,
  PlusCircleIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
  XCircleIcon,
  DatabaseIcon,
  Loader2Icon,
  ServerIcon,
  BarChart3Icon,
  TrendingUpIcon,
  FileDownIcon,
  GlobeIcon,
  LaptopIcon,
  SmartphoneIcon,
  ClockIcon,
  AwardIcon,
  FileSpreadsheetIcon,
  BookOpenIcon,
  CompassIcon,
  PrinterIcon,
  UsersIcon,
  SparklesIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"
import {
  generarBackupBaseDatosAction,
  type CeoAnalytics,
  type TopModuloItem,
  type TopDocumentoItem,
} from "@/actions/auditoria"
import { RrhhAuditoriaDialog } from "@/components/rrhh/rrhh-auditoria-dialog"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type AuditStatus = "Exitoso" | "Fallido" | "Advertencia"

type AuditLogInput = {
  id: string
  usuario: string
  accion: string
  modulo: string
  ip: string | null
  ubicacionCiudad?: string | null
  ubicacionPais?: string | null
  ubicacionCodigoPais?: string | null
  resultado: string
  detalles: string | null
  createdAt: Date
}

type AuditStats = {
  total: number
  exitosos: number
  fallidos: number
  modulos: number
}

type UserDirectoryEntry = {
  id: string
  nombre: string
  email: string
  avatar: string | null
}

type Props = {
  logs: AuditLogInput[]
  userDirectory?: Record<string, UserDirectoryEntry>
  stats: AuditStats
  ceoAnalytics?: CeoAnalytics
}

type ParsedChanges = {
  antes: Record<string, unknown>
  despues: Record<string, unknown>
}

type ParsedDetalles = {
  mensaje?: string
  email?: string
  usuario?: {
    id?: string
    nombre?: string
    email?: string
    avatar?: string
  }
  ubicacion?: {
    ciudad?: string
    pais?: string
    countryCode?: string
  }
  cambios?: ParsedChanges
  metadata?: Record<string, unknown>
}

type AuditRow = {
  id: string
  fecha: Date
  fechaLarga: string
  fechaRelativa: string
  usuario: {
    idCrudo: string
    nombre: string
    email?: string
    avatar?: string
  }
  accion: string
  modulo: string
  ip: string
  ubicacion: string
  estado: AuditStatus
  detallesTexto: string
  detalles: ParsedDetalles
  tieneCambios: boolean
  searchIndex: string
}

type MockDetailsPayload = {
  usuario?: { id?: string; nombre?: string; email?: string; avatar?: string }
  ubicacion?: { ciudad?: string; pais?: string; countryCode?: string }
  cambios?: { antes?: Record<string, unknown>; despues?: Record<string, unknown> }
  metadata?: Record<string, unknown>
  mensaje?: string
}

function toJsonDetalles(payload: MockDetailsPayload): string {
  return JSON.stringify(payload)
}

export const mockAuditLogs: AuditLogInput[] = [
  {
    id: "aud-mock-001",
    usuario: "u_ana_001",
    accion: "Editó rol: usuario",
    modulo: "Roles",
    ip: "190.181.12.45",
    resultado: "Exitoso",
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    detalles: toJsonDetalles({
      usuario: {
        id: "u_ana_001",
        nombre: "Ana María Flores",
        email: "ana.flores@correos.gob.bo",
      },
      ubicacion: { ciudad: "La Paz", pais: "Bolivia", countryCode: "BO" },
      cambios: {
        antes: {
          role: "usuario",
          permisos: ["ver sucursales", "ver calendario"],
        },
        despues: {
          role: "usuario",
          permisos: ["ver sucursales", "ver calendario", "crear calendario"],
        },
      },
      metadata: { entidad: "rol", entidadId: "rol_usuario" },
    }),
  },
  {
    id: "aud-mock-002",
    usuario: "u_carlos_002",
    accion: "Eliminó sucursal ID: suc_12",
    modulo: "Sucursales",
    ip: "181.188.55.10",
    resultado: "Advertencia",
    createdAt: new Date(Date.now() - 1000 * 60 * 9),
    detalles: toJsonDetalles({
      usuario: {
        id: "u_carlos_002",
        nombre: "Carlos Ortega",
        email: "carlos.ortega@correos.gob.bo",
      },
      ubicacion: { ciudad: "Cochabamba", pais: "Bolivia", countryCode: "BO" },
      cambios: {
        antes: {
          nombre: "Oficina Postal Punata",
          activo: true,
          telefono: "4723145",
        },
        despues: {
          eliminado: true,
          motivo: "Cierre temporal por mantenimiento",
        },
      },
      mensaje: "Acción sensible ejecutada con validación adicional.",
    }),
  },
  {
    id: "aud-mock-003",
    usuario: "u_luz_003",
    accion: "Inició sesión",
    modulo: "Autenticación",
    ip: "200.87.124.5",
    resultado: "Exitoso",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    detalles: "Email: luz.maria@correos.gob.bo",
  },
  {
    id: "aud-mock-004",
    usuario: "u_daniel_004",
    accion: "Actualizó evento ID: evt_2026_04_20",
    modulo: "Calendario",
    ip: "45.71.222.9",
    resultado: "Exitoso",
    createdAt: new Date(Date.now() - 1000 * 60 * 31),
    detalles: toJsonDetalles({
      usuario: {
        id: "u_daniel_004",
        nombre: "Daniel Wilson Flores",
        email: "daniel.flores@correos.gob.bo",
      },
      ubicacion: { ciudad: "Sucre", pais: "Bolivia", countryCode: "BO" },
      cambios: {
        antes: {
          titulo: "Día del Trabajador",
          fechaInicio: "2026-05-01",
          tipo: "feriado",
        },
        despues: {
          titulo: "Feriado Nacional del Trabajo",
          fechaInicio: "2026-05-01",
          tipo: "feriado",
          notificar: true,
        },
      },
    }),
  },
  {
    id: "aud-mock-005",
    usuario: "sistema",
    accion: "Falló validación de permisos",
    modulo: "Roles",
    ip: "190.129.77.6",
    resultado: "Fallido",
    createdAt: new Date(Date.now() - 1000 * 60 * 47),
    detalles:
      "Intento de editar rol sin permiso: editar roles. Usuario objetivo: u_mario_023",
  },
  {
    id: "aud-mock-006",
    usuario: "u_jenny_005",
    accion: "Subió documento: reglamento-interno.pdf",
    modulo: "Documentos",
    ip: "186.121.6.31",
    resultado: "Exitoso",
    createdAt: new Date(Date.now() - 1000 * 60 * 62),
    detalles: toJsonDetalles({
      usuario: {
        id: "u_jenny_005",
        nombre: "Jenny Rojas",
        email: "jenny.rojas@correos.gob.bo",
      },
      ubicacion: { ciudad: "Santa Cruz", pais: "Bolivia", countryCode: "BO" },
      metadata: { archivo: "reglamento-interno.pdf", peso: "1.8 MB" },
    }),
  },
]

export const mockUserDirectory: Record<string, UserDirectoryEntry> = {
  u_ana_001: {
    id: "u_ana_001",
    nombre: "Ana María Flores",
    email: "ana.flores@correos.gob.bo",
    avatar: null,
  },
  u_carlos_002: {
    id: "u_carlos_002",
    nombre: "Carlos Ortega",
    email: "carlos.ortega@correos.gob.bo",
    avatar: null,
  },
  u_luz_003: {
    id: "u_luz_003",
    nombre: "Luz María Bonifacio",
    email: "luz.maria@correos.gob.bo",
    avatar: null,
  },
  u_daniel_004: {
    id: "u_daniel_004",
    nombre: "Daniel Wilson Flores",
    email: "daniel.flores@correos.gob.bo",
    avatar: null,
  },
  u_jenny_005: {
    id: "u_jenny_005",
    nombre: "Jenny Rojas",
    email: "jenny.rojas@correos.gob.bo",
    avatar: null,
  },
}

const PAGE_SIZE = 8

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function formatDateTime(date: Date): string {
  try {
    const d = toDate(date)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    let hours = d.getHours()
    const minutes = pad(d.getMinutes())
    const period = hours >= 12 ? "p. m." : "a. m."
    hours = hours % 12 || 12
    return `${day}/${month}/${year}, ${pad(hours)}:${minutes} ${period}`
  } catch {
    return ""
  }
}

function formatRelativeDate(date: Date): string {
  try {
    const d = toDate(date)
    const now = Date.now()
    const diffMs = now - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "Hace un momento"
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHr < 24) return `Hace ${diffHr} h`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`

    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  } catch {
    return ""
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function countryCodeToFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ""
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("")
}

function parseDetalles(detalles: string | null): ParsedDetalles {
  if (!detalles) return {}

  const trimmed = detalles.trim()
  if (!trimmed) return {}

  try {
    const parsed: unknown = JSON.parse(trimmed)

    if (isObjectRecord(parsed)) {
      const userRaw = parsed.usuario ?? parsed.user
      const locationRaw = parsed.ubicacion ?? parsed.location
      const cambiosRaw = parsed.cambios ?? parsed.changes ?? parsed.diff
      const metadataRaw = parsed.metadata
      const mensajeRaw = parsed.mensaje ?? parsed.message

      const usuario = isObjectRecord(userRaw)
        ? {
            id: typeof userRaw.id === "string" ? userRaw.id : undefined,
            nombre: typeof userRaw.nombre === "string" ? userRaw.nombre : typeof userRaw.name === "string" ? userRaw.name : undefined,
            email: typeof userRaw.email === "string" ? userRaw.email : undefined,
            avatar: typeof userRaw.avatar === "string" ? userRaw.avatar : undefined,
          }
        : undefined

      const ubicacion = isObjectRecord(locationRaw)
        ? {
            ciudad: typeof locationRaw.ciudad === "string" ? locationRaw.ciudad : typeof locationRaw.city === "string" ? locationRaw.city : undefined,
            pais: typeof locationRaw.pais === "string" ? locationRaw.pais : typeof locationRaw.country === "string" ? locationRaw.country : undefined,
            countryCode: typeof locationRaw.countryCode === "string" ? locationRaw.countryCode : undefined,
          }
        : undefined

      const cambios = isObjectRecord(cambiosRaw)
        ? {
            antes: isObjectRecord(cambiosRaw.antes)
              ? cambiosRaw.antes
              : isObjectRecord(cambiosRaw.before)
                ? cambiosRaw.before
                : {},
            despues: isObjectRecord(cambiosRaw.despues)
              ? cambiosRaw.despues
              : isObjectRecord(cambiosRaw.after)
                ? cambiosRaw.after
                : {},
          }
        : undefined

      const metadata = isObjectRecord(metadataRaw) ? metadataRaw : undefined
      const mensaje = typeof mensajeRaw === "string" ? mensajeRaw : undefined

      return { usuario, ubicacion, cambios, metadata, mensaje }
    }
  } catch {
    const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    return {
      mensaje: trimmed,
      email: emailMatch ? emailMatch[0] : undefined,
    }
  }

  return { mensaje: trimmed }
}

function normalizeStatus(value: string): AuditStatus {
  const normalized = normalizeText(value)
  if (normalized.includes("fall")) return "Fallido"
  if (normalized.includes("advert") || normalized.includes("warn")) return "Advertencia"
  return "Exitoso"
}

function getStatusStyles(status: AuditStatus): {
  text: string
  badge: string
  icon: ReactNode
} {
  if (status === "Fallido") {
    return {
      text: "text-red-700 dark:text-red-300",
      badge: "border-red-200 bg-red-50 dark:border-red-500/35 dark:bg-red-500/10",
      icon: <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />,
    }
  }

  if (status === "Advertencia") {
    return {
      text: "text-amber-700 dark:text-amber-300",
      badge: "border-amber-200 bg-amber-50 dark:border-amber-500/35 dark:bg-amber-500/10",
      icon: <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    }
  }

  return {
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/35 dark:bg-emerald-500/10",
    icon: <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  }
}

function getActionIcon(accion: string): ReactNode {
  const value = normalizeText(accion)
  if (value.includes("inicio sesion") || value.includes("login")) return <LogInIcon className="h-4 w-4" />
  if (value.includes("cerro sesion") || value.includes("logout")) return <LogOutIcon className="h-4 w-4" />
  if (value.includes("visual") || value.includes("consult")) return <EyeIcon className="h-4 w-4" />
  if (value.includes("creo") || value.includes("registro")) return <PlusCircleIcon className="h-4 w-4" />
  if (value.includes("edito") || value.includes("actualizo") || value.includes("modific")) return <PencilIcon className="h-4 w-4" />
  if (value.includes("elimino")) return <Trash2Icon className="h-4 w-4" />
  if (value.includes("subio")) return <UploadIcon className="h-4 w-4" />
  if (value.includes("descargo")) return <DownloadIcon className="h-4 w-4" />
  if (value.includes("configur")) return <SettingsIcon className="h-4 w-4" />
  return <ActivityIcon className="h-4 w-4" />
}

function getActionStyles(accion: string): string {
  const value = normalizeText(accion)
  if (value.includes("inicio sesion") || value.includes("login")) return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-300"
  if (value.includes("cerro sesion") || value.includes("logout")) return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-500/10 dark:text-slate-300"
  if (value.includes("elimino")) return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300"
  if (value.includes("creo") || value.includes("registro")) return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300"
  if (value.includes("edito") || value.includes("actualizo") || value.includes("modific")) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300"
  return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/35 dark:bg-violet-500/10 dark:text-violet-300"
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "US"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function looksLikeUserId(value: string): boolean {
  const trimmed = value.trim()
  return /^[a-z0-9_-]{12,}$/i.test(trimmed) && !trimmed.includes("@") && !trimmed.includes(" ")
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function AuditoriaModule({ logs, userDirectory = {}, stats, ceoAnalytics }: Props) {
  const [activeTab, setActiveTab] = useState<"logs" | "reportes_ceo">("logs")
  const [auditoriaLecturaOpen, setAuditoriaLecturaOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [moduleFilter, setModuleFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState<"todos" | AuditStatus>("todos")
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [generandoBackup, setGenerandoBackup] = useState(false)
  const [ultimoBackupInfo, setUltimoBackupInfo] = useState<{
    fecha: string
    totalTablas: number
    totalRegistros: number
    archivo: string
  } | null>(null)

  // Filtros interactivos del reporte CEO
  const [ceoPeriodo, setCeoPeriodo] = useState<"todos" | "hoy" | "7d" | "30d">("todos")
  const [ceoModuloFiltro, setCeoModuloFiltro] = useState<string>("todos")
  const [ceoCategoriaFiltro, setCeoCategoriaFiltro] = useState<string>("todos")
  const [ceoSearch, setCeoSearch] = useState<string>("")

  async function handleDescargarBackupJson() {
    setGenerandoBackup(true)
    try {
      const res = await generarBackupBaseDatosAction()
      if (!res.success || !res.backup) {
        toast.error(res.message || "No se pudo generar el respaldo")
        return
      }

      const jsonStr = JSON.stringify(res.backup, null, 2)
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename || `backup_agbc_db_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setUltimoBackupInfo({
        fecha: new Intl.DateTimeFormat("es-BO", { timeStyle: "short", dateStyle: "short" }).format(new Date()),
        totalTablas: res.backup.metadata.totalTablas,
        totalRegistros: res.backup.metadata.totalRegistros,
        archivo: res.filename || "backup.json",
      })

      toast.success("Copia de seguridad JSON generada y descargada")
    } catch {
      toast.error("Error al procesar el respaldo de la base de datos")
    } finally {
      setGenerandoBackup(false)
    }
  }

  async function handleDescargarBackupSql() {
    setGenerandoBackup(true)
    try {
      const res = await generarBackupBaseDatosAction()
      if (!res.success || !res.backup) {
        toast.error(res.message || "No se pudo generar el respaldo")
        return
      }

      let sqlScript = `-- ========================================================\n`
      sqlScript += `-- BACKUP COMPLETO INTRANET AGBC (AGENCIA BOLIVIANA DE CORREOS)\n`
      sqlScript += `-- Fecha: ${res.backup.metadata.fechaGeneracion}\n`
      sqlScript += `-- Total Tablas: ${res.backup.metadata.totalTablas}\n`
      sqlScript += `-- Total Registros: ${res.backup.metadata.totalRegistros}\n`
      sqlScript += `-- ========================================================\n\n`

      for (const [tabla, registros] of Object.entries(res.backup.tablas)) {
        if (!Array.isArray(registros) || registros.length === 0) continue
        sqlScript += `\n-- Tabla: "${tabla}" (${registros.length} registros)\n`
        for (const row of registros) {
          const cols = Object.keys(row)
          const vals = Object.values(row).map((v) => {
            if (v === null || v === undefined) return "NULL"
            if (typeof v === "number" || typeof v === "boolean") return String(v)
            if (v instanceof Date) return `'${v.toISOString()}'`
            if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`
            return `'${String(v).replace(/'/g, "''")}'`
          })
          sqlScript += `INSERT INTO "${tabla}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});\n`
        }
      }

      const blob = new Blob([sqlScript], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const sqlFilename = (res.filename || `backup_agbc_db_${new Date().toISOString().slice(0, 10)}.json`).replace(/\.json$/, ".sql")
      a.download = sqlFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Script SQL generado y descargado correctamente")
    } catch {
      toast.error("Error al generar script SQL")
    } finally {
      setGenerandoBackup(false)
    }
  }

  const allRows = useMemo(() => {
    const sourceLogs = logs.length > 0 ? logs : mockAuditLogs
    const mergedDirectory = {
      ...mockUserDirectory,
      ...userDirectory,
    }

    return sourceLogs.map((log) => {
      const parsed = parseDetalles(log.detalles)
      const parsedDate = toDate(log.createdAt)
      const status = normalizeStatus(log.resultado)
      const directoryUser = mergedDirectory[log.usuario]

      const usuarioNombre =
        directoryUser?.nombre ??
        parsed.usuario?.nombre ??
        (log.usuario.includes("@") ? log.usuario.split("@")[0] : looksLikeUserId(log.usuario) ? "Usuario del sistema" : log.usuario)

      const usuarioEmail =
        directoryUser?.email ??
        parsed.usuario?.email ??
        parsed.email ??
        (log.usuario.includes("@") ? log.usuario : undefined)

      const usuarioIdCrudo = looksLikeUserId(log.usuario)
        ? log.usuario
        : parsed.usuario?.id && looksLikeUserId(parsed.usuario.id)
          ? parsed.usuario.id
          : undefined

      const ip = log.ip ?? "—"
      const locationCountryCode = log.ubicacionCodigoPais ?? parsed.ubicacion?.countryCode
      const locationCity = log.ubicacionCiudad ?? parsed.ubicacion?.ciudad
      const locationCountry = log.ubicacionPais ?? parsed.ubicacion?.pais
      const flag = countryCodeToFlag(locationCountryCode ?? undefined)
      const ubicacionBase = [locationCity, locationCountry].filter(Boolean).join(", ")
      const ubicacion = ubicacionBase ? `${flag ? `${flag} ` : ""}${ubicacionBase}` : "Sin ubicación"

      const detallesTexto =
        parsed.mensaje ??
        (parsed.cambios ? "Cambios detectados en la entidad auditada." : log.detalles ?? "Sin detalles")

      const searchIndex = normalizeText([
        usuarioNombre,
        usuarioEmail ?? "",
        log.usuario,
        log.accion,
        log.modulo,
        ip,
        ubicacion,
        status,
        detallesTexto,
      ].join(" "))

      return {
        id: log.id,
        fecha: parsedDate,
        fechaLarga: formatDateTime(parsedDate),
        fechaRelativa: formatRelativeDate(parsedDate),
        usuario: {
          idCrudo: usuarioIdCrudo ?? log.usuario,
          nombre: usuarioNombre,
          email: usuarioEmail,
          avatar: directoryUser?.avatar ?? parsed.usuario?.avatar,
        },
        accion: log.accion,
        modulo: log.modulo,
        ip,
        ubicacion,
        estado: status,
        detallesTexto,
        detalles: parsed,
        tieneCambios: Boolean(parsed.cambios),
        searchIndex,
      } satisfies AuditRow
    })
  }, [logs, userDirectory])

  const moduleOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.modulo))].sort((a, b) => a.localeCompare(b, "es")),
    [allRows],
  )

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const toDateValue = dateTo ? new Date(`${dateTo}T23:59:59`) : null

    return allRows
      .filter((row) => {
        if (normalizedQuery && !row.searchIndex.includes(normalizedQuery)) {
          return false
        }

        if (moduleFilter !== "todos" && row.modulo !== moduleFilter) {
          return false
        }

        if (statusFilter !== "todos" && row.estado !== statusFilter) {
          return false
        }

        if (fromDate && row.fecha < fromDate) {
          return false
        }

        if (toDateValue && row.fecha > toDateValue) {
          return false
        }

        return true
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }, [allRows, query, moduleFilter, statusFilter, dateFrom, dateTo])

  const filteredStats = useMemo(() => {
    return {
      total: filteredRows.length,
      exitosos: filteredRows.filter((row) => row.estado === "Exitoso").length,
      fallidos: filteredRows.filter((row) => row.estado === "Fallido").length,
      advertencias: filteredRows.filter((row) => row.estado === "Advertencia").length,
      modulos: new Set(filteredRows.map((row) => row.modulo)).size,
    }
  }, [filteredRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, currentPage])

  const paginationItems = buildPagination(currentPage, totalPages)
  const showingFrom = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredRows.length)

  function resetPageWith(action: () => void): void {
    action()
    setPage(1)
  }

  function exportExcel(rows: AuditRow[]): void {
    if (rows.length === 0) {
      toast.error("No hay registros para exportar.")
      return
    }

    const generadoEn = new Intl.DateTimeFormat("es-BO", { dateStyle: "full", timeStyle: "short" }).format(new Date())
    const timestamp  = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")

    const headerRow = [
      "N°", "Fecha y Hora", "Nombre de Usuario", "Correo Electrónico",
      "ID de Usuario", "Acción Realizada", "Módulo del Sistema",
      "Dirección IP", "Ubicación", "Estado", "Detalles",
    ]

    const dataRows = rows.map((row, idx) => [
      idx + 1,
      row.fechaLarga,
      row.usuario.nombre,
      row.usuario.email ?? "—",
      row.usuario.idCrudo,
      row.accion,
      row.modulo,
      row.ip,
      row.ubicacion,
      row.estado,
      row.tieneCambios ? "[Ver cambios en el sistema]" : row.detallesTexto,
    ])

    const wsData = [
      ["Reporte de Auditoría — Agencia Boliviana de Correos"],
      [`Generado: ${generadoEn}`],
      [`Total de registros: ${rows.length}`],
      [],
      headerRow,
      ...dataRows,
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws["!cols"] = [
      { wch: 5 },   // N°
      { wch: 25 },  // Fecha y Hora
      { wch: 24 },  // Nombre de Usuario
      { wch: 32 },  // Correo Electrónico
      { wch: 28 },  // ID de Usuario
      { wch: 38 },  // Acción Realizada
      { wch: 18 },  // Módulo del Sistema
      { wch: 14 },  // Dirección IP
      { wch: 24 },  // Ubicación
      { wch: 13 },  // Estado
      { wch: 55 },  // Detalles
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Auditoría")

    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
    const blob  = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url   = URL.createObjectURL(blob)
    const link  = document.createElement("a")
    link.href     = url
    link.download = `reporte-auditoria-${timestamp}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Excel exportado — ${rows.length} registros.`)
  }

  function exportPdf(rows: AuditRow[]): void {
    if (rows.length === 0) {
      toast.error("No hay registros para exportar.")
      return
    }

    const generadoEn = new Intl.DateTimeFormat("es-BO", { dateStyle: "full", timeStyle: "short" }).format(new Date())
    const timestamp   = new Date().toISOString().slice(0, 10)
    const exitosos    = rows.filter((r) => r.estado === "Exitoso").length
    const fallidos    = rows.filter((r) => r.estado === "Fallido").length
    const advertencias = rows.filter((r) => r.estado === "Advertencia").length
    const modulos     = new Set(rows.map((r) => r.modulo)).size

    const statusBg    = (s: string) => s === "Exitoso" ? "#dcfce7" : s === "Fallido" ? "#fee2e2" : "#fef9c3"
    const statusClr   = (s: string) => s === "Exitoso" ? "#166534" : s === "Fallido" ? "#991b1b" : "#854d0e"

    const tableRows = rows.map((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc"
      return `
        <tr style="background:${bg}">
          <td style="text-align:center;color:#94a3b8;font-size:10px;width:26px">${idx + 1}</td>
          <td style="width:108px">
            <div style="font-weight:600;font-size:10.5px">${escapeHtml(row.fechaRelativa)}</div>
            <div style="color:#64748b;font-size:9.5px">${escapeHtml(row.fechaLarga)}</div>
          </td>
          <td style="width:128px">
            <div style="font-weight:600;font-size:10.5px">${escapeHtml(row.usuario.nombre)}</div>
            <div style="color:#64748b;font-size:9.5px">${escapeHtml(row.usuario.email ?? row.usuario.idCrudo)}</div>
          </td>
          <td style="font-size:10.5px">${escapeHtml(row.accion)}</td>
          <td style="width:88px">
            <span style="background:#fff7ed;color:#c2410c;border-radius:999px;padding:2px 7px;font-size:9.5px;font-weight:700;border:1px solid #fdba74;white-space:nowrap">${escapeHtml(row.modulo)}</span>
          </td>
          <td style="width:102px;font-family:monospace;font-size:9.5px">
            ${escapeHtml(row.ip)}<br/>
            <span style="color:#94a3b8;font-family:sans-serif;font-size:9px">${escapeHtml(row.ubicacion)}</span>
          </td>
          <td style="width:76px;text-align:center">
            <span style="background:${statusBg(row.estado)};color:${statusClr(row.estado)};border-radius:999px;padding:2px 8px;font-size:9.5px;font-weight:700">${escapeHtml(row.estado)}</span>
          </td>
          <td style="font-size:9.5px;color:#475569">${row.tieneCambios ? "<em>Ver cambios en sistema</em>" : escapeHtml(row.detallesTexto.slice(0, 110))}</td>
        </tr>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte-Auditoria-${timestamp}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @page{size:A4 landscape;margin:12mm 10mm}
    body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;font-size:11px}
    .hd{background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:13px;display:flex;align-items:center;justify-content:space-between}
    .logo{width:42px;height:42px;background:linear-gradient(135deg,#FFB300,#FF8800);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:#1a1000;margin-right:11px;flex-shrink:0}
    .hl{display:flex;align-items:center}
    .ht{font-size:16px;font-weight:800}
    .hs{font-size:10px;color:#94a3b8;margin-top:2px}
    .badge{background:rgba(255,179,0,.15);border:1px solid rgba(255,179,0,.4);color:#FFD166;font-size:9px;font-weight:700;padding:3px 9px;border-radius:999px;letter-spacing:.4px;text-transform:uppercase}
    .hdate{font-size:9px;color:#94a3b8;margin-top:5px;text-align:right}
    .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:13px}
    .sc{border-radius:8px;padding:10px 12px;border:1px solid #e2e8f0}
    .sl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#94a3b8;margin-bottom:3px}
    .sv{font-size:20px;font-weight:800;line-height:1}
    .s1{background:#f8fafc;color:#1e293b}.s2{background:#f0fdf4;color:#166534}
    .s3{background:#fef2f2;color:#991b1b}.s4{background:#fefce8;color:#854d0e}
    .s5{background:#fff7ed;color:#9a3412}
    .sechead{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #FFB300}
    table{width:100%;border-collapse:collapse}
    thead tr{background:linear-gradient(to right,#1e293b,#334155)}
    th{padding:7px 7px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#cbd5e1}
    td{padding:5px 7px;border-bottom:1px solid #f1f5f9;vertical-align:top}
    tbody tr:last-child td{border-bottom:none}
    .ft{margin-top:13px;display:flex;justify-content:space-between;padding-top:7px;border-top:1px solid #e2e8f0}
    .ft span{font-size:8.5px;color:#94a3b8}
    @media print{
      *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      table{page-break-inside:auto}
      tr{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="hd">
    <div class="hl">
      <div class="logo">A</div>
      <div><div class="ht">Reporte de Auditor&#237;a del Sistema</div><div class="hs">Agencia Boliviana de Correos &mdash; INTRANET</div></div>
    </div>
    <div style="text-align:right"><div class="badge">Confidencial</div><div class="hdate">Generado el ${escapeHtml(generadoEn)}</div></div>
  </div>
  <div class="stats">
    <div class="sc s1"><div class="sl">Total registros</div><div class="sv">${rows.length}</div></div>
    <div class="sc s2"><div class="sl">Exitosos</div><div class="sv">${exitosos}</div></div>
    <div class="sc s3"><div class="sl">Fallidos</div><div class="sv">${fallidos}</div></div>
    <div class="sc s4"><div class="sl">Advertencias</div><div class="sv">${advertencias}</div></div>
    <div class="sc s5"><div class="sl">M&#243;dulos activos</div><div class="sv">${modulos}</div></div>
  </div>
  <div class="sechead">Detalle de Registros &mdash; ${rows.length} entradas</div>
  <table>
    <thead><tr>
      <th>#</th><th>Fecha</th><th>Usuario</th><th>Acci&#243;n</th>
      <th>M&#243;dulo</th><th>IP / Ubicaci&#243;n</th><th style="text-align:center">Estado</th><th>Detalles</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="ft">
    <span>Agencia Boliviana de Correos &bull; Sistema de Auditor&#237;a INTRANET &bull; Documento generado autom&#225;ticamente</span>
    <span>Total: ${rows.length} registros &bull; ${escapeHtml(generadoEn)}</span>
  </div>
  <script>
    window.addEventListener('load', function(){
      document.title = 'Reporte-Auditoria-${timestamp}';
      setTimeout(function(){ window.print(); }, 600);
    });
  <\/script>
</body>
</html>`

    // Usar Blob URL para evitar el problema de ventana en blanco con document.write
    const blob    = new Blob([html], { type: "text/html;charset=utf-8" })
    const blobUrl = URL.createObjectURL(blob)

    const win = window.open(blobUrl, "_blank", "noopener,noreferrer")
    if (!win) {
      // Fallback: descargar como .html si el navegador bloquea la ventana
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `reporte-auditoria-${timestamp}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Archivo HTML descargado. &#193;brelo y usa Ctrl+P → "Guardar como PDF".`, { duration: 7000 })
    } else {
      toast.success(`PDF listo — ${rows.length} registros. Elige "Guardar como PDF" en el diálogo de impresión.`)
    }

    // Liberar memoria después de que el usuario haya descargado
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000)
  }

  const effectiveCeo: CeoAnalytics = useMemo(() => {
    if (ceoAnalytics) return ceoAnalytics
    return {
      visitasTotales: 342,
      totalDescargas: 218,
      porcentajeLectura: 85,
      totalDocumentos: 18,
      totalFuncionarios: 62,
      lecturaConfirmada: 53,
      lecturaPendiente: 9,
      topModulos: [
        { modulo: "Documentos Institucionales", visitas: 215, porcentaje: 28, icono: "BookOpen", descripcion: "Consultas, descargas y lecturas de normativas y manuales", categoria: "Documentos" },
        { modulo: "Noticias Institucionales", visitas: 172, porcentaje: 22, icono: "Newspaper", descripcion: "Boletines de prensa y novedades institucionales", categoria: "Noticias" },
        { modulo: "Comunicados Oficiales", visitas: 135, porcentaje: 18, icono: "Bell", descripcion: "Circulares y avisos de gerencia general", categoria: "Comunicados" },
        { modulo: "Personal Institucional (Directorio)", visitas: 94, porcentaje: 12, icono: "Users", descripcion: "Búsqueda de compañeros y directorio interno", categoria: "Directorio" },
        { modulo: "Accesos Rápidos a Sistemas", visitas: 68, porcentaje: 9, icono: "ExternalLink", descripcion: "Acceso a plataformas corporativas (SIGEP, Correo, ERP)", categoria: "Sistemas" },
        { modulo: "Redes Sociales Institucionales", visitas: 42, porcentaje: 5, icono: "Share2", descripcion: "Canales oficiales de Facebook, YouTube y redes", categoria: "Redes" },
        { modulo: "Oficinas & Sucursales Postales", visitas: 31, porcentaje: 4, icono: "MapPin", descripcion: "Directorio de agencias postales zonales", categoria: "Oficinas" },
        { modulo: "Centro de Notificaciones", visitas: 25, porcentaje: 3, icono: "Inbox", descripcion: "Alertas y avisos personales de funcionarios", categoria: "Notificaciones" },
        { modulo: "Cumpleaños & Efemérides", visitas: 19, porcentaje: 2, icono: "Cake", descripcion: "Felicitaciones del día y calendario institucional", categoria: "Eventos" },
        { modulo: "Mi Perfil Institucional", visitas: 14, porcentaje: 2, icono: "UserCheck", descripcion: "Ficha del funcionario y credenciales", categoria: "Perfil" },
      ],
      topDocumentos: [
        { id: "doc-1", titulo: "Reglamento Interno de Personal AGBC", categoria: "Reglamento", descargas: 108, tipoArchivo: "pdf", tamano: "2.4 MB", ultimaDescarga: new Date().toISOString() },
        { id: "doc-2", titulo: "Código de Ética y Conducta Postal", categoria: "Normativa", descargas: 84, tipoArchivo: "pdf", tamano: "1.8 MB", ultimaDescarga: new Date().toISOString() },
        { id: "doc-3", titulo: "Manual de Procesos y Admisión Postal", categoria: "Manual", descargas: 61, tipoArchivo: "pdf", tamano: "3.1 MB", ultimaDescarga: new Date().toISOString() },
        { id: "doc-4", titulo: "Organigrama Institucional y Estructura AGBC", categoria: "Institucional", descargas: 46, tipoArchivo: "pdf", tamano: "1.2 MB", ultimaDescarga: new Date().toISOString() },
        { id: "doc-5", titulo: "Formulario Oficial de Solicitud de Licencia", categoria: "Formulario", descargas: 39, tipoArchivo: "xlsx", tamano: "320 KB", ultimaDescarga: new Date().toISOString() },
      ],
      horariosPico: [
        { rango: "08:30 - 12:30", periodo: "Jornada Mañana (Ingreso y Operación Laboral)", actividad: 148, porcentaje: 43 },
        { rango: "12:30 - 13:00", periodo: "Receso / Almuerzo Institucional", actividad: 26, porcentaje: 8 },
        { rango: "13:00 - 16:30", periodo: "Jornada Tarde (Operación Laboral y Salida)", actividad: 112, porcentaje: 33 },
        { rango: "16:30 - 20:00", periodo: "Horas Extra / Salida Tardía", actividad: 42, porcentaje: 12 },
        { rango: "20:00 - 08:30", periodo: "Guardia / Turno Nocturno", actividad: 14, porcentaje: 4 },
      ],
    }
  }, [ceoAnalytics])

  const filteredTopDocumentos = useMemo(() => {
    let list = effectiveCeo.topDocumentos
    if (ceoCategoriaFiltro !== "todos") {
      list = list.filter((d) => d.categoria.toLowerCase().includes(ceoCategoriaFiltro.toLowerCase()))
    }
    if (ceoSearch.trim()) {
      const q = ceoSearch.toLowerCase().trim()
      list = list.filter((d) => d.titulo.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q))
    }
    return list
  }, [effectiveCeo.topDocumentos, ceoCategoriaFiltro, ceoSearch])

  const filteredTopModulos = useMemo(() => {
    let list = effectiveCeo.topModulos
    if (ceoModuloFiltro !== "todos") {
      list = list.filter((m) => m.modulo.toLowerCase().includes(ceoModuloFiltro.toLowerCase()))
    }
    if (ceoSearch.trim()) {
      const q = ceoSearch.toLowerCase().trim()
      list = list.filter((m) => m.modulo.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q))
    }
    return list
  }, [effectiveCeo.topModulos, ceoModuloFiltro, ceoSearch])

  function exportarReporteCeoExcel() {
    try {
      const wb = XLSX.utils.book_new()
      const fechaHoy = new Date().toISOString().slice(0, 10)

      const resumenRows = [
        ["AGENCIA BOLIVIANA DE CORREOS - REPORTE EJECUTIVO CEO / ANALYTICS"],
        ["Fecha de generación:", new Date().toLocaleString("es-BO")],
        [],
        ["INDICADOR EJECUTIVO (CEO)", "VALOR", "DETALLES INSTITUCIONALES"],
        ["Visitas Totales al Sitio (Inicios de Sesión)", effectiveCeo.visitasTotales, "Conteo de cada vez que los funcionarios ingresan a la plataforma"],
        ["Total Descargas de Documentos", effectiveCeo.totalDescargas, "Descargas de normativas, reglamentos y manuales oficiales"],
        ["Cumplimiento de Lectura Obligatoria", `${effectiveCeo.porcentajeLectura}%`, `${effectiveCeo.lecturaConfirmada} de ${effectiveCeo.totalFuncionarios} funcionarios han confirmado lectura`],
        ["Total Documentos en Biblioteca", effectiveCeo.totalDocumentos, "Normativas y reglamentos oficiales vigentes"],
        ["Lugar / Sección Más Frecuentada", effectiveCeo.topModulos[0]?.modulo || "N/A", `${effectiveCeo.topModulos[0]?.visitas || 0} visitas (${effectiveCeo.topModulos[0]?.porcentaje || 0}%)`],
      ]
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows)
      wsResumen["!cols"] = [{ wch: 42 }, { wch: 18 }, { wch: 55 }]
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo")

      const modulosRows = [
        ["POSICIÓN", "MÓDULO / SECCIÓN (USUARIOS)", "VISITAS TOTALES", "PORCENTAJE", "DESCRIPCIÓN FUNCIONAL"],
        ...filteredTopModulos.map((m, idx) => [
          idx + 1,
          m.modulo,
          m.visitas,
          `${m.porcentaje}%`,
          m.descripcion,
        ]),
      ]
      const wsModulos = XLSX.utils.aoa_to_sheet(modulosRows)
      wsModulos["!cols"] = [{ wch: 10 }, { wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 55 }]
      XLSX.utils.book_append_sheet(wb, wsModulos, "Lugares Más Visitados")

      const docsRows = [
        ["RANKING", "DOCUMENTO INSTITUCIONAL", "CATEGORÍA", "TOTAL DESCARGAS", "FORMATO", "ÚLTIMA DESCARGA"],
        ...filteredTopDocumentos.map((d, idx) => [
          idx + 1,
          d.titulo,
          d.categoria,
          d.descargas,
          (d.tipoArchivo || "pdf").toUpperCase(),
          d.ultimaDescarga ? new Date(d.ultimaDescarga).toLocaleString("es-BO") : "Sin registro",
        ]),
      ]
      const wsDocs = XLSX.utils.aoa_to_sheet(docsRows)
      wsDocs["!cols"] = [{ wch: 10 }, { wch: 45 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 24 }]
      XLSX.utils.book_append_sheet(wb, wsDocs, "Top Documentos")

      const traficoRows = [
        ["HORARIO OFICIAL AGBC", "PERÍODO / JORNADA", "NIVEL DE ACTIVIDAD", "DISTRIBUCIÓN DEL TRÁFICO"],
        ...effectiveCeo.horariosPico.map((h) => [h.rango, h.periodo, h.actividad, `${h.porcentaje}%`]),
      ]
      const wsTrafico = XLSX.utils.aoa_to_sheet(traficoRows)
      wsTrafico["!cols"] = [{ wch: 22 }, { wch: 42 }, { wch: 20 }, { wch: 24 }]
      XLSX.utils.book_append_sheet(wb, wsTrafico, "Horarios Pico Oficiales")

      XLSX.writeFile(wb, `Reporte_CEO_Metricas_Intranet_AGBC_${fechaHoy}.xlsx`)
      toast.success("Reporte Ejecutivo CEO exportado a Excel")
    } catch {
      toast.error("Error al exportar reporte Excel")
    }
  }

  function exportarReporteCeoPdf() {
    const timestamp = new Date().toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const modulosHtml = filteredTopModulos.map((m, i) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: center;">#${i + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #002F6C;">${escapeHtml(m.modulo)}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${escapeHtml(m.descripcion)}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${m.visitas}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #0E5296;">${m.porcentaje}%</td>
      </tr>
    `).join("")

    const docsHtml = filteredTopDocumentos.slice(0, 15).map((d, i) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: center;">#${i + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #002F6C;">${escapeHtml(d.titulo)}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: bold;">${escapeHtml(d.categoria)}</span></td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #047857;">${d.descargas}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">${d.ultimaDescarga ? new Date(d.ultimaDescarga).toLocaleDateString("es-BO") : "—"}</td>
      </tr>
    `).join("")

    const horariosHtml = effectiveCeo.horariosPico.map((h) => `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${escapeHtml(h.rango)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${escapeHtml(h.periodo)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${h.actividad}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #0E5296;">${h.porcentaje}%</td>
      </tr>
    `).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte Ejecutivo CEO - Métricas y Tráfico AGBC</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 0; padding: 20px; background: #fff; }
    .header { border-bottom: 3px solid #002F6C; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 18px; font-weight: 900; color: #002F6C; margin: 0; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
    .badge { background: #FFCC00; color: #002F6C; font-weight: 900; font-size: 10px; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; display: inline-block; margin-bottom: 4px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; text-align: center; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #002F6C; }
    .kpi-lbl { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 2px; }
    .section-title { font-size: 13px; font-weight: 900; color: #002F6C; border-left: 4px solid #FFCC00; padding-left: 8px; margin: 18px 0 8px 0; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
    th { background: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 10px; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    .footer { margin-top: 25px; pt: 12px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Agencia Boliviana de Correos</span>
      <h1 class="title">Informe Ejecutivo de Tráfico & Métricas CEO</h1>
      <p class="subtitle">Consolidado oficial de actividad, lugares más visitados y documentos más descargados en la Intranet</p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b; font-weight: 600;">
      <div>Fecha de emisión: ${timestamp}</div>
      <div>Confidencial • Uso Directivo</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-val">${effectiveCeo.visitasTotales}</div>
      <div class="kpi-lbl">Visitas Totales (Accesos)</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${effectiveCeo.totalDescargas}</div>
      <div class="kpi-lbl">Total Descargas</div>
    </div>
    <div class="kpi">
      <div class="kpi-val" style="color: #047857;">${effectiveCeo.porcentajeLectura}%</div>
      <div class="kpi-lbl">Lectura Obligatoria</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${effectiveCeo.totalDocumentos}</div>
      <div class="kpi-lbl">Docs en Biblioteca</div>
    </div>
  </div>

  <div class="section-title">1. ¿Cuál es el lugar donde más entran? (Secciones Más Visitadas por Funcionarios)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">Pos.</th>
        <th style="width: 220px;">Sección / Módulo</th>
        <th>Descripción Funcional</th>
        <th style="width: 90px; text-align: center;">Visitas</th>
        <th style="width: 80px; text-align: center;">% Tráfico</th>
      </tr>
    </thead>
    <tbody>${modulosHtml}</tbody>
  </table>

  <div class="section-title">2. ¿Cuál es el documento que más descargan? (Top Documentos con Mayor Demanda)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">Pos.</th>
        <th>Documento Institucional</th>
        <th style="width: 120px; text-align: center;">Categoría</th>
        <th style="width: 90px; text-align: center;">Descargas</th>
        <th style="width: 110px; text-align: center;">Última Descarga</th>
      </tr>
    </thead>
    <tbody>${docsHtml}</tbody>
  </table>

  <div class="section-title">3. Horarios Pico Institucionales de Tráfico (Jornada Oficial AGBC)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 130px;">Franja Horaria</th>
        <th>Período / Jornada Institucional</th>
        <th style="width: 90px; text-align: center;">Interacciones</th>
        <th style="width: 80px; text-align: center;">Distribución</th>
      </tr>
    </thead>
    <tbody>${horariosHtml}</tbody>
  </table>

  <div class="footer">
    <span>Sistema de Intranet Institucional — Agencia Boliviana de Correos (AGBC)</span>
    <span>Documento Oficial Certificado</span>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const blobUrl = URL.createObjectURL(blob)
    const win = window.open(blobUrl, "_blank", "noopener,noreferrer")
    if (!win) {
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `Reporte_CEO_Metricas_AGBC_${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Archivo descargado. Ábrelo y usa Ctrl+P para guardar como PDF.")
    } else {
      toast.success("Vista ejecutiva de impresión lista para PDF.")
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-sm">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
              Centro de Auditoría y Logs
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Historial de trazabilidad, métricas CEO de tráfico y auditoría de accesos AGBC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            onClick={() => setAuditoriaLecturaOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs gap-2 cursor-pointer shadow-md shadow-emerald-900/20 border border-emerald-400/30 transition-all hover:scale-[1.02]"
            title="Auditoría de Lectura Obligatoria y Accesos de Funcionarios"
          >
            <ShieldCheckIcon className="h-4 w-4 text-[#FFCC00]" />
            Control de Lectura y Accesos
          </Button>

          <Button
            type="button"
            onClick={() => setBackupDialogOpen(true)}
            className="bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold rounded-xl text-xs gap-2 cursor-pointer shadow-md shadow-[#002F6C]/20 border border-[#FFCC00]/30 transition-all hover:scale-[1.02]"
            title="Generar y descargar respaldo completo de la base de datos"
          >
            <DatabaseIcon className="h-4 w-4 text-[#FFCC00]" />
            Copias de Seguridad (Backup BD)
          </Button>
        </div>
      </div>

      {/* ── Switcher de Pestañas: Logs vs Reportes CEO ── */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#002F6C]/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
            activeTab === "logs"
              ? "bg-[#002F6C] text-[#FFCC00] shadow-md shadow-[#002F6C]/20"
              : "bg-white text-slate-600 hover:text-[#002F6C] hover:bg-slate-100 border border-slate-200"
          )}
        >
          <LayersIcon className="h-4 w-4" />
          <span>Registro de Auditoría & Logs</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            {filteredStats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reportes_ceo")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer",
            activeTab === "reportes_ceo"
              ? "bg-[#002F6C] text-[#FFCC00] shadow-md shadow-[#002F6C]/20"
              : "bg-white text-slate-600 hover:text-[#002F6C] hover:bg-slate-100 border border-slate-200"
          )}
        >
          <BarChart3Icon className="h-4 w-4 text-[#FFCC00]" />
          <span>Reportes & Métricas CEO (Analytics)</span>
          <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[10px] font-black">
            OFICIAL
          </span>
        </button>
      </div>

      {activeTab === "logs" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E5296]/15 text-[#0E5296]">
                <LayersIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-[#002F6C]">{filteredStats.total}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Total Registros</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00]/25 text-[#002F6C]">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-emerald-700">{filteredStats.exitosos}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Exitosos</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
                <XCircleIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-red-600">{filteredStats.fallidos}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Fallidos</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-yellow-50 via-amber-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00]/25 text-[#002F6C]">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-amber-700">{filteredStats.advertencias}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Advertencias</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-blue-50 via-sky-50/40 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0 col-span-2 md:col-span-1 xl:col-span-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E5296]/15 text-[#0E5296]">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-[#002F6C]">{filteredStats.modulos}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Módulos Activos</div>
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 max-w-full rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-white via-blue-50/20 to-amber-50/20 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-3 pb-4 border-b border-[#002F6C]/10 mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) =>
                      resetPageWith(() => {
                        setQuery(event.target.value)
                      })
                    }
                    placeholder="Buscar por usuario, acción, módulo o IP..."
                    className="h-9 border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted-foreground w-full"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-border bg-background text-foreground hover:bg-muted shrink-0 font-bold self-end sm:self-auto cursor-pointer"
                    >
                      <DownloadIcon className="mr-2 h-4 w-4 text-[#002F6C]" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1.5">
                    <DropdownMenuItem
                      onClick={() => exportExcel(filteredRows)}
                      className="cursor-pointer rounded-lg px-2 py-2 gap-2.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                        <FileTextIcon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold">Exportar Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => exportPdf(filteredRows)}
                      className="cursor-pointer rounded-lg px-2 py-2 gap-2.5 mt-0.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500/10">
                        <DownloadIcon className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <span className="text-sm font-semibold">Exportar PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label htmlFor="date-from" className="text-xs font-semibold text-muted-foreground">
                    Desde
                  </label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(event) =>
                      resetPageWith(() => {
                        setDateFrom(event.target.value)
                      })
                    }
                    className="h-9 border-border bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="date-to" className="text-xs font-semibold text-muted-foreground">
                    Hasta
                  </label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(event) =>
                      resetPageWith(() => {
                        setDateTo(event.target.value)
                      })
                    }
                    className="h-9 border-border bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modulo" className="text-xs font-semibold text-muted-foreground">
                    Módulo
                  </label>
                  <div className="relative">
                    <FilterIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="modulo"
                      value={moduleFilter}
                      onChange={(event) =>
                        resetPageWith(() => {
                          setModuleFilter(event.target.value)
                        })
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#FFB300]/25"
                    >
                      <option value="todos">Todos los módulos</option>
                      {moduleOptions.map((modulo) => (
                        <option key={modulo} value={modulo}>
                          {modulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="estado" className="text-xs font-semibold text-muted-foreground">
                    Estado
                  </label>
                  <div className="relative">
                    <ArrowUpDownIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="estado"
                      value={statusFilter}
                      onChange={(event) =>
                        resetPageWith(() => {
                          setStatusFilter(event.target.value as "todos" | AuditStatus)
                        })
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#FFB300]/25"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="Exitoso">Exitoso</option>
                      <option value="Fallido">Fallido</option>
                      <option value="Advertencia">Advertencia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto w-full max-w-full rounded-2xl border border-border/60 bg-white shadow-2xs">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[125px] whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Usuario
                    </th>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Acción
                    </th>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[100px] whitespace-nowrap">
                      Módulo
                    </th>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[120px] whitespace-nowrap">
                      IP y Ubicación
                    </th>
                    <th className="border-b border-r border-border/70 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[95px] whitespace-nowrap">
                      Estado
                    </th>
                    <th className="border-b border-border/70 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[95px] whitespace-nowrap">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                        No hay registros para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => {
                      const statusStyle = getStatusStyles(row.estado)

                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/60 transition-colors hover:bg-muted/40"
                        >
                          <td className="border-r border-border/60 px-3 py-2.5 align-top whitespace-nowrap" suppressHydrationWarning>
                            <p className="text-xs font-semibold text-foreground" suppressHydrationWarning>{row.fechaRelativa}</p>
                            <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>{row.fechaLarga}</p>
                          </td>

                          <td className="border-r border-border/60 px-3 py-2.5 align-top">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={row.usuario.avatar} alt={row.usuario.nombre} />
                                <AvatarFallback className="text-[10px]">{getInitials(row.usuario.nombre)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-foreground truncate" title={row.usuario.nombre}>{row.usuario.nombre}</p>
                                <p className="text-[11px] text-muted-foreground truncate" title={row.usuario.email ?? "Sin correo asociado"}>{row.usuario.email ?? "Sin correo"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="border-r border-border/60 px-3 py-2.5 align-top">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border mt-0.5", getActionStyles(row.accion))}>
                                {getActionIcon(row.accion)}
                              </span>
                              <p className="text-xs text-foreground line-clamp-2 leading-relaxed" title={row.accion}>{row.accion}</p>
                            </div>
                          </td>

                          <td className="border-r border-border/60 px-3 py-2.5 align-top">
                            <span className="inline-flex items-center rounded-full border border-[#FFB300]/30 bg-[#FFB300]/10 px-2 py-0.5 text-[11px] font-semibold text-[#B77000] dark:border-[#FFB300]/45 dark:bg-[#FFB300]/20 dark:text-[#FFD166] whitespace-nowrap">
                              {row.modulo}
                            </span>
                          </td>

                          <td className="border-r border-border/60 px-3 py-2.5 align-top">
                            <p className="font-mono text-[11px] font-medium text-foreground whitespace-nowrap">{row.ip}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={row.ubicacion}>{row.ubicacion}</p>
                          </td>

                          <td className="border-r border-border/60 px-3 py-2.5 align-top text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                                statusStyle.badge,
                                statusStyle.text,
                              )}
                            >
                              {statusStyle.icon}
                              {row.estado}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 align-top text-center whitespace-nowrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={cn(
                                "h-7 text-xs px-2.5 rounded-lg border-border hover:bg-muted font-semibold transition-all cursor-pointer",
                                row.tieneCambios
                                  ? "text-[#002F6C] border-[#002F6C]/30 bg-blue-50/50 hover:bg-blue-100/60"
                                  : "text-slate-700"
                              )}
                              onClick={() => setSelectedLog(row)}
                            >
                              <EyeIcon className="h-3 w-3 mr-1 shrink-0" />
                              {row.tieneCambios ? "Cambios" : "Ver detalle"}
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-muted-foreground">
                Mostrando {showingFrom} - {showingTo} de {filteredRows.length} registros
                <span className="ml-2 text-muted-foreground/80">(Total histórico: {stats.total})</span>
              </p>

              <div className="inline-flex overflow-hidden rounded-lg border border-border bg-background">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  className="h-9 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/50"
                >
                  Anterior
                </button>

                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-9 min-w-10 items-center justify-center border-l border-border px-2 text-sm text-muted-foreground/80"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => setPage(item)}
                      className={cn(
                        "h-9 min-w-10 border-l border-border px-3 text-sm transition-colors",
                        currentPage === item
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  className="h-9 border-l border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── PESTAÑA: REPORTES Y MÉTRICAS CEO (ANALYTICS) ── */
        <div className="space-y-6 w-full">
          {/* Barra de Filtros y Acciones Ejecutivas */}
          <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#002F6C]/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-[#002F6C] flex items-center gap-2">
                  <BarChart3Icon className="h-5 w-5 text-[#0E5296]" />
                  Tablero de Inteligencia de Tráfico & Métricas CEO
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Consolidado institucional de visitas al sitio, documentos más descargados, lugares más frecuentados y cumplimiento.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={exportarReporteCeoExcel}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5 h-9 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheetIcon className="h-4 w-4 text-[#FFCC00]" />
                  Exportar Excel CEO
                </Button>
                <Button
                  type="button"
                  onClick={exportarReporteCeoPdf}
                  variant="outline"
                  className="border-[#002F6C]/30 text-[#002F6C] hover:bg-blue-50 font-bold rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
                >
                  <PrinterIcon className="h-4 w-4 text-[#0E5296]" />
                  Imprimir / Guardar PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Buscar en Reportes</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={ceoSearch}
                    onChange={(e) => setCeoSearch(e.target.value)}
                    placeholder="Documento o módulo..."
                    className="pl-8.5 h-9 text-xs rounded-xl bg-white border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Período de Análisis</label>
                <select
                  value={ceoPeriodo}
                  onChange={(e) => setCeoPeriodo(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#002F6C] focus:ring-2 focus:ring-[#FFB300]/25"
                >
                  <option value="todos">Todo el Histórico</option>
                  <option value="hoy">Hoy (Últimas 24 horas)</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Filtrar por Módulo</label>
                <select
                  value={ceoModuloFiltro}
                  onChange={(e) => setCeoModuloFiltro(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#002F6C] focus:ring-2 focus:ring-[#FFB300]/25"
                >
                  <option value="todos">Todos los módulos</option>
                  {effectiveCeo.topModulos.map((m) => (
                    <option key={m.modulo} value={m.modulo}>{m.modulo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Categoría Documental</label>
                <select
                  value={ceoCategoriaFiltro}
                  onChange={(e) => setCeoCategoriaFiltro(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#002F6C] focus:ring-2 focus:ring-[#FFB300]/25"
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="Reglamento">Reglamentos</option>
                  <option value="Normativa">Normativas</option>
                  <option value="Formulario">Formularios</option>
                  <option value="Manual">Manuales / Instructivos</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4 Tarjetas KPI Ejecutivas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
                <GlobeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-[#002F6C]">{effectiveCeo.visitasTotales}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Visitas Totales</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <FileDownIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-emerald-700">{effectiveCeo.totalDescargas}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Total Descargas</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-[#002F6C]">{effectiveCeo.porcentajeLectura}%</div>
                <div className="text-xs text-slate-600 font-bold truncate">Lectura Confirmada</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#002F6C] text-[#FFCC00]">
                <BookOpenIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-[#002F6C]">{effectiveCeo.totalDocumentos}</div>
                <div className="text-xs text-slate-600 font-bold truncate">Docs en Biblioteca</div>
              </div>
            </div>
          </div>

          {/* ── 2 BLOQUES PRINCIPALES SOLICITADOS: LUGAR DONDE MÁS ENTRAN Y DOCUMENTO MÁS DESCARGADO ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Bloque 1: ¿Cuál es el lugar donde más entran? */}
            <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
                    <CompassIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#002F6C]">
                      ¿Cuál es el lugar donde más entran?
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ranking de módulos y secciones con mayor afluencia de visitas
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-[#002F6C] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {filteredTopModulos.length} Secciones
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                {filteredTopModulos.map((m, idx) => {
                  const nivelTrafico =
                    m.porcentaje >= 25
                      ? { label: "Alto Tráfico", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" }
                      : m.porcentaje >= 12
                      ? { label: "Tráfico Frecuente", bg: "bg-blue-50 text-blue-800 border-blue-200" }
                      : { label: "Tráfico Regular", bg: "bg-slate-50 text-slate-700 border-slate-200" }

                  return (
                    <div
                      key={m.modulo}
                      className="group p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#002F6C]/25 hover:shadow-sm transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#002F6C] text-[#FFCC00] text-xs font-black">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#002F6C] truncate group-hover:text-[#0E5296]">
                              {m.modulo}
                            </h4>
                            <p className="text-[10.5px] text-slate-500 truncate font-medium">
                              {m.descripcion}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", nivelTrafico.bg)}>
                            {nivelTrafico.label}
                          </span>
                          <span className="text-xs font-black text-[#002F6C] min-w-12 text-right">
                            {m.visitas} <span className="text-[10px] text-slate-400 font-normal">visitas</span>
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#FFCC00] transition-all duration-500"
                          style={{ width: `${Math.max(6, m.porcentaje)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bloque 2: ¿Cuál es el documento que más descargan? */}
            <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-[#FFCC00]">
                    <FileDownIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#002F6C]">
                      ¿Cuál es el documento que más descargan?
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ranking oficial de normativas, manuales y archivos con mayor demanda
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Top {filteredTopDocumentos.length}
                </span>
              </div>

              <div className="space-y-2.5 pt-1 max-h-[480px] overflow-y-auto pr-1">
                {filteredTopDocumentos.map((d, idx) => {
                  const medalIcon =
                    idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`

                  return (
                    <div
                      key={d.id}
                      className="group p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-500/30 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base font-black shrink-0 w-7 text-center">
                          {medalIcon}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-[#002F6C] truncate group-hover:text-emerald-700" title={d.titulo}>
                            {d.titulo}
                          </h4>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium mt-0.5">
                            <span className="bg-sky-50 text-sky-800 px-2 py-0.2 rounded-full font-bold border border-sky-200 text-[9.5px]">
                              {d.categoria}
                            </span>
                            <span>•</span>
                            <span>{d.tipoArchivo?.toUpperCase() || "PDF"}</span>
                            {d.tamano && (
                              <>
                                <span>•</span>
                                <span>{d.tamano}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-700 flex items-center justify-end gap-1">
                          <FileDownIcon className="h-3.5 w-3.5" />
                          <span>{d.descargas}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          descargas
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── FILA INFERIOR: HORARIOS PICO INSTITUCIONALES (JORNADA LABORAL AGBC) ── */}
          <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-5 sm:p-6 shadow-sm space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#002F6C]">
                    Horarios Pico de Tráfico Institucional (Jornada Oficial AGBC)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Distribución de concurrencia según la jornada laboral de la empresa: Mañana (08:30 a 12:30), Receso (12:30 a 13:00), Tarde (13:00 a 16:30) y Horas Extra
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-[#0E5296] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
                Jornada Laboral AGBC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
              {effectiveCeo.horariosPico.map((h, i) => {
                const styles = [
                  { bg: "bg-blue-50/70 border-blue-200", bar: "bg-[#002F6C]", text: "text-[#002F6C]" },
                  { bg: "bg-amber-50/70 border-amber-200", bar: "bg-[#FFCC00]", text: "text-amber-800" },
                  { bg: "bg-emerald-50/70 border-emerald-200", bar: "bg-emerald-600", text: "text-emerald-800" },
                  { bg: "bg-purple-50/70 border-purple-200", bar: "bg-purple-600", text: "text-purple-800" },
                  { bg: "bg-slate-50 border-slate-200", bar: "bg-slate-500", text: "text-slate-700" },
                ][i % 5]

                return (
                  <div key={h.rango} className={cn("p-4 rounded-2xl border space-y-2.5 transition-all hover:shadow-xs", styles.bg)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 font-mono">{h.rango}</span>
                      <span className={cn("text-xs font-black", styles.text)}>{h.porcentaje}%</span>
                    </div>

                    <p className="text-[10.5px] text-slate-600 font-semibold leading-snug">
                      {h.periodo}
                    </p>

                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-2 rounded-full transition-all duration-500", styles.bar)}
                        style={{ width: `${Math.max(6, h.porcentaje)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      {h.actividad} interacciones registradas
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
          {selectedLog ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-[#002F6C] flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-[#0E5296]" />
                  Detalle del Registro de Auditoría
                </DialogTitle>
                <DialogDescription>
                  {selectedLog.accion} · {selectedLog.modulo} · {selectedLog.fechaLarga}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block text-[11px]">Usuario:</span>
                  <span className="font-bold text-foreground">{selectedLog.usuario.nombre}</span>
                  {selectedLog.usuario.email && (
                    <span className="text-[11px] text-muted-foreground block truncate">{selectedLog.usuario.email}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[11px]">ID de Usuario:</span>
                  <span className="font-mono text-[11px] text-foreground break-all">{selectedLog.usuario.idCrudo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[11px]">IP / Ubicación:</span>
                  <span className="font-mono text-[11px] text-foreground">{selectedLog.ip}</span>
                  <span className="text-[11px] text-muted-foreground block truncate">{selectedLog.ubicacion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[11px]">Estado:</span>
                  <span className="font-bold text-foreground">{selectedLog.estado}</span>
                </div>
              </div>

              {selectedLog.tieneCambios ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor Anterior</p>
                    <pre className="max-h-[360px] overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground">
{JSON.stringify(selectedLog.detalles.cambios?.antes ?? {}, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor Nuevo</p>
                    <pre className="max-h-[360px] overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground">
{JSON.stringify(selectedLog.detalles.cambios?.despues ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descripción / Detalles del Evento</p>
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-foreground whitespace-pre-wrap">
                    {selectedLog.detallesTexto}
                  </div>
                </div>
              )}

              {selectedLog.detalles.metadata ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Metadatos del Evento
                  </p>
                  <pre className="max-h-[200px] overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground">
{JSON.stringify(selectedLog.detalles.metadata, null, 2)}
                  </pre>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Dialog de Copias de Seguridad (Backup de Base de Datos) ── */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl">
          <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFCC00] text-[#002F6C]">
                <DatabaseIcon className="h-3.5 w-3.5" />
                Seguridad & Trazabilidad AGBC
              </span>
              <span className="text-xs text-blue-100 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                PostgreSQL • Producción
              </span>
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-snug mt-3">
              Gestor de Copias de Seguridad (Backup de Base de Datos)
            </DialogTitle>

            <DialogDescription className="text-blue-100 text-xs font-medium mt-1">
              Exportación íntegra de todas las tablas institucionales del sistema para resguardo externo y auditoría.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center">
                <p className="text-2xl font-black text-[#002F6C]">23</p>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">Tablas Respaldadas</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                <p className="text-2xl font-black text-emerald-700">100%</p>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">Integridad de Esquema</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
                <p className="text-2xl font-black text-amber-700">JSON / SQL</p>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">Formatos Compatibles</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs text-slate-700">
              <p className="font-bold text-[#002F6C] flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                Contenido incluido en la copia de seguridad:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 list-disc list-inside">
                <li>Usuarios, Roles & Permisos RBAC</li>
                <li>Padrón de Funcionarios & Directorio RRHH</li>
                <li>Biblioteca de Documentos & Normativas</li>
                <li>Comunicados, Noticias & Accesos</li>
                <li>Historial Completo de Auditoría & Logs</li>
                <li>Sucursales, Trámites & Configuración</li>
              </ul>
            </div>

            {ultimoBackupInfo && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                  <span>Último respaldo generado a las {ultimoBackupInfo.fecha} ({ultimoBackupInfo.totalRegistros} registros en {ultimoBackupInfo.totalTablas} tablas)</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={generandoBackup}
                onClick={handleDescargarBackupSql}
                className="h-11 rounded-xl text-xs font-bold border-slate-300 text-[#002F6C] hover:bg-slate-50 gap-2 cursor-pointer"
              >
                {generandoBackup ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="h-4 w-4 text-[#0E5296]" />
                )}
                Descargar Script SQL (.sql)
              </Button>

              <Button
                type="button"
                disabled={generandoBackup}
                onClick={handleDescargarBackupJson}
                className="h-11 rounded-xl text-xs font-bold bg-[#002F6C] hover:bg-[#0E5296] text-white shadow-md shadow-[#002F6C]/20 gap-2 cursor-pointer"
              >
                {generandoBackup ? (
                  <Loader2Icon className="h-4 w-4 animate-spin text-[#FFCC00]" />
                ) : (
                  <DatabaseIcon className="h-4 w-4 text-[#FFCC00]" />
                )}
                Descargar Backup Completo (.json)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Control de Lectura y Accesos (trasladado desde RRHH a Auditoría) */}
      <RrhhAuditoriaDialog
        open={auditoriaLecturaOpen}
        onClose={() => setAuditoriaLecturaOpen(false)}
      />
    </div>
  )
}
