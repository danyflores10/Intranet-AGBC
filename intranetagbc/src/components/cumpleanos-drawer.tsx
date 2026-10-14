"use client"

import { useState, useEffect, useRef } from "react"
import {
  Cake,
  PartyPopper,
  Sparkles,
  Gift,
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Search,
  Heart,
  Send,
  Building2,
  Award,
  CheckCircle2,
  Mail,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"
import confetti from "canvas-confetti"
import type { Cumpleanero } from "@/actions/cumpleanos"
import { MESES_ES } from "@/lib/validations/reconocimientos"
import { CumpleaneroFelicitacionModal } from "@/components/cumpleanero-felicitacion-modal"
import { registrarVisitaSeccionAction } from "@/actions/auditoria"

interface CumpleanosDrawerProps {
  cumpleanerosData: {
    hoy: Cumpleanero[]
    esteMes: Cumpleanero[]
    todosMeses: Cumpleanero[]
    mesActualNombre: string
  }
  usuarioActual?: {
    id?: string
    name?: string
    cargo?: string
  }
}

export function CumpleanosDrawer({
  cumpleanerosData,
  usuarioActual,
}: CumpleanosDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPeekMode, setIsPeekMode] = useState(false)
  const [tabActiva, setTabActiva] = useState<"hoy" | "mes" | "todos">("hoy")
  const [busqueda, setBusqueda] = useState("")
  const [modalCartaAbierto, setModalCartaAbierto] = useState(false)
  const [saludosEnviados, setSaludosEnviados] = useState<Record<string, boolean>>({})

  const totalHoy = cumpleanerosData?.hoy?.length || 0
  const totalMes = cumpleanerosData?.esteMes?.length || 0

  useEffect(() => {
    if (isOpen) {
      registrarVisitaSeccionAction({ seccion: "Cumpleaños & Efemérides" }).catch(() => {})
    }
  }, [isOpen])

  // Verificar si el usuario actual cumple años hoy
  const usuarioCumpleHoy = cumpleanerosData?.hoy?.some(
    (c) =>
      c.id === usuarioActual?.id ||
      (usuarioActual?.name && c.nombre.toLowerCase().includes(usuarioActual.name.toLowerCase()))
  )

  // Efecto de Auto-Peek: Se muestra durante 5 segundos al entrar y luego se retrae a su pestaña lateral
  useEffect(() => {
    const yaVistoSession = sessionStorage.getItem("agbc_cumple_peek_shown")
    if (!yaVistoSession) {
      // Peeking suave
      const timerOpen = setTimeout(() => {
        setIsPeekMode(true)
        sessionStorage.setItem("agbc_cumple_peek_shown", "1")
      }, 1500)

      // Auto-retraer tras 5.5 segundos
      const timerClose = setTimeout(() => {
        setIsPeekMode(false)
      }, 7000)

      return () => {
        clearTimeout(timerOpen)
        clearTimeout(timerClose)
      }
    }
  }, [])

  // Escuchar eventos globales para apertura manual (ej: desde el botón flotante 'C')
  useEffect(() => {
    const handleOpenFelicitacion = () => {
      setModalCartaAbierto(true)
    }
    const handleOpenDrawer = () => {
      setIsPeekMode(false)
      setIsOpen(true)
    }

    window.addEventListener("agbc:open-cumpleanos-felicitacion", handleOpenFelicitacion)
    window.addEventListener("agbc:open-cumpleanos-drawer", handleOpenDrawer)

    return () => {
      window.removeEventListener("agbc:open-cumpleanos-felicitacion", handleOpenFelicitacion)
      window.removeEventListener("agbc:open-cumpleanos-drawer", handleOpenDrawer)
    }
  }, [])

  const dispararConfetiPequeno = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.85, y: 0.5 },
      colors: ["#002F6C", "#FFCC00", "#FF6B6B", "#4ECDC4"],
      zIndex: 9999,
    })
  }

  const handleEnviarSaludo = (c: Cumpleanero) => {
    setSaludosEnviados((prev) => ({ ...prev, [c.id]: true }))
    dispararConfetiPequeno()
    toast.success(`🎉 ¡Felicitación enviada a ${c.nombre}!`, {
      icon: "🎂",
      duration: 3500,
    })
  }

  // Filtrado de la lista
  const obtenerListaFiltrada = () => {
    let list: Cumpleanero[] = []
    if (tabActiva === "hoy") {
      list = cumpleanerosData.hoy.length > 0 ? cumpleanerosData.hoy : cumpleanerosData.esteMes.slice(0, 3)
    } else if (tabActiva === "mes") {
      list = cumpleanerosData.esteMes
    } else {
      list = cumpleanerosData.todosMeses
    }

    if (!busqueda.trim()) return list
    const q = busqueda.toLowerCase().trim()
    return list.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q) ||
        c.unidad.toLowerCase().includes(q)
    )
  }

  const lista = obtenerListaFiltrada()

  return (
    <>
      {/* ── MODAL DE CARTA DE FELICITACIÓN (Si cumple años hoy o le da click a ver su carta) ── */}
      <CumpleaneroFelicitacionModal
        usuarioNombre={usuarioActual?.name || "Estimado Funcionario"}
        usuarioCargo={usuarioActual?.cargo || "Funcionario Institucional"}
        esCumpleanos={Boolean(usuarioCumpleHoy)}
        forzarApertura={modalCartaAbierto}
        onClose={() => setModalCartaAbierto(false)}
        onVerCumpleaneros={() => {
          setModalCartaAbierto(false)
          setIsPeekMode(false)
          setIsOpen(true)
        }}
      />

      {/* ── PESTAÑA / BOTÓN FLOTANTE LATERAL DERECHO ── */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
        {/* Banner Peek de 5 segundos */}
        {isPeekMode && !isOpen && (
          <div
            onClick={() => {
              setIsPeekMode(false)
              setIsOpen(true)
            }}
            className="mr-2 flex items-center gap-3 rounded-2xl border-2 border-[#FFCC00] bg-white p-3 shadow-2xl shadow-[#002F6C]/25 cursor-pointer animate-in slide-in-from-right-8 duration-300 hover:scale-103 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFCC00] to-[#FF9E00] text-[#002F6C] shadow-md font-black animate-bounce">
              <Cake className="h-5 w-5" />
            </div>
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#FFCC00] px-2 py-0.5 text-[10px] font-black text-[#002F6C] uppercase">
                  {totalHoy > 0 ? `${totalHoy} Hoy` : "Este Mes"}
                </span>
                <p className="text-xs font-black text-[#002F6C]">Cumpleañeros AGBC</p>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {totalHoy > 0 ? "¡Celebramos a nuestros compañeros hoy!" : `Celebraciones de ${cumpleanerosData.mesActualNombre}`}
              </p>
            </div>
            <ChevronLeft className="h-4 w-4 text-[#002F6C]" />
          </div>
        )}

        {/* Pestaña / Botón Lateral Fijo */}
        <button
          type="button"
          onClick={() => {
            setIsPeekMode(false)
            setIsOpen(!isOpen)
          }}
          aria-label="Abrir panel de cumpleañeros"
          className="group relative flex items-center gap-2 rounded-l-2xl border-y-2 border-l-2 border-[#FFCC00] bg-gradient-to-r from-[#002F6C] to-[#0E5296] py-3.5 pl-3.5 pr-2 text-white shadow-xl shadow-[#002F6C]/30 transition-all hover:pl-4 hover:shadow-2xl cursor-pointer"
        >
          {/* Indicador de pulso si hay cumpleañeros hoy */}
          {totalHoy > 0 && (
            <span className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFCC00] text-[#002F6C] text-[9px] font-black shadow-md animate-pulse">
              {totalHoy}
            </span>
          )}

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] shadow-sm font-black group-hover:rotate-12 transition-transform">
            <Cake className="h-4.5 w-4.5" />
          </div>

          <div className="hidden sm:flex flex-col text-left pr-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#FFCC00]">
              {cumpleanerosData.mesActualNombre}
            </span>
            <span className="text-xs font-black text-white leading-tight">
              Cumpleaños
            </span>
          </div>

          <ChevronLeft
            className={`h-4 w-4 text-[#FFCC00] transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* ── OVERLAY DE FONDO AL ABRIR EL DRAWER ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-2xs transition-opacity duration-300"
        />
      )}

      {/* ── PANEL DRAWER DESPLEGABLE LATERAL (DERECHO) ── */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-[70] w-full sm:w-[420px] md:w-[460px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cabecera del Panel con Gradiente & Festividad */}
        <div className="relative bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black shadow-md">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Cumpleañeros AGBC
                </h3>
                <span className="rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[10px] font-black uppercase">
                  {cumpleanerosData.mesActualNombre}
                </span>
              </div>
              <p className="text-xs text-blue-100">
                ¡Celebramos y reconocemos a nuestra gran familia postal!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar panel"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tarjeta Especial si el usuario cumple años */}
        {usuarioCumpleHoy && (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/15 border-b border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#002F6C]">¡Hoy es tu cumpleaños!</p>
                <p className="text-[11px] text-amber-900">Tienes una carta oficial de felicitación.</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setModalCartaAbierto(true)}
              className="bg-[#002F6C] hover:bg-[#0E5296] text-white rounded-xl text-xs font-black gap-1 shadow-xs cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 text-[#FFCC00] fill-[#FFCC00]" />
              Ver Carta
            </Button>
          </div>
        )}

        {/* Filtros por Pestañas & Buscador */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar funcionario por nombre o cargo..."
              className="pl-9 h-10 rounded-xl text-xs bg-white border-slate-200 shadow-2xs"
            />
          </div>

          {/* Pestañas de Filtro */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-black">
            <button
              type="button"
              onClick={() => setTabActiva("hoy")}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                tabActiva === "hoy"
                  ? "bg-white text-[#002F6C] shadow-xs"
                  : "text-slate-600 hover:text-[#002F6C]"
              }`}
            >
              <Cake className="h-3.5 w-3.5 text-[#FFCC00]" />
              <span>Hoy ({totalHoy})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva("mes")}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                tabActiva === "mes"
                  ? "bg-white text-[#002F6C] shadow-xs"
                  : "text-slate-600 hover:text-[#002F6C]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-[#0E5296]" />
              <span>Este Mes ({totalMes})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva("todos")}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                tabActiva === "todos"
                  ? "bg-white text-[#002F6C] shadow-xs"
                  : "text-slate-600 hover:text-[#002F6C]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Todos</span>
            </button>
          </div>
        </div>

        {/* Lista de Cumpleañeros */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
          {lista.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200">
              <Cake className="h-10 w-10 mx-auto opacity-30 text-amber-500" />
              <p className="text-xs font-bold text-slate-600">No se encontraron celebraciones en esta selección</p>
              <p className="text-[11px] text-slate-400">Prueba cambiando la pestaña o el término de búsqueda</p>
            </div>
          ) : (
            lista.map((c) => {
              const enviado = saludosEnviados[c.id]
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 bg-white ${
                    c.esHoy
                      ? "border-amber-300 shadow-md ring-2 ring-amber-400/20 bg-gradient-to-br from-amber-50/40 via-white to-yellow-50/30"
                      : "border-slate-200/80 hover:border-blue-200 shadow-2xs hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar con Corona/Borde Festivo */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black shadow-sm ${
                          c.esHoy
                            ? "bg-gradient-to-br from-[#FFCC00] to-[#FF9E00] text-[#002F6C] ring-2 ring-amber-400"
                            : "bg-slate-100 text-[#002F6C] border border-slate-200"
                        }`}
                      >
                        {c.foto ? (
                          <img
                            src={c.foto}
                            alt={c.nombre}
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          c.nombre.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      {c.esHoy && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#002F6C] text-[#FFCC00] text-[10px] shadow-sm">
                          👑
                        </span>
                      )}
                    </div>

                    {/* Información del Funcionario */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="truncate text-xs sm:text-sm font-black text-[#002F6C]">
                          {c.nombre}
                        </p>
                        {c.esHoy ? (
                          <span className="shrink-0 rounded-full bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider animate-pulse">
                            ¡Hoy! 🎈
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {c.dia} de {MESES_ES[c.mes - 1]}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                        {c.cargo}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.unidad}</span>
                      </div>

                      {/* Botón de Enviar Saludo / Felicitación */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">
                          {c.esHoy
                            ? "¡Felicítalo en su día especial!"
                            : c.diasRestantes > 0
                            ? `Faltan ${c.diasRestantes} días`
                            : "Celebrado"}
                        </span>

                        <Button
                          type="button"
                          size="sm"
                          disabled={enviado}
                          onClick={() => handleEnviarSaludo(c)}
                          className={`h-7 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            enviado
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-[#002F6C] hover:bg-[#0E5296] text-white shadow-2xs"
                          }`}
                        >
                          {enviado ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                              Felicitado
                            </>
                          ) : (
                            <>
                              <PartyPopper className="h-3 w-3 mr-1 text-[#FFCC00]" />
                              Felicitar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer del Drawer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Agencia Boliviana de Correos</span>
          <span className="font-bold text-[#002F6C]">Gestión de Talento Humano</span>
        </div>
      </div>
    </>
  )
}
