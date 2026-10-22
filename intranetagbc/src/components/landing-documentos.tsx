"use client"

import { useState, useMemo } from "react"
import {
  FileText,
  Download,
  Eye,
  Search,
  FileIcon,
  FileImage,
  CalendarDays,
  HardDrive,
  XIcon,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ArrowRight,
  BookOpen,
  PlayCircle,
  Building2,
  Briefcase,
  Package,
  Handshake,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DocumentContentViewer } from "@/components/modules/document-content-viewer"
import { getDocumentUrl } from "@/components/modules/documentos-module"
import { DocumentosTourTutorial } from "@/components/documentos-tour-tutorial"
import { registrarAccionDocumentoAction } from "@/actions/auditoria"
import { obtenerFechaOficialDocumento } from "@/lib/documentos-fechas-map"
import { ESTRUCTURA_JERARQUICA, TIPOS_DOCUMENTALES, clasificarDocumento } from "@/lib/documentos-jerarquia"

type Doc = {
  id: string
  titulo: string
  categoriaId: string | null
  categoria: string | null
  direccionId?: string | null
  direccion?: string | null
  subcategoriaId?: string | null
  subcategoria?: string | null
  tipoDocumental?: string | null
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

const ICONOS_DIRECCION: Record<string, any> = {
  "Dirección General Ejecutiva": Building2,
  "Dirección Administrativa Financiera": Briefcase,
  "Dirección de Operaciones": Package,
  "Dirección Comercial": Handshake,
}

export function LandingDocumentos({ documentos }: { documentos: Doc[] }) {
  const docsPublicados = useMemo(
    () => documentos.filter((d) => d.estado === "publicado"),
    [documentos]
  )

  const [direccionActiva, setDireccionActiva] = useState<string | null>(null)
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<string | null>(null)
  const [tipoDocumentalActivo, setTipoDocumentalActivo] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const pageSize = 12

  // Lista de documentos enriquecida con jerarquía si viniera vacía
  const docsEnriquecidos = useMemo(() => {
    return docsPublicados.map((d) => {
      const j = clasificarDocumento(d.archivo || d.nombreArchivo, d.titulo)
      return {
        ...d,
        direccion: d.direccion || j.direccionNombre,
        subcategoria: d.subcategoria || j.subcategoriaNombre,
        tipoDocumental: d.tipoDocumental || j.tipoDocumental,
      }
    })
  }, [docsPublicados])

  if (docsPublicados.length === 0) return null

  // Subcategorías disponibles según la Dirección seleccionada
  const subcategoriasDisponibles = useMemo(() => {
    if (!direccionActiva) {
      // Todas las subcategorías de la estructura
      return ESTRUCTURA_JERARQUICA.flatMap((d) => d.subcategorias.map((s) => ({ ...s, dirNombre: d.nombre })))
    }
    const dir = ESTRUCTURA_JERARQUICA.find((d) => d.nombre === direccionActiva)
    return dir ? dir.subcategorias.map((s) => ({ ...s, dirNombre: dir.nombre })) : []
  }, [direccionActiva])

  // Filtrado de documentos
  const docsFiltrados = docsEnriquecidos.filter((doc) => {
    const coincideDireccion = !direccionActiva || doc.direccion === direccionActiva
    const coincideSubcategoria = !subcategoriaActiva || doc.subcategoria === subcategoriaActiva
    const coincideTipo = !tipoDocumentalActivo || doc.tipoDocumental === tipoDocumentalActivo
    
    const searchLower = busqueda.toLowerCase().trim()
    const coincideBusqueda =
      !searchLower ||
      doc.titulo.toLowerCase().includes(searchLower) ||
      doc.descripcion?.toLowerCase().includes(searchLower) ||
      doc.direccion?.toLowerCase().includes(searchLower) ||
      doc.subcategoria?.toLowerCase().includes(searchLower) ||
      doc.tipoDocumental?.toLowerCase().includes(searchLower) ||
      doc.categoria?.toLowerCase().includes(searchLower) ||
      (doc.nombreArchivo && doc.nombreArchivo.toLowerCase().includes(searchLower))

    return coincideDireccion && coincideSubcategoria && coincideTipo && coincideBusqueda
  })

  const hayFiltrosActivos = !!(direccionActiva || subcategoriaActiva || tipoDocumentalActivo || busqueda)

  function limpiarFiltros() {
    setDireccionActiva(null)
    setSubcategoriaActiva(null)
    setTipoDocumentalActivo(null)
    setBusqueda("")
    setCurrentPage(1)
  }

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
              Catálogo Oficial de Documentos y Normativas
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Estructura organizada por Direcciones, Áreas Operativas y Tipos Documentales Oficiales de la AGBC
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
                  const docFound = docsEnriquecidos.find(d => /personal|induccion|normativa/i.test(d.titulo)) || docsEnriquecidos[0]
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
                  Reglamento Interno de Personal AGBC
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Directrices obligatorias de conducta, régimen laboral, derechos y deberes institucionales.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 2 */}
              <div
                onClick={() => {
                  const docFound = docsEnriquecidos.find(d => /seguridad.*informacion/i.test(d.titulo)) || docsEnriquecidos[1] || docsEnriquecidos[0]
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
                  Política de Seguridad de la Información
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Políticas de confidencialidad, contraseñas y custodia de datos oficiales de la AGBC.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 3 */}
              <div
                onClick={() => {
                  const docFound = docsEnriquecidos.find(d => /organigrama|manual.*organizacional/i.test(d.titulo)) || docsEnriquecidos[2] || docsEnriquecidos[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#002F6C] text-[#FFCC00] text-xs font-black shadow-xs">
                    3
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                    Estructura
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Organigrama y Estructura Institucional
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Conoce las dependencias, líneas de mando y funciones operativas institucionales.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>

              {/* Paso 4 */}
              <div
                onClick={() => {
                  const docFound = docsEnriquecidos.find(d => /etica/i.test(d.titulo)) || docsEnriquecidos[3] || docsEnriquecidos[0]
                  if (docFound) setViewingDoc(docFound)
                }}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E5296] hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] text-xs font-black shadow-xs">
                    4
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                    Ética
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] line-clamp-2">
                  Código de Ética y Transparencia Institucional
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight font-medium">
                  Principios éticos, deberes, derechos y transparencia activa en la AGBC.
                </p>
                <div className="pt-2 flex items-center text-[10px] font-black text-[#0E5296] group-hover:translate-x-1 transition-transform">
                  <span>Consultar documento</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* NAVEGACIÓN Y FILTROS JERÁRQUICOS EN 3 NIVELES                 */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-5 sm:p-6 shadow-sm space-y-5">
            {/* Barra superior con Buscador y Contador */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, área, normativa o palabra clave..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0E5296] focus:bg-white focus:ring-2 focus:ring-[#0E5296]/10 shadow-xs transition-all"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {hayFiltrosActivos && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpiar filtros
                  </button>
                )}
                <span className="text-xs font-black text-[#002F6C] bg-gradient-to-r from-amber-50 to-blue-50 px-3.5 py-1.5 rounded-xl border border-[#002F6C]/15 shadow-2xs">
                  {docsFiltrados.length} documentos encontrados
                </span>
              </div>
            </div>

            {/* NIVEL 1: DIRECCIONES INSTITUCIONALES */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-black text-[#002F6C] uppercase tracking-wider">
                <Building2 className="h-4 w-4 text-[#0E5296]" />
                <span>Nivel 1 • Direcciones Institucionales</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDireccionActiva(null)
                    setSubcategoriaActiva(null)
                    setCurrentPage(1)
                  }}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                    !direccionActiva
                      ? "bg-[#0E5296] text-[#FFCC00] border-[#0E5296] shadow-md shadow-[#0E5296]/20"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/50 hover:text-[#002F6C]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="truncate">Todas</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    !direccionActiva ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {docsEnriquecidos.length}
                  </span>
                </button>

                {ESTRUCTURA_JERARQUICA.map((dir) => {
                  const Icon = ICONOS_DIRECCION[dir.nombre] || Building2
                  const count = docsEnriquecidos.filter((d) => d.direccion === dir.nombre).length
                  const isSelected = direccionActiva === dir.nombre

                  return (
                    <button
                      key={dir.codigo}
                      type="button"
                      onClick={() => {
                        setDireccionActiva(isSelected ? null : dir.nombre)
                        setSubcategoriaActiva(null)
                        setCurrentPage(1)
                      }}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0E5296] text-[#FFCC00] border-[#0E5296] shadow-md shadow-[#0E5296]/20"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/50 hover:text-[#002F6C]"
                      }`}
                      title={dir.descripcion}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{dir.codigo} - {dir.nombre.replace("Dirección ", "")}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* NIVEL 2: SUBCATEGORÍAS / ÁREAS OPERATIVAS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-black text-[#002F6C] uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#0E5296]" />
                  <span>Nivel 2 • Subcategorías {direccionActiva ? `(${direccionActiva})` : "por Dirección"}</span>
                </div>
                {subcategoriaActiva && (
                  <button
                    type="button"
                    onClick={() => { setSubcategoriaActiva(null); setCurrentPage(1); }}
                    className="text-[11px] text-slate-400 hover:text-[#0E5296] cursor-pointer font-bold lowercase"
                  >
                    (quitar filtro de subcategoría)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSubcategoriaActiva(null)
                    setCurrentPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer ${
                    !subcategoriaActiva
                      ? "bg-[#002F6C] text-white border-[#002F6C] shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Todas las Áreas
                </button>

                {subcategoriasDisponibles.map((sub) => {
                  const isSelected = subcategoriaActiva === sub.nombre
                  const count = docsEnriquecidos.filter((d) => 
                    (!direccionActiva || d.direccion === direccionActiva) && d.subcategoria === sub.nombre
                  ).length

                  return (
                    <button
                      key={sub.codigo}
                      type="button"
                      onClick={() => {
                        setSubcategoriaActiva(isSelected ? null : sub.nombre)
                        setCurrentPage(1)
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#002F6C] text-white border-[#002F6C] shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                      title={sub.descripcion}
                    >
                      <span>{sub.nombre}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* NIVEL 3: TIPOS DOCUMENTALES */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-black text-[#002F6C] uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0E5296]" />
                  <span>Nivel 3 • Tipo Documental</span>
                </div>
                {tipoDocumentalActivo && (
                  <button
                    type="button"
                    onClick={() => { setTipoDocumentalActivo(null); setCurrentPage(1); }}
                    className="text-[11px] text-slate-400 hover:text-[#0E5296] cursor-pointer font-bold lowercase"
                  >
                    (quitar filtro de tipo)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTipoDocumentalActivo(null)
                    setCurrentPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer ${
                    !tipoDocumentalActivo
                      ? "bg-[#FFCC00] text-[#002F6C] border-[#FFCC00] shadow-xs font-black"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Todos los Tipos
                </button>

                {TIPOS_DOCUMENTALES.map((tipo) => {
                  const isSelected = tipoDocumentalActivo === tipo
                  const count = docsEnriquecidos.filter((d) => {
                    const matchDir = !direccionActiva || d.direccion === direccionActiva
                    const matchSub = !subcategoriaActiva || d.subcategoria === subcategoriaActiva
                    return matchDir && matchSub && d.tipoDocumental === tipo
                  }).length

                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => {
                        setTipoDocumentalActivo(isSelected ? null : tipo)
                        setCurrentPage(1)
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#FFCC00] text-[#002F6C] border-[#FFCC00] shadow-xs font-black"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{tipo}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-[#002F6C]/20 text-[#002F6C]" : "bg-slate-100 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Grid de Documentos */}
          {paginatedDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-medium bg-card rounded-3xl border border-border/60">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No se encontraron documentos para esta combinación de filtros.</p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#0E5296] font-bold hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {paginatedDocs.map((doc, idx) => {
                const color = getFileColor(doc.tipoArchivo)
                const IconComponent = getFileIcon(doc.tipoArchivo)
                const tamano = formatTamano(doc.tamano)
                const catPalette = getCategoryPalette(doc.tipoDocumental || doc.categoria)
                const priority = getDocPriority(doc.titulo, doc.tipoDocumental || doc.categoria)
                const fechaOficial = obtenerFechaOficialDocumento(doc.nombreArchivo || doc.archivo, doc.titulo)

                return (
                  <div
                    key={doc.id}
                    data-tour-doc={idx}
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
                        {/* Fecha Oficial y tamaño */}
                        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[#002F6C] dark:text-[#FFCC00] font-bold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                            <CalendarDays className="h-3 w-3 text-[#0E5296]" />
                            {fechaOficial}
                          </span>
                          {tamano && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <HardDrive className="h-3 w-3" />
                              {tamano}
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="text-xs sm:text-sm font-black text-[#002F6C] dark:text-foreground line-clamp-2 leading-snug group-hover:text-[#0E5296] transition-colors min-h-[2.5rem]">
                          {doc.titulo}
                        </h3>

                        {/* Jerarquía en Badges: Dirección / Sub-área / Tipo */}
                        <div className="pt-1 flex flex-wrap items-center justify-center gap-1">
                          {doc.direccion && (
                            <span className="inline-flex items-center rounded-md bg-[#002F6C]/10 text-[#002F6C] px-2 py-0.5 text-[9.5px] font-black">
                              {doc.direccion.replace("Dirección ", "")}
                            </span>
                          )}
                          {doc.subcategoria && (
                            <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[9.5px] font-bold border border-slate-200">
                              {doc.subcategoria}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-black ${catPalette.pill}`}>
                            {doc.tipoDocumental || doc.categoria || "Normativa"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer con el Ojito */}
                    <div className="p-4 pt-2 flex items-center justify-between border-t border-border/40 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Documento Oficial
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingDoc(doc)
                            registrarAccionDocumentoAction({
                              documentoId: doc.id,
                              titulo: doc.titulo,
                              accion: "Visualizó documento",
                            })
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0E5296] dark:text-[#FFCC00] hover:bg-[#0E5296] hover:text-white dark:hover:bg-[#FFCC00] dark:hover:text-[#002F6C] transition-all cursor-pointer shadow-xs border border-blue-200 dark:border-blue-900"
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
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
                Página {currentPage} de {totalPages} ({docsFiltrados.length} documentos encontrados)
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
              const fechaOficial = obtenerFechaOficialDocumento(viewingDoc.nombreArchivo || viewingDoc.archivo, viewingDoc.titulo)

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
                      <div className="mt-0.5 flex items-center gap-2.5 text-xs text-muted-foreground font-medium flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-[#002F6C] dark:text-[#FFCC00]">
                          <CalendarDays className="h-3 w-3 text-[#0E5296]" />
                          {fechaOficial}
                        </span>
                        {viewingDoc.direccion && (
                          <span className="rounded-md bg-[#002F6C]/10 text-[#002F6C] px-2 py-0.5 text-[10px] font-black">
                            {viewingDoc.direccion}
                          </span>
                        )}
                        {viewingDoc.subcategoria && (
                          <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                            {viewingDoc.subcategoria}
                          </span>
                        )}
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${getCategoryPalette(viewingDoc.tipoDocumental || viewingDoc.categoria).pill}`}>
                          {viewingDoc.tipoDocumental || viewingDoc.categoria}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {viewingDoc.archivo && (
                        <a
                          href={downloadUrl}
                          download={viewingDoc.nombreArchivo || viewingDoc.titulo}
                          onClick={() => {
                            registrarAccionDocumentoAction({
                              documentoId: viewingDoc.id,
                              titulo: viewingDoc.titulo,
                              accion: "Descargó documento",
                            })
                          }}
                        >
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
        onSelectDoc={(query: string) => {
          const doc = docsEnriquecidos.find(d => d.titulo.toLowerCase().includes(query.toLowerCase()) || (d.categoria && d.categoria.toLowerCase().includes(query.toLowerCase()))) || docsEnriquecidos[0]
          if (doc) setViewingDoc(doc)
        }}
      />
    </>
  )
}
