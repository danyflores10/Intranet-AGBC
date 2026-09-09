"use client"

import { useState, useMemo } from "react"
import {
  Globe,
  Lock,
  Search,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AccesoDirecto {
  clave: string
  titulo: string
  descripcion: string | null
  url: string
  imagen: string | null
}

export function LandingAccesos({ accesos }: { accesos: AccesoDirecto[] }) {
  const [busqueda, setBusqueda] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAcceso, setSelectedAcceso] = useState<AccesoDirecto | null>(null)
  const pageSize = 12

  const accesosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return accesos
    return accesos.filter(
      (a) =>
        a.titulo.toLowerCase().includes(q) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(q)) ||
        a.url.toLowerCase().includes(q)
    )
  }, [accesos, busqueda])

  const totalPages = Math.max(1, Math.ceil(accesosFiltrados.length / pageSize))
  const paginatedList = accesosFiltrados.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (accesos.length === 0) return null

  return (
    <section id="aplicaciones" className="border-y border-border/40 bg-gradient-to-b from-muted/20 via-slate-50/50 to-background py-16 md:py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Encabezado */}
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCC00]/40 bg-[#FFCC00]/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#002F6C] dark:text-[#FFCC00]">
            <Globe className="h-3.5 w-3.5 text-[#0E5296] dark:text-[#FFCC00]" />
            Sistemas & Aplicaciones
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-[#002F6C] dark:text-foreground">
            Acceso Rápido a Sistemas
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Plataformas, portales y herramientas institucionales disponibles para el personal
          </p>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar sistema o aplicación..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border/60 rounded-2xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#0E5296] focus:ring-2 focus:ring-[#0E5296]/10 shadow-xs transition-all"
            />
          </div>

          <span className="text-xs font-bold text-[#0E5296] dark:text-[#FFCC00] bg-[#0E5296]/10 px-3.5 py-1.5 rounded-full border border-[#0E5296]/20 shadow-xs">
            {accesosFiltrados.length} Sistemas disponibles
          </span>
        </div>

        {/* Grid 3 Filas x 4 Columnas (12 Sistemas por página) */}
        {paginatedList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground font-medium bg-card rounded-3xl border border-border/60">
            No se encontraron sistemas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedList.map((acceso) => (
              <div
                key={acceso.clave}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border-2 border-border/60 shadow-xs hover:shadow-xl hover:shadow-[#0E5296]/10 hover:border-[#0E5296]/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Previsualización de Imagen / Banner */}
                  {acceso.imagen?.trim() ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border/40 bg-muted/30">
                      <img
                        src={acceso.imagen}
                        alt={acceso.titulo}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#002F6C]/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
                        Sistema
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex aspect-[16/9] w-full items-center justify-center border-b border-border/40 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-zinc-800 dark:to-zinc-900">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md shadow-[#0E5296]/20 transition-transform group-hover:scale-110 duration-300">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-[#002F6C]/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
                        Sistema
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-black tracking-tight text-[#002F6C] dark:text-foreground line-clamp-1 group-hover:text-[#0E5296] transition-colors">
                      {acceso.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium min-h-[2rem]">
                      {acceso.descripcion || "Portal de acceso directo institucional"}
                    </p>
                  </div>
                </div>

                {/* Footer con Ojito */}
                <div className="p-4 pt-2 flex items-center justify-between border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                    Información
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAcceso(acceso)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0E5296] dark:text-[#FFCC00] hover:bg-[#0E5296] hover:text-white dark:hover:bg-[#FFCC00] dark:hover:text-[#002F6C] transition-all cursor-pointer shadow-xs border border-blue-200 dark:border-blue-900"
                    title="Ver detalles del sistema"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
              {Math.min(accesosFiltrados.length, (currentPage - 1) * pageSize + 1)} -{" "}
              {Math.min(accesosFiltrados.length, currentPage * pageSize)} de{" "}
              {accesosFiltrados.length} sistemas
            </span>
          </div>
        )}
      </div>

      {/* Modal Detalle del Sistema (Ojito) */}
      {selectedAcceso && (
        <Dialog open={Boolean(selectedAcceso)} onOpenChange={(open) => !open && setSelectedAcceso(null)}>
          <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-2 border-[#002F6C]/15 bg-card shadow-2xl">
            <div className="h-2 w-full bg-gradient-to-r from-[#FFCC00] via-[#0077EE] to-[#0E5296]" />
            <div className="p-6 space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00]/15 text-[#002F6C] dark:text-[#FFCC00] border border-[#FFCC00]/30 px-3 py-0.5 text-xs font-black uppercase">
                    <Sparkles className="h-3.5 w-3.5 text-[#0E5296] dark:text-[#FFCC00]" />
                    Sistema Institucional
                  </span>
                </div>
                <DialogTitle className="text-xl font-black text-[#002F6C] dark:text-foreground leading-snug">
                  {selectedAcceso.titulo}
                </DialogTitle>
              </DialogHeader>

              {/* Imagen de previsualización */}
              {selectedAcceso.imagen?.trim() ? (
                <div className="rounded-2xl overflow-hidden border border-border/60 shadow-xs max-h-64 bg-muted/20">
                  <img
                    src={selectedAcceso.imagen}
                    alt={selectedAcceso.titulo}
                    className="w-full h-full object-cover max-h-64"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-zinc-800 dark:to-zinc-900 p-8 flex flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-lg shadow-[#0E5296]/25 mb-2">
                    <Lock className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">Acceso Directo Seguro</span>
                </div>
              )}

              {/* Descripción */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
                  {selectedAcceso.descripcion || "Enlace de acceso a la plataforma oficial institucional."}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAcceso(null)}
                  className="rounded-xl font-bold text-xs px-4"
                >
                  Cerrar
                </Button>

                <a
                  href={selectedAcceso.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-[#0E5296]/20 transition-all hover:scale-105"
                >
                  <span>Ingresar al Sistema</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}

