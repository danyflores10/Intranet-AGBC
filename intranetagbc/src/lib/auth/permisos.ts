export const PERMISOS_ROLES = {
  VER: "ver roles",
  CREAR: "crear roles",
  EDITAR: "editar roles",
  ELIMINAR: "eliminar roles",
} as const

export const PERMISOS_USUARIOS = {
  VER: "ver usuarios",
  CREAR: "crear usuarios",
  EDITAR: "editar usuarios",
  ELIMINAR: "eliminar usuarios",
} as const

export const PERMISOS_TRAMITES = {
  VER: "ver tramites",
  CREAR: "crear tramites",
  EDITAR: "editar tramites",
  ELIMINAR: "eliminar tramites",
} as const

export const PERMISOS_LOGISTICA = {
  VER: "ver logistica",
  CREAR: "crear logistica",
  EDITAR: "editar logistica",
  ELIMINAR: "eliminar logistica",
} as const

export const PERMISOS_AUDITORIA = {
  VER: "ver auditoria",
} as const

export const PERMISOS_COMUNICADOS = {
  VER: "ver comunicados",
  CREAR: "crear comunicados",
  EDITAR: "editar comunicados",
  ELIMINAR: "eliminar comunicados",
} as const

export const PERMISOS_NOTICIAS = {
  VER: "ver banners",
  CREAR: "crear banners",
  EDITAR: "editar banners",
  ELIMINAR: "eliminar banners",
} as const

export const PERMISOS_ACCESOS = {
  VER: "ver accesos",
  CREAR: "crear accesos",
  EDITAR: "editar accesos",
  ELIMINAR: "eliminar accesos",
} as const

export const PERMISOS_DOCUMENTOS = {
  VER: "ver documentos",
  CREAR: "crear documentos",
  EDITAR: "editar documentos",
  ELIMINAR: "eliminar documentos",
} as const

export const PERMISOS_ARCHIVO = {
  VER: "ver archivo",
  CREAR: "crear archivo",
  EDITAR: "editar archivo",
  ELIMINAR: "eliminar archivo",
} as const

export const PERMISOS_CORRESPONDENCIA = {
  VER: "ver correspondencia",
  CREAR: "crear correspondencia",
  EDITAR: "editar correspondencia",
  ELIMINAR: "eliminar correspondencia",
} as const

export const PERMISOS_REPORTES = {
  VER: "ver reportes",
  CREAR: "crear reportes",
  EDITAR: "editar reportes",
  ELIMINAR: "eliminar reportes",
} as const

export const PERMISOS_RRHH = {
  VER: "ver rrhh",
  CREAR: "crear rrhh",
  EDITAR: "editar rrhh",
  ELIMINAR: "eliminar rrhh",
} as const

export const PERMISOS_CALENDARIO = {
  VER: "ver calendario",
  CREAR: "crear calendario",
  EDITAR: "editar calendario",
  ELIMINAR: "eliminar calendario",
} as const

export const PERMISOS_AGENDA = {
  VER: "ver agenda",
  CREAR: "crear agenda",
  EDITAR: "editar agenda",
  ELIMINAR: "eliminar agenda",
} as const

export const PERMISOS_SUCURSALES = {
  VER: "ver sucursales",
  CREAR: "crear sucursales",
  EDITAR: "editar sucursales",
  ELIMINAR: "eliminar sucursales",
} as const

export const PERMISOS_CONFIGURACION = {
  VER: "ver configuracion",
  EDITAR: "editar configuracion",
} as const

export const PERMISOS_CONTENIDOS = {
  VER: "ver contenidos",
  CREAR: "crear contenidos",
  EDITAR: "editar contenidos",
  ELIMINAR: "eliminar contenidos",
} as const

export const PERMISOS_CONTACTOS = {
  VER: "ver contactos",
  CREAR: "crear contactos",
  EDITAR: "editar contactos",
  ELIMINAR: "eliminar contactos",
} as const

export const PERMISOS_SOPORTE = {
  VER: "ver soporte",
  CREAR: "crear soporte",
  EDITAR: "editar soporte",
  ELIMINAR: "eliminar soporte",
} as const

export const PERMISOS = {
  ROLES: PERMISOS_ROLES,
  USUARIOS: PERMISOS_USUARIOS,
  TRAMITES: PERMISOS_TRAMITES,
  LOGISTICA: PERMISOS_LOGISTICA,
  AUDITORIA: PERMISOS_AUDITORIA,
  COMUNICADOS: PERMISOS_COMUNICADOS,
  NOTICIAS: PERMISOS_NOTICIAS,
  ACCESOS: PERMISOS_ACCESOS,
  DOCUMENTOS: PERMISOS_DOCUMENTOS,
  ARCHIVO: PERMISOS_ARCHIVO,
  CORRESPONDENCIA: PERMISOS_CORRESPONDENCIA,
  REPORTES: PERMISOS_REPORTES,
  RRHH: PERMISOS_RRHH,
  CALENDARIO: PERMISOS_CALENDARIO,
  AGENDA: PERMISOS_AGENDA,
  SUCURSALES: PERMISOS_SUCURSALES,
  CONFIGURACION: PERMISOS_CONFIGURACION,
  CONTENIDOS: PERMISOS_CONTENIDOS,
  CONTACTOS: PERMISOS_CONTACTOS,
  SOPORTE: PERMISOS_SOPORTE,
} as const

export type PermisoRol = (typeof PERMISOS_ROLES)[keyof typeof PERMISOS_ROLES]
