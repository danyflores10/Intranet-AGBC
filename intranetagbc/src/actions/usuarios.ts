'use server'

import { revalidatePath } from "next/cache"
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { account, personal, roles, userRoles, users } from "@/db/schema"
import { auth } from "@/lib/auth"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerSesionConAccesoActual, type SesionConAcceso } from "@/lib/auth/session-access"
import { registrarAuditLog } from "@/actions/auditoria"
import { sincronizarTodoPersonalConUsuarios } from "@/lib/services/personal-user-sync"

type ResultadoAccion<TData> = {
  success: boolean
  message: string
  data: TData | null
}

type RolUsuarioDTO = {
  id: string
  name: string
}

export type UsuarioDTO = {
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
  roles: RolUsuarioDTO[]
  createdAt: string
  updatedAt: string
}

export type RoleOptionDTO = {
  id: string
  name: string
}

type DeletedUserDTO = {
  id: string
  name: string
  institutionalEmail: string
}

export type CreateUserInput = {
  name?: string
  firstName?: string
  lastNamePaternal?: string
  lastNameMaternal?: string
  email?: string
  institutionalEmail: string
  nationalId?: string
  dateOfBirth?: string
  isActive?: boolean
  password: string
  roleIds?: string[]
}

export type UpdateUserInput = {
  name?: string
  firstName?: string
  lastNamePaternal?: string
  lastNameMaternal?: string
  email?: string
  institutionalEmail?: string
  nationalId?: string
  dateOfBirth?: string
  isActive?: boolean
  password?: string
  roleIds?: string[]
}

type UsuarioFilaConRol = {
  userId: string
  userFirstName: string
  userLastNamePaternal: string
  userLastNameMaternal: string | null
  userInstitutionalEmail: string
  userEmail: string | null
  userEmailVerified: boolean
  userNationalId: string
  userDateOfBirth: string | Date
  userIsActive: boolean
  userCreatedAt: Date
  userUpdatedAt: Date
  roleId: string | null
  roleName: string | null
}

type QueryRunner = Pick<typeof db, "select" | "insert" | "update" | "delete">

const ROLE_SUPER_ADMIN = "super_admin"
const CREDENTIAL_PROVIDER = "credential"
const ALLOWED_EMAIL_DOMAINS = ["correos.gob.bo", "agbc.gob.bo", "gmail.com"] as const


function respuestaExitosa<TData>(message: string, data: TData): ResultadoAccion<TData> {
  return {
    success: true,
    message,
    data,
  }
}

function respuestaError<TData>(message: string): ResultadoAccion<TData> {
  return {
    success: false,
    message,
    data: null,
  }
}

function obtenerMensajeDeError(error: unknown, fallback = "Ocurrio un error inesperado."): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function normalizarTexto(value: string): string {
  return value.trim().toLowerCase()
}

function normalizarNombre(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function normalizarNombreOpcional(value?: string | null): string | null {
  const normalized = normalizarNombre(value ?? "")
  return normalized.length > 0 ? normalized : null
}

function normalizarEmail(value: string): string {
  return value.trim().toLowerCase()
}

function normalizarFechaNacimiento(value: string): string {
  return value.trim()
}

function normalizarCi(value: string): string {
  return value.trim().toUpperCase()
}

function limpiarRoleIds(roleIds: string[] | undefined): string[] {
  if (!roleIds) {
    return []
  }

  const limpios = roleIds
    .map((roleId) => roleId.trim())
    .filter((roleId) => roleId.length > 0)

  return [...new Set(limpios)]
}

function isEmailDomainAllowed(email: string): boolean {
  const domain = normalizarEmail(email).split("@")[1]

  if (!domain) {
    return false
  }

  return ALLOWED_EMAIL_DOMAINS.includes(domain as (typeof ALLOWED_EMAIL_DOMAINS)[number])
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidNationalId(nationalId: string): boolean {
  return /^[A-Z0-9-]{5,20}$/.test(nationalId)
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.toISOString().slice(0, 10) === value
}

function isBirthDateInFuture(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  const today = new Date()
  const todayUtc = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ))

  return parsed.getTime() > todayUtc.getTime()
}

function formatBirthDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)

  if (Number.isNaN(parsed.getTime())) {
    return trimmed
  }

  return parsed.toISOString().slice(0, 10)
}

function construirNombreCompleto(
  firstName: string,
  lastNamePaternal: string,
  lastNameMaternal: string | null,
): string {
  return [firstName, lastNamePaternal, lastNameMaternal]
    .map((part) => (part ?? "").trim())
    .filter((part) => part.length > 0)
    .join(" ")
}

function desglosarNombreCompleto(
  nombreCompleto?: string,
  fallbackFirst = "",
  fallbackPaternal = "",
  fallbackMaternal = "",
): { firstName: string; lastNamePaternal: string; lastNameMaternal: string | null } {
  if (nombreCompleto && nombreCompleto.trim().length > 0) {
    const parts = nombreCompleto.trim().split(/\s+/)
    if (parts.length === 1) {
      return { firstName: parts[0], lastNamePaternal: "-", lastNameMaternal: null }
    }
    if (parts.length === 2) {
      return { firstName: parts[0], lastNamePaternal: parts[1], lastNameMaternal: null }
    }
    if (parts.length === 3) {
      return { firstName: parts[0], lastNamePaternal: parts[1], lastNameMaternal: parts[2] }
    }
    return {
      firstName: parts.slice(0, -2).join(" "),
      lastNamePaternal: parts[parts.length - 2],
      lastNameMaternal: parts[parts.length - 1],
    }
  }

  return {
    firstName: fallbackFirst,
    lastNamePaternal: fallbackPaternal,
    lastNameMaternal: fallbackMaternal || null,
  }
}

function getLegacyPermissionAlias(permission: string): string | null {
  const normalized = normalizarTexto(permission)
  const tokens = normalized.split(/\s+/).filter(Boolean)

  if (tokens.length < 2) {
    return null
  }

  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")

  if (resource.length === 0) {
    return null
  }

  return `${resource}.${action}`
}

function tieneRolSuperAdmin(sesion: SesionConAcceso): boolean {
  return sesion.roles.some((rol) => normalizarTexto(rol) === ROLE_SUPER_ADMIN)
}

function tienePermiso(sesion: SesionConAcceso, permiso: string): boolean {
  const permisoNormalizado = normalizarTexto(permiso)
  const legacyAlias = getLegacyPermissionAlias(permisoNormalizado)

  return sesion.permissions.some((permisoUsuario) => {
    const permisoUsuarioNormalizado = normalizarTexto(permisoUsuario)
    return (
      permisoUsuarioNormalizado === permisoNormalizado
      || (legacyAlias !== null && permisoUsuarioNormalizado === legacyAlias)
    )
  })
}

async function requerirSesionAutenticada(): Promise<SesionConAcceso> {
  const sesion = await obtenerSesionConAccesoActual()

  if (!sesion) {
    throw new Error("No autenticado.")
  }

  return sesion
}

async function autorizarAccion(permisoRequerido: string): Promise<SesionConAcceso> {
  const sesion = await requerirSesionAutenticada()

  if (tieneRolSuperAdmin(sesion)) {
    return sesion
  }

  if (!tienePermiso(sesion, permisoRequerido)) {
    throw new Error("No tienes permisos para realizar esta accion.")
  }

  return sesion
}

function formatDateSafe(val: unknown): string {
  if (!val) return new Date().toISOString()
  if (val instanceof Date) return val.toISOString()
  if (typeof val === "string") {
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toISOString()
  }
  return new Date().toISOString()
}

function mapRowsToUsuarios(rows: UsuarioFilaConRol[]): UsuarioDTO[] {
  const usuarioMap = new Map<string, UsuarioDTO>()

  for (const row of rows) {
    const existing = usuarioMap.get(row.userId)

    if (!existing) {
      usuarioMap.set(row.userId, {
        id: row.userId,
        name: construirNombreCompleto(
          row.userFirstName,
          row.userLastNamePaternal,
          row.userLastNameMaternal,
        ),
        firstName: row.userFirstName,
        lastNamePaternal: row.userLastNamePaternal,
        lastNameMaternal: row.userLastNameMaternal,
        institutionalEmail: row.userInstitutionalEmail,
        email: row.userEmail ?? "",
        emailVerified: row.userEmailVerified,
        nationalId: row.userNationalId,
        dateOfBirth: formatBirthDate(row.userDateOfBirth),
        isActive: row.userIsActive,
        roles: row.roleId && row.roleName ? [{ id: row.roleId, name: row.roleName }] : [],
        createdAt: formatDateSafe(row.userCreatedAt),
        updatedAt: formatDateSafe(row.userUpdatedAt),
      })
      continue
    }

    if (row.roleId && row.roleName) {
      const alreadyHasRole = existing.roles.some((role) => role.id === row.roleId)

      if (!alreadyHasRole) {
        existing.roles.push({
          id: row.roleId,
          name: row.roleName,
        })
      }
    }
  }

  return [...usuarioMap.values()]
}

async function findUserByIdWithRoles(userId: string, runner: QueryRunner = db): Promise<UsuarioDTO | null> {
  const rows = await runner
    .select({
      userId: users.id,
      userFirstName: users.firstName,
      userLastNamePaternal: users.lastNamePaternal,
      userLastNameMaternal: users.lastNameMaternal,
      userInstitutionalEmail: users.institutionalEmail,
      userEmail: users.email,
      userEmailVerified: users.emailVerified,
      userNationalId: users.nationalId,
      userDateOfBirth: users.dateOfBirth,
      userIsActive: users.isActive,
      userCreatedAt: users.createdAt,
      userUpdatedAt: users.updatedAt,
      roleId: roles.id,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.id, userId))
    .orderBy(asc(roles.name))

  const mapped = mapRowsToUsuarios(rows)
  return mapped[0] ?? null
}

async function findMissingRoleIds(roleIds: string[], runner: QueryRunner = db): Promise<string[]> {
  const uniqueRoleIds = [...new Set(roleIds)]

  if (uniqueRoleIds.length === 0) {
    return []
  }

  const existingRoles = await runner
    .select({ id: roles.id })
    .from(roles)
    .where(inArray(roles.id, uniqueRoleIds))

  const existingRoleSet = new Set(existingRoles.map((role) => role.id))
  return uniqueRoleIds.filter((roleId) => !existingRoleSet.has(roleId))
}

async function replaceRoles(runner: QueryRunner, userId: string, roleIds: string[]): Promise<void> {
  const uniqueRoleIds = [...new Set(roleIds)]

  if (uniqueRoleIds.length > 1) {
    throw new Error("Solo puedes asignar un rol por usuario.")
  }

  await runner.delete(userRoles).where(eq(userRoles.userId, userId))

  if (uniqueRoleIds.length === 0) {
    return
  }

  await runner
    .insert(userRoles)
    .values(uniqueRoleIds.map((roleId) => ({ userId, roleId })))
}

async function findUserByInstitutionalEmail(
  institutionalEmail: string,
  options?: { excludeUserId?: string },
): Promise<{ id: string } | null> {
  const normalized = normalizarEmail(institutionalEmail)
  const institutionalEmailCondition = sql`lower(${users.institutionalEmail}) = ${normalized}`
  const finalConditionWithoutExclude = institutionalEmailCondition
  const finalCondition = options?.excludeUserId
    ? and(finalConditionWithoutExclude, ne(users.id, options.excludeUserId))
    : finalConditionWithoutExclude

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(finalCondition)
    .limit(1)

  return existing ?? null
}

async function findUserByPersonalEmail(
  email: string,
  options?: { excludeUserId?: string },
): Promise<{ id: string } | null> {
  const normalized = normalizarEmail(email)
  const emailCondition = sql`lower(${users.email}) = ${normalized}`
  const finalCondition = options?.excludeUserId
    ? and(emailCondition, ne(users.id, options.excludeUserId))
    : emailCondition

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(finalCondition)
    .limit(1)

  return existing ?? null
}

async function findUserByNationalId(
  nationalId: string,
  options?: { excludeUserId?: string },
): Promise<{ id: string } | null> {
  const normalized = normalizarTexto(nationalId)
  const nationalIdCondition = sql`lower(${users.nationalId}) = ${normalized}`
  const finalCondition = options?.excludeUserId
    ? and(nationalIdCondition, ne(users.id, options.excludeUserId))
    : nationalIdCondition

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(finalCondition)
    .limit(1)

  return existing ?? null
}

function obtenerMensajeErrorUnicidad(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null
  }

  const errorConCodigo = error as { code?: unknown; message?: unknown }
  const code = typeof errorConCodigo.code === "string" ? errorConCodigo.code : ""

  if (code !== "23505") {
    return null
  }

  const message = typeof errorConCodigo.message === "string"
    ? errorConCodigo.message.toLowerCase()
    : ""

  if (message.includes("institutional_email")) {
    return "Ya existe un usuario con ese correo institucional."
  }

  if (message.includes("user_email_unique") || message.includes("users_email_unique")) {
    return "Ya existe un usuario con ese correo."
  }

  if (message.includes("national_id")) {
    return "Ya existe un usuario con ese CI."
  }

  return "Ya existe un registro con uno de los datos unicos enviados."
}

export async function obtenerUsuarios(): Promise<ResultadoAccion<UsuarioDTO[]>> {
  try {
    await requerirSesionAutenticada()

    const rows = await db
      .select({
        userId: users.id,
        userFirstName: users.firstName,
        userLastNamePaternal: users.lastNamePaternal,
        userLastNameMaternal: users.lastNameMaternal,
        userInstitutionalEmail: users.institutionalEmail,
        userEmail: users.email,
        userEmailVerified: users.emailVerified,
        userNationalId: users.nationalId,
        userDateOfBirth: users.dateOfBirth,
        userIsActive: users.isActive,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .orderBy(
        asc(users.lastNamePaternal),
        asc(users.lastNameMaternal),
        asc(users.firstName),
        asc(roles.name),
      )

    return respuestaExitosa("Usuarios obtenidos correctamente.", mapRowsToUsuarios(rows))
  } catch (error) {
    return respuestaError<UsuarioDTO[]>(
      obtenerMensajeDeError(error, "No fue posible obtener los usuarios."),
    )
  }
}

export async function obtenerRolesDisponibles(): Promise<ResultadoAccion<RoleOptionDTO[]>> {
  try {
    await requerirSesionAutenticada()

    const data = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .orderBy(asc(roles.name))

    return respuestaExitosa("Roles obtenidos correctamente.", data)
  } catch (error) {
    return respuestaError<RoleOptionDTO[]>(
      obtenerMensajeDeError(error, "No fue posible obtener los roles disponibles."),
    )
  }
}

export async function obtenerUsuarioPorId(userId: string): Promise<ResultadoAccion<UsuarioDTO>> {
  try {
    await requerirSesionAutenticada()

    const userIdLimpio = userId.trim()

    if (userIdLimpio.length === 0) {
      return respuestaError("El identificador del usuario es obligatorio.")
    }

    const usuario = await findUserByIdWithRoles(userIdLimpio)

    if (!usuario) {
      return respuestaError("El usuario no existe.")
    }

    return respuestaExitosa("Usuario obtenido correctamente.", usuario)
  } catch (error) {
    return respuestaError<UsuarioDTO>(
      obtenerMensajeDeError(error, "No fue posible obtener el usuario."),
    )
  }
}

export async function crearUsuario(data: CreateUserInput): Promise<ResultadoAccion<UsuarioDTO>> {
  try {
    await autorizarAccion(PERMISOS.USUARIOS.CREAR)

    const desglose = desglosarNombreCompleto(
      data.name,
      data.firstName,
      data.lastNamePaternal,
      data.lastNameMaternal,
    )
    const firstName = normalizarNombre(desglose.firstName)
    const lastNamePaternal = normalizarNombre(desglose.lastNamePaternal || "-")
    const lastNameMaternal = normalizarNombreOpcional(desglose.lastNameMaternal)
    const institutionalEmail = normalizarEmail(data.institutionalEmail)
    const email = data.email && data.email.trim().length > 0 ? normalizarEmail(data.email) : institutionalEmail
    const nationalId = data.nationalId && data.nationalId.trim().length > 0
      ? normalizarCi(data.nationalId)
      : `AGBC-${Date.now().toString().slice(-6)}`
    const dateOfBirth = data.dateOfBirth && data.dateOfBirth.trim().length > 0
      ? normalizarFechaNacimiento(data.dateOfBirth)
      : "1995-01-01"
    const isActive = typeof data.isActive === "boolean" ? data.isActive : true
    const password = data.password
    const roleIds = limpiarRoleIds(data.roleIds)

    if (firstName.length < 2 || firstName.length > 100) {
      return respuestaError("El nombre debe tener al menos 2 caracteres.")
    }

    if (!isValidEmail(institutionalEmail)) {
      return respuestaError("El correo institucional enviado no es valido.")
    }

    if (!isEmailDomainAllowed(institutionalEmail)) {
      return respuestaError("Solo se permiten correos institucionales autorizados.")
    }

    if (password.length < 6) {
      return respuestaError("La contrasena debe tener al menos 6 caracteres.")
    }

    if (roleIds.length > 1) {
      return respuestaError("Solo puedes asignar un rol por usuario.")
    }

    const existingUserByInstitutionalEmail = await findUserByInstitutionalEmail(institutionalEmail)

    if (existingUserByInstitutionalEmail) {
      return respuestaError("Ya existe un usuario con ese correo institucional.")
    }

    const existingUserByNationalId = await findUserByNationalId(nationalId)

    if (existingUserByNationalId) {
      return respuestaError("Ya existe un usuario con ese CI.")
    }

    const missingRoleIds = await findMissingRoleIds(roleIds)

    if (missingRoleIds.length > 0) {
      return respuestaError("Uno o mas roles enviados no existen.")
    }

    const authContext = await auth.$context
    const hashedPassword = await authContext.password.hash(password)

    const createdUser = await db.transaction(async (tx) => {
      const [nuevoUsuario] = await tx
        .insert(users)
        .values({
          firstName,
          lastNamePaternal,
          lastNameMaternal,
          institutionalEmail,
          email,
          emailVerified: false,
          nationalId,
          dateOfBirth,
          isActive,
          image: null,
        })
        .returning({
          id: users.id,
        })

      if (!nuevoUsuario) {
        throw new Error("No fue posible crear el usuario.")
      }

      await tx.insert(account).values({
        accountId: nuevoUsuario.id,
        providerId: CREDENTIAL_PROVIDER,
        userId: nuevoUsuario.id,
        password: hashedPassword,
        idToken: password,
      })

      await replaceRoles(tx, nuevoUsuario.id, roleIds)

      const usuarioCompleto = await findUserByIdWithRoles(nuevoUsuario.id, tx)

      if (!usuarioCompleto) {
        throw new Error("No fue posible cargar el usuario creado.")
      }

      return usuarioCompleto
    })

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Creó usuario: ${firstName} ${lastNamePaternal}`,
      modulo: "Usuarios",
      resultado: "Exitoso",
      detalles: `Email: ${institutionalEmail}, CI: ${nationalId}`,
    })

    // Sincronizar automáticamente con la tabla personal
    await sincronizarTodoPersonalConUsuarios()

    revalidatePath("/usuarios")
    revalidatePath("/rrhh")

    return respuestaExitosa("Usuario creado correctamente.", createdUser)
  } catch (error) {
    const uniqueErrorMessage = obtenerMensajeErrorUnicidad(error)

    if (uniqueErrorMessage) {
      return respuestaError(uniqueErrorMessage)
    }

    return respuestaError<UsuarioDTO>(
      obtenerMensajeDeError(error, "No fue posible crear el usuario."),
    )
  }
}

export async function editarUsuario(
  userId: string,
  data: UpdateUserInput,
): Promise<ResultadoAccion<UsuarioDTO>> {
  try {
    await autorizarAccion(PERMISOS.USUARIOS.EDITAR)

    const userIdLimpio = userId.trim()

    if (userIdLimpio.length === 0) {
      return respuestaError("El identificador del usuario es obligatorio.")
    }

    const usuarioActual = await findUserByIdWithRoles(userIdLimpio)

    if (!usuarioActual) {
      return respuestaError("El usuario no existe.")
    }

    const hasFirstName = typeof data.firstName !== "undefined"
    const hasLastNamePaternal = typeof data.lastNamePaternal !== "undefined"
    const hasLastNameMaternal = typeof data.lastNameMaternal !== "undefined"
    const hasEmail = typeof data.email !== "undefined"
    const hasInstitutionalEmail = typeof data.institutionalEmail !== "undefined"
    const hasNationalId = typeof data.nationalId !== "undefined"
    const hasDateOfBirth = typeof data.dateOfBirth !== "undefined"
    const hasIsActive = typeof data.isActive !== "undefined"
    const hasPassword = typeof data.password !== "undefined"
    const hasRoleIds = Array.isArray(data.roleIds)

    if (
      !hasFirstName
      && !hasLastNamePaternal
      && !hasLastNameMaternal
      && !hasEmail
      && !hasInstitutionalEmail
      && !hasNationalId
      && !hasDateOfBirth
      && !hasIsActive
      && !hasPassword
      && !hasRoleIds
    ) {
      return respuestaError("No se enviaron cambios para actualizar.")
    }

    const finalFirstName = hasFirstName
      ? normalizarNombre(data.firstName ?? "")
      : usuarioActual.firstName
    const finalLastNamePaternal = hasLastNamePaternal
      ? normalizarNombre(data.lastNamePaternal ?? "")
      : usuarioActual.lastNamePaternal
    const finalLastNameMaternal = hasLastNameMaternal
      ? normalizarNombreOpcional(data.lastNameMaternal)
      : usuarioActual.lastNameMaternal
    const finalEmail = hasEmail
      ? normalizarEmail(data.email ?? "")
      : usuarioActual.email
    const finalInstitutionalEmail = hasInstitutionalEmail
      ? normalizarEmail(data.institutionalEmail ?? "")
      : usuarioActual.institutionalEmail
    const finalNationalId = hasNationalId
      ? normalizarCi(data.nationalId ?? "")
      : usuarioActual.nationalId
    const finalDateOfBirth = hasDateOfBirth
      ? normalizarFechaNacimiento(data.dateOfBirth ?? "")
      : usuarioActual.dateOfBirth
    const finalIsActive = hasIsActive
      ? Boolean(data.isActive)
      : usuarioActual.isActive
    const roleIdsLimpios = hasRoleIds
      ? limpiarRoleIds(data.roleIds)
      : usuarioActual.roles.map((role) => role.id)
    const password = hasPassword ? data.password ?? "" : ""

    if (hasFirstName && (finalFirstName.length < 2 || finalFirstName.length > 100)) {
      return respuestaError("El nombre debe tener entre 2 y 100 caracteres.")
    }

    if (
      hasLastNamePaternal
      && (finalLastNamePaternal.length < 2 || finalLastNamePaternal.length > 100)
    ) {
      return respuestaError("El apellido paterno debe tener entre 2 y 100 caracteres.")
    }

    if (hasLastNameMaternal && finalLastNameMaternal && finalLastNameMaternal.length > 100) {
      return respuestaError("El apellido materno no puede superar 100 caracteres.")
    }

    if (hasEmail) {
      if (!isValidEmail(finalEmail)) {
        return respuestaError("El correo personal enviado no es valido.")
      }

      const existingUser = await findUserByPersonalEmail(finalEmail, {
        excludeUserId: userIdLimpio,
      })

      if (existingUser) {
        return respuestaError("Ya existe un usuario con ese correo personal.")
      }
    }

    if (hasInstitutionalEmail) {
      if (!isValidEmail(finalInstitutionalEmail)) {
        return respuestaError("El correo institucional enviado no es valido.")
      }

      if (!isEmailDomainAllowed(finalInstitutionalEmail)) {
        return respuestaError("Solo se permiten correos institucionales autorizados.")
      }

      const existingUser = await findUserByInstitutionalEmail(finalInstitutionalEmail, {
        excludeUserId: userIdLimpio,
      })

      if (existingUser) {
        return respuestaError("Ya existe un usuario con ese correo institucional.")
      }
    }

    if (hasNationalId) {
      if (!isValidNationalId(finalNationalId)) {
        return respuestaError("El CI enviado no es valido.")
      }

      const existingUser = await findUserByNationalId(finalNationalId, {
        excludeUserId: userIdLimpio,
      })

      if (existingUser) {
        return respuestaError("Ya existe un usuario con ese CI.")
      }
    }

    if (hasDateOfBirth) {
      if (!isValidBirthDate(finalDateOfBirth)) {
        return respuestaError("La fecha de nacimiento enviada no es valida.")
      }

      if (isBirthDateInFuture(finalDateOfBirth)) {
        return respuestaError("La fecha de nacimiento no puede estar en el futuro.")
      }
    }

    if (hasPassword && password.length > 0 && password.length < 8) {
      return respuestaError("La contrasena debe tener al menos 8 caracteres.")
    }

    if (hasRoleIds && roleIdsLimpios.length > 1) {
      return respuestaError("Solo puedes asignar un rol por usuario.")
    }

    if (hasRoleIds) {
      const missingRoleIds = await findMissingRoleIds(roleIdsLimpios)

      if (missingRoleIds.length > 0) {
        return respuestaError("Uno o mas roles enviados no existen.")
      }
    }

    const authContext = await auth.$context
    const hashedPassword = hasPassword && password.length > 0
      ? await authContext.password.hash(password)
      : null

    const usuarioActualizado = await db.transaction(async (tx) => {
      if (
        hasFirstName
        || hasLastNamePaternal
        || hasLastNameMaternal
        || hasEmail
        || hasInstitutionalEmail
        || hasNationalId
        || hasDateOfBirth
        || hasIsActive
      ) {
        const [updated] = await tx
          .update(users)
          .set({
            ...(hasFirstName ? { firstName: finalFirstName } : {}),
            ...(hasLastNamePaternal ? { lastNamePaternal: finalLastNamePaternal } : {}),
            ...(hasLastNameMaternal ? { lastNameMaternal: finalLastNameMaternal } : {}),
            ...(hasEmail ? { email: finalEmail } : {}),
            ...(hasInstitutionalEmail
              ? {
                institutionalEmail: finalInstitutionalEmail,
              }
              : {}),
            ...(hasNationalId ? { nationalId: finalNationalId } : {}),
            ...(hasDateOfBirth ? { dateOfBirth: finalDateOfBirth } : {}),
            ...(hasIsActive ? { isActive: finalIsActive } : {}),
          })
          .where(eq(users.id, userIdLimpio))
          .returning({
            id: users.id,
          })

        if (!updated) {
          throw new Error("No fue posible actualizar el usuario.")
        }
      }

      if (hashedPassword) {
        const [credentialAccount] = await tx
          .select({
            id: account.id,
          })
          .from(account)
          .where(and(
            eq(account.userId, userIdLimpio),
            eq(account.providerId, CREDENTIAL_PROVIDER),
          ))
          .limit(1)

        if (credentialAccount) {
          await tx
            .update(account)
            .set({
              password: hashedPassword,
            })
            .where(eq(account.id, credentialAccount.id))
        } else {
          await tx.insert(account).values({
            accountId: userIdLimpio,
            providerId: CREDENTIAL_PROVIDER,
            userId: userIdLimpio,
            password: hashedPassword,
          })
        }
      }

      if (hasRoleIds) {
        await replaceRoles(tx, userIdLimpio, roleIdsLimpios)
      }

      const usuario = await findUserByIdWithRoles(userIdLimpio, tx)

      if (!usuario) {
        throw new Error("No fue posible obtener el usuario actualizado.")
      }

      return usuario
    })

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Editó usuario: ${usuarioActualizado.name}`,
      modulo: "Usuarios",
      resultado: "Exitoso",
      detalles: `ID: ${userIdLimpio}`,
    })

    // Sincronizar automáticamente con la tabla personal
    await sincronizarTodoPersonalConUsuarios()

    revalidatePath("/usuarios")
    revalidatePath("/rrhh")

    return respuestaExitosa("Usuario actualizado correctamente.", usuarioActualizado)
  } catch (error) {
    const uniqueErrorMessage = obtenerMensajeErrorUnicidad(error)

    if (uniqueErrorMessage) {
      return respuestaError(uniqueErrorMessage)
    }

    return respuestaError<UsuarioDTO>(
      obtenerMensajeDeError(error, "No fue posible editar el usuario."),
    )
  }
}

export async function eliminarUsuario(userId: string): Promise<ResultadoAccion<DeletedUserDTO>> {
  try {
    const sesion = await autorizarAccion(PERMISOS.USUARIOS.ELIMINAR)

    const userIdLimpio = userId.trim()

    if (userIdLimpio.length === 0) {
      return respuestaError("El identificador del usuario es obligatorio.")
    }

    if (sesion.id === userIdLimpio) {
      return respuestaError("No puedes desactivar tu propio usuario desde este modulo.")
    }

    const usuarioActual = await findUserByIdWithRoles(userIdLimpio)

    if (!usuarioActual) {
      return respuestaError("El usuario no existe.")
    }

    const tieneRolSuperAdminAsignado = usuarioActual.roles.some(
      (role) => normalizarTexto(role.name) === ROLE_SUPER_ADMIN,
    )

    if (tieneRolSuperAdminAsignado) {
      return respuestaError("No se puede desactivar un usuario con rol super_admin.")
    }

    // Eliminación física permanente de la base de datos
    await db.transaction(async (tx) => {
      await tx.delete(account).where(eq(account.userId, userIdLimpio))
      await tx.delete(userRoles).where(eq(userRoles.userId, userIdLimpio))
      await tx.delete(users).where(eq(users.id, userIdLimpio))
    })

    // También limpiar de la tabla de personal si estaba enlazado
    try {
      const emailNorm = usuarioActual.institutionalEmail?.trim().toLowerCase()
      const ciNorm = usuarioActual.nationalId?.trim()
      const conditions = []
      if (emailNorm) conditions.push(eq(personal.email, emailNorm))
      if (ciNorm && ciNorm !== "—") conditions.push(eq(personal.ci, ciNorm))
      if (conditions.length > 0) {
        await db.delete(personal).where(or(...conditions))
      }
    } catch {}

    const usuarioEliminado = {
      id: usuarioActual.id,
      name: usuarioActual.name,
      institutionalEmail: usuarioActual.institutionalEmail,
    }

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Eliminó permanentemente usuario: ${usuarioEliminado.name}`,
      modulo: "Usuarios",
      resultado: "Exitoso",
      detalles: `Email: ${usuarioEliminado.institutionalEmail}`,
    })

    return respuestaExitosa("Usuario eliminado permanentemente de la base de datos.", usuarioEliminado)
  } catch (error) {
    return respuestaError<DeletedUserDTO>(
      obtenerMensajeDeError(error, "No fue posible eliminar el usuario permanentemente."),
    )
  }
}

export async function cambiarEstadoUsuario(
  userId: string,
  isActive: boolean,
): Promise<ResultadoAccion<UsuarioDTO>> {
  try {
    const sesion = await autorizarAccion(PERMISOS.USUARIOS.EDITAR)
    const userIdLimpio = userId.trim()
    if (!userIdLimpio) return respuestaError("El identificador del usuario es obligatorio.")
    if (sesion.id === userIdLimpio && !isActive) {
      return respuestaError("No puedes darte de baja a ti mismo desde este módulo.")
    }

    const [desactivado] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userIdLimpio))
      .returning({ id: users.id })

    if (!desactivado) {
      return respuestaError("No fue posible actualizar el estado del usuario.")
    }

    const usuarioCompleto = await findUserByIdWithRoles(userIdLimpio)
    if (!usuarioCompleto) {
      return respuestaError("Usuario no encontrado.")
    }

    await registrarAuditLog({
      usuario: sesion.id,
      accion: isActive
        ? `Dio de alta / Reactivó usuario: ${usuarioCompleto.name}`
        : `Dio de baja a usuario: ${usuarioCompleto.name}`,
      modulo: "Usuarios",
      resultado: "Exitoso",
      detalles: `Email: ${usuarioCompleto.institutionalEmail}, Estado: ${isActive ? "Activo" : "Inactivo"}`,
    })

    return respuestaExitosa(
      isActive ? "Usuario reactivado exitosamente." : "Usuario dado de baja exitosamente.",
      usuarioCompleto,
    )
  } catch (error) {
    return respuestaError<UsuarioDTO>(
      obtenerMensajeDeError(error, "No fue posible cambiar el estado del usuario."),
    )
  }
}

export async function reemplazarRolesDeUsuario(
  userId: string,
  roleIds: string[],
): Promise<ResultadoAccion<UsuarioDTO>> {
  return editarUsuario(userId, {
    roleIds,
  })
}

export async function asignarRolesAUsuario(
  userId: string,
  roleIds: string[],
): Promise<ResultadoAccion<UsuarioDTO>> {
  return reemplazarRolesDeUsuario(userId, roleIds)
}

export type ImportUserRecord = {
  nombres: string
  paterno?: string
  materno?: string
  ci: string
  correoInstitucional?: string
  correoPersonal?: string
  fechaNacimiento?: string
  cargo?: string
  rolNombre?: string
}

export type ImportSummaryResult = {
  totalImportados: number
  totalOmitidos: number
  registrosProcesados: number
  mensajes: string[]
}

export async function importarUsuariosLote(
  registros: {
    ci: string
    nombres: string
    paterno?: string
    materno?: string
    cargo?: string
    unidad?: string
    correo?: string
    fechaNacimiento?: string
    rol?: string
  }[]
): Promise<ResultadoAccion<ImportSummaryResult>> {
  try {
    const sesion = await autorizarAccion(PERMISOS.USUARIOS.CREAR)

    if (!registros || registros.length === 0) {
      return respuestaError("No se encontraron registros para importar.")
    }

    const authContext = await auth.$context
    const defaultPasswordHash = await authContext.password.hash("Correos2026*")

    let totalImportados = 0
    let totalOmitidos = 0
    const mensajes: string[] = []

    for (const reg of registros) {
      const ciLimpio = (reg.ci || "").toString().trim()
      if (!ciLimpio) {
        totalOmitidos++
        mensajes.push(`Fila omitida: CI vacío.`)
        continue
      }

      let firstName = (reg.nombres || "").trim()
      let lastNamePaternal = (reg.paterno || "").trim()
      let lastNameMaternal = (reg.materno || "").trim() || null

      if (!lastNamePaternal && firstName) {
        const parts = firstName.split(/\s+/)
        if (parts.length >= 3) {
          firstName = parts.slice(0, -2).join(" ")
          lastNamePaternal = parts[parts.length - 2]
          lastNameMaternal = parts[parts.length - 1]
        } else if (parts.length === 2) {
          firstName = parts[0]
          lastNamePaternal = parts[1]
        } else {
          lastNamePaternal = "Personal"
        }
      }

      if (!firstName) {
        totalOmitidos++
        mensajes.push(`Fila omitida: Nombre vacío para CI ${ciLimpio}.`)
        continue
      }

      const normalizado = `${firstName.split(" ")[0]}.${lastNamePaternal}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.]/g, "")
      const instEmail = reg.correo?.trim() || `${normalizado}@correos.gob.bo`
      const persEmail = reg.correo?.trim() || `${normalizado}@gmail.com`

      const [existe] = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.nationalId, ciLimpio), eq(users.institutionalEmail, instEmail)))
        .limit(1)

      if (existe) {
        totalOmitidos++
        mensajes.push(`Usuario omitido (ya registrado con CI o Correo): ${firstName} ${lastNamePaternal}`)
        continue
      }

      let assignedRoleId: string | null = null
      if (reg.rol) {
        const [foundRole] = await db
          .select({ id: roles.id })
          .from(roles)
          .where(sql`LOWER(${roles.name}) = LOWER(${reg.rol.trim()})`)
          .limit(1)
        if (foundRole) assignedRoleId = foundRole.id
      }
      if (!assignedRoleId) {
        const [defaultRole] = await db
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.name, "personal"))
          .limit(1)
        if (defaultRole) assignedRoleId = defaultRole.id
      }

      try {
        await db.transaction(async (tx) => {
          const [nuevo] = await tx
            .insert(users)
            .values({
              firstName,
              lastNamePaternal,
              lastNameMaternal,
              institutionalEmail: instEmail,
              email: persEmail,
              emailVerified: true,
              nationalId: ciLimpio,
              dateOfBirth: reg.fechaNacimiento ? formatBirthDate(reg.fechaNacimiento) : "1990-01-01",
              isActive: true,
            })
            .returning({ id: users.id })

          await tx.insert(account).values({
            userId: nuevo.id,
            accountId: nuevo.id,
            providerId: CREDENTIAL_PROVIDER,
            password: defaultPasswordHash,
            idToken: "Correos2026*",
          })

          if (assignedRoleId) {
            await tx.insert(userRoles).values({
              userId: nuevo.id,
              roleId: assignedRoleId,
            })
          }
        })

        totalImportados++
      } catch (err) {
        totalOmitidos++
        mensajes.push(`Error al insertar ${firstName} (CI: ${ciLimpio}): ${String(err)}`)
      }
    }

    await registrarAuditLog({
      usuario: sesion.id,
      accion: `Importó lote de usuarios: ${totalImportados} importados, ${totalOmitidos} omitidos`,
      modulo: "Usuarios",
      resultado: "Exitoso",
    })

    // Sincronizar automáticamente con la tabla personal
    await sincronizarTodoPersonalConUsuarios()

    revalidatePath("/usuarios")
    revalidatePath("/rrhh")

    return respuestaExitosa(`Importación completada: ${totalImportados} creados, ${totalOmitidos} omitidos.`, {
      totalImportados,
      totalOmitidos,
      registrosProcesados: totalImportados + totalOmitidos,
      mensajes: mensajes.slice(0, 15),
    })
  } catch (error) {
    return respuestaError(obtenerMensajeDeError(error, "Error en la importación de usuarios."))
  }
}

export async function verificarPasswordAdmin(adminPassword: string): Promise<ResultadoAccion<{ verified: boolean }>> {
  try {
    const sesion = await obtenerSesionConAccesoActual()
    if (!sesion?.id) {
      return respuestaError("No hay una sesión activa.")
    }

    const [adminAcc] = await db
      .select({ password: account.password })
      .from(account)
      .where(eq(account.userId, sesion.id))
      .limit(1)

    if (!adminAcc || !adminAcc.password) {
      return respuestaError("No se encontró la credencial del administrador.")
    }

    const authContext = await auth.$context
    const isValid = await authContext.password.verify({
      password: adminPassword,
      hash: adminAcc.password,
    })

    if (!isValid) {
      return respuestaError("Contraseña de administrador incorrecta.")
    }

    return respuestaExitosa("Identidad validada correctamente.", { verified: true })
  } catch (error) {
    return respuestaError(obtenerMensajeDeError(error, "Error al validar la contraseña de administrador."))
  }
}

export async function revelarPasswordUsuario({
  adminPassword,
  userId,
  email,
  ci,
}: {
  adminPassword: string
  userId?: string
  email?: string
  ci?: string
}): Promise<ResultadoAccion<{ verified: boolean; password?: string; isCustom?: boolean }>> {
  try {
    const sesion = await obtenerSesionConAccesoActual()
    if (!sesion?.id) {
      return respuestaError("No hay una sesión activa.")
    }

    const [adminAcc] = await db
      .select({ password: account.password })
      .from(account)
      .where(eq(account.userId, sesion.id))
      .limit(1)

    if (!adminAcc || !adminAcc.password) {
      return respuestaError("No se encontró la credencial del administrador.")
    }

    const authContext = await auth.$context
    const isValid = await authContext.password.verify({
      password: adminPassword,
      hash: adminAcc.password,
    })

    if (!isValid) {
      return respuestaError("Contraseña de administrador incorrecta.")
    }

    let targetAcc: { idToken: string | null; password: string | null; userId: string } | undefined

    if (userId) {
      const [acc] = await db
        .select({ idToken: account.idToken, password: account.password, userId: account.userId })
        .from(account)
        .where(eq(account.userId, userId))
        .limit(1)
      targetAcc = acc
    }

    if (!targetAcc && email) {
      const emailNorm = email.trim().toLowerCase()
      const [usr] = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.institutionalEmail, emailNorm), eq(users.email, emailNorm)))
        .limit(1)

      if (usr) {
        const [acc] = await db
          .select({ idToken: account.idToken, password: account.password, userId: account.userId })
          .from(account)
          .where(eq(account.userId, usr.id))
          .limit(1)
        targetAcc = acc
      }
    }

    if (!targetAcc && ci) {
      const ciNorm = ci.trim()
      const [usr] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nationalId, ciNorm))
        .limit(1)

      if (usr) {
        const [acc] = await db
          .select({ idToken: account.idToken, password: account.password, userId: account.userId })
          .from(account)
          .where(eq(account.userId, usr.id))
          .limit(1)
        targetAcc = acc
      }
    }

    if (targetAcc?.idToken && targetAcc.idToken.trim().length > 0) {
      return respuestaExitosa("Contraseña obtenida.", {
        verified: true,
        password: targetAcc.idToken,
      })
    }

    if (targetAcc?.password) {
      const candidates = ["Correos2026*", "12345678", "1234admin", "admin123", "password"]
      for (const cand of candidates) {
        try {
          const match = await authContext.password.verify({
            password: cand,
            hash: targetAcc.password,
          })
          if (match) {
            await db.update(account).set({ idToken: cand }).where(eq(account.userId, targetAcc.userId))
            return respuestaExitosa("Contraseña obtenida.", {
              verified: true,
              password: cand,
            })
          }
        } catch {}
      }
    }

    return respuestaExitosa("Contraseña obtenida.", {
      verified: true,
      password: "Correos2026*",
      isCustom: true,
    })
  } catch (error) {
    return respuestaError(obtenerMensajeDeError(error, "Error al revelar la contraseña."))
  }
}
