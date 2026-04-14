import { z } from "zod"

const ALLOWED_DOMAINS = ["correos.gob.bo", "agbc.gob.bo", "gmail.com"]

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresa un correo valido.")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase()
        return domain && ALLOWED_DOMAINS.includes(domain)
      },
      "Solo se permiten correos institucionales (@correos.gob.bo)."
    ),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
})

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres."),
    email: z
      .string()
      .trim()
      .email("Ingresa un correo valido.")
      .refine(
        (email) => {
          const domain = email.split("@")[1]?.toLowerCase()
          return domain && ALLOWED_DOMAINS.includes(domain)
        },
        "Solo se permiten correos institucionales (@correos.gob.bo)."
      ),
    password: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "La confirmacion debe tener al menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
