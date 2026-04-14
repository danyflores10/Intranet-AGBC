"use client"

import { useState, useTransition, useMemo } from "react"
import {
  PlusIcon, PencilIcon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon,
  CalendarIcon, PartyPopperIcon, HomeIcon, UsersIcon, BookOpenIcon, CalendarDaysIcon,
  ClockIcon, SparklesIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { crearEvento, actualizarEvento, eliminarEvento } from "@/actions/calendario"

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

interface Props {
  eventos: EventoRow[]
}

const TIPOS_EVENTO = [
  { value: "feriado", label: "Feriado", icon: PartyPopperIcon, color: "#C41E3A", bg: "bg-red-50 dark:bg-red-500/10" },
  { value: "no_laboral", label: "Día no laboral", icon: HomeIcon, color: "#FF8800", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { value: "reunion", label: "Reunión", icon: UsersIcon, color: "#2E7D32", bg: "bg-green-50 dark:bg-green-500/10" },
  { value: "evento", label: "Evento institucional", icon: CalendarDaysIcon, color: "#1976D2", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { value: "capacitacion", label: "Capacitación", icon: BookOpenIcon, color: "#7B1FA2", bg: "bg-purple-50 dark:bg-purple-500/10" },
]

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getTipoConfig(tipo: string) {
  return TIPOS_EVENTO.find((t) => t.value === tipo) ?? TIPOS_EVENTO[3]
}

export function CalendarioModule({ eventos }: Props) {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEvento, setEditEvento] = useState<EventoRow | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)
  const diasEnMes = ultimoDia.getDate()
  const primerDiaSemana = primerDia.getDay()

  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  function eventosDelDia(dia: number) {
    const fecha = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    return eventos.filter((e) => e.fechaInicio === fecha)
  }

  function mesAnterior() {
    setSelectedDay(null)
    if (mes === 0) { setMes(11); setAnio(anio - 1) }
    else setMes(mes - 1)
  }

  function mesSiguiente() {
    setSelectedDay(null)
    if (mes === 11) { setMes(0); setAnio(anio + 1) }
    else setMes(mes + 1)
  }

  function openCreate(fecha?: string) {
    setEditEvento(null)
    setSelectedDate(fecha ?? null)
    setDialogOpen(true)
  }

  function openEdit(evento: EventoRow) {
    setEditEvento(evento)
    setSelectedDate(null)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          titulo: (fd.get("titulo") as string).trim(),
          descripcion: ((fd.get("descripcion") as string) || "").trim() || undefined,
          tipo: fd.get("tipo") as string,
          fechaInicio: fd.get("fechaInicio") as string,
          fechaFin: ((fd.get("fechaFin") as string) || "").trim() || undefined,
          color: getTipoConfig(fd.get("tipo") as string).color,
          notificar: fd.get("notificar") === "on",
        }
        if (editEvento) {
          await actualizarEvento(editEvento.id, payload)
          toast.success("Evento actualizado")
        } else {
          await crearEvento(payload)
          toast.success("Evento creado y notificaciones enviadas")
        }
        setDialogOpen(false)
        setEditEvento(null)
      } catch {
        toast.error("Error al guardar evento")
      }
    })
  }

  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`

  const proximosEventos = useMemo(() =>
    eventos
      .filter((e) => e.fechaInicio >= hoyStr)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
      .slice(0, 8),
    [eventos, hoyStr]
  )

  const eventosDiaSeleccionado = selectedDay ? eventosDelDia(selectedDay) : []

  const conteoPorTipo = useMemo(() => {
    const conteo: Record<string, number> = {}
    TIPOS_EVENTO.forEach((t) => { conteo[t.value] = 0 })
    eventos.forEach((e) => { conteo[e.tipo] = (conteo[e.tipo] ?? 0) + 1 })
    return conteo
  }, [eventos])

  return (
    <>
      <ModuleHeader title="Calendario" />
      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* ── Stats rápidos ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TIPOS_EVENTO.map((t) => {
            const Icon = t.icon
            return (
              <Card key={t.value} className="border-border/40 overflow-hidden group hover:shadow-md hover:border-[#FFB300]/30 transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" style={{ color: t.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{conteoPorTipo[t.value]}</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-tight">{t.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* ── Calendario principal ── */}
          <Card className="flex-1 border-border/40 overflow-hidden">
            <div className="bg-gradient-to-r from-[#FFB300]/10 via-[#FF8800]/5 to-transparent border-b border-border/40 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={mesAnterior}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:bg-muted hover:shadow-md hover:border-[#FFB300]/30 active:scale-95"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-extrabold tracking-tight">{MESES[mes]}</h2>
                  <p className="text-xs text-muted-foreground font-medium">{anio}</p>
                </div>
                <button
                  type="button"
                  onClick={mesSiguiente}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:bg-muted hover:shadow-md hover:border-[#FFB300]/30 active:scale-95"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <CardContent className="p-3 sm:p-5">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-lg ${
                      i === 0 || i === 6 ? "text-[#C41E3A]/60" : "text-muted-foreground"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid de días */}
              <div className="grid grid-cols-7 gap-1">
                {celdas.map((dia, i) => {
                  if (dia === null) return <div key={`empty-${i}`} className="aspect-square" />
                  const eventos_dia = eventosDelDia(dia)
                  const fechaStr = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
                  const esHoy = fechaStr === hoyStr
                  const tieneEventos = eventos_dia.length > 0
                  const estaSeleccionado = selectedDay === dia
                  const diaSemana = (primerDiaSemana + dia - 1) % 7
                  const esFinDeSemana = diaSemana === 0 || diaSemana === 6

                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setSelectedDay(dia === selectedDay ? null : dia)}
                      className={`
                        relative flex flex-col items-center justify-start rounded-xl p-1.5 min-h-[64px] sm:min-h-[80px] transition-all duration-200 text-sm border
                        ${esHoy
                          ? "bg-gradient-to-br from-[#FFB300]/15 to-[#FF8800]/10 border-[#FFB300]/50 shadow-sm shadow-[#FFB300]/10"
                          : estaSeleccionado
                            ? "bg-[#FFB300]/8 border-[#FFB300]/30"
                            : tieneEventos
                              ? "border-border/30 bg-muted/20 hover:bg-muted/40"
                              : "border-transparent hover:bg-muted/30 hover:border-border/20"
                        }
                        ${esFinDeSemana && !esHoy && !estaSeleccionado ? "bg-muted/10" : ""}
                      `}
                    >
                      <span
                        className={`
                          inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all
                          ${esHoy
                            ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/25 font-bold"
                            : esFinDeSemana
                              ? "text-[#C41E3A]/50"
                              : ""
                          }
                        `}
                      >
                        {dia}
                      </span>

                      <div className="flex flex-wrap gap-[3px] mt-1 justify-center">
                        {eventos_dia.slice(0, 4).map((ev) => {
                          const cfg = getTipoConfig(ev.tipo)
                          return (
                            <div
                              key={ev.id}
                              title={ev.titulo}
                              className="h-[6px] w-[6px] rounded-full shrink-0 ring-1 ring-white/50 dark:ring-black/20 transition-transform hover:scale-150"
                              style={{ backgroundColor: cfg.color }}
                            />
                          )
                        })}
                        {eventos_dia.length > 4 && (
                          <span className="text-[8px] font-bold text-muted-foreground">+{eventos_dia.length - 4}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/40">
                {TIPOS_EVENTO.map((t) => {
                  const Icon = t.icon
                  return (
                    <div key={t.value} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: t.color + "20" }}>
                        <Icon className="h-3 w-3" style={{ color: t.color }} />
                      </div>
                      <span className="font-medium">{t.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Panel lateral ── */}
          <div className="w-full lg:w-[340px] space-y-5">
            <Button
              size="lg"
              onClick={() => openCreate()}
              className="w-full rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-bold shadow-lg shadow-[#FFB300]/20 h-12 text-sm gap-2 hover:shadow-xl hover:shadow-[#FFB300]/30 transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo evento
            </Button>

            {/* Eventos del día seleccionado */}
            {selectedDay !== null && (
              <Card className="border-border/40 overflow-hidden">
                <div className="bg-gradient-to-r from-[#FFB300]/10 to-transparent border-b border-border/30 px-4 py-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#FFB300]" />
                    {selectedDay} de {MESES[mes]}
                  </h3>
                </div>
                <CardContent className="p-3">
                  {eventosDiaSeleccionado.length === 0 ? (
                    <div className="py-6 text-center">
                      <SparklesIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground">Sin eventos este día</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-xl text-xs h-8"
                        onClick={() => openCreate(`${anio}-${String(mes + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`)}
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Agregar evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eventosDiaSeleccionado.map((ev) => {
                        const cfg = getTipoConfig(ev.tipo)
                        const Icon = cfg.icon
                        return (
                          <div
                            key={ev.id}
                            className="flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-muted/50 group"
                            style={{ borderLeft: `3px solid ${cfg.color}` }}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.color + "15" }}>
                              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{ev.titulo}</p>
                              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{cfg.label}</p>
                              {ev.descripcion && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.descripcion}</p>}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => openEdit(ev)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#FFB300]/10 hover:text-[#FF8800]">
                                <PencilIcon className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => startTransition(async () => { await eliminarEvento(ev.id); toast.success("Evento eliminado") })}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <Trash2Icon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Próximos eventos */}
            <Card className="border-border/40 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF8800]/8 to-transparent border-b border-border/30 px-4 py-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-[#FF8800]" />
                  Próximos eventos
                  {proximosEventos.length > 0 && (
                    <span className="ml-auto rounded-full bg-[#FFB300]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF8800]">
                      {proximosEventos.length}
                    </span>
                  )}
                </h3>
              </div>
              <CardContent className="p-3">
                {proximosEventos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground font-medium">No hay eventos próximos</p>
                    <p className="text-xs text-muted-foreground/60">Crea un nuevo evento para empezar</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {proximosEventos.map((ev) => {
                      const cfg = getTipoConfig(ev.tipo)
                      const Icon = cfg.icon
                      const fechaEvento = new Date(ev.fechaInicio + "T12:00:00")
                      const esHoyEvento = ev.fechaInicio === hoyStr
                      return (
                        <div
                          key={ev.id}
                          className={`group flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-muted/50 cursor-pointer ${
                            esHoyEvento ? "bg-[#FFB300]/5 ring-1 ring-[#FFB300]/20" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border shadow-sm transition-all group-hover:shadow-md"
                              style={{
                                borderColor: cfg.color + "30",
                                backgroundColor: cfg.color + "08",
                              }}
                            >
                              <span className="text-[9px] font-bold uppercase" style={{ color: cfg.color }}>
                                {fechaEvento.toLocaleDateString("es-BO", { month: "short" })}
                              </span>
                              <span className="text-lg font-extrabold leading-none" style={{ color: cfg.color }}>
                                {fechaEvento.getDate()}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-sm font-bold truncate group-hover:text-[#FF8800] transition-colors">{ev.titulo}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Icon className="h-3 w-3 shrink-0" style={{ color: cfg.color }} />
                              <span className="text-[11px] font-medium text-muted-foreground">{cfg.label}</span>
                              {esHoyEvento && (
                                <span className="ml-1 rounded-full bg-[#FFB300] px-1.5 py-0.5 text-[9px] font-bold text-[#1a1000]">HOY</span>
                              )}
                            </div>
                            {ev.descripcion && (
                              <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">{ev.descripcion}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                            <button type="button" onClick={() => openEdit(ev)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-[#FFB300]/10 hover:text-[#FF8800]">
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => startTransition(async () => { await eliminarEvento(ev.id); toast.success("Evento eliminado") })}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Dialog crear/editar evento ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setEditEvento(null); setSelectedDate(null) } }}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[600px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
          <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editEvento ? "Editar evento" : "Nuevo evento"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editEvento ? "Modifica los datos del evento" : "Crea un evento y notifica a todos los trabajadores"}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Título del evento *</Label>
              <Input name="titulo" required defaultValue={editEvento?.titulo} placeholder="Ej: Feriado Nacional - Día del Trabajador" className="h-11 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tipo de evento *</Label>
              <select name="tipo" defaultValue={editEvento?.tipo ?? "feriado"} className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {TIPOS_EVENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Fecha inicio *</Label>
                <Input name="fechaInicio" type="date" required defaultValue={editEvento?.fechaInicio ?? selectedDate ?? ""} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Fecha fin</Label>
                <Input name="fechaFin" type="date" defaultValue={editEvento?.fechaFin ?? ""} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descripción</Label>
              <textarea name="descripcion" defaultValue={editEvento?.descripcion ?? ""}
                placeholder="Detalle del evento..."
                className="flex w-full rounded-xl border border-input bg-transparent px-3 py-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y" />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="notificar" defaultChecked={editEvento ? editEvento.notificar : true} className="h-4 w-4 rounded border-input" />
              <span className="text-sm font-medium">Enviar notificación a todos los trabajadores</span>
            </label>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} className="rounded-xl border-0 bg-gradient-to-r from-[#FFB300] to-[#FF8800] font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20">
                {isPending ? "Guardando..." : editEvento ? "Guardar cambios" : "Crear evento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
