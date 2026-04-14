import { headers } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { auth } from "@/lib/auth"
import type { UsuarioRbac } from "@/lib/rbac"

type SessionUserWithAccess = {
  id: string
  name?: string | null
  firstName?: string | null
  lastNamePaternal?: string | null
  lastNameMaternal?: string | null
  email?: string | null
  institutionalEmail?: string | null
  image?: string | null
  roles?: string[]
  permissions?: string[]
}

export type SesionConAcceso = {
  id: string
  roles: string[]
  permissions: string[]
}

function normalizarLista(values?: string[]): string[] {
  const normalizados = (values ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)

  return [...new Set(normalizados)]
}

function limpiarTexto(value?: string | null): string {
  return (value ?? "").trim()
}

function obtenerCorreoUsuario(usuario: SessionUserWithAccess): string {
  const personalEmail = limpiarTexto(usuario.email).toLowerCase()

  if (personalEmail.length > 0) {
    return personalEmail
  }

  const institutionalEmail = limpiarTexto(usuario.institutionalEmail).toLowerCase()

  if (institutionalEmail.length > 0) {
    return institutionalEmail
  }

  return ""
}

function obtenerNombreUsuario(usuario: SessionUserWithAccess): string {
  const fullName = [
    limpiarTexto(usuario.firstName),
    limpiarTexto(usuario.lastNamePaternal),
    limpiarTexto(usuario.lastNameMaternal),
  ]
    .filter((part) => part.length > 0)
    .join(" ")

  if (fullName.length > 0) {
    return fullName
  }

  const directName = limpiarTexto(usuario.name)

  if (directName.length > 0) {
    return directName
  }

  const email = obtenerCorreoUsuario(usuario)
  const emailPrefix = email.split("@")[0]?.trim() ?? ""

  if (emailPrefix.length > 0) {
    return emailPrefix
  }

  return "Usuario"
}

async function obtenerPerfilUsuarioDesdeDb(userId: string): Promise<SessionUserWithAccess | null> {
  const [perfil] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastNamePaternal: users.lastNamePaternal,
      lastNameMaternal: users.lastNameMaternal,
      email: users.email,
      institutionalEmail: users.institutionalEmail,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!perfil) {
    return null
  }

  return perfil
}

export async function obtenerSesionActualSinCache() {
  return auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  })
}

export async function obtenerSesionConAccesoActual(): Promise<SesionConAcceso | null> {
  const sesion = await obtenerSesionActualSinCache()

  if (!sesion) {
    return null
  }

  const usuario = sesion.user as SessionUserWithAccess

  return {
    id: usuario.id,
    roles: normalizarLista(usuario.roles),
    permissions: normalizarLista(usuario.permissions),
  }
}

export async function obtenerUsuarioRbacActual(): Promise<UsuarioRbac | null> {
  const sesion = await obtenerSesionActualSinCache()

  if (!sesion) {
    return null
  }

  const usuarioSesion = sesion.user as SessionUserWithAccess
  let usuario = usuarioSesion

  try {
    const perfilDb = await obtenerPerfilUsuarioDesdeDb(usuarioSesion.id)

    if (perfilDb) {
      usuario = {
        ...usuarioSesion,
        ...perfilDb,
      }
    }
  } catch {
    usuario = usuarioSesion
  }

  const nombre = obtenerNombreUsuario(usuario)
  const correo = obtenerCorreoUsuario(usuario)

  return {
    id: usuario.id,
    name: nombre,
    email: correo,
    image: usuario.image,
    roles: normalizarLista(usuario.roles),
    permissions: normalizarLista(usuario.permissions),
  }
}
