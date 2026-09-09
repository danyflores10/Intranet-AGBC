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
  triggerLabel?: string
  triggerClassName?: string
}

export function RoleCreateDialog({
  permissions,
  onCreated,
  triggerLabel,
  triggerClassName,
}: RoleCreateDialogProps) {
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
        <Button
          className={
            triggerClassName ??
            "bg-[#0E5296] hover:bg-[#002F6C] text-white border-0 font-bold shadow-md shadow-[#0E5296]/20 cursor-pointer"
          }
        >
          <PlusIcon className="mr-2 h-4 w-4 text-[#FFB800]" />
          {triggerLabel ?? "Nuevo rol"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-[#0E5296]" />
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
