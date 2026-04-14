import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, date, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const eventosCalendario = pgTable(
  'eventos_calendario',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    titulo: varchar('titulo', { length: 300 }).notNull(),
    descripcion: text('descripcion'),
    tipo: varchar('tipo', { length: 30 }).notNull().default('feriado'),
    fechaInicio: date('fecha_inicio').notNull(),
    fechaFin: date('fecha_fin'),
    color: varchar('color', { length: 20 }).default('#FFB300'),
    notificar: boolean('notificar').default(true).notNull(),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [
    index('eventos_fecha_inicio_idx').on(t.fechaInicio),
    index('eventos_tipo_idx').on(t.tipo),
  ],
);
