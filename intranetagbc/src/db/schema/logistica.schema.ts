import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, integer, index, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const inventario = pgTable(
  'inventario',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    codigo: varchar('codigo', { length: 30 }).notNull().unique(),
    item: varchar('item', { length: 200 }).notNull(),
    categoria: varchar('categoria', { length: 100 }).notNull(),
    stock: integer('stock').notNull().default(0),
    stockMinimo: integer('stock_minimo').notNull().default(0),
    unidad: varchar('unidad', { length: 50 }).notNull().default('Unidad'),
    estado: varchar('estado', { length: 20 }).notNull().default('activo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('inventario_categoria_idx').on(t.categoria)],
);

export const solicitudesMaterial = pgTable(
  'solicitudes_material',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    numero: varchar('numero', { length: 30 }).notNull().unique(),
    solicitante: varchar('solicitante', { length: 150 }).notNull(),
    items: text('items').notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
    observaciones: text('observaciones'),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('solicitudes_estado_idx').on(t.estado)],
);

export const proveedores = pgTable('proveedores', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  rubro: varchar('rubro', { length: 150 }).notNull(),
  nit: varchar('nit', { length: 30 }).notNull(),
  telefono: varchar('telefono', { length: 50 }),
  contacto: varchar('contacto', { length: 150 }),
  email: varchar('email', { length: 150 }),
  estado: varchar('estado', { length: 20 }).notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
