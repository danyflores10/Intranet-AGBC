import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerConfiguracion } from "@/actions/configuracion"
import { ConfiguracionModule } from "@/components/modules/configuracion-module"

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CONFIGURACION.VER], roles: ["administrador"] })) redirect("/dashboard")

  const configs = await obtenerConfiguracion()
  return <ConfiguracionModule configs={configs} />
}