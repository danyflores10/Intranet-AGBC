"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bell,
  Check,
  Trash2,
  X,
  Mail,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"
import Link from "next/link"

export interface NotificacionItem {
  id: string
  titulo: string
  mensaje: string
  tipo: "comunicado" | "alerta" | "sistema" | "correspondencia" | "reconocimiento"
  leida: boolean
  fecha: string
  remitente?: string
  enlace?: string | null
}

const NOTIFICACIONES_DEMO: NotificacionItem[] = [
  {
    id: "notif-1",
    titulo: "¡Bienvenido al nuevo portal Intranet AGBC!",
    mensaje:
      "Te damos la bienvenida al sistema renovado de la Agencia Boliviana de Correos. Ahora puedes consultar comunicados oficiales, directorio telefónico, nómina y acceder a todas tus herramientas institucionales desde un solo lugar.",
    tipo: "comunicado",
    leida: false,
    fecha: "Hace 10 min",
    remitente: "Dirección General Ejecutiva",
  },
  {
    id: "notif-2",
    titulo: "Actualización de Seguridad y Políticas de Acceso",
    mensaje:
      "Se recuerda a todo el personal institucional mantener sus credenciales seguras y realizar el cambio periódico de contraseña desde el módulo Mi Perfil.",
    tipo: "alerta",
    leida: false,
    fecha: "Hace 1 hora",
    remitente: "Unidad de Tecnologías de la Información",
  },
  {
    id: "notif-3",
    titulo: "Nuevo Comunicado: Jornada Laboral y Horarios de Atención",
    mensaje:
      "Revisa la circular informativa sobre los horarios de atención y despacho de correspondencia a nivel nacional en las agencias regionales.",
    tipo: "correspondencia",
    leida: true,
    fecha: "Ayer",
    remitente: "Dirección de Operaciones Postales",
  },
  {
    id: "notif-4",
    titulo: "Reconocimiento al Desempeño Destacado",
    mensaje:
      "Felicitamos a los equipos y funcionarios distinguidos en el último periodo por su compromiso y excelencia en el servicio postal.",
    tipo: "reconocimiento",
    leida: true,
    fecha: "Hace 3 días",
    remitente: "Recursos Humanos",
  },
]

interface Props {
  usuarioId?: string
  esAdmin?: boolean
}

export function LandingNotificacionesBell({ usuarioId, esAdmin }: Props) {
  const [trayOpen, setTrayOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>(NOTIFICACIONES_DEMO)
  const [selectedNotif, setSelectedNotif] = useState<NotificacionItem | null>(NOTIFICACIONES_DEMO[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"todas" | "no_leidas">("todas")
  const trayRef = useRef<HTMLDivElement>(null)

  const unreadCount = notificaciones.filter((n) => !n.leida).length

  // Cerrar bandeja al click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setTrayOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarcarLeida = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    if (selectedNotif?.id === id) {
      setSelectedNotif((prev) => (prev ? { ...prev, leida: true } : null))
    }
  }

  const handleMarcarTodas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    toast.success("Todas las notificaciones han sido marcadas como leídas")
  }

  const handleEliminar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    if (selectedNotif?.id === id) {
      setSelectedNotif(notificaciones.find((n) => n.id !== id) || null)
    }
    toast.success("Notificación eliminada")
  }

  const handleAbrirMensaje = (notif: NotificacionItem) => {
    handleMarcarLeida(notif.id)
    setSelectedNotif(notif)
    setTrayOpen(false)
    setModalOpen(true)
  }

  const notificacionesFiltradas = notificaciones.filter((n) => {
    const matchesSearch =
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterType === "no_leidas") {
      return matchesSearch && !n.leida
    }
    return matchesSearch
  })

  const getTipoBadge = (tipo: NotificacionItem["tipo"]) => {
    switch (tipo) {
      case "alerta":
        return { bg: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, label: "Alerta Institucional" }
      case "correspondencia":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Mail, label: "Correspondencia" }
      case "reconocimiento":
        return { bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Sparkles, label: "Reconocimiento" }
      default:
        return { bg: "bg-blue-50 text-[#002F6C] border-blue-200", icon: Info, label: "Comunicado Oficial" }
    }
  }

  return (
    <div ref={trayRef} className="relative inline-block">
      {/* ── BOTÓN DE LA CAMPANA EN EL NAVBAR (A LA IZQUIERDA DEL USUARIO) ── */}
      <button
        type="button"
        onClick={() => setTrayOpen(!trayOpen)}
        aria-label="Notificaciones"
        className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer ${
          trayOpen
            ? "border-[#002F6C] bg-blue-50/80 text-[#002F6C] shadow-md ring-2 ring-[#FFCC00]/50"
            : "border-slate-200/90 bg-white hover:border-[#002F6C]/40 hover:bg-slate-50 text-[#002F6C] shadow-xs active:scale-95"
        }`}
      >
        <Bell className="h-5 w-5" />

        {/* Badge contador de no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFB800] text-[#002F6C] text-[10px] font-black border-2 border-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── BANDEJA POPUP RÁPIDA DE NOTIFICACIONES ── */}
      {trayOpen && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-80 sm:w-96 origin-top-right rounded-3xl border-2 border-[#002F6C]/15 bg-white shadow-2xl shadow-[#002F6C]/25 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
          {/* Header de la Bandeja */}
          <div className="bg-gradient-to-r from-[#002F6C] to-[#0E5296] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-[#FFCC00]" />
              <p className="text-sm font-black tracking-tight">Notificaciones</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[10px] font-black">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                className="text-[11px] font-bold text-[#FFCC00] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Leer todo</span>
              </button>
            )}
          </div>

          {/* Lista de Mensajes */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1 bg-slate-50/50">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-xs font-bold">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.slice(0, 5).map((n) => {
                const badge = getTipoBadge(n.tipo)
                const BadgeIcon = badge.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => handleAbrirMensaje(n)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-start ${
                      n.leida
                        ? "bg-transparent hover:bg-white opacity-80"
                        : "bg-white shadow-xs border border-blue-100 hover:border-blue-300"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge.bg}`}>
                      <BadgeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`truncate text-xs ${n.leida ? "font-bold text-slate-700" : "font-black text-[#002F6C]"}`}>
                          {n.titulo}
                        </p>
                        {!n.leida && <span className="h-2 w-2 rounded-full bg-[#FFB800] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                        {n.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {n.fecha}
                        </span>
                        <div className="flex items-center gap-1">
                          {!n.leida && (
                            <button
                              type="button"
                              onClick={(e) => handleMarcarLeida(n.id, e)}
                              className="text-[10px] font-bold text-[#0E5296] hover:underline"
                            >
                              Marcar leída
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleEliminar(n.id, e)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer: Ver bandeja completa estilo Gmail */}
          <div className="p-2.5 bg-white border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setTrayOpen(false)
                setModalOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-[#002F6C] text-[#002F6C] hover:text-white py-2 text-xs font-black transition-colors cursor-pointer"
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Ver bandeja completa / Ver más</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── VENTANA GRANDE ESTILO GMAIL / BANDEJA DE MENSAJES ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] max-h-[85vh] p-0 rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Header Superior Estilo Correo Institucional */}
          <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-md">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Bandeja de Entrada & Mensajes Institucionales
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-xs font-black">
                      {unreadCount} sin leer
                    </span>
                  )}
                </h3>
                <p className="text-xs text-blue-100">
                  Agencia Boliviana de Correos • Comunicados Oficiales y Alertas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarcarTodas}
                  className="text-xs font-bold text-[#FFCC00] hover:bg-white/10"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todo como leído
                </Button>
              )}
            </div>
          </div>

          {/* Cuerpo Dividido en 2 Columnas (Lista de Mensajes + Vista Detallada de Lectura) */}
          <div className="flex flex-1 min-h-0 divide-x divide-slate-200">
            {/* Columna Izquierda: Lista de Mensajes */}
            <div className="w-full md:w-2/5 flex flex-col bg-slate-50/60 shrink-0">
              {/* Buscador y Filtros */}
              <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    placeholder="Buscar comunicados y alertas..."
                    className="pl-9 h-9 rounded-xl text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterType("todas")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      filterType === "todas" ? "bg-[#002F6C] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Todas ({notificaciones.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("no_leidas")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      filterType === "no_leidas" ? "bg-[#002F6C] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    No leídas ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Items de Notificaciones */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 p-2 space-y-1">
                {notificacionesFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold">No se encontraron notificaciones</p>
                  </div>
                ) : (
                  notificacionesFiltradas.map((n) => {
                    const isSelected = selectedNotif?.id === n.id
                    const badge = getTipoBadge(n.tipo)
                    const BadgeIcon = badge.icon
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          handleMarcarLeida(n.id)
                          setSelectedNotif(n)
                        }}
                        className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-white border-[#002F6C] shadow-md ring-2 ring-[#002F6C]/10"
                            : n.leida
                            ? "bg-white/60 border-transparent hover:bg-white"
                            : "bg-blue-50/50 border-blue-200 hover:bg-white shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge.bg}`}>
                            <BadgeIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`truncate text-xs ${n.leida ? "font-semibold text-slate-700" : "font-black text-[#002F6C]"}`}>
                                {n.remitente || "AGBC"}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">{n.fecha}</span>
                            </div>
                            <p className={`truncate text-xs mt-0.5 ${n.leida ? "font-normal text-slate-600" : "font-bold text-[#002F6C]"}`}>
                              {n.titulo}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {n.mensaje}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Columna Derecha: Vista de Lectura Estilo Gmail */}
            <div className="hidden md:flex flex-1 flex-col bg-white overflow-y-auto">
              {selectedNotif ? (
                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  {/* Encabezado del Mensaje */}
                  <div className="border-b border-slate-100 pb-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getTipoBadge(selectedNotif.tipo).bg}`}>
                        {getTipoBadge(selectedNotif.tipo).label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedNotif.fecha}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-[#002F6C] leading-snug">
                      {selectedNotif.titulo}
                    </h2>

                    {/* Fila del Remitente */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFCC00] font-black shadow-sm">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#002F6C]">
                          {selectedNotif.remitente || "Dirección General AGBC"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Para: Todo el personal institucional
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo del Mensaje */}
                  <div className="flex-1 text-sm text-slate-700 font-normal leading-relaxed space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <p className="whitespace-pre-line">{selectedNotif.mensaje}</p>
                    
                    <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Mensaje oficial verificado por la Intranet Institucional de Correos de Bolivia.</span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {esAdmin && (
                        <Button variant="outline" size="sm" asChild className="text-xs font-bold text-[#002F6C] rounded-xl">
                          <Link href="/notificaciones">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Administrar Notificaciones
                          </Link>
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEliminar(selectedNotif.id)}
                      className="rounded-xl text-xs font-bold gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar mensaje
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
                  <Mail className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-bold">Selecciona una notificación para leer el mensaje completo</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
