"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  MegaphoneIcon,
  CalendarIcon,
  EyeIcon,
  FileTextIcon,
  DownloadIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ComunicadoLanding {
  id: string
  titulo: string
  contenido: string
  fecha: string
  estado: string
  destacado: boolean
  archivoUrl?: string | null
  archivoNombre?: string | null
  archivoTipo?: string | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/* ── Visor limpio de imagen (sin lupa) ── */
function ImageMagnifier({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-full items-start justify-center overflow-auto rounded-2xl border border-border/30 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
      <img
        src={src}
        alt={alt}
        className="block max-h-[calc(93vh-140px)] w-full max-w-[1180px] object-contain object-top"
        draggable={false}
      />
    </div>
  )
}

export function LandingComunicados({ comunicados, estaLogueado = false }: { comunicados: ComunicadoLanding[]; estaLogueado?: boolean }) {
  const [viewing, setViewing] = useState<ComunicadoLanding | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 3

  // Auto-mostrar el primer comunicado destacado al entrar (una vez por sesión)
  useEffect(() => {
    const key = "agbc_comunicado_mostrado"
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      const destacado = comunicados.find((c) => c.destacado) ?? comunicados[0]
      if (destacado) {
        setViewing(destacado)
        sessionStorage.setItem(key, "1")
      }
    }
  }, [comunicados])

  if (comunicados.length === 0) return null

  const visibles = estaLogueado ? comunicados : comunicados.slice(0, 6)
  const totalPages = Math.ceil(visibles.length / ITEMS_PER_PAGE)

  const scrollToPage = useCallback((page: number) => {
    setCurrentPage(page)
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth
      const pageWidth = scrollWidth / totalPages
      scrollRef.current.scrollTo({ left: pageWidth * page, behavior: "smooth" })
    }
  }, [totalPages])

  const prev = useCallback(() => {
    const newPage = currentPage > 0 ? currentPage - 1 : totalPages - 1
    scrollToPage(newPage)
  }, [currentPage, totalPages, scrollToPage])

  const next = useCallback(() => {
    const newPage = currentPage < totalPages - 1 ? currentPage + 1 : 0
    scrollToPage(newPage)
  }, [currentPage, totalPages, scrollToPage])

  return (
    <>
      <section id="comunicados" className="border-t border-border/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
              <MegaphoneIcon className="h-3.5 w-3.5" />
              Comunicados
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Comunicados Oficiales
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Información importante de la Agencia Boliviana de Correos
            </p>
          </div>

          <div className="relative">
            {/* Flecha izquierda */}
            {totalPages > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute -left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card/90 text-muted-foreground shadow-lg backdrop-blur-sm transition-all hover:border-[#FFB300]/40 hover:bg-card hover:text-[#FF8800] hover:shadow-xl md:-left-6"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Carrusel */}
            <div
              ref={scrollRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-hidden scroll-smooth"
            >
              {visibles.map((com) => (
                <button
                  key={com.id}
                  type="button"
                  onClick={() => setViewing(com)}
                  className="group relative flex w-full min-w-[calc(100%/1)] snap-start flex-col overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-all duration-300 hover:border-[#FFB300]/30 hover:shadow-xl hover:shadow-[#FFB300]/5 hover:-translate-y-1 sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)]"
                >
                {/* Thumbnail */}
                <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFB300]/10 via-[#FF8800]/5 to-[#F5061D]/10">
                  {com.archivoUrl && com.archivoTipo === "imagen" ? (
                    <img src={com.archivoUrl} alt={com.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-white shadow-lg">
                      {com.archivoTipo === "pdf"
                        ? <FileTextIcon className="h-7 w-7" />
                        : <MegaphoneIcon className="h-7 w-7" />}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#FF8800] opacity-0 transform scale-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 shadow-lg">
                      <EyeIcon className="h-5 w-5" />
                    </div>
                  </div>
                  {com.destacado && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        Destacado
                      </span>
                    </div>
                  )}
                  {com.archivoTipo === "pdf" && com.archivoUrl && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <FileTextIcon className="h-3 w-3" />PDF
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold leading-snug line-clamp-2 mb-2">{com.titulo}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{com.contenido}</p>
                  <div className="flex items-center border-t border-border/30 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formatDate(com.fecha)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-1 w-full">
                  <div className="flex-1 bg-[#C41E3A]" />
                  <div className="flex-1 bg-[#FFB300]" />
                  <div className="flex-1 bg-[#2E7D32]" />
                </div>
              </button>
            ))}
            </div>

            {/* Flecha derecha */}
            {totalPages > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card/90 text-muted-foreground shadow-lg backdrop-blur-sm transition-all hover:border-[#FFB300]/40 hover:bg-card hover:text-[#FF8800] hover:shadow-xl md:-right-6"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Dots de paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToPage(i)}
                  className={`rounded-full transition-all duration-300 ${
                    currentPage === i
                      ? "h-3 w-3 bg-[#FFB300] shadow-md shadow-[#FFB300]/30"
                      : "h-2.5 w-2.5 bg-[#FFB300]/25 hover:bg-[#FFB300]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Modal Profesional con Header Tricolor ── */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="h-[93vh] !w-[95vw] max-h-[93vh] !max-w-[95vw] sm:!max-w-[94vw] lg:!max-w-[90vw] xl:!max-w-[86vw] 2xl:!max-w-[1500px] !gap-0 !grid !grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl dark:bg-zinc-900 [&>button]:hidden">
            <DialogTitle className="sr-only">{viewing.titulo}</DialogTitle>

            {/* Barra tricolor superior */}
            <div className="flex h-2 w-full shrink-0">
              <div className="flex-1 bg-[#C41E3A]" />
              <div className="flex-1 bg-[#FFB300]" />
              <div className="flex-1 bg-[#2E7D32]" />
            </div>

            <div className="flex items-center justify-between border-b border-border/20 bg-white/90 px-4 py-2.5 dark:bg-zinc-900/90">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-bold tracking-tight md:text-base">{viewing.titulo}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 shrink-0" />
                  {formatDate(viewing.fecha)}
                </p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {viewing.archivoUrl && viewing.archivoTipo === "pdf" && (
                  <a href={viewing.archivoUrl} download={viewing.archivoNombre ?? "documento.pdf"} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="rounded-lg bg-[#C41E3A] text-white hover:bg-[#a01830]">
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </a>
                )}
                <button
                  onClick={() => setViewing(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-white transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {viewing.archivoUrl && viewing.archivoTipo === "imagen" ? (
                <div className="h-full px-2 pb-2 pt-0.5 md:px-3 md:pb-3 md:pt-0.5">
                  <ImageMagnifier
                    src={viewing.archivoUrl}
                    alt={viewing.archivoNombre ?? viewing.titulo}
                  />
                </div>
              ) : viewing.archivoUrl && viewing.archivoTipo === "pdf" ? (
                <div className="h-full flex flex-col">
                  <iframe
                    src={viewing.archivoUrl}
                    title={viewing.archivoNombre ?? "Documento PDF"}
                    className="w-full flex-1 rounded-b-2xl border-0"
                    style={{ minHeight: 0 }}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-8 text-center">
                  <MegaphoneIcon className="mx-auto h-14 w-14 mb-4 text-[#FFB300]/40" />
                  <p className="font-bold text-xl">{viewing.titulo}</p>
                  <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{viewing.contenido}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
