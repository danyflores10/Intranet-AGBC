import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerEventos } from "@/actions/calendario"
import { CalendarioModule } from "@/components/modules/calendario-module"

export default async function CalendarioPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CALENDARIO.VER, PERMISOS.AGENDA.VER] })) redirect("/dashboard")

  const eventos = await obtenerEventos()

  return <CalendarioModule eventos={eventos} />
}
