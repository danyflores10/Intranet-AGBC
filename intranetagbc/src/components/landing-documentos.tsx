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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

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

export function LandingDocumentos({ documentos }: { documentos: Doc[] }) {
  const docsPublicados = useMemo(
    () => documentos.filter((d) => d.estado === "publicado"),
    [documentos]
  )
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null)
  const pageSize = 12 // 3 filas de 4 columnas

  if (docsPublicados.length === 0) return null

  // Obtener categorías únicas
  const categorias = Array.from(
    new Map(
      docsPublicados
        .filter((d) => d.categoria)
        .map((d) => [d.categoria!, d.categoria!])
    ).values()
  ).sort()

  // Filtrar docs
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
    if (!tipo) return { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: "text-slate-500", label: "Archivo" }
    if (tipo.includes("pdf")) return { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", icon: "text-red-500", label: "PDF" }
    if (["jpg", "jpeg", "png", "webp", "gif"].some(ext => tipo.includes(ext)) || tipo.startsWith("image/")) return { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-500", label: "Imagen" }
    if (["doc", "docx"].some(ext => tipo.includes(ext)) || tipo.includes("word")) return { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", icon: "text-blue-500", label: "Word" }
    if (["xls", "xlsx"].some(ext => tipo.includes(ext)) || tipo.includes("excel")) return { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-400", icon: "text-green-500", label: "Excel" }
    return { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: "text-slate-500", label: "Archivo" }
  }

  // Colores por categoría
  const CATEGORY_PALETTES = [
    { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-400/30", pill: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: "text-blue-500", gradient: "from-blue-500 to-blue-600" },
    { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-400/30", pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: "text-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
    { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-400/30", pill: "bg-violet-500/15 text-violet-700 dark:text-violet-400", icon: "text-violet-500", gradient: "from-violet-500 to-violet-600" },
    { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-400/30", pill: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
    { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-400/30", pill: "bg-rose-500/15 text-rose-700 dark:text-rose-400", icon: "text-rose-500", gradient: "from-rose-500 to-rose-600" },
    { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-400/30", pill: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400", icon: "text-cyan-500", gradient: "from-cyan-500 to-cyan-600" },
    { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-400/30", pill: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400", icon: "text-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
  ]

  const categoryColorMap = new Map<string, typeof CATEGORY_PALETTES[0]>()
  categorias.forEach((cat, i) => {
    categoryColorMap.set(cat, CATEGORY_PALETTES[i % CATEGORY_PALETTES.length])
  })

  function getCategoryPalette(categoria: string | null) {
    if (!categoria) return CATEGORY_PALETTES[0]
    return categoryColorMap.get(categoria) ?? CATEGORY_PALETTES[0]
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
              Normativas, formularios, manuales y reglamentos oficiales disponibles para descarga
            </p>
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

          {/* Grid 3 Filas x 4 Columnas (12 Documentos por página) */}
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

                return (
                  <div
                    key={doc.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border-2 border-border/60 shadow-xs hover:shadow-xl hover:shadow-[#0E5296]/10 hover:border-[#0E5296]/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div>
                      {/* Icono de tipo de archivo con badge */}
                      <div className="flex items-center justify-center pt-6 pb-3">
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
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card text-[#002F6C] dark:text-foreground shadow-xs hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === idx + 1
                          ? "bg-[#0E5296] text-white shadow-xs"
                          : "bg-card text-muted-foreground hover:bg-muted border border-border/60"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card text-[#002F6C] dark:text-foreground shadow-xs hover:bg-muted disabled:opacity-30 cursor-pointer transition-colors"
                  title="Siguiente página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <span className="text-[11px] font-medium text-muted-foreground">
                Página {currentPage} de {totalPages} • Mostrando{" "}
                {Math.min(docsFiltrados.length, (currentPage - 1) * pageSize + 1)} -{" "}
                {Math.min(docsFiltrados.length, currentPage * pageSize)} de{" "}
                {docsFiltrados.length} documentos
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Modal Visor de Documentos con el Ojito ── */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="h-[93vh] !w-[95vw] max-h-[93vh] !max-w-[95vw] sm:!max-w-[94vw] lg:!max-w-[90vw] xl:!max-w-[86vw] 2xl:!max-w-[1500px] !gap-0 !grid !grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-3xl border-2 border-[#002F6C]/15 bg-white p-0 shadow-2xl dark:bg-zinc-900 [&>button]:hidden">
            <DialogTitle className="sr-only">{viewingDoc.titulo}</DialogTitle>

            {/* Barra superior con gradiente Amarillo a Azul */}
            <div className="h-2 w-full shrink-0 bg-gradient-to-r from-[#FFCC00] via-[#0077EE] to-[#0E5296]" />

            {/* Header */}
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
                  <a href={viewingDoc.archivo} download={viewingDoc.nombreArchivo || viewingDoc.titulo}>
                    <Button size="sm" className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs shadow-xs">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
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
              {viewingDoc.archivo && viewingDoc.tipoArchivo?.includes("pdf") ? (
                <iframe
                  src={viewingDoc.archivo}
                  title={viewingDoc.titulo}
                  className="w-full h-full border-0 rounded-b-3xl"
                />
              ) : viewingDoc.archivo && viewingDoc.tipoArchivo && ["jpg", "jpeg", "png", "webp", "gif"].some(ext => viewingDoc.tipoArchivo!.includes(ext)) ? (
                <div className="h-full flex items-start justify-center overflow-auto rounded-b-3xl border border-border/30 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-3">
                  <img
                    src={viewingDoc.archivo}
                    alt={viewingDoc.titulo}
                    className="block max-h-[calc(93vh-140px)] w-full max-w-[1180px] object-contain object-top rounded-xl"
                    draggable={false}
                  />
                </div>
              ) : viewingDoc.archivo ? (
                <iframe
                  src={viewingDoc.archivo}
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
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

