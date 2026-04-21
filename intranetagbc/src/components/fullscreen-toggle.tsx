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
  const floatingButtonClassName = "pointer-events-auto h-14 w-14 rounded-2xl border-border/70 bg-card/95 text-foreground shadow-[0_8px_24px_-10px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_14px_30px_-12px_rgba(15,23,42,0.55)] active:translate-y-0 disabled:opacity-55"

  const handleThemeToggle = React.useCallback(() => {
    setTheme(isDarkTheme ? "light" : "dark")
  }, [isDarkTheme, setTheme])

  return (
    <div
      className={`pointer-events-none fixed z-40 ${floatingPositionClass}`}
    >
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="outline"
          size="icon-lg"
          type="button"
          onClick={handleThemeToggle}
          aria-label={themeLabel}
          title={themeLabel}
          className={floatingButtonClassName}
        >
          {isMounted && isDarkTheme ? (
            <MoonIcon className="h-6 w-6" />
          ) : (
            <SunIcon className="h-6 w-6" />
          )}
          <span className="sr-only">{themeLabel}</span>
        </Button>

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
          <Minimize2Icon className="h-6 w-6" />
        ) : (
          <Maximize2Icon className="h-6 w-6" />
        )}
        <span className="sr-only">{label}</span>
      </Button>
      </div>
    </div>
  )
}
