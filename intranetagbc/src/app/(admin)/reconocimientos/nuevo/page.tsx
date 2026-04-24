import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  obtenerSucursalesParaReconocimiento,
  obtenerUsuariosParaReconocimiento,
} from "@/actions/reconocimientos"
import { ReconocimientoFormularioPage } from "@/components/modules/reconocimientos/formulario-page"
import type { TipoReconocimiento } from "@/lib/validations/reconocimientos"

const TIPOS_VALIDOS: TipoReconocimiento[] = ["empleado_mes", "equipo_destacado", "logro_sucursal"]

type Props = {
  searchParams: Promise<{ tipo?: string }>
}

export default async function NuevoReconocimientoPage({ searchParams }: Props) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.CREAR] })) {
    redirect("/reconocimientos")
  }

  const sp = await searchParams
  const tipoRaw = sp?.tipo ?? "empleado_mes"
  const tipo = (TIPOS_VALIDOS.includes(tipoRaw as TipoReconocimiento)
    ? tipoRaw
    : "empleado_mes") as TipoReconocimiento

  const [usuarios, sucursales] = await Promise.all([
    obtenerUsuariosParaReconocimiento(),
    obtenerSucursalesParaReconocimiento(),
  ])

  return (
    <ReconocimientoFormularioPage
      modo="crear"
      tipoInicial={tipo}
      usuarios={usuarios}
      sucursales={sucursales}
    />
  )
}
