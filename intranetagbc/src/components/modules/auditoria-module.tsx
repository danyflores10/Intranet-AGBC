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
} from "lucide-react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

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
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatRelativeDate(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Hace segundos"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHr < 24) return `Hace ${diffHr} h`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
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

export function AuditoriaModule({ logs, userDirectory = {}, stats }: Props) {
  const [query, setQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [moduleFilter, setModuleFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState<"todos" | AuditStatus>("todos")
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null)

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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Centro de Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Registro detallado de todas las acciones realizadas en el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/10">
              <LayersIcon className="h-6 w-6 text-[#FFB300]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{filteredStats.total}</div>
              <div className="text-xs text-muted-foreground">Total registros</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2Icon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{filteredStats.exitosos}</div>
              <div className="text-xs text-muted-foreground">Exitosos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{filteredStats.fallidos}</div>
              <div className="text-xs text-muted-foreground">Fallidos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{filteredStats.advertencias}</div>
              <div className="text-xs text-muted-foreground">Advertencias</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB300]/10">
              <ShieldCheckIcon className="h-6 w-6 text-[#FFB300]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{filteredStats.modulos}</div>
              <div className="text-xs text-muted-foreground">Módulos activos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) =>
                  resetPageWith(() => {
                    setQuery(event.target.value)
                  })
                }
                placeholder="Buscar por usuario, acción, módulo o IP..."
                className="h-9 border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-border bg-background text-foreground hover:bg-muted"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse">
            <thead className="bg-muted/40">
              <tr>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fecha
                </th>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Usuario
                </th>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acción
                </th>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Módulo
                </th>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  IP y Ubicación
                </th>
                <th className="border-b border-r border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Estado
                </th>
                <th className="border-b border-border/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <p className="text-sm font-semibold text-foreground">{row.fechaRelativa}</p>
                        <p className="text-xs text-muted-foreground">{row.fechaLarga}</p>
                      </td>

                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <Avatar size="sm">
                            <AvatarImage src={row.usuario.avatar} alt={row.usuario.nombre} />
                            <AvatarFallback>{getInitials(row.usuario.nombre)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{row.usuario.nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">{row.usuario.email ?? "Sin correo asociado"}</p>
                            <p className="text-[11px] text-muted-foreground/80 truncate">ID: {row.usuario.idCrudo}</p>
                          </div>
                        </div>
                      </td>

                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <div className="flex items-start gap-2">
                          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg border", getActionStyles(row.accion))}>
                            {getActionIcon(row.accion)}
                          </span>
                          <p className="text-sm text-foreground">{row.accion}</p>
                        </div>
                      </td>

                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-full border border-[#FFB300]/30 bg-[#FFB300]/10 px-2.5 py-1 text-xs font-semibold text-[#B77000] dark:border-[#FFB300]/45 dark:bg-[#FFB300]/20 dark:text-[#FFD166]">
                          {row.modulo}
                        </span>
                      </td>

                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <p className="font-mono text-xs text-foreground">{row.ip}</p>
                        <p className="text-xs text-muted-foreground">{row.ubicacion}</p>
                      </td>

                      <td className="border-r border-border/60 px-4 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            statusStyle.badge,
                            statusStyle.text,
                          )}
                        >
                          {statusStyle.icon}
                          {row.estado}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        {row.tieneCambios ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-border text-foreground hover:bg-muted"
                            onClick={() => setSelectedLog(row)}
                          >
                            Ver cambios
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[260px]">
                            {row.detallesTexto}
                          </p>
                        )}
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

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
          {selectedLog ? (
            <>
              <DialogHeader>
                <DialogTitle>Cambios auditados</DialogTitle>
                <DialogDescription>
                  {selectedLog.accion} · {selectedLog.modulo} · {selectedLog.fechaLarga}
                </DialogDescription>
              </DialogHeader>

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
    </div>
  )
}
