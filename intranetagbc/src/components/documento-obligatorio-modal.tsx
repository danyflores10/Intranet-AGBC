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
  Download,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  ExternalLink,
} from "lucide-react"
import toast from "react-hot-toast"

const PDF_URL = "/documentos/doc_026_reglamento_interno_de_personal.pdf"

interface DocumentoObligatorioModalProps {
  usuarioId?: string | null
}

export function DocumentoObligatorioModal({ usuarioId }: DocumentoObligatorioModalProps) {
  const [open, setOpen] = useState(false)
  const [aceptado, setAceptado] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const storageKey = usuarioId ? `agbc_instructivo_user_${usuarioId}` : "agbc_instructivo_guest"

  useEffect(() => {
    // 1. Verificar localStorage específico por usuario
    const yaLeidoLocal = localStorage.getItem(storageKey)
    if (yaLeidoLocal) {
      return
    }

    // 2. Verificar estado en base de datos
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (!data.completado) {
          const timer = setTimeout(() => {
            setOpen(true)
          }, 400)
          return () => clearTimeout(timer)
        } else {
          // Si ya estaba completado en BD, actualizar localStorage
          localStorage.setItem(storageKey, JSON.stringify({ confirmado: true }))
        }
      })
      .catch(() => {
        // Fallback: si no hay registro local, abrir modal
        if (!yaLeidoLocal) {
          setOpen(true)
        }
      })
  }, [storageKey, usuarioId])

  const handleConfirmar = async () => {
    if (!aceptado) {
      toast.error("Debes marcar la casilla de confirmación para continuar")
      return
    }

    setIsConfirming(true)
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          confirmado: true,
          fecha: new Date().toISOString(),
          documento: "doc_026_reglamento_interno_de_personal.pdf",
          version: "2.1",
        })
      )

      // Guardar en base de datos
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "completar" }),
        })
      } catch {}

      setOpen(false)

      toast.custom(
        (t) => (
          <div
            className={`pointer-events-auto flex items-center gap-3.5 rounded-2xl border-2 border-[#002F6C]/20 bg-white p-4 shadow-2xl ${
              t.visible ? "animate-in fade-in zoom-in-95" : "animate-out fade-out"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-[#002F6C]">Lectura Confirmada</p>
              <p className="text-xs text-slate-600 font-medium">
                Iniciando el tutorial guiado de documentos prioritarios y perfil...
              </p>
            </div>
          </div>
        ),
        { duration: 4000 }
      )

      // Desplazamiento automático suave hasta la sección de documentos y arranque del tutorial interactivo
      setTimeout(() => {
        const el = document.getElementById("documentos")
        if (el) {
          const topOffset = 80
          const elementPosition = el.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - topOffset
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })
        }
        // Disparar evento para iniciar el tour interactivo con spotlight
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("agbc:start-documents-tour"))
        }, 700)
      }, 400)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReiniciarFlujo = async () => {
    localStorage.removeItem(storageKey)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reiniciar" }),
      })
    } catch {}

    setAceptado(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
    setTimeout(() => {
      setOpen(true)
      toast.success("Flujo de primer ingreso reiniciado")
    }, 200)
  }

  return (
    <>
      {/* ── BOTONES FLOTANTES 'C' Y 'R' (ESQUINA INFERIOR IZQUIERDA) ── */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2.5">
        {/* Botón 'C': Ver felicitación de cumpleaños y homenaje */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("agbc:open-cumpleanos-felicitacion"))
          }}
          title="Ver Felicitación de Cumpleaños y Homenaje (C)"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#002F6C] hover:bg-[#0E5296] text-[#FFCC00] border-2 border-[#FFCC00] shadow-xl shadow-[#002F6C]/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <span className="text-base sm:text-lg font-black tracking-tighter">C</span>
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-xl bg-[#002F6C] px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block border border-[#FFCC00]/40">
            Felicitación de Cumpleaños (C)
          </span>
        </button>

        {/* Botón 'R': Reiniciar Primer Ingreso */}
        <button
          type="button"
          onClick={handleReiniciarFlujo}
          title="Reiniciar flujo de primer ingreso (R)"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#002F6C] hover:bg-[#0E5296] text-[#FFCC00] border-2 border-[#FFCC00] shadow-xl shadow-[#002F6C]/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <span className="text-base sm:text-lg font-black tracking-tighter">R</span>
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-xl bg-[#002F6C] px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block border border-[#FFCC00]/40">
            Reiniciar Primer Ingreso (R)
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl lg:max-w-6xl w-[96vw] max-h-[94vh] flex flex-col p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white select-none overflow-hidden"
        >
          {/* Header accesible Radix UI */}
          <DialogHeader className="sr-only">
            <DialogTitle>Reglamento Interno de Personal - AGBC</DialogTitle>
            <DialogDescription>Normativa institucional de lectura obligatoria de la Agencia Boliviana de Correos</DialogDescription>
          </DialogHeader>

          {/* Banner de Cabecera Oficial Amplio */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-5 sm:p-7 text-white">
            <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-500/25 px-3 py-0.5 text-[11px] font-black text-red-200 border border-red-400/50">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                    Lectura Obligatoria • Documento Oficial Institucional
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white leading-snug">
                    Reglamento Interno de Personal (AGBC-SAP-GRH-RE-001)
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-[#FFCC00]" />
                    <span>Agencia Boliviana de Correos &ldquo;Correos de Bolivia&rdquo;</span>
                  </p>
                </div>
              </div>

              {/* Botón de Descarga Directa */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={PDF_URL}
                  download="Reglamento_Interno_de_Personal_AGBC.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-4 py-2 text-xs font-bold text-white border border-white/20 transition-colors shadow-xs"
                >
                  <Download className="h-4 w-4 text-[#FFCC00]" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            </div>
          </div>

          {/* Cuerpo del Visualizador Adaptado de PDF */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {/* Visualizador de PDF Integrado */}
            <div className="relative w-full h-[46vh] sm:h-[52vh] rounded-2xl overflow-hidden border-2 border-[#002F6C]/15 bg-slate-100 shadow-inner">
              <iframe
                src={`${PDF_URL}#toolbar=1&navpanes=0&scrollbar=1`}
                title="Reglamento Interno de Personal AGBC"
                className="w-full h-full border-0"
              />
            </div>

            {/* Checkbox Obligatorio de Confirmación */}
            <div className="rounded-2xl border-2 border-[#002F6C]/20 bg-blue-50/50 p-4 transition-all hover:bg-blue-50/80">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceptado}
                  onChange={(e) => setAceptado(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded-lg border-2 border-[#002F6C] text-[#002F6C] focus:ring-[#002F6C] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-black text-[#002F6C] leading-snug">
                  He revisado atentamente el Reglamento Interno de Personal de la Agencia Boliviana de Correos, comprendo las disposiciones normativas y me comprometo a cumplir estrictamente sus directrices.
                </span>
              </label>
            </div>

            {/* Botón de Confirmación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
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
    </>
  )
}
