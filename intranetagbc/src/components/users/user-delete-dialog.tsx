"use client"

import { useState } from "react"
import { AlertTriangleIcon, Trash2Icon, Loader2Icon } from "lucide-react"
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
      <AlertDialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl border-2 border-red-500/20 bg-white shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-red-500 via-rose-600 to-red-700" />
        <div className="p-6 space-y-4">
          <AlertDialogHeader>
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
                <Trash2Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <AlertDialogTitle className="text-base font-black text-slate-900">
                  ¿Eliminar permanentemente a este usuario?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 font-medium">
                  Esta acción es definitiva e irreversible.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-red-900">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 shrink-0" />
              Eliminación física de la base de datos
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              Estás a punto de eliminar a <strong>{currentUser.name}</strong> ({currentUser.institutionalEmail}).
              Todos sus datos de acceso, roles y registros vinculados desaparecerán de forma permanente.
            </p>
          </div>

          <AlertDialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
            >
              {pending ? (
                <>
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2Icon className="h-3.5 w-3.5" />
                  Sí, Eliminar Permanentemente
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
