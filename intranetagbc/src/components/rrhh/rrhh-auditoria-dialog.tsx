"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserX,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Sparkles,
  Eye,
  Loader2,
  X,
  UserCheck,
} from "lucide-react"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  obtenerAuditoriaLecturaYAccesos,
  reiniciarLecturaUsuarioAction,
  type AuditoriaFuncionarioAcceso,
} from "@/actions/rrhh"

interface Props {
  open: boolean
  onClose: () => void
}

export function RrhhAuditoriaDialog({ open, onClose }: Props) {
  const [data, setData] = useState<AuditoriaFuncionarioAcceso[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState<"todos" | "confirmados" | "pendientes" | "sin_ingreso">("todos")
  const [isPending, startTransition] = useTransition()
  const [resumen, setResumen] = useState({
    total: 0,
    lecturaConfirmada: 0,
    lecturaPendiente: 0,
    conIngreso: 0,
    sinIngreso: 0,
  })

  const cargarDatos = () => {
    setLoading(true)
    obtenerAuditoriaLecturaYAccesos()
      .then((res) => {
        if (res.success) {
          setData(res.data)
          setResumen(res.resumen)
        } else {
          toast.error("No se pudo cargar la auditoría de accesos")
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open) {
      cargarDatos()
    }
  }, [open])

  const handleReiniciarLectura = (usuarioId: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de reiniciar el requisito de lectura para ${nombre}? Se le volverá a solicitar la lectura en su próximo ingreso.`)) {
      return
    }

    startTransition(async () => {
      const res = await reiniciarLecturaUsuarioAction(usuarioId)
      if (res.success) {
        toast.success(res.message || "Requisito reiniciado")
        cargarDatos()
      } else {
        toast.error(res.message || "Error al reiniciar requisito")
      }
    })
  }

  const exportarExcel = () => {
    try {
      const fechaHoy = new Date().toISOString().slice(0, 10)
      const rows = data.map((d) => [
        d.nombreCompleto,
        d.cargo,
        d.email,
        d.haLeidoDocumento ? "SÍ (CONFIRMADO)" : "NO (PENDIENTE)",
        d.fechaLecturaDocumento
          ? new Date(d.fechaLecturaDocumento).toLocaleString("es-BO")
          : "Sin registro",
        d.haIniciadoSesion ? "SÍ" : "NUNCA",
        d.primerIngreso ? new Date(d.primerIngreso).toLocaleString("es-BO") : "Sin registro",
        d.ultimaConexion ? new Date(d.ultimaConexion).toLocaleString("es-BO") : "Sin registro",
      ])

      const header = [
        "FUNCIONARIO",
        "CARGO",
        "CORREO INSTITUCIONAL",
        "CHECK LECTURA OBLIGATORIA",
        "FECHA CONFIRMACIÓN LECTURA",
        "INICIÓ SESIÓN",
        "PRIMER INGRESO AL SISTEMA",
        "ÚLTIMA CONEXIÓN",
      ]

      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = [
        { wch: 32 },
        { wch: 28 },
        { wch: 34 },
        { wch: 24 },
        { wch: 26 },
        { wch: 16 },
        { wch: 26 },
        { wch: 26 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Auditoría Lectura y Accesos")
      XLSX.writeFile(wb, `Auditoria_Lectura_Accesos_AGBC_${fechaHoy}.xlsx`)
      toast.success("Reporte de auditoría exportado a Excel")
    } catch {
      toast.error("Error al exportar reporte Excel")
    }
  }

  const filtrados = useMemo(() => {
    let list = data

    if (filtro === "confirmados") {
      list = list.filter((d) => d.haLeidoDocumento)
    } else if (filtro === "pendientes") {
      list = list.filter((d) => !d.haLeidoDocumento)
    } else if (filtro === "sin_ingreso") {
      list = list.filter((d) => !d.haIniciadoSesion)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.nombreCompleto.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.cargo.toLowerCase().includes(q)
      )
    }

    return list
  }, [data, filtro, search])

  const porcentajeLectura = resumen.total > 0
    ? Math.round((resumen.lecturaConfirmada / resumen.total) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl rounded-3xl border-2 border-[#002F6C]/20 bg-white p-6 sm:p-7 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFCC00] shadow-md shadow-[#002F6C]/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-[#002F6C] tracking-tight">
                  Auditoría de Lectura Obligatoria y Accesos al Sistema
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Seguimiento institucional de funcionarios que aceptaron el Reglamento Interno y su actividad
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                disabled={loading}
                className="rounded-xl text-xs font-bold gap-1.5 h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#0E5296] ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button
                size="sm"
                onClick={exportarExcel}
                className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white text-xs font-bold gap-1.5 h-9 shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#FFCC00]" />
                Descargar Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Padrón</span>
            <p className="text-2xl font-black text-[#002F6C]">{resumen.total}</p>
            <span className="text-[10px] text-slate-400 font-medium">Funcionarios registrados</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Lectura Confirmada
            </span>
            <p className="text-2xl font-black text-emerald-700">
              {resumen.lecturaConfirmada}{" "}
              <span className="text-xs font-bold text-emerald-600">({porcentajeLectura}%)</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Marcaron el check oficial</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Lectura Pendiente
            </span>
            <p className="text-2xl font-black text-amber-700">{resumen.lecturaPendiente}</p>
            <span className="text-[10px] text-amber-600 font-medium">Aún no han confirmado</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Actividad en Sistema
            </span>
            <p className="text-2xl font-black text-[#002F6C]">{resumen.conIngreso}</p>
            <span className="text-[10px] text-slate-400 font-medium">
              {resumen.sinIngreso} sin ingreso registrado
            </span>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setFiltro("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtro === "todos"
                  ? "bg-white text-[#002F6C] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Todos ({resumen.total})
            </button>
            <button
              onClick={() => setFiltro("confirmados")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtro === "confirmados"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-emerald-700"
              }`}
            >
              Confirmados ({resumen.lecturaConfirmada})
            </button>
            <button
              onClick={() => setFiltro("pendientes")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtro === "pendientes"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-amber-700"
              }`}
            >
              Pendientes ({resumen.lecturaPendiente})
            </button>
            <button
              onClick={() => setFiltro("sin_ingreso")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtro === "sin_ingreso"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sin Ingreso ({resumen.sinIngreso})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar funcionario..."
              className="pl-8.5 h-9 rounded-xl text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Tabla con Scroll Interno */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#0E5296]" />
              <span className="text-xs font-bold">Cargando registros de auditoría...</span>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs">
              No se encontraron funcionarios para este filtro.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-[#002F6C] font-black uppercase text-[10px] tracking-wider z-10">
                <tr>
                  <th className="py-3 px-4">Funcionario</th>
                  <th className="py-3 px-3">Check Lectura Obligatoria</th>
                  <th className="py-3 px-3">Primer Ingreso</th>
                  <th className="py-3 px-3">Última Conexión</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((item) => (
                  <tr key={item.usuarioId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Funcionario */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFCC00] font-black text-xs shadow-2xs">
                          {item.nombreCompleto.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#002F6C] truncate leading-tight">
                            {item.nombreCompleto}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate font-medium">
                            {item.cargo} • <span className="font-mono text-slate-400">{item.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Check de Lectura */}
                    <td className="py-2.5 px-3">
                      {item.haLeidoDocumento ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Confirmado</span>
                          {item.fechaLecturaDocumento && (
                            <span className="text-[10px] text-emerald-600/80 font-mono font-normal">
                              ({new Date(item.fechaLecturaDocumento).toLocaleDateString("es-BO")})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Pendiente de Lectura</span>
                        </div>
                      )}
                    </td>

                    {/* Primer Ingreso */}
                    <td className="py-2.5 px-3">
                      {item.haIniciadoSesion && item.primerIngreso ? (
                        <span className="font-medium text-slate-700 text-[11px]">
                          {new Date(item.primerIngreso).toLocaleDateString("es-BO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] italic">
                          Nunca ha ingresado
                        </span>
                      )}
                    </td>

                    {/* Última Conexión */}
                    <td className="py-2.5 px-3">
                      {item.ultimaConexion ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {new Date(item.ultimaConexion).toLocaleDateString("es-BO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.ultimaConexion).toLocaleTimeString("es-BO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] italic">
                          Sin conexión
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-2.5 px-4 text-right">
                      {item.haLeidoDocumento ? (
                        <button
                          type="button"
                          onClick={() => handleReiniciarLectura(item.usuarioId, item.nombreCompleto)}
                          disabled={isPending}
                          className="text-[10.5px] font-bold text-slate-500 hover:text-amber-700 hover:underline cursor-pointer disabled:opacity-50"
                          title="Volver a exigir lectura obligatoria en su próximo ingreso"
                        >
                          Reiniciar check
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-amber-600 font-bold">Obligatorio</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie de modal */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Mostrando {filtrados.length} de {data.length} funcionarios</span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
