import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerConfigPorGrupo } from "@/actions/configuracion"
import { SeccionesLandingModule } from "@/components/modules/secciones-landing-module"

export default async function SeccionesLandingPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!usuario.roles.includes("administrador")) redirect("/dashboard")

  const configs = await obtenerConfigPorGrupo("secciones_landing")

  return <SeccionesLandingModule configsIniciales={configs} />
}
