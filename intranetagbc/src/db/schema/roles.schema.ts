import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';
import { rolePermissions } from './role-permissions.schema';
import { userRoles } from './user-roles.schema';

export const roles = pgTable('roles', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 50 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));
