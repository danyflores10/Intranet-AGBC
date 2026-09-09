"use client"

import { useState } from "react"
import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react"
import toast from "react-hot-toast"

import { eliminarRol } from "@/actions/roles"
import type { Role } from "@/types/roles"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type RoleDeleteDialogProps = {
  role: Role | null
  onDeleted: (roleId: string) => void
  onClose: () => void
}

export function RoleDeleteDialog({ role, onDeleted, onClose }: RoleDeleteDialogProps) {
  const [pending, setPending] = useState(false)

  if (!role) {
    return null
  }

  const currentRole = role

  async function handleDelete() {
    if (pending) {
      return
    }

    setPending(true)

    try {
      const result = await eliminarRol(currentRole.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      onDeleted(currentRole.id)
      toast.success(result.message)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(role)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB800] via-[#0077EE] to-[#0E5296]" />
        <div className="p-6 space-y-4">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-600 dark:text-red-400">
              <ShieldAlertIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion eliminara permanentemente el rol seleccionado.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
            <AlertTriangleIcon className="h-4 w-4" />
            Accion irreversible
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Vas a eliminar el rol <strong>{currentRole.name}</strong>. Los usuarios con este
            rol perderan los permisos asociados inmediatamente.
          </p>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
