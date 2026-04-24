"use client"

import { useEffect, useState } from "react"

import { OnboardingTour } from "@/components/onboarding-tour"

type Props = {
  /** Si true, el servidor determinó que el usuario debe ver el tour */
  debeVerlo: boolean
}

/**
 * Arranca automáticamente el tour si `debeVerlo` es true.
 * Se escucha el evento global "onboarding:start" para reiniciarlo manualmente
 * desde cualquier lugar (perfil, menú de ayuda, etc.).
 */
export function OnboardingLauncher({ debeVerlo }: Props) {
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    if (debeVerlo) setActivo(true)
  }, [debeVerlo])

  useEffect(() => {
    function onStart() {
      setActivo(false)
      // Forzar remount en el siguiente tick
      window.setTimeout(() => setActivo(true), 50)
    }
    window.addEventListener("onboarding:start", onStart as EventListener)
    return () => window.removeEventListener("onboarding:start", onStart as EventListener)
  }, [])

  if (!activo) return null
  return <OnboardingTour onClose={() => setActivo(false)} />
}
