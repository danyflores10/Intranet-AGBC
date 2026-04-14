import { z } from "zod"

const ALLOWED_DOMAINS = ["correos.gob.bo", "agbc.gob.bo", "gmail.com"] as const

const personalEmailSchema = z
  .string()
  .trim()
  .email("Ingresa un correo personal valido.")
  .transform((email) => email.toLowerCase())

const institutionalEmailSchema = z
  .string()
  .trim()
  .email("Ingresa un correo institucional valido.")
  .transform((email) => email.toLowerCase())
  .refine((email) => {
    const domain = email.split("@")[1]?.toLowerCase()
    return !!domain && ALLOWED_DOMAINS.includes(domain as (typeof ALLOWED_DOMAINS)[number])
  }, "Solo se permiten correos institucionales autorizados.")

const nationalIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(5, "El CI debe tener al menos 5 caracteres.")
  .max(20, "El CI no puede superar 20 caracteres.")
  .regex(/^[A-Z0-9-]+$/, "El CI solo puede incluir letras, numeros y guion.")

const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de nacimiento debe tener formato YYYY-MM-DD.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime())) {
      return false
    }

    return parsed.toISOString().slice(0, 10) === value
  }, "Ingresa una fecha de nacimiento valida.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    const today = new Date()
    const todayUtc = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    ))

    return parsed.getTime() <= todayUtc.getTime()
  }, "La fecha de nacimiento no puede estar en el futuro.")

const userBaseSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  lastNamePaternal: z
    .string()
    .trim()
    .min(2, "El apellido paterno debe tener al menos 2 caracteres.")
    .max(100, "El apellido paterno no puede superar 100 caracteres."),
  lastNameMaternal: z
    .string()
    .trim()
    .max(100, "El apellido materno no puede superar 100 caracteres.")
    .default(""),
  email: personalEmailSchema,
  institutionalEmail: institutionalEmailSchema,
  nationalId: nationalIdSchema,
  dateOfBirth: dateOfBirthSchema,
  isActive: z.boolean().default(true),
  roleIds: z
    .array(z.string().trim().min(1))
    .max(1, "Solo puedes asignar un rol por usuario.")
    .default([]),
})

export const userCreateSchema = userBaseSchema.extend({
  password: z
    .string()
    .trim()
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .max(128, "La contrasena no puede superar 128 caracteres."),
})

export const userUpdateSchema = userBaseSchema
  .extend({
    password: z
      .string()
      .trim()
      .max(128, "La contrasena no puede superar 128 caracteres.")
      .optional()
      .transform((value) => value ?? ""),
  })
  .refine((data) => data.password.length === 0 || data.password.length >= 8, {
    message: "La contrasena debe tener al menos 8 caracteres.",
    path: ["password"],
  })

export type UserCreateInput = z.input<typeof userCreateSchema>
export type UserCreateOutput = z.output<typeof userCreateSchema>

export type UserUpdateInput = z.input<typeof userUpdateSchema>
export type UserUpdateOutput = z.output<typeof userUpdateSchema>
