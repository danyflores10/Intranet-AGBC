"use client"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent } from "@/components/ui/card"
import {
  ShieldCheckIcon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  LogInIcon,
  LogOutIcon,
  EyeIcon,
  PlusCircleIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  DownloadIcon,
  SettingsIcon,
  UserIcon,
  LayersIcon,
} from "lucide-react"

interface Props {
  logs: Array<{ id: string; usuario: string; accion: string; modulo: string; ip: string | null; resultado: string; detalles: string | null; createdAt: Date }>
  stats: { total: number; exitosos: number; fallidos: number; modulos: number }
}

function getAccionIcon(accion: string) {
  const a = accion.toLowerCase()
  if (a.includes("inició sesión") || a.includes("login")) return <LogInIcon className="h-4 w-4" />
  if (a.includes("cerró sesión") || a.includes("logout")) return <LogOutIcon className="h-4 w-4" />
  if (a.includes("visualizó") || a.includes("consultó") || a.includes("ver")) return <EyeIcon className="h-4 w-4" />
  if (a.includes("creó") || a.includes("crear") || a.includes("registró")) return <PlusCircleIcon className="h-4 w-4" />
  if (a.includes("editó") || a.includes("actualizó") || a.includes("modificó")) return <PencilIcon className="h-4 w-4" />
  if (a.includes("eliminó") || a.includes("eliminar")) return <Trash2Icon className="h-4 w-4" />
  if (a.includes("subió") || a.includes("upload")) return <UploadIcon className="h-4 w-4" />
  if (a.includes("descargó") || a.includes("download")) return <DownloadIcon className="h-4 w-4" />
  if (a.includes("configuró") || a.includes("config")) return <SettingsIcon className="h-4 w-4" />
  return <ActivityIcon className="h-4 w-4" />
}

function getAccionColor(accion: string) {
  const a = accion.toLowerCase()
  if (a.includes("inició sesión") || a.includes("login")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  if (a.includes("cerró sesión") || a.includes("logout")) return "bg-slate-500/10 text-slate-600 dark:text-slate-400"
  if (a.includes("eliminó") || a.includes("eliminar")) return "bg-red-500/10 text-red-600 dark:text-red-400"
  if (a.includes("creó") || a.includes("crear") || a.includes("registró")) return "bg-green-500/10 text-green-600 dark:text-green-400"
  if (a.includes("editó") || a.includes("actualizó") || a.includes("modificó")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  if (a.includes("visualizó") || a.includes("consultó") || a.includes("ver")) return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
}

function formatFechaRelativa(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHr < 24) return `Hace ${diffHr}h`
  if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? "s" : ""}`
  return date.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
}

export function AuditoriaModule({ logs, stats }: Props) {
  return (
    <>
      <ModuleHeader title="Auditoría del Sistema" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Centro de Auditoría</h2>
          <p className="text-sm text-muted-foreground">Registro detallado de todas las acciones realizadas en el sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/10">
                <LayersIcon className="h-6 w-6 text-[#FFB300]" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total registros</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle2Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.exitosos}</div>
                <div className="text-xs text-muted-foreground">Exitosos</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.fallidos}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB300]/10">
                <ShieldCheckIcon className="h-6 w-6 text-[#FFB300]" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.modulos}</div>
                <div className="text-xs text-muted-foreground">Módulos activos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <DataTable data={logs.map(l => ({
          ...l,
          fecha: l.createdAt.toLocaleString("es-BO"),
          fechaRelativa: formatFechaRelativa(l.createdAt),
        }))} searchKey="usuario" searchPlaceholder="Buscar por usuario, acción o módulo..."
          columns={[
            { key: "fechaRelativa", label: "Fecha", render: (row) => (
              <div>
                <div className="text-sm font-medium">{row.fechaRelativa}</div>
                <div className="text-[10px] text-muted-foreground">{row.fecha}</div>
              </div>
            )},
            { key: "usuario", label: "Usuario", render: (row) => (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="font-medium text-sm">{row.usuario}</span>
              </div>
            )},
            { key: "accion", label: "Acción", render: (row) => (
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${getAccionColor(row.accion)}`}>
                  {getAccionIcon(row.accion)}
                </div>
                <span className="text-sm">{row.accion}</span>
              </div>
            )},
            { key: "modulo", label: "Módulo", render: (row) => (
              <span className="rounded-full bg-[#FFB300]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FFB300]">{row.modulo}</span>
            )},
            { key: "ip", label: "IP", render: (row) => <span className="text-xs font-mono text-muted-foreground">{row.ip || "—"}</span> },
            { key: "resultado", label: "Estado", render: (row) => {
              const ok = row.resultado?.toLowerCase() === "exitoso" || row.resultado?.toLowerCase() === "ok" || row.resultado?.toLowerCase() === "éxito"
              return (
                <div className="flex items-center gap-1.5">
                  {ok
                    ? <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    : <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                  }
                  <span className={`text-xs font-semibold ${ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {row.resultado}
                  </span>
                </div>
              )
            }},
            { key: "detalles", label: "Detalles", render: (row) => (
              <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{row.detalles || "—"}</span>
            )},
          ]}
        />
      </div>
    </>
  )
}
