import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Singleton: una sola fila con clave fija 'default' que guarda la config global.
export const onboardingConfig = pgTable('onboarding_config', {
  clave: varchar('clave', { length: 30 }).primaryKey().default('default'),
  activo: boolean('activo').notNull().default(true),
  // 'todos' | 'nuevos' | 'rol'
  mostrarA: varchar('mostrar_a', { length: 20 }).notNull().default('nuevos'),
  // Si mostrarA = 'rol', este rol específico (normalizado, ej: 'rrhh')
  rolObjetivo: varchar('rol_objetivo', { length: 50 }),
  // Se incrementa cuando el admin ejecuta "reiniciar para todos"
  version: varchar('version', { length: 20 }).notNull().default('1'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});

// Progreso por usuario
export const onboardingProgreso = pgTable(
  'onboarding_progreso',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    usuarioId: varchar('usuario_id', { length: 24 })
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    // 'pendiente' | 'completado' | 'omitido'
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    paso: varchar('paso', { length: 50 }),
    // Versión del onboarding (se compara con onboardingConfig.version)
    version: varchar('version', { length: 20 }).notNull().default('1'),
    vistoEn: timestamp('visto_en', { withTimezone: true }),
    completadoEn: timestamp('completado_en', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('onboarding_progreso_usuario_idx').on(t.usuarioId),
    index('onboarding_progreso_estado_idx').on(t.estado),
  ],
);
