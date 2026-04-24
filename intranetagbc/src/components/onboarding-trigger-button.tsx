"use client"

import { SparklesIcon } from "lucide-react"
import toast from "react-hot-toast"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { reiniciarOnboardingUsuarioActual } from "@/actions/onboarding"

export function OnboardingTriggerButton({
  size = "sm",
  className,
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const [isPending, startTransition] = useTransition()

  function iniciar() {
    startTransition(async () => {
      try {
        await reiniciarOnboardingUsuarioActual()
        toast.success("Lanzando tour guiado...")
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("onboarding:start"))
        }, 150)
      } catch {
        toast.error("No se pudo iniciar el tour")
      }
    })
  }

  return (
    <Button type="button" variant="outline" size={size} onClick={iniciar} disabled={isPending} className={className}>
      <SparklesIcon className="mr-1.5 h-4 w-4 text-[#FFB300]" />
      {isPending ? "Iniciando..." : "Ver tour guiado"}
    </Button>
  )
}
