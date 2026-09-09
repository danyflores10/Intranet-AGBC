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
import type { User } from "@/types/users"
import { importarUsuariosLote, type ImportUserRecord } from "@/actions/usuarios"

type Props = {
  open: boolean
  onClose: () => void
  users: User[]
  onImportSuccess: () => void
}

function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function UsersExcelDialog({ open, onClose, users, onImportSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado de Drag & Drop e Importación
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRecords, setParsedRecords] = useState<ImportUserRecord[]>([])
  const [importResult, setImportResult] = useState<{
    totalImportados: number
    totalOmitidos: number
    mensajes: string[]
  } | null>(null)

  // ── EXPORTACIÓN PROFESIONAL DE USUARIOS (SIN ID INTERNO) ──
  const handleExportExcel = () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      const generadoEn = new Intl.DateTimeFormat("es-BO", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date())

      const rowsData = users.map((u) => {
        const rolesText = u.roles.map((r) => r.name).join(", ") || "Funcionario"
        return [
          u.name,
          u.nationalId || "No registrado",
          u.institutionalEmail || "Sin asignar",
          u.email || "Sin asignar",
          rolesText.toUpperCase(),
          u.isActive ? "ACTIVO" : "INACTIVO",
          u.emailVerified ? "VERIFICADO" : "PENDIENTE",
          u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-BO") : "—",
        ]
      })

      const headerRows = [
        ["AGENCIA BOLIVIANA DE CORREOS - AGBC"],
        ["REPORTE GENERAL DE PERSONAL Y CUENTAS DE USUARIO"],
        [`Fecha de generación: ${generadoEn}`],
        [`Total funcionarios registrados: ${users.length}`],
        [],
        [
          "NOMBRES Y APELLIDOS",
          "C.I. / DOCUMENTO",
          "CORREO INSTITUCIONAL",
          "CORREO PERSONAL",
          "ROL ASIGNADO",
          "ESTADO",
          "VERIFICACIÓN",
          "FECHA REGISTRO",
        ],
        ...rowsData,
      ]

      const ws = XLSX.utils.aoa_to_sheet(headerRows)

      ws["!cols"] = [
        { wch: 32 }, // Nombres
        { wch: 18 }, // CI
        { wch: 32 }, // Correo Inst
        { wch: 30 }, // Correo Pers
        { wch: 22 }, // Rol
        { wch: 12 }, // Estado
        { wch: 14 }, // Verificación
        { wch: 16 }, // Fecha
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Personal AGBC")

      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
      const blob = new Blob([wbOut], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Reporte_Personal_AGBC_${timestamp}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Reporte Excel exportado correctamente.")
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
        const wb = XLSX.read(data, { type: "binary" })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

        if (!rawJson || rawJson.length === 0) {
          toast.error("La hoja de Excel está vacía.")
          return
        }

        const normalized: ImportUserRecord[] = []

        rawJson.forEach((row) => {
          const keys = Object.keys(row)
          const findVal = (terms: string[]) => {
            for (const key of keys) {
              const k = key.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim()
              if (terms.some((t) => k.includes(t))) {
                return String(row[key]).trim()
              }
            }
            return ""
          }

          const nombres = findVal(["nombre", "funcionario", "personal"])
          const paterno = findVal(["paterno", "apellido paterno", "primer apellido"])
          const materno = findVal(["materno", "apellido materno", "segundo apellido"])
          const ci = findVal(["ci", "carnet", "cedula", "documento", "identificacion"])
          const correoInst = findVal(["institucional", "correo oficial", "correo trabajo"])
          const correoPers = findVal(["correo", "email", "personal"])
          const cargo = findVal(["cargo", "puesto", "funcion", "rol", "departamento"])

          if (nombres || ci) {
            normalized.push({
              nombres,
              paterno: paterno || undefined,
              materno: materno || undefined,
              ci,
              correoInstitucional: correoInst || undefined,
              correoPersonal: correoPers || undefined,
              cargo: cargo || undefined,
              rolNombre: cargo || undefined,
            })
          }
        })

        if (normalized.length === 0) {
          toast.error("No se detectaron columnas de personal válidas (Nombres, CI, etc.)")
          return
        }

        setParsedRecords(normalized)
        toast.success(`${normalized.length} registros listos para procesar.`)
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

  // ── HANDLERS DE DRAG & DROP ──
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

  // ── ANÁLISIS EN TIEMPO REAL: NUEVOS VS EXISTENTES ──
  const { nuevosRecords, existentesRecords } = useMemo(() => {
    const nuevos: ImportUserRecord[] = []
    const existentes: { record: ImportUserRecord; original: User }[] = []

    parsedRecords.forEach((rec) => {
      const recNombreCompleto = [rec.nombres, rec.paterno, rec.materno]
        .filter(Boolean)
        .join(" ")
      const recNombreNorm = normalizarTexto(recNombreCompleto || rec.nombres)
      const recCi = rec.ci ? rec.ci.trim().toUpperCase() : null
      const recEmail = rec.correoInstitucional ? rec.correoInstitucional.trim().toLowerCase() : null

      const match = users.find((u) => {
        // 1. Por CI
        if (recCi && u.nationalId && u.nationalId.trim().toUpperCase() === recCi) return true
        // 2. Por Correo Institucional
        if (recEmail && u.institutionalEmail && u.institutionalEmail.trim().toLowerCase() === recEmail) return true
        // 3. Por Nombre Completo Normalizado
        const uNombreNorm = normalizarTexto(u.name)
        if (recNombreNorm && uNombreNorm === recNombreNorm) return true
        if (recNombreNorm.length >= 4 && uNombreNorm.length >= 4) {
          if (recNombreNorm.includes(uNombreNorm) || uNombreNorm.includes(recNombreNorm)) return true
        }
        return false
      })

      if (match) {
        existentes.push({ record: rec, original: match })
      } else {
        nuevos.push(rec)
      }
    })

    return { nuevosRecords: nuevos, existentesRecords: existentes }
  }, [parsedRecords, users])

  const handleExecuteImport = () => {
    if (parsedRecords.length === 0) return

    startTransition(async () => {
      const res = await importarUsuariosLote(parsedRecords)
      if (res.success && res.data) {
        setImportResult(res.data)
        toast.success(`Importación finalizada: ${res.data.totalImportados} usuarios creados.`)
        onImportSuccess()
      } else {
        toast.error(res.message || "Error al procesar la importación.")
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
                Gestión Excel de Usuarios (RRHH)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Exporta el padrón institucional o importa planillas con cotejo inteligente y arrastrar/soltar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selector de Pestaña */}
        <div className="mt-4 flex rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-black transition-all cursor-pointer ${activeTab === "export"
                ? "bg-white text-[#002F6C] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <DownloadIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            Exportar Padrón a Excel
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-black transition-all cursor-pointer ${activeTab === "import"
                ? "bg-white text-[#002F6C] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <UploadIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            Importar desde Excel / RRHH
          </button>
        </div>

        {/* ── SECCIÓN 1: EXPORTAR ── */}
        {activeTab === "export" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border-2 border-sky-200/80 bg-gradient-to-br from-sky-50 via-blue-50/40 to-white p-4">
              <h4 className="text-xs font-black text-[#002F6C]">Reporte Institucional de Usuarios</h4>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                Genera un archivo Excel (.xlsx) estructurado para Recursos Humanos con nombres completos, C.I., correos oficiales, roles y estado de cuenta de los <strong>{users.length}</strong> usuarios.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleExportExcel}
                className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl shadow-md shadow-[#0E5296]/20 cursor-pointer"
              >
                <DownloadIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                Descargar Archivo Excel (.xlsx)
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
                Limpieza y Migración Automática:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>Acepta planillas con nombres completos o columnas separadas (Paterno, Materno).</li>
                <li>Normaliza automáticamente correos institucionales oficiales <code>@correos.gob.bo</code>.</li>
                <li>Genera contraseñas aleatorias únicas de acceso institucional para nuevos usuarios.</li>
                <li>Omite duplicados de C.I. o correos preexistentes sin interrumpir la carga.</li>
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
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${isDragging
                    ? "border-[#0E5296] bg-blue-100/70 scale-[1.01] shadow-md"
                    : "border-[#0E5296]/30 bg-blue-50/30 hover:bg-blue-50/60"
                  }`}
              >
                <UploadIcon
                  className={`h-9 w-9 mb-2 transition-transform ${isDragging ? "scale-115 text-[#002F6C]" : "text-[#0E5296]"
                    }`}
                />
                <p className="text-xs font-bold text-[#002F6C]">
                  {isDragging
                    ? "¡Suelta tu archivo Excel aquí!"
                    : "Haz clic o arrastra tu archivo Excel (.xlsx / .xls / .csv) aquí"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Planillas de personal o nómina de RRHH</p>
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

                {/* ── CARD DE ANÁLISIS INTELIGENTE (NUEVOS vs EXISTENTES) ── */}
                {parsedRecords.length > 0 && !importResult && (
                  <div className="rounded-2xl border border-[#002F6C]/15 bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#002F6C] flex items-center gap-1.5">
                        <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                        Diagnóstico de Carga:
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        {nuevosRecords.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                            <UserPlusIcon className="h-3 w-3" />
                            {nuevosRecords.length} Nuevos
                          </span>
                        )}
                        {existentesRecords.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-[#002F6C] font-black px-2.5 py-0.5 rounded-full border border-blue-300 shadow-2xs">
                            <RefreshCwIcon className="h-3 w-3" />
                            {existentesRecords.length} Existentes
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium">
                      {nuevosRecords.length === 0 ? (
                        <>
                          Los <strong>{existentesRecords.length} usuarios</strong> ya están registrados en el sistema. No se generarán duplicados.
                        </>
                      ) : existentesRecords.length === 0 ? (
                        <>
                          Se detectaron <strong>{nuevosRecords.length} nuevos usuarios</strong> listos para ser creados.
                        </>
                      ) : (
                        <>
                          Se crearán <strong>{nuevosRecords.length} nuevos usuarios</strong> y se omitirán/conservarán <strong>{existentesRecords.length} registros existentes</strong>.
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
                      const isNew = nuevosRecords.some((nr) => nr.nombres === r.nombres && nr.ci === r.ci)
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1 px-1.5 rounded-lg border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isNew
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-blue-100 text-[#002F6C] border border-blue-200"
                                }`}
                            >
                              {isNew ? "NUEVO" : "EXISTENTE"}
                            </span>
                            <span className="font-bold text-slate-800">{r.nombres} {r.paterno || ""}</span>
                          </div>
                          <span className="font-mono text-slate-500">CI: {r.ci || "S/CI"}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Resultado de Importación */}
                {importResult && (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                      Importación exitosa: {importResult.totalImportados} usuarios agregados al sistema
                    </div>
                    {importResult.totalOmitidos > 0 && (
                      <p className="text-[11px] text-slate-600">
                        ({importResult.totalOmitidos} registros omitidos por ya existir previamente en la base de datos).
                      </p>
                    )}
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
                          Procesando e Importando...
                        </>
                      ) : nuevosRecords.length === 0 ? (
                        <>
                          <RefreshCwIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Conservar / Verificar {existentesRecords.length} Usuarios
                        </>
                      ) : existentesRecords.length === 0 ? (
                        <>
                          <UserPlusIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Crear {nuevosRecords.length} Nuevos Usuarios
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Importar {nuevosRecords.length} Nuevos Usuarios ({existentesRecords.length} existentes)
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
