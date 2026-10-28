"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  History,
  FileSpreadsheet,
  Calendar,
  User,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles,
  Undo2,
} from "lucide-react"
import {
  obtenerHistorialImportacionesAction,
  revertirImportacionAction,
  type RegistroHistorialImportacion,
} from "@/actions/catalogo-import"
import toast from "react-hot-toast"

interface Props {
  open: boolean
  onClose: () => void
}

export function HistorialImportacionesDialog({ open, onClose }: Props) {
  const [registros, setRegistros] = useState<RegistroHistorialImportacion[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      cargarHistorial()
    }
  }, [open])

  async function cargarHistorial() {
    setLoading(true)
    try {
      const data = await obtenerHistorialImportacionesAction()
      setRegistros(data)
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].id)
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar historial de importaciones")
    } finally {
      setLoading(false)
    }
  }

  async function handleRevertir(reg: RegistroHistorialImportacion) {
    const confirmar = window.confirm(
      `¿Desea deshacer y revertir la importación "${reg.nombreArchivo}"?\n\nEsta acción eliminará los documentos nuevos creados en esta importación y restaurará los valores previos de los documentos modificados.`
    )
    if (!confirmar) return

    setRevertingId(reg.id)
    try {
      const res = await revertirImportacionAction(reg.id)
      if (res.success) {
        toast.success(res.message || "Importación revertida con éxito")
        await cargarHistorial()
      } else {
        toast.error("No se pudo revertir la importación")
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al revertir la importación")
    } finally {
      setRevertingId(null)
    }
  }

  function formatFecha(date: Date | string) {
    const d = new Date(date)
    return d.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-[#002F6C]/20 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] shadow-md ring-2 ring-white/20">
                <History className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Historial de Sincronizaciones del Catálogo
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-[#FFCC00]">
                    Auditoría Oficial
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Registro detallado de cambios, documentos agregados, actualizados y modificaciones en la Intranet AGBC.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cargarHistorial}
              disabled={loading}
              className="text-xs text-white hover:bg-white/10 rounded-xl gap-1.5 cursor-pointer font-bold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-[#0E5296]" />
              <p className="text-xs font-bold text-slate-500">Cargando reportes históricos...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 p-8 shadow-xs">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Aún no se han registrado importaciones de catálogo
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando utilices el botón "Importar Catálogo" para subir un Excel con nuevos documentos o actualizaciones, los reportes de auditoría aparecerán listados aquí.
              </p>
            </div>
          ) : (
            registros.map((reg) => {
              const isExpanded = expandedId === reg.id
              const detallesArray = Array.isArray(reg.detalles) ? reg.detalles : []

              return (
                <div
                  key={reg.id}
                  className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
                >
                  {/* Resumen Header del Reporte */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#002F6C] dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          {reg.nombreArchivo}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatFecha(reg.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Ejecutado por: <strong>{reg.usuarioNombre || "Administrador"}</strong></span>
                      </div>
                    </div>

                    {/* KPI Badges */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                        Total: <strong>{reg.totalProcesados}</strong>
                      </div>

                      {reg.nuevos > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                          <PlusCircle className="h-3.5 w-3.5" />
                          +{reg.nuevos} Nuevos
                        </div>
                      )}

                      {reg.actualizados > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 text-xs font-bold flex items-center gap-1">
                          <RefreshCw className="h-3.5 w-3.5" />
                          {reg.actualizados} Modificados
                        </div>
                      )}

                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 text-xs font-bold">
                        {reg.sinCambios} Sin cambios
                      </div>

                      {reg.faltanArchivo > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {reg.faltanArchivo} Sin PDF
                        </div>
                      )}

                      {/* Botón / Estado de Reversión */}
                      {reg.revertido ? (
                        <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 text-xs font-bold flex items-center gap-1">
                          <Undo2 className="h-3.5 w-3.5" />
                          Revertido {reg.revertidoPor ? `(${reg.revertidoPor})` : ""}
                        </span>
                      ) : (reg.nuevos > 0 || reg.actualizados > 0) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={revertingId === reg.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRevertir(reg)
                          }}
                          className="h-8 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200 dark:border-rose-800 gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Deshacer los cambios de esta importación y restaurar el catálogo"
                        >
                          <Undo2 className={`h-3.5 w-3.5 ${revertingId === reg.id ? "animate-spin" : ""}`} />
                          <span>{revertingId === reg.id ? "Deshaciendo..." : "Deshacer cambios"}</span>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Detalle Desplegable con los cambios específicos */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-5 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Detalle de Cambios Aplicados en esta Sincronización:
                      </p>

                      {detallesArray.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>No hubo documentos modificados ni nuevos; todos los registros coincidieron exactamente con la base de datos institucional.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {detallesArray.map((det: any, idx: number) => {
                            const esNuevo = det.tipo === "nuevo"
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                  esNuevo
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        esNuevo
                                          ? "bg-emerald-600 text-white"
                                          : "bg-blue-600 text-white"
                                      }`}
                                    >
                                      {esNuevo ? "NUEVO" : "MODIFICADO"}
                                    </span>
                                    <p className="font-bold truncate">{det.titulo}</p>
                                  </div>

                                  {Array.isArray(det.diferencias) && det.diferencias.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {det.diferencias.map((d: string, dIdx: number) => (
                                        <span
                                          key={dIdx}
                                          className="text-[11px] font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300"
                                        >
                                          • {d}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl font-bold text-xs"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
