"use client"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import mammoth from "mammoth"
import { Loader2, Download, AlertCircle, FileSpreadsheet, FileText, ExternalLink } from "lucide-react"

interface DocumentContentViewerProps {
  url: string
  fileName: string
  title: string
  tipoArchivo: string | null
}

export function DocumentContentViewer({ url, fileName, title, tipoArchivo }: DocumentContentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Excel state
  const [sheets, setSheets] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [tableData, setTableData] = useState<any[][]>([])
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)

  // Word state
  const [wordHtml, setWordHtml] = useState<string>("")

  const ext = (fileName || url).split(".").pop()?.toLowerCase() || (tipoArchivo || "").toLowerCase()
  const isExcel = ["xlsx", "xls", "csv"].includes(ext)
  const isDocx = ext === "docx"
  const isLegacyDoc = ext === "doc"

  const effectiveUrl = (url.startsWith("/api/documentos/") || url.startsWith("http://") || url.startsWith("https://"))
    ? url
    : `/api/documentos/${url.replace(/^\/?(documentos\/)?/, "")}`
  const downloadUrl = effectiveUrl.includes("?") ? `${effectiveUrl}&download=1` : `${effectiveUrl}?download=1`

  useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError(null)

    async function loadContent() {
      try {
        if (isLegacyDoc) {
          // .doc binary legacy format
          setLoading(false)
          return
        }

        const res = await fetch(effectiveUrl)
        if (!res.ok) {
          throw new Error(`No se pudo cargar el archivo (${res.status})`)
        }

        const buffer = await res.arrayBuffer()
        if (isCancelled) return

        if (isExcel) {
          const wb = XLSX.read(buffer, { type: "array" })
          if (wb.SheetNames.length === 0) {
            throw new Error("El libro de Excel no contiene hojas.")
          }
          setWorkbook(wb)
          setSheets(wb.SheetNames)
          const firstSheet = wb.SheetNames[0]
          setActiveSheet(firstSheet)
          const sheet = wb.Sheets[firstSheet]
          const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" })
          setTableData(data)
        } else if (isDocx) {
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
          setWordHtml(result.value)
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Error al renderizar vista previa:", err)
          setError(err?.message || "No se pudo generar la vista previa del contenido.")
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadContent()
    return () => {
      isCancelled = true
    }
  }, [effectiveUrl, isExcel, isDocx, isLegacyDoc])

  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return
    setActiveSheet(sheetName)
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" })
    setTableData(data)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E5296]" />
        <p className="text-sm font-medium">Cargando visualización del contenido...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1">
          <h4 className="text-sm font-bold text-slate-800">Vista previa interactiva no disponible</h4>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
        <div className="flex gap-2 pt-2">
          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0E5296] hover:bg-[#002F6C] rounded-xl shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#FFB800]" />
            Descargar archivo
          </a>
        </div>
      </div>
    )
  }

  if (isLegacyDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-600 border border-blue-200">
          <FileText className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 rounded-full">
            Formato Word Clásico (.doc)
          </span>
          <h4 className="text-base font-bold text-[#002F6C]">{title}</h4>
          <p className="text-xs text-slate-500">
            Los archivos .doc binarios clásicos se abren directamente al descargarlos o en Microsoft Word.
          </p>
        </div>
        <div className="flex gap-2 pt-3">
          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0E5296] hover:bg-[#002F6C] rounded-xl shadow-md"
          >
            <Download className="h-4 w-4 text-[#FFB800]" />
            Descargar y Abrir Word
          </a>
        </div>
      </div>
    )
  }

  if (isExcel) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        {/* Barra superior con selector de hojas */}
        {sheets.length > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-white overflow-x-auto text-xs font-semibold">
            <span className="text-slate-400 font-normal mr-2">Hojas:</span>
            {sheets.map((s) => (
              <button
                key={s}
                onClick={() => handleSheetChange(s)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeSheet === s
                    ? "bg-[#0E5296] text-white shadow-2xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Tabla interactiva */}
        <div className="flex-1 overflow-auto p-4">
          {tableData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">La hoja seleccionada está vacía.</div>
          ) : (
            <div className="inline-block min-w-full align-middle border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <tbody>
                  {tableData.map((row, rIdx) => {
                    const isHeader = rIdx === 0
                    return (
                      <tr
                        key={rIdx}
                        className={
                          isHeader
                            ? "bg-[#002F6C] text-white font-bold"
                            : rIdx % 2 === 0
                            ? "bg-white hover:bg-slate-50"
                            : "bg-slate-50/70 hover:bg-slate-100"
                        }
                      >
                        <td className="px-2 py-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-100/60 border-r border-slate-200 select-none w-10">
                          {rIdx + 1}
                        </td>
                        {row.map((cell: any, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 border-r border-b border-slate-200/70 whitespace-pre-wrap ${
                              isHeader ? "text-white font-bold" : "text-slate-700"
                            }`}
                          >
                            {cell !== undefined && cell !== null ? String(cell) : ""}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Barra de estado inferior */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-white text-[11px] text-slate-500 font-mono">
          <span>
            Hoja: <strong className="text-slate-700">{activeSheet}</strong> ({tableData.length} filas)
          </span>
          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center gap-1 font-sans font-bold text-[#0E5296] hover:underline"
          >
            <Download className="h-3 w-3" />
            Descargar archivo original
          </a>
        </div>
      </div>
    )
  }

  if (isDocx) {
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200">
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-[#002F6C] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#0E5296] [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t bg-white text-[11px] text-slate-500">
          <span className="font-mono">{fileName}</span>
          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center gap-1 font-bold text-[#0E5296] hover:underline"
          >
            <Download className="h-3 w-3" />
            Descargar Word (.docx)
          </a>
        </div>
      </div>
    )
  }

  return null
}
