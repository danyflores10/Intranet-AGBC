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
      text: "text-red-700",
      badge: "border-red-200 bg-red-50",
      icon: <XCircleIcon className="h-4 w-4 text-red-600" />,
    }
  }

  if (status === "Advertencia") {
    return {
      text: "text-amber-700",
      badge: "border-amber-200 bg-amber-50",
      icon: <AlertTriangleIcon className="h-4 w-4 text-amber-600" />,
    }
  }

  return {
    text: "text-emerald-700",
    badge: "border-emerald-200 bg-emerald-50",
    icon: <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />,
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
  if (value.includes("inicio sesion") || value.includes("login")) return "bg-blue-50 text-blue-700 border-blue-200"
  if (value.includes("cerro sesion") || value.includes("logout")) return "bg-slate-100 text-slate-700 border-slate-200"
  if (value.includes("elimino")) return "bg-red-50 text-red-700 border-red-200"
  if (value.includes("creo") || value.includes("registro")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (value.includes("edito") || value.includes("actualizo") || value.includes("modific")) return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-violet-50 text-violet-700 border-violet-200"
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

function escapeCsvValue(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`
  }
  return value
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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

  function exportCsv(rows: AuditRow[]): void {
    if (rows.length === 0) {
      toast.error("No hay registros para exportar.")
      return
    }

    const header = [
      "Fecha",
      "Usuario",
      "Email",
      "ID usuario",
      "Accion",
      "Modulo",
      "IP",
      "Ubicacion",
      "Estado",
      "Detalles",
    ]

    const lines = rows.map((row) =>
      [
        row.fechaLarga,
        row.usuario.nombre,
        row.usuario.email ?? "",
        row.usuario.idCrudo,
        row.accion,
        row.modulo,
        row.ip,
        row.ubicacion,
        row.estado,
        row.tieneCambios ? "Ver cambios en el modal" : row.detallesTexto,
      ]
        .map((value) => escapeCsvValue(String(value)))
        .join(","),
    )

    const content = [header.join(","), ...lines].join("\n")
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    downloadBlob(content, `auditoria-${timestamp}.csv`, "text/csv;charset=utf-8;")
    toast.success("Exportación CSV completada.")
  }

  function exportPdf(rows: AuditRow[]): void {
    if (rows.length === 0) {
      toast.error("No hay registros para exportar.")
      return
    }

    const tableRows = rows
      .map((row) => {
        return `
          <tr>
            <td>${row.fechaLarga}</td>
            <td>${row.usuario.nombre}<br/><small>${row.usuario.email ?? row.usuario.idCrudo}</small></td>
            <td>${row.accion}</td>
            <td>${row.modulo}</td>
            <td>${row.ip}</td>
            <td>${row.ubicacion}</td>
            <td>${row.estado}</td>
          </tr>
        `
      })
      .join("")

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Reporte de Auditoría</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px 0; font-size: 20px; }
            p { margin: 0 0 16px 0; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #dbe2ea; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; }
            small { color: #64748b; }
          </style>
        </head>
        <body>
          <h1>Reporte de Auditoría</h1>
          <p>Generado: ${new Intl.DateTimeFormat("es-BO", { dateStyle: "full", timeStyle: "short" }).format(new Date())}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>IP</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `

    const newWindow = window.open("", "_blank", "noopener,noreferrer")
    if (!newWindow) {
      toast.error("No se pudo abrir la ventana para exportar PDF.")
      return
    }

    newWindow.document.write(html)
    newWindow.document.close()
    newWindow.focus()
    setTimeout(() => {
      newWindow.print()
    }, 250)
    toast.success("Vista de impresión PDF lista.")
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
              <div className="text-2xl font-bold text-emerald-700">{filteredStats.exitosos}</div>
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
              <div className="text-2xl font-bold text-red-700">{filteredStats.fallidos}</div>
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
              <div className="text-2xl font-bold text-amber-700">{filteredStats.advertencias}</div>
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) =>
                  resetPageWith(() => {
                    setQuery(event.target.value)
                  })
                }
                placeholder="Buscar por usuario, acción, módulo o IP..."
                className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-slate-200 bg-slate-50 text-slate-700"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => exportCsv(filteredRows)}>
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportPdf(filteredRows)}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="date-from" className="text-xs font-semibold text-slate-500">
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
                className="h-9 border-slate-200 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="date-to" className="text-xs font-semibold text-slate-500">
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
                className="h-9 border-slate-200 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modulo" className="text-xs font-semibold text-slate-500">
                Módulo
              </label>
              <div className="relative">
                <FilterIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="modulo"
                  value={moduleFilter}
                  onChange={(event) =>
                    resetPageWith(() => {
                      setModuleFilter(event.target.value)
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#FFB300]/20"
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
              <label htmlFor="estado" className="text-xs font-semibold text-slate-500">
                Estado
              </label>
              <div className="relative">
                <ArrowUpDownIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="estado"
                  value={statusFilter}
                  onChange={(event) =>
                    resetPageWith(() => {
                      setStatusFilter(event.target.value as "todos" | AuditStatus)
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#FFB300]/20"
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
            <thead className="bg-slate-50/80">
              <tr>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Usuario
                </th>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acción
                </th>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Módulo
                </th>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  IP y Ubicación
                </th>
                <th className="border-b border-r border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="border-b border-slate-200/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const statusStyle = getStatusStyles(row.estado)

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-200/70 transition-colors hover:bg-slate-50/60"
                    >
                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
                        <p className="text-sm font-semibold text-slate-800">{row.fechaRelativa}</p>
                        <p className="text-xs text-slate-500">{row.fechaLarga}</p>
                      </td>

                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <Avatar size="sm">
                            <AvatarImage src={row.usuario.avatar} alt={row.usuario.nombre} />
                            <AvatarFallback>{getInitials(row.usuario.nombre)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{row.usuario.nombre}</p>
                            <p className="text-xs text-slate-500 truncate">{row.usuario.email ?? "Sin correo asociado"}</p>
                            <p className="text-[11px] text-slate-400 truncate">ID: {row.usuario.idCrudo}</p>
                          </div>
                        </div>
                      </td>

                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
                        <div className="flex items-start gap-2">
                          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg border", getActionStyles(row.accion))}>
                            {getActionIcon(row.accion)}
                          </span>
                          <p className="text-sm text-slate-700">{row.accion}</p>
                        </div>
                      </td>

                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-full border border-[#FFB300]/20 bg-[#FFB300]/10 px-2.5 py-1 text-xs font-semibold text-[#B77000]">
                          {row.modulo}
                        </span>
                      </td>

                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
                        <p className="font-mono text-xs text-slate-700">{row.ip}</p>
                        <p className="text-xs text-slate-500">{row.ubicacion}</p>
                      </td>

                      <td className="border-r border-slate-200/70 px-4 py-3 align-top">
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
                            className="h-8 rounded-lg border-slate-200 text-slate-700"
                            onClick={() => setSelectedLog(row)}
                          >
                            Ver cambios
                          </Button>
                        ) : (
                          <p className="text-xs text-slate-500 line-clamp-2 max-w-[260px]">
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

        <div className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">
            Mostrando {showingFrom} - {showingTo} de {filteredRows.length} registros
            <span className="ml-2 text-slate-400">(Total histórico: {stats.total})</span>
          </p>

          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className="h-9 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Anterior
            </button>

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-9 min-w-10 items-center justify-center border-l border-slate-200 px-2 text-sm text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${item}`}
                  type="button"
                  onClick={() => setPage(item)}
                  className={cn(
                    "h-9 min-w-10 border-l border-slate-200 px-3 text-sm transition-colors",
                    currentPage === item
                      ? "bg-slate-100 font-semibold text-slate-800"
                      : "text-slate-600 hover:bg-slate-50",
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
              className="h-9 border-l border-slate-200 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor Anterior</p>
                  <pre className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
{JSON.stringify(selectedLog.detalles.cambios?.antes ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor Nuevo</p>
                  <pre className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
{JSON.stringify(selectedLog.detalles.cambios?.despues ?? {}, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedLog.detalles.metadata ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Metadatos del Evento
                  </p>
                  <pre className="max-h-[200px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
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
