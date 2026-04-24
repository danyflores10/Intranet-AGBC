"use client"

import Link from "next/link"
import {
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  CheckCircle2Icon,
  ClockIcon,
  ArchiveIcon,
  StarIcon,
  GlobeIcon,
  PlusIcon,
  ArrowRightIcon,
  EyeIcon,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeEstado } from "./badge-estado"
import type {
  ReconocimientoListItem,
  ReconocimientoStats,
} from "@/actions/reconocimientos"
import {
  LABEL_TIPO,
  type EstadoReconocimiento,
} from "@/lib/validations/reconocimientos"

type Props = {
  stats: ReconocimientoStats
  recientes: ReconocimientoListItem[]
  puedeCrear: boolean
  puedeAprobar: boolean
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrophyIcon
  label: string
  value: number
  tone: "amber" | "green" | "amber-alt" | "zinc" | "red" | "blue"
}) {
  const tones: Record<typeof tone, { bg: string; text: string; ring: string }> = {
    amber: { bg: "bg-[#FFB300]/10", text: "text-[#FF8800]", ring: "ring-[#FFB300]/30" },
    "amber-alt": { bg: "bg-amber-500/10", text: "text-amber-600", ring: "ring-amber-500/30" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/30" },
    zinc: { bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-300", ring: "ring-zinc-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-600", ring: "ring-red-500/30" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-600", ring: "ring-blue-500/30" },
  }
  const c = tones[tone]
  return (
    <Card className="border-border/40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-black leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReconocimientosDashboard({
  stats,
  recientes,
  puedeCrear,
  puedeAprobar,
}: Props) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Hero */}
      <Card className="border-border/40 overflow-hidden relative">
        <div className="relative h-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#C41E3A]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%2030h60M30%200v60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </div>
        <CardContent className="relative -mt-14 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-[#FFB300] to-[#FF8800] shadow-xl ring-4 ring-background">
                <TrophyIcon className="h-9 w-9 text-[#1a1000]" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-black tracking-tight">Reconocimientos</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión institucional: empleados, equipos y sucursales
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {puedeAprobar && (
                <Link href="/reconocimientos/aprobaciones">
                  <Button variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    Aprobaciones ({stats.pendientes})
                  </Button>
                </Link>
              )}
              {puedeCrear && (
                <Link href="/reconocimientos/nuevo?tipo=empleado_mes">
                  <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-bold shadow-md">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Nuevo reconocimiento
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={TrophyIcon} label="Total" value={stats.total} tone="amber" />
        <KpiCard icon={CheckCircle2Icon} label="Publicados" value={stats.publicados} tone="green" />
        <KpiCard icon={ClockIcon} label="Pendientes" value={stats.pendientes} tone="amber-alt" />
        <KpiCard icon={ArchiveIcon} label="Archivados" value={stats.archivados} tone="zinc" />
        <KpiCard icon={StarIcon} label="Destacados" value={stats.destacados} tone="red" />
        <KpiCard icon={GlobeIcon} label="En landing" value={stats.enLanding} tone="blue" />
      </div>

      {/* Submódulos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SubmoduloCard
          href="/reconocimientos/empleado-mes"
          icon={TrophyIcon}
          titulo="Empleado del Mes"
          descripcion="Reconoce individualmente el desempeño destacado."
          count={stats.porTipo.empleado_mes}
          gradient="from-[#FFB300]/20 via-[#FF8800]/10 to-transparent"
        />
        <SubmoduloCard
          href="/reconocimientos/equipos"
          icon={UsersIcon}
          titulo="Equipos Destacados"
          descripcion="Reconoce a grupos de trabajo por resultados colectivos."
          count={stats.porTipo.equipo_destacado}
          gradient="from-blue-500/15 via-blue-400/5 to-transparent"
        />
        <SubmoduloCard
          href="/reconocimientos/sucursales"
          icon={MapPinIcon}
          titulo="Logros de Sucursales"
          descripcion="Reconoce a sucursales por metas, mejora o resultados."
          count={stats.porTipo.logro_sucursal}
          gradient="from-emerald-500/15 via-emerald-400/5 to-transparent"
        />
      </div>

      {/* Recientes */}
      <Card className="border-border/40">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-[#FFB300]" />
            Últimos reconocimientos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <TrophyIcon className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Aún no hay reconocimientos</p>
              <p className="text-xs text-muted-foreground/60">Crea el primero para empezar</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recientes.map((r) => (
                <Link
                  key={r.id}
                  href={`/reconocimientos/${r.id}`}
                  className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted/50">
                    {r.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imagen} alt={r.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <TrophyIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">{r.titulo}</p>
                      <BadgeEstado estado={r.estado as EstadoReconocimiento} />
                      {r.destacado && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-500/30">
                          <StarIcon className="h-2.5 w-2.5" />
                          Destacado
                        </span>
                      )}
                      {r.mostrarEnLanding && r.estado === "publicado" && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-500/30">
                          <GlobeIcon className="h-2.5 w-2.5" />
                          Landing
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {LABEL_TIPO[r.tipo as keyof typeof LABEL_TIPO]}
                      {r.subtituloA ? ` · ${r.subtituloA}` : ""}
                      {r.subtituloB ? ` · ${r.subtituloB}` : ""}
                    </p>
                  </div>
                  <EyeIcon className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SubmoduloCard({
  href,
  icon: Icon,
  titulo,
  descripcion,
  count,
  gradient,
}: {
  href: string
  icon: typeof TrophyIcon
  titulo: string
  descripcion: string
  count: number
  gradient: string
}) {
  return (
    <Link href={href} className="group">
      <Card className="border-border/40 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className={`relative h-24 bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-16 w-16 text-foreground/10 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold tracking-tight">{titulo}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{descripcion}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{count}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                registros
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#FF8800] group-hover:gap-2 transition-all">
            Ver todos
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
