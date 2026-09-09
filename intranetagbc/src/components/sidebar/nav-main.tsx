"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import type { NavGroup, NavItem, AccessRule } from "@/components/sidebar/nav-config"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

function matchRoute(pathname: string, url: string): boolean {
  if (url === "/") {
    return pathname === "/"
  }

  return pathname === url || pathname.startsWith(url + "/")
}

function getMostSpecificSubRoute(pathname: string, urls: string[]): string | null {
  const matches = urls
    .filter((url) => matchRoute(pathname, url))
    .sort((a, b) => b.length - a.length)

  return matches[0] ?? null
}

function filterGroup(
  group: NavGroup,
  accessOpts: ReturnType<typeof crearContextoAcceso>,
): NavGroup {
  const items: NavItem[] = group.items
    .filter((item) => puedeAcceder(item.access as AccessRule, accessOpts))
    .map((item) => {
      const subItems = item.items
        ?.filter((subItem) => puedeAcceder(subItem.access as AccessRule, accessOpts))
        .filter(Boolean)

      if (item.items?.length && (!subItems || subItems.length === 0)) {
        return null as unknown as NavItem
      }

      return { ...item, items: subItems }
    })
    .filter(Boolean)

  return { ...group, items }
}

export function NavMain({ groups, usuario }: { groups: NavGroup[]; usuario: UsuarioRbac }) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  const accessOpts = React.useMemo(
    () => crearContextoAcceso(usuario),
    [usuario],
  )

  const filteredGroups = React.useMemo(
    () =>
      groups
        .filter((group) => group.items.length > 0)
        .map((group) => filterGroup(group, accessOpts))
        .filter((group) => group.items.length > 0),
    [groups, accessOpts],
  )

  // Abrir automáticamente el grupo colapsable si la ruta activa coincide con alguno de sus sub-ítems
  React.useEffect(() => {
    filteredGroups.forEach((group) => {
      group.items.forEach((item) => {
        const matchesSub = item.items?.some((sub) => matchRoute(pathname, sub.url))
        const matchesMain = matchRoute(pathname, item.url)
        if (matchesSub || matchesMain) {
          setOpenItems((prev) => ({ ...prev, [item.title]: true }))
        }
      })
    })
  }, [pathname, filteredGroups])

  return (
    <>
      {filteredGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel className="text-white/70 font-black text-[11px] uppercase tracking-wider">
            {group.label}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const hasSub = Boolean(item.items?.length)
                const itemActive = matchRoute(pathname, item.url)
                const activeSubUrl = hasSub
                  ? getMostSpecificSubRoute(
                      pathname,
                      item.items!.map((subItem) => subItem.url),
                    )
                  : null
                const anySubActive = Boolean(activeSubUrl)
                const isGroupOpen = openItems[item.title] ?? (itemActive || anySubActive)

                if (!hasSub) {
                  return (
                    <SidebarMenuItem key={item.title} data-tour={item.tourKey}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={itemActive}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    open={isGroupOpen}
                    onOpenChange={(isOpen) =>
                      setOpenItems((prev) => ({ ...prev, [item.title]: isOpen }))
                    }
                    className="group/collapsible"
                  >
                    <SidebarMenuItem data-tour={item.tourKey}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={anySubActive}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items!.map((subItem) => {
                            const subActive = subItem.url === activeSubUrl

                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={subActive}>
                                  <Link href={subItem.url} className="flex items-center gap-2">
                                    {subItem.icon ? (
                                      <subItem.icon className="h-3.5 w-3.5" />
                                    ) : (
                                      <div className="h-4 w-4" />
                                    )}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
