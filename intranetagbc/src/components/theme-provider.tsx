"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  forcedTheme?: Theme
  disableTransitionOnChange?: boolean
}

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: string) => void
  resolvedTheme: "light" | "dark"
  themes: string[]
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  attribute = "class",
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (forcedTheme) return forcedTheme
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey) as Theme | null
        if (saved) return saved
      } catch {}
    }
    return defaultTheme
  })

  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    const root = document.documentElement
    const currentTheme = forcedTheme || theme

    let effectiveTheme: "light" | "dark" = "light"
    if (currentTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      effectiveTheme = systemDark ? "dark" : "light"
    } else {
      effectiveTheme = currentTheme as "light" | "dark"
    }

    setResolvedTheme(effectiveTheme)

    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(effectiveTheme)
    } else {
      root.setAttribute(attribute, effectiveTheme)
    }
  }, [theme, forcedTheme, attribute])

  const setTheme = React.useCallback(
    (newTheme: string) => {
      if (forcedTheme) return
      const validTheme = (newTheme === "dark" || newTheme === "system" ? newTheme : "light") as Theme
      setThemeState(validTheme)
      try {
        localStorage.setItem(storageKey, validTheme)
      } catch {}
    },
    [forcedTheme, storageKey]
  )

  const value = React.useMemo(
    () => ({
      theme: (forcedTheme || theme) as Theme,
      setTheme,
      resolvedTheme,
      themes: ["light", "dark", "system"],
    }),
    [theme, forcedTheme, setTheme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as const,
      themes: ["light", "dark", "system"],
    }
  }
  return context
}


