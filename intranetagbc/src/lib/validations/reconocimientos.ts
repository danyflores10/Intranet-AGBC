import { z } from "zod"

export const ESTADOS_RECONOCIMIENTO = [
  "borrador",
  "pendiente",
  "publicado",
  "rechazado",
  "archivado",
] as const

export type EstadoReconocimiento = (typeof ESTADOS_RECONOCIMIENTO)[number]

export const TIPOS_RECONOCIMIENTO = [
  "empleado_mes",
  "equipo_destacado",
  "logro_sucursal",
] as const

export type TipoReconocimiento = (typeof TIPOS_RECONOCIMIENTO)[number]

// ── Máquina de transiciones ──
export const TRANSICIONES_VALIDAS: Record<EstadoReconocimiento, EstadoReconocimiento[]> = {
  borrador: ["pendiente", "archivado"],
  pendiente: ["publicado", "rechazado", "borrador"],
  publicado: ["archivado", "pendiente"],
  rechazado: ["borrador", "archivado"],
  archivado: ["borrador"],
}

export function puedeTransicionar(
  origen: EstadoReconocimiento,
  destino: EstadoReconocimiento,
): boolean {
  return TRANSICIONES_VALIDAS[origen]?.includes(destino) ?? false
}

// ── Schemas comunes ──
const baseSchema = z.object({
  titulo: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(200),
  descripcionCorta: z
    .string()
    .trim()
    .min(5, "La descripción corta debe tener al menos 5 caracteres")
    .max(280),
  descripcionCompleta: z
    .string()
    .trim()
    .min(5, "La descripción completa debe tener al menos 5 caracteres"),
  motivo: z.string().trim().min(3, "El motivo es obligatorio"),
  imagen: z.string().trim().max(500).optional().nullable(),
  fechaReconocimiento: z.string().min(10, "La fecha del reconocimiento es obligatoria"),
  periodoDesde: z.string().optional().nullable(),
  periodoHasta: z.string().optional().nullable(),
  destacado: z.boolean().default(false),
  mostrarEnLanding: z.boolean().default(false),
})

// ── Empleado del mes ──
export const empleadoMesSchema = baseSchema.extend({
  tipo: z.literal("empleado_mes"),
  empleadoId: z.string().optional().nullable(),
  nombreCompleto: z.string().trim().min(3, "El nombre completo es obligatorio").max(200),
  cargo: z.string().trim().min(2, "El cargo es obligatorio").max(150),
  area: z.string().trim().min(2, "El área es obligatoria").max(150),
  sucursalId: z.string().optional().nullable(),
  mes: z.number().int().min(1).max(12),
  gestion: z.number().int().min(2020, "Gestión inválida").max(2100),
  logrosDestacados: z.string().optional().nullable(),
})

// ── Equipo destacado ──
export const integranteSchema = z.object({
  usuarioId: z.string().optional().nullable(),
  nombre: z.string().trim().min(2, "Nombre del integrante obligatorio").max(200),
  rolEquipo: z.string().trim().max(100).optional().nullable(),
})

export const equipoDestacadoSchema = baseSchema.extend({
  tipo: z.literal("equipo_destacado"),
  nombreEquipo: z.string().trim().min(3, "El nombre del equipo es obligatorio").max(200),
  area: z.string().trim().min(2, "El área es obligatoria").max(150),
  responsableId: z.string().optional().nullable(),
  responsableNombre: z.string().trim().min(3, "El nombre del responsable es obligatorio").max(200),
  resultadosAlcanzados: z
    .string()
    .trim()
    .min(5, "Los resultados alcanzados son obligatorios"),
  integrantes: z.array(integranteSchema).default([]),
})

// ── Logro de sucursal ──
export const indicadorSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre del indicador obligatorio").max(100),
  valor: z.string().trim().min(1, "Valor del indicador obligatorio").max(100),
  unidad: z.string().trim().max(30).optional().nullable(),
})

export const logroSucursalSchema = baseSchema.extend({
  tipo: z.literal("logro_sucursal"),
  sucursalId: z.string().min(1, "Debes seleccionar una sucursal"),
  ciudad: z.string().trim().min(2, "La ciudad es obligatoria").max(100),
  departamento: z.string().trim().min(2, "El departamento es obligatorio").max(100),
  responsableNombre: z
    .string()
    .trim()
    .min(3, "El nombre del responsable es obligatorio")
    .max(200),
  tipoLogro: z.string().trim().min(2, "El tipo de logro es obligatorio").max(50),
  indicadores: z.array(indicadorSchema).default([]),
})

// ── Unión discriminada ──
export const reconocimientoSchema = z.discriminatedUnion("tipo", [
  empleadoMesSchema,
  equipoDestacadoSchema,
  logroSucursalSchema,
])

export type EmpleadoMesInput = z.infer<typeof empleadoMesSchema>
export type EquipoDestacadoInput = z.infer<typeof equipoDestacadoSchema>
export type LogroSucursalInput = z.infer<typeof logroSucursalSchema>
export type ReconocimientoInput = z.infer<typeof reconocimientoSchema>

// ── Etiquetas legibles ──
export const LABEL_ESTADO: Record<EstadoReconocimiento, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  publicado: "Publicado",
  rechazado: "Rechazado",
  archivado: "Archivado",
}

export const LABEL_TIPO: Record<TipoReconocimiento, string> = {
  empleado_mes: "Empleado del mes",
  equipo_destacado: "Equipo destacado",
  logro_sucursal: "Logro de sucursal",
}

export const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const

// ── Etiquetas de campos para mensajes de error legibles ──
const LABEL_CAMPO: Record<string, string> = {
  titulo: "Título",
  descripcionCorta: "Descripción corta",
  descripcionCompleta: "Descripción completa",
  motivo: "Motivo",
  imagen: "Imagen",
  fechaReconocimiento: "Fecha del reconocimiento",
  periodoDesde: "Periodo desde",
  periodoHasta: "Periodo hasta",
  destacado: "Destacado",
  mostrarEnLanding: "Mostrar en landing",
  empleadoId: "Empleado",
  nombreCompleto: "Nombre completo",
  cargo: "Cargo",
  area: "Área",
  sucursalId: "Sucursal",
  mes: "Mes",
  gestion: "Gestión",
  logrosDestacados: "Logros destacados",
  nombreEquipo: "Nombre del equipo",
  responsableId: "Responsable",
  responsableNombre: "Nombre del responsable",
  resultadosAlcanzados: "Resultados alcanzados",
  integrantes: "Integrantes",
  nombre: "Nombre",
  rolEquipo: "Rol en el equipo",
  ciudad: "Ciudad",
  departamento: "Departamento",
  tipoLogro: "Tipo de logro",
  indicadores: "Indicadores",
  valor: "Valor",
  unidad: "Unidad",
}

function etiquetaDeCampo(path: (string | number)[]): string {
  for (const segment of path) {
    if (typeof segment === "string" && LABEL_CAMPO[segment]) {
      return LABEL_CAMPO[segment]
    }
  }
  const ultimo = path.filter((p) => typeof p === "string").pop()
  return typeof ultimo === "string" ? ultimo : "Formulario"
}

/**
 * Convierte un ZodError en un mensaje plano y legible en español.
 * Devuelve el primer issue como "Campo: mensaje".
 */
export function formatearErrorZod(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return "Hay datos inválidos en el formulario"
  const etiqueta = etiquetaDeCampo(issue.path as (string | number)[])
  return `${etiqueta}: ${issue.message}`
}

/**
 * Ejecuta parse sobre un schema y, si falla, lanza un Error con mensaje
 * legible en vez del ZodError crudo.
 */
export function parseOLanzar<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new Error(formatearErrorZod(result.error))
  }
  return result.data
}
