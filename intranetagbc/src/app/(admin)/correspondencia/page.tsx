import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerCorrespondencia, obtenerStatsCorrespondencia } from "@/actions/correspondencia"
import { CorrespondenciaModule } from "@/components/modules/correspondencia-module"

export default async function CorrespondenciaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.VER] })) redirect("/dashboard")

  const [todas, stats] = await Promise.all([
    obtenerCorrespondencia(),
    obtenerStatsCorrespondencia(),
  ])

  const entrada = todas.filter(c => c.tipo === "entrada")
  const salida = todas.filter(c => c.tipo === "salida")

  return <CorrespondenciaModule entrada={entrada} salida={salida} stats={stats} />
}