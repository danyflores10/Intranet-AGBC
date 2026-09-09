export type RoleOption = {
  id: string
  name: string
}

export type UserRole = RoleOption

export type User = {
  id: string
  name: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  email: string
  emailVerified: boolean
  nationalId: string
  dateOfBirth: string
  isActive: boolean
  roles: UserRole[]
  createdAt: string
  updatedAt: string
}

export type UserCreatePayload = {
  name?: string
  firstName?: string
  lastNamePaternal?: string
  lastNameMaternal?: string
  email?: string
  institutionalEmail: string
  nationalId: string
  dateOfBirth: string
  isActive: boolean
  password: string
  roleIds: string[]
}

export type UserUpdatePayload = {
  name?: string
  firstName?: string
  lastNamePaternal?: string
  lastNameMaternal?: string
  email?: string
  institutionalEmail: string
  nationalId: string
  dateOfBirth: string
  isActive: boolean
  password?: string
  roleIds: string[]
}

export type UserUpsertPayload = UserCreatePayload | UserUpdatePayload
