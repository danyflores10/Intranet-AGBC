import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerDocumentos, obtenerCategorias } from "@/actions/documentos"
import { DocumentosModule } from "@/components/modules/documentos-module"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DocumentosPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")

  const tieneAcceso = puedeAccederUsuario(usuario, {
    roles: ["administrador", "admin", "super_admin", "gestor", "usuario"],
    permissions: [PERMISOS.DOCUMENTOS.VER],
  })

  if (!tieneAcceso) redirect("/dashboard")

  const [documentos, categorias] = await Promise.all([
    obtenerDocumentos(),
    obtenerCategorias(),
  ])

  return <DocumentosModule documentos={documentos} categorias={categorias} usuario={usuario} />
}
