"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react"

import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const emailSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido."),
})

const codeSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos."),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

type Step = "email" | "code" | "password" | "success"

export default function RecuperarContrasenaPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSendCode(values: z.infer<typeof emailSchema>) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Error al enviar el código.")
        toast.error(data.error || "Error al enviar el código.")
        return
      }
      setEmail(values.email)
      toast.success(`Código de verificación enviado a ${values.email}`)
      setStep("code")
    } catch {
      setServerError("Error de conexión. Inténtalo más tarde.")
      toast.error("Error de conexión. Inténtalo más tarde.")
    }
  }

  async function onVerifyCode(values: z.infer<typeof codeSchema>) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: values.code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Código inválido.")
        toast.error(data.error || "Código inválido.")
        return
      }
      setCode(values.code)
      toast.success("Código verificado correctamente.")
      setStep("password")
    } catch {
      setServerError("Error de conexión. Inténtalo más tarde.")
      toast.error("Error de conexión. Inténtalo más tarde.")
    }
  }

  async function onResetPassword(values: z.infer<typeof passwordSchema>) {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword: values.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || "Error al cambiar la contraseña.")
        toast.error(data.error || "Error al cambiar la contraseña.")
        return
      }
      toast.success("¡Contraseña actualizada exitosamente!")
      setStep("success")
    } catch {
      setServerError("Error de conexión. Inténtalo más tarde.")
      toast.error("Error de conexión. Inténtalo más tarde.")
    }
  }

  const steps = [
    { key: "email", label: "Correo", icon: Mail },
    { key: "code", label: "Código", icon: ShieldCheck },
    { key: "password", label: "Nueva contraseña", icon: KeyRound },
  ] as const

  const currentStepIndex = step === "success" ? 3 : steps.findIndex((s) => s.key === step)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/image/Logooriginal.png"
          alt="Correos de Bolivia"
          width={180}
          height={50}
          className="h-12 w-auto object-contain dark:hidden"
          style={{ width: "auto" }}
          priority
        />
        <Image
          src="/image/LogoAmarillo.png"
          alt="Correos de Bolivia"
          width={180}
          height={50}
          className="hidden h-12 w-auto object-contain dark:block"
          style={{ width: "auto" }}
          priority
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
        {/* Progress steps */}
        {step !== "success" && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        i <= currentStepIndex
                          ? "border-[#FFB300] bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${
                        i <= currentStepIndex ? "text-[#FFB300]" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`mx-2 mb-5 h-0.5 w-12 sm:w-16 transition-colors duration-300 ${
                        i < currentStepIndex ? "bg-[#FFB300]" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form
            noValidate
            onSubmit={emailForm.handleSubmit(onSendCode)}
            className="animate-fade-in"
          >
            <FieldGroup>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300]/10 to-[#FF8800]/10 border border-[#FFB300]/20">
                  <Mail className="h-7 w-7 text-[#FFB300]" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresa tu correo electrónico y te enviaremos un código de verificación.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="reset-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Correo electrónico
                </FieldLabel>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@correos.gob.bo"
                    autoComplete="email"
                    className="h-12 pl-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                    {...emailForm.register("email")}
                  />
                </div>
                <FieldError errors={[emailForm.formState.errors.email]} />
              </Field>

              {serverError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in">
                  {serverError}
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300"
                  disabled={emailForm.formState.isSubmitting}
                >
                  {emailForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar código
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}

        {/* Step 2: Code */}
        {step === "code" && (
          <form
            noValidate
            onSubmit={codeForm.handleSubmit(onVerifyCode)}
            className="animate-fade-in"
          >
            <FieldGroup>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300]/10 to-[#FF8800]/10 border border-[#FFB300]/20">
                  <ShieldCheck className="h-7 w-7 text-[#FFB300]" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Verifica tu código
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hemos enviado un código de 6 dígitos a{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="reset-code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código de verificación
                </FieldLabel>
                <div className="relative group">
                  <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                  <Input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="h-14 pl-11 rounded-xl border-border/60 bg-muted/30 text-center text-2xl font-bold tracking-[0.5em] transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                    {...codeForm.register("code")}
                  />
                </div>
                <FieldError errors={[codeForm.formState.errors.code]} />
              </Field>

              {serverError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in">
                  {serverError}
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300"
                  disabled={codeForm.formState.isSubmitting}
                >
                  {codeForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar código
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </Field>

              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setServerError(null)
                }}
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Cambiar correo
              </button>
            </FieldGroup>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form
            noValidate
            onSubmit={passwordForm.handleSubmit(onResetPassword)}
            className="animate-fade-in"
          >
            <FieldGroup>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300]/10 to-[#FF8800]/10 border border-[#FFB300]/20">
                  <KeyRound className="h-7 w-7 text-[#FFB300]" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Nueva contraseña
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ingresa tu nueva contraseña para{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nueva contraseña
                </FieldLabel>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                    {...passwordForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError errors={[passwordForm.formState.errors.password]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirmar contraseña
                </FieldLabel>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                    {...passwordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError errors={[passwordForm.formState.errors.confirmPassword]} />
              </Field>

              {serverError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in">
                  {serverError}
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      Cambiar contraseña
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="animate-fade-in text-center py-4">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400/10 to-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              ¡Contraseña actualizada!
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tu contraseña ha sido cambiada exitosamente.<br />
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              asChild
              className="mt-8 w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0 transition-all duration-300"
            >
              <Link href="/login">
                Ir a iniciar sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Back to login link */}
      {step !== "success" && (
        <Link
          href="/login"
          className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio de sesión
        </Link>
      )}

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Agencia Boliviana de Correos. Plataforma de uso interno.
      </p>
    </div>
  )
}
