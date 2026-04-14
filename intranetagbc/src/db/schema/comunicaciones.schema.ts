import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, boolean, date } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const comunicados = pgTable('comunicados', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  contenido: text('contenido').notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull().default('comunicado'),
  estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
  fechaPublicacion: date('fecha_publicacion'),
  fechaExpiracion: date('fecha_expiracion'),
  destacado: boolean('destacado').default(false).notNull(),
  imagen: varchar('imagen', { length: 500 }),
  archivoUrl: text('archivo_url'),
  archivoNombre: varchar('archivo_nombre', { length: 300 }),
  archivoTipo: varchar('archivo_tipo', { length: 20 }),
  creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const banners = pgTable('banners', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  imagen: varchar('imagen', { length: 500 }),
  imagenes: text('imagenes'), // JSON array of image URLs
  enlace: varchar('enlace', { length: 500 }),
  activo: boolean('activo').default(true).notNull(),
  orden: varchar('orden', { length: 10 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
