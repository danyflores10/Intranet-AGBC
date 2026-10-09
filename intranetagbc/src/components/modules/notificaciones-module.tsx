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
  FileTextIcon,
  DownloadIcon,
  EyeIcon,
  ExternalLinkIcon,
  ShieldIcon,
  ClockIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  XIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export interface NotificacionItem {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  enlace: string | null
  createdAt?: Date | string
  fecha?: string
  remitente?: string
  archivoUrl?: string | null
  archivoNombre?: string | null
  tamano?: string | null
  documentoId?: string | null
}

interface Props {
  usuarioId: string
  notificacionesIniciales: Array<{
    id: string
    titulo: string
    mensaje: string
    tipo: string
    leida: boolean
    enlace: string | null
    createdAt: Date | string
  }>
  noLeidasCount: number
}

const TIPO_CONFIG: Record<
  string,
  { icon: typeof BellIcon; color: string; bg: string; label: string; badgeCls: string }
> = {
  info: {
    icon: InfoIcon,
    color: "#0E5296",
    bg: "bg-blue-50 border-blue-200",
    label: "Información",
    badgeCls: "bg-blue-100 text-[#002F6C] border-blue-200",
  },
  alerta: {
    icon: AlertTriangleIcon,
    color: "#D97706",
    bg: "bg-amber-50 border-amber-200",
    label: "Alerta Institucional",
    badgeCls: "bg-amber-100 text-amber-900 border-amber-300",
  },
  correspondencia: {
    icon: MailIcon,
    color: "#0E5296",
    bg: "bg-sky-50 border-sky-200",
    label: "Mensajería Oficial",
    badgeCls: "bg-sky-100 text-[#002F6C] border-sky-300",
  },
  comunicado: {
    icon: BellIcon,
    color: "#002F6C",
    bg: "bg-blue-50 border-blue-200",
    label: "Comunicado Oficial",
    badgeCls: "bg-blue-100 text-[#002F6C] border-blue-300",
  },
  sistema: {
    icon: ShieldIcon,
    color: "#475569",
    bg: "bg-slate-50 border-slate-200",
    label: "Aviso del Sistema",
    badgeCls: "bg-slate-100 text-slate-800 border-slate-300",
  },
  documento: {
    icon: FileTextIcon,
    color: "#059669",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Normativa / Documento",
    badgeCls: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
}

function getTipoNotif(tipo: string) {
  return (
    TIPO_CONFIG[tipo] ?? {
      icon: BellIcon,
      color: "#0E5296",
      bg: "bg-slate-50 border-slate-200",
      label: tipo.toUpperCase(),
      badgeCls: "bg-slate-100 text-slate-800 border-slate-200",
    }
  )
}

function formatTiempo(date?: Date | string) {
  if (!date) return "Reciente"
  const ahora = new Date()
  const diff = ahora.getTime() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora mismo"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return `Hace ${dias}d`
  return new Date(date).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

type Filtro = "todas" | "no-leidas" | "leidas"

export function NotificacionesModule({
  usuarioId,
  notificacionesIniciales,
  noLeidasCount,
}: Props) {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>(
    notificacionesIniciales.map((n) => ({
      ...n,
      fecha: formatTiempo(n.createdAt),
      remitente: "Dirección General AGBC",
    }))
  )
  const [count, setCount] = useState(noLeidasCount)
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  // Modal de detalle y lectura enriquecida
  const [selectedNotif, setSelectedNotif] = useState<NotificacionItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("/mp3/notificaciones.mp3")
  }, [])

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } catch {}
  }

  const setCountSafe = useCallback((next: number) => {
    const normalized = Math.max(0, next)
    setCount(normalized)
  }, [])

  // Carga enriquecida desde /api/notificaciones con metadatos de documentos
  const syncFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones")
      if (res.ok) {
        const data = await res.json()
        if (data.notificaciones && Array.isArray(data.notificaciones)) {
          setNotificaciones(data.notificaciones)
          const unread = data.notificaciones.filter((x: any) => !x.leida).length
          setCountSafe(unread)
          return
        }
      }
      // Fallback a Server Action
      const [newNotifs, newCount] = await Promise.all([
        obtenerNotificacionesUsuario(usuarioId),
        contarNotificacionesNoLeidas(usuarioId),
      ])
      setNotificaciones(
        newNotifs.map((n) => ({
          ...n,
          fecha: formatTiempo(n.createdAt),
          remitente: "Dirección General AGBC",
        }))
      )
      setCountSafe(newCount)
    } catch {
      /* Silencioso */
    }
  }, [setCountSafe, usuarioId])

  useEffect(() => {
    void syncFromServer()
  }, [syncFromServer])

  // Realtime Socket Sync con chime sonoro
  useEffect(() => {
    const socket = getSocket()
    const onAny = () => {
      void syncFromServer()
    }
    const onNew = () => {
      playNotificationSound()
      toast("Nueva notificación recibida", { icon: "🔔" })
      void syncFromServer()
    }

    socket.emit("user:join", usuarioId)
    socket.on("connect", onAny)
    socket.on("notification:new", onNew)
    socket.on("notification:read", onAny)
    socket.on("notification:read-all", onAny)
    socket.on("notification:delete", onAny)

    return () => {
      socket.emit("user:leave", usuarioId)
      socket.off("connect", onAny)
      socket.off("notification:new", onNew)
      socket.off("notification:read", onAny)
      socket.off("notification:read-all", onAny)
      socket.off("notification:delete", onAny)
    }
  }, [usuarioId, syncFromServer])

  function handleAbrirModal(n: NotificacionItem) {
    setSelectedNotif(n)
    setShowPdfViewer(false)
    setModalOpen(true)
    if (!n.leida) {
      handleMarcarLeida(n.id)
    }
  }

  function handleMarcarLeida(id: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    if (selectedNotif?.id === id) {
      setSelectedNotif((prev) => (prev ? { ...prev, leida: true } : null))
    }
    setCountSafe(count - 1)
    startTransition(async () => {
      await marcarNotificacionLeida(id)
      void syncFromServer()
    })
  }

  function handleMarcarTodas() {
    if (count === 0) return
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    if (selectedNotif) {
      setSelectedNotif((prev) => (prev ? { ...prev, leida: true } : null))
    }
    setCountSafe(0)
    startTransition(async () => {
      await marcarTodasLeidas(usuarioId)
      toast.success("Todas las notificaciones han sido marcadas como leídas")
      void syncFromServer()
    })
  }

  function handleEliminar(id: string) {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    if (selectedNotif?.id === id) {
      setModalOpen(false)
      setSelectedNotif(null)
    }
    toast.success("Notificación eliminada")
    startTransition(async () => {
      await eliminarNotificacion(id)
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
        const hay = `${n.titulo} ${n.mensaje} ${n.remitente || ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [notificaciones, filtro, tipoFiltro, query])

  const totalLeidas = notificaciones.filter((n) => n.leida).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Banner de Cabecera Oficial AGBC ── */}
      <Card className="border-2 border-[#002F6C]/15 overflow-hidden relative rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-amber-50/20 shadow-sm">
        <div className="relative h-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E5296] via-[#002F6C] to-[#FFCC00]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%2030h60M30%200v60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        </div>
        <CardContent className="relative -mt-14 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#FFCC00] text-[#002F6C] shadow-lg ring-4 ring-slate-100">
                <BellIcon className="h-9 w-9" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                  Centro de Notificaciones & Comunicados
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Mensajes oficiales, comunicados institucionales y normativas dirigidas a tu cuenta
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[#0E5296]/10 px-3.5 py-2 text-xs font-black text-[#0E5296] ring-1 ring-[#0E5296]/20">
                <BellIcon className="h-4 w-4" />
                {count} sin leer
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-black text-slate-700">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
                {totalLeidas} leídas
              </div>
              <Button
                type="button"
                onClick={handleMarcarTodas}
                disabled={count === 0 || isPending}
                className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                <CheckIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
                Marcar todas leídas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Buscador y Filtros ── */}
      <Card className="border-2 border-[#002F6C]/10 rounded-2xl bg-white shadow-2xs">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por título, remitente o mensaje..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(["todas", "no-leidas", "leidas"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filtro === f
                      ? "bg-white shadow-xs text-[#002F6C] font-black"
                      : "text-slate-600 hover:text-[#002F6C]"
                  }`}
                >
                  {f === "todas" ? "Todas" : f === "no-leidas" ? "No leídas" : "Leídas"}
                </button>
              ))}
            </div>
            {tiposDisponibles.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-[#002F6C] focus:border-[#0E5296] focus:outline-hidden cursor-pointer"
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

      {/* ── Listado de Notificaciones Estilo Premium AGBC ── */}
      <Card className="border-2 border-[#002F6C]/10 rounded-2xl bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50/40 via-white to-amber-50/30 py-3.5 px-5">
          <CardTitle className="text-sm font-black text-[#002F6C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-[#FFCC00]" />
              {notificacionesFiltradas.length}{" "}
              {notificacionesFiltradas.length === 1 ? "notificación" : "notificaciones"}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Haz clic en cualquier mensaje para abrir el visor completo
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notificacionesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <BellIcon className="h-10 w-10 opacity-40" />
              </div>
              <div>
                <p className="text-base font-black text-slate-700">
                  {notificaciones.length === 0
                    ? "Bandeja de notificaciones al día"
                    : "No hay resultados coincidentes"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {notificaciones.length === 0
                    ? "Aquí verás comunicados oficiales, directivas y mensajes del sistema."
                    : "Prueba modificando los filtros o el texto de búsqueda."}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notificacionesFiltradas.map((n) => {
                const tipoCfg = getTipoNotif(n.tipo)
                const Icon = tipoCfg.icon
                const esDoc = Boolean(n.archivoUrl || n.tipo === "documento")

                return (
                  <div
                    key={n.id}
                    onClick={() => handleAbrirModal(n)}
                    className={`group flex items-start gap-4 px-5 py-4 transition-all duration-150 cursor-pointer ${
                      !n.leida
                        ? "bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-[#FFCC00]"
                        : "hover:bg-slate-50/80 opacity-90 hover:opacity-100 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${tipoCfg.bg} shadow-2xs transition-transform duration-200 group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" style={{ color: tipoCfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${tipoCfg.badgeCls}`}
                            >
                              {tipoCfg.label}
                            </span>
                            {!n.leida && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                Nuevo
                              </span>
                            )}
                            {esDoc && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                                <FileTextIcon className="h-3 w-3" />
                                Adjunto PDF
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-medium ml-auto flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {n.fecha || formatTiempo(n.createdAt)}
                            </span>
                          </div>

                          <h3
                            className={`text-sm mt-1 leading-snug truncate ${
                              !n.leida ? "font-black text-[#002F6C]" : "font-bold text-slate-800"
                            }`}
                          >
                            {n.titulo}
                          </h3>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                            {n.mensaje}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-[#0E5296] font-bold">
                              <ShieldIcon className="h-3 w-3" />
                              {n.remitente || "Dirección General AGBC"}
                            </span>
                          </div>
                        </div>

                        {/* Botonera rápida lateral */}
                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          {!n.leida && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarcarLeida(n.id)
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-[11px] font-bold text-[#0E5296] hover:bg-blue-50 transition-colors cursor-pointer"
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title="Eliminar notificación"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog / Modal de Detalle Completo de Notificación (Idéntico al de la campanita) ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl">
          {selectedNotif && (
            <div className="flex flex-col bg-white">
              {/* Encabezado con degradado institucional */}
              <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFCC00] text-[#002F6C]">
                    {getTipoNotif(selectedNotif.tipo).label}
                  </span>
                  <span className="text-xs text-blue-100 font-medium flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                    <ClockIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                    {selectedNotif.fecha || formatTiempo(selectedNotif.createdAt)}
                  </span>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-snug mt-3">
                  {selectedNotif.titulo}
                </DialogTitle>

                <DialogDescription className="text-blue-100 text-xs font-medium mt-1 flex items-center gap-2">
                  <ShieldIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                  <span>{selectedNotif.remitente || "Dirección General AGBC"}</span>
                  <span>•</span>
                  <span>Para: Todos los funcionarios de la Agencia Boliviana de Correos</span>
                </DialogDescription>
              </div>

              {/* Cuerpo del Mensaje */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line font-medium">
                    {selectedNotif.mensaje}
                  </p>
                </div>

                {/* Previsualización Enriquecida si contiene documento adjunto */}
                {(selectedNotif.archivoUrl || selectedNotif.tipo === "documento") && (
                  <div className="overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/40 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                          <FileTextIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                            Documento Oficial Adjunto
                          </p>
                          <p className="text-xs font-bold text-slate-700 truncate max-w-sm">
                            {selectedNotif.archivoNombre || "Archivo Institucional AGBC.pdf"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase">
                        {selectedNotif.tamano || "PDF"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                      {selectedNotif.archivoUrl && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowPdfViewer(!showPdfViewer)}
                          className="bg-[#002F6C] hover:bg-[#0E5296] text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                        >
                          <EyeIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                          {showPdfViewer ? "Ocultar Visor" : "Ver Documento aquí"}
                        </Button>
                      )}

                      {selectedNotif.archivoUrl && (
                        <a
                          href={selectedNotif.archivoUrl}
                          download={selectedNotif.archivoNombre || "documento_agbc.pdf"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-bold text-emerald-800 border-emerald-300 gap-1.5 cursor-pointer hover:bg-emerald-50"
                          >
                            <DownloadIcon className="h-3.5 w-3.5 text-emerald-600" />
                            Descargar Archivo
                          </Button>
                        </a>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs font-bold text-[#0E5296] rounded-xl hover:bg-blue-50"
                      >
                        <Link href="/#documentos" onClick={() => setModalOpen(false)}>
                          <BookOpenIcon className="h-3.5 w-3.5 mr-1" />
                          Ir a Biblioteca Intranet
                        </Link>
                      </Button>
                    </div>

                    {showPdfViewer && selectedNotif.archivoUrl && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 h-[360px] animate-in fade-in-0 duration-200">
                        <iframe
                          src={selectedNotif.archivoUrl}
                          className="w-full h-full border-none"
                          title="Visor PDF AGBC"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Enlace de Acción adicional si existe */}
                {selectedNotif.enlace && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <div>
                      <p className="text-xs font-bold text-[#002F6C]">Acción vinculada al sistema</p>
                      <p className="text-[11px] text-slate-500">Este aviso incluye un acceso directo relevante</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setModalOpen(false)
                        router.push(selectedNotif.enlace!)
                      }}
                      className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                      Abrir Enlace
                    </Button>
                  </div>
                )}

                {/* Pie con Acciones */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminar(selectedNotif.id)}
                    className="text-red-600 hover:bg-red-50 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                    Eliminar notificación
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold text-xs rounded-xl px-5 cursor-pointer"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
