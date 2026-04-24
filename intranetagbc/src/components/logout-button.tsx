"use client"

import { Loader2, HandIcon, SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

function mostrarDespedida(nombre?: string | null) {
  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center gap-4 overflow-hidden rounded-2xl border border-[#FFB300]/40 bg-gradient-to-br from-[#FFB300]/15 via-background to-[#C41E3A]/10 p-4 shadow-2xl shadow-[#FFB300]/20 backdrop-blur-md ${
          t.visible
            ? "animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-500"
            : "animate-out fade-out zoom-out-95 slide-out-to-top-3 duration-300"
        }`}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg animate-pulse-glow">
          <HandIcon className="h-7 w-7" />
          <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-[#C41E3A] animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black tracking-tight bg-gradient-to-r from-[#C41E3A] via-[#FF8800] to-[#FFB300] bg-clip-text text-transparent">
            ¡Vuelve pronto{nombre ? `, ${nombre}` : ""}!
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gracias por tu trabajo hoy. Sesión cerrada correctamente.
          </p>
        </div>
      </div>
    ),
    { position: "top-center", duration: 3200 },
  )
}

export function LogoutButton({ nombre }: { nombre?: string | null }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setIsPending(true)
    try {
      await authClient.signOut()
      mostrarDespedida(nombre)
      // Pequeño delay para que el toast sea visible antes del reload
      window.setTimeout(() => {
        router.replace("/")
        router.refresh()
      }, 900)
    } catch {
      setIsPending(false)
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? (
        <>
          <Loader2 className="animate-spin" />
          Cerrando sesión...
        </>
      ) : (
        "Cerrar sesión"
      )}
    </Button>
  )
}
