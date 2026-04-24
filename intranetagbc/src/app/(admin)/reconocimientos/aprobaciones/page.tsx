import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { listarReconocimientos } from "@/actions/reconocimientos"
import { ReconocimientosAprobaciones } from "@/components/modules/reconocimientos/aprobaciones"

export default async function AprobacionesReconocimientosPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.APROBAR] })) {
    redirect("/reconocimientos")
  }

  const pendientes = await listarReconocimientos({ estado: "pendiente" })

  return (
    <ReconocimientosAprobaciones
      pendientes={pendientes}
      puedePublicar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.PUBLICAR] })}
    />
  )
}
