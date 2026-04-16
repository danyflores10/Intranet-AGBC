"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileTextIcon,
  UsersIcon,
  MailIcon,
  PackageIcon,
  ClipboardListIcon,
  MegaphoneIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  BellIcon,
  PartyPopperIcon,
  HomeIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  Link2Icon,
  Zap,
} from "lucide-react"
import Link from "next/link"

interface EventoRow {
  id: string
  titulo: string
  descripcion: string | null
  tipo: string
  fechaInicio: string
  fechaFin: string | null
  color: string | null
  notificar: boolean
  createdAt: Date
}

interface NotificacionRow {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  enlace: string | null
  createdAt: Date
}

interface Props {
  counts: {
    documentos: number
    correspondencia: number
    tramites: number
    inventario: number
    personal: number
    comunicados: number
    usuarios: number
  }
  user: { name: string; email: string; roles: string[]; permissions: string[] }
  eventos?: EventoRow[]
  notificaciones?: NotificacionRow[]
  seccionesPublicas?: {
    comunicados: Array<{
      id: string
      titulo: string
      fecha: string
      destacado: boolean
    }>
    banners: Array<{
      id: string
      titulo: string
      descripcion: string
      enlace: string
    }>
    accesos: Array<{
      clave: string
      titulo: string
      descripcion: string
      url: string
    }>
  }
}

const TIPO_EVENTO_CONFIG: Record<string, { icon: typeof CalendarIcon; color: string; label: string }> = {
  feriado: { icon: PartyPopperIcon, color: "#C41E3A", label: "Feriado" },
  no_laboral: { icon: HomeIcon, color: "#FF8800", label: "Día no laboral" },
  reunion: { icon: UsersIcon, color: "#2E7D32", label: "Reunión" },
  evento: { icon: CalendarDaysIcon, color: "#1976D2", label: "Evento" },
  capacitacion: { icon: BookOpenIcon, color: "#7B1FA2", label: "Capacitación" },
}

export function DashboardModule({ counts, user, eventos = [], notificaciones = [], seccionesPublicas }: Props) {
  const esAdmin = user.roles.includes("administrador") || user.roles.includes("super_admin")

  const adminCards = [
    { label: "Documentos", count: counts.documentos, icon: FileTextIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", href: "/documentos" },
    { label: "Correspondencia", count: counts.correspondencia, icon: MailIcon, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", href: "/correspondencia" },
    { label: "Trámites", count: counts.tramites, icon: ClipboardListIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", href: "/tramites" },
    { label: "Inventario", count: counts.inventario, icon: PackageIcon, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", href: "/logistica" },
    { label: "Personal", count: counts.personal, icon: UsersIcon, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30", href: "/rrhh" },
    { label: "Comunicados", count: counts.comunicados, icon: MegaphoneIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", href: "/comunicaciones" },
    { label: "Usuarios", count: counts.usuarios, icon: UserIcon, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", href: "/usuarios" },
  ]

  const userQuickLinks = [
    { label: "Mi Perfil", description: "Ver y editar tu información", icon: UserIcon, color: "text-[#FF8800]", bg: "bg-[#FFB300]/10", href: "/perfil" },
    { label: "Documentos", description: "Gestión documental", icon: FileTextIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", href: "/documentos" },
    { label: "Correspondencia", description: "Hojas de ruta", icon: FolderOpenIcon, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", href: "/correspondencia" },
    { label: "Trámites", description: "Seguimiento", icon: ClipboardListIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", href: "/tramites" },
    { label: "Comunicados", description: "Institucionales", icon: MegaphoneIcon, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", href: "/comunicaciones" },
    { label: "Calendario", description: "Eventos y feriados", icon: CalendarDaysIcon, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", href: "/calendario" },
  ]

  const hoyStr = (() => {
    const h = new Date()
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`
  })()

  const proximosEventos = eventos
    .filter((e) => e.fechaInicio >= hoyStr)
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, 4)

  const notifsRecientes = notificaciones.filter((n) => !n.leida).slice(0, 5)

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Bienvenida */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-[#FFB300]/5 via-white to-[#2E7D32]/5 dark:from-[#FFB300]/10 dark:via-zinc-900 dark:to-[#2E7D32]/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-white shadow-lg shadow-[#FFB300]/20">
              <LayoutDashboardIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Bienvenido, {user.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                <MailIcon className="h-3.5 w-3.5" />
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-[#FFB300]" />
                <span className="text-xs font-medium text-muted-foreground">
                  {user.roles.length > 0 ? user.roles.join(", ") : "Sin rol asignado"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex h-1 w-full mt-4 rounded-full overflow-hidden">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
        </div>

        {esAdmin ? (
          /* ── Vista Administrador ── */
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {adminCards.map((card) => (
                <a key={card.label} href={card.href} className="block group">
                  <Card className="border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFB300]/5 hover:-translate-y-0.5 hover:border-[#FFB300]/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} transition-transform group-hover:scale-110`}>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{card.count}</div>
                      <p className="text-xs text-muted-foreground">registros</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            {/* Calendario + Notificaciones */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Próximos eventos */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-[#C41E3A]" />
                    Próximos eventos del mes
                    <a href="/calendario" className="ml-auto text-xs font-semibold text-[#FF8800] hover:underline">Ver calendario →</a>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proximosEventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos este mes</p>
                  ) : (
                    <div className="space-y-3">
                      {proximosEventos.map((ev) => {
                        const cfg = TIPO_EVENTO_CONFIG[ev.tipo] ?? TIPO_EVENTO_CONFIG.evento
                        const Icon = cfg.icon
                        return (
                          <div key={ev.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: cfg.color + "18" }}>
                              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{ev.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(ev.fechaInicio + "T12:00:00").toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" })}
                                {" · "}{cfg.label}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notificaciones recientes */}
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BellIcon className="h-4 w-4 text-[#FFB300]" />
                    Notificaciones sin leer
                    {notifsRecientes.length > 0 && (
                      <span className="rounded-full bg-[#C41E3A]/10 px-2 py-0.5 text-xs font-bold text-[#C41E3A]">{notifsRecientes.length}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifsRecientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tienes notificaciones nuevas</p>
                  ) : (
                    <div className="space-y-3">
                      {notifsRecientes.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 rounded-xl p-2.5 bg-[#FFB300]/5 hover:bg-[#FFB300]/10 transition-colors">
                          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FFB300]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{n.titulo}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* ── Vista Usuario Normal ── */
          <>
            <div>
              <h3 className="text-lg font-bold mb-1">Acceso Rápido</h3>
              <p className="text-sm text-muted-foreground">Navega a los módulos del sistema</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userQuickLinks.map((link) => (
                <a key={link.label} href={link.href} className="block group">
                  <Card className="border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFB300]/5 hover:-translate-y-0.5 hover:border-[#FFB300]/20 h-full">
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${link.bg} transition-transform group-hover:scale-110`}>
                        <link.icon className={`h-7 w-7 ${link.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{link.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            {/* Secciones publicadas por admin */}
            <div>
              <h3 className="text-lg font-bold mb-1">Secciones Institucionales</h3>
              <p className="text-sm text-muted-foreground">Contenido publicado por el administrador para todos los usuarios</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MegaphoneIcon className="h-4 w-4 text-amber-600" />
                    Comunicados
                    <Link href="/#comunicados" className="ml-auto text-xs font-semibold text-[#FF8800] hover:underline">
                      Ver más →
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seccionesPublicas?.comunicados?.length ? (
                    <div className="space-y-2">
                      {seccionesPublicas.comunicados.slice(0, 3).map((c) => (
                        <Link key={c.id} href="/#comunicados" className="block rounded-lg p-2 hover:bg-muted/50 transition-colors">
                          <p className="text-sm font-semibold line-clamp-1">{c.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.fecha + "T12:00:00").toLocaleDateString("es-BO")}
                            {c.destacado ? " · Destacado" : ""}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">Sin comunicados publicados</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#C41E3A]" />
                    Noticias
                    <Link href="/#noticias" className="ml-auto text-xs font-semibold text-[#FF8800] hover:underline">
                      Ver más →
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seccionesPublicas?.banners?.length ? (
                    <div className="space-y-2">
                      {seccionesPublicas.banners.slice(0, 3).map((b) => (
                        <Link key={b.id} href="/#noticias" className="block rounded-lg p-2 hover:bg-muted/50 transition-colors">
                          <p className="text-sm font-semibold line-clamp-1">{b.titulo}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{b.descripcion || "Noticia institucional"}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">Sin noticias activas</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Link2Icon className="h-4 w-4 text-blue-600" />
                    Accesos Directos
                    <Link href="/#aplicaciones" className="ml-auto text-xs font-semibold text-[#FF8800] hover:underline">
                      Ver más →
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seccionesPublicas?.accesos?.length ? (
                    <div className="space-y-2">
                      {seccionesPublicas.accesos.slice(0, 3).map((a) => (
                        <a key={a.clave} href={a.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg p-2 hover:bg-muted/50 transition-colors">
                          <p className="text-sm font-semibold line-clamp-1">{a.titulo}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{a.descripcion || a.url}</p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">Sin accesos directos activos</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Calendario + Notificaciones para usuario */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-[#C41E3A]" />
                    Próximos eventos
                    <a href="/calendario" className="ml-auto text-xs font-semibold text-[#FF8800] hover:underline">Ver calendario →</a>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proximosEventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay eventos próximos</p>
                  ) : (
                    <div className="space-y-3">
                      {proximosEventos.map((ev) => {
                        const cfg = TIPO_EVENTO_CONFIG[ev.tipo] ?? TIPO_EVENTO_CONFIG.evento
                        const Icon = cfg.icon
                        return (
                          <div key={ev.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: cfg.color + "18" }}>
                              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{ev.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(ev.fechaInicio + "T12:00:00").toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" })}
                                {" · "}{cfg.label}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BellIcon className="h-4 w-4 text-[#FFB300]" />
                    Notificaciones recientes
                    {notifsRecientes.length > 0 && (
                      <span className="rounded-full bg-[#C41E3A]/10 px-2 py-0.5 text-xs font-bold text-[#C41E3A]">{notifsRecientes.length}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifsRecientes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No tienes notificaciones nuevas</p>
                  ) : (
                    <div className="space-y-3">
                      {notifsRecientes.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 rounded-xl p-2.5 bg-[#FFB300]/5 hover:bg-[#FFB300]/10 transition-colors">
                          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FFB300]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{n.titulo}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info de cuenta */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#FFB300]" />
                  Información de tu cuenta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Correo</p>
                    <p className="font-medium truncate">{user.email}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Roles</p>
                    <p className="font-medium">{user.roles.length > 0 ? user.roles.join(", ") : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Permisos</p>
                    <p className="font-medium">{user.permissions.length} permisos asignados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
