import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerNotificacionesUsuario, contarNotificacionesNoLeidas } from "@/actions/notificaciones"
import { NotificacionesBell } from "@/components/notificaciones-bell"
import { ModeToggle } from "@/components/mode-toggle"

type AdminLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const usuario = await obtenerUsuarioRbacActual()

  if (!usuario) {
    redirect("/login")
  }

  const [notificaciones, countNoLeidas] = await Promise.all([
    obtenerNotificacionesUsuario(usuario.id),
    contarNotificacionesNoLeidas(usuario.id),
  ])

  return (
    <SidebarProvider>
      <AppSidebar usuario={usuario} />
      <SidebarInset className="min-h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex flex-row gap-2">
            <NotificacionesBell
              usuarioId={usuario.id}
              notificacionesIniciales={notificaciones}
              countInicial={countNoLeidas}
            />
            <ModeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
