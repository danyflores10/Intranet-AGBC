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
  Building2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Download,
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
            className={`pointer-events-auto flex items-center gap-3.5 rounded-2xl border-2 border-[#002F6C]/20 bg-white p-5 shadow-2xl ${
              t.visible ? "animate-in fade-in zoom-in-95" : "animate-out fade-out"
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-black text-[#002F6C]">Lectura Confirmada</p>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Tu conformidad ha sido registrada en el sistema. Puedes consultar la Guía de Documentos Prioritarios en cualquier momento.
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
        className="max-w-6xl w-[98vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white select-none"
      >
        {/* Header accesible Radix UI */}
        <DialogHeader className="sr-only">
          <DialogTitle>Instructivo Institucional Prioritario - Lectura Obligatoria</DialogTitle>
          <DialogDescription>Normativa general y de seguridad de la Agencia Boliviana de Correos</DialogDescription>
        </DialogHeader>

        {/* Banner de Cabecera Oficial Ultra-Amplio */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 sm:p-8 text-white">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-200 border border-red-400/40">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                Lectura Obligatoria • Inducción Institucional
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                Instructivo AGBC-DIR-001/2026: Normativa de Uso de Sistemas, Seguridad de la Información e Inducción Postal
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4 text-[#FFCC00]" />
                <span>Dirección General Ejecutiva • Agencia Boliviana de Correos &ldquo;Correos de Bolivia&rdquo;</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo del Instructivo Amplio */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="rounded-2xl bg-amber-50/90 p-5 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed font-medium space-y-1.5">
            <p className="font-bold flex items-center gap-2 text-amber-950 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
              Notificación Oficial de la Dirección General:
            </p>
            <p>
              Estimado(a) funcionario(a): Antes de continuar navegando por la Intranet y los sistemas postales, es requisito indispensable tomar conocimiento formal de las directrices y normas vigentes de la institución.
            </p>
          </div>

          {/* Puntos Clave del Instructivo en 3 Columnas o Bloque Espacioso */}
          <div className="space-y-4 bg-slate-50/80 p-6 sm:p-7 rounded-3xl border border-slate-200/80 text-xs sm:text-sm text-slate-700">
            <h4 className="font-black text-sm sm:text-base text-[#002F6C] uppercase tracking-wide border-b border-slate-200 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0E5296]" />
              Resumen Normativo de Cumplimiento Inmediato
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002F6C] text-[#FFCC00] text-xs font-black">
                    1
                  </span>
                  <p className="font-black text-[#002F6C] text-xs sm:text-sm">Confidencialidad de Credenciales</p>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  El usuario y contraseña asignados son estrictamente personales e intransferibles. Es obligación actualizar periódicamente la contraseña desde el módulo Mi Perfil.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E5296] text-white text-xs font-black">
                    2
                  </span>
                  <p className="font-black text-[#002F6C] text-xs sm:text-sm">Uso Responsable de Sistemas</p>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Los accesos digitales, correspondencia y herramientas de la Intranet están destinados exclusivamente al cumplimiento eficiente de las funciones laborales.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#002F6C] text-xs font-black">
                    3
                  </span>
                  <p className="font-black text-[#002F6C] text-xs sm:text-sm">Guía de Documentos Prioritarios</p>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Se instruye a todo el personal revisar en la sección Documentos la ruta ordenada de inducción, manuales de seguridad y reglamentos operativos postales.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox Obligatorio de Confirmación */}
          <div className="rounded-2xl border-2 border-[#002F6C]/25 bg-blue-50/50 p-5 transition-all hover:bg-blue-50/80">
            <label className="flex items-start gap-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aceptado}
                onChange={(e) => setAceptado(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-lg border-2 border-[#002F6C] text-[#002F6C] focus:ring-[#002F6C] cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-black text-[#002F6C] leading-snug">
                He leído atentamente el instructivo institucional, comprendo su alcance y me comprometo a cumplir estrictamente la normativa de la Agencia Boliviana de Correos.
              </span>
            </label>
          </div>

          {/* Botón de Confirmación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-500 text-center sm:text-left font-medium">
              * Esta confirmación quedará registrada en tu perfil institucional.
            </p>

            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={!aceptado || isConfirming}
              className={`w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-sm transition-all gap-2 cursor-pointer ${
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
