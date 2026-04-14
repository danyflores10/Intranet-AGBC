"use client"

import { useState, useEffect, useCallback } from "react"

export interface Comunicado {
  id: string
  titulo: string
  contenido: string
  fecha: string
  prioridad: "alta" | "media" | "baja"
  estado: "publicado" | "borrador"
  archivoNombre: string | null
  archivoTipo: "imagen" | "pdf" | null
  archivoData: string | null // base64
}

const STORAGE_KEY = "agbc_comunicados"

const defaultComunicados: Comunicado[] = [
  {
    id: "1",
    titulo: "Rendición Pública de Cuentas Final 2025",
    contenido: "En cumplimiento a la Constitución Política del Estado; Ley Nº 341 de Participación y Control Social, Ley Nº 974 Ley de Unidades de Transparencia y Lucha Contra la Corrupción; Correos de Bolivia tiene el agrado de invitar a usted a la: RENDICIÓN PÚBLICA DE CUENTAS FINAL 2025. Viernes 27 de marzo de 2026, Hora: 10:00. El evento se realizará de manera virtual a través de la plataforma Google Meet.",
    fecha: "2026-03-27",
    prioridad: "alta",
    estado: "publicado",
    archivoNombre: null,
    archivoTipo: null,
    archivoData: null,
  },
  {
    id: "2",
    titulo: "Actualización de tarifas nacionales",
    contenido: "Se informa al público en general que a partir del 1 de abril de 2026 entran en vigencia las nuevas tarifas de envío nacional, aprobadas mediante Resolución Administrativa N° 045/2026.",
    fecha: "2026-03-25",
    prioridad: "media",
    estado: "publicado",
    archivoNombre: null,
    archivoTipo: null,
    archivoData: null,
  },
  {
    id: "3",
    titulo: "Mantenimiento sistemas internos",
    contenido: "Se comunica a todos los funcionarios que el día sábado 29 de marzo se realizará mantenimiento programado de los sistemas internos entre las 08:00 y 14:00 hrs.",
    fecha: "2026-03-22",
    prioridad: "baja",
    estado: "publicado",
    archivoNombre: null,
    archivoTipo: null,
    archivoData: null,
  },
  {
    id: "4",
    titulo: "Horarios semana santa 2026",
    contenido: "Se comunica que durante la Semana Santa (del 30 de marzo al 4 de abril) el horario de atención será de 08:30 a 12:30.",
    fecha: "2026-03-18",
    prioridad: "media",
    estado: "borrador",
    archivoNombre: null,
    archivoTipo: null,
    archivoData: null,
  },
]

function loadComunicados(): Comunicado[] {
  if (typeof window === "undefined") return defaultComunicados
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return defaultComunicados
}

function saveComunicados(data: Comunicado[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // quota exceeded — drop old file data
  }
}

export function useComunicados() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setComunicados(loadComunicados())
    setLoaded(true)
  }, [])

  const persist = useCallback((next: Comunicado[]) => {
    setComunicados(next)
    saveComunicados(next)
  }, [])

  const addComunicado = useCallback(
    (c: Omit<Comunicado, "id">) => {
      const next = [{ ...c, id: Date.now().toString() }, ...comunicados]
      persist(next)
    },
    [comunicados, persist]
  )

  const updateComunicado = useCallback(
    (id: string, updates: Partial<Comunicado>) => {
      const next = comunicados.map((c) => (c.id === id ? { ...c, ...updates } : c))
      persist(next)
    },
    [comunicados, persist]
  )

  const deleteComunicado = useCallback(
    (id: string) => {
      const next = comunicados.filter((c) => c.id !== id)
      persist(next)
    },
    [comunicados, persist]
  )

  return { comunicados, loaded, addComunicado, updateComunicado, deleteComunicado }
}
