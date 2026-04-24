"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  EditIcon,
  StarIcon,
  GlobeIcon,
  CheckIcon,
  XIcon,
  SendIcon,
  ArchiveIcon,
  TrashIcon,
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  BadgeCheckIcon,
  ClockIcon,
  AlertCircleIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { confirmarToast } from "@/components/ui/confirm-toast"
import { BadgeEstado } from "./badge-estado"
import {
  archivarReconocimiento,
  eliminarReconocimiento,
  enviarARevisionReconocimiento,
  publicarReconocimiento,
  rechazarReconocimiento,
  restaurarReconocimiento,
  toggleDestacadoReconocimiento,
  toggleMostrarEnLanding,
  type ReconocimientoDetalle,
} from "@/actions/reconocimientos"
import {
  LABEL_TIPO,
  MESES_ES,
  type EstadoReconocimiento,
} from "@/lib/validations/reconocimientos"

interface Props {
  detalle: ReconocimientoDetalle
  puedeEditar: boolean
  puedeAprobar: boolean
  puedePublicar: boolean
  puedeArchivar: boolean
  puedeDestacar: boolean
  puedeLanding: boolean
  puedeEliminar: boolean
}

export function ReconocimientoDetalleView({
  detalle,
  puedeEditar,
  puedeAprobar,
  puedePublicar,
  puedeArchivar,
  puedeDestacar,
  puedeLanding,
  puedeEliminar,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [mostrarRechazo, setMostrarRechazo] = useState(false)

  const { base } = detalle
  const Icon = detalle.tipo === "empleado_mes" ? TrophyIcon : detalle.tipo === "equipo_destacado" ? UsersIcon : MapPinIcon
  const estado = base.estado as EstadoReconocimiento

  function run(label: string, fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(label)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al procesar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/reconocimientos"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black tracking-tight">{base.titulo}</h1>
                <BadgeEstado estado={estado} />
                {base.destacado && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-500/30">
                    <StarIcon className="h-2.5 w-2.5 fill-current" />
                    Destacado
                  </span>
                )}
                {base.mostrarEnLanding && estado === "publicado" && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-500/30">
                    <GlobeIcon className="h-2.5 w-2.5" />
                    En landing
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{LABEL_TIPO[base.tipo as keyof typeof LABEL_TIPO]}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {puedeEditar && (
              <Link href={`/reconocimientos/${base.id}/editar`}>
                <Button variant="outline" size="sm">
                  <EditIcon className="mr-1.5 h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones de estado */}
      <Card className="border-border/40">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BadgeCheckIcon className="h-4 w-4 text-[#FFB300]" />
            Flujo de estado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {estado === "borrador" && (
            <Button size="sm" onClick={() => run("Enviado a revisión", () => enviarARevisionReconocimiento(base.id))}>
              <SendIcon className="mr-1.5 h-4 w-4" />
              Enviar a revisión
            </Button>
          )}
          {estado === "pendiente" && puedePublicar && (
            <Button
              size="sm"
              onClick={() => run("Publicado", () => publicarReconocimiento(base.id))}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckIcon className="mr-1.5 h-4 w-4" />
              Publicar
            </Button>
          )}
          {estado === "pendiente" && puedeAprobar && (
            <>
              {!mostrarRechazo ? (
                <Button size="sm" variant="outline" className="border-red-500/40 text-red-600" onClick={() => setMostrarRechazo(true)}>
                  <XIcon className="mr-1.5 h-4 w-4" />
                  Rechazar
                </Button>
              ) : (
                <div className="flex w-full items-center gap-2">
                  <input
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Motivo del rechazo (obligatorio)"
                    className="flex-1 h-9 rounded-md border border-red-500/40 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMostrarRechazo(false)
                      setMotivoRechazo("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      if (motivoRechazo.trim().length === 0) {
                        toast.error("El motivo es obligatorio")
                        return
                      }
                      run("Rechazado", () => rechazarReconocimiento(base.id, motivoRechazo.trim()))
                      setMostrarRechazo(false)
                      setMotivoRechazo("")
                    }}
                  >
                    Confirmar rechazo
                  </Button>
                </div>
              )}
            </>
          )}
          {estado === "publicado" && puedePublicar && (
            <Button size="sm" variant="outline" onClick={() => run("Despublicado (pendiente)", () => enviarARevisionReconocimiento(base.id))}>
              <ClockIcon className="mr-1.5 h-4 w-4" />
              Despublicar
            </Button>
          )}
          {estado === "publicado" && puedeDestacar && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(
                base.destacado ? "Quitado de destacados" : "Marcado como destacado",
                () => toggleDestacadoReconocimiento(base.id),
              )}
              className={base.destacado ? "border-red-500/40 text-red-600" : ""}
            >
              <StarIcon className={`mr-1.5 h-4 w-4 ${base.destacado ? "fill-current" : ""}`} />
              {base.destacado ? "Quitar destacado" : "Destacar"}
            </Button>
          )}
          {estado === "publicado" && puedeLanding && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(
                base.mostrarEnLanding ? "Oculto en landing" : "Visible en landing",
                () => toggleMostrarEnLanding(base.id),
              )}
              className={base.mostrarEnLanding ? "border-blue-500/40 text-blue-600" : ""}
            >
              <GlobeIcon className="mr-1.5 h-4 w-4" />
              {base.mostrarEnLanding ? "Ocultar en landing" : "Mostrar en landing"}
            </Button>
          )}
          {(estado === "rechazado" || estado === "archivado") && (
            <Button size="sm" variant="outline" onClick={() => run("Restaurado a borrador", () => restaurarReconocimiento(base.id))}>
              Restaurar a borrador
            </Button>
          )}
          {puedeArchivar && estado !== "archivado" && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const ok = await confirmarToast({
                  titulo: "¿Archivar este reconocimiento?",
                  mensaje: "Dejará de verse en la landing y pasará al histórico.",
                  confirmarTexto: "Archivar",
                  tono: "advertencia",
                  icon: "archivar",
                })
                if (!ok) return
                run("Archivado", () => archivarReconocimiento(base.id))
              }}
            >
              <ArchiveIcon className="mr-1.5 h-4 w-4" />
              Archivar
            </Button>
          )}
          {puedeEliminar && (estado === "borrador" || estado === "rechazado") && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/40 text-red-600"
              onClick={async () => {
                const ok = await confirmarToast({
                  titulo: "¿Eliminar este reconocimiento?",
                  mensaje: "Esta acción es permanente y no se puede deshacer.",
                  confirmarTexto: "Eliminar",
                  tono: "peligro",
                  icon: "eliminar",
                })
                if (!ok) return
                run("Eliminado", () => {
                  return eliminarReconocimiento(base.id).then(() => router.push("/reconocimientos"))
                })
              }}
            >
              <TrashIcon className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </CardContent>
        {base.motivoRechazo && estado === "rechazado" && (
          <div className="border-t border-border/30 bg-red-500/5 px-5 py-3">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircleIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-700 dark:text-red-400">Motivo del rechazo:</span>{" "}
                <span className="text-red-700/90 dark:text-red-300">{base.motivoRechazo}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Contenido */}
        <Card className="border-border/40 overflow-hidden">
          {base.imagen && (
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={base.imagen} alt={base.titulo} className="h-full w-full object-cover" />
            </div>
          )}
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{base.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{base.descripcionCorta}</p>
            </div>

            <div className="h-px bg-border/40" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Motivo del reconocimiento
              </p>
              <blockquote className="mt-2 border-l-4 border-[#FFB300] pl-4 text-sm italic text-foreground/90">
                {base.motivo}
              </blockquote>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Descripción completa
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{base.descripcionCompleta}</p>
            </div>

            {detalle.tipo === "empleado_mes" && (
              <BloqueEmpleadoMes detalle={detalle} />
            )}
            {detalle.tipo === "equipo_destacado" && (
              <BloqueEquipo detalle={detalle} />
            )}
            {detalle.tipo === "logro_sucursal" && (
              <BloqueLogroSucursal detalle={detalle} />
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#FFB300]" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-xs">
              <InfoRow label="Fecha de reconocimiento" value={formatearFecha(base.fechaReconocimiento)} />
              {base.periodoDesde && (
                <InfoRow
                  label="Periodo"
                  value={`${formatearFecha(base.periodoDesde)} — ${base.periodoHasta ? formatearFecha(base.periodoHasta) : "—"}`}
                />
              )}
              {base.publicadoEn && (
                <InfoRow label="Publicado" value={formatearFechaHora(base.publicadoEn)} />
              )}
              {base.archivadoEn && (
                <InfoRow label="Archivado" value={formatearFechaHora(base.archivadoEn)} />
              )}
              <InfoRow label="Creado" value={formatearFechaHora(base.createdAt)} />
              <InfoRow label="Actualizado" value={formatearFechaHora(base.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}

function formatearFecha(d: string | Date | null) {
  if (!d) return null
  try {
    const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d
    return date.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return String(d)
  }
}

function formatearFechaHora(d: string | Date | null) {
  if (!d) return null
  try {
    const date = typeof d === "string" ? new Date(d) : d
    return date.toLocaleString("es-BO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return String(d)
  }
}

// ── Bloques específicos ──
function BloqueEmpleadoMes({ detalle }: { detalle: Extract<ReconocimientoDetalle, { tipo: "empleado_mes" }> }) {
  const { empleado, sucursalNombre } = detalle
  return (
    <div className="rounded-xl border border-[#FFB300]/20 bg-gradient-to-br from-[#FFB300]/5 to-transparent p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF8800] mb-3">
        {MESES_ES[empleado.mes - 1]} {empleado.gestion}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-bold">{empleado.nombreCompleto}</p>
            <p className="text-xs text-muted-foreground">{empleado.cargo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-bold">{empleado.area}</p>
            {sucursalNombre && <p className="text-xs text-muted-foreground">{sucursalNombre}</p>}
          </div>
        </div>
      </div>
      {empleado.logrosDestacados && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logros destacados</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{empleado.logrosDestacados}</p>
        </div>
      )}
    </div>
  )
}

function BloqueEquipo({ detalle }: { detalle: Extract<ReconocimientoDetalle, { tipo: "equipo_destacado" }> }) {
  const { equipo, integrantes } = detalle
  return (
    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equipo</p>
          <p className="text-sm font-bold">{equipo.nombreEquipo}</p>
          <p className="text-xs text-muted-foreground">{equipo.area}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsable</p>
          <p className="text-sm font-bold">{equipo.responsableNombre}</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resultados alcanzados</p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{equipo.resultadosAlcanzados}</p>
      </div>
      {integrantes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Integrantes ({integrantes.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {integrantes.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 ring-1 ring-border/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.nombre}</p>
                  {i.rolEquipo && <p className="truncate text-[11px] text-muted-foreground">{i.rolEquipo}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BloqueLogroSucursal({ detalle }: { detalle: Extract<ReconocimientoDetalle, { tipo: "logro_sucursal" }> }) {
  const { logro, sucursalNombre } = detalle
  const indicadores = (logro.indicadores as Array<{ nombre: string; valor: string; unidad?: string | null }> | null) ?? []
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sucursal</p>
          <p className="text-sm font-bold">{sucursalNombre ?? logro.ciudad}</p>
          <p className="text-xs text-muted-foreground">
            {logro.ciudad} · {logro.departamento}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de logro</p>
          <p className="text-sm font-bold capitalize">{logro.tipoLogro}</p>
          <p className="text-xs text-muted-foreground">Responsable: {logro.responsableNombre}</p>
        </div>
      </div>
      {indicadores.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Indicadores de resultado
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {indicadores.map((ind, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{ind.nombre}</p>
                <p className="text-lg font-black tracking-tight">
                  {ind.valor}
                  {ind.unidad && <span className="ml-1 text-sm font-semibold text-muted-foreground">{ind.unidad}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
