"use client"

import {
  XIcon,
  DownloadIcon,
  CalendarIcon,
  FileTextIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import type { Comunicado } from "@/hooks/use-comunicados"

interface ComunicadoViewProps {
  open: boolean
  onClose: () => void
  comunicado: Comunicado | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-BO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ComunicadoView({ open, onClose, comunicado }: ComunicadoViewProps) {
  if (!comunicado) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
        {/* Top color bars like the Correos de Bolivia style */}
        <div className="flex h-2 w-full rounded-t-2xl overflow-hidden">
          <div className="flex-1 bg-[#C41E3A]" />
          <div className="flex-1 bg-[#FFB300]" />
          <div className="flex-1 bg-[#2E7D32]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <img
              src="/image/logo_dark.webp"
              alt="AGBC"
              className="h-10 object-contain dark:hidden"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <img
              src="/image/logo_light.webp"
              alt="AGBC"
              className="h-10 object-contain hidden dark:block"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFB300]">Correos de Bolivia</p>
            <p className="text-[10px] text-muted-foreground">Agencia Boliviana de Correos</p>
          </div>
        </div>

        <div className="px-8 pb-8 pt-2">
          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB300] mb-2">
              Comunicado
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
              {comunicado.titulo}
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FF8800]" />
          </div>

          {/* Date + badges */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(comunicado.fecha)}</span>
            </div>
            <StatusBadge status={comunicado.prioridad} />
            <StatusBadge status={comunicado.estado} />
          </div>

          {/* Content */}
          <div className="rounded-xl bg-muted/20 border border-border/30 p-6 mb-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {comunicado.contenido}
            </p>
          </div>

          {/* Attached file */}
          {comunicado.archivoData && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Archivo adjunto
              </p>
              {comunicado.archivoTipo === "imagen" ? (
                <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/10 flex items-center justify-center p-4">
                  <img
                    src={comunicado.archivoData}
                    alt={comunicado.archivoNombre ?? "Imagen adjunta"}
                    className="max-h-[400px] rounded-lg object-contain shadow-lg"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/10">
                  <iframe
                    src={comunicado.archivoData}
                    title={comunicado.archivoNombre ?? "Documento PDF"}
                    className="w-full border-0 rounded-xl"
                    style={{ height: "500px" }}
                  />
                  <div className="flex items-center justify-between gap-4 p-4 border-t border-border/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                        <FileTextIcon className="h-5 w-5 text-red-500" />
                      </div>
                      <p className="font-semibold text-sm truncate">{comunicado.archivoNombre}</p>
                    </div>
                    <a
                      href={comunicado.archivoData}
                      download={comunicado.archivoNombre ?? "documento.pdf"}
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <DownloadIcon className="mr-1 h-4 w-4" />
                        Descargar
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center border-t border-border/30 pt-5">
            <p className="text-xs text-muted-foreground">
              Agradecemos de antemano su participación.
            </p>
            <p className="mt-2 text-sm font-bold tracking-wide">CORREOS DE BOLIVIA</p>
            <div className="mx-auto mt-1 h-0.5 w-12 bg-[#FFB300]" />
            <p className="mt-2 text-[10px] text-muted-foreground">www.correos.gob.bo</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
