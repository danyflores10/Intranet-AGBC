import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PerfilModule } from "@/components/modules/perfil-module"

export default async function PerfilPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")

  const [perfil] = await db.select().from(users).where(eq(users.id, usuario.id)).limit(1)
  if (!perfil) redirect("/login")

  return <PerfilModule perfil={{
    id: perfil.id,
    firstName: perfil.firstName,
    lastNamePaternal: perfil.lastNamePaternal,
    lastNameMaternal: perfil.lastNameMaternal ?? "",
    email: perfil.email ?? "",
    institutionalEmail: perfil.institutionalEmail,
    nationalId: perfil.nationalId,
    dateOfBirth: perfil.dateOfBirth,
    image: perfil.image,
    roles: usuario.roles,
  }} />
}