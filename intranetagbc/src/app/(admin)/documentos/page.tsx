import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerDocumentos, obtenerCategorias } from "@/actions/documentos"
import { DocumentosModule } from "@/components/modules/documentos-module"

export default async function DocumentosPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.DOCUMENTOS.VER] })) redirect("/dashboard")

  const [documentos, categorias] = await Promise.all([
    obtenerDocumentos(),
    obtenerCategorias(),
  ])

  return <DocumentosModule documentos={documentos} categorias={categorias} />
}