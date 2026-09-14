import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';

export const emailLogs = pgTable(
  'email_logs',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    destinatarioNombre: varchar('destinatario_nombre', { length: 200 }).notNull(),
    destinatarioEmail: varchar('destinatario_email', { length: 200 }).notNull(),
    tipo: varchar('tipo', { length: 50 }).notNull(), // 'cuenta_creada' | 'reenvio_credenciales' | 'correo_prueba' | 'envio_masivo'
    asunto: varchar('asunto', { length: 300 }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('enviado'), // 'enviado' | 'error'
    errorMensaje: text('error_mensaje'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('email_logs_destinatario_email_idx').on(t.destinatarioEmail),
    index('email_logs_tipo_idx').on(t.tipo),
    index('email_logs_estado_idx').on(t.estado),
    index('email_logs_created_at_idx').on(t.createdAt),
  ],
);
