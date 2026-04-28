"use client"

import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  FlameIcon,
  InboxIcon,
  MapPinIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type Stats = {
  total: number
  recibidos: number
  enviados: number
  pendientes: number
  enProceso: number
  finalizados: number
  archivadas: number
  urgentes: number
  vencidos: number
  sinLeer: number
  porArea: Array<{ area: string; total: number }>
  porSucursal: Array<{ id: string; nombre: string; departamento: string; total: number }>
}

const TARJETAS = [
  { key: "recibidos", label: "Recibidos", icon: InboxIcon, color: "text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300" },
  { key: "enviados", label: "Enviados", icon: SendIcon, color: "text-sky-600 bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300" },
  { key: "pendientes", label: "Pendientes", icon: ClockIcon, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300" },
  { key: "enProceso", label: "En proceso", icon: RefreshCwIcon, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300" },
  { key: "vencidos", label: "Vencidos", icon: AlertTriangleIcon, color: "text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-300" },
  { key: "urgentes", label: "Urgentes", icon: FlameIcon, color: "text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300" },
  { key: "finalizados", label: "Finalizados", icon: CheckCircle2Icon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { key: "archivadas", label: "Archivadas", icon: ArchiveIcon, color: "text-zinc-600 bg-zinc-100 dark:bg-zinc-500/10 dark:text-zinc-300" },
] as const

export function CorrespondenciaDashboard({ stats }: { stats: Stats }) {
  const max = Math.max(1, ...stats.porArea.map((a) => a.total), ...stats.porSucursal.map((s) => s.total))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard de Correspondencia</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores institucionales de la gestión documental
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card px-3 py-1.5 text-sm">
          <ClipboardListIcon className="h-4 w-4 text-[#FFB300]" />
          <span className="text-muted-foreground">Total registrado:</span>
          <span className="font-bold">{stats.total}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {TARJETAS.map((t) => (
          <Card key={t.key} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats[t.key as keyof Stats] as number}</div>
                  <div className="text-xs text-muted-foreground">{t.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Correspondencia por área</h3>
              <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            {stats.porArea.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay datos por área.</p>
            ) : (
              <div className="space-y-3">
                {stats.porArea.slice(0, 8).map((row) => (
                  <div key={row.area} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{row.area}</span>
                      <span className="font-bold text-[#FF8800]">{row.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFB300] to-[#FF8800]"
                        style={{ width: `${(row.total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Correspondencia por sucursal</h3>
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            {stats.porSucursal.filter((s) => s.total > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay correspondencia ligada a sucursales.</p>
            ) : (
              <div className="space-y-3">
                {stats.porSucursal
                  .filter((s) => s.total > 0)
                  .slice(0, 8)
                  .map((s) => (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">
                          {s.nombre}{" "}
                          <span className="text-xs text-muted-foreground">· {s.departamento}</span>
                        </span>
                        <span className="font-bold text-[#FF8800]">{s.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]"
                          style={{ width: `${(s.total / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
