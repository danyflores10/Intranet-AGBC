"use client"

import type { ReactNode } from "react"

import { puedeAccederUsuario, type ReglaAcceso, type UsuarioRbac } from "@/lib/rbac"

type RequireAccessProps = {
  usuario: UsuarioRbac
  access?: ReglaAcceso
  fallback?: ReactNode
  children: ReactNode
}

export function RequireAccess({
  usuario,
  access,
  fallback = null,
  children,
}: RequireAccessProps) {
  if (!puedeAccederUsuario(usuario, access)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
