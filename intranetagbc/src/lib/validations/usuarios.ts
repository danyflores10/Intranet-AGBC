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
  .optional()
  .default("")

const dateOfBirthSchema = z
  .string()
  .trim()
  .optional()
  .default("")

const userBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Ingresa el nombre completo (nombres y apellidos).")
    .max(150, "El nombre no puede superar 150 caracteres.")
    .optional(),
  firstName: z.string().trim().optional(),
  lastNamePaternal: z.string().trim().optional(),
  lastNameMaternal: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  institutionalEmail: institutionalEmailSchema,
  nationalId: nationalIdSchema,
  dateOfBirth: dateOfBirthSchema,
  isActive: z.boolean().default(true),
  roleIds: z
    .array(z.string().trim().min(1))
    .max(1, "Solo puedes asignar un rol por usuario.")
    .default([]),
})

export const userCreateSchema = userBaseSchema
  .extend({
    password: z
      .string()
      .trim()
      .min(8, "La contrasena debe tener al menos 8 caracteres.")
      .max(128, "La contrasena no puede superar 128 caracteres."),
  })
  .refine((data) => (data.name && data.name.length >= 3) || (data.firstName && data.firstName.length >= 2), {
    message: "Ingresa el nombre completo.",
    path: ["name"],
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
