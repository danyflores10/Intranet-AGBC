"use client"

import { useState } from "react"
import toast from "react-hot-toast"

import { editarRol } from "@/actions/roles"
import { RoleUpsertForm } from "@/components/roles/role-upsert-form"
import type { Permission, Role } from "@/types/roles"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type RoleEditDialogProps = {
  role: Role | null
  permissions: Permission[]
  onUpdated: (role: Role) => void
  onClose: () => void
}

export function RoleEditDialog({
  role,
  permissions,
  onUpdated,
  onClose,
}: RoleEditDialogProps) {
  const [pending, setPending] = useState(false)

  if (!role) {
    return null
  }

  const currentRole = role

  async function handleEdit(payload: { name: string; permissionIds: string[] }) {
    if (pending) {
      return
    }

    setPending(true)

    try {
      const result = await editarRol(currentRole.id, payload)

      if (!result.success || !result.data) {
        toast.error(result.message)
        return
      }

      onUpdated(result.data as Role)
      toast.success(result.message)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(role)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB800] via-[#0077EE] to-[#0E5296]" />
        <div className="p-6">
        <DialogHeader>
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription>
            Actualiza el nombre y los permisos asignados al rol.
          </DialogDescription>
        </DialogHeader>

        <RoleUpsertForm
          key={currentRole.id}
          permissions={permissions}
          defaultName={currentRole.name}
          defaultPermissionIds={currentRole.permissions.map((permission) => permission.id)}
          submitLabel="Guardar cambios"
          pending={pending}
          onSubmit={handleEdit}
        />
        </div>
      </DialogContent>
    </Dialog>
  )
}
