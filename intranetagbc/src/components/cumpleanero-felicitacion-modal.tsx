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
  Sparkles,
  Cake,
  Heart,
  Gift,
  PartyPopper,
  X,
  Award,
  Building2,
  CheckCircle2,
} from "lucide-react"
import confetti from "canvas-confetti"

interface CumpleaneroFelicitacionModalProps {
  usuarioNombre: string
  usuarioCargo?: string
  esCumpleanos?: boolean
  forzarApertura?: boolean
  onClose?: () => void
  onVerCumpleaneros?: () => void
}

export function CumpleaneroFelicitacionModal({
  usuarioNombre,
  usuarioCargo = "Funcionario Institucional",
  esCumpleanos = false,
  forzarApertura = false,
  onClose,
  onVerCumpleaneros,
}: CumpleaneroFelicitacionModalProps) {
  const [open, setOpen] = useState(false)
  const [agradecido, setAgradecido] = useState(false)

  const dispararConfeti = () => {
    // Ráfaga de confeti festivo
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#002F6C", "#FFCC00", "#FF6B6B", "#4ECDC4"],
    })
    fire(0.2, {
      spread: 60,
      colors: ["#FFCC00", "#0E5296", "#FFD93D"],
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  useEffect(() => {
    if (forzarApertura) {
      setOpen(true)
      setAgradecido(false)
      setTimeout(dispararConfeti, 300)
      return
    }

    if (esCumpleanos) {
      const hoyKey = `agbc_cumple_${new Date().toISOString().split("T")[0]}`
      const yaVistoHoy = sessionStorage.getItem(hoyKey)

      if (!yaVistoHoy) {
        const timer = setTimeout(() => {
          setOpen(true)
          setAgradecido(false)
          setTimeout(dispararConfeti, 400)
          sessionStorage.setItem(hoyKey, "1")
        }, 1200)
        return () => clearTimeout(timer)
      }
    }
  }, [esCumpleanos, forzarApertura])

  const handleCerrar = () => {
    setOpen(false)
    if (onClose) onClose()
  }

  const handleAgradecer = () => {
    setAgradecido(true)
    dispararConfeti()
    setTimeout(() => {
      handleCerrar()
      if (onVerCumpleaneros) {
        onVerCumpleaneros()
      }
    }, 1800)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleCerrar()}>
      <DialogContent className="max-w-xl w-[94vw] p-0 rounded-3xl border-2 border-[#FFCC00]/60 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
        <DialogHeader className="sr-only">
          <DialogTitle>¡Feliz Cumpleaños {usuarioNombre}!</DialogTitle>
          <DialogDescription>Carta oficial de felicitaciones de la Agencia Boliviana de Correos</DialogDescription>
        </DialogHeader>

        {/* Cabecera Festiva con Gradiente Institucional & Destellos */}
        <div className="relative bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white text-center overflow-hidden">
          {/* Destellos de fondo */}
          <div className="absolute inset-0 bg-[radial-gradient(#FFCC00_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[#FFCC00]/30 blur-2xl" />
          <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#FFB800]/30 blur-2xl" />

          {/* Emblema Central de Cumpleaños */}
          <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFCC00] to-[#FF9E00] text-[#002F6C] shadow-lg shadow-[#FFCC00]/30 animate-bounce duration-1000">
            <Cake className="h-9 w-9" />
          </div>

          <div className="relative space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFCC00] text-[#002F6C] uppercase tracking-wider shadow-xs">
              <PartyPopper className="h-3.5 w-3.5" />
              ¡Hoy es tu Día Especial!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              ¡Feliz Cumpleaños!
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Agencia Boliviana de Correos • Familia Postal
            </p>
          </div>
        </div>

        {/* Cuerpo: Carta Formal de Felicitación con Sello Oficial */}
        <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-amber-50/30 via-white to-slate-50/50">
          {/* Tarjeta Tipo Pergamino Ejecutivo */}
          <div className="relative rounded-2xl border border-[#FFCC00]/40 bg-white/90 p-6 shadow-sm space-y-4">
            {/* Sello de agua sutil */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#002F6C]" />
                <span className="text-xs font-black uppercase text-[#002F6C] tracking-wider">
                  Dirección General Ejecutiva AGBC
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Homenaje Oficial
              </span>
            </div>

            {/* Saludo Personalizado */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase">Dedicado con aprecio a:</p>
              <h3 className="text-lg sm:text-xl font-black text-[#002F6C]">
                {usuarioNombre}
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                {usuarioCargo}
              </p>
            </div>

            {/* Mensaje Caluroso de Felicitación */}
            <p className="text-sm leading-relaxed text-slate-700 font-normal">
              En nombre de toda la familia de la <strong className="text-[#002F6C]">Agencia Boliviana de Correos</strong>, te hacemos llegar nuestras más sinceras y afectuosas felicitaciones en este día especial. Agradecemos tu valioso compromiso y dedicación diaria para conectar a toda Bolivia.
            </p>

            <p className="text-sm leading-relaxed text-slate-700 font-normal">
              Que este nuevo año de vida esté lleno de salud, bienestar, éxitos personales y profesionales junto a tus seres queridos.
            </p>

            {/* Firma Institucional */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#002F6C]">Equipo Directivo & Talento Humano</p>
                <p className="text-[10px] text-slate-400">Correos de Bolivia • Intranet Institucional</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-300 text-amber-800">
                <Gift className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Botonera de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCerrar}
                className="rounded-xl text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </Button>

              {onVerCumpleaneros && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleCerrar()
                    onVerCumpleaneros()
                  }}
                  className="rounded-xl text-xs font-bold text-[#002F6C] border-[#002F6C]/30 hover:bg-blue-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Cake className="h-3.5 w-3.5 text-amber-500" />
                  Ver Cumpleañeros AGBC
                </Button>
              )}
            </div>

            <Button
              type="button"
              onClick={handleAgradecer}
              disabled={agradecido}
              className="w-full sm:w-auto bg-[#002F6C] hover:bg-[#0E5296] text-white rounded-xl text-xs font-black gap-2 shadow-md shadow-[#002F6C]/20 cursor-pointer px-6"
            >
              {agradecido ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ¡Gracias por ser parte de la AGBC!
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 text-[#FFCC00] fill-[#FFCC00]" />
                  ¡Muchas Gracias! (Celebrar)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
