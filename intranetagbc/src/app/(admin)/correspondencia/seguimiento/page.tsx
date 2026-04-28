import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  obtenerCorrespondencia,
  obtenerCorrespondenciaPorId,
  obtenerUsuariosBasicos,
} from "@/actions/correspondencia"
import { CorrespondenciaSeguimiento } from "@/components/modules/correspondencia/seguimiento"

export default async function SeguimientoPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.VER] })) {
    redirect("/dashboard")
  }

  const [items, usuarios] = await Promise.all([
    obtenerCorrespondencia(),
    obtenerUsuariosBasicos(),
  ])

  const detalles = await Promise.all(
    items.map((c) => obtenerCorrespondenciaPorId(c.id)),
  )

  const enriched = detalles.filter((d): d is NonNullable<typeof d> => d !== null)

  const puedeEditar = puedeAccederUsuario(usuario, {
    permissions: [PERMISOS.CORRESPONDENCIA.EDITAR],
  })
  const puedeArchivar = puedeAccederUsuario(usuario, {
    permissions: [PERMISOS.CORRESPONDENCIA.ARCHIVAR, PERMISOS.CORRESPONDENCIA.EDITAR],
  })

  return (
    <CorrespondenciaSeguimiento
      items={enriched as unknown as Parameters<typeof CorrespondenciaSeguimiento>[0]["items"]}
      usuarios={usuarios}
      puedeArchivar={puedeArchivar}
      puedeEditar={puedeEditar}
    />
  )
}
