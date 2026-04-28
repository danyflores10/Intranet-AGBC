import {
  Activity,
  Archive,
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Eye,
  FilePlus2,
  FileText,
  FolderOpen,
  Forward,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Megaphone,
  Settings2,
  Shield,
  Sparkles,
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
  tourKey?: string
}

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  items?: SubItem[]
  access?: AccessRule
  tourKey?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const sidebarData: {
  main: NavGroup[]
  secondary: { title: string; url: string; icon: LucideIcon; access?: AccessRule; tourKey?: string }[]
} = {
  main: [
    {
      label: "Administracion",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
          tourKey: "dashboard",
        },
        {
          title: "Usuarios",
          url: "/usuarios",
          icon: Users,
          tourKey: "usuarios",
          access: {
            permissions: [PERMISOS.USUARIOS.VER],
          },
        },
        {
          title: "Roles",
          url: "/roles",
          icon: UserPlus,
          tourKey: "roles",
          access: {
            permissions: [PERMISOS.ROLES.VER],
          },
        },
        {
          title: "Contenidos",
          url: "/comunicaciones",
          icon: Megaphone,
          tourKey: "contenidos",
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
          tourKey: "documentos",
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
          tourKey: "correspondencia",
          access: {
            permissions: [PERMISOS.CORRESPONDENCIA.VER],
          },
          items: [
            {
              title: "Dashboard",
              url: "/correspondencia/dashboard",
              icon: LayoutDashboard,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.VER] },
            },
            {
              title: "Bandeja",
              url: "/correspondencia",
              icon: FolderOpen,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.VER] },
            },
            {
              title: "Registrar",
              url: "/correspondencia/registrar",
              icon: FilePlus2,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.CREAR] },
            },
            {
              title: "Derivaciones",
              url: "/correspondencia/derivaciones",
              icon: Forward,
              access: {
                permissions: [
                  PERMISOS.CORRESPONDENCIA.DERIVAR,
                  PERMISOS.CORRESPONDENCIA.EDITAR,
                ],
              },
            },
            {
              title: "Seguimiento",
              url: "/correspondencia/seguimiento",
              icon: ClipboardList,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.VER] },
            },
            {
              title: "Archivo",
              url: "/correspondencia/archivo",
              icon: Archive,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.VER] },
            },
            {
              title: "Reportes",
              url: "/correspondencia/reportes",
              icon: BarChart3,
              access: {
                permissions: [
                  PERMISOS.CORRESPONDENCIA.REPORTAR,
                  PERMISOS.CORRESPONDENCIA.VER,
                ],
              },
            },
            {
              title: "Configuración",
              url: "/correspondencia/configuracion",
              icon: Settings2,
              access: { permissions: [PERMISOS.CORRESPONDENCIA.CONFIGURAR] },
            },
          ],
        },
        {
          title: "RRHH",
          url: "/rrhh",
          icon: Briefcase,
          tourKey: "rrhh",
          access: {
            permissions: [PERMISOS.RRHH.VER],
          },
        },
        {
          title: "Reconocimientos",
          url: "/reconocimientos",
          icon: Trophy,
          tourKey: "reconocimientos",
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
          tourKey: "tramites",
          access: {
            permissions: [PERMISOS.TRAMITES.VER],
          },
        },
        {
          title: "Calendario",
          url: "/calendario",
          icon: CalendarDays,
          tourKey: "calendario",
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
      tourKey: "auditoria",
      access: {
        permissions: [PERMISOS.AUDITORIA.VER],
      },
    },
    {
      title: "Sucursales",
      url: "/sucursales",
      icon: MapPin,
      tourKey: "sucursales",
      access: {
        permissions: [PERMISOS.SUCURSALES.VER],
        roles: ["administrador"],
      },
    },
    {
      title: "Secciones Landing",
      url: "/secciones-landing",
      icon: Eye,
      tourKey: "secciones-landing",
      access: {
        roles: ["administrador"],
      },
    },
    {
      title: "Onboarding",
      url: "/configuracion/onboarding",
      icon: Sparkles,
      access: {
        permissions: [PERMISOS.ONBOARDING.CONFIGURAR],
      },
    },
    {
      title: "Soporte",
      url: "/soporte",
      icon: LifeBuoy,
      tourKey: "soporte",
    },
  ],
}

