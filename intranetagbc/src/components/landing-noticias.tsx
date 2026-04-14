"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarDays, Newspaper, ChevronLeft, ChevronRight } from "lucide-react"

interface NoticiaLanding {
  id: string
  titulo: string
  descripcion: string | null
  imagen: string | null
  imagenes: string | null
  enlace: string | null
  createdAt: string
}

function getImagenes(noticia: NoticiaLanding): string[] {
  if (noticia.imagenes) {
    try {
      const parsed = JSON.parse(noticia.imagenes)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch { /* ignore */ }
  }
  if (noticia.imagen) return [noticia.imagen]
  return []
}

/* ── Mini-carrusel de imágenes por noticia ── */
function NoticiaImageCarousel({ imagenes, titulo }: { imagenes: string[]; titulo: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (imagenes.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % imagenes.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [imagenes.length])

  if (imagenes.length === 0) return null

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
      {imagenes.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`${titulo} - ${idx + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out ${
            idx === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          loading={idx === 0 ? "eager" : "lazy"}
        />
      ))}

      {/* Controles */}
      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrent((prev) => (prev - 1 + imagenes.length) % imagenes.length) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 backdrop-blur-sm"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrent((prev) => (prev + 1) % imagenes.length) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent(idx) }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Ir a imagen ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Overlay degradado inferior */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  )
}

/* ── Carrusel principal (hero-style) cuando hay muchas noticias ── */
function HeroCarousel({ noticias }: { noticias: NoticiaLanding[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % noticias.length)
  }, [noticias.length])

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + noticias.length) % noticias.length)
  }, [noticias.length])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const noticia = noticias[current]
  const imagenes = getImagenes(noticia)
  const fechaFormateada = new Date(noticia.createdAt).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg">
      {/* Imagen principal */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-[#C41E3A]/10 via-[#FFB300]/5 to-[#FF8800]/10">
        {imagenes.length > 0 ? (
          noticias.map((n, nIdx) => {
            const imgs = getImagenes(n)
            return imgs[0] ? (
              <img
                key={n.id}
                src={imgs[0]}
                alt={n.titulo}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                  nIdx === current ? "opacity-100 scale-100" : "opacity-0 scale-110"
                }`}
              />
            ) : null
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#940533] text-white shadow-lg">
              <Newspaper className="h-10 w-10" />
            </div>
          </div>
        )}

        {/* Overlay + contenido */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-white/70" />
            <time className="text-sm text-white/70">{fechaFormateada}</time>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3 max-w-3xl">
            {noticia.enlace?.trim() ? (
              <a href={noticia.enlace} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-white/30 underline-offset-4">
                {noticia.titulo}
              </a>
            ) : (
              noticia.titulo
            )}
          </h3>
          {noticia.descripcion && (
            <p className="text-sm md:text-base text-white/80 line-clamp-2 max-w-2xl">
              {noticia.descripcion}
            </p>
          )}
        </div>

        {/* Controles laterales */}
        {noticias.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-all hover:bg-black/50 backdrop-blur-sm"
              aria-label="Noticia anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-all hover:bg-black/50 backdrop-blur-sm"
              aria-label="Noticia siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores inferiores */}
      {noticias.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 bg-card">
          {noticias.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-8 bg-gradient-to-r from-[#C41E3A] to-[#FF8800]"
                  : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              }`}
              aria-label={`Ir a noticia ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ── */
export function LandingNoticias({ noticias }: { noticias: NoticiaLanding[] }) {
  if (noticias.length === 0) return null

  return (
    <section id="noticias" className="border-y border-border/40 bg-muted/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
            <Newspaper className="h-3.5 w-3.5" />
            Noticias
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Noticias Institucionales</h2>
          <p className="mt-3 text-muted-foreground">
            Información institucional publicada por el área de Comunicaciones.
          </p>
        </div>

        {/* Hero Carousel para la noticia principal */}
        <HeroCarousel noticias={noticias} />

        {/* Grid de tarjetas debajo del carrusel principal */}
        {noticias.length > 1 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {noticias.slice(0, 6).map((noticia) => {
              const imagenes = getImagenes(noticia)
              const fechaFormateada = new Date(noticia.createdAt).toLocaleDateString("es-BO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })

              return (
                <article
                  key={noticia.id}
                  className="group overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
                >
                  {/* Carrusel de imágenes por tarjeta */}
                  {imagenes.length > 0 ? (
                    <NoticiaImageCarousel imagenes={imagenes} titulo={noticia.titulo} />
                  ) : (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#C41E3A]/10 via-[#FFB300]/5 to-[#FF8800]/10 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#940533] text-white shadow-lg">
                        <Newspaper className="h-7 w-7" />
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold leading-snug tracking-tight text-foreground group-hover:text-[#C41E3A] transition-colors duration-200 line-clamp-2">
                      {noticia.enlace?.trim() ? (
                        <a href={noticia.enlace} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-[#C41E3A]/30 underline-offset-2">
                          {noticia.titulo}
                        </a>
                      ) : (
                        noticia.titulo
                      )}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-[#C41E3A]/60" />
                      <time>{fechaFormateada}</time>
                      {imagenes.length > 1 && (
                        <span className="ml-auto text-[10px] font-semibold text-[#FFB300] bg-[#FFB300]/10 px-1.5 py-0.5 rounded">
                          {imagenes.length} fotos
                        </span>
                      )}
                    </div>

                    {noticia.descripcion && (
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {noticia.descripcion}
                      </p>
                    )}

                    {noticia.enlace?.trim() ? (
                      <a
                        href={noticia.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#C41E3A] hover:text-[#940533] transition-colors"
                      >
                        Leer más »
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#C41E3A]/60">
                        Leer más »
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
