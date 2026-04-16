"use client"

import { useState } from "react"
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
  const docsPublicados = documentos.filter((d) => d.estado === "publicado")
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null)

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

  // Colores únicos por categoría
  const CATEGORY_PALETTES = [
    { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-400/30", pill: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: "text-blue-500", gradient: "from-blue-500 to-blue-600" },
    { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-400/30", pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: "text-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
    { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-400/30", pill: "bg-violet-500/15 text-violet-700 dark:text-violet-400", icon: "text-violet-500", gradient: "from-violet-500 to-violet-600" },
    { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-400/30", pill: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
    { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-400/30", pill: "bg-rose-500/15 text-rose-700 dark:text-rose-400", icon: "text-rose-500", gradient: "from-rose-500 to-rose-600" },
    { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-400/30", pill: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400", icon: "text-cyan-500", gradient: "from-cyan-500 to-cyan-600" },
    { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-400/30", pill: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400", icon: "text-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
    { bg: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-400", border: "border-pink-400/30", pill: "bg-pink-500/15 text-pink-700 dark:text-pink-400", icon: "text-pink-500", gradient: "from-pink-500 to-pink-600" },
    { bg: "bg-teal-500/10", text: "text-teal-700 dark:text-teal-400", border: "border-teal-400/30", pill: "bg-teal-500/15 text-teal-700 dark:text-teal-400", icon: "text-teal-500", gradient: "from-teal-500 to-teal-600" },
    { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-400/30", pill: "bg-orange-500/15 text-orange-700 dark:text-orange-400", icon: "text-orange-500", gradient: "from-orange-500 to-orange-600" },
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
    <section id="documentos" className="border-y border-border/40 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
            <FileText className="h-3.5 w-3.5" />
            Documentos
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Documentos Institucionales
          </h2>
          <p className="mt-3 text-muted-foreground">
            Documentos publicados disponibles para descarga y consulta.
          </p>
        </div>

        {/* Barra de filtros */}
        <div className="mb-8 space-y-4">
          {/* Búsqueda */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-card pl-11 pr-4 py-3 text-sm shadow-sm transition-all focus:border-[#FFB300]/50 focus:outline-none focus:ring-2 focus:ring-[#FFB300]/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filtros por categoría */}
          {categorias.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              <button
                onClick={() => setCategoriaActiva(null)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  !categoriaActiva
                    ? "bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Todos ({docsPublicados.length})
              </button>
              {categorias.map((cat) => {
                const count = docsPublicados.filter((d) => d.categoria === cat).length
                const palette = getCategoryPalette(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(categoriaActiva === cat ? null : cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      categoriaActiva === cat
                        ? `bg-gradient-to-r ${palette.gradient} text-white shadow-md`
                        : `${palette.bg} ${palette.text} hover:opacity-80`
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Grid de documentos */}
        {docsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No se encontraron documentos</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {docsFiltrados.map((doc) => {
              const color = getFileColor(doc.tipoArchivo)
              const IconComponent = getFileIcon(doc.tipoArchivo)
              const tamano = formatTamano(doc.tamano)
              const fecha = formatFecha(doc.createdAt)
              const catPalette = getCategoryPalette(doc.categoria)

              return (
                <div
                  key={doc.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 ${catPalette.border} bg-card transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1`}
                >
                  {/* Icono de tipo de archivo */}
                  <div className="flex items-center justify-center pt-8 pb-4">
                    <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl ${catPalette.bg} transition-transform duration-300 group-hover:scale-110`}>
                      <IconComponent className={`h-10 w-10 ${catPalette.icon}`} />
                      {/* Badge de tipo */}
                      <span className={`absolute -bottom-1 -right-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${color.bg} ${color.text} border border-current/10`}>
                        {color.label}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-5 pb-2 space-y-3 text-center">
                    {/* Fecha y tamaño */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      {fecha && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {fecha}
                        </span>
                      )}
                      {tamano && (
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {tamano}
                        </span>
                      )}
                    </div>

                    {/* Título */}
                    <h3 className="text-sm font-bold leading-snug line-clamp-3 min-h-[3.25rem]">
                      {doc.titulo}
                    </h3>

                    {/* Categoría */}
                    {doc.categoria && (
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${catPalette.pill}`}>
                        {doc.categoria}
                      </span>
                    )}
                  </div>

                  {/* Botones de acción */}
                  {doc.archivo && (
                    <div className="flex items-center gap-2 px-5 pb-5 pt-3">
                      <Button
                        size="sm"
                        onClick={() => setViewingDoc(doc)}
                        className={`flex-1 rounded-xl bg-gradient-to-r ${catPalette.gradient} text-white border-0 font-bold shadow-md hover:shadow-lg transition-all h-10 text-xs gap-2`}
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      <a
                        href={doc.archivo}
                        download={doc.nombreArchivo || doc.titulo}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full rounded-xl font-bold h-10 text-xs gap-2 ${catPalette.border} ${catPalette.text} hover:${catPalette.bg} transition-all`}
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Contador */}
        {docsFiltrados.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{docsFiltrados.length}</span> de{" "}
              <span className="font-semibold text-foreground">{docsPublicados.length}</span> documentos
            </p>
          </div>
        )}
      </div>
    </section>

    {/* ── Modal visor de documentos ── */}
    {viewingDoc && (
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="h-[93vh] !w-[95vw] max-h-[93vh] !max-w-[95vw] sm:!max-w-[94vw] lg:!max-w-[90vw] xl:!max-w-[86vw] 2xl:!max-w-[1500px] !gap-0 !grid !grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl dark:bg-zinc-900 [&>button]:hidden">
          <DialogTitle className="sr-only">{viewingDoc.titulo}</DialogTitle>

          {/* Barra tricolor superior */}
          <div className="flex h-2 w-full shrink-0">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/20 bg-white/90 px-4 py-2.5 dark:bg-zinc-900/90">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-sm font-bold tracking-tight md:text-base">{viewingDoc.titulo}</h3>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                {viewingDoc.createdAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatFecha(viewingDoc.createdAt)}
                  </span>
                )}
                {viewingDoc.categoria && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getCategoryPalette(viewingDoc.categoria).pill}`}>
                    {viewingDoc.categoria}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              {viewingDoc.archivo && (
                <a href={viewingDoc.archivo} download={viewingDoc.nombreArchivo || viewingDoc.titulo}>
                  <Button size="sm" className="rounded-lg bg-[#C41E3A] text-white hover:bg-[#a01830]">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </a>
              )}
              <button
                onClick={() => setViewingDoc(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-white transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {viewingDoc.archivo && viewingDoc.tipoArchivo?.includes("pdf") ? (
              <iframe
                src={viewingDoc.archivo}
                title={viewingDoc.titulo}
                className="w-full h-full border-0 rounded-b-2xl"
              />
            ) : viewingDoc.archivo && viewingDoc.tipoArchivo && ["jpg", "jpeg", "png", "webp", "gif"].some(ext => viewingDoc.tipoArchivo!.includes(ext)) ? (
              <div className="h-full flex items-start justify-center overflow-auto rounded-b-2xl border border-border/30 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-2">
                <img
                  src={viewingDoc.archivo}
                  alt={viewingDoc.titulo}
                  className="block max-h-[calc(93vh-140px)] w-full max-w-[1180px] object-contain object-top"
                  draggable={false}
                />
              </div>
            ) : viewingDoc.archivo ? (
              <iframe
                src={viewingDoc.archivo}
                title={viewingDoc.titulo}
                className="w-full h-full border-0 rounded-b-2xl"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-16 w-16 mb-4 text-muted-foreground/30" />
                <p className="font-bold text-lg">{viewingDoc.titulo}</p>
                {viewingDoc.descripcion && (
                  <p className="mt-2 text-sm text-muted-foreground max-w-lg">{viewingDoc.descripcion}</p>
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
