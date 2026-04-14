"use client"

import * as React from "react"
import {
  Eye,
  EyeOff,
  Save,
  Image as ImageIcon,
  Globe,
  BarChart3,
  MapPin,
  Megaphone,
  Shield,
  Users,
  Map,
  Sparkles,
  FileText,
} from "lucide-react"
import toast from "react-hot-toast"
import { guardarMultipleConfiguracion } from "@/actions/configuracion"

type ConfigRow = { id: string; clave: string; valor: string; descripcion: string | null; grupo: string }

const SECCIONES = [
  { clave: "seccion_banners", label: "Noticias Institucionales", descripcion: "Noticias y anuncios destacados publicados por Comunicaciones", icon: ImageIcon, defaultVisible: true },
  { clave: "seccion_aplicaciones", label: "Acceso Rápido a Sistemas", descripcion: "Enlaces institucionales y aplicaciones externas", icon: Globe, defaultVisible: true },
  { clave: "seccion_sucursales", label: "Sucursales", descripcion: "Carrusel con las oficinas regionales a nivel nacional", icon: MapPin, defaultVisible: true },
  { clave: "seccion_comunicados", label: "Comunicados", descripcion: "Comunicados institucionales publicados", icon: Megaphone, defaultVisible: true },
  { clave: "seccion_directorio", label: "Directorio Institucional", descripcion: "Jefes y directores de la institución", icon: Shield, defaultVisible: true },
  { clave: "seccion_equipo", label: "Personal / Nuestro Equipo", descripcion: "Empleados y personal institucional activo", icon: Users, defaultVisible: true },
  { clave: "seccion_mapa", label: "Mapa de Oficinas", descripcion: "Mapa interactivo de Bolivia con sucursales", icon: Map, defaultVisible: true },
  { clave: "seccion_documentos", label: "Documentos Institucionales", descripcion: "Documentos publicados disponibles para descarga y consulta", icon: FileText, defaultVisible: true },
  { clave: "seccion_features", label: "Módulos / Funcionalidades", descripcion: "Sección de funcionalidades y módulos del sistema", icon: Sparkles, defaultVisible: true },
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
      toast.success("Configuración de secciones guardada")
    } catch {
      toast.error("Error al guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Secciones del Landing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controla qué secciones se muestran en la página principal para usuarios logueados.
          </p>
        </div>
        <button
          onClick={guardar}
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-6 py-2.5 text-sm font-bold text-[#1a1000] shadow-md shadow-[#FFB300]/25 transition-all hover:shadow-lg hover:shadow-[#FFB300]/30 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
          <Eye className="h-5 w-5 text-[#FF8800]" />
        </div>
        <div>
          <p className="text-sm font-bold">{totalVisibles} de {SECCIONES.length} secciones visibles</p>
          <p className="text-xs text-muted-foreground">Los cambios se aplican inmediatamente al guardar</p>
        </div>
      </div>

      {/* Secciones grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SECCIONES.map((sec) => {
          const activo = visibilidad[sec.clave]
          const Icon = sec.icon
          return (
            <button
              key={sec.clave}
              type="button"
              onClick={() => toggleSeccion(sec.clave)}
              className={`group relative flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-200 ${
                activo
                  ? "border-[#FFB300]/40 bg-[#FFB300]/5 shadow-sm"
                  : "border-border/50 bg-card opacity-60 hover:opacity-80"
              }`}
            >
              {/* Toggle indicator */}
              <div className={`relative mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                activo ? "bg-gradient-to-r from-[#FFB300] to-[#FF8800]" : "bg-muted-foreground/20"
              }`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  activo ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${activo ? "text-[#FF8800]" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold">{sec.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{sec.descripcion}</p>
              </div>

              {/* Status badge */}
              <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                activo
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}>
                {activo ? "Visible" : "Oculto"}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
