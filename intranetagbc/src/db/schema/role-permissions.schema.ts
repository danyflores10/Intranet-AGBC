import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { roles } from './roles.schema';
import { permissions } from './permissions.schema';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: varchar('role_id', { length: 24 })
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: varchar('permission_id', { length: 24 })
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index('role_permissions_permission_id_idx').on(t.permissionId),
  ],
);

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);
