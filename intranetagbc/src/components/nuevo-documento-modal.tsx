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
  FileText,
  Sparkles,
  Download,
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
  X,
} from "lucide-react"
import { getDocumentUrl } from "@/components/modules/documentos-module"

interface DocItem {
  id: string
  titulo: string
  categoria?: string | null
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
  const [nuevoDoc, setNuevoDoc] = useState<DocItem | null>(null)
  const [diasRestantes, setDiasRestantes] = useState<number>(5)

  useEffect(() => {
    if (!documentos || documentos.length === 0) return

    // 1. Filtrar documentos publicados ordenados por fecha de creación descendente
    const publicados = documentos
      .filter((d) => d.estado === "publicado" && d.createdAt && d.archivo)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())

    if (publicados.length === 0) return

    const ultimoDoc = publicados[0]
    const fechaCreacion = new Date(ultimoDoc.createdAt!)
    const diffMs = Date.now() - fechaCreacion.getTime()
    const diffDias = diffMs / (1000 * 60 * 60 * 24)

    // 2. Comprobar si fue publicado dentro de los últimos 5 días
    if (diffDias <= 5) {
      setNuevoDoc(ultimoDoc)
      setDiasRestantes(Math.max(1, Math.ceil(5 - diffDias)))

      // Desplegar suavemente al entrar o recargar la página (retardo de 800ms)
      const timer = setTimeout(() => {
        setOpen(true)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [documentos, usuarioId])

  const handleCerrar = () => {
    setOpen(false)
  }

  const handleIrADocumentos = () => {
    setOpen(false)
    const el = document.getElementById("documentos")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (!nuevoDoc) return null

  const fileUrl = getDocumentUrl(nuevoDoc.archivo || null)
  const isPdf =
    nuevoDoc.tipoArchivo?.includes("pdf") ||
    nuevoDoc.archivo?.toLowerCase().endsWith(".pdf") ||
    nuevoDoc.nombreArchivo?.toLowerCase().endsWith(".pdf")

  const fechaFormateada = nuevoDoc.createdAt
    ? new Date(nuevoDoc.createdAt).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Reciente"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl lg:max-w-6xl w-[96vw] max-h-[94vh] flex flex-col p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white select-none overflow-hidden"
      >
        {/* Accesibilidad Radix UI */}
        <DialogHeader className="sr-only">
          <DialogTitle>Nuevo Documento Publicado - {nuevoDoc.titulo}</DialogTitle>
          <DialogDescription>Aviso institucional de nuevo documento emitido en la AGBC</DialogDescription>
        </DialogHeader>

        {/* Banner Superior Destacado */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-5 sm:p-7 text-white">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white">
                <Sparkles className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00]/20 px-3 py-0.5 text-[11px] font-black text-[#FFCC00] border border-[#FFCC00]/40 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-[#FFCC00] animate-ping" />
                    Nuevo Documento Publicado
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-100 border border-white/15">
                    <Clock className="h-3 w-3 text-[#FFCC00]" />
                    Aviso activo por {diasRestantes} {diasRestantes === 1 ? "día más" : "días más"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white leading-snug line-clamp-2">
                  {nuevoDoc.titulo}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-[#FFCC00]" />
                    Agencia Boliviana de Correos
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-[#FFCC00]" />
                    {fechaFormateada}
                  </span>
                  {nuevoDoc.categoria && (
                    <>
                      <span>•</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                        {nuevoDoc.categoria}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Descarga Directa & Cerrar */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {nuevoDoc.archivo && (
                <a
                  href={fileUrl}
                  download={nuevoDoc.nombreArchivo || nuevoDoc.titulo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-2 text-xs font-bold text-white border border-white/20 transition-colors shadow-xs"
                >
                  <Download className="h-4 w-4 text-[#FFCC00]" />
                  <span>Descargar</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCerrar}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Visualizador Adaptado de Documento */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
          {nuevoDoc.descripcion && (
            <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-200/80 text-xs text-[#002F6C] font-medium">
              <p className="font-bold text-[11px] uppercase tracking-wider text-[#0E5296] mb-0.5">Descripción Oficial:</p>
              <p>{nuevoDoc.descripcion}</p>
            </div>
          )}

          {/* Visor PDF / Archivo */}
          <div className="relative w-full flex-1 min-h-[44vh] sm:min-h-[50vh] rounded-2xl overflow-hidden border-2 border-[#002F6C]/15 bg-slate-100 shadow-inner">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={nuevoDoc.titulo}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <FileText className="h-14 w-14 text-[#0E5296]/40" />
                <p className="font-black text-sm text-[#002F6C]">{nuevoDoc.titulo}</p>
                <p className="text-xs text-slate-500 max-w-md">
                  Este documento está disponible para descarga oficial en formato {nuevoDoc.tipoArchivo || "institucional"}.
                </p>
                {nuevoDoc.archivo && (
                  <a href={fileUrl} download={nuevoDoc.nombreArchivo || nuevoDoc.titulo}>
                    <Button size="sm" className="rounded-xl bg-[#002F6C] text-white font-bold text-xs gap-1.5">
                      <Download className="h-3.5 w-3.5 text-[#FFCC00]" />
                      Descargar archivo adjunto
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-200/80">
            <p className="text-[11px] text-slate-500 text-center sm:text-left">
              * Este documento se encuentra archivado en la Biblioteca Digital Oficial.
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleIrADocumentos}
                className="w-full sm:w-auto rounded-xl text-xs font-bold text-[#002F6C] border-slate-300 hover:bg-slate-100 gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Ver en Biblioteca Digital</span>
              </Button>

              <Button
                type="button"
                onClick={handleCerrar}
                className="w-full sm:w-auto rounded-xl bg-[#002F6C] hover:bg-[#0E5296] font-black text-xs text-white px-6 shadow-md shadow-[#002F6C]/20 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4 text-[#FFCC00]" />
                <span>Entendido / Cerrar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
