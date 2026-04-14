import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, date, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { userRoles } from './user-roles.schema';

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 24 })
      .primaryKey()
      .$defaultFn(() => createId()),

    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastNamePaternal: varchar('last_name_paternal', { length: 100 }).notNull(),
    lastNameMaternal: varchar('last_name_maternal', { length: 100 }),
    email: varchar('email', { length: 150 }).unique(),
    institutionalEmail: varchar('institutional_email', { length: 150 }).unique().notNull(),

    emailVerified: boolean('email_verified')
      .default(false)
      .notNull(),
    nationalId: varchar('national_id', { length: 20 }).notNull().unique(),
    dateOfBirth: date('date_of_birth').notNull(),
    isActive: boolean('is_active')
      .default(true)
      .notNull(),
    image: text('image'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex('user_email_unique').on(t.email)],
);


export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));