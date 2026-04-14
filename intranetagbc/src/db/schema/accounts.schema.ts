import { createId } from '@paralleldrive/cuid2';
import { index, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const account = pgTable(
  'accounts',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 100 }).notNull(),

    userId: varchar('user_id', { length: 24 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    accessToken: varchar('access_token', { length: 512 }),
    refreshToken: varchar('refresh_token', { length: 512 }),
    idToken: varchar('id_token', { length: 512 }),

    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),

    scope: varchar('scope', { length: 255 }),
    password: varchar('password', { length: 255 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('account_provider_account_unique').on(t.providerId, t.accountId),
    index('account_user_id_idx').on(t.userId),
  ],
);