export type Permission = {
  id: string
  name: string
}

export type Role = {
  id: string
  name: string
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export type RoleUpsertPayload = {
  name: string
  permissionIds: string[]
}
