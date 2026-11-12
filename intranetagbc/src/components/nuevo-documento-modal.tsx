"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Sparkles,
  Download,
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
} from "lucide-react"
import { getDocumentUrl } from "@/components/modules/documentos-module"

interface DocItem {
  id: string
  titulo: string
  categoria?: string | null
  direccion?: string | null
  subcategoria?: string | null
  tipoDocumental?: string | null
  estado: string
  archivo?: string | null
  nombreArchivo?: string | null
  tipoArchivo?: string | null
  tamano?: string | null
  descripcion?: string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}

interface Props {
  documentos: DocItem[]
  usuarioId?: string | null
}

export function NuevoDocumentoModal({ documentos, usuarioId }: Props) {
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]))
  const [countdown, setCountdown] = useState<number>(5)

  // 1. Filtrar documentos publicados recientes (últimos 5 días)
  const docsNuevos = useMemo(() => {
    if (!documentos || documentos.length === 0) return []

    const ahora = Date.now()
    const CINCO_DIAS_MS = 5 * 24 * 60 * 60 * 1000

    return documentos
      .filter((d) => {
        if (d.estado !== "publicado" || !d.archivo) return false
        // Excluir la versión accidental de RE-SOA si existiera en memoria
        if (d.titulo?.toLowerCase().includes("re-soa") && d.titulo?.toLowerCase().includes("v2")) {
          return false
        }
        if (!d.createdAt) return false
        const t = new Date(d.createdAt).getTime()
        return ahora - t <= CINCO_DIAS_MS
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
  }, [documentos])

  // 2. Control de frecuencia: Solo una vez al día por usuario/navegador
  useEffect(() => {
    if (docsNuevos.length === 0) return

    try {
      const hoy = new Date().toISOString().slice(0, 10)
      const storageKey = usuarioId ? `agbc_modal_docs_${usuarioId}` : "agbc_modal_docs_visto"
      const vistoHoy = localStorage.getItem(storageKey)

      if (vistoHoy === hoy) {
        return // Ya lo vio hoy
      }

      // Desplegar suavemente con retardo de 800ms
      const timer = setTimeout(() => {
        setOpen(true)
        setCurrentIndex(0)
        setVisitedIndices(new Set([0]))
        setCountdown(5)
      }, 800)

      return () => clearTimeout(timer)
    } catch {
      // fallback si localStorage no está disponible
      setOpen(true)
    }
  }, [docsNuevos, usuarioId])

  // 3. Temporizador de 5 segundos si hay exactamente 1 documento
  useEffect(() => {
    if (!open || docsNuevos.length !== 1) return

    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, docsNuevos.length])

  // Actualizar conjunto de índices visitados al cambiar de documento
  useEffect(() => {
    setVisitedIndices((prev) => {
      const next = new Set(prev)
      next.add(currentIndex)
      return next
    })
  }, [currentIndex])

  const total = docsNuevos.length
  const currentDoc = docsNuevos[currentIndex]

  // Condición de cierre:
  // - Si es 1 solo doc: habilitado cuando el countdown llega a 0
  // - Si son varios docs: habilitado cuando llega al último documento o vio todos
  const canClose = total === 1 ? countdown === 0 : currentIndex === total - 1 || visitedIndices.size >= total

  const handleCerrar = () => {
    if (!canClose) return
    try {
      const hoy = new Date().toISOString().slice(0, 10)
      const storageKey = usuarioId ? `agbc_modal_docs_${usuarioId}` : "agbc_modal_docs_visto"
      localStorage.setItem(storageKey, hoy)
    } catch {}
    setOpen(false)
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleIrADocumentos = () => {
    handleCerrar()
    const el = document.getElementById("documentos")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (total === 0 || !currentDoc) return null

  const fileUrl = getDocumentUrl(currentDoc.archivo || null)
  const isPdf =
    currentDoc.tipoArchivo?.includes("pdf") ||
    currentDoc.archivo?.toLowerCase().endsWith(".pdf") ||
    currentDoc.nombreArchivo?.toLowerCase().endsWith(".pdf")

  const diffMs = currentDoc.createdAt ? Date.now() - new Date(currentDoc.createdAt).getTime() : 0
  const diasRestantes = Math.max(1, Math.ceil(5 - diffMs / (1000 * 60 * 60 * 24)))

  const fechaFormateada = currentDoc.createdAt
    ? new Date(currentDoc.createdAt).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Reciente"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && canClose) handleCerrar() }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl lg:max-w-6xl w-[96vw] h-[92vh] max-h-[92vh] flex flex-col p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white select-none overflow-hidden"
      >
        {/* Accesibilidad Radix UI */}
        <DialogHeader className="sr-only">
          <DialogTitle>Nuevo Documento Publicado - {currentDoc.titulo}</DialogTitle>
          <DialogDescription>Aviso institucional de nuevo documento emitido en la AGBC</DialogDescription>
        </DialogHeader>

        {/* Banner Superior Destacado Institucional */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-4 sm:p-5 text-white">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00]/20 px-3 py-0.5 text-[11px] font-black text-[#FFCC00] border border-[#FFCC00]/40 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-[#FFCC00] animate-ping" />
                    Nuevo Documento Publicado
                  </span>
                  {total > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black text-white border border-white/25">
                      <Layers className="h-3 w-3 text-[#FFCC00]" />
                      Documento {currentIndex + 1} de {total}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-100 border border-white/15">
                    <Clock className="h-3 w-3 text-[#FFCC00]" />
                    Aviso activo por {diasRestantes} {diasRestantes === 1 ? "día más" : "días más"}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-snug truncate">
                  {currentDoc.titulo}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-[#FFCC00]" />
                    {currentDoc.direccion ? currentDoc.direccion.replace("Dirección ", "") : "Agencia Boliviana de Correos"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-[#FFCC00]" />
                    {fechaFormateada}
                  </span>
                  {(currentDoc.subcategoria || currentDoc.categoria) && (
                    <>
                      <span>•</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                        {currentDoc.subcategoria || currentDoc.categoria}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Controles de Navegación, Descarga & Cerrar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Controles Carrusel si hay más de 1 documento */}
              {total > 1 && (
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Documento anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-black text-[#FFCC00]">
                    {currentIndex + 1}/{total}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === total - 1}
                    className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Siguiente documento"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {currentDoc.archivo && (
                <a
                  href={fileUrl}
                  download={currentDoc.nombreArchivo || currentDoc.titulo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white border border-white/20 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#FFCC00]" />
                  <span>Descargar</span>
                </a>
              )}

              {/* Botón Cerrar (X) con validación obligatoria */}
              <button
                type="button"
                onClick={handleCerrar}
                disabled={!canClose}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  canClose
                    ? "bg-white/20 hover:bg-white/30 text-white border-white/40 cursor-pointer shadow-sm hover:scale-105"
                    : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                }`}
                title={
                  canClose
                    ? "Cerrar ventana"
                    : total === 1
                    ? `Espere ${countdown}s para cerrar`
                    : "Avance hasta el último documento para cerrar"
                }
              >
                {total === 1 && !canClose ? (
                  <span className="font-mono text-xs font-black text-[#FFCC00]">{countdown}</span>
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cuerpo del Visualizador: 100% Adaptado y sin cortes */}
        <div className="relative flex-1 min-h-0 w-full p-3 sm:p-4 bg-slate-100 flex flex-col overflow-hidden">
          {/* Contenedor responsivo del PDF o archivo */}
          <div className="relative flex-1 w-full rounded-2xl overflow-hidden border-2 border-[#002F6C]/15 bg-white shadow-inner">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                title={currentDoc.titulo}
                className="absolute inset-0 w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white">
                <FileText className="h-16 w-16 text-[#0E5296]/50" />
                <p className="font-black text-base text-[#002F6C] max-w-lg">{currentDoc.titulo}</p>
                <p className="text-xs text-slate-500 max-w-md">
                  Este documento institucional está disponible para descarga oficial en formato {currentDoc.tipoArchivo || "institucional"}.
                </p>
                {currentDoc.archivo && (
                  <a href={fileUrl} download={currentDoc.nombreArchivo || currentDoc.titulo}>
                    <Button size="sm" className="rounded-xl bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold text-xs gap-1.5 shadow-md">
                      <Download className="h-3.5 w-3.5 text-[#FFCC00]" />
                      Descargar archivo adjunto
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Flechas flotantes en los laterales si hay más de 1 documento */}
            {total > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#002F6C]/80 hover:bg-[#002F6C] text-white shadow-xl backdrop-blur-sm border border-white/20 transition-all hover:scale-110 cursor-pointer"
                    title="Documento anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {currentIndex < total - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#002F6C]/80 hover:bg-[#002F6C] text-white shadow-xl backdrop-blur-sm border border-white/20 transition-all hover:scale-110 cursor-pointer"
                    title="Siguiente documento"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer de Acciones y Estado de Navegación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
              {total > 1 ? (
                <span>
                  Viendo documento <strong className="text-[#002F6C]">{currentIndex + 1}</strong> de{" "}
                  <strong className="text-[#002F6C]">{total}</strong>
                  {!canClose && (
                    <span className="ml-2 text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                      (Navegue hasta el último documento para cerrar)
                    </span>
                  )}
                </span>
              ) : !canClose ? (
                <span className="text-amber-700 font-bold bg-amber-100 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  El botón de cierre se habilitará en {countdown} segundos...
                </span>
              ) : (
                <span className="text-slate-500">Documento verificado en la Biblioteca Digital Oficial.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleIrADocumentos}
                className="rounded-xl text-xs font-bold text-[#002F6C] border-slate-300 hover:bg-slate-200/60 gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ver en Catálogo</span>
              </Button>

              <Button
                type="button"
                onClick={handleCerrar}
                disabled={!canClose}
                className={`rounded-xl font-black text-xs text-white px-5 shadow-md gap-1.5 transition-all ${
                  canClose
                    ? "bg-[#002F6C] hover:bg-[#0E5296] shadow-[#002F6C]/25 cursor-pointer hover:scale-102"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-[#FFCC00]" />
                <span>
                  {canClose
                    ? "Entendido / Cerrar"
                    : total === 1
                    ? `Cerrar (${countdown}s)`
                    : "Vea el último para cerrar"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
