"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { BellIcon, CheckIcon, Trash2Icon, XIcon, CalendarIcon, InfoIcon, AlertTriangleIcon, MailIcon } from "lucide-react"
import toast from "react-hot-toast"
import {
  obtenerNotificacionesUsuario,
  contarNotificacionesNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
} from "@/actions/notificaciones"

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  enlace: string | null
  createdAt: Date
}

interface Props {
  usuarioId: string
  notificacionesIniciales: Notificacion[]
  countInicial: number
}

const TIPO_CONFIG: Record<string, { icon: typeof BellIcon; color: string; bg: string }> = {
  calendario: { icon: CalendarIcon, color: "#FF8800", bg: "bg-amber-50 dark:bg-amber-500/10" },
  info: { icon: InfoIcon, color: "#1976D2", bg: "bg-blue-50 dark:bg-blue-500/10" },
  alerta: { icon: AlertTriangleIcon, color: "#C41E3A", bg: "bg-red-50 dark:bg-red-500/10" },
  correspondencia: { icon: MailIcon, color: "#2E7D32", bg: "bg-green-50 dark:bg-green-500/10" },
}

function getTipoNotif(tipo: string) {
  return TIPO_CONFIG[tipo] ?? { icon: BellIcon, color: "#FFB300", bg: "bg-amber-50 dark:bg-amber-500/10" }
}

export function NotificacionesBell({ usuarioId, notificacionesIniciales, countInicial }: Props) {
  const [open, setOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales)
  const [count, setCount] = useState(countInicial)
  const [isPending, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)
  const prevIdsRef = useRef<Set<string>>(new Set(notificacionesIniciales.map((n) => n.id)))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notifPermissionRef = useRef<NotificationPermission>("default")

  // Precargar audio y pedir permiso de notificaciones nativas
  useEffect(() => {
    audioRef.current = new Audio("/mp3/notificaciones.mp3")

    if ("Notification" in window) {
      notifPermissionRef.current = Notification.permission
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          notifPermissionRef.current = perm
        })
      }
    }
  }, [])

  const playNotifSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  // Mostrar notificación nativa del navegador (como WhatsApp Web)
  const showBrowserNotification = useCallback((notif: Notificacion) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const tipoLabels: Record<string, string> = {
      calendario: "📅 Calendario",
      info: "ℹ️ Información",
      alerta: "⚠️ Alerta",
      correspondencia: "✉️ Correspondencia",
    }

    const tag = `notif-${notif.id}`
    const nativeNotif = new Notification(notif.titulo, {
      body: notif.mensaje,
      icon: "/image/LogoAmarillo.png",
      badge: "/image/LogoAmarillo.png",
      tag,
      silent: true, // Ya manejamos el sonido nosotros
    })

    nativeNotif.onclick = () => {
      window.focus()
      if (notif.enlace) {
        window.location.href = notif.enlace
      }
      nativeNotif.close()
    }

    // Auto cerrar después de 8 segundos
    setTimeout(() => nativeNotif.close(), 8000)
  }, [])

  // Mostrar toast custom para una notificación nueva
  const showNotifToast = useCallback((notif: Notificacion) => {
    const tipoCfg = getTipoNotif(notif.tipo)
    const Icon = tipoCfg.icon

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-in fade-in slide-in-from-top-2" : "animate-out fade-out slide-out-to-top-2"
          } pointer-events-auto flex w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10`}
        >
          <div className="flex-1 p-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${tipoCfg.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: tipoCfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {notif.titulo}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {notif.mensaje}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-zinc-700">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex w-full items-center justify-center rounded-none rounded-r-xl p-4 text-sm font-medium text-[#FF8800] transition-colors hover:text-[#FFB300] hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none"
            >
              Cerrar
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        duration: 5000,
      }
    )
  }, [])

  // Refrescar cada 30 segundos y mostrar toast para notificaciones nuevas
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [newNotifs, newCount] = await Promise.all([
          obtenerNotificacionesUsuario(usuarioId),
          contarNotificacionesNoLeidas(usuarioId),
        ])

        // Detectar notificaciones nuevas (que no existían antes)
        const nuevas = newNotifs.filter((n) => !prevIdsRef.current.has(n.id))
        if (nuevas.length > 0) playNotifSound()
        nuevas.forEach((n) => {
          showNotifToast(n)
          showBrowserNotification(n)
        })

        // Actualizar referencia de IDs conocidos
        prevIdsRef.current = new Set(newNotifs.map((n) => n.id))

        setNotificaciones(newNotifs)
        setCount(newCount)
      } catch { /* silencioso */ }
    }, 30000)
    return () => clearInterval(interval)
  }, [usuarioId, showNotifToast, playNotifSound, showBrowserNotification])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  function handleMarcarLeida(id: string) {
    startTransition(async () => {
      await marcarNotificacionLeida(id)
      setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
      setCount((c) => Math.max(0, c - 1))
    })
  }

  function handleMarcarTodas() {
    startTransition(async () => {
      await marcarTodasLeidas(usuarioId)
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setCount(0)
      toast.success("Todas las notificaciones marcadas como leídas")
    })
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      await eliminarNotificacion(id)
      setNotificaciones((prev) => {
        const removed = prev.find((n) => n.id === id)
        if (removed && !removed.leida) setCount((c) => Math.max(0, c - 1))
        return prev.filter((n) => n.id !== id)
      })
    })
  }

  function formatTiempo(date: Date) {
    const ahora = new Date()
    const diff = ahora.getTime() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Ahora"
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    const dias = Math.floor(hrs / 24)
    if (dias < 7) return `Hace ${dias}d`
    return new Date(date).toLocaleDateString("es-BO", { day: "numeric", month: "short" })
  }

  const noLeidas = notificaciones.filter((n) => !n.leida)
  const leidas = notificaciones.filter((n) => n.leida)

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 ${
          open
            ? "border-[#FFB300]/40 bg-[#FFB300]/10 text-[#FF8800]"
            : "border-border/50 bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <BellIcon className={`h-[18px] w-[18px] transition-transform ${count > 0 ? "animate-[bell-ring_0.5s_ease-in-out]" : ""}`} />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#C41E3A] to-[#940533] px-1 text-[10px] font-bold text-white shadow-lg shadow-[#C41E3A]/30 ring-2 ring-background">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {open && (
        <div className="absolute right-0 top-full mt-2.5 z-50 w-[400px] max-h-[560px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/15 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-[#FFB300]/5 to-transparent px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB300]/10">
                <BellIcon className="h-4 w-4 text-[#FFB300]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Notificaciones</h3>
                {count > 0 && (
                  <p className="text-[11px] text-muted-foreground">{count} sin leer</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {count > 0 && (
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#FF8800] transition-all hover:bg-[#FFB300]/10 disabled:opacity-50"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Leer todo
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[480px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <BellIcon className="h-8 w-8 text-muted-foreground/25" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Sin notificaciones</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Las notificaciones aparecerán aquí</p>
                </div>
              </div>
            ) : (
              <>
                {/* No leídas */}
                {noLeidas.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-5 py-2 border-b border-border/20">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF8800]">Nuevas</p>
                    </div>
                    {noLeidas.map((n) => {
                      const tipoCfg = getTipoNotif(n.tipo)
                      const Icon = tipoCfg.icon
                      return (
                        <div
                          key={n.id}
                          className="group flex items-start gap-3 border-b border-border/15 px-5 py-3.5 transition-all duration-200 bg-[#FFB300]/[0.03] hover:bg-[#FFB300]/[0.06]"
                        >
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tipoCfg.bg} transition-transform duration-200 group-hover:scale-110`}>
                            <Icon className="h-4 w-4" style={{ color: tipoCfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold leading-snug">{n.titulo}</p>
                                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{n.mensaje}</p>
                              </div>
                              <div className="h-2 w-2 shrink-0 mt-1.5 rounded-full bg-[#FFB300] ring-2 ring-[#FFB300]/20" />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[10px] text-muted-foreground/50 font-medium">{formatTiempo(n.createdAt)}</p>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleMarcarLeida(n.id)}
                                  className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-[#FF8800] hover:bg-[#FFB300]/10"
                                  title="Marcar como leída"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                  Leída
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminar(n.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                  title="Eliminar"
                                >
                                  <Trash2Icon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Leídas */}
                {leidas.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm px-5 py-2 border-b border-border/20">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Anteriores</p>
                    </div>
                    {leidas.map((n) => {
                      const tipoCfg = getTipoNotif(n.tipo)
                      const Icon = tipoCfg.icon
                      return (
                        <div
                          key={n.id}
                          className="group flex items-start gap-3 border-b border-border/10 px-5 py-3 transition-all duration-200 hover:bg-muted/30 opacity-65 hover:opacity-90"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold leading-snug truncate">{n.titulo}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.mensaje}</p>
                            <p className="text-[10px] text-muted-foreground/40 mt-1.5 font-medium">{formatTiempo(n.createdAt)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEliminar(n.id)}
                            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all"
                            title="Eliminar"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
