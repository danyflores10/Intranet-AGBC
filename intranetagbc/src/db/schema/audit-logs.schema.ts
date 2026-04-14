import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    usuario: varchar('usuario', { length: 200 }).notNull(),
    accion: varchar('accion', { length: 200 }).notNull(),
    modulo: varchar('modulo', { length: 100 }).notNull(),
    ip: varchar('ip', { length: 100 }),
    resultado: varchar('resultado', { length: 20 }).notNull().default('Exitoso'),
    detalles: text('detalles'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('audit_logs_usuario_idx').on(t.usuario), index('audit_logs_modulo_idx').on(t.modulo)],
);
