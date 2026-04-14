import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerPersonal, obtenerDirectivos } from "@/actions/rrhh"
import { RrhhModule } from "@/components/modules/rrhh-module"

export default async function RrhhPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RRHH.VER] })) redirect("/dashboard")

  const [personal, directivosDb] = await Promise.all([
    obtenerPersonal(),
    obtenerDirectivos(),
  ])
  return <RrhhModule personal={personal} directivos={directivosDb} />
}