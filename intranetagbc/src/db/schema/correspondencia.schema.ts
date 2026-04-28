import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, boolean, text, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { sucursales } from './sucursales.schema';

/* ────────────────────────────────────────────────────────────────────────
 * Catálogo de tipos de documento (carta, oficio, memorándum, informe...)
 * ─────────────────────────────────────────────────────────────────────── */
export const correspondenciaTiposDocumento = pgTable(
  'correspondencia_tipos_documento',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    nombre: varchar('nombre', { length: 80 }).notNull().unique(),
    descripcion: varchar('descripcion', { length: 200 }),
    plazoDefaultDias: integer('plazo_default_dias').default(5).notNull(),
    activo: boolean('activo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [index('correspondencia_tipos_doc_activo_idx').on(t.activo)],
);

/* ────────────────────────────────────────────────────────────────────────
 * Correspondencia institucional (entrada, salida, interna)
 *
 * Mantiene los campos originales (hojaRuta, asunto, remitente, destinatario,
 * tipo, estado, leido, observaciones, creadoPor) por compatibilidad con
 * registros existentes y agrega los nuevos campos requeridos por el módulo.
 * ─────────────────────────────────────────────────────────────────────── */
export const correspondencia = pgTable(
  'correspondencia',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    // Identificación
    hojaRuta: varchar('hoja_ruta', { length: 30 }).notNull().unique(),

    // Clasificación
    tipoDocumentoId: varchar('tipo_documento_id', { length: 24 }).references(
      () => correspondenciaTiposDocumento.id,
    ),
    origen: varchar('origen', { length: 20 }).notNull().default('interno'), // interno / externo
    tipo: varchar('tipo', { length: 20 }).notNull().default('entrada'), // entrada / salida / interna
    prioridad: varchar('prioridad', { length: 20 }).notNull().default('normal'), // baja, normal, alta, urgente
    estado: varchar('estado', { length: 30 }).notNull().default('registrado'),

    // Remitente
    remitente: varchar('remitente', { length: 200 }).notNull(),
    remitenteUserId: varchar('remitente_user_id', { length: 24 }).references(() => users.id),

    // Destinatario
    destinatario: varchar('destinatario', { length: 200 }),
    destinatarioUserId: varchar('destinatario_user_id', { length: 24 }).references(() => users.id),
    destinoArea: varchar('destino_area', { length: 150 }),
    destinoSucursalId: varchar('destino_sucursal_id', { length: 24 }).references(() => sucursales.id),

    // Contenido
    asunto: varchar('asunto', { length: 300 }).notNull(),
    descripcion: text('descripcion'),
    observaciones: text('observaciones'),

    // Tiempos
    fechaRecepcion: timestamp('fecha_recepcion', { withTimezone: true }).defaultNow().notNull(),
    fechaEnvio: timestamp('fecha_envio', { withTimezone: true }),
    plazoAtencion: timestamp('plazo_atencion', { withTimezone: true }),
    archivadoEn: timestamp('archivado_en', { withTimezone: true }),

    // Estado de lectura (compatibilidad con bandeja)
    leido: boolean('leido').default(false).notNull(),

    // Auditoría
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    actualizadoPor: varchar('actualizado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('correspondencia_tipo_idx').on(t.tipo),
    index('correspondencia_estado_idx').on(t.estado),
    index('correspondencia_prioridad_idx').on(t.prioridad),
    index('correspondencia_destino_area_idx').on(t.destinoArea),
    index('correspondencia_destinatario_user_idx').on(t.destinatarioUserId),
    index('correspondencia_destino_sucursal_idx').on(t.destinoSucursalId),
    index('correspondencia_plazo_idx').on(t.plazoAtencion),
  ],
);

/* ────────────────────────────────────────────────────────────────────────
 * Movimientos / derivaciones / cambios de estado
 * ─────────────────────────────────────────────────────────────────────── */
export const correspondenciaMovimientos = pgTable(
  'correspondencia_movimientos',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    correspondenciaId: varchar('correspondencia_id', { length: 24 })
      .references(() => correspondencia.id, { onDelete: 'cascade' })
      .notNull(),

    // Origen del movimiento
    fromUserId: varchar('from_user_id', { length: 24 }).references(() => users.id),
    fromArea: varchar('from_area', { length: 150 }),
    fromSucursalId: varchar('from_sucursal_id', { length: 24 }).references(() => sucursales.id),

    // Destino del movimiento
    toUserId: varchar('to_user_id', { length: 24 }).references(() => users.id),
    toArea: varchar('to_area', { length: 150 }),
    toSucursalId: varchar('to_sucursal_id', { length: 24 }).references(() => sucursales.id),

    // Cambio de estado
    estadoAnterior: varchar('estado_anterior', { length: 30 }),
    estadoNuevo: varchar('estado_nuevo', { length: 30 }).notNull(),

    // Datos del movimiento
    accion: varchar('accion', { length: 30 }).notNull().default('derivacion'),
    instrucciones: text('instrucciones'),
    comentario: text('comentario'),
    prioridad: varchar('prioridad', { length: 20 }),
    plazoAtencion: timestamp('plazo_atencion', { withTimezone: true }),

    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('correspondencia_mov_correspondencia_idx').on(t.correspondenciaId),
    index('correspondencia_mov_to_user_idx').on(t.toUserId),
    index('correspondencia_mov_estado_idx').on(t.estadoNuevo),
  ],
);

/* ────────────────────────────────────────────────────────────────────────
 * Adjuntos (PDF / JPG / PNG) asociados a la correspondencia o a un movimiento
 * ─────────────────────────────────────────────────────────────────────── */
export const correspondenciaAdjuntos = pgTable(
  'correspondencia_adjuntos',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    correspondenciaId: varchar('correspondencia_id', { length: 24 })
      .references(() => correspondencia.id, { onDelete: 'cascade' })
      .notNull(),
    movimientoId: varchar('movimiento_id', { length: 24 }).references(
      () => correspondenciaMovimientos.id,
      { onDelete: 'set null' },
    ),
    archivoNombre: varchar('archivo_nombre', { length: 255 }).notNull(),
    archivoUrl: varchar('archivo_url', { length: 500 }).notNull(),
    archivoTipo: varchar('archivo_tipo', { length: 20 }).notNull(),
    archivoTamano: integer('archivo_tamano').notNull().default(0),
    subidoPor: varchar('subido_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('correspondencia_adj_correspondencia_idx').on(t.correspondenciaId),
    index('correspondencia_adj_movimiento_idx').on(t.movimientoId),
  ],
);
