"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

const roles = ["Administrador", "Director", "Jefe de unidad", "Analista", "Técnico", "Asesor", "Auxiliar"]
const unidades = ["Gerencia General", "Dir. Administrativa", "Dir. Financiera", "Dir. Comercial", "Dir. Legal", "RRHH", "TIC", "Planificación", "Logística", "Auditoría Interna"]

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string

    if (!nombre || !email) {
      toast.error("Complete todos los campos obligatorios")
      setLoading(false)
      return
    }

    // Simular creación
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`Usuario "${nombre}" creado exitosamente`)
    setLoading(false)
    router.push("/dashboard/usuarios")
  }

  return (
    <>
      <ModuleHeader title="Nuevo usuario" parent={{ label: "Usuarios", href: "/dashboard/usuarios" }} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/usuarios">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Registrar nuevo usuario</h2>
            <p className="text-sm text-muted-foreground">Complete la información para crear una nueva cuenta de acceso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <Card className="border-border/40">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Información personal</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input id="nombre" name="nombre" placeholder="Nombre y apellidos" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ci">Cédula de identidad</Label>
                  <Input id="ci" name="ci" placeholder="Ej: 1234567" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input id="email" name="email" type="email" placeholder="usuario@correos.gob.bo" required />
                  <p className="text-xs text-muted-foreground">Solo dominios @correos.gob.bo y @agbc.gob.bo</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" name="telefono" placeholder="Ej: 71234567" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acceso y rol</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol *</Label>
                  <select
                    id="rol"
                    name="rol"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad organizacional *</Label>
                  <select
                    id="unidad"
                    name="unidad"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar unidad</option>
                    {unidades.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña temporal *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">El usuario deberá cambiar su contraseña en el primer inicio de sesión</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              {loading ? "Guardando..." : "Crear usuario"}
            </Button>
            <Link href="/dashboard/usuarios">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
