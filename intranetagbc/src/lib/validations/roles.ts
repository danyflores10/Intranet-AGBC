import { z } from "zod"

export const roleUpsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del rol es obligatorio.")
    .max(50, "El nombre del rol no puede superar 50 caracteres."),
  permissionIds: z.array(z.string().trim().min(1)).default([]),
})

export type RoleUpsertInput = z.input<typeof roleUpsertSchema>
export type RoleUpsertOutput = z.output<typeof roleUpsertSchema>
