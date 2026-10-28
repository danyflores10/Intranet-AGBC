import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const documentoCategorias = pgTable(
  'documento_categorias',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    descripcion: text('descripcion'),
    parentId: varchar('parent_id', { length: 24 }),
    nivel: integer('nivel').default(1), // 1 = Dirección, 2 = Subcategoría / Área, 3 = Tipo Documental
    orden: integer('orden').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [index('doc_cat_parent_idx').on(t.parentId), index('doc_cat_nivel_idx').on(t.nivel)]
);

export const documentos = pgTable(
  'documentos',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    titulo: varchar('titulo', { length: 300 }).notNull(),
    categoriaId: varchar('categoria_id', { length: 24 }).references(() => documentoCategorias.id),
    direccionId: varchar('direccion_id', { length: 24 }),
    subcategoriaId: varchar('subcategoria_id', { length: 24 }),
    tipoDocumental: varchar('tipo_documental', { length: 50 }),
    autor: varchar('autor', { length: 150 }).notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
    archivo: varchar('archivo', { length: 500 }),
    nombreArchivo: varchar('nombre_archivo', { length: 255 }),
    tipoArchivo: varchar('tipo_archivo', { length: 50 }),
    tamano: varchar('tamano', { length: 20 }),
    descripcion: text('descripcion'),
    version: varchar('version', { length: 20 }).default('v1.0'),
    esVigente: boolean('es_vigente').default(true),
    familiaCodigo: varchar('familia_codigo', { length: 150 }),
    fechaEmision: varchar('fecha_emision', { length: 100 }),
    numeroCorrelativo: integer('numero_correlativo'),
    disponibilidadArchivo: varchar('disponibilidad_archivo', { length: 30 }).default('disponible'),
    creadoPor: varchar('creado_por', { length: 24 }).references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [
    index('documentos_categoria_idx').on(t.categoriaId),
    index('documentos_direccion_idx').on(t.direccionId),
    index('documentos_subcategoria_idx').on(t.subcategoriaId),
    index('documentos_tipo_doc_idx').on(t.tipoDocumental),
    index('documentos_estado_idx').on(t.estado),
    index('documentos_familia_idx').on(t.familiaCodigo),
    index('documentos_vigente_idx').on(t.esVigente),
    index('documentos_correlativo_idx').on(t.numeroCorrelativo),
  ],
);

export const catalogoImportaciones = pgTable(
  'catalogo_importaciones',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    nombreArchivo: varchar('nombre_archivo', { length: 255 }).notNull(),
    totalProcesados: integer('total_procesados').default(0),
    nuevos: integer('nuevos').default(0),
    actualizados: integer('actualizados').default(0),
    sinCambios: integer('sin_cambios').default(0),
    faltanArchivo: integer('faltan_archivo').default(0),
    detalles: text('detalles'), // JSON diff summary
    revertido: boolean('revertido').default(false),
    revertidoAt: timestamp('revertido_at', { withTimezone: true }),
    revertidoPor: varchar('revertido_por', { length: 150 }),
    usuarioId: varchar('usuario_id', { length: 24 }).references(() => users.id),
    usuarioNombre: varchar('usuario_nombre', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('catalogo_importaciones_created_idx').on(t.createdAt),
    index('catalogo_importaciones_usuario_idx').on(t.usuarioId),
  ],
);

