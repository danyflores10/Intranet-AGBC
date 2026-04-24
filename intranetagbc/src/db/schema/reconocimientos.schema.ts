import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { sucursales } from './sucursales.schema';

// ─────────────────────────────────────────────────────────────────────────────
// Tabla base de reconocimientos (compartida entre los 3 submódulos)
// ─────────────────────────────────────────────────────────────────────────────
export const reconocimientos = pgTable(
  'reconocimientos',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    // Tipo del submódulo: 'empleado_mes' | 'equipo_destacado' | 'logro_sucursal'
    tipo: varchar('tipo', { length: 30 }).notNull(),

    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcionCorta: varchar('descripcion_corta', { length: 280 }).notNull(),
    descripcionCompleta: text('descripcion_completa').notNull(),
    imagen: varchar('imagen', { length: 500 }),
    motivo: text('motivo').notNull(),

    // Periodo flexible (para equipos/sucursales). Empleado del mes usa mes+gestion.
    periodoDesde: date('periodo_desde'),
    periodoHasta: date('periodo_hasta'),
    fechaReconocimiento: date('fecha_reconocimiento').notNull(),

    // 'borrador' | 'pendiente' | 'publicado' | 'rechazado' | 'archivado'
    estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
    motivoRechazo: text('motivo_rechazo'),

    destacado: boolean('destacado').notNull().default(false),
    mostrarEnLanding: boolean('mostrar_en_landing').notNull().default(false),
    activo: boolean('activo').notNull().default(true),

    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    aprobadoPor: varchar('aprobado_por', { length: 24 }).references(() => users.id),
    publicadoEn: timestamp('publicado_en', { withTimezone: true }),
    archivadoEn: timestamp('archivado_en', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('reconocimientos_tipo_idx').on(t.tipo),
    index('reconocimientos_estado_idx').on(t.estado),
    index('reconocimientos_tipo_estado_idx').on(t.tipo, t.estado),
    index('reconocimientos_landing_idx').on(t.mostrarEnLanding, t.destacado, t.publicadoEn),
    index('reconocimientos_creado_por_idx').on(t.creadoPor),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Submódulo A: Empleado del Mes
// ─────────────────────────────────────────────────────────────────────────────
export const reconocimientoEmpleadoMes = pgTable(
  'reconocimiento_empleado_mes',
  {
    reconocimientoId: varchar('reconocimiento_id', { length: 24 })
      .primaryKey()
      .references(() => reconocimientos.id, { onDelete: 'cascade' }),

    empleadoId: varchar('empleado_id', { length: 24 }).references(() => users.id),
    nombreCompleto: varchar('nombre_completo', { length: 200 }).notNull(),
    cargo: varchar('cargo', { length: 150 }).notNull(),
    area: varchar('area', { length: 150 }).notNull(),
    sucursalId: varchar('sucursal_id', { length: 24 }).references(() => sucursales.id),

    mes: integer('mes').notNull(),
    gestion: integer('gestion').notNull(),

    logrosDestacados: text('logros_destacados'),
  },
  (t) => [
    index('reconocimiento_empleado_mes_empleado_idx').on(t.empleadoId),
    index('reconocimiento_empleado_mes_periodo_idx').on(t.gestion, t.mes),
    // Nota: la regla "un solo publicado por (mes,gestión)" se aplica en el servicio
    // porque afecta a filas de otra tabla (reconocimientos.estado).
    uniqueIndex('reconocimiento_empleado_mes_unico_idx').on(t.reconocimientoId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Submódulo B: Equipos Destacados
// ─────────────────────────────────────────────────────────────────────────────
export const reconocimientoEquipo = pgTable(
  'reconocimiento_equipo',
  {
    reconocimientoId: varchar('reconocimiento_id', { length: 24 })
      .primaryKey()
      .references(() => reconocimientos.id, { onDelete: 'cascade' }),

    nombreEquipo: varchar('nombre_equipo', { length: 200 }).notNull(),
    area: varchar('area', { length: 150 }).notNull(),
    responsableId: varchar('responsable_id', { length: 24 }).references(() => users.id),
    responsableNombre: varchar('responsable_nombre', { length: 200 }).notNull(),
    resultadosAlcanzados: text('resultados_alcanzados').notNull(),
  },
  (t) => [index('reconocimiento_equipo_responsable_idx').on(t.responsableId)],
);

export const reconocimientoEquipoIntegrantes = pgTable(
  'reconocimiento_equipo_integrantes',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    reconocimientoId: varchar('reconocimiento_id', { length: 24 })
      .references(() => reconocimientoEquipo.reconocimientoId, { onDelete: 'cascade' })
      .notNull(),
    usuarioId: varchar('usuario_id', { length: 24 }).references(() => users.id),
    nombre: varchar('nombre', { length: 200 }).notNull(),
    rolEquipo: varchar('rol_equipo', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('reconocimiento_equipo_integrantes_reco_idx').on(t.reconocimientoId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Submódulo C: Logros de Sucursales
// ─────────────────────────────────────────────────────────────────────────────
export const reconocimientoLogroSucursal = pgTable(
  'reconocimiento_logro_sucursal',
  {
    reconocimientoId: varchar('reconocimiento_id', { length: 24 })
      .primaryKey()
      .references(() => reconocimientos.id, { onDelete: 'cascade' }),

    sucursalId: varchar('sucursal_id', { length: 24 })
      .references(() => sucursales.id)
      .notNull(),
    ciudad: varchar('ciudad', { length: 100 }).notNull(),
    departamento: varchar('departamento', { length: 100 }).notNull(),
    responsableNombre: varchar('responsable_nombre', { length: 200 }).notNull(),
    tipoLogro: varchar('tipo_logro', { length: 50 }).notNull(),
    // Array de indicadores: [{ nombre, valor, unidad }]
    indicadores: jsonb('indicadores'),
  },
  (t) => [
    index('reconocimiento_logro_sucursal_sucursal_idx').on(t.sucursalId),
    index('reconocimiento_logro_sucursal_tipo_idx').on(t.tipoLogro),
  ],
);
