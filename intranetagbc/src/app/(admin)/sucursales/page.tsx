import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerSucursales } from "@/actions/sucursales"
import { SucursalesModule } from "@/components/modules/sucursales-module"

export default async function SucursalesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.SUCURSALES.VER], roles: ["administrador"] })) redirect("/dashboard")

  const sucursales = await obtenerSucursales()
  return <SucursalesModule sucursales={sucursales} usuario={usuario} />
}
