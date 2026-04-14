import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const documentoCategorias = pgTable('documento_categorias', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  descripcion: text('descripcion'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const documentos = pgTable(
  'documentos',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    titulo: varchar('titulo', { length: 300 }).notNull(),
    categoriaId: varchar('categoria_id', { length: 24 }).references(() => documentoCategorias.id),
    autor: varchar('autor', { length: 150 }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
    archivo: varchar('archivo', { length: 500 }),
    nombreArchivo: varchar('nombre_archivo', { length: 255 }),
    tipoArchivo: varchar('tipo_archivo', { length: 50 }),
    tamano: varchar('tamano', { length: 20 }),
    descripcion: text('descripcion'),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('documentos_categoria_idx').on(t.categoriaId), index('documentos_estado_idx').on(t.estado)],
);
