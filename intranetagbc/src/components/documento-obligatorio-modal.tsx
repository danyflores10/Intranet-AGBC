"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ShieldAlert,
  FileText,
  CheckCircle2,
  Lock,
  Download,
  Building2,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import toast from "react-hot-toast"

const INSTRUCTIVO_KEY = "agbc_instructivo_obligatorio_2026_v1"

export function DocumentoObligatorioModal() {
  const [open, setOpen] = useState(false)
  const [aceptado, setAceptado] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya confirmó la lectura
    const yaLeido = localStorage.getItem(INSTRUCTIVO_KEY)
    if (!yaLeido) {
      // Pequeño retardo para animación suave de entrada
      const timer = setTimeout(() => {
        setOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConfirmar = () => {
    if (!aceptado) {
      toast.error("Debes marcar la casilla de confirmación para continuar")
      return
    }

    setIsConfirming(true)
    try {
      localStorage.setItem(INSTRUCTIVO_KEY, JSON.stringify({
        confirmado: true,
        fecha: new Date().toISOString(),
        version: "1.0",
      }))
      setOpen(false)
      toast.custom(
        (t) => (
          <div
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-[#002F6C]/20 bg-white p-4 shadow-2xl ${
              t.visible ? "animate-in fade-in zoom-in-95" : "animate-out fade-out"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-[#002F6C]">Lectura Confirmada</p>
              <p className="text-xs text-slate-600 font-medium">
                Tu conformidad ha sido registrada. Consulta la Guía de Documentos Prioritarios en cualquier momento.
              </p>
            </div>
          </div>
        ),
        { duration: 4500 }
      )
    } finally {
      setIsConfirming(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl w-[94vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white select-none"
      >
        {/* Header accesible Radix UI */}
        <DialogHeader className="sr-only">
          <DialogTitle>Instructivo Institucional Prioritario - Lectura Obligatoria</DialogTitle>
          <DialogDescription>Normativa general y de seguridad de la Agencia Boliviana de Correos</DialogDescription>
        </DialogHeader>

        {/* Banner de Cabecera Oficial */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 sm:p-7 text-white">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          <div className="flex items-start gap-4 pt-1">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-200 border border-red-400/40">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                Lectura Obligatoria • Inducción Institucional
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                Instructivo AGBC-DIR-001/2026: Normativa de Uso de Sistemas, Seguridad de la Información e Inducción Postal
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-2 font-medium">
                <Building2 className="h-3.5 w-3.5 text-[#FFCC00]" />
                <span>Dirección General Ejecutiva • Agencia Boliviana de Correos</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo del Instructivo */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              Notificación Importante de la Dirección General:
            </p>
            <p>
              Estimado(a) funcionario(a): Antes de continuar navegando por la Intranet y los sistemas postales, es requisito indispensable tomar conocimiento formal de las directrices vigentes de la institución.
            </p>
          </div>

          {/* Puntos Clave del Instructivo */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
            <h4 className="font-black text-sm text-[#002F6C] uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0E5296]" />
              Resumen Normativo de Cumplimiento Inmediato
            </h4>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E5296] text-white text-[10px] font-black">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900">Confidencialidad y Seguridad de Credenciales</p>
                  <p className="text-slate-600 mt-0.5">
                    El usuario y contraseña asignados son estrictamente personales e intransferibles. Es obligación actualizar la contraseña periódicamente desde el módulo Mi Perfil.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E5296] text-white text-[10px] font-black">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900">Uso Correcto de los Sistemas y Recursos Postales</p>
                  <p className="text-slate-600 mt-0.5">
                    Los accesos digitales, correspondencia y herramientas de la Intranet están destinados exclusivamente al cumplimiento de las funciones laborales asignadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E5296] text-white text-[10px] font-black">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">Consulta de la Guía Paso a Paso de Documentos Prioritarios</p>
                  <p className="text-slate-600 mt-0.5">
                    Se instruye a todo el personal revisar en la sección Documentos la ruta de lectura ordenada de manuales, reglamentos y circulares operativas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Obligatorio de Confirmación */}
          <div className="rounded-2xl border-2 border-[#002F6C]/20 bg-blue-50/40 p-4 transition-all hover:bg-blue-50/70">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aceptado}
                onChange={(e) => setAceptado(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded-lg border-2 border-[#002F6C] text-[#002F6C] focus:ring-[#002F6C] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-black text-[#002F6C] leading-snug">
                He leído atentamente el instructivo institucional, comprendo su alcance y me comprometo a cumplir estrictamente la normativa de la Agencia Boliviana de Correos.
              </span>
            </label>
          </div>

          {/* Botón de Confirmación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500 text-center sm:text-left">
              * Esta confirmación quedará registrada en tu perfil institucional.
            </p>

            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={!aceptado || isConfirming}
              className={`w-full sm:w-auto h-12 px-7 rounded-2xl font-black text-sm transition-all gap-2 cursor-pointer ${
                aceptado
                  ? "bg-[#002F6C] hover:bg-[#0E5296] text-white shadow-xl shadow-[#002F6C]/25 hover:scale-[1.02]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
              <span>Confirmar Lectura y Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
