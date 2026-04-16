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
            <SidebarMenuButton size="lg" asChild className="justify-center">
              <Link href="/dashboard">
                <div className="flex items-center justify-center overflow-hidden">
                  <Image
                    src="/image/Logooriginal.png"
                    alt="Correos de Bolivia"
                    width={140}
                    height={50}
                    className="h-10 w-auto object-contain dark:hidden"
                    style={{ width: "auto" }}
                  />
                  <Image
                    src="/image/LogoAmarillo.png"
                    alt="Correos de Bolivia"
                    width={140}
                    height={50}
                    className="hidden h-10 w-auto object-contain dark:block"
                    style={{ width: "auto" }}
                  />
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
