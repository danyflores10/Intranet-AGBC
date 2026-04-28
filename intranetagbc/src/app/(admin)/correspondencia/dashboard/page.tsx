import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerStatsCorrespondencia } from "@/actions/correspondencia"
import { CorrespondenciaDashboard } from "@/components/modules/correspondencia/dashboard"

export default async function DashboardCorrespondenciaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.VER] })) {
    redirect("/dashboard")
  }
  const stats = await obtenerStatsCorrespondencia()
  return <CorrespondenciaDashboard stats={stats} />
}
