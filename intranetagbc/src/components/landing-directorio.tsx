"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Shield,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

interface DirectivoItem {
  id: string
  nombre: string
  cargo: string
  unidad: string
  email?: string | null
  telefono?: string | null
  foto?: string | null
  orden: number
}

const AVATAR_COLORS = [
  "#1A73E8", "#E8453C", "#0B8043", "#F29900", "#8430CE",
  "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
  "#00897B", "#C2185B",
]

function hashN(n: string) {
  let h = 0
  for (let i = 0; i < n.length; i++) {
    h = n.charCodeAt(i) + ((h << 5) - h)
    h |= 0
  }
  return Math.abs(h)
}

function initials(n: string) {
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function buildPhoneHref(phone?: string | null) {
  if (!phone) return null

  const compact = phone.trim()
  if (compact.length === 0) return null

  const normalized = compact
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "")

  if (!/\d{6,}/.test(normalized)) return null

  return `tel:${normalized}`
}

export function LandingDirectorio({ directivos }: { directivos: DirectivoItem[] }) {
  const [active, setActive] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const touchStartX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const total = directivos.length
  const safeActive = total > 0 ? Math.min(active, total - 1) : 0

  const go = useCallback(
    (dir: number) => {
      if (isAnimating || total === 0) return
      setIsAnimating(true)
      setActive((prev) => {
        const safe = Math.min(prev, total - 1)
        const next = safe + dir
        if (next < 0) return total - 1
        if (next >= total) return 0
        return next
      })
      setTimeout(() => setIsAnimating(false), 500)
    },
    [isAnimating, total],
  )

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating || idx === safeActive || total === 0) return
      setIsAnimating(true)
      setActive(idx)
      setTimeout(() => setIsAnimating(false), 500)
    },
    [isAnimating, safeActive, total],
  )

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [go])

  /* Touch / swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
  }

  /* Autoplay */
  useEffect(() => {
    const id = setInterval(() => go(1), 7000)
    return () => clearInterval(id)
  }, [go])

  /* ── Card position math ── */
  function getCardStyle(index: number) {
    let offset = index - safeActive
    if (offset > Math.floor(total / 2)) offset -= total
    if (offset < -Math.floor(total / 2)) offset += total

    const absOffset = Math.abs(offset)

    if (absOffset > 2) {
      return {
        opacity: 0,
        transform: `translateX(${offset > 0 ? 600 : -600}px) translateZ(-600px) rotateY(0deg)`,
        zIndex: 0,
        pointerEvents: "none" as const,
        visibility: "hidden" as const,
      }
    }

    const translateX = offset * 230
    const translateZ = -absOffset * 150
    const rotateY = offset * -25
    const scale = 1 - absOffset * 0.12
    const opacity = 1 - absOffset * 0.25

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex: 10 - absOffset,
      opacity,
      pointerEvents: (absOffset === 0 ? "auto" : "none") as React.CSSProperties["pointerEvents"],
      visibility: "visible" as const,
    }
  }

  /* Pagination dots */
  const maxDots = Math.min(total, 7)
  let dotStart = Math.max(0, safeActive - Math.floor(maxDots / 2))
  if (dotStart + maxDots > total) dotStart = Math.max(0, total - maxDots)
  const dots = Array.from({ length: maxDots }, (_, i) => dotStart + i)

  if (directivos.length === 0) return null

  return (
    <section
      id="directorio"
      className="scroll-mt-20 overflow-hidden"
      style={{ background: "var(--landing-neumo-bg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        {/* ── Header ── */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
            <Shield className="h-3.5 w-3.5" />
            Autoridades
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-gray-800 dark:text-gray-100">
            Directorio Institucional
          </h2>
          <p className="mt-4 text-gray-500 text-lg dark:text-gray-300">
            Jefes y directores que lideran nuestra institución
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-2 sm:left-4 md:left-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#101010] text-gray-700 dark:text-gray-100 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]"
            style={{
              boxShadow: "4px 4px 12px var(--landing-neumo-shadow-dark), -4px -4px 12px var(--landing-neumo-shadow-light)",
            }}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-4xl"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
              height: "480px",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {directivos.map((d, index) => {
                const cardStyle = getCardStyle(index)
                const color =
                  AVATAR_COLORS[hashN(d.nombre) % AVATAR_COLORS.length]
                const isActive = index === safeActive
                const phoneHref = buildPhoneHref(d.telefono)

                return (
                  <div
                    key={d.id}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: "300px",
                      marginLeft: "-150px",
                      marginTop: "-220px",
                      transition:
                        "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.55s ease",
                      ...cardStyle,
                    }}
                    onClick={() => {
                      if (!isActive) goTo(index)
                    }}
                  >
                    {/* Neumorphic card */}
                    <div
                      className={`flex flex-col items-center rounded-3xl pt-8 pb-6 px-5 transition-shadow duration-500 ${
                        isActive ? "ring-2 ring-[#C41E3A]/20" : ""
                      }`}
                      style={{
                        background: "var(--landing-neumo-bg)",
                        boxShadow: isActive
                          ? "12px 12px 24px var(--landing-neumo-shadow-deep), -12px -12px 24px var(--landing-neumo-shadow-high), 0 0 30px rgba(196,30,58,0.06)"
                          : "8px 8px 16px var(--landing-neumo-shadow-dark), -8px -8px 16px var(--landing-neumo-shadow-light)",
                        height: "440px",
                      }}
                    >
                      <div
                        className="relative rounded-full p-1.5 mb-4 transition-transform duration-300"
                        style={{
                          background: "var(--landing-neumo-bg)",
                          boxShadow:
                            "4px 4px 10px var(--landing-neumo-shadow-dark), -4px -4px 10px var(--landing-neumo-shadow-light), inset 2px 2px 5px var(--landing-neumo-shadow-dark), inset -2px -2px 5px var(--landing-neumo-shadow-light)",
                        }}
                      >
                        {d.foto ? (
                          <div className="relative h-28 w-28 overflow-hidden rounded-full">
                            <Image
                              src={d.foto}
                              alt={d.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials(d.nombre)}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 text-center leading-tight mt-1">
                        {d.nombre}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center uppercase tracking-wide font-semibold">
                        {d.cargo}
                      </p>

                      <div className="flex items-center justify-center gap-3 mt-4">
                        {d.email && (
                          <a
                            href={`mailto:${d.email}`}
                            title={d.email}
                            className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                              background: "var(--landing-neumo-soft-bg)",
                              boxShadow:
                                "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                            }}
                          >
                            <Mail className="h-4 w-4 text-[#C41E3A]" />
                          </a>
                        )}
                        {d.telefono && (
                          phoneHref ? (
                            <a
                              href={phoneHref}
                              title={`Llamar a ${d.telefono}`}
                              aria-label={`Llamar a ${d.nombre}`}
                              className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                              style={{
                                background: "var(--landing-neumo-soft-bg)",
                                boxShadow:
                                  "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                              }}
                            >
                              <Phone className="h-4 w-4 text-[#1A73E8]" />
                            </a>
                          ) : (
                            <div
                              title={d.telefono}
                              className="flex h-10 w-10 items-center justify-center rounded-full"
                              style={{
                                background: "var(--landing-neumo-soft-bg)",
                                boxShadow:
                                  "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                              }}
                            >
                              <Phone className="h-4 w-4 text-[#1A73E8]" />
                            </div>
                          )
                        )}
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            background: "var(--landing-neumo-soft-bg)",
                            boxShadow:
                              "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                          }}
                        >
                          <Building2 className="h-4 w-4 text-[#F29900]" />
                        </div>
                      </div>

                      <div
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"
                        style={{
                          background: "var(--landing-neumo-bg)",
                          boxShadow:
                            "inset 2px 2px 5px var(--landing-neumo-shadow-dark), inset -2px -2px 5px var(--landing-neumo-shadow-light)",
                        }}
                      >
                        <Briefcase className="h-3 w-3 text-[#C41E3A]" />
                        {d.unidad}
                      </div>

                      <div
                        className="w-full mt-4 mb-3 border-t"
                        style={{ borderColor: "var(--landing-neumo-divider)" }}
                      />

                      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 w-full flex-wrap">
                        {d.email && (
                          <a
                            href={`mailto:${d.email}`}
                            className="flex items-center gap-1 hover:text-[#C41E3A] transition-colors truncate max-w-32.5"
                            title={d.email}
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{d.email}</span>
                          </a>
                        )}
                        {d.telefono && (
                          phoneHref ? (
                            <a
                              href={phoneHref}
                              className="flex items-center gap-1 hover:text-[#1A73E8] transition-colors"
                              title={`Llamar a ${d.telefono}`}
                            >
                              <Phone className="h-3 w-3 shrink-0" />
                              {d.telefono}
                            </a>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              {d.telefono}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="absolute right-2 sm:right-4 md:right-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#101010] text-gray-700 dark:text-gray-100 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]"
            style={{
              boxShadow: "4px 4px 12px var(--landing-neumo-shadow-dark), -4px -4px 12px var(--landing-neumo-shadow-light)",
            }}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-10">
          {dots.map((dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => goTo(dotIdx)}
              aria-label={`Ir a ${directivos[dotIdx]?.nombre ?? dotIdx + 1}`}
              className={`rounded-full transition-all duration-300 focus:outline-none ${
                dotIdx === safeActive
                  ? "h-3.5 w-3.5 bg-[#C41E3A] shadow-md shadow-[#C41E3A]/40"
                  : "h-2.5 w-2.5 bg-gray-400/50 hover:bg-gray-400 dark:bg-gray-600/60 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {total > 0 && (
          <p className="text-center mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 transition-all duration-300">
            {directivos[safeActive]?.nombre}
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
              {safeActive + 1} / {total}
            </span>
          </p>
        )}
      </div>
    </section>
  )
}