import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerBandeja } from "@/actions/correspondencia"
import { CorrespondenciaBandeja } from "@/components/modules/correspondencia/bandeja"
import type { CorrespondenciaRow } from "@/components/modules/correspondencia/shared"

export default async function CorrespondenciaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.VER] })) {
    redirect("/dashboard")
  }

  const bandeja = await obtenerBandeja(usuario.id)

  const conteos = {
    todas: bandeja.todas.length,
    recibidos: bandeja.recibidos.length,
    enviados: bandeja.enviados.length,
    asignadosAMi: bandeja.asignadosAMi.length,
    pendientes: bandeja.pendientes.length,
    derivados: bandeja.derivados.length,
    urgentes: bandeja.urgentes.length,
    vencidos: bandeja.vencidos.length,
    archivadas: bandeja.archivadas.length,
    finalizados: bandeja.finalizados.length,
  }

  const puedeCrear = puedeAccederUsuario(usuario, {
    permissions: [PERMISOS.CORRESPONDENCIA.CREAR],
  })
  const puedeEliminar = puedeAccederUsuario(usuario, {
    permissions: [PERMISOS.CORRESPONDENCIA.ELIMINAR],
  })
  const puedeDerivar = puedeAccederUsuario(usuario, {
    permissions: [PERMISOS.CORRESPONDENCIA.DERIVAR, PERMISOS.CORRESPONDENCIA.EDITAR],
  })

  return (
    <CorrespondenciaBandeja
      bandeja={bandeja as unknown as Parameters<typeof CorrespondenciaBandeja>[0]["bandeja"]}
      conteos={conteos}
      puedeCrear={puedeCrear}
      puedeEliminar={puedeEliminar}
      puedeDerivar={puedeDerivar}
    />
  )
}

// Garantizamos que el tipo está disponible donde se usa
export type { CorrespondenciaRow }
