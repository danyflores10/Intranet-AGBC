import { createId } from '@paralleldrive/cuid2';
import { index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const session = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    token: varchar('token', { length: 512 }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),

    ipAddress: varchar('ip_address', { length: 100 }),
    userAgent: varchar('user_agent', { length: 255 }),

    userId: varchar('user_id', { length: 24 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('session_token_unique').on(t.token),
    index('session_user_id_idx').on(t.userId),
  ],
);