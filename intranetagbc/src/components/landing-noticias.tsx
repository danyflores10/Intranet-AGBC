"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDaysIcon,
  NewspaperIcon,
  SearchIcon,
  EyeIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  SparklesIcon,
  RefreshCwIcon,
  PlayIcon,
  CheckCircle2Icon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

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

/* ── Mini-carrusel de imágenes por tarjeta ── */
function NoticiaImageCarousel({ imagenes, titulo }: { imagenes: string[]; titulo: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (imagenes.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % imagenes.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [imagenes.length])

  if (imagenes.length === 0) return null

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
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

      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setCurrent((prev) => (prev - 1 + imagenes.length) % imagenes.length)
            }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 backdrop-blur-xs cursor-pointer z-10"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setCurrent((prev) => (prev + 1) % imagenes.length)
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 backdrop-blur-xs cursor-pointer z-10"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {imagenes.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === current ? "w-4 bg-[#FFCC00]" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}

/* ── Hero Carousel Principal ── */
function HeroCarousel({ noticias, onOpenDetail }: { noticias: NoticiaLanding[]; onOpenDetail: (n: NoticiaLanding) => void }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % noticias.length)
  }, [noticias.length])

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + noticias.length) % noticias.length)
  }, [noticias.length])

  useEffect(() => {
    const timer = setInterval(next, 6000)
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
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#002F6C]/15 bg-white shadow-xl">
      <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-gradient-to-br from-[#0E5296] via-[#002F6C] to-slate-900">
        {imagenes.length > 0 ? (
          noticias.map((n, nIdx) => {
            const imgs = getImagenes(n)
            return imgs[0] ? (
              <img
                key={n.id}
                src={imgs[0]}
                alt={n.titulo}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                  nIdx === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              />
            ) : null
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-lg shadow-[#0E5296]/25">
              <NewspaperIcon className="h-10 w-10" />
            </div>
          </div>
        )}

        {/* Overlay degradado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFCC00] text-[#002F6C] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-xs">
                <SparklesIcon className="h-3 w-3" />
                Destacado
              </span>
              <span className="text-xs font-semibold text-white/80 flex items-center gap-1">
                <CalendarDaysIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                {fechaFormateada}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              {noticia.titulo}
            </h3>

            {noticia.descripcion && (
              <p className="text-xs sm:text-sm text-white/80 line-clamp-2 max-w-2xl font-medium">
                {noticia.descripcion}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onOpenDetail(noticia)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0E5296] hover:bg-[#FFCC00] hover:text-[#002F6C] text-white px-5 py-2.5 text-xs font-black shadow-lg transition-all cursor-pointer border border-white/20 hover:scale-105"
            >
              <EyeIcon className="h-4 w-4" />
              Ver Noticia Completa
            </button>
          </div>
        </div>

        {/* Controles de cambio */}
        {noticias.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-[#0E5296] backdrop-blur-xs cursor-pointer shadow-md"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-[#0E5296] backdrop-blur-xs cursor-pointer shadow-md"
              aria-label="Siguiente"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de página del Hero */}
      {noticias.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 border-t border-slate-100">
          {noticias.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === current ? "w-7 bg-[#0E5296]" : "w-2 bg-slate-300 hover:bg-[#FFCC00]"
              }`}
              aria-label={`Ir a noticia ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Componente Principal de Noticias ── */
export function LandingNoticias({ noticias }: { noticias: NoticiaLanding[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaActiva, setCategoriaActiva] = useState<"todas" | "institucional" | "facebook">("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedNoticia, setSelectedNoticia] = useState<NoticiaLanding | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const pageSize = 12 // 3 filas de 4 noticias

  const ejecutarSincronizacion = async () => {
    setSincronizando(true)
    try {
      const res = await fetch("/api/noticias/sync", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success("Noticias sincronizadas correctamente")
        router.refresh()
      } else {
        toast.error("No se pudo completar la sincronización")
      }
    } catch {
      toast.error("Error al sincronizar noticias")
    } finally {
      setSincronizando(false)
    }
  }

  // Identificador de categoría por noticia
  const getCategoriaTipo = (n: NoticiaLanding): "facebook" | "institucional" => {
    if (n.enlace?.includes("facebook.com") || n.id.startsWith("facebook_") || n.id.startsWith("noticia_fb_")) {
      return "facebook"
    }
    return "institucional"
  }

  const conteoInstitucional = useMemo(
    () => noticias.filter((n) => getCategoriaTipo(n) === "institucional").length,
    [noticias]
  )

  const conteoFacebook = useMemo(
    () => noticias.filter((n) => getCategoriaTipo(n) === "facebook").length,
    [noticias]
  )

  const filteredNoticias = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()

    const list = noticias.filter((n) => {
      const tipo = getCategoriaTipo(n)
      const coincideCategoria =
        categoriaActiva === "todas" ||
        (categoriaActiva === "institucional" && tipo === "institucional") ||
        (categoriaActiva === "facebook" && tipo === "facebook")

      const coincideBusqueda =
        !q ||
        n.titulo.toLowerCase().includes(q) ||
        (n.descripcion && n.descripcion.toLowerCase().includes(q))

      return coincideCategoria && coincideBusqueda
    })

    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [noticias, searchTerm, categoriaActiva])

  const totalPages = Math.max(1, Math.ceil(filteredNoticias.length / pageSize))
  const paginatedList = filteredNoticias.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (noticias.length === 0) return null

  return (
    <section id="noticias" className="border-y border-border/40 bg-gradient-to-b from-white via-slate-50/60 to-blue-50/20 py-16 md:py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ── Encabezado ── */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCC00]/40 bg-[#FFCC00]/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#002F6C]">
            <NewspaperIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            ACTUALIDAD & MEDIOS AGBC
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-[#002F6C]">
            Noticias
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Comunicados oficiales, actividades y publicaciones en redes sociales de la Agencia Boliviana de Correos
          </p>
        </div>

        {/* Hero Carousel */}
        <HeroCarousel noticias={noticias.slice(0, 5)} onOpenDetail={setSelectedNoticia} />

        {/* ── Filtros por Categoría y Buscador ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en noticias..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-[#0E5296] focus:ring-2 focus:ring-[#0E5296]/10 shadow-2xs transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0E5296] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                {filteredNoticias.length} Noticias
              </span>
              <button
                type="button"
                onClick={ejecutarSincronizacion}
                disabled={sincronizando}
                className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-50 text-[#002F6C] px-3.5 py-1.5 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Sincronizar noticias cada 24 horas"
              >
                <RefreshCwIcon className={`h-3.5 w-3.5 text-[#0E5296] ${sincronizando ? "animate-spin" : ""}`} />
                <span>{sincronizando ? "Sincronizando..." : "Sincronizar (24h)"}</span>
              </button>
            </div>
          </div>

          {/* ── Píldoras de Categorías (Todas / Institucionales / Redes Sociales Facebook) ── */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCategoriaActiva("todas")
                setCurrentPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                categoriaActiva === "todas"
                  ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/20"
                  : "bg-white text-slate-600 hover:bg-[#FFCC00]/20 hover:text-[#002F6C] border border-slate-200"
              }`}
            >
              Todas ({noticias.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaActiva("institucional")
                setCurrentPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                categoriaActiva === "institucional"
                  ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/20"
                  : "bg-white text-slate-600 hover:bg-[#FFCC00]/20 hover:text-[#002F6C] border border-slate-200"
              }`}
            >
              <span>🏛️ Noticias Institucionales</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                ({conteoInstitucional})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoriaActiva("facebook")
                setCurrentPage(1)
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                categoriaActiva === "facebook"
                  ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20"
                  : "bg-white text-slate-600 hover:bg-blue-50 hover:text-[#1877F2] border border-slate-200"
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Redes Sociales (Facebook)
              </span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                ({conteoFacebook})
              </span>
            </button>
          </div>

          {/* ── Banner de Perfil Oficial de Facebook AGBC ── */}
          {categoriaActiva === "facebook" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#1877F2]/10 via-blue-50 to-amber-50/40 border-2 border-[#1877F2]/20 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/25">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0E5296] text-[9px] text-[#FFCC00] font-black border border-white">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#002F6C]">
                      Agencia Boliviana de Correos - Correos de Bolivia
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#1877F2] border border-blue-200">
                      Página Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Perfil Oficial • ID: <span className="font-mono font-bold text-[#0E5296]">61592782342439</span> • Publicaciones y videos sincronizados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href="https://www.facebook.com/profile.php?id=61592782342439"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0c63d4] text-white px-4 py-2 text-xs font-black shadow-md shadow-[#1877F2]/20 transition-all cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Visitar Perfil en Facebook</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Grid 3 Filas x 4 Columnas (12 Noticias por página) ── */}
        {paginatedList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
            No se encontraron noticias que coincidan con la categoría o búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedList.map((noticia) => {
              const imagenes = getImagenes(noticia)
              const esFacebook = getCategoriaTipo(noticia) === "facebook"
              const esReel = noticia.enlace?.includes("/r/")
              const fechaFormateada = new Date(noticia.createdAt).toLocaleDateString("es-BO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })

              return (
                <article
                  key={noticia.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border-2 transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-xl ${
                    esFacebook
                      ? "border-blue-100 hover:border-[#1877F2]/40 hover:shadow-[#1877F2]/10"
                      : "border-slate-200/80 hover:border-[#0E5296]/40 hover:shadow-[#0E5296]/10"
                  }`}
                >
                  <div>
                    {/* Imagen / Carrusel / Video Preview */}
                    {imagenes.length > 0 ? (
                      <div className="relative overflow-hidden group/img">
                        <NoticiaImageCarousel imagenes={imagenes} titulo={noticia.titulo} />

                        {/* Botón Play interactivo central si es Reel / Video */}
                        {esReel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedNoticia(noticia)
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/img:bg-black/15 transition-all z-15 cursor-pointer"
                            aria-label="Reproducir Video Reel"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#1877F2] shadow-xl backdrop-blur-xs transition-transform duration-300 group-hover/img:scale-115">
                              <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </button>
                        )}

                        {/* Badge de Categoría sobre la imagen */}
                        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                          {esFacebook ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1877F2] text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
                              {esReel ? (
                                <>
                                  <span>🎥</span>
                                  <span>Reel Video</span>
                                </>
                              ) : (
                                <>
                                  <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                  </svg>
                                  <span>Facebook Post</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#002F6C] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md border border-[#FFCC00]/30">
                              Institucional
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${
                          esFacebook ? "bg-[#1877F2] text-white" : "bg-[#0E5296] text-[#FFCC00]"
                        }`}>
                          <NewspaperIcon className="h-6 w-6" />
                        </div>
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                          {fechaFormateada}
                        </span>
                        {imagenes.length > 1 && (
                          <span className="text-[10px] font-bold text-[#002F6C] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            {imagenes.length} fotos
                          </span>
                        )}
                      </div>

                      <h3 className={`text-xs sm:text-sm font-black text-[#002F6C] line-clamp-2 leading-snug transition-colors ${
                        esFacebook ? "group-hover:text-[#1877F2]" : "group-hover:text-[#0E5296]"
                      }`}>
                        {noticia.titulo}
                      </h3>

                      {noticia.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                          {noticia.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón único de Visualización con el Ojito */}
                  <div className="p-4 pt-1 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {esFacebook ? (esReel ? "🎥 Reel Video" : "Post Facebook") : "Detalle oficial"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedNoticia(noticia)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer shadow-2xs border ${
                        esFacebook
                          ? "bg-blue-50 text-[#1877F2] hover:bg-[#1877F2] hover:text-white border-blue-200"
                          : "bg-blue-50 text-[#0E5296] hover:bg-[#0E5296] hover:text-white border-blue-200"
                      }`}
                      title="Ver noticia completa"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── Paginación Centrada ── */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-center gap-2 pt-4 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
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
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
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
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Siguiente página"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Página {currentPage} de {totalPages} • Mostrando{" "}
              {Math.min(filteredNoticias.length, (currentPage - 1) * pageSize + 1)} -{" "}
              {Math.min(filteredNoticias.length, currentPage * pageSize)} de{" "}
              {filteredNoticias.length} noticias
            </span>
          </div>
        )}
      </div>

      {/* ── Modal Detalle de Noticia con el Ojito ── */}
      {selectedNoticia && (() => {
        const esFb = getCategoriaTipo(selectedNoticia) === "facebook"
        const esReelModal = selectedNoticia.enlace?.includes("/r/") || selectedNoticia.enlace?.includes("/reel") || selectedNoticia.enlace?.includes("video")
        return (
          <Dialog open={Boolean(selectedNoticia)} onOpenChange={(open) => !open && setSelectedNoticia(null)}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-3xl border-2 border-[#002F6C]/15 bg-white shadow-2xl max-h-[90vh] flex flex-col">
              <div className={`h-2 w-full ${
                esFb
                  ? "bg-gradient-to-r from-[#1877F2] via-[#0077EE] to-[#0E5296]"
                  : "bg-gradient-to-r from-[#FFCC00] via-[#0077EE] to-[#0E5296]"
              }`} />
              <div className="p-6 overflow-y-auto space-y-4">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {esFb ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30 px-3 py-0.5 text-xs font-black">
                        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        {esReelModal ? "Reel / Video en Facebook Oficial" : "Publicación en Facebook Oficial"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-[#0E5296] border border-blue-200 px-3 py-0.5 text-xs font-black">
                        <NewspaperIcon className="h-3.5 w-3.5" />
                        Noticia Institucional AGBC
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(selectedNoticia.createdAt).toLocaleDateString("es-BO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-black text-[#002F6C] leading-snug">
                    {selectedNoticia.titulo}
                  </DialogTitle>
                </DialogHeader>

                {/* Reproductor de Video / Reel si es Reel de Facebook */}
                {esReelModal ? (
                  <div className="space-y-3">
                    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#1877F2]/40 shadow-xl bg-slate-950 aspect-[16/10] max-h-[380px] flex items-center justify-center group">
                      {/* Imagen de fondo / miniatura oficial del reel */}
                      {getImagenes(selectedNoticia).length > 0 && (
                        <img
                          src={getImagenes(selectedNoticia)[0]}
                          alt={selectedNoticia.titulo}
                          className="absolute inset-0 h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

                      {/* Botón central Play interactivo */}
                      <a
                        href={selectedNoticia.enlace || "https://www.facebook.com/profile.php?id=61592782342439"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-10 flex flex-col items-center gap-2 text-white hover:scale-105 transition-all p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/50 animate-pulse">
                          <PlayIcon className="h-7 w-7 fill-current ml-1" />
                        </div>
                        <span className="text-xs font-black tracking-wide uppercase">
                          Reproducir Reel Oficial
                        </span>
                      </a>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                      <span className="flex items-center gap-1.5 font-bold text-[#1877F2]">
                        <CheckCircle2Icon className="h-4 w-4 text-[#1877F2]" />
                        <span>Publicación multimedia verificada de Correos de Bolivia</span>
                      </span>
                      {selectedNoticia.enlace && (
                        <a
                          href={selectedNoticia.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-black text-white bg-[#1877F2] hover:bg-[#0c63d4] px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                        >
                          <span>Ver en Facebook</span>
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : getImagenes(selectedNoticia).length > 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-80 bg-slate-100">
                      <img
                        src={getImagenes(selectedNoticia)[0]}
                        alt={selectedNoticia.titulo}
                        className="w-full h-full object-cover max-h-80"
                      />
                    </div>
                    {getImagenes(selectedNoticia).length > 1 && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {getImagenes(selectedNoticia).slice(1).map((img, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/10]">
                            <img src={img} alt={`Foto ${i + 2}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Descripción completa */}
                {selectedNoticia.descripcion && (
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedNoticia.descripcion}
                    </p>
                  </div>
                )}

                {/* Footer con Enlaces */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedNoticia.enlace?.trim() ? (
                      <a
                        href={selectedNoticia.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-xs flex-1 sm:flex-none ${
                          esFb
                            ? "bg-[#1877F2] text-white hover:bg-[#0c63d4]"
                            : "bg-[#0E5296] text-white hover:bg-[#002F6C]"
                        }`}
                      >
                        {esFb ? (
                          <>
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>{esReelModal ? "Ver Reel en Facebook" : "Ver en Facebook"}</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            <span>Abrir enlace oficial</span>
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </>
                        )}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">Publicación oficial AGBC</span>
                    )}

                    {esFb && (
                      <a
                        href="https://www.facebook.com/profile.php?id=61592782342439"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-xl transition-all"
                      >
                        <span>Perfil Oficial</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={() => setSelectedNoticia(null)}
                    variant="outline"
                    className="border-slate-200 font-bold text-xs rounded-xl px-4 w-full sm:w-auto"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </section>
  )
}

