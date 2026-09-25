import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, index, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';
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
    direccionEmisora: varchar('direccion_emisora', { length: 150 }),
    esImportante: boolean('es_importante').default(false).notNull(),
    requiereLectura: boolean('requiere_lectura').default(false).notNull(),
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
  (t) => [
    index('documentos_categoria_idx').on(t.categoriaId),
    index('documentos_estado_idx').on(t.estado),
    index('documentos_importante_idx').on(t.esImportante),
  ],
);

export const documentoLecturas = pgTable(
  'documento_lecturas',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    documentoId: varchar('documento_id', { length: 24 })
      .references(() => documentos.id, { onDelete: 'cascade' })
      .notNull(),
    usuarioId: varchar('usuario_id', { length: 24 })
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    fechaLectura: timestamp('fecha_lectura', { withTimezone: true }).defaultNow().notNull(),
    confirmado: boolean('confirmado').default(true).notNull(),
    tiempoLecturaSegundos: integer('tiempo_lectura_segundos').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('doc_lecturas_doc_idx').on(t.documentoId),
    index('doc_lecturas_user_idx').on(t.usuarioId),
    uniqueIndex('doc_lecturas_unique').on(t.documentoId, t.usuarioId),
  ],
);
