"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  Camera,
  Phone,
  UserCircle2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

export interface DynamicTourStep {
  targetSelector: string
  titulo: string
  descripcion: string
  prioridad: "alta" | "media" | "normal"
  prioridadLabel: string
  tag: string
  isProfileStep?: boolean
}

type Rect = { top: number; left: number; width: number; height: number } | null

export function DocumentInteractiveTour() {
  const [active, setActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect>(null)
  const [mounted, setMounted] = useState(false)
  const [dynamicSteps, setDynamicSteps] = useState<DynamicTourStep[]>([])

  // Generar pasos dinámicos inspeccionando las tarjetas reales del DOM + pasos de perfil
  const buildTourSteps = useCallback(() => {
    const steps: DynamicTourStep[] = []

    // 1. Obtener tarjetas de documentos reales presentes en el DOM (hasta 4)
    for (let i = 0; i < 4; i++) {
      const el = document.querySelector(`[data-tour-doc='${i}']`)
      if (el) {
        const titleEl = el.querySelector("h3")
        const rawTitle = titleEl?.textContent?.trim() || `Documento Prioritario #${i + 1}`
        
        let priorityLabel = "Prioridad Normal"
        let priorityType: "alta" | "media" | "normal" = "normal"
        if (i === 0 || /reglamento|instructivo|normativa|seguridad/i.test(rawTitle)) {
          priorityLabel = "Prioridad Alta"
          priorityType = "alta"
        } else if (i === 1 || i === 2) {
          priorityLabel = "Prioridad Media"
          priorityType = "media"
        }

        steps.push({
          targetSelector: `[data-tour-doc='${i}']`,
          titulo: `${i + 1}. ${rawTitle}`,
          descripcion:
            i === 0
              ? "Documento de alta prioridad institucional. Puedes previsualizar su contenido oficial haciendo clic en el ojo (👁️) o descargarlo."
              : "Revisa este documento para conocer los procedimientos vigentes y la normativa institucional de la Agencia Boliviana de Correos.",
          prioridad: priorityType,
          prioridadLabel: priorityLabel,
          tag: "Documento AGBC",
        })
      }
    }

    // Fallback si no hay tarjetas de docs (por filtros)
    if (steps.length === 0) {
      steps.push({
        targetSelector: "#documentos",
        titulo: "Repositorio Digital de Documentos",
        descripcion: "Aquí podrás buscar, filtrar y consultar todos los reglamentos, instructivos y manuales oficiales de la AGBC.",
        prioridad: "alta",
        prioridadLabel: "Repositorio",
        tag: "Documentos",
      })
    }

    // 2. Paso de Navbar: Botón Mi Perfil
    steps.push({
      targetSelector: "[data-tour='navbar-user']",
      titulo: `${steps.length + 1}. Acceso a Mi Perfil Institucional`,
      descripcion:
        "En la barra superior tienes acceso a tu cuenta. Desde aquí puedes ingresar a 'Mi Perfil' para actualizar tu foto y tu número de teléfono.",
      prioridad: "alta",
      prioridadLabel: "Mi Perfil",
      tag: "Perfil",
      isProfileStep: true,
    })

    // 3. Paso dentro del modal: Foto de Perfil
    steps.push({
      targetSelector: "[data-tour='perfil-avatar']",
      titulo: `${steps.length + 1}. Fotografía de Perfil`,
      descripcion:
        "Haz clic en el ícono de la cámara dorada (📷) para subir o actualizar tu fotografía institucional verificada.",
      prioridad: "alta",
      prioridadLabel: "Identidad",
      tag: "Foto",
      isProfileStep: true,
    })

    // 4. Paso dentro del modal: Número de Celular
    steps.push({
      targetSelector: "[data-tour='perfil-telefono']",
      titulo: `${steps.length + 1}. Número de Celular / Teléfono`,
      descripcion:
        "Ingresa o actualiza tu número de celular para que tu equipo y RRHH puedan comunicarse contigo, luego pulsa 'Guardar Cambios'.",
      prioridad: "alta",
      prioridadLabel: "Contacto",
      tag: "Celular",
      isProfileStep: true,
    })

    setDynamicSteps(steps)
  }, [])

  useEffect(() => {
    setMounted(true)
    const handleStart = () => {
      buildTourSteps()
      setCurrentStepIndex(0)
      setActive(true)
    }
    window.addEventListener("agbc:start-documents-tour", handleStart)
    return () => window.removeEventListener("agbc:start-documents-tour", handleStart)
  }, [buildTourSteps])

  // Manejar transiciones entre pasos (apertura/cierre de modal de perfil y scroll suave)
  useEffect(() => {
    if (!active || dynamicSteps.length === 0) return

    const currentStep = dynamicSteps[currentStepIndex]
    if (!currentStep) return

    // Si el paso es el de la navbar (primer paso de perfil), asegurar que suba al inicio
    if (currentStep.targetSelector === "[data-tour='navbar-user']") {
      window.dispatchEvent(new CustomEvent("agbc:close-perfil-dialog"))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    // Si el paso es avatar o teléfono dentro del modal de perfil, abrir el diálogo
    if (
      currentStep.targetSelector === "[data-tour='perfil-avatar']" ||
      currentStep.targetSelector === "[data-tour='perfil-telefono']"
    ) {
      window.dispatchEvent(new CustomEvent("agbc:open-perfil-dialog"))
    }
  }, [active, currentStepIndex, dynamicSteps])

  const updateTargetPosition = useCallback(() => {
    if (!active || dynamicSteps.length === 0) return
    const step = dynamicSteps[currentStepIndex]
    if (!step) return

    const el = document.querySelector(step.targetSelector)
    if (el) {
      if (!step.isProfileStep) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
      }
      const r = el.getBoundingClientRect()
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      })
    } else {
      setTargetRect(null)
    }
  }, [active, currentStepIndex, dynamicSteps])

  useEffect(() => {
    if (!active) return
    updateTargetPosition()
    const timer1 = setTimeout(updateTargetPosition, 100)
    const timer2 = setTimeout(updateTargetPosition, 350)
    const timer3 = setTimeout(updateTargetPosition, 700)

    window.addEventListener("resize", updateTargetPosition)
    window.addEventListener("scroll", updateTargetPosition, true)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener("resize", updateTargetPosition)
      window.removeEventListener("scroll", updateTargetPosition, true)
    }
  }, [active, currentStepIndex, updateTargetPosition])

  const handleNext = () => {
    if (currentStepIndex < dynamicSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleFinalizar()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleFinalizar = () => {
    setActive(false)
    window.dispatchEvent(new CustomEvent("agbc:close-perfil-dialog"))
    window.scrollTo({ top: 0, behavior: "smooth" })
    toast.success("¡Tutorial de inducción completado con éxito!", {
      duration: 3500,
    })
  }

  const handleClose = () => {
    setActive(false)
    window.dispatchEvent(new CustomEvent("agbc:close-perfil-dialog"))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!mounted || !active || dynamicSteps.length === 0) return null

  const step = dynamicSteps[currentStepIndex] || dynamicSteps[0]
  const isLast = currentStepIndex === dynamicSteps.length - 1

  // Cálculo de posición del Tooltip Globo con Flecha
  let tooltipTop = 100
  let tooltipLeft = 100
  let placement: "bottom" | "top" | "left" | "right" = "bottom"
  const TOOLTIP_WIDTH = 390
  const TOOLTIP_HEIGHT = 240

  if (targetRect && typeof window !== "undefined") {
    const vh = window.innerHeight
    const vw = window.innerWidth

    const spaceBelow = vh - (targetRect.top + targetRect.height)
    const spaceAbove = targetRect.top

    if (spaceBelow > TOOLTIP_HEIGHT + 24) {
      placement = "bottom"
      tooltipTop = targetRect.top + targetRect.height + 16
      tooltipLeft = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 20))
    } else if (spaceAbove > TOOLTIP_HEIGHT + 24) {
      placement = "top"
      tooltipTop = targetRect.top - TOOLTIP_HEIGHT - 16
      tooltipLeft = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 20))
    } else {
      placement = "bottom"
      tooltipTop = Math.max(20, Math.min(targetRect.top + targetRect.height / 2, vh - TOOLTIP_HEIGHT - 20))
      tooltipLeft = Math.max(16, vw / 2 - TOOLTIP_WIDTH / 2)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] pointer-events-none select-none">
      {/* ── BACKDROP OSCURO CON MÁSCARA SVG DE ESQUINAS REDONDEADAS ── */}
      {targetRect ? (
        <svg
          aria-hidden
          onClick={handleClose}
          className="absolute inset-0 h-full w-full pointer-events-auto transition-all duration-300 cursor-pointer"
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="24"
                ry="24"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(3, 15, 38, 0.78)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          aria-hidden
          onClick={handleClose}
          className="absolute inset-0 pointer-events-auto bg-[#001D44]/75 backdrop-blur-sm cursor-pointer"
        />
      )}

      {/* ── BORDE ANIMADO SPOTLIGHT SOBRE EL ELEMENTO SELECCIONADO ── */}
      {targetRect && (
        <div
          className="absolute rounded-3xl ring-4 ring-[#FFCC00] shadow-[0_0_45px_rgba(255,204,0,0.55)] transition-all duration-300 pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* ── GLOBO DE TEXTO (TOOLTIP) FLOTANTE CON ANIMACIÓN ── */}
      <div
        className="absolute pointer-events-auto rounded-3xl bg-white text-slate-800 border-2 border-[#002F6C]/20 shadow-2xl p-5 sm:p-6 transition-all duration-300 animate-in fade-in-0 zoom-in-95"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: Math.min(TOOLTIP_WIDTH, typeof window !== "undefined" ? window.innerWidth - 32 : 390),
        }}
      >
        {/* Cabecera del Paso */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#002F6C] text-[#FFCC00] text-xs font-black shadow-xs">
              {currentStepIndex + 1}
            </span>
            <span className="text-xs font-black text-[#002F6C] uppercase tracking-wider">
              Paso {currentStepIndex + 1} de {dynamicSteps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                step.prioridad === "alta"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : step.prioridad === "media"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-blue-50 text-[#0E5296] border-blue-200"
              }`}
            >
              {step.prioridadLabel}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              title="Cerrar tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido del Globo */}
        <div className="py-3.5 space-y-2">
          <h4 className="text-sm font-black text-[#002F6C] leading-snug line-clamp-2">
            {step.titulo}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {step.descripcion}
          </p>
        </div>

        {/* Botones de Navegación del Tour */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Saltar tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 rounded-xl text-xs font-bold text-[#002F6C] border-slate-200 hover:bg-slate-50 cursor-pointer px-3"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Anterior
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-8 rounded-xl text-xs font-black bg-[#002F6C] hover:bg-[#0E5296] text-white shadow-md shadow-[#002F6C]/25 cursor-pointer px-3.5 gap-1"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#FFCC00]" />
                  <span>Finalizar</span>
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#FFCC00]" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

