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
  useSidebar,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  usuario: UsuarioRbac
}

function CorreosSobreIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Línea Roja */}
      <path d="M18 10 L48 8 L44 17 L12 17 Z" fill="#D9222A" />
      {/* Línea Amarilla */}
      <path d="M6 19 L58 17 L54 26 L1 26 Z" fill="#F8B100" stroke="#D97706" strokeWidth="0.8" />
      {/* Línea Verde */}
      <path d="M9 28 L66 26 L62 35 L4 35 Z" fill="#008E3D" />
      {/* Sobre Azul */}
      <path d="M43 8 L98 5 L90 38 L35 38 Z" fill="#004D9D" />
      {/* Solapa del sobre */}
      <path d="M43 8 L68 25 L98 5" stroke="#002F6C" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M35 38 L61 21" stroke="#002F6C" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M90 38 L74 21" stroke="#002F6C" strokeWidth="2" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function AppSidebar({ usuario, ...props }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="justify-center hover:bg-transparent p-0">
              <Link href="/dashboard">
                <div className={`flex items-center justify-center bg-[#FFCC00] rounded-xl shadow-sm transition-all ${
                  isCollapsed ? "h-11 w-11 p-1.5" : "w-full py-2 px-3"
                }`}>
                  {isCollapsed ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <CorreosSobreIcon className="h-6 w-auto" />
                    </div>
                  ) : (
                    <Image
                      src="/image/Logooriginal.png"
                      alt="Correos de Bolivia"
                      width={160}
                      height={48}
                      className="h-10 w-auto object-contain drop-shadow-xs"
                      style={{ width: "auto" }}
                      priority
                    />
                  )}
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
