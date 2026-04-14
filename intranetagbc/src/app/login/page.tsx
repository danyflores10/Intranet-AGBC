import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"

export default async function LoginPage() {
  const usuario = await obtenerUsuarioRbacActual()

  if (usuario) {
    const esAdmin = usuario.roles.includes("administrador")
    redirect(esAdmin ? "/dashboard" : "/")
  }

  return <LoginForm />
}
