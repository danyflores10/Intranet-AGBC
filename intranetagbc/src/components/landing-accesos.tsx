"use client"

import { useState, useCallback, useRef } from "react"
import {
  Globe,
  Lock,
  ChevronRight,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

interface AccesoDirecto {
  clave: string
  titulo: string
  descripcion: string | null
  url: string
  imagen: string | null
}

export function LandingAccesos({ accesos }: { accesos: AccesoDirecto[] }) {
  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ITEMS_PER_PAGE = 3
  const totalPages = Math.ceil(accesos.length / ITEMS_PER_PAGE)

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

  if (accesos.length === 0) return null

  return (
    <section id="aplicaciones" className="border-y border-border/40 bg-muted/20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
            <Globe className="h-3.5 w-3.5" />
            Aplicaciones
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Acceso Rápido a Sistemas</h2>
          <p className="mt-3 text-muted-foreground">
            Enlaces institucionales administrados desde el panel de comunicaciones.
          </p>
        </div>

        <div className="relative mt-10">
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
            className="flex snap-x snap-mandatory gap-4 overflow-x-hidden scroll-smooth"
          >
            {accesos.map((acceso) => (
              <a
                key={acceso.clave}
                href={acceso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full min-w-[calc(100%/1)] snap-start overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFB300]/40 hover:shadow-lg hover:shadow-[#FFB300]/10 sm:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)]"
              >
                {acceso.imagen?.trim() ? (
                  <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-border/40 bg-muted/30">
                    <img
                      src={acceso.imagen}
                      alt={acceso.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Aplicación
                    </div>
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/8] w-full items-center justify-center border-b border-border/40 bg-gradient-to-br from-[#FFB300]/25 via-[#FF8800]/15 to-[#F5061D]/20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/30">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-sm font-bold tracking-tight group-hover:text-[#FF8800]">{acceso.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{acceso.descripcion || "Enlace institucional"}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#FF8800]">
                    Abrir sistema
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </a>
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
  )
}
