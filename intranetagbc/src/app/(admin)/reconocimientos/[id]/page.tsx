import { notFound, redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerDetalleReconocimiento } from "@/actions/reconocimientos"
import { ReconocimientoDetalleView } from "@/components/modules/reconocimientos/detalle"

type Props = {
  params: Promise<{ id: string }>
}

export default async function DetalleReconocimientoPage({ params }: Props) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.VER] })) {
    redirect("/dashboard")
  }

  const { id } = await params
  const detalle = await obtenerDetalleReconocimiento(id)
  if (!detalle) notFound()

  return (
    <ReconocimientoDetalleView
      detalle={detalle}
      puedeEditar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.EDITAR] })}
      puedeAprobar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.APROBAR] })}
      puedePublicar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.PUBLICAR] })}
      puedeArchivar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.ARCHIVAR] })}
      puedeDestacar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.DESTACAR] })}
      puedeLanding={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.LANDING] })}
      puedeEliminar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.ELIMINAR] })}
    />
  )
}
