"use client"

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from "react"
import {
  BellIcon,
  CheckIcon,
  Trash2Icon,
  CalendarIcon,
  InfoIcon,
  AlertTriangleIcon,
  MailIcon,
  SearchIcon,
  FilterIcon,
  SparklesIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

import {
  marcarNotificacionLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  obtenerNotificacionesUsuario,
  contarNotificacionesNoLeidas,
} from "@/actions/notificaciones"
import { getSocket } from "@/lib/socket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  enlace: string | null
  createdAt: Date | string
}

interface Props {
  usuarioId: string
  notificacionesIniciales: Notificacion[]
  noLeidasCount: number
}

const TIPO_CONFIG: Record<string, { icon: typeof BellIcon; color: string; bg: string; label: string }> = {
  calendario: { icon: CalendarIcon, color: "#FF8800", bg: "bg-amber-50 dark:bg-amber-500/10", label: "Calendario" },
  info: { icon: InfoIcon, color: "#1976D2", bg: "bg-blue-50 dark:bg-blue-500/10", label: "Información" },
  alerta: { icon: AlertTriangleIcon, color: "#C41E3A", bg: "bg-red-50 dark:bg-red-500/10", label: "Alerta" },
  correspondencia: { icon: MailIcon, color: "#2E7D32", bg: "bg-green-50 dark:bg-green-500/10", label: "Correspondencia" },
  soporte: { icon: SparklesIcon, color: "#8430CE", bg: "bg-purple-50 dark:bg-purple-500/10", label: "Soporte" },
}

function getTipoNotif(tipo: string) {
  return (
    TIPO_CONFIG[tipo] ?? {
      icon: BellIcon,
      color: "#FFB300",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      label: tipo,
    }
  )
}

function formatTiempo(date: Date | string) {
  const ahora = new Date()
  const diff = ahora.getTime() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return `Hace ${dias}d`
  return new Date(date).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })
}

type Filtro = "todas" | "no-leidas" | "leidas"

export function NotificacionesModule({ usuarioId, notificacionesIniciales, noLeidasCount }: Props) {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales)
  const [count, setCount] = useState(noLeidasCount)
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const notificacionesRef = useRef<Notificacion[]>(notificacionesIniciales)
  const countRef = useRef(noLeidasCount)

  useEffect(() => { notificacionesRef.current = notificaciones }, [notificaciones])
  useEffect(() => { countRef.current = count }, [count])

  const setCountSafe = useCallback((next: number) => {
    const normalized = Math.max(0, next)
    countRef.current = normalized
    setCount(normalized)
  }, [])

  const syncFromServer = useCallback(async () => {
    try {
      const [newNotifs, newCount] = await Promise.all([
        obtenerNotificacionesUsuario(usuarioId),
        contarNotificacionesNoLeidas(usuarioId),
      ])
      notificacionesRef.current = newNotifs
      setNotificaciones(newNotifs)
      setCountSafe(newCount)
    } catch {
      /* silencioso */
    }
  }, [setCountSafe, usuarioId])

  // Realtime sync
  useEffect(() => {
    const socket = getSocket()
    const onAny = () => { void syncFromServer() }

    socket.emit("user:join", usuarioId)
    socket.on("connect", onAny)
    socket.on("notification:new", onAny)
    socket.on("notification:read", onAny)
    socket.on("notification:read-all", onAny)
    socket.on("notification:delete", onAny)

    return () => {
      socket.emit("user:leave", usuarioId)
      socket.off("connect", onAny)
      socket.off("notification:new", onAny)
      socket.off("notification:read", onAny)
      socket.off("notification:read-all", onAny)
      socket.off("notification:delete", onAny)
    }
  }, [usuarioId, syncFromServer])

  function handleAbrir(n: Notificacion) {
    if (!n.leida) {
      startTransition(async () => {
        await marcarNotificacionLeida(n.id)
        void syncFromServer()
      })
    }
    if (n.enlace) router.push(n.enlace)
  }

  function handleMarcarLeida(id: string) {
    startTransition(async () => {
      await marcarNotificacionLeida(id)
      void syncFromServer()
    })
  }

  function handleMarcarTodas() {
    if (count === 0) return
    startTransition(async () => {
      await marcarTodasLeidas(usuarioId)
      toast.success("Todas las notificaciones marcadas como leídas")
      void syncFromServer()
    })
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      await eliminarNotificacion(id)
      toast.success("Notificación eliminada")
      void syncFromServer()
    })
  }

  const tiposDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const n of notificaciones) set.add(n.tipo)
    return Array.from(set)
  }, [notificaciones])

  const notificacionesFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notificaciones.filter((n) => {
      if (filtro === "no-leidas" && n.leida) return false
      if (filtro === "leidas" && !n.leida) return false
      if (tipoFiltro !== "todos" && n.tipo !== tipoFiltro) return false
      if (q.length > 0) {
        const hay = `${n.titulo} ${n.mensaje}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notificaciones, filtro, tipoFiltro, query])

  const totalLeidas = notificaciones.filter((n) => n.leida).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* ── Hero ── */}
      <Card className="border-border/40 overflow-hidden relative">
        <div className="relative h-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#F5061D]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%2030h60M30%200v60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </div>
        <CardContent className="relative -mt-14 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-[#FFB300] to-[#FF8800] shadow-xl ring-4 ring-background">
                <BellIcon className="h-9 w-9 text-[#1a1000]" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-black tracking-tight">Notificaciones</h1>
                <p className="text-sm text-muted-foreground">
                  Todas tus notificaciones en un solo lugar
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[#FFB300]/10 px-3 py-2 text-xs font-bold text-[#FF8800] ring-1 ring-[#FFB300]/20">
                <BellIcon className="h-3.5 w-3.5" />
                {count} sin leer
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-bold text-muted-foreground">
                <CheckIcon className="h-3.5 w-3.5" />
                {totalLeidas} leídas
              </div>
              <Button
                type="button"
                onClick={handleMarcarTodas}
                disabled={count === 0 || isPending}
                className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-bold shadow-md"
              >
                <CheckIcon className="mr-2 h-4 w-4" />
                Marcar todas como leídas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Filtros ── */}
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o mensaje..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-muted/50 p-1 text-xs font-semibold">
              {(["todas", "no-leidas", "leidas"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    filtro === f
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "todas" ? "Todas" : f === "no-leidas" ? "No leídas" : "Leídas"}
                </button>
              ))}
            </div>
            {tiposDisponibles.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
                >
                  <option value="todos">Todos los tipos</option>
                  {tiposDisponibles.map((t) => (
                    <option key={t} value={t}>
                      {getTipoNotif(t).label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Lista ── */}
      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-[#FFB300]" />
            {notificacionesFiltradas.length} {notificacionesFiltradas.length === 1 ? "notificación" : "notificaciones"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notificacionesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <BellIcon className="h-10 w-10 text-muted-foreground/25" />
              </div>
              <div>
                <p className="text-base font-semibold text-muted-foreground">
                  {notificaciones.length === 0 ? "Sin notificaciones" : "No hay resultados"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {notificaciones.length === 0
                    ? "Las notificaciones aparecerán aquí"
                    : "Prueba cambiando los filtros o la búsqueda"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notificacionesFiltradas.map((n) => {
                const tipoCfg = getTipoNotif(n.tipo)
                const Icon = tipoCfg.icon
                return (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-4 px-5 py-4 transition-all duration-200 ${
                      !n.leida
                        ? "bg-[#FFB300]/[0.04] hover:bg-[#FFB300]/[0.08]"
                        : "hover:bg-muted/30 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tipoCfg.bg} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" style={{ color: tipoCfg.color }} />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleAbrir(n)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm leading-snug ${!n.leida ? "font-bold" : "font-semibold"}`}>
                              {n.titulo}
                            </p>
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: `${tipoCfg.color}15`, color: tipoCfg.color }}
                            >
                              {tipoCfg.label}
                            </span>
                            {!n.leida && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#FFB300]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF8800]">
                                Nueva
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                            {n.mensaje}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 font-medium mt-2">
                            {formatTiempo(n.createdAt)}
                          </p>
                        </div>
                        {!n.leida && (
                          <div className="h-2.5 w-2.5 shrink-0 mt-2 rounded-full bg-[#FFB300] ring-2 ring-[#FFB300]/20" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.leida && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarcarLeida(n.id)
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-[#FF8800] hover:bg-[#FFB300]/10"
                          title="Marcar como leída"
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                          Leída
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEliminar(n.id)
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
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
  )
}
