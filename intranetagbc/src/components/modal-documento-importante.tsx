"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { confirmarLecturaDocumento } from "@/actions/documentos"
import { getDocumentUrl } from "@/components/modules/documentos-module"

export interface DocumentoImportanteItem {
  id: string
  titulo: string
  categoria?: string | null
  autor?: string
  direccionEmisora?: string | null
  esImportante?: boolean
  requiereLectura?: boolean
  archivo?: string | null
  nombreArchivo?: string | null
  tipoArchivo?: string | null
  tamano?: string | null
  descripcion?: string | null
  createdAt: Date | string
}

interface Props {
  documentosIniciales: DocumentoImportanteItem[]
}

export function ModalDocumentoImportante({ documentosIniciales }: Props) {
  const [docs, setDocs] = useState<DocumentoImportanteItem[]>(documentosIniciales)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [open, setOpen] = useState(documentosIniciales.length > 0)
  const [secondsRemaining, setSecondsRemaining] = useState(8)
  const [declaredKnowledge, setDeclaredKnowledge] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  const currentDoc = docs[currentIndex]

  // Cuenta regresiva de lectura atenta obligatoria
  useEffect(() => {
    if (!open || !currentDoc) return
    setSecondsRemaining(8)
    setDeclaredKnowledge(false)
    setShowPdfViewer(false)

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [open, currentIndex, currentDoc])

  if (!currentDoc || docs.length === 0) {
    return null
  }

  const fileUrl = currentDoc.archivo ? getDocumentUrl(currentDoc.archivo) : ""
  const isPdf = (currentDoc.tipoArchivo || "").toLowerCase().includes("pdf") || (currentDoc.archivo || "").toLowerCase().endsWith(".pdf")

  const handleConfirmar = () => {
    startTransition(async () => {
      try {
        await confirmarLecturaDocumento(currentDoc.id, 8 - secondsRemaining)
        toast.success("Lectura y toma de conocimiento registrada en el sistema")

        if (currentIndex < docs.length - 1) {
          setCurrentIndex((prev) => prev + 1)
        } else {
          setOpen(false)
          setDocs([])
        }
      } catch (err: any) {
        toast.error(err.message || "Error al registrar confirmación")
      }
    })
  }

  const canConfirm = secondsRemaining === 0 || declaredKnowledge

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && canConfirm) {
        setOpen(false)
      } else if (!v) {
        toast.error("Este documento oficial requiere confirmación de lectura antes de continuar")
      }
    }}>
      <DialogContent className="max-w-4xl sm:max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-2 border-[#002F6C]/25 shadow-2xl bg-white">
        {/* Accesibilidad Radix UI Dialog Header */}
        <DialogHeader className="sr-only">
          <DialogTitle>Documento Institucional Obligatorio - {currentDoc.titulo}</DialogTitle>
          <DialogDescription>
            Notificación obligatoria y toma de conocimiento de documentos, instructivos y resoluciones de la Agencia Boliviana de Correos.
          </DialogDescription>
        </DialogHeader>

        {/* Barra superior de acento rojo institucional / advertencia */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-[#FFB800] to-[#002F6C]" />

        {/* Encabezado Principal */}
        <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 sm:p-7 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-[#FFCC00] animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-[#FFCC00]">
                Instructivo / Documento de Cumplimiento Institucional
              </span>
            </div>
            {docs.length > 1 && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                Documento {currentIndex + 1} de {docs.length}
              </span>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFB800]/20 px-3.5 py-1 text-xs font-black text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span>{currentDoc.direccionEmisora || "Dirección General Ejecutiva"}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {currentDoc.titulo}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/90 font-medium">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#FFCC00]" />
                <span>Categoría: <strong>{currentDoc.categoria || "Normativas & Circulares"}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FFCC00]" />
                <span>Emitido por: <strong>{currentDoc.autor || "AGBC"}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Contenido del Documento */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Descripción / Resumen */}
          {currentDoc.descripcion && (
            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200/80 space-y-2 shadow-2xs">
              <p className="text-xs font-black uppercase tracking-wider text-[#002F6C]">
                Alcance y Resumen Ejecutivo:
              </p>
              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {currentDoc.descripcion}
              </p>
            </div>
          )}

          {/* Caja del Archivo Adjunto y Botones de Revisión */}
          {currentDoc.archivo && (
            <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#002F6C] text-[#FFCC00] shadow-md">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#002F6C] truncate">
                    {currentDoc.nombreArchivo || "Documento Adjunto Oficial"}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentDoc.tamano || "Archivo oficial"} • Formato {currentDoc.tipoArchivo?.toUpperCase() || "PDF"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {isPdf && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPdfViewer(!showPdfViewer)}
                    className="flex-1 sm:flex-none rounded-xl text-xs font-bold text-[#002F6C] border-slate-300 hover:bg-white h-10 px-4"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    {showPdfViewer ? "Ocultar Visor" : "Ver en Pantalla"}
                  </Button>
                )}
                <Button
                  type="button"
                  asChild
                  className="flex-1 sm:flex-none rounded-xl bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold text-xs h-10 px-4 shadow-sm"
                >
                  <a href={`${fileUrl}?download=1`} download={currentDoc.nombreArchivo ?? "documento.pdf"}>
                    <Download className="h-4 w-4 mr-1.5 text-[#FFCC00]" />
                    Descargar Archivo
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Visor PDF Desplegable */}
          {showPdfViewer && fileUrl && (
            <div className="rounded-2xl border-2 border-[#002F6C]/20 overflow-hidden shadow-lg h-[450px]">
              <iframe src={fileUrl} className="w-full h-full border-0" title={currentDoc.titulo} />
            </div>
          )}

          {/* Técnica de Lectura Garantizada (Temporizador + Declaración de Conocimiento) */}
          <div className="rounded-2xl bg-amber-50/80 p-5 border-2 border-amber-200/90 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-900">
                  Toma de Conocimiento Obligatoria
                </p>
                <p className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
                  Para fines administrativos y normativos de la Agencia Boliviana de Correos, al hacer click en confirmar se registrará tu nombre, fecha y hora de lectura de este documento en la base de datos institucional.
                </p>
              </div>
            </div>

            {/* Temporizador regresivo o barra de lectura */}
            {secondsRemaining > 0 ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Tiempo mínimo de lectura requerido:
                  </span>
                  <span>{secondsRemaining} segundos</span>
                </div>
                <div className="h-2 w-full bg-amber-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${((8 - secondsRemaining) / 8) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-amber-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declaredKnowledge}
                  onChange={(e) => setDeclaredKnowledge(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-400 text-[#002F6C] focus:ring-[#002F6C]"
                />
                <span className="text-xs font-black text-[#002F6C]">
                  He leído detenidamente y tomo conocimiento de las directrices de este documento.
                </span>
              </label>
            )}
          </div>

          {/* Botón de Confirmación Principal */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              disabled={!canConfirm || isPending}
              onClick={handleConfirmar}
              className={`w-full sm:w-auto h-12 px-8 rounded-2xl font-black text-sm transition-all shadow-lg gap-2 cursor-pointer ${
                canConfirm
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 scale-[1.01]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registrando confirmación...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-[#FFCC00]" />
                  <span>Confirmar Lectura & Toma de Conocimiento</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
