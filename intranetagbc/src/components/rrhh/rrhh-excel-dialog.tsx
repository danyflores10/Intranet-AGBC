"use client"

import { useState, useRef, useTransition, useMemo } from "react"
import {
  DownloadIcon,
  UploadIcon,
  FileSpreadsheetIcon,
  CheckCircleIcon,
  Loader2Icon,
  XIcon,
  UserPlusIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { importarPersonalLote, type ImportPersonalRecord } from "@/actions/rrhh"

interface PersonalRow {
  id: string
  nombre: string
  ci?: string
  cargo: string
  unidad?: string
  email: string | null
  telefono: string | null
  foto: string | null
  fechaIngreso?: string
  estado?: string
}

type Props = {
  open: boolean
  onClose: () => void
  personal: PersonalRow[]
  onImportSuccess?: () => void
}

function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function RrhhExcelDialog({ open, onClose, personal, onImportSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado de Drag & Drop e Importación
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRecords, setParsedRecords] = useState<ImportPersonalRecord[]>([])
  const [importResult, setImportResult] = useState<{
    totalImportados: number
    totalActualizados: number
    totalOmitidos: number
  } | null>(null)

  // ── EXPORTACIÓN PROFESIONAL DE NÓMINA (SIN ID / CÓDIGO) ──
  const handleExportExcel = () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10)

      const rowsData = personal.map((p) => {
        const fechaIngresoFormateada = p.fechaIngreso
          ? (p.fechaIngreso.includes("T") ? p.fechaIngreso.split("T")[0] : p.fechaIngreso)
          : ""

        return [
          p.nombre,
          p.cargo || "Personal",
          p.email || "",
          p.telefono || "",
          fechaIngresoFormateada,
          (p.estado || "activo").toUpperCase(),
        ]
      })

      const headerRows = [
        [
          "NOMBRES Y APELLIDOS",
          "CARGO / PUESTO",
          "CORREO ELECTRÓNICO",
          "TELÉFONO",
          "FECHA DE INGRESO (AAAA-MM-DD)",
          "ESTADO",
        ],
        ...rowsData,
      ]

      const ws = XLSX.utils.aoa_to_sheet(headerRows)

      ws["!cols"] = [
        { wch: 34 }, // Nombres
        { wch: 28 }, // Cargo
        { wch: 32 }, // Correo
        { wch: 18 }, // Teléfono
        { wch: 24 }, // Fecha Ingreso
        { wch: 14 }, // Estado
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Nómina RRHH")

      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
      const blob = new Blob([wbOut], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Nomina_Personal_RRHH_AGBC_${timestamp}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Planilla de personal exportada en Excel.")
    } catch {
      toast.error("Error al exportar archivo Excel.")
    }
  }

  // ── PROCESAMIENTO Y LIMPIEZA INTELIGENTE DE EXCEL ──
  const processExcelFile = (file: File) => {
    setFileName(file.name)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const wb = XLSX.read(data, { type: "binary", cellDates: true })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][]

        if (!rows || rows.length === 0) {
          toast.error("El archivo Excel no contiene filas de datos.")
          return
        }

        const parseDate = (val: any): string | undefined => {
          if (!val) return undefined
          if (val instanceof Date && !isNaN(val.getTime())) {
            return val.toISOString().slice(0, 10)
          }
          if (typeof val === "number") {
            const d = new Date((val - 25569) * 86400 * 1000)
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
          }
          const str = String(val).trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
          const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
          if (dmy) {
            return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
          }
          return undefined
        }

        // Buscar dinámicamente la fila donde están los encabezados reales
        let headerRowIdx = -1
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i] || []
          const nonEmptyCells = row.filter((c) => c !== undefined && String(c).trim().length > 0)
          if (nonEmptyCells.length < 3) continue

          const rowStr = row.map((c) => String(c).toLowerCase()).join(" ")
          const hasNombre = /nombre|apellido|funcionario|empleado/.test(rowStr)
          const hasOther = /ci|carnet|documento|cargo|puesto|correo|email|telefono|ingreso|estado/.test(rowStr)

          if (hasNombre && hasOther) {
            headerRowIdx = i
            break
          }
        }

        if (headerRowIdx === -1) headerRowIdx = 0

        const headerRow = (rows[headerRowIdx] || []).map((c) =>
          String(c).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        )

        const findColIndex = (regex: RegExp) => headerRow.findIndex((col) => regex.test(col))

        const idIdx = findColIndex(/\b(id|codigo|identificador|key)\b/)
        const nombreIdx = findColIndex(/nombre|nombres|funcionario|personal|empleado/)
        const paternoIdx = findColIndex(/paterno|primer apellido/)
        const maternoIdx = findColIndex(/materno|segundo apellido/)
        const ciIdx = findColIndex(/\bci\b|c\.i|carnet|cedula|documento|identificaci/)
        const cargoIdx = findColIndex(/cargo|puesto|item|ocupacion|funcion/)
        const emailIdx = findColIndex(/correo|email|institucional|mail/)
        const telefonoIdx = findColIndex(/telefono|celular|contacto|movil/)
        const fechaIdx = findColIndex(/fecha|ingreso|alta|incorporaci/)
        const estadoIdx = findColIndex(/estado|situacion|condicion/)

        const normalized: ImportPersonalRecord[] = []

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length === 0) continue

          const getVal = (idx: number) => (idx !== -1 && row[idx] !== undefined ? row[idx] : "")

          const idRaw = String(getVal(idIdx)).trim()
          const nombres = String(getVal(nombreIdx)).trim()
          const paterno = String(getVal(paternoIdx)).trim()
          const materno = String(getVal(maternoIdx)).trim()
          const ciRaw = String(getVal(ciIdx)).trim()
          const cargo = String(getVal(cargoIdx)).trim()
          const email = String(getVal(emailIdx)).trim()
          const telefono = String(getVal(telefonoIdx)).trim()
          const fechaRaw = getVal(fechaIdx)
          const fechaIngreso = parseDate(fechaRaw)
          const estado = String(getVal(estadoIdx)).trim()

          let nombreCompleto = nombres
          if (paterno || materno) {
            nombreCompleto = `${nombres} ${paterno} ${materno}`.trim()
          }

          // Descartar si el nombre es solo un número secuencial (ej. 1, 2, 3...) o encabezado
          const esNumero = /^[0-9]+$/.test(nombreCompleto)
          const esBanner =
            nombreCompleto === "N°" ||
            nombreCompleto.toLowerCase().startsWith("fecha de") ||
            /reporte oficial|planilla|nomina|agencia boliviana|fecha de emision|total funcionarios/i.test(nombreCompleto)

          if (esNumero || esBanner || nombreCompleto.length < 3) {
            continue
          }

          normalized.push({
            id: idRaw && idRaw.length > 5 ? idRaw : undefined,
            nombre: nombreCompleto,
            ci: ciRaw && ciRaw !== "—" && !ciRaw.toLowerCase().includes("sin asignar") ? ciRaw.slice(0, 20) : undefined,
            cargo: cargo || undefined,
            email: email && email !== "Sin asignar" && email.includes("@") ? email : undefined,
            telefono: telefono && telefono !== "Sin asignar" ? telefono : undefined,
            fechaIngreso: fechaIngreso || undefined,
            estado: estado || undefined,
          })
        }

        if (normalized.length === 0) {
          toast.error("No se detectaron columnas o registros válidos de personal.")
          return
        }

        setParsedRecords(normalized)
        toast.success(`${normalized.length} registros analizados correctamente.`)
      } catch {
        toast.error("No se pudo leer el archivo Excel.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processExcelFile(file)
  }

  // ── HANDLERS DE ARRASTRAR Y SOLTAR (DRAG & DROP) ──
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error("Por favor arrastra un archivo de tipo Excel (.xlsx, .xls) o .csv")
        return
      }
      processExcelFile(file)
    }
  }

  // ── ANÁLISIS EN TIEMPO REAL: NUEVOS VS ACTUALIZACIONES ──
  const { nuevosRecords, actualizadosRecords } = useMemo(() => {
    const nuevos: ImportPersonalRecord[] = []
    const actualizados: { record: ImportPersonalRecord; original: PersonalRow }[] = []

    parsedRecords.forEach((rec) => {
      const recNombreNorm = normalizarTexto(rec.nombre)
      const recEmail = rec.email ? rec.email.trim().toLowerCase() : null
      const recCi = rec.ci ? rec.ci.trim() : null

      const match = personal.find((p) => {
        // 1. Por ID si existiera
        if (rec.id && p.id === rec.id) return true
        // 2. Por CI
        if (recCi && p.ci && p.ci.trim() === recCi && p.ci !== "—") return true
        // 3. Por Correo Electrónico
        if (recEmail && p.email && p.email.trim().toLowerCase() === recEmail) return true
        // 4. Por Nombre Completo Normalizado
        const pNombreNorm = normalizarTexto(p.nombre)
        if (recNombreNorm && pNombreNorm === recNombreNorm) return true
        if (recNombreNorm.length >= 4 && pNombreNorm.length >= 4) {
          if (recNombreNorm.includes(pNombreNorm) || pNombreNorm.includes(recNombreNorm)) return true
        }
        return false
      })

      if (match) {
        actualizados.push({ record: rec, original: match })
      } else {
        nuevos.push(rec)
      }
    })

    return { nuevosRecords: nuevos, actualizadosRecords: actualizados }
  }, [parsedRecords, personal])

  const handleExecuteImport = () => {
    if (parsedRecords.length === 0) return

    startTransition(async () => {
      const res = await importarPersonalLote(parsedRecords)
      if (res.success && res.data) {
        setImportResult(res.data)
        toast.success(
          `Procesado: ${res.data.totalImportados} nuevos, ${res.data.totalActualizados} actualizados.`
        )
        if (onImportSuccess) onImportSuccess()
      } else {
        toast.error(res.message || "Error al procesar la planilla.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-3xl border-2 border-[#002F6C]/15 bg-white p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-xs">
              <FileSpreadsheetIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-[#002F6C]">
                Gestión de Nómina Excel (Recursos Humanos)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Carga masiva con deduplicación inteligente o exportación estructurada sin códigos internos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selector de Pestaña */}
        <div className="mt-4 flex rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-white text-[#002F6C] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <DownloadIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            Exportar Nómina a Excel
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === "import"
                ? "bg-white text-[#002F6C] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UploadIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            Importar Nómina desde Excel
          </button>
        </div>

        {/* ── SECCIÓN 1: EXPORTAR ── */}
        {activeTab === "export" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border-2 border-sky-200/80 bg-gradient-to-br from-sky-50 via-blue-50/40 to-white p-4">
              <h4 className="text-xs font-black text-[#002F6C]">Planilla Institucional de Personal</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                Genera un archivo Excel (.xlsx) estructurado para Recursos Humanos con nombres completos, cargo, correo, teléfono y fecha de ingreso de los <strong>{personal.length}</strong> funcionarios registrados.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleExportExcel}
                className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                <DownloadIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                Descargar Nómina Excel (.xlsx)
              </Button>
            </div>
          </div>
        )}

        {/* ── SECCIÓN 2: IMPORTAR ── */}
        {activeTab === "import" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-yellow-50/40 to-white p-3.5 text-[11px] text-slate-700 font-medium">
              <p className="font-bold text-[#002F6C] mb-1 flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5 text-amber-600" />
                Cotejo y Actualización Automática:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li><strong>Detección precisa:</strong> Si el funcionario ya existe, actualiza sus datos (letras, cargos, teléfonos) sin duplicarlo.</li>
                <li><strong>Nuevos ingresos:</strong> Si agregas nuevas filas, se registrarán como nuevos funcionarios con contraseña inicial segura.</li>
              </ul>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            {!fileName ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
                  isDragging
                    ? "border-[#0E5296] bg-blue-100/70 scale-[1.01] shadow-md"
                    : "border-[#0E5296]/30 bg-blue-50/30 hover:bg-blue-50/60"
                }`}
              >
                <UploadIcon
                  className={`h-9 w-9 mb-2 transition-transform ${
                    isDragging ? "scale-115 text-[#002F6C]" : "text-[#0E5296]"
                  }`}
                />
                <p className="text-xs font-bold text-[#002F6C]">
                  {isDragging
                    ? "¡Suelta tu archivo Excel aquí!"
                    : "Haz clic o arrastra tu archivo Excel (.xlsx / .xls / .csv) aquí"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Compatible con planillas de personal o exportaciones previas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cabecera del archivo cargado */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheetIcon className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-black text-[#002F6C]">{fileName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {parsedRecords.length} filas detectadas en el documento
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFileName(null)
                      setParsedRecords([])
                      setImportResult(null)
                    }}
                    className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                    title="Quitar archivo"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* ── CARD DE ANÁLISIS INTELIGENTE (NUEVOS VS ACTUALIZACIONES) ── */}
                {parsedRecords.length > 0 && !importResult && (
                  <div className="rounded-2xl border border-[#002F6C]/15 bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#002F6C] flex items-center gap-1.5">
                        <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                        Diagnóstico de Carga:
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        {actualizadosRecords.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-[#002F6C] font-black px-2.5 py-0.5 rounded-full border border-blue-300 shadow-2xs">
                            <RefreshCwIcon className="h-3 w-3" />
                            {actualizadosRecords.length} actualizados
                          </span>
                        )}
                        {nuevosRecords.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                            <UserPlusIcon className="h-3 w-3" />
                            {nuevosRecords.length} nuevos
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      {nuevosRecords.length === 0 ? (
                        <>
                          <strong>{actualizadosRecords.length} actualizados</strong> (0 nuevos). Se actualizarán los datos de los funcionarios existentes con las modificaciones del Excel.
                        </>
                      ) : actualizadosRecords.length === 0 ? (
                        <>
                          <strong>{nuevosRecords.length} nuevos</strong> funcionarios serán registrados en el sistema.
                        </>
                      ) : (
                        <>
                          Se detectaron <strong>{actualizadosRecords.length} actualizados</strong> y <strong>{nuevosRecords.length} nuevos</strong> funcionarios.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Preview de primeros registros */}
                {parsedRecords.length > 0 && !importResult && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-[10px] space-y-1">
                    <p className="font-bold text-[#002F6C] px-1">Vista previa detallada:</p>
                    {parsedRecords.slice(0, 5).map((r, i) => {
                      const isNew = nuevosRecords.some((nr) => nr.nombre === r.nombre)
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 px-1.5 rounded-lg border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                isNew
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-blue-100 text-[#002F6C] border border-blue-200"
                              }`}
                            >
                              {isNew ? "NUEVO" : "ACTUALIZAR"}
                            </span>
                            <span className="font-bold text-slate-800">{r.nombre}</span>
                          </div>
                          <span className="text-[#0E5296] font-medium">{r.cargo || "Personal"}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Resultado de Importación */}
                {importResult && (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                      Procesamiento de nómina completado exitosamente
                    </div>
                    <p className="text-[11px] text-slate-700">
                      • <strong>{importResult.totalActualizados}</strong> funcionarios actualizados.<br />
                      • <strong>{importResult.totalImportados}</strong> nuevos funcionarios registrados.<br />
                      {importResult.totalOmitidos > 0 && (
                        <span>• <strong>{importResult.totalOmitidos}</strong> filas omitidas por datos incompletos.</span>
                      )}
                    </p>
                  </div>
                )}

                {!importResult && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={handleExecuteImport}
                      disabled={isPending || parsedRecords.length === 0}
                      className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl shadow-md cursor-pointer"
                    >
                      {isPending ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Procesando Planilla...
                        </>
                      ) : nuevosRecords.length === 0 ? (
                        <>
                          <RefreshCwIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Actualizar {actualizadosRecords.length} Funcionarios
                        </>
                      ) : actualizadosRecords.length === 0 ? (
                        <>
                          <UserPlusIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Registrar {nuevosRecords.length} Nuevos Funcionarios
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Confirmar: {actualizadosRecords.length} actualizados y {nuevosRecords.length} nuevos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
