import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const ticketsSoporte = pgTable(
  'tickets_soporte',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    codigo: varchar('codigo', { length: 30 }).notNull().unique(),
    asunto: varchar('asunto', { length: 300 }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('abierto'),
    prioridad: varchar('prioridad', { length: 20 }).notNull().default('media'),

    solicitanteId: varchar('solicitante_id', { length: 24 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agenteId: varchar('agente_id', { length: 24 })
      .references(() => users.id),

    cerradoAt: timestamp('cerrado_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [
    index('idx_tickets_soporte_estado').on(t.estado),
    index('idx_tickets_soporte_solicitante').on(t.solicitanteId),
    index('idx_tickets_soporte_agente').on(t.agenteId),
  ],
);

export const mensajesSoporte = pgTable(
  'mensajes_soporte',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    ticketId: varchar('ticket_id', { length: 24 })
      .notNull()
      .references(() => ticketsSoporte.id, { onDelete: 'cascade' }),
    emisorId: varchar('emisor_id', { length: 24 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contenido: text('contenido'),
    tipoMensaje: varchar('tipo_mensaje', { length: 20 }).notNull().default('texto'),
    archivoUrl: varchar('archivo_url', { length: 500 }),
    archivoNombre: varchar('archivo_nombre', { length: 300 }),
    archivoTipo: varchar('archivo_tipo', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_mensajes_soporte_ticket').on(t.ticketId),
    index('idx_mensajes_soporte_emisor').on(t.emisorId),
  ],
);
