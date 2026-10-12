"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Loader2,
  LogIn,
  LogOut,
  Users,
  Activity,
  FileSpreadsheet,
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
  type RegistroAccesoDiario,
} from "@/actions/rrhh"

interface Props {
  open: boolean
  onClose: () => void
}

export function RrhhAuditoriaDialog({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"lectura" | "accesos">("lectura")
  const [dataLectura, setDataLectura] = useState<AuditoriaFuncionarioAcceso[]>([])
  const [dataAccesos, setDataAccesos] = useState<RegistroAccesoDiario[]>([])
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filtroLectura, setFiltroLectura] = useState<"todos" | "confirmados" | "pendientes" | "sin_ingreso">("todos")

  // Filtros de Accesos por Día
  const [diaFiltro, setDiaFiltro] = useState<string>("todos")
  const [filtroEstadoAcceso, setFiltroEstadoAcceso] = useState<"todos" | "activos" | "finalizados">("todos")

  const [isPending, startTransition] = useTransition()
  const [resumen, setResumen] = useState({
    total: 0,
    lecturaConfirmada: 0,
    lecturaPendiente: 0,
    conIngreso: 0,
    sinIngreso: 0,
    ingresosHoy: 0,
    sesionesActivasAhora: 0,
  })

  const cargarDatos = () => {
    setLoading(true)
    obtenerAuditoriaLecturaYAccesos()
      .then((res) => {
        if (res.success) {
          setDataLectura(res.data || [])
          setDataAccesos(res.dataAccesosDiarios || [])
          setDiasDisponibles(res.diasDisponibles || [])
          setResumen(res.resumen)
          // Si hay días disponibles y aún no se filtró, podemos sugerir el día más reciente
          if (res.diasDisponibles && res.diasDisponibles.length > 0 && diaFiltro === "") {
            setDiaFiltro(res.diasDisponibles[0])
          }
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

  // Filtrado de Lectura Obligatoria
  const filtradosLectura = useMemo(() => {
    let list = dataLectura

    if (filtroLectura === "confirmados") {
      list = list.filter((d) => d.haLeidoDocumento)
    } else if (filtroLectura === "pendientes") {
      list = list.filter((d) => !d.haLeidoDocumento)
    } else if (filtroLectura === "sin_ingreso") {
      list = list.filter((d) => !d.haIniciadoSesion)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.nombreCompleto.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.cargo.toLowerCase().includes(q) ||
          d.unidad.toLowerCase().includes(q)
      )
    }

    return list
  }, [dataLectura, filtroLectura, search])

  // Filtrado de Accesos Diarios
  const hoyStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date())
  }, [])

  const ayerStr = useMemo(() => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(ayer)
  }, [])

  const filtradosAccesos = useMemo(() => {
    let list = dataAccesos

    if (diaFiltro === "hoy") {
      list = list.filter((a) => a.fecha === hoyStr)
    } else if (diaFiltro === "ayer") {
      list = list.filter((a) => a.fecha === ayerStr)
    } else if (diaFiltro !== "todos" && diaFiltro) {
      list = list.filter((a) => a.fecha === diaFiltro)
    }

    if (filtroEstadoAcceso === "activos") {
      list = list.filter((a) => a.sesionActiva)
    } else if (filtroEstadoAcceso === "finalizados") {
      list = list.filter((a) => !a.sesionActiva)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.nombreCompleto.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.cargo.toLowerCase().includes(q) ||
          a.unidad.toLowerCase().includes(q) ||
          (a.ip && a.ip.includes(q))
      )
    }

    return list
  }, [dataAccesos, diaFiltro, filtroEstadoAcceso, search, hoyStr, ayerStr])

  const exportarExcelLectura = () => {
    try {
      const fechaHoy = new Date().toISOString().slice(0, 10)
      const rows = filtradosLectura.map((d, idx) => [
        idx + 1,
        d.nombreCompleto,
        d.cargo,
        d.unidad,
        d.email,
        d.haLeidoDocumento ? "SÍ (CONFIRMADO)" : "NO (PENDIENTE)",
        d.fechaLecturaDocumento
          ? new Date(d.fechaLecturaDocumento).toLocaleString("es-BO")
          : "Sin registro",
        d.haIniciadoSesion ? "SÍ" : "NUNCA",
        d.primerIngreso ? new Date(d.primerIngreso).toLocaleString("es-BO") : "Sin registro",
        d.ultimaConexion ? new Date(d.ultimaConexion).toLocaleString("es-BO") : "Sin registro",
        d.ipUltimaConexion || "—",
      ])

      const header = [
        "N°",
        "FUNCIONARIO",
        "CARGO",
        "UNIDAD",
        "CORREO INSTITUCIONAL",
        "CHECK LECTURA OBLIGATORIA",
        "FECHA CONFIRMACIÓN LECTURA",
        "INICIÓ SESIÓN",
        "PRIMER INGRESO AL SISTEMA",
        "ÚLTIMA CONEXIÓN",
        "DIRECCIÓN IP",
      ]

      const ws = XLSX.utils.aoa_to_sheet([
        ["AGENCIA BOLIVIANA DE CORREOS — CONTROL DE LECTURA OBLIGATORIA"],
        [`Fecha de reporte: ${new Date().toLocaleString("es-BO")}`],
        [],
        header,
        ...rows,
      ])
      ws["!cols"] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 28 },
        { wch: 25 },
        { wch: 34 },
        { wch: 26 },
        { wch: 26 },
        { wch: 16 },
        { wch: 26 },
        { wch: 26 },
        { wch: 18 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Control de Lectura")
      XLSX.writeFile(wb, `Auditoria_Lectura_Obligatoria_AGBC_${fechaHoy}.xlsx`)
      toast.success("Nómina de lectura exportada a Excel")
    } catch {
      toast.error("Error al exportar reporte Excel")
    }
  }

  const exportarExcelAccesosDiarios = () => {
    try {
      const fechaHoy = new Date().toISOString().slice(0, 10)
      const rows = filtradosAccesos.map((a, idx) => [
        idx + 1,
        a.nombreCompleto,
        a.cargo,
        a.unidad,
        a.email,
        a.fecha,
        a.fechaFormateada,
        a.horaIngreso,
        a.horaSalida,
        a.tiempoPermanencia,
        a.ip || "—",
        a.sesionActiva ? "ACTIVO / EN LÍNEA" : "FINALIZADA",
      ])

      const header = [
        "N°",
        "FUNCIONARIO",
        "CARGO",
        "UNIDAD",
        "CORREO INSTITUCIONAL",
        "FECHA (YYYY-MM-DD)",
        "DÍA REGISTRADO",
        "HORA DE INGRESO",
        "HORA DE SALIDA / ÚLTIMA CONEXIÓN",
        "TIEMPO CONECTADO",
        "DIRECCIÓN IP",
        "ESTADO DE SESIÓN",
      ]

      const ws = XLSX.utils.aoa_to_sheet([
        ["AGENCIA BOLIVIANA DE CORREOS — REGISTRO DIARIO DE ACCESOS Y HORARIOS"],
        [`Generado el: ${new Date().toLocaleString("es-BO")}`],
        [`Filtro de fecha aplicado: ${diaFiltro === "todos" ? "Todos los días registrados" : diaFiltro}`],
        [],
        header,
        ...rows,
      ])
      ws["!cols"] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 28 },
        { wch: 25 },
        { wch: 34 },
        { wch: 16 },
        { wch: 24 },
        { wch: 18 },
        { wch: 32 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Registro de Accesos")
      XLSX.writeFile(wb, `Registro_Accesos_Horarios_AGBC_${diaFiltro}_${fechaHoy}.xlsx`)
      toast.success("Registro de accesos y horarios exportado a Excel")
    } catch {
      toast.error("Error al exportar accesos a Excel")
    }
  }

  const porcentajeLectura = resumen.total > 0
    ? Math.round((resumen.lecturaConfirmada / resumen.total) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl rounded-3xl border-2 border-[#002F6C]/20 bg-white p-6 sm:p-7 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Cabecera Principal */}
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFCC00] shadow-md shadow-[#002F6C]/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-[#002F6C] tracking-tight">
                  Control de Lectura y Accesos de Funcionarios
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Seguimiento del cumplimiento de lectura de normativas y registro diario de ingresos y salidas al sistema
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
                onClick={activeTab === "lectura" ? exportarExcelLectura : exportarExcelAccesosDiarios}
                className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white text-xs font-bold gap-1.5 h-9 shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#FFCC00]" />
                {activeTab === "lectura" ? "Excel Lectura" : "Excel Accesos"}
              </Button>
            </div>
          </div>

          {/* Switcher de Pestañas: Lectura Obligatoria vs Registro Diario de Accesos */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("lectura")
                setSearch("")
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "lectura"
                  ? "bg-[#002F6C] text-[#FFCC00] shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-[#002F6C] hover:bg-slate-200"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Control de Lectura Obligatoria</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                {resumen.lecturaConfirmada}/{resumen.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("accesos")
                setSearch("")
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "accesos"
                  ? "bg-[#002F6C] text-[#FFCC00] shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-[#002F6C] hover:bg-slate-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Registro Diario de Accesos & Horarios (Ingresos y Salidas)</span>
              <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px]">
                {resumen.sesionesActivasAhora} en línea
              </span>
            </button>
          </div>
        </DialogHeader>

        {/* ── VISTA 1: CONTROL DE LECTURA OBLIGATORIA ── */}
        {activeTab === "lectura" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 pt-2">
            {/* Tarjetas KPI de Lectura */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  Actividad en Sistema
                </span>
                <p className="text-2xl font-black text-[#002F6C]">{resumen.conIngreso}</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {resumen.sinIngreso} sin ingreso registrado
                </span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
                <button
                  onClick={() => setFiltroLectura("todos")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroLectura === "todos"
                      ? "bg-white text-[#002F6C] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Todos ({resumen.total})
                </button>
                <button
                  onClick={() => setFiltroLectura("confirmados")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroLectura === "confirmados"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-emerald-700"
                  }`}
                >
                  Confirmados ({resumen.lecturaConfirmada})
                </button>
                <button
                  onClick={() => setFiltroLectura("pendientes")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroLectura === "pendientes"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-500 hover:text-amber-700"
                  }`}
                >
                  Pendientes ({resumen.lecturaPendiente})
                </button>
                <button
                  onClick={() => setFiltroLectura("sin_ingreso")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroLectura === "sin_ingreso"
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
                  placeholder="Buscar funcionario o unidad..."
                  className="pl-8.5 h-9 rounded-xl text-xs border-slate-200"
                />
              </div>
            </div>

            {/* Tabla con Scroll Interno */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white min-h-[300px]">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-[#0E5296]" />
                  <span className="text-xs font-bold">Cargando registros de lectura...</span>
                </div>
              ) : filtradosLectura.length === 0 ? (
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
                    {filtradosLectura.map((item) => (
                      <tr key={item.usuarioId} className="hover:bg-slate-50/80 transition-colors">
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
                                {item.cargo} • <span className="text-slate-400">{item.unidad}</span>
                              </p>
                            </div>
                          </div>
                        </td>

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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Mostrando {filtradosLectura.length} de {dataLectura.length} funcionarios</span>
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* ── VISTA 2: REGISTRO DIARIO DE ACCESOS & HORARIOS (INGRESOS Y SALIDAS) ── */}
        {activeTab === "accesos" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 pt-2">
            {/* Tarjetas KPI de Accesos Diarios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <span className="text-[11px] font-bold text-[#002F6C] uppercase tracking-wider flex items-center gap-1">
                  <LogIn className="h-3.5 w-3.5 text-[#0E5296]" />
                  Ingresos Hoy
                </span>
                <p className="text-2xl font-black text-[#002F6C]">{resumen.ingresosHoy}</p>
                <span className="text-[10px] text-slate-500 font-medium">Accesos el día de hoy</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  Sesiones Activas
                </span>
                <p className="text-2xl font-black text-emerald-700">
                  {resumen.sesionesActivasAhora}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Funcionarios en línea ahora</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  Días con Registro
                </span>
                <p className="text-2xl font-black text-purple-700">{diasDisponibles.length}</p>
                <span className="text-[10px] text-purple-600 font-medium">Historial diario disponible</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Total Registros
                </span>
                <p className="text-2xl font-black text-[#002F6C]">{filtradosAccesos.length}</p>
                <span className="text-[10px] text-slate-400 font-medium">Según filtro seleccionado</span>
              </div>
            </div>

            {/* Barra de Filtros por Día, Estado y Búsqueda */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200">
              {/* Filtro Rápido por Día */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black text-[#002F6C] flex items-center gap-1 pr-1">
                  <Calendar className="h-3.5 w-3.5 text-[#0E5296]" />
                  Día:
                </span>
                <button
                  onClick={() => setDiaFiltro("hoy")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diaFiltro === "hoy"
                      ? "bg-[#002F6C] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setDiaFiltro("ayer")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diaFiltro === "ayer"
                      ? "bg-[#002F6C] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Ayer
                </button>
                <button
                  onClick={() => setDiaFiltro("todos")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    diaFiltro === "todos"
                      ? "bg-[#002F6C] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Todos los Días
                </button>

                {/* Selector de Fecha Específica */}
                <div className="flex items-center gap-1 pl-1">
                  <Input
                    type="date"
                    value={diaFiltro !== "hoy" && diaFiltro !== "ayer" && diaFiltro !== "todos" ? diaFiltro : ""}
                    onChange={(e) => setDiaFiltro(e.target.value || "todos")}
                    className="h-8 w-36 rounded-xl text-xs border-slate-300 bg-white"
                    title="Seleccionar fecha específica"
                  />
                </div>
              </div>

              {/* Filtro por Estado de Sesión y Búsqueda */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filtroEstadoAcceso}
                  onChange={(e) => setFiltroEstadoAcceso(e.target.value as any)}
                  className="h-8 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="todos">Estado: Todos</option>
                  <option value="activos">🟢 En Línea (Activos)</option>
                  <option value="finalizados">⚪ Sesión Finalizada</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar funcionario o IP..."
                    className="pl-8 h-8 rounded-xl text-xs border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tabla Detallada de Ingresos y Salidas */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white min-h-[300px]">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-[#0E5296]" />
                  <span className="text-xs font-bold">Cargando registros diarios de acceso...</span>
                </div>
              ) : filtradosAccesos.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-xs">
                  No se registraron accesos para la fecha o filtro seleccionado.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-[#002F6C] font-black uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="py-3 px-4">Funcionario</th>
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Hora de Ingreso</th>
                      <th className="py-3 px-3">Hora de Salida / Última Conexión</th>
                      <th className="py-3 px-3 text-center">Tiempo Conectado</th>
                      <th className="py-3 px-3">Dirección IP</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtradosAccesos.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
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
                                {item.cargo} • <span className="text-slate-400">{item.unidad}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {item.fechaFormateada}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.fecha}
                          </span>
                        </td>

                        {/* Hora de Ingreso */}
                        <td className="py-2.5 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-900 font-bold text-[11px]">
                            <LogIn className="h-3 w-3 text-[#0E5296]" />
                            <span>{item.horaIngreso}</span>
                          </div>
                        </td>

                        {/* Hora de Salida / Última Conexión */}
                        <td className="py-2.5 px-3">
                          {item.sesionActiva ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[11px]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>{item.horaSalida}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                              <LogOut className="h-3 w-3 text-slate-500" />
                              <span>{item.horaSalida}</span>
                            </div>
                          )}
                        </td>

                        {/* Tiempo Conectado */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[10.5px]">
                            {item.tiempoPermanencia}
                          </span>
                        </td>

                        {/* Dirección IP */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {item.ip || "—"}
                        </td>

                        {/* Estado */}
                        <td className="py-2.5 px-4 text-right">
                          {item.sesionActiva ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                              En Línea
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                              Finalizada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Mostrando {filtradosAccesos.length} registros de accesos</span>
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
