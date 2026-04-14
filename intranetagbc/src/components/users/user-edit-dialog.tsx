"use client"

import { useState } from "react"
import toast from "react-hot-toast"

import { editarUsuario } from "@/actions/usuarios"
import { UserUpsertForm } from "@/components/users/user-upsert-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RoleOption, User, UserUpdatePayload, UserUpsertPayload } from "@/types/users"

type UserEditDialogProps = {
  user: User | null
  roles: RoleOption[]
  onUpdated: (user: User) => void
  onClose: () => void
}

export function UserEditDialog({
  user,
  roles,
  onUpdated,
  onClose,
}: UserEditDialogProps) {
  const [pending, setPending] = useState(false)

  if (!user) {
    return null
  }

  const currentUser = user

  async function handleEdit(payload: UserUpsertPayload) {
    if (pending) {
      return
    }

    setPending(true)

    try {
      const updatePayload: UserUpdatePayload = {
        firstName: payload.firstName,
        lastNamePaternal: payload.lastNamePaternal,
        lastNameMaternal: payload.lastNameMaternal,
        email: payload.email,
        institutionalEmail: payload.institutionalEmail,
        nationalId: payload.nationalId,
        dateOfBirth: payload.dateOfBirth,
        isActive: payload.isActive,
        roleIds: payload.roleIds,
        ...(typeof payload.password === "string" && payload.password.length > 0
          ? { password: payload.password }
          : {}),
      }

      const result = await editarUsuario(currentUser.id, updatePayload)

      if (!result.success || !result.data) {
        toast.error(result.message)
        return
      }

      onUpdated(result.data as User)
      toast.success(result.message)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
        <div className="p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Editar usuario</DialogTitle>
          <DialogDescription>
            Actualiza los datos del usuario y sus roles asignados.
          </DialogDescription>
        </DialogHeader>

        <UserUpsertForm
          key={currentUser.id}
          mode="edit"
          roles={roles}
          defaultFirstName={currentUser.firstName}
          defaultLastNamePaternal={currentUser.lastNamePaternal}
          defaultLastNameMaternal={currentUser.lastNameMaternal ?? ""}
          defaultEmail={currentUser.email}
          defaultInstitutionalEmail={currentUser.institutionalEmail}
          defaultNationalId={currentUser.nationalId}
          defaultDateOfBirth={currentUser.dateOfBirth}
          defaultIsActive={currentUser.isActive}
          defaultRoleIds={currentUser.roles.map((role) => role.id)}
          submitLabel="Guardar cambios"
          pending={pending}
          onSubmit={handleEdit}
        />
        </div>
      </DialogContent>
    </Dialog>
  )
}
