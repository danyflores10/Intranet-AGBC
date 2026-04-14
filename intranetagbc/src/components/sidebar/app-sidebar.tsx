"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavUser } from "@/components/sidebar/nav-user"
import { sidebarData } from "@/components/sidebar/nav-config"
import type { UsuarioRbac } from "@/lib/rbac"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  usuario: UsuarioRbac
}

export function AppSidebar({ usuario, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/image/Logooriginal.png"
                    alt="AGBC"
                    width={32}
                    height={32}
                    className="size-8 object-contain dark:hidden"
                  />
                  <Image
                    src="/image/LogoAmarillo.png"
                    alt="AGBC"
                    width={32}
                    height={32}
                    className="hidden size-8 object-contain dark:block"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">Intranet AGBC</span>
                  <span className="truncate text-xs text-muted-foreground">Correos de Bolivia</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={sidebarData.main} usuario={usuario} />
        <NavSecondary items={sidebarData.secondary} usuario={usuario} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser usuario={usuario} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
