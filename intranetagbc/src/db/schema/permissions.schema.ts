import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';
import { rolePermissions } from './role-permissions.schema';

export const permissions = pgTable('permissions', {
  id: varchar('id', { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));
