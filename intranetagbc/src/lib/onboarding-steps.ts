export type OnboardingStep = {
  /** Selector del elemento a resaltar (por data-tour) */
  selector: string
  titulo: string
  descripcion: string
  /** Si true, el paso se omite cuando el elemento no existe (p.ej. por permisos) */
  opcional?: boolean
  /** Si se define, el tour navegará a esta ruta antes de mostrar el paso */
  rutaRequerida?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    selector: "[data-tour='dashboard']",
    titulo: "Dashboard",
    descripcion: "Aquí verás el resumen general del sistema: actividad reciente, métricas e indicadores clave.",
  },
  {
    selector: "[data-tour='usuarios']",
    titulo: "Usuarios",
    descripcion: "Desde aquí puedes crear, editar y gestionar las cuentas de usuarios del sistema.",
    opcional: true,
  },
  {
    selector: "[data-tour='roles']",
    titulo: "Roles y permisos",
    descripcion: "Define roles y asigna los permisos que controlarán el acceso a cada módulo.",
    opcional: true,
  },
  {
    selector: "[data-tour='contenidos']",
    titulo: "Contenidos",
    descripcion: "Administra comunicados, noticias, banners y accesos rápidos que ven los usuarios en la landing.",
    opcional: true,
  },
  {
    selector: "[data-tour='documentos']",
    titulo: "Documentos",
    descripcion: "Publica y organiza los documentos institucionales. También tienes una papelera para archivarlos.",
    opcional: true,
  },
  {
    selector: "[data-tour='correspondencia']",
    titulo: "Correspondencia",
    descripcion: "Controla la bandeja de entrada y salida, y consulta los reportes del flujo de correspondencia.",
    opcional: true,
  },
  {
    selector: "[data-tour='rrhh']",
    titulo: "Recursos Humanos",
    descripcion: "Gestiona el personal, directivos y la información del talento humano de la institución.",
    opcional: true,
  },
  {
    selector: "[data-tour='reconocimientos']",
    titulo: "Reconocimientos",
    descripcion: "Empleado del mes, equipos destacados, logros de sucursales y la cola de aprobaciones — todo en un solo lugar.",
    opcional: true,
  },
  {
    selector: "[data-tour='tramites']",
    titulo: "Trámites",
    descripcion: "Registra y da seguimiento a solicitudes o procesos internos de la institución.",
    opcional: true,
  },
  {
    selector: "[data-tour='calendario']",
    titulo: "Calendario",
    descripcion: "Consulta eventos institucionales y planifica la agenda de tu equipo.",
    opcional: true,
  },
  {
    selector: "[data-tour='auditoria']",
    titulo: "Auditoría",
    descripcion: "Revisa el historial de acciones realizadas en el sistema para trazabilidad y control.",
    opcional: true,
  },
  {
    selector: "[data-tour='sucursales']",
    titulo: "Sucursales",
    descripcion: "Administra las oficinas y sucursales a nivel nacional que aparecen en el mapa de Bolivia.",
    opcional: true,
  },
  {
    selector: "[data-tour='secciones-landing']",
    titulo: "Secciones del Landing",
    descripcion: "Controla qué secciones se muestran en la página principal para los usuarios logueados.",
    opcional: true,
  },
  {
    selector: "[data-tour='soporte']",
    titulo: "Soporte",
    descripcion: "Reporta incidencias o consulta el centro de ayuda cuando lo necesites.",
    opcional: true,
  },
  {
    selector: "[data-tour='perfil']",
    titulo: "Tu perfil",
    descripcion: "Aquí puedes actualizar tus datos personales, cambiar tu contraseña y cerrar sesión cuando termines.",
  },
  {
    selector: "[data-tour='perfil-seguridad']",
    titulo: "Seguridad de tu cuenta",
    descripcion:
      "Desde esta sección puedes cambiar tu contraseña. Ingresa la actual y define una nueva segura para proteger tu cuenta.",
    rutaRequerida: "/perfil",
  },
]
