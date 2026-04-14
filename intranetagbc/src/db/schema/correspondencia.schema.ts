import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, boolean, text, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const correspondencia = pgTable(
  'correspondencia',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    hojaRuta: varchar('hoja_ruta', { length: 30 }).notNull().unique(),
    asunto: varchar('asunto', { length: 300 }).notNull(),
    remitente: varchar('remitente', { length: 150 }).notNull(),
    destinatario: varchar('destinatario', { length: 150 }),
    tipo: varchar('tipo', { length: 20 }).notNull().default('entrada'),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    leido: boolean('leido').default(false).notNull(),
    observaciones: text('observaciones'),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('correspondencia_tipo_idx').on(t.tipo), index('correspondencia_estado_idx').on(t.estado)],
);
