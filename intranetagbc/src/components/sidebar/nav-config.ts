import {
  Activity,
  Archive,
  Briefcase,
  CalendarDays,
  Eye,
  FileText,
  FolderOpen,
  Home,
  LifeBuoy,
  MapPin,
  Megaphone,
  Shield,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { PERMISOS } from "@/lib/auth/permisos"

export type AccessRule =
  | {
    roles?: string[]
    permissions?: string[]
  } 
  | undefined

export type SubItem = {
  title: string
  url: string
  icon?: LucideIcon
  access?: AccessRule
}

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: SubItem[]
  access?: AccessRule
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const sidebarData: {
  main: NavGroup[]
  secondary: { title: string; url: string; icon: LucideIcon; access?: AccessRule }[]
} = {
  main: [
    {
      label: "Administracion",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "Usuarios",
          url: "/usuarios",
          icon: Users,
          access: {
            permissions: [PERMISOS.USUARIOS.VER],
          },
        },
        {
          title: "Roles",
          url: "/roles",
          icon: UserPlus,
          access: {
            permissions: [PERMISOS.ROLES.VER],
          },
        },
        {
          title: "Contenidos",
          url: "/comunicaciones",
          icon: Megaphone,
          access: {
            permissions: [
              PERMISOS.COMUNICADOS.VER,
              PERMISOS.NOTICIAS.VER,
              PERMISOS.ACCESOS.VER,
              PERMISOS.CONTENIDOS.VER,
            ],
          },
        },
        {
          title: "Documentos",
          url: "/documentos",
          icon: FileText,
          items: [
            {
              title: "Todos los documentos",
              url: "/documentos",
              icon: FileText,
              access: {
                permissions: [PERMISOS.DOCUMENTOS.VER],
              },
            },
            {
              title: "Papelera",
              url: "/archivo",
              icon: Archive,
              access: {
                permissions: [PERMISOS.ARCHIVO.VER],
              },
            },
          ],
        },
        {
          title: "Correspondencia",
          url: "/correspondencia",
          icon: FolderOpen,
          items: [
            {
              title: "Bandeja",
              url: "/correspondencia",
              icon: FolderOpen,
              access: {
                permissions: [PERMISOS.CORRESPONDENCIA.VER],
              },
            },
            {
              title: "Reportes",
              url: "/reportes",
              icon: Activity,
              access: {
                permissions: [PERMISOS.REPORTES.VER],
              },
            },
          ],
        },
        {
          title: "RRHH",
          url: "/rrhh",
          icon: Briefcase,
          access: {
            permissions: [PERMISOS.RRHH.VER],
          },
        },
        {
          title: "Reconocimientos",
          url: "/reconocimientos",
          icon: Trophy,
          access: {
            permissions: [PERMISOS.RECONOCIMIENTOS.VER],
          },
          items: [
            {
              title: "Dashboard",
              url: "/reconocimientos",
              icon: Trophy,
              access: {
                permissions: [PERMISOS.RECONOCIMIENTOS.VER],
              },
            },
            {
              title: "Empleado del Mes",
              url: "/reconocimientos/empleado-mes",
              icon: Trophy,
              access: {
                permissions: [PERMISOS.RECONOCIMIENTOS.VER],
              },
            },
            {
              title: "Equipos destacados",
              url: "/reconocimientos/equipos",
              icon: Users,
              access: {
                permissions: [PERMISOS.RECONOCIMIENTOS.VER],
              },
            },
            {
              title: "Logros de sucursales",
              url: "/reconocimientos/sucursales",
              icon: MapPin,
              access: {
                permissions: [PERMISOS.RECONOCIMIENTOS.VER],
              },
            },
            {
              title: "Aprobaciones",
              url: "/reconocimientos/aprobaciones",
              icon: Shield,
              access: {
                permissions: [PERMISOS.RECONOCIMIENTOS.APROBAR],
              },
            },
          ],
        },
        {
          title: "Tramites",
          url: "/tramites",
          icon: Activity,
          access: {
            permissions: [PERMISOS.TRAMITES.VER],
          },
        },
        {
          title: "Calendario",
          url: "/calendario",
          icon: CalendarDays,
          access: {
            permissions: [PERMISOS.CALENDARIO.VER, PERMISOS.AGENDA.VER],
          },
        },
      ],
    },
  ],
  secondary: [
    {
      title: "Auditoria",
      url: "/auditoria",
      icon: Shield,
      access: {
        permissions: [PERMISOS.AUDITORIA.VER],
      },
    },
    {
      title: "Sucursales",
      url: "/sucursales",
      icon: MapPin,
      access: {
        permissions: [PERMISOS.SUCURSALES.VER],
        roles: ["administrador"],
      },
    },
    {
      title: "Secciones Landing",
      url: "/secciones-landing",
      icon: Eye,
      access: {
        roles: ["administrador"],
      },
    },
    {
      title: "Soporte",
      url: "/soporte",
      icon: LifeBuoy,
    },
  ],
}

