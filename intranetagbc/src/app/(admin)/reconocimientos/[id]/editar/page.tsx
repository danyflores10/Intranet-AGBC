import { notFound, redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  obtenerDetalleReconocimiento,
  obtenerSucursalesParaReconocimiento,
  obtenerUsuariosParaReconocimiento,
} from "@/actions/reconocimientos"
import { ReconocimientoFormularioPage } from "@/components/modules/reconocimientos/formulario-page"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditarReconocimientoPage({ params }: Props) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.EDITAR] })) {
    redirect("/reconocimientos")
  }

  const { id } = await params
  const [detalle, usuarios, sucursales] = await Promise.all([
    obtenerDetalleReconocimiento(id),
    obtenerUsuariosParaReconocimiento(),
    obtenerSucursalesParaReconocimiento(),
  ])

  if (!detalle) notFound()

  return (
    <ReconocimientoFormularioPage
      modo="editar"
      tipoInicial={detalle.tipo}
      detalle={detalle}
      usuarios={usuarios}
      sucursales={sucursales}
    />
  )
}
