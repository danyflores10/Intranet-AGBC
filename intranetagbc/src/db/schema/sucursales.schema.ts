import { createId } from '@paralleldrive/cuid2';
import { pgTable, timestamp, varchar, text, boolean, index } from 'drizzle-orm/pg-core';

export const sucursales = pgTable(
  'sucursales',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),
    departamento: varchar('departamento', { length: 50 }).notNull(),
    capital: varchar('capital', { length: 100 }).notNull(),
    nombre: varchar('nombre', { length: 300 }).notNull(),
    direccion: text('direccion').notNull(),
    telefono: varchar('telefono', { length: 50 }),
    horario: varchar('horario', { length: 200 }),
    foto: varchar('foto', { length: 500 }),
    googleMaps: varchar('google_maps', { length: 500 }),
    color: varchar('color', { length: 20 }).default('#FFB300'),
    svgId: varchar('svg_id', { length: 10 }),
    pinX: varchar('pin_x', { length: 10 }),
    pinY: varchar('pin_y', { length: 10 }),
    activo: boolean('activo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
  },
  (t) => [
    index('sucursales_departamento_idx').on(t.departamento),
    index('sucursales_activo_idx').on(t.activo),
  ],
);
