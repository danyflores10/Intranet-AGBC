import { createId } from '@paralleldrive/cuid2';
import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const verifications = pgTable(
  'verifications',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);