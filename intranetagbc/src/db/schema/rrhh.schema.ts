import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, date, integer } from 'drizzle-orm/pg-core';

export const personal = pgTable('personal', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  ci: varchar('ci', { length: 20 }).notNull(),
  cargo: varchar('cargo', { length: 150 }).notNull(),
  unidad: varchar('unidad', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  telefono: varchar('telefono', { length: 50 }),
  foto: varchar('foto', { length: 500 }),
  fechaIngreso: date('fecha_ingreso').notNull(),
  estado: varchar('estado', { length: 20 }).notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const directivos = pgTable('directivos', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  cargo: varchar('cargo', { length: 150 }).notNull(),
  unidad: varchar('unidad', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }),
  telefono: varchar('telefono', { length: 50 }),
  foto: varchar('foto', { length: 500 }),
  orden: integer('orden').notNull().default(0),
  estado: varchar('estado', { length: 20 }).notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const contactosEmergencia = pgTable('contactos_emergencia', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  personalId: varchar('personal_id', { length: 24 }).references(() => personal.id, { onDelete: 'cascade' }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  parentesco: varchar('parentesco', { length: 50 }).notNull(),
  telefono: varchar('telefono', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
