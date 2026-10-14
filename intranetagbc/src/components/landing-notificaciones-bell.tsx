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
  FileText,
  Download,
  Eye,
  BookOpen,
  Building2,
  BookmarkCheck,
  FileCheck2,
  Layers,
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
import { getSocket } from "@/lib/socket"
import { registrarVisitaSeccionAction } from "@/actions/auditoria"

export interface NotificacionItem {
  id: string
  titulo: string
  mensaje: string
  tipo: "comunicado" | "alerta" | "sistema" | "correspondencia" | "reconocimiento" | "info" | "documento"
  leida: boolean
  fecha: string
  remitente?: string
  enlace?: string | null
  archivoUrl?: string | null
  archivoNombre?: string | null
  tamano?: string | null
  documentoId?: string | null
}

const NOTIFICACION_BIENVENIDA: NotificacionItem = {
  id: "notif-bienvenida",
  titulo: "¡Bienvenido al nuevo portal Intranet AGBC!",
  mensaje:
    "Te damos la bienvenida al sistema renovado de la Agencia Boliviana de Correos. Ahora puedes consultar comunicados oficiales, documentos institucionales, directorio telefónico, nómina y acceder a todas tus herramientas institucionales desde un solo lugar.",
  tipo: "comunicado",
  leida: false,
  fecha: "Institucional",
  remitente: "Dirección General Ejecutiva",
}

interface Props {
  usuarioId?: string
  esAdmin?: boolean
}

export function LandingNotificacionesBell({ usuarioId, esAdmin }: Props) {
  const [trayOpen, setTrayOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([NOTIFICACION_BIENVENIDA])
  const [selectedNotif, setSelectedNotif] = useState<NotificacionItem | null>(NOTIFICACION_BIENVENIDA)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"todas" | "no_leidas">("todas")
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const trayRef = useRef<HTMLDivElement>(null)

  // Cargar notificaciones reales del usuario desde el servidor
  const cargarNotificaciones = async () => {
    try {
      const res = await fetch("/api/notificaciones")
      if (res.ok) {
        const data = await res.json()
        if (data.notificaciones && Array.isArray(data.notificaciones)) {
          // Unir bienvenida oficial con las notificaciones reales
          const combinadas = [
            NOTIFICACION_BIENVENIDA,
            ...data.notificaciones.filter((n: NotificacionItem) => n.id !== "notif-bienvenida"),
          ]
          setNotificaciones(combinadas)
          if (!selectedNotif || selectedNotif.id === "notif-bienvenida") {
            setSelectedNotif(combinadas[0])
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    cargarNotificaciones()
  }, [usuarioId])

  // Realtime Socket Sync con chime
  useEffect(() => {
    if (!usuarioId) return
    const socket = getSocket()
    const onAny = () => {
      void cargarNotificaciones()
    }
    const onNew = () => {
      try {
        const audio = new Audio("/mp3/notificaciones.mp3")
        audio.play().catch(() => {})
      } catch {}
      void cargarNotificaciones()
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
  }, [usuarioId])

  // Recargar al abrir la bandeja
  useEffect(() => {
    if (trayOpen) {
      cargarNotificaciones()
    }
  }, [trayOpen])

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

  const handleMarcarLeida = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    if (selectedNotif?.id === id) {
      setSelectedNotif((prev) => (prev ? { ...prev, leida: true } : null))
    }

    if (id !== "notif-bienvenida") {
      try {
        await fetch("/api/notificaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "marcar_leida", id }),
        })
      } catch {}
    }
  }

  const handleMarcarTodas = async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    toast.success("Todas las notificaciones han sido marcadas como leídas")
    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "marcar_todas_leidas" }),
      })
    } catch {}
  }

  const handleEliminar = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    if (selectedNotif?.id === id) {
      setSelectedNotif(notificaciones.find((n) => n.id !== id) || null)
    }
    toast.success("Notificación eliminada")

    if (id !== "notif-bienvenida") {
      try {
        await fetch("/api/notificaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "eliminar", id }),
        })
      } catch {}
    }
  }

  const handleAbrirMensaje = (notif: NotificacionItem) => {
    handleMarcarLeida(notif.id)
    setSelectedNotif(notif)
    setShowPdfViewer(false)
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

  // Determinar si la notificación es de un documento oficial
  const isDocumentoNotif = (notif: NotificacionItem | null) => {
    if (!notif) return false
    const text = `${notif.titulo} ${notif.mensaje} ${notif.enlace || ""}`.toLowerCase()
    return (
      notif.tipo === "documento" ||
      notif.tipo === "correspondencia" ||
      text.includes("nuevo documento") ||
      text.includes("instructivo") ||
      text.includes("manual") ||
      text.includes("reglamento") ||
      text.includes("normativa") ||
      text.includes("formulario") ||
      text.includes("#documentos") ||
      Boolean(notif.archivoUrl)
    )
  }

  const getTipoBadge = (notif: NotificacionItem) => {
    const text = `${notif.titulo} ${notif.mensaje}`.toLowerCase()
    if (isDocumentoNotif(notif)) {
      if (text.includes("instructivo")) {
        return { bg: "bg-amber-50 text-amber-900 border-amber-300", icon: BookmarkCheck, label: "Instructivo Oficial", tag: "INSTRUCTIVO" }
      }
      if (text.includes("reglamento")) {
        return { bg: "bg-blue-50 text-[#002F6C] border-blue-300", icon: FileCheck2, label: "Reglamento Interno", tag: "REGLAMENTO" }
      }
      if (text.includes("manual")) {
        return { bg: "bg-teal-50 text-teal-800 border-teal-300", icon: BookOpen, label: "Manual de Procedimientos", tag: "MANUAL" }
      }
      return { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: FileText, label: "Documento Oficial", tag: "DOCUMENTO" }
    }

    switch (notif.tipo) {
      case "alerta":
        return { bg: "bg-red-50 text-red-800 border-red-200", icon: AlertTriangle, label: "Alerta Institucional", tag: "ALERTA" }
      case "reconocimiento":
        return { bg: "bg-amber-50 text-amber-900 border-amber-200", icon: Sparkles, label: "Reconocimiento", tag: "HONORÍFICO" }
      case "sistema":
        return { bg: "bg-indigo-50 text-indigo-800 border-indigo-200", icon: Shield, label: "Seguridad & Sistema", tag: "SISTEMA" }
      default:
        return { bg: "bg-blue-50 text-[#002F6C] border-blue-200", icon: Info, label: "Comunicado Oficial", tag: "COMUNICADO" }
    }
  }

  return (
    <div ref={trayRef} className="relative inline-block">
      {/* ── BOTÓN DE LA CAMPANA EN EL NAVBAR ── */}
      <button
        type="button"
        onClick={() => {
          const nextState = !trayOpen
          setTrayOpen(nextState)
          if (nextState) {
            registrarVisitaSeccionAction({ seccion: "Centro de Notificaciones" }).catch(() => {})
          }
        }}
        aria-label="Notificaciones"
        className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border transition-all duration-200 cursor-pointer ${
          trayOpen
            ? "border-[#002F6C] bg-blue-50/80 text-[#002F6C] shadow-md ring-2 ring-[#FFCC00]/50"
            : "border-slate-200/90 bg-white hover:border-[#002F6C]/40 hover:bg-slate-50 text-[#002F6C] shadow-2xs active:scale-95"
        }`}
      >
        <Bell className="h-4.5 w-4.5" />

        {/* Badge contador de no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FFB800] text-[#002F6C] text-[10px] font-black border-2 border-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── BANDEJA POPUP RÁPIDA DE NOTIFICACIONES ── */}
      {trayOpen && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-96 sm:w-[480px] origin-top-right rounded-3xl border-2 border-[#002F6C]/20 bg-white shadow-2xl shadow-[#002F6C]/25 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
          {/* Header de la Bandeja */}
          <div className="bg-gradient-to-r from-[#002F6C] to-[#0E5296] p-4 sm:p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Inbox className="h-5 w-5 text-[#FFCC00]" />
              <p className="text-sm font-black tracking-tight">Notificaciones Institucionales</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2.5 py-0.5 text-[10px] font-black">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  className="text-xs font-bold text-[#FFCC00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Leer todo</span>
                </button>
              )}
              <button
                type="button"
                onClick={cargarNotificaciones}
                className="text-xs font-bold text-white/90 hover:text-white hover:underline cursor-pointer"
              >
                Actualizar
              </button>
            </div>
          </div>

          {/* Lista de Mensajes en Bandeja Rápida */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 p-2 bg-slate-50/60 space-y-1.5">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <Bell className="h-9 w-9 mx-auto opacity-30" />
                <p className="text-xs font-bold">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.map((n) => {
                const badge = getTipoBadge(n)
                const BadgeIcon = badge.icon
                const esDoc = isDocumentoNotif(n)
                return (
                  <div
                    key={n.id}
                    onClick={() => handleAbrirMensaje(n)}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3 items-start ${
                      n.leida
                        ? "bg-transparent hover:bg-white opacity-85"
                        : "bg-white shadow-xs border border-blue-100 hover:border-blue-300"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.bg}`}>
                      <BadgeIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {badge.tag}
                          </span>
                          <p className={`truncate text-xs ${n.leida ? "font-bold text-slate-700" : "font-black text-[#002F6C]"}`}>
                            {n.titulo}
                          </p>
                        </div>
                        {!n.leida && <span className="h-2.5 w-2.5 rounded-full bg-[#FFB800] shrink-0 shadow-sm" />}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {n.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {n.fecha}
                        </span>
                        <div className="flex items-center gap-2">
                          {esDoc && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <FileText className="h-2.5 w-2.5" />
                              PDF
                            </span>
                          )}
                          {!n.leida && (
                            <button
                              type="button"
                              onClick={(e) => handleMarcarLeida(n.id, e)}
                              className="text-[11px] font-bold text-[#0E5296] hover:underline"
                            >
                              Marcar leída
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleEliminar(n.id, e)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer: Ver bandeja completa */}
          <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setTrayOpen(false)
                setModalOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-[#002F6C] text-[#002F6C] hover:text-white py-2.5 text-xs font-black transition-colors cursor-pointer"
            >
              <Inbox className="h-4 w-4" />
              <span>Ver bandeja completa / Pantalla Amplia</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── VENTANA GRANDE ESTILO GMAIL / BANDEJA DE MENSAJES INSTITUCIONALES ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-6xl lg:max-w-7xl w-[96vw] h-[88vh] max-h-[90vh] p-0 rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Header accesible para Radix UI */}
          <DialogHeader className="sr-only">
            <DialogTitle>Bandeja de Entrada de Comunicados y Alertas - AGBC</DialogTitle>
            <DialogDescription>Consulta y administra los avisos oficiales de la Intranet</DialogDescription>
          </DialogHeader>

          {/* Header Superior Estilo Correo Institucional */}
          <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-5 sm:p-6 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-md font-black">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-3">
                  Bandeja de Entrada & Mensajes Institucionales
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-3 py-0.5 text-xs font-black shadow-sm">
                      {unreadCount} sin leer
                    </span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  Agencia Boliviana de Correos • Comunicados Oficiales, Instructivos, Normativas y Alertas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={cargarNotificaciones}
                className="text-xs font-bold text-white hover:bg-white/10"
              >
                Actualizar
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarcarTodas}
                  className="text-xs font-bold text-[#FFCC00] hover:bg-white/10"
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Marcar todo como leído
                </Button>
              )}
            </div>
          </div>

          {/* Cuerpo Dividido en 2 Columnas */}
          <div className="flex flex-1 min-h-0 divide-x divide-slate-200">
            {/* Columna Izquierda: Lista de Mensajes */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-slate-50/70 shrink-0">
              {/* Buscador y Filtros */}
              <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    placeholder="Buscar instructivos, normativas, avisos..."
                    className="pl-9 h-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterType("todas")}
                    className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      filterType === "todas" ? "bg-[#002F6C] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Todas ({notificaciones.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("no_leidas")}
                    className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      filterType === "no_leidas" ? "bg-[#002F6C] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    No leídas ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Items de Notificaciones */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 p-2.5 space-y-1.5">
                {notificacionesFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Mail className="h-8 w-8 mx-auto opacity-30" />
                    <p className="text-xs font-bold">No se encontraron notificaciones</p>
                  </div>
                ) : (
                  notificacionesFiltradas.map((n) => {
                    const isSelected = selectedNotif?.id === n.id
                    const badge = getTipoBadge(n)
                    const BadgeIcon = badge.icon
                    const esDoc = isDocumentoNotif(n)

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          handleMarcarLeida(n.id)
                          setSelectedNotif(n)
                          setShowPdfViewer(false)
                        }}
                        className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-white border-[#002F6C] shadow-md ring-2 ring-[#002F6C]/10 border-l-4 border-l-[#002F6C]"
                            : n.leida
                            ? "bg-white/70 border-transparent hover:bg-white"
                            : "bg-blue-50/60 border-blue-200 hover:bg-white shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.bg}`}>
                            <BadgeIcon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {badge.tag}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">{n.fecha}</span>
                            </div>
                            <p className={`truncate text-xs mt-1 ${n.leida ? "font-bold text-slate-700" : "font-black text-[#002F6C]"}`}>
                              {n.titulo}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {n.mensaje}
                            </p>
                            {esDoc && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <FileText className="h-2.5 w-2.5" />
                                  PDF Disponible
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Columna Derecha: Vista Detallada de Lectura & Previsualización */}
            <div className="hidden md:flex flex-1 flex-col bg-white overflow-y-auto">
              {selectedNotif ? (
                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col">
                  {/* Encabezado del Mensaje */}
                  <div className="border-b border-slate-100 pb-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getTipoBadge(selectedNotif).bg}`}>
                        {getTipoBadge(selectedNotif).label}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {selectedNotif.fecha}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#002F6C] leading-snug">
                      {selectedNotif.titulo}
                    </h2>

                    {/* Fila del Remitente */}
                    <div className="flex items-center gap-3.5 pt-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFCC00] font-black shadow-md">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#002F6C]">
                          {selectedNotif.remitente || "Dirección General AGBC"}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          Para: Todo el personal y funcionarios de la Agencia Boliviana de Correos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Previsualización Enriquecida según Tipo */}
                  {isDocumentoNotif(selectedNotif) ? (
                    <div className="space-y-4">
                      {/* Tarjeta Ejecutiva de Previsualización de Documento */}
                      <div className="overflow-hidden rounded-3xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/40 shadow-md">
                        <div className="bg-gradient-to-r from-[#002F6C] to-[#0E5296] p-4 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#FFCC00] uppercase tracking-wider">Documento Oficial AGBC</p>
                              <p className="text-sm font-bold text-white truncate max-w-md">{selectedNotif.titulo.replace(/^(Nuevo Documento:|Documento:)/i, "").trim()}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            Vigente & Verificado
                          </span>
                        </div>

                        <div className="p-5 space-y-4">
                          <p className="text-sm leading-relaxed text-slate-700">
                            {selectedNotif.mensaje}
                          </p>

                          {/* Grid de Metadatos Institucionales */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                              <p className="text-[10px] font-black uppercase text-slate-400">Tipo de Documento</p>
                              <p className="text-xs font-bold text-[#002F6C] mt-0.5">Normativa / Instructivo</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                              <p className="text-[10px] font-black uppercase text-slate-400">Formato Digital</p>
                              <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                PDF Oficial
                              </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                              <p className="text-[10px] font-black uppercase text-slate-400">Acceso</p>
                              <p className="text-xs font-bold text-indigo-700 mt-0.5">Biblioteca Intranet</p>
                            </div>
                          </div>

                          {/* Botonera de Acciones para el Documento */}
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            {selectedNotif.archivoUrl && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setShowPdfViewer(!showPdfViewer)}
                                className="bg-[#002F6C] hover:bg-[#0E5296] text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-sm"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#FFCC00]" />
                                {showPdfViewer ? "Ocultar Visor PDF" : "Previsualizar PDF aquí"}
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
                                  className="rounded-xl text-xs font-bold text-[#002F6C] border-slate-200 gap-1.5 cursor-pointer hover:bg-slate-50"
                                >
                                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                                  Descargar PDF
                                </Button>
                              </a>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-xs font-bold text-[#0E5296] rounded-xl hover:bg-blue-50/80"
                            >
                              <Link href="/#documentos" onClick={() => setModalOpen(false)}>
                                <BookOpen className="h-3.5 w-3.5 mr-1" />
                                Ir a Biblioteca Digital
                              </Link>
                            </Button>
                          </div>

                          {/* Visor PDF Integrado en la Ventana */}
                          {showPdfViewer && selectedNotif.archivoUrl && (
                            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100 h-[380px] animate-in fade-in-0 duration-200">
                              <iframe
                                src={selectedNotif.archivoUrl}
                                title={selectedNotif.archivoNombre || "Visor de PDF"}
                                className="w-full h-full border-0 rounded-2xl"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Tarjeta Institucional de Comunicado o Alerta */
                    <div className="flex-1 text-sm text-slate-700 font-normal leading-relaxed space-y-4 bg-gradient-to-br from-blue-50/30 via-white to-slate-50 p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-xs font-black text-[#002F6C] uppercase tracking-wider">
                        <Building2 className="h-4 w-4 text-[#FFB800]" />
                        <span>Despacho Oficial • Intranet AGBC</span>
                      </div>

                      <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate-800">
                        {selectedNotif.mensaje}
                      </p>

                      {selectedNotif.archivoUrl && (
                        <div className="pt-3">
                          <a
                            href={selectedNotif.archivoUrl}
                            download={selectedNotif.archivoNombre || "comunicado_agbc.pdf"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs font-bold text-[#002F6C] border-slate-200 gap-1.5"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-600" />
                              Descargar Documento Adjunto (PDF)
                            </Button>
                          </a>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        <span>Mensaje institucional emitido y verificado por la Intranet Oficial de la Agencia Boliviana de Correos.</span>
                      </div>
                    </div>
                  )}

                  {/* Acciones del Pie */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2">
                      {esAdmin && (
                        <Button variant="outline" size="sm" asChild className="text-xs font-bold text-[#002F6C] rounded-xl border-slate-200">
                          <Link href="/notificaciones" onClick={() => setModalOpen(false)}>
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
                      className="rounded-xl text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar mensaje
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-2">
                  <Mail className="h-12 w-12 opacity-30" />
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
