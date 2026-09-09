"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"
import { XIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, SparklesIcon } from "lucide-react"

import { completarOnboarding, marcarOnboardingVisto, omitirOnboarding } from "@/actions/onboarding"
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding-steps"

type Props = {
  /** Si se fuerza, corre el tour sin importar el estado persistido (útil al reiniciar desde perfil) */
  forzar?: boolean
  onClose?: () => void
}

type TargetRect = { top: number; left: number; width: number; height: number } | null
type TooltipPlacement = "right" | "left" | "top" | "bottom"

const PAD = 8
const TOOLTIP_W = 340
const ARROW = 10

function leerRect(el: Element): TargetRect {
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function filtrarPasosDisponibles(pasos: OnboardingStep[]): OnboardingStep[] {
  return pasos.filter((p) => {
    if (!p.opcional) return true
    // Pasos que navegan a otra ruta: no podemos verificar su selector desde la ruta actual
    if (p.rutaRequerida) return true
    return document.querySelector(p.selector) !== null
  })
}

function calcularPlacement(rect: TargetRect): TooltipPlacement {
  if (!rect) return "right"
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200
  const derechaLibre = vw - (rect.left + rect.width) - TOOLTIP_W - PAD * 2
  const izquierdaLibre = rect.left - TOOLTIP_W - PAD * 2
  if (derechaLibre > 0) return "right"
  if (izquierdaLibre > 0) return "left"
  if (rect.top > 280) return "top"
  return "bottom"
}

export function OnboardingTour({ forzar = false, onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [pasos, setPasos] = useState<OnboardingStep[]>([])
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect>(null)
  const vistaMarcadaRef = useRef(false)
  const placement: TooltipPlacement = calcularPlacement(rect)

  const cerrar = useCallback(
    (finalizado: boolean) => {
      if (finalizado) void completarOnboarding()
      else void omitirOnboarding()
      onClose?.()
      setMounted(false)
    },
    [onClose],
  )

  // Montaje: resolver pasos disponibles
  useEffect(() => {
    // Esperamos un tick para que el DOM esté listo
    const t = window.setTimeout(() => {
      const disponibles = filtrarPasosDisponibles(ONBOARDING_STEPS)
      if (disponibles.length === 0) {
        onClose?.()
        return
      }
      setPasos(disponibles)
      setIndex(0)
      setMounted(true)
      if (!vistaMarcadaRef.current) {
        vistaMarcadaRef.current = true
        void marcarOnboardingVisto()
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [onClose, forzar])

  // Calcular rect del target cada vez que cambia el índice, pathname o hay resize/scroll
  useEffect(() => {
    if (!mounted || pasos.length === 0) return
    const paso = pasos[index]
    if (!paso) return

    // Si el paso requiere otra ruta, navegar y esperar a que el DOM tenga el target
    if (paso.rutaRequerida && pathname !== paso.rutaRequerida) {
      router.push(paso.rutaRequerida)
      // El próximo render con el pathname actualizado re-disparará este effect
      return
    }

    function calcular() {
      const el = document.querySelector(paso.selector)
      if (!el) {
        setRect(null)
        return
      }
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
      setRect(leerRect(el))
    }

    calcular()
    // Reintentar varias veces para esperar a que hidrate la nueva ruta
    const t1 = window.setTimeout(calcular, 200)
    const t2 = window.setTimeout(calcular, 600)
    const t3 = window.setTimeout(calcular, 1200)

    window.addEventListener("resize", calcular)
    window.addEventListener("scroll", calcular, true)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.removeEventListener("resize", calcular)
      window.removeEventListener("scroll", calcular, true)
    }
  }, [index, mounted, pasos, pathname, router])

  // Teclado
  useEffect(() => {
    if (!mounted) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar(false)
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, pasos.length - 1))
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mounted, pasos.length, cerrar])

  if (!mounted || pasos.length === 0) return null
  const paso = pasos[index]

  // Coordenadas del tooltip
  let tooltipStyle: React.CSSProperties = {}
  let arrowStyle: React.CSSProperties = {}

  if (rect) {
    const vh = window.innerHeight
    const vw = window.innerWidth

    if (placement === "right") {
      const top = Math.max(16, Math.min(rect.top + rect.height / 2 - 80, vh - 240))
      tooltipStyle = { top, left: rect.left + rect.width + PAD + ARROW, width: TOOLTIP_W }
      arrowStyle = {
        top: rect.top + rect.height / 2 - ARROW,
        left: rect.left + rect.width + PAD,
        transform: "rotate(45deg)",
      }
    } else if (placement === "left") {
      const top = Math.max(16, Math.min(rect.top + rect.height / 2 - 80, vh - 240))
      tooltipStyle = { top, left: rect.left - TOOLTIP_W - PAD - ARROW, width: TOOLTIP_W }
      arrowStyle = {
        top: rect.top + rect.height / 2 - ARROW,
        left: rect.left - PAD - ARROW * 2,
        transform: "rotate(45deg)",
      }
    } else if (placement === "top") {
      const left = Math.max(
        16,
        Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16),
      )
      tooltipStyle = { top: rect.top - 220 - PAD, left, width: TOOLTIP_W }
      arrowStyle = {
        top: rect.top - PAD - ARROW,
        left: rect.left + rect.width / 2 - ARROW,
        transform: "rotate(45deg)",
      }
    } else {
      const left = Math.max(
        16,
        Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16),
      )
      tooltipStyle = { top: rect.top + rect.height + PAD + ARROW, left, width: TOOLTIP_W }
      arrowStyle = {
        top: rect.top + rect.height + PAD - ARROW,
        left: rect.left + rect.width / 2 - ARROW,
        transform: "rotate(45deg)",
      }
    }
  }

  const esUltimo = index === pasos.length - 1

  const contenido = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay con "hueco" alrededor del elemento */}
      {rect ? (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-auto"
          onClick={() => cerrar(false)}
          style={{
            boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.55)`,
            clipPath: `polygon(
              0 0, 0 100%, 100% 100%, 100% 0,
              ${rect.left - 6}px 0,
              ${rect.left - 6}px ${rect.top - 6}px,
              ${rect.left + rect.width + 6}px ${rect.top - 6}px,
              ${rect.left + rect.width + 6}px ${rect.top + rect.height + 6}px,
              ${rect.left - 6}px ${rect.top + rect.height + 6}px,
              ${rect.left - 6}px 0
            )`,
            background: "rgba(15, 23, 42, 0.55)",
            transition: "clip-path 250ms ease",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-auto bg-slate-900/55"
          onClick={() => cerrar(false)}
        />
      )}

      {/* Borde resaltado del elemento target */}
      {rect && (
        <div
          aria-hidden
          className="absolute rounded-lg ring-2 ring-[#FFB800] shadow-[0_0_0_4px_rgba(255,184,0,0.25)] transition-all duration-300 animate-pulse-glow pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Flecha */}
      {rect && (
        <div
          aria-hidden
          className="absolute h-4 w-4 bg-white dark:bg-zinc-900 border-l border-t border-border/40 shadow-sm pointer-events-none transition-all duration-200"
          style={arrowStyle}
        />
      )}

      {/* Tooltip */}
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        className="absolute pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={tooltipStyle}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0E5296] text-[#FFB800]">
                <SparklesIcon className="h-3.5 w-3.5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Paso {index + 1} de {pasos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => cerrar(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Cerrar tour"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <h3 id="onboarding-title" className="mt-3 text-lg font-black tracking-tight text-[#002F6C]">
            {paso.titulo}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 font-medium leading-relaxed">
            {paso.descripcion}
          </p>

          {/* Dots */}
          <div className="mt-4 flex items-center gap-1">
            {pasos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-[#0E5296]"
                    : i < index
                      ? "w-1.5 bg-[#FFB800]"
                      : "w-1.5 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Anterior
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cerrar(false)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                Saltar
              </button>
              {esUltimo ? (
                <button
                  type="button"
                  onClick={() => cerrar(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0E5296] hover:bg-[#002F6C] px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <CheckIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                  Finalizar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(pasos.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0E5296] hover:bg-[#002F6C] px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Siguiente
                  <ChevronRightIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(contenido, document.body)
}
