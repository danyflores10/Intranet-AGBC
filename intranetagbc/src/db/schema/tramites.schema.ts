import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const solicitudes = pgTable(
  'solicitudes',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    codigo: varchar('codigo', { length: 30 }).notNull().unique(),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    descripcion: text('descripcion'),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    prioridad: varchar('prioridad', { length: 20 }).notNull().default('media'),
    observaciones: text('observaciones'),
    respuesta: text('respuesta'),

    // Relaciones de usuario
    solicitanteId: varchar('solicitante_id', { length: 24 }).notNull().references(() => users.id),
    destinatarioId: varchar('destinatario_id', { length: 24 }).references(() => users.id),

    // Archivo adjunto
    archivoUrl: varchar('archivo_url', { length: 500 }),
    archivoNombre: varchar('archivo_nombre', { length: 255 }),
    archivoTipo: varchar('archivo_tipo', { length: 20 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [
    index('solicitudes_estado_idx').on(t.estado),
    index('solicitudes_tipo_idx').on(t.tipo),
    index('solicitudes_solicitante_idx').on(t.solicitanteId),
    index('solicitudes_destinatario_idx').on(t.destinatarioId),
  ],
);

// Mantener export para compatibilidad
export const tramites = solicitudes;
