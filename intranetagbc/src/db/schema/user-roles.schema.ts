import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { roles } from './roles.schema';
import { users } from './users.schema';

export const userRoles = pgTable(
  'user_roles',
  {
    userId: varchar('user_id', { length: 24 })
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: varchar('role_id', { length: 24 })
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index('user_roles_role_id_idx').on(t.roleId),
  ],
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));
