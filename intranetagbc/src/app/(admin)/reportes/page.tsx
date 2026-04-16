import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerConteos } from "@/actions/reportes"
import { ReportesModule } from "@/components/modules/reportes-module"

export default async function ReportesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.REPORTES.VER] })) redirect("/dashboard")

  const counts = await obtenerConteos()
  return <ReportesModule counts={counts} />
}