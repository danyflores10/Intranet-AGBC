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
  const accessOpts = React.useMemo(
    () => crearContextoAcceso(usuario),
    [usuario],
  )

  const filteredItems = React.useMemo(
    () => items.filter((item) => puedeAcceder(item.access, accessOpts)),
    [items, accessOpts],
  )

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
