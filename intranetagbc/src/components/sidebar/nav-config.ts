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
  Mail,
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
      label: "Administración",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
          tourKey: "dashboard",
        },
        {
          title: "Gestión Institucional",
          url: "/usuarios",
          icon: Shield,
          tourKey: "gestion-institucional",
          access: {
            roles: ["administrador", "Administrador", "super_admin"],
            permissions: [
              PERMISOS.USUARIOS.VER,
              PERMISOS.ROLES.VER,
              PERMISOS.AUDITORIA.VER,
              PERMISOS.SUCURSALES.VER,
            ],
          },
          items: [
            {
              title: "Usuarios",
              url: "/usuarios",
              icon: Users,
              access: {
                roles: ["administrador", "Administrador", "super_admin"],
                permissions: [PERMISOS.USUARIOS.VER],
              },
            },
            {
              title: "Roles y Permisos",
              url: "/roles",
              icon: UserPlus,
              access: {
                roles: ["administrador", "Administrador", "super_admin"],
                permissions: [PERMISOS.ROLES.VER],
              },
            },
            {
              title: "Auditoría y Logs",
              url: "/auditoria",
              icon: Shield,
              access: {
                roles: ["administrador", "Administrador", "super_admin"],
                permissions: [PERMISOS.AUDITORIA.VER],
              },
            },
            {
              title: "Sucursales",
              url: "/sucursales",
              icon: MapPin,
              access: {
                roles: ["administrador", "Administrador", "super_admin"],
                permissions: [PERMISOS.SUCURSALES.VER],
              },
            },
          ],
        },
        {
          title: "Contenidos",
          url: "/comunicaciones",
          icon: Megaphone,
          tourKey: "contenidos",
          access: {
            roles: ["administrador", "Administrador", "super_admin"],
            permissions: [
              PERMISOS.COMUNICADOS.VER,
              PERMISOS.NOTICIAS.VER,
              PERMISOS.ACCESOS.VER,
              PERMISOS.CONTENIDOS.VER,
            ],
          },
        },
        {
          title: "Mensajería",
          url: "/mensajeria",
          icon: Mail,
          tourKey: "mensajeria",
          access: {
            roles: ["administrador", "Administrador", "gestor", "Gestor", "usuario", "Usuario"],
            permissions: [PERMISOS.DOCUMENTOS.VER, PERMISOS.ARCHIVO.VER],
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
                roles: ["administrador", "Administrador", "gestor", "Gestor", "usuario", "Usuario"],
                permissions: [PERMISOS.DOCUMENTOS.VER],
              },
            },
            {
              title: "Papelera",
              url: "/archivo",
              icon: Archive,
              access: {
                roles: ["administrador", "Administrador", "gestor", "Gestor", "usuario", "Usuario"],
                permissions: [PERMISOS.ARCHIVO.VER],
              },
            },
          ],
        },
        {
          title: "RRHH",
          url: "/rrhh",
          icon: Briefcase,
          tourKey: "rrhh",
          access: {
            roles: ["administrador", "Administrador", "super_admin"],
            permissions: [PERMISOS.RRHH.VER],
          },
        },
      ],
    },
  ],
  secondary: [
    {
      title: "Secciones Landing",
      url: "/secciones-landing",
      icon: Eye,
      tourKey: "secciones-landing",
      access: {
        roles: ["administrador"],
      },
    },
  ],
}

