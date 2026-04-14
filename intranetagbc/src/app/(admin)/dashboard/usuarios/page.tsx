"use client"

import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const usuarios = [
  { id: "1", nombre: "Daniel Wilson Flores", email: "daniel.flores@agbc.gob.bo", rol: "Administrador", unidad: "TIC", estado: "activo" as const, ultimoAcceso: "28/03/2026 14:30" },
  { id: "2", nombre: "Ana María López", email: "ana.lopez@correos.gob.bo", rol: "Director", unidad: "Dir. Administrativa", estado: "activo" as const, ultimoAcceso: "28/03/2026 11:15" },
  { id: "3", nombre: "Carlos Mendoza", email: "carlos.mendoza@correos.gob.bo", rol: "Jefe de unidad", unidad: "RRHH", estado: "activo" as const, ultimoAcceso: "27/03/2026 16:45" },
  { id: "4", nombre: "María Elena Rojas", email: "maria.rojas@correos.gob.bo", rol: "Analista", unidad: "Dir. Financiera", estado: "activo" as const, ultimoAcceso: "28/03/2026 09:00" },
  { id: "5", nombre: "Roberto Huanca", email: "roberto.huanca@correos.gob.bo", rol: "Técnico", unidad: "TIC", estado: "activo" as const, ultimoAcceso: "28/03/2026 13:20" },
  { id: "6", nombre: "Sandra Quisbert", email: "sandra.quisbert@correos.gob.bo", rol: "Asesor", unidad: "Dir. Legal", estado: "activo" as const, ultimoAcceso: "26/03/2026 10:00" },
  { id: "7", nombre: "Juan Pablo Condori", email: "juan.condori@correos.gob.bo", rol: "Auxiliar", unidad: "Logística", estado: "inactivo" as const, ultimoAcceso: "15/02/2026 08:30" },
  { id: "8", nombre: "Patricia Mamani", email: "patricia.mamani@correos.gob.bo", rol: "Analista", unidad: "Planificación", estado: "activo" as const, ultimoAcceso: "28/03/2026 12:00" },
]

export default function UsuariosPage() {
  return (
    <>
      <ModuleHeader title="Usuarios" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Gestión de usuarios</h2>
            <p className="text-sm text-muted-foreground">
              Administra las cuentas de acceso al sistema
            </p>
          </div>
          <Link href="/dashboard/usuarios/nuevo">
            <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20">
              <PlusIcon className="mr-2 h-4 w-4" />
              Nuevo usuario
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#FFB300]/10 p-2"><ShieldIcon className="h-5 w-5 text-[#FFB300]" /></div>
                <div><div className="text-2xl font-bold">{usuarios.length}</div><div className="text-xs text-muted-foreground">Total usuarios</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2"><UserCheckIcon className="h-5 w-5 text-green-600" /></div>
                <div><div className="text-2xl font-bold">{usuarios.filter(u => u.estado === "activo").length}</div><div className="text-xs text-muted-foreground">Activos</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2"><UserXIcon className="h-5 w-5 text-red-500" /></div>
                <div><div className="text-2xl font-bold">{usuarios.filter(u => u.estado === "inactivo").length}</div><div className="text-xs text-muted-foreground">Inactivos</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{new Set(usuarios.map(u => u.rol)).size}</div>
              <div className="text-xs text-muted-foreground">Roles distintos</div>
            </CardContent>
          </Card>
        </div>

        <DataTable
          data={usuarios}
          searchKey="nombre"
          searchPlaceholder="Buscar usuario..."
          columns={[
            { key: "nombre", label: "Nombre", render: (row) => <span className="font-medium">{row.nombre}</span> },
            { key: "email", label: "Email", render: (row) => <span className="text-sm text-muted-foreground">{row.email}</span> },
            { key: "rol", label: "Rol", render: (row) => (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{row.rol}</span>
            )},
            { key: "unidad", label: "Unidad" },
            { key: "ultimoAcceso", label: "Último acceso", render: (row) => <span className="text-xs text-muted-foreground">{row.ultimoAcceso}</span> },
            { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado} /> },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast.success(`Viendo: ${row.nombre}`)}><EyeIcon className="h-4 w-4 text-muted-foreground" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast.success(`Editando: ${row.nombre}`)}><PencilIcon className="h-4 w-4 text-muted-foreground" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => toast.error(`Desactivado: ${row.nombre}`)}><Trash2Icon className="h-4 w-4" /></Button>
            </div>
          )}
        />
      </div>
    </>
  )
}
