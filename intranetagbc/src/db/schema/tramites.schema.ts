import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const tramites = pgTable(
  'tramites',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    codigo: varchar('codigo', { length: 30 }).notNull().unique(),
    solicitante: varchar('solicitante', { length: 200 }).notNull(),
    tipo: varchar('tipo', { length: 100 }).notNull(),
    descripcion: text('descripcion'),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    prioridad: varchar('prioridad', { length: 20 }).notNull().default('media'),
    observaciones: text('observaciones'),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('tramites_estado_idx').on(t.estado), index('tramites_prioridad_idx').on(t.prioridad)],
);
