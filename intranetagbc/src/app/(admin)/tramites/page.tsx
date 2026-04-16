import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerTramites } from "@/actions/tramites"
import { TramitesModule } from "@/components/modules/tramites-module"

export default async function TramitesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.TRAMITES.VER] })) redirect("/dashboard")

  const tramites = await obtenerTramites()
  return <TramitesModule tramites={tramites} />
}