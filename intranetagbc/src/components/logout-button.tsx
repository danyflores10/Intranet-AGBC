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
        className={`pointer-events-auto flex w-full max-w-md items-center gap-4 overflow-hidden rounded-2xl border-2 border-[#002F6C]/20 bg-white p-4 shadow-2xl shadow-[#0E5296]/20 ${
          t.visible
            ? "animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-500"
            : "animate-out fade-out zoom-out-95 slide-out-to-top-3 duration-300"
        }`}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFB800] shadow-lg shadow-[#0E5296]/25">
          <HandIcon className="h-7 w-7" />
          <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-[#FFB800]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black tracking-tight text-[#002F6C]">
            ¡Vuelve pronto{nombre ? `, ${nombre}` : ""}!
          </p>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
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
