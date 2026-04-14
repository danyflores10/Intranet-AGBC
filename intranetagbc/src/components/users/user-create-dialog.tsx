"use client"

import { useState } from "react"
import { UserPlusIcon } from "lucide-react"
import toast from "react-hot-toast"

import { crearUsuario } from "@/actions/usuarios"
import { UserUpsertForm } from "@/components/users/user-upsert-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { RoleOption, User, UserCreatePayload, UserUpsertPayload } from "@/types/users"

type UserCreateDialogProps = {
  roles: RoleOption[]
  onCreated: (user: User) => void
}

export function UserCreateDialog({ roles, onCreated }: UserCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleCreate(payload: UserUpsertPayload) {
    if (pending) {
      return
    }

    if (!("password" in payload) || typeof payload.password !== "string") {
      toast.error("La contrasena es obligatoria para crear el usuario.")
      return
    }

    setPending(true)

    try {
      const createPayload: UserCreatePayload = {
        firstName: payload.firstName,
        lastNamePaternal: payload.lastNamePaternal,
        lastNameMaternal: payload.lastNameMaternal,
        email: payload.email,
        institutionalEmail: payload.institutionalEmail,
        nationalId: payload.nationalId,
        dateOfBirth: payload.dateOfBirth,
        isActive: payload.isActive,
        password: payload.password,
        roleIds: payload.roleIds,
      }

      const result = await crearUsuario(createPayload)

      if (!result.success || !result.data) {
        toast.error(result.message)
        return
      }

      onCreated(result.data as User)
      toast.success(result.message)
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border-0 bg-gradient-to-r from-[#FFB300] to-[#FF8800] font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Nuevo usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
        <div className="p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlusIcon className="h-5 w-5 text-[#FFB300]" />
            Crear usuario
          </DialogTitle>
          <DialogDescription>
            Registra una cuenta nueva y define sus roles iniciales.
          </DialogDescription>
        </DialogHeader>

        <UserUpsertForm
          mode="create"
          roles={roles}
          submitLabel="Crear usuario"
          pending={pending}
          onSubmit={handleCreate}
        />
        </div>
      </DialogContent>
    </Dialog>
  )
}
