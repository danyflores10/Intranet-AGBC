"use client"

import * as React from "react"
import { Maximize2Icon, Minimize2Icon, MoonIcon, SunIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function FullscreenToggle() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)
  const [isSupported, setIsSupported] = React.useState<boolean>(false)
  const [isMounted, setIsMounted] = React.useState<boolean>(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const syncFullscreenState = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    setIsFullscreen(Boolean(document.fullscreenElement))
    setIsSupported(Boolean(document.fullscreenEnabled))
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    syncFullscreenState()

    const handleFullscreenChange = () => {
      syncFullscreenState()
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [syncFullscreenState])

  const handleToggle = React.useCallback(async () => {
    if (typeof window === "undefined") {
      return
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch (error: unknown) {
      console.error("No se pudo cambiar el modo de pantalla completa:", error)
    }
  }, [])

  const label = isFullscreen ? "Salir de pantalla completa" : "Entrar en pantalla completa"
  const floatingPositionClass = pathname === "/" ? "bottom-24 right-6" : "bottom-6 right-6"
  const isDarkTheme = resolvedTheme === "dark"
  const themeLabel = isMounted
    ? isDarkTheme
      ? "Cambiar a modo claro"
      : "Cambiar a modo oscuro"
    : "Cambiar tema"
  const floatingButtonClassName = "pointer-events-auto h-12 w-12 rounded-2xl border-border/70 bg-white text-[#0E5296] shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-[#0077EE] active:translate-y-0 disabled:opacity-55"

  return (
    <div
      className={`pointer-events-none fixed z-40 ${floatingPositionClass}`}
    >
      <Button
        variant="outline"
        size="icon-lg"
        type="button"
        onClick={() => {
          void handleToggle()
        }}
        disabled={!isSupported}
        aria-label={label}
        title={label}
        className={floatingButtonClassName}
      >
        {isFullscreen ? (
          <Minimize2Icon className="h-5 w-5" />
        ) : (
          <Maximize2Icon className="h-5 w-5" />
        )}
        <span className="sr-only">{label}</span>
      </Button>
    </div>
  )
}
