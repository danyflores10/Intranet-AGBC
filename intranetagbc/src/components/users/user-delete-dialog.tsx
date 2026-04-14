"use client"

import { useState } from "react"
import { AlertTriangleIcon, UserXIcon } from "lucide-react"
import toast from "react-hot-toast"

import { eliminarUsuario } from "@/actions/usuarios"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { User } from "@/types/users"

type UserDeleteDialogProps = {
  user: User | null
  onDeleted: (userId: string) => void
  onClose: () => void
}

export function UserDeleteDialog({ user, onDeleted, onClose }: UserDeleteDialogProps) {
  const [pending, setPending] = useState(false)

  if (!user) {
    return null
  }

  const currentUser = user

  async function handleDelete() {
    if (pending) {
      return
    }

    setPending(true)

    try {
      const result = await eliminarUsuario(currentUser.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      onDeleted(currentUser.id)
      toast.success(result.message)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
        <div className="p-6 space-y-4">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <UserXIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
              <AlertDialogDescription>
                El usuario sera desactivado y no podra acceder al sistema.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="h-4 w-4" />
            Desactivacion de cuenta
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Vas a desactivar al usuario <strong>{currentUser.name}</strong>. Su cuenta quedara
            inactiva y no podra iniciar sesion. Puedes reactivarlo luego editando su estado.
          </p>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={pending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {pending ? "Desactivando..." : "Desactivar"}
          </Button>
        </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
