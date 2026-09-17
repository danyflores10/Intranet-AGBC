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

export const PERMISOS_AUDITORIA = {
  VER: "ver auditoria",
} as const

export const PERMISOS_SUCURSALES = {
  VER: "ver sucursales",
  CREAR: "crear sucursales",
  EDITAR: "editar sucursales",
  ELIMINAR: "eliminar sucursales",
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

export const PERMISOS_RRHH = {
  VER: "ver rrhh",
  CREAR: "crear rrhh",
  EDITAR: "editar rrhh",
  ELIMINAR: "eliminar rrhh",
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

export const PERMISOS_CONTENIDOS = {
  VER: "ver contenidos",
  CREAR: "crear contenidos",
  EDITAR: "editar contenidos",
  ELIMINAR: "eliminar contenidos",
} as const

export const PERMISOS_CONFIGURACION = {
  VER: "ver configuracion",
  EDITAR: "editar configuracion",
} as const

/* ══════════════════════════════════════════════════════════════
 * Módulos Obsoletos / Desactivados (Sin permisos en base de datos)
 * ══════════════════════════════════════════════════════════════ */
export const PERMISOS_CORRESPONDENCIA = {
  VER: "obsoleto:correspondencia",
  CREAR: "obsoleto:correspondencia",
  EDITAR: "obsoleto:correspondencia",
  ELIMINAR: "obsoleto:correspondencia",
  DERIVAR: "obsoleto:correspondencia",
  ARCHIVAR: "obsoleto:correspondencia",
  REPORTAR: "obsoleto:correspondencia",
  CONFIGURAR: "obsoleto:correspondencia",
} as const

export const PERMISOS_CALENDARIO = {
  VER: "obsoleto:calendario",
  CREAR: "obsoleto:calendario",
  EDITAR: "obsoleto:calendario",
  ELIMINAR: "obsoleto:calendario",
} as const

export const PERMISOS_LOGISTICA = {
  VER: "obsoleto:logistica",
  CREAR: "obsoleto:logistica",
  EDITAR: "obsoleto:logistica",
  ELIMINAR: "obsoleto:logistica",
} as const

export const PERMISOS_TRAMITES = {
  VER: "obsoleto:tramites",
  CREAR: "obsoleto:tramites",
  EDITAR: "obsoleto:tramites",
  ELIMINAR: "obsoleto:tramites",
} as const

export const PERMISOS_SOPORTE = {
  VER: "obsoleto:soporte",
  CREAR: "obsoleto:soporte",
  EDITAR: "obsoleto:soporte",
  ELIMINAR: "obsoleto:soporte",
} as const

export const PERMISOS_REPORTES = {
  VER: "obsoleto:reportes",
  CREAR: "obsoleto:reportes",
  EDITAR: "obsoleto:reportes",
  ELIMINAR: "obsoleto:reportes",
} as const

export const PERMISOS_RECONOCIMIENTOS = {
  VER: "obsoleto:reconocimientos",
  CREAR: "obsoleto:reconocimientos",
  EDITAR: "obsoleto:reconocimientos",
  ELIMINAR: "obsoleto:reconocimientos",
  APROBAR: "obsoleto:reconocimientos",
  PUBLICAR: "obsoleto:reconocimientos",
  ARCHIVAR: "obsoleto:reconocimientos",
  DESTACAR: "obsoleto:reconocimientos",
  LANDING: "obsoleto:reconocimientos",
  REPORTES: "obsoleto:reconocimientos",
} as const

export const PERMISOS_AGENDA = PERMISOS_CALENDARIO
export const PERMISOS_CONTACTOS = PERMISOS_RRHH
export const PERMISOS_ONBOARDING = {
  VER: PERMISOS_CONFIGURACION.VER,
  CONFIGURAR: PERMISOS_CONFIGURACION.EDITAR,
} as const

export const PERMISOS_ACTIVOS = {
  ROLES: PERMISOS_ROLES,
  USUARIOS: PERMISOS_USUARIOS,
  AUDITORIA: PERMISOS_AUDITORIA,
  SUCURSALES: PERMISOS_SUCURSALES,
  DOCUMENTOS: PERMISOS_DOCUMENTOS,
  ARCHIVO: PERMISOS_ARCHIVO,
  RRHH: PERMISOS_RRHH,
  COMUNICADOS: PERMISOS_COMUNICADOS,
  NOTICIAS: PERMISOS_NOTICIAS,
  ACCESOS: PERMISOS_ACCESOS,
  CONTENIDOS: PERMISOS_CONTENIDOS,
  CONFIGURACION: PERMISOS_CONFIGURACION,
} as const

export const PERMISOS = {
  ...PERMISOS_ACTIVOS,
  CORRESPONDENCIA: PERMISOS_CORRESPONDENCIA,
  CALENDARIO: PERMISOS_CALENDARIO,
  AGENDA: PERMISOS_AGENDA,
  LOGISTICA: PERMISOS_LOGISTICA,
  TRAMITES: PERMISOS_TRAMITES,
  SOPORTE: PERMISOS_SOPORTE,
  REPORTES: PERMISOS_REPORTES,
  RECONOCIMIENTOS: PERMISOS_RECONOCIMIENTOS,
  ONBOARDING: PERMISOS_ONBOARDING,
  CONTACTOS: PERMISOS_CONTACTOS,
} as const

export type PermisoRol = (typeof PERMISOS_ROLES)[keyof typeof PERMISOS_ROLES]


