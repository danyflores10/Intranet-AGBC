import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerCorrespondencia } from "@/actions/correspondencia"
import { CorrespondenciaArchivo } from "@/components/modules/correspondencia/archivo"
import type { CorrespondenciaRow } from "@/components/modules/correspondencia/shared"

export default async function ArchivoPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.VER] })) {
    redirect("/dashboard")
  }

  const archivadas = (await obtenerCorrespondencia({ archivadas: true })) as unknown as CorrespondenciaRow[]
  const areas = Array.from(
    new Set(archivadas.map((c) => c.destinoArea).filter((a): a is string => Boolean(a))),
  ).sort()

  return <CorrespondenciaArchivo archivadas={archivadas} areas={areas} />
}
