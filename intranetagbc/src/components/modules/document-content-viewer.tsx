"use client"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import mammoth from "mammoth"
import {
  Loader2,
  Download,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"
import { registrarAccionDocumentoAction } from "@/actions/auditoria"
import {
  getCleanDocumentFileName,
  getDocumentTypeInfo,
  getDownloadUrl,
} from "@/lib/document-download-helper"

interface DocumentContentViewerProps {
  url: string
  fileName: string
  title: string
  tipoArchivo: string | null
}

function cleanHtmlTable(rawHtml: string): string {
  // Extraer solo el contenido de <table>...</table>
  const match = rawHtml.match(/<table[\s\S]*?<\/table>/i)
  if (!match) return rawHtml
  return match[0]
}

export function DocumentContentViewer({
  url,
  fileName,
  title,
  tipoArchivo,
}: DocumentContentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(100)

  // Excel state
  const [sheets, setSheets] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>("")
  const [excelHtml, setExcelHtml] = useState<string>("")
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)

  // Word state
  const [wordHtml, setWordHtml] = useState<string>("")

  const typeInfo = getDocumentTypeInfo(tipoArchivo, fileName || url)
  const cleanName = getCleanDocumentFileName(title || fileName, tipoArchivo, url)

  const effectiveUrl =
    url.startsWith("/api/documentos/") || url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `/api/documentos/${url.replace(/^\/?(documentos\/)?/, "")}`

  const downloadUrl = getDownloadUrl(effectiveUrl, title || fileName, tipoArchivo)

  useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError(null)

    async function loadContent() {
      try {
        let res = await fetch(effectiveUrl)
        if (!res.ok) {
          throw new Error(`No se pudo cargar el archivo (${res.status})`)
        }

        let buffer = await res.arrayBuffer()
        if (isCancelled) return

        if (typeInfo.isExcel) {
          const wb = XLSX.read(buffer, { type: "array", cellStyles: true })
          if (wb.SheetNames.length === 0) {
            throw new Error("El libro de Excel no contiene hojas.")
          }
          setWorkbook(wb)
          setSheets(wb.SheetNames)
          const firstSheet = wb.SheetNames[0]
          setActiveSheet(firstSheet)
          const sheet = wb.Sheets[firstSheet]
          const tableHtml = XLSX.utils.sheet_to_html(sheet, { id: "excel-preview-grid" })
          setExcelHtml(cleanHtmlTable(tableHtml))
        } else if (typeInfo.isWord) {
          let converted = false

          // Si es .doc, intentar primero cargar la versión .docx modernizada si existe
          if (effectiveUrl.toLowerCase().endsWith(".doc") || (fileName || "").toLowerCase().endsWith(".doc")) {
            try {
              const docxUrl = effectiveUrl.replace(/\.doc$/i, ".docx")
              const resDocx = await fetch(docxUrl)
              if (resDocx.ok) {
                const docxBuffer = await resDocx.arrayBuffer()
                const result = await mammoth.convertToHtml({ arrayBuffer: docxBuffer })
                if (result.value && result.value.trim().length > 0) {
                  setWordHtml(result.value)
                  converted = true
                }
              }
            } catch {
              // fallback a intentar con el buffer original
            }
          }

          if (!converted) {
            try {
              const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
              if (result.value && result.value.trim().length > 0) {
                setWordHtml(result.value)
              } else {
                setWordHtml(
                  "<div class='p-8 text-center text-slate-500 italic'>El documento Word está en formato antiguo o protegido. Puedes descargarlo directamente en alta resolución con el botón superior.</div>"
                )
              }
            } catch {
              setWordHtml(
                "<div class='p-8 text-center text-slate-500 italic'>Documento institucional oficial listo para visualización y descarga directa en Word.</div>"
              )
            }
          }
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
  }, [effectiveUrl, typeInfo.isExcel, typeInfo.isWord, fileName])

  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return
    setActiveSheet(sheetName)
    const sheet = workbook.Sheets[sheetName]
    const tableHtml = XLSX.utils.sheet_to_html(sheet, { id: "excel-preview-grid" })
    setExcelHtml(cleanHtmlTable(tableHtml))
  }

  const zoomIn = () => setZoom((prev) => Math.min(prev + 15, 150))
  const zoomOut = () => setZoom((prev) => Math.max(prev - 15, 60))
  const resetZoom = () => setZoom(100)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-slate-500">
        <Loader2 className="h-9 w-9 animate-spin text-[#0E5296]" />
        <p className="text-sm font-semibold text-[#002F6C]">
          Generando vista previa institucional de {typeInfo.isExcel ? "Planilla Excel" : "Documento Word"}...
        </p>
        <span className="text-xs text-slate-400 font-mono">{cleanName}</span>
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
          <h4 className="text-sm font-bold text-slate-800">Visualización interactiva</h4>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
        <div className="flex gap-2 pt-2">
          <a
            href={downloadUrl}
            download={cleanName}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0E5296] hover:bg-[#002F6C] rounded-xl shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#FFB800]" />
            {typeInfo.shortLabel}
          </a>
        </div>
      </div>
    )
  }

  // ── Renderizado Excel de Alta Fidelidad ──
  if (typeInfo.isExcel) {
    return (
      <div className="flex flex-col h-full bg-slate-100/90 select-text">
        {/* Barra de herramientas superior */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 mr-1">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Hojas:</span>
            </span>
            {sheets.map((s) => (
              <button
                key={s}
                onClick={() => handleSheetChange(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeSheet === s
                    ? "bg-[#0E5296] text-[#FFCC00] shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={zoomOut}
              title="Reducir zoom"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-[#002F6C] min-w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              title="Aumentar zoom"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <button
              onClick={resetZoom}
              title="Restablecer al 100%"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer ml-0.5 text-slate-400 hover:text-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Hoja Excel con estilos auténticos */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div
            className="mx-auto transition-transform origin-top bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-300 min-w-fit"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            <div
              className="excel-preview-container text-xs text-slate-800 leading-snug [&_table]:border-collapse [&_table]:border [&_table]:border-slate-400 [&_table]:min-w-full [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:align-middle [&_td]:min-w-[40px] [&_td]:whitespace-pre-wrap [&_td[colspan]]:font-bold [&_td[rowspan]]:align-middle"
              dangerouslySetInnerHTML={{ __html: excelHtml }}
            />
          </div>
        </div>

        {/* Pie de estado y descarga con nombre oficial */}
        <div className="flex items-center justify-between px-6 py-2.5 border-t bg-white text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <strong className="text-slate-800 font-mono truncate max-w-sm">{cleanName}</strong>
            <span className="text-slate-400">• Hoja activa: {activeSheet}</span>
          </span>

          <a
            href={downloadUrl}
            download={cleanName}
            onClick={() => {
              registrarAccionDocumentoAction({
                documentoId: cleanName,
                titulo: title || cleanName,
                accion: "Descargó documento",
              }).catch(() => {})
            }}
            className="inline-flex items-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            {typeInfo.label}
          </a>
        </div>
      </div>
    )
  }

  // ── Renderizado Word de Alta Fidelidad ──
  if (typeInfo.isWord) {
    return (
      <div className="flex flex-col h-full bg-slate-100/90 select-text">
        {/* Barra superior con zoom */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#002F6C]">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Documento Oficial AGBC</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={zoomOut}
              title="Reducir zoom"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-[#002F6C] min-w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              title="Aumentar zoom"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <button
              onClick={resetZoom}
              title="Restablecer"
              className="p-1 hover:bg-white rounded-lg transition-colors cursor-pointer ml-0.5 text-slate-400 hover:text-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Hoja Word tipo documento formal A4 */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div
            className="max-w-4xl mx-auto bg-white p-8 sm:p-14 rounded-2xl shadow-xl border border-slate-300 min-h-[750px] transition-transform origin-top"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div
              className="word-preview-content text-sm text-slate-800 leading-relaxed font-sans
                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-[#002F6C] [&_h1]:text-center [&_h1]:mb-4
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0E5296] [&_h2]:mt-6 [&_h2]:mb-2
                [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-1
                [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-justify
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-5 [&_table]:border [&_table]:border-slate-400 [&_table]:text-xs
                [&_th]:border [&_th]:border-slate-400 [&_th]:p-2.5 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:text-[#002F6C] [&_th]:text-center
                [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-slate-800
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:my-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3
                [&_li]:text-sm [&_li]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          </div>
        </div>

        {/* Barra de estado inferior con descarga oficial */}
        <div className="flex items-center justify-between px-6 py-2.5 border-t bg-white text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <strong className="text-slate-800 font-mono truncate max-w-sm">{cleanName}</strong>
          </span>

          <a
            href={downloadUrl}
            download={cleanName}
            onClick={() => {
              registrarAccionDocumentoAction({
                documentoId: cleanName,
                titulo: title || cleanName,
                accion: "Descargó documento",
              }).catch(() => {})
            }}
            className="inline-flex items-center gap-1.5 font-bold text-white bg-[#0E5296] hover:bg-[#002F6C] px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#FFB800]" />
            {typeInfo.label}
          </a>
        </div>
      </div>
    )
  }

  return null
}
