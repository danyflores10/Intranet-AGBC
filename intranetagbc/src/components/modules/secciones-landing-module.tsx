"use client"

import * as React from "react"
import {
  Eye,
  Save,
  Image as ImageIcon,
  Globe,
  MapPin,
  Megaphone,
  Shield,
  Users,
  Map,
  Sparkles,
  FileText,
  Trophy,
  SlidersHorizontalIcon,
  CheckCircle2Icon,
} from "lucide-react"
import toast from "react-hot-toast"
import { guardarMultipleConfiguracion } from "@/actions/configuracion"

type ConfigRow = { id: string; clave: string; valor: string; descripcion: string | null; grupo: string }

const SECCIONES = [
  { clave: "seccion_banners", label: "Noticias Institucionales", descripcion: "Noticias y anuncios destacados publicados por Comunicaciones", icon: ImageIcon, defaultVisible: true },
  { clave: "seccion_aplicaciones", label: "Acceso Rápido a Sistemas", descripcion: "Enlaces institucionales y aplicaciones externas", icon: Globe, defaultVisible: true },
  { clave: "seccion_comunicados", label: "Comunicados Oficiales", descripcion: "Comunicados institucionales publicados", icon: Megaphone, defaultVisible: true },
  { clave: "seccion_directorio", label: "Directorio Institucional", descripcion: "Jefes y directores de la institución", icon: Shield, defaultVisible: true },
  { clave: "seccion_equipo", label: "Personal / Nuestro Equipo", descripcion: "Empleados y personal institucional activo", icon: Users, defaultVisible: true },
  { clave: "seccion_documentos", label: "Documentos Institucionales", descripcion: "Documentos publicados disponibles para descarga y consulta", icon: FileText, defaultVisible: true },
  { clave: "seccion_mapa", label: "Mapa de Oficinas", descripcion: "Mapa interactivo de Bolivia con sucursales", icon: Map, defaultVisible: true },
  { clave: "seccion_sucursales", label: "Sucursales", descripcion: "Carrusel con las oficinas regionales a nivel nacional", icon: MapPin, defaultVisible: true },
] as const

export function SeccionesLandingModule({ configsIniciales }: { configsIniciales: ConfigRow[] }) {
  const [visibilidad, setVisibilidad] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const sec of SECCIONES) {
      const config = configsIniciales.find((c) => c.clave === sec.clave)
      initial[sec.clave] = config ? config.valor === "true" : sec.defaultVisible
    }
    return initial
  })
  const [guardando, setGuardando] = React.useState(false)

  const toggleSeccion = (clave: string) => {
    setVisibilidad((prev) => ({ ...prev, [clave]: !prev[clave] }))
  }

  const totalVisibles = Object.values(visibilidad).filter(Boolean).length

  const guardar = async () => {
    setGuardando(true)
    try {
      const configs = SECCIONES.map((sec) => ({
        clave: sec.clave,
        valor: visibilidad[sec.clave] ? "true" : "false",
        grupo: "secciones_landing",
        descripcion: sec.descripcion,
      }))
      await guardarMultipleConfiguracion(configs)
      toast.success("Configuración de secciones guardada con éxito")
    } catch {
      toast.error("Error al guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <SlidersHorizontalIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Configuración de Secciones del Landing
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Controla qué módulos y componentes visuales son visibles en la página principal institucional
            </p>
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0E5296] hover:bg-[#002F6C] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4 text-[#FFCC00]" />
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* ── Tarjetas Métricas Pastel ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            <CheckCircle2Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{totalVisibles} de {SECCIONES.length}</div>
            <div className="text-xs text-slate-600 font-bold">Secciones Activas y Visibles</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{SECCIONES.length - totalVisibles}</div>
            <div className="text-xs text-slate-600 font-bold">Secciones Ocultas</div>
          </div>
        </div>
      </div>

      {/* ── Grid de Secciones ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((sec) => {
          const activo = visibilidad[sec.clave]
          const Icon = sec.icon
          return (
            <div
              key={sec.clave}
              onClick={() => toggleSeccion(sec.clave)}
              className={`group relative flex items-start gap-4 rounded-3xl border-2 p-5 text-left transition-all duration-200 cursor-pointer ${
                activo
                  ? "border-[#0E5296] bg-white shadow-md shadow-[#0E5296]/5 ring-1 ring-[#FFCC00]/50"
                  : "border-slate-200 bg-white/70 opacity-60 hover:opacity-100"
              }`}
            >
              {/* Toggle indicator */}
              <div className={`relative mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                activo ? "bg-[#0E5296]" : "bg-slate-300"
              }`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  activo ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFCC00]/20 text-[#002F6C]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-black text-[#002F6C]">{sec.label}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">{sec.descripcion}</p>
              </div>

              {/* Status badge */}
              <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                activo
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {activo ? "Visible" : "Oculto"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

