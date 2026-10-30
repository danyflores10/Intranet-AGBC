"use client"

import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import type { AccessRule } from "@/components/sidebar/nav-config"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  usuario,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    access?: AccessRule
    tourKey?: string
  }[]
  usuario: UsuarioRbac
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const esAdmin = React.useMemo(() => {
    return (usuario?.roles || []).some((r) =>
      ["administrador", "admin", "super_admin"].includes(r.toLowerCase().trim())
    )
  }, [usuario?.roles])

  const accessOpts = React.useMemo(
    () => crearContextoAcceso(usuario),
    [usuario],
  )

  const filteredItems = React.useMemo(() => {
    if (!esAdmin) return []
    return items.filter((item) => puedeAcceder(item.access, accessOpts))
  }, [items, accessOpts, esAdmin])

  if (!esAdmin || filteredItems.length === 0) {
    return null
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title} data-tour={item.tourKey}>
              <SidebarMenuButton asChild size="sm">
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
