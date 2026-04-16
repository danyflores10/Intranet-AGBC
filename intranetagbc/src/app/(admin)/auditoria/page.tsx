import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerStatsAuditoria } from "@/actions/auditoria"
import { AuditoriaModule } from "@/components/modules/auditoria-module"

export default async function AuditoriaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.AUDITORIA.VER] })) redirect("/dashboard")

  const result = await obtenerStatsAuditoria()
  return <AuditoriaModule logs={result.logs} stats={{ total: result.total, exitosos: result.exitosos, fallidos: result.fallidos, modulos: result.modulos }} />
}