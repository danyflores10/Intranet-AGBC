import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const notificaciones = pgTable(
  'notificaciones',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    titulo: varchar('titulo', { length: 300 }).notNull(),
    mensaje: text('mensaje').notNull(),
    tipo: varchar('tipo', { length: 30 }).notNull().default('info'),
    leida: boolean('leida').default(false).notNull(),
    usuarioId: varchar('usuario_id', { length: 24 })
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    enlace: varchar('enlace', { length: 500 }),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('notificaciones_usuario_idx').on(t.usuarioId),
    index('notificaciones_leida_idx').on(t.leida),
  ],
);
