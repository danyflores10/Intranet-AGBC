export const TIPOS_SOLICITUD = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "permiso", label: "Permiso" },
  { value: "licencia", label: "Licencia" },
  { value: "solicitud_materiales", label: "Solicitud de Materiales" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "viaticos", label: "Viáticos" },
  { value: "aprobacion_interna", label: "Aprobación Interna" },
] as const

export const ESTADOS_SOLICITUD = [
  { value: "pendiente", label: "Pendiente", color: "yellow" },
  { value: "en_revision", label: "En Revisión", color: "blue" },
  { value: "aprobado", label: "Aprobado", color: "green" },
  { value: "rechazado", label: "Rechazado", color: "red" },
] as const
