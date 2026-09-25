"use client"

import { useState } from "react"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
  ShieldAlert,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface TourStep {
  numero: number
  titulo: string
  subtitulo: string
  prioridad: "Alta" | "Media" | "General"
  prioridadColor: string
  descripcion: string
  recomendacion: string
  docMatch: string
}

const PASOS_TOUR: TourStep[] = [
  {
    numero: 1,
    titulo: "Instructivo General de Inducción & Normativa Postal",
    subtitulo: "Instructivo AGBC-DIR-001/2026",
    prioridad: "Alta",
    prioridadColor: "bg-red-50 text-red-700 border-red-200",
    descripcion:
      "Es el documento oficial prioritario emitido por la Dirección General Ejecutiva. Establece las directrices y deberes de todo el personal que ingresa a la empresa postal.",
    recomendacion:
      "📌 Obligatorio: Debes revisar este documento y confirmar tu lectura al primer ingreso.",
    docMatch: "instructivo",
  },
  {
    numero: 2,
    titulo: "Manual de Políticas de Seguridad de la Información",
    subtitulo: "Seguridad y Custodia Digital",
    prioridad: "Alta",
    prioridadColor: "bg-red-50 text-red-700 border-red-200",
    descripcion:
      "Regula la protección de credenciales de usuario, contraseñas, confidencialidad de bases de datos y el uso adecuado de los equipos y la red institucional.",
    recomendacion:
      "🔑 Recomendación: Aplica las directrices de contraseñas seguras desde el módulo Mi Perfil.",
    docMatch: "seguridad",
  },
  {
    numero: 3,
    titulo: "Reglamento Operativo de Correspondencia y Logística",
    subtitulo: "Procesos Postales Nacionales",
    prioridad: "Media",
    prioridadColor: "bg-amber-50 text-amber-800 border-amber-200",
    descripcion:
      "Contiene los procedimientos estándar de admisión de envíos, clasificación de correspondencia, despacho y trazabilidad en agencias y regionales.",
    recomendacion:
      "📦 Operativo: Consulta este reglamento para conocer los estándares de despacho y entrega.",
    docMatch: "correspondencia",
  },
  {
    numero: 4,
    titulo: "Código de Ética y Reglamento Interno de Personal",
    subtitulo: "Convivencia y Derechos Laborales",
    prioridad: "General",
    prioridadColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    descripcion:
      "Establece los principios éticos, valores corporativos, derechos, obligaciones y régimen disciplinario que rigen a los funcionarios de Correos de Bolivia.",
    recomendacion:
      "⚖️ Institucional: Consulta general disponible para todo el personal de la AGBC.",
    docMatch: "etica",
  },
]

interface Props {
  open: boolean
  onClose: () => void
  onSelectDoc?: (query: string) => void
}

export function DocumentosTourTutorial({ open, onClose, onSelectDoc }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  if (!open) return null

  const step = PASOS_TOUR[currentStepIndex]
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === PASOS_TOUR.length - 1

  const handleNext = () => {
    if (isLast) {
      onClose()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleOpenCurrentDoc = () => {
    if (onSelectDoc) {
      onSelectDoc(step.docMatch)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      {/* Tarjeta Globo de Diálogo Flotante del Tutorial */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-[#FFCC00]/50 bg-white shadow-2xl shadow-black/40 animate-in zoom-in-95 duration-200">
        {/* Cabecera del Globo Tutorial */}
        <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white relative">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-md font-black text-base">
              {step.numero}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#FFCC00]">
                  Tutorial • Ruta de Lectura ({step.numero} de {PASOS_TOUR.length})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${step.prioridadColor}`}>
                  Prioridad {step.prioridad}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                {step.titulo}
              </h3>
            </div>
          </div>
        </div>

        {/* Cuerpo del Mensaje del Paso */}
        <div className="p-6 sm:p-7 space-y-5 bg-gradient-to-b from-white to-slate-50">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
            {step.descripcion}
          </p>

          <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200/80 text-xs sm:text-sm text-[#002F6C] font-medium leading-relaxed">
            {step.recomendacion}
          </div>

          {/* Indicador de Bolitas de Progreso */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {PASOS_TOUR.map((p, idx) => (
              <button
                key={p.numero}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-8 bg-[#002F6C]"
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Botones de Navegación del Tutorial */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenCurrentDoc}
              className="w-full sm:w-auto rounded-xl text-xs font-bold text-[#002F6C] border-slate-200 hover:bg-blue-50 cursor-pointer gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Ver este Documento</span>
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!isFirst && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-[#002F6C] hover:bg-[#0E5296] text-white font-black text-xs px-6 shadow-md shadow-[#002F6C]/20 cursor-pointer gap-1.5"
              >
                <span>{isLast ? "Finalizar Tutorial" : "Siguiente"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#FFCC00]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
