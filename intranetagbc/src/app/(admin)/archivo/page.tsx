import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerPapeleraDocumentos } from "@/actions/archivo"
import { ArchivoModule } from "@/components/modules/archivo-module"

export default async function ArchivoPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.ARCHIVO.VER] })) redirect("/dashboard")

  const papeleraDocumentos = await obtenerPapeleraDocumentos()

  return <ArchivoModule papeleraDocumentos={papeleraDocumentos} />
}
