import { redirect } from "next/navigation"
import Link from "next/link"
import { Eye } from "lucide-react"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerNotificacionesUsuario, contarNotificacionesNoLeidas } from "@/actions/notificaciones"
import { NotificacionesBell } from "@/components/notificaciones-bell"

type AdminLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const usuario = await obtenerUsuarioRbacActual()

  if (!usuario) {
    redirect("/")
  }

  const [notificaciones, countNoLeidas] = await Promise.all([
    obtenerNotificacionesUsuario(usuario.id),
    contarNotificacionesNoLeidas(usuario.id),
  ])

  return (
    <SidebarProvider>
      <AppSidebar usuario={usuario} />
      <SidebarInset className="min-h-screen bg-slate-50">
        <header className="flex h-16 shrink-0 items-center justify-between border-b-2 border-[#002F6C]/15 bg-[#FFCC00] px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-10 w-10 rounded-xl bg-[#002F6C]/10 text-[#002F6C] hover:bg-[#002F6C] hover:text-[#FFCC00] transition-all shadow-xs cursor-pointer" />
            <span className="text-sm sm:text-base font-black tracking-tight text-[#002F6C] uppercase">
              Panel Administrativo
            </span>
          </div>
          <div className="flex flex-row items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#002F6C] hover:bg-[#0E5296] px-4 py-2 text-xs font-black text-white hover:text-[#FFCC00] shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              title="Ver Intranet Pública"
            >
              <Eye className="h-4 w-4 text-[#FFCC00]" />
              <span className="hidden sm:inline">Ver Intranet Pública</span>
            </Link>
            <NotificacionesBell
              usuarioId={usuario.id}
              notificacionesIniciales={notificaciones}
              countInicial={countNoLeidas}
            />
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
