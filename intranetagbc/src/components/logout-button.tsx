"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function LogoutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setIsPending(true)

    try {
      await authClient.signOut()
      router.replace("/login")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      {isPending ? (
        <>
          <Loader2 className="animate-spin" />
          Cerrando sesion...
        </>
      ) : (
        "Cerrar sesion"
      )}
    </Button>
  )
}
