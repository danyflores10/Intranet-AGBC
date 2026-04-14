"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import toast from "react-hot-toast"

import { crearRol } from "@/actions/roles"
import { RoleUpsertForm } from "@/components/roles/role-upsert-form"
import type { Permission, Role } from "@/types/roles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type RoleCreateDialogProps = {
  permissions: Permission[]
  onCreated: (role: Role) => void
}

export function RoleCreateDialog({ permissions, onCreated }: RoleCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleCreate(payload: { name: string; permissionIds: string[] }) {
    if (pending) {
      return
    }

    setPending(true)

    try {
      const result = await crearRol(payload)

      if (!result.success || !result.data) {
        toast.error(result.message)
        return
      }

      onCreated(result.data as Role)
      toast.success(result.message)
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20">
          <PlusIcon className="mr-2 h-4 w-4" />
          Nuevo rol
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
        <div className="p-6">
        <DialogHeader>
          <DialogTitle>Crear rol</DialogTitle>
          <DialogDescription>
            Define un nombre y selecciona los permisos que tendrá este rol.
          </DialogDescription>
        </DialogHeader>

        <RoleUpsertForm
          permissions={permissions}
          submitLabel="Crear rol"
          pending={pending}
          onSubmit={handleCreate}
        />
        </div>
      </DialogContent>
    </Dialog>
  )
}
