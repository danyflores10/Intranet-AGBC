import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text } from 'drizzle-orm/pg-core';

export const configuracion = pgTable('configuracion', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  clave: varchar('clave', { length: 100 }).notNull().unique(),
  valor: text('valor').notNull(),
  descripcion: varchar('descripcion', { length: 300 }),
  grupo: varchar('grupo', { length: 50 }).notNull().default('general'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
