import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text } from 'drizzle-orm/pg-core';

export const archivos = pgTable('archivos', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  categoria: varchar('categoria', { length: 100 }).notNull(),
  ubicacion: varchar('ubicacion', { length: 300 }),
  descripcion: text('descripcion'),
  estado: varchar('estado', { length: 20 }).notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
