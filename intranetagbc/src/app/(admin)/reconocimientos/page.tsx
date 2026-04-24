import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  listarReconocimientos,
  obtenerStatsReconocimientos,
} from "@/actions/reconocimientos"
import { ReconocimientosDashboard } from "@/components/modules/reconocimientos/dashboard"

export default async function ReconocimientosPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.VER] })) {
    redirect("/dashboard")
  }

  const [stats, recientes] = await Promise.all([
    obtenerStatsReconocimientos(),
    listarReconocimientos({}),
  ])

  return (
    <ReconocimientosDashboard
      stats={stats}
      recientes={recientes.slice(0, 8)}
      puedeCrear={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.CREAR] })}
      puedeAprobar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.APROBAR] })}
    />
  )
}
