"use client"

import { useEffect, useRef } from "react"
import { registrarVisitaSeccionAction } from "@/actions/auditoria"

const SECTION_MAP: Record<string, string> = {
  noticias: "Noticias Institucionales",
  comunicados: "Comunicados Oficiales",
  documentos: "Documentos Institucionales",
  aplicaciones: "Accesos Rápidos a Sistemas",
  directorio: "Personal Institucional (Directorio)",
  equipo: "Personal Institucional (Directorio)",
  cobertura: "Oficinas & Sucursales Postales",
  sucursales: "Oficinas & Sucursales Postales",
}

export function LandingTracker() {
  const registeredSections = useRef<Set<string>>(new Set())
  const timers = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    // Si no hay soporte para IntersectionObserver en el navegador
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          const seccionNombre = SECTION_MAP[id]
          if (!seccionNombre) return

          if (entry.isIntersecting) {
            // Si el usuario permanece al menos 1.5s viendo la sección y no ha sido registrada en esta sesión
            if (!registeredSections.current.has(seccionNombre) && !timers.current[id]) {
              timers.current[id] = setTimeout(() => {
                if (!registeredSections.current.has(seccionNombre)) {
                  registeredSections.current.add(seccionNombre)
                  registrarVisitaSeccionAction({
                    seccion: seccionNombre,
                    detalles: `Visualización de sección #${id}`,
                  }).catch(() => {})
                }
                delete timers.current[id]
              }, 1500)
            }
          } else {
            // Si sale de la vista antes de 1.5s, cancelamos el timer
            if (timers.current[id]) {
              clearTimeout(timers.current[id])
              delete timers.current[id]
            }
          }
        })
      },
      {
        threshold: 0.25,
      }
    )

    // Observar cada sección relevante presente en el DOM
    const sectionIds = Object.keys(SECTION_MAP)
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
      Object.values(timers.current).forEach((t) => clearTimeout(t))
    }
  }, [])

  return null
}
