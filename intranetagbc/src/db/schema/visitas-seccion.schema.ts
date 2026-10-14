import { createId } from "@paralleldrive/cuid2"
import { pgTable, timestamp, varchar, text, index } from "drizzle-orm/pg-core"

export const intranetVisitasSeccion = pgTable(
  "intranet_visitas_seccion",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => createId()),
    usuarioId: varchar("usuario_id", { length: 100 }),
    seccion: varchar("seccion", { length: 120 }).notNull(),
    ip: varchar("ip", { length: 100 }),
    detalles: text("detalles"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_visitas_seccion_nombre").on(t.seccion),
    index("idx_visitas_seccion_created_at").on(t.createdAt),
    index("idx_visitas_seccion_usuario").on(t.usuarioId),
  ]
)
