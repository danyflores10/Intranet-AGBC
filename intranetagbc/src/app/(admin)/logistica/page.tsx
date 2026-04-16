import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerInventario, obtenerSolicitudes, obtenerProveedores } from "@/actions/logistica"
import { LogisticaModule } from "@/components/modules/logistica-module"

export default async function LogisticaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.LOGISTICA.VER] })) redirect("/dashboard")

  const [inventario, solicitudes, proveedores] = await Promise.all([
    obtenerInventario(),
    obtenerSolicitudes(),
    obtenerProveedores(),
  ])

  return <LogisticaModule inventario={inventario} solicitudes={solicitudes} proveedores={proveedores} />
}