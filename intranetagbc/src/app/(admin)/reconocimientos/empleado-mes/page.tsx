import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { listarReconocimientos } from "@/actions/reconocimientos"
import { ReconocimientosListado } from "@/components/modules/reconocimientos/listado"

export default async function ListadoEmpleadoMesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.VER] })) {
    redirect("/dashboard")
  }

  const items = await listarReconocimientos({ tipo: "empleado_mes" })

  return (
    <ReconocimientosListado
      titulo="Empleado del Mes"
      tipo="empleado_mes"
      items={items}
      puedeCrear={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.CREAR] })}
      puedeAprobar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.APROBAR] })}
      puedePublicar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.PUBLICAR] })}
      puedeArchivar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.ARCHIVAR] })}
      puedeDestacar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.DESTACAR] })}
      puedeLanding={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.LANDING] })}
      puedeEliminar={puedeAccederUsuario(usuario, { permissions: [PERMISOS.RECONOCIMIENTOS.ELIMINAR] })}
    />
  )
}
