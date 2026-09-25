"use client"

import { useState, useMemo } from "react"
import {
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  FileIcon,
  FileImage,
  CalendarDays,
  HardDrive,
  XIcon,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  PlayCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DocumentContentViewer } from "@/components/modules/document-content-viewer"
import { getDocumentUrl } from "@/components/modules/documentos-module"
import { DocumentosTourTutorial } from "@/components/documentos-tour-tutorial"

type Doc = {
  id: string
  titulo: string
  categoriaId: string | null
  categoria: string | null
  autor: string | null
  estado: string
  archivo: string | null
  nombreArchivo: string | null
  tipoArchivo: string | null
  tamano: string | null
  descripcion: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

function buildPagination(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total]
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total]
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

function getDocPriority(titulo?: string | null, categoria?: string | null) {
  const text = `${titulo || ""} ${categoria || ""}`.toLowerCase()
  if (/instructivo|induccion|seguridad|normativa|politica|contrasenia/i.test(text)) {
    return {
      label: "Prioridad Alta",
      dot: "🔴",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    }
  }
  if (/reglamento|manual|procedimiento|operativo|correspondencia|circular/i.test(text)) {
    return {
      label: "Prioridad Media",
      dot: "🟡",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    }
  }
  return {
    label: "Consulta General",
    dot: "🟢",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
}

export function LandingDocumentos({ documentos }: { documentos: Doc[] }) {
  const docsPublicados = useMemo(
    () => documentos.filter((d) => d.estado === "publicado"),
    [documentos]
  )
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const pageSize = 12

  if (docsPublicados.length === 0) return null

  const categorias = Array.from(
    new Map(
      docsPublicados
        .filter((d) => d.categoria)
        .map((d) => [d.categoria!, d.categoria!])
    ).values()
  ).sort()

  const docsFiltrados = docsPublicados.filter((doc) => {
    const coincideCategoria = !categoriaActiva || doc.categoria === categoriaActiva
    const coincideBusqueda =
      !busqueda ||
      doc.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      doc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      doc.categoria?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  const totalPages = Math.max(1, Math.ceil(docsFiltrados.length / pageSize))
  const paginatedDocs = docsFiltrados.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  function formatTamano(tamano: string | null) {
    if (!tamano) return null
    const n = +tamano
    if (!n || n <= 0 || isNaN(n)) return null
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatFecha(fecha: Date | null) {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  function getFileIcon(tipo: string | null) {
    if (!tipo) return FileIcon
    if (tipo.includes("pdf")) return FileText
    if (["jpg", "jpeg", "png", "webp", "gif"].some(ext => tipo.includes(ext)) || tipo.startsWith("image/")) return FileImage
    return FileIcon
  }

  function getFileColor(tipo: string | null) {
    if (!tipo) return { label: "DOC", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" }
    if (tipo.includes("pdf")) return { label: "PDF", bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-600 dark:text-red-400" }
    if (["jpg", "jpeg", "png", "webp", "gif"].some(ext => tipo.includes(ext)) || tipo.startsWith("image/")) return { label: "IMG", bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400" }
    if (tipo.includes("word") || tipo.includes("doc")) return { label: "DOCX", bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-600 dark:text-blue-400" }
    if (tipo.includes("excel") || tipo.includes("sheet") || tipo.includes("csv")) return { label: "XLSX", bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400" }
    return { label: "FILE", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" }
  }

  function getCategoryPalette(categoria: string | null) {
    const defaultColor = {
      bg: "bg-[#0E5296]/10 dark:bg-[#0E5296]/20",
      icon: "text-[#0E5296] dark:text-[#FFCC00]",
      pill: "bg-[#0E5296]/10 text-[#0E5296] dark:bg-[#0E5296]/25 dark:text-[#FFCC00]",
    }

    if (!categoria) return defaultColor

    const c = categoria.toLowerCase()
    if (c.includes("comunicado")) {
      return {
        bg: "bg-blue-100 dark:bg-blue-950/40",
        icon: "text-blue-600 dark:text-blue-400",
        pill: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      }
    }
    if (c.includes("resoluc")) {
      return {
        bg: "bg-purple-100 dark:bg-purple-950/40",
        icon: "text-purple-600 dark:text-purple-400",
        pill: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
      }
    }
    if (c.includes("manual")) {
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/40",
        icon: "text-emerald-600 dark:text-emerald-400",
        pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      }
    }
    if (c.includes("reglamento")) {
      return {
        bg: "bg-amber-100 dark:bg-amber-950/40",
        icon: "text-amber-700 dark:text-amber-400",
        pill: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
      }
    }
    if (c.includes("formulari")) {
      return {
        bg: "bg-cyan-100 dark:bg-cyan-950/40",
        icon: "text-cyan-600 dark:text-cyan-400",
        pill: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
      }
    }
    if (c.includes("instructiv")) {
      return {
        bg: "bg-red-100 dark:bg-red-950/40",
        icon: "text-red-600 dark:text-red-400",
        pill: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
      }
    }

    return defaultColor
  }

  return (
    <>
      <section id="documentos" className="border-y border-border/40 bg-gradient-to-b from-background via-slate-50/40 to-muted/20 py-16 md:py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCC00]/40 bg-[#FFCC00]/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#002F6C] dark:text-[#FFCC00]">
              <FileText className="h-3.5 w-3.5 text-[#0E5296] dark:text-[#FFCC00]" />
              Biblioteca Digital
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-[#002F6C] dark:text-foreground">
              Documentos Institucionales
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Normativas, instructivos, manuales y reglamentos oficiales disponibles para consulta y descarga
            </p>
          </div>

          {/* ── GUÍA PASO A PASO: RUTA DE DOCUMENTOS PRIORITARIOS ── */}
          <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-white via-blue-50/30 to-amber-50/20 p-5 sm:p-7 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#002F6C] text-[#FFCC00] shadow-md">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#002F6C] flex items-center gap-2">
                    Guía Paso a Paso • Documentos y Normativas Prioritarias
                    <span className="rounded-full bg-[#FFB800]/20 px-2.5 py-0.5 text-[10px] font-black text-[#002F6C] border border-[#FFB800]/40">
                      Ruta Oficial
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Secuencia recomendada de lectura para todo el personal de la Agencia Boliviana de Correos
                  </p>
                </div>
              </div>

              {/* Botón de Lanzamiento de Tutorial Interactivo */}
              <Button
                type="button"
                onClick={() => setTourOpen(true)}
                className="rounded-2xl bg-[#002F6C] hover:bg-[#0E5296] text-white font-black text-xs gap-2 shadow-md shadow-[#002F6C]/20 hover:scale-105 transition-all cursor-pointer"
              >
                <PlayCircle className="h-4 w-4 text-[#FFCC00]" />
                <span>Ver Tutorial Interactivo</span>
              </Button>
            </div>

            {/* Grid de Pasos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Paso 1 */}
              <div
                onClick={() => {
                  const docFound = docsPublicados.find(d => /instructivo|induccion|normativa/i.test(d.titulo)) || docsPublicados[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#002F6C] text-[#FFCC00] text-xs font-black shadow-xs">
                    1
                  </span>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-black text-red-700 border border-red-200">
                    Prioridad Alta
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Instructivo General de Inducción & Normativa Postal
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Directrices obligatorias de conducta, seguridad y deberes institucionales.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 2 */}
              <div
                onClick={() => {
                  const docFound = docsPublicados.find(d => /seguridad|manual|sistema/i.test(d.titulo)) || docsPublicados[1] || docsPublicados[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0E5296] text-white text-xs font-black shadow-xs">
                    2
                  </span>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-black text-red-700 border border-red-200">
                    Prioridad Alta
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Manual de Seguridad de la Información y Credenciales
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Políticas de confidencialidad, contraseñas y custodia de datos de usuarios.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 3 */}
              <div
                onClick={() => {
                  const docFound = docsPublicados.find(d => /correspondencia|reglamento|operativo/i.test(d.titulo)) || docsPublicados[2] || docsPublicados[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFB800] text-[#002F6C] text-xs font-black shadow-xs">
                    3
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                    Prioridad Media
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Reglamento Operativo de Correspondencia y Logística
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Procedimientos estándar de admisión, clasificación, despacho y entrega postal.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 4 */}
              <div
                onClick={() => {
                  const docFound = docsPublicados.find(d => /etica|personal|reglamento interno/i.test(d.titulo)) || docsPublicados[3] || docsPublicados[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] text-xs font-black shadow-xs">
                    4
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                    Consulta General
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Código de Ética y Reglamento Interno de Personal
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Principios éticos, deberes, derechos y convivencia institucional de la AGBC.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de filtros y categorías */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar documento..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-2xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#0E5296] focus:ring-2 focus:ring-[#0E5296]/10 shadow-xs transition-all"
                />
              </div>

              <span className="text-xs font-bold text-[#0E5296] dark:text-[#FFCC00] bg-[#0E5296]/10 px-3.5 py-1.5 rounded-full border border-[#0E5296]/20 shadow-xs">
                {docsFiltrados.length} Documentos publicados
              </span>
            </div>

            {/* Categorías */}
            {categorias.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaActiva(null)
                    setCurrentPage(1)
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    !categoriaActiva
                      ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/20"
                      : "bg-card text-muted-foreground hover:bg-[#FFCC00]/20 hover:text-[#002F6C] border border-border/60"
                  }`}
                >
                  Todos ({docsPublicados.length})
                </button>
                {categorias.map((cat) => {
                  const count = docsPublicados.filter((d) => d.categoria === cat).length
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoriaActiva(categoriaActiva === cat ? null : cat)
                        setCurrentPage(1)
                      }}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        categoriaActiva === cat
                          ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/20"
                          : "bg-card text-muted-foreground hover:bg-[#FFCC00]/20 hover:text-[#002F6C] border border-border/60"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Grid 3 Filas x 4 Columnas con Badge de Prioridad en cada Card */}
          {paginatedDocs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground font-medium bg-card rounded-3xl border border-border/60">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              No se encontraron documentos que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {paginatedDocs.map((doc) => {
                const color = getFileColor(doc.tipoArchivo)
                const IconComponent = getFileIcon(doc.tipoArchivo)
                const tamano = formatTamano(doc.tamano)
                const fecha = formatFecha(doc.createdAt)
                const catPalette = getCategoryPalette(doc.categoria)
                const priority = getDocPriority(doc.titulo, doc.categoria)

                return (
                  <div
                    key={doc.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border-2 border-border/60 shadow-xs hover:shadow-xl hover:shadow-[#0E5296]/10 hover:border-[#0E5296]/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Badge de Prioridad en la Esquina Superior Derecha */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black border shadow-2xs ${priority.badgeClass}`}>
                        <span>{priority.dot}</span>
                        <span>{priority.label}</span>
                      </span>
                    </div>

                    <div>
                      {/* Icono de tipo de archivo con badge */}
                      <div className="flex items-center justify-center pt-8 pb-3">
                        <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${catPalette.bg} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
                          <IconComponent className={`h-8 w-8 ${catPalette.icon}`} />
                          <span className={`absolute -bottom-1 -right-1 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${color.bg} ${color.text} border border-current/10 shadow-2xs`}>
                            {color.label}
                          </span>
                        </div>
                      </div>

                      {/* Info del Documento */}
                      <div className="px-4 pb-2 space-y-2 text-center">
                        {/* Fecha y tamaño */}
                        <div className="flex items-center justify-center gap-2.5 text-[11px] text-muted-foreground font-medium">
                          {fecha && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 text-[#0E5296] dark:text-[#FFCC00]" />
                              {fecha}
                            </span>
                          )}
                          {tamano && (
                            <span className="inline-flex items-center gap-1">
                              <HardDrive className="h-3 w-3 text-muted-foreground" />
                              {tamano}
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="text-xs sm:text-sm font-black text-[#002F6C] dark:text-foreground line-clamp-2 leading-snug group-hover:text-[#0E5296] transition-colors min-h-[2.5rem]">
                          {doc.titulo}
                        </h3>

                        {/* Categoría */}
                        {doc.categoria && (
                          <div className="pt-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${catPalette.pill}`}>
                              {doc.categoria}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer con el Ojito */}
                    <div className="p-4 pt-2 flex items-center justify-between border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                        Documento
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0E5296] dark:text-[#FFCC00] hover:bg-[#0E5296] hover:text-white dark:hover:bg-[#FFCC00] dark:hover:text-[#002F6C] transition-all cursor-pointer shadow-xs border border-blue-200 dark:border-blue-900"
                        title="Ver documento"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación Centrada */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-2 pt-4 border-t border-border/40 text-center">
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl px-2 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {buildPagination(currentPage, totalPages).map((p, idx) => {
                  if (p === "ellipsis") {
                    return (
                      <span key={`el-${idx}`} className="px-2 text-xs text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(p)}
                      className={`h-8 w-8 rounded-xl p-0 text-xs font-bold ${
                        p === currentPage ? "bg-[#0E5296] hover:bg-[#002F6C] text-white" : ""
                      }`}
                    >
                      {p}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl px-2 text-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground font-medium">
                Página {currentPage} de {totalPages} ({docsFiltrados.length} documentos en total)
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── MODAL DEL VISUALIZADOR DE DOCUMENTO CON ACCESIBILIDAD RADIX ── */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
          <DialogContent className="max-w-5xl h-[92vh] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/40 shadow-2xl">
            {(() => {
              const fileEffectiveUrl = getDocumentUrl(viewingDoc.archivo)
              const downloadUrl = fileEffectiveUrl

              const t = (viewingDoc.tipoArchivo || "").toLowerCase()
              const fileUrl = (viewingDoc.archivo || "").toLowerCase()
              const fileName = (viewingDoc.nombreArchivo || "").toLowerCase()

              const isPdf = t.includes("pdf") || fileUrl.endsWith(".pdf") || fileName.endsWith(".pdf")
              const isImage = ["jpg", "jpeg", "png", "webp", "gif"].some(ext => t.includes(ext) || fileUrl.endsWith("." + ext) || fileName.endsWith("." + ext))
              const isExcel = t.includes("xls") || t.includes("sheet") || t.includes("csv") || fileUrl.endsWith(".xlsx") || fileUrl.endsWith(".xls") || fileUrl.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")
              const isWord = t.includes("doc") || t.includes("word") || fileUrl.endsWith(".docx") || fileUrl.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".doc")

              return (
                <>
                  {/* Header accesible Radix UI */}
                  <DialogHeader className="sr-only">
                    <DialogTitle>{viewingDoc.titulo}</DialogTitle>
                    <DialogDescription>{viewingDoc.descripcion || "Visualizador oficial de documentos AGBC"}</DialogDescription>
                  </DialogHeader>

                  {/* Header visual */}
                  <div className="flex items-center justify-between border-b border-border/20 bg-white/90 px-4 py-3 dark:bg-zinc-900/90">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-black text-[#002F6C] dark:text-white tracking-tight md:text-base">
                        {viewingDoc.titulo}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        {viewingDoc.createdAt && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-[#0E5296] dark:text-[#FFCC00]" />
                            {formatFecha(viewingDoc.createdAt)}
                          </span>
                        )}
                        {viewingDoc.categoria && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getCategoryPalette(viewingDoc.categoria).pill}`}>
                            {viewingDoc.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {viewingDoc.archivo && (
                        <a href={downloadUrl} download={viewingDoc.nombreArchivo || viewingDoc.titulo}>
                          <Button size="sm" className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs shadow-xs cursor-pointer">
                            <Download className="mr-1.5 h-3.5 w-3.5 text-[#FFCC00]" />
                            Descargar
                          </Button>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingDoc(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-white transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-foreground"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido / Visualizador */}
                  <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/10">
                    {isPdf ? (
                      <iframe
                        src={fileEffectiveUrl}
                        title={viewingDoc.titulo}
                        className="w-full h-full border-0 rounded-b-3xl"
                      />
                    ) : isImage ? (
                      <div className="h-full flex items-start justify-center overflow-auto rounded-b-3xl border border-border/30 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-3">
                        <img
                          src={fileEffectiveUrl}
                          alt={viewingDoc.titulo}
                          className="block max-h-[calc(93vh-140px)] w-full max-w-[1180px] object-contain object-top rounded-xl"
                          draggable={false}
                        />
                      </div>
                    ) : (isExcel || isWord) ? (
                      <DocumentContentViewer
                        url={fileEffectiveUrl}
                        fileName={viewingDoc.nombreArchivo ?? viewingDoc.titulo}
                        title={viewingDoc.titulo}
                        tipoArchivo={viewingDoc.tipoArchivo}
                      />
                    ) : viewingDoc.archivo ? (
                      <iframe
                        src={fileEffectiveUrl}
                        title={viewingDoc.titulo}
                        className="w-full h-full border-0 rounded-b-3xl"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <FileText className="h-16 w-16 mb-4 text-muted-foreground/30" />
                        <p className="font-bold text-lg">{viewingDoc.titulo}</p>
                        {viewingDoc.descripcion && (
                          <p className="mt-2 text-sm text-muted-foreground max-w-lg font-medium">{viewingDoc.descripcion}</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* ── TOUR TUTORIAL INTERACTIVO ONBOARDING PASO A PASO ── */}
      <DocumentosTourTutorial
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onSelectDoc={(query) => {
          const doc = docsPublicados.find(d => d.titulo.toLowerCase().includes(query.toLowerCase()) || (d.categoria && d.categoria.toLowerCase().includes(query.toLowerCase()))) || docsPublicados[0]
          if (doc) setViewingDoc(doc)
        }}
      />
    </>
  )
}
