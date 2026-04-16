"use client"

import { useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock, Mail, User, Eye, EyeOff, ArrowRight, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthMode = "signIn" | "signUp"
const INVALID_CREDENTIALS_MESSAGE = "Credenciales invalidas."

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return translateAuthError(error.message)
  }
  return "No se pudo completar la solicitud. Inténtalo de nuevo."
}

function translateAuthError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid email or password": INVALID_CREDENTIALS_MESSAGE,
    "Invalid email or password.": INVALID_CREDENTIALS_MESSAGE,
    "User not found": INVALID_CREDENTIALS_MESSAGE,
    "User already exists": "Ya existe una cuenta con este correo.",
    "Email already in use": "Este correo ya está registrado.",
    "Too many requests": "Demasiados intentos. Espera un momento.",
    "Invalid credentials": INVALID_CREDENTIALS_MESSAGE,
    "INVALID_CREDENTIALS": INVALID_CREDENTIALS_MESSAGE,
    "INACTIVE_USER": INVALID_CREDENTIALS_MESSAGE,
    "Tu cuenta esta inactiva. Contacta al administrador.": INVALID_CREDENTIALS_MESSAGE,
    "Correo o contraseña incorrectos.": INVALID_CREDENTIALS_MESSAGE,
    "Correo o contraseÃ±a incorrectos.": INVALID_CREDENTIALS_MESSAGE,
    "Credenciales inválidas.": INVALID_CREDENTIALS_MESSAGE,
  }
  return map[msg] ?? msg
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("signIn")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmitSignIn(values: SignInInput) {
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/",
      })
      if (result.error) {
        const msg = translateAuthError(result.error.message ?? INVALID_CREDENTIALS_MESSAGE)
        toast.error(msg)
        return
      }
      toast.success("Bienvenido al sistema")
      router.replace("/")
      router.refresh()
    } catch (error) {
      const msg = extractErrorMessage(error)
      toast.error(msg)
    }
  }

  async function onSubmitSignUp(values: SignUpInput) {
    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      })
      if (result.error) {
        const msg = translateAuthError(result.error.message ?? "No se pudo crear la cuenta.")
        toast.error(msg)
        return
      }
      toast.success("Cuenta creada exitosamente")
      router.replace("/")
      router.refresh()
    } catch (error) {
      const msg = extractErrorMessage(error)
      toast.error(msg)
    }
  }

  const isSignInPending = signInForm.formState.isSubmitting
  const isSignUpPending = signUpForm.formState.isSubmitting

  return (
    <div className={cn("flex min-h-svh", className)} {...props}>
      <div className="relative hidden w-[55%] overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between">

        <div className="pointer-events-none absolute inset-0 animate-aurora bg-gradient-to-br from-[#FFB300]/15 via-transparent to-[#FF8800]/10" />

        <div className="pointer-events-none absolute inset-0 hero-grid-pattern animate-grid-pulse" />

        <div className="pointer-events-none absolute inset-0">
          <div className="animate-landing-blob absolute -top-20 -left-20 h-96 w-96 rounded-full bg-[#FFB300]/12 blur-[100px]" />
          <div className="animate-landing-blob-delay absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#FF8800]/10 blur-[90px]" />
          <div className="animate-landing-blob-slow absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-[#FFB300]/8 blur-[80px]" />
          <div className="animate-landing-blob absolute top-1/4 right-1/4 h-48 w-48 rounded-full bg-[#FF8800]/6 blur-[70px]" />
          <div className="animate-landing-blob-delay absolute top-2/3 right-1/3 h-56 w-56 rounded-full bg-[#FFB300]/6 blur-[90px]" />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-shimmer absolute top-1/3 left-0 h-[1px] w-[400px] bg-gradient-to-r from-transparent via-[#FFB300]/25 to-transparent" />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="animate-particle absolute top-[20%] left-[15%] h-2 w-2 rounded-full bg-[#FFB300]/30" style={{ animationDelay: '0s' }} />
          <div className="animate-particle absolute top-[50%] left-[70%] h-1.5 w-1.5 rounded-full bg-[#FF8800]/25" style={{ animationDelay: '2s' }} />
          <div className="animate-particle absolute top-[70%] left-[30%] h-1 w-1 rounded-full bg-[#FFB300]/40" style={{ animationDelay: '4s' }} />
          <div className="animate-particle absolute top-[30%] left-[85%] h-2.5 w-2.5 rounded-full bg-[#FFB300]/15" style={{ animationDelay: '1s' }} />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 flex flex-1 flex-col justify-center items-center px-14 xl:px-20">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={220}
              height={70}
              className="h-16 w-auto object-contain drop-shadow-sm dark:hidden"
              style={{ width: "auto" }}
              priority
            />
            <Image
              src="/image/LogoAmarillo.png"
              alt="Correos de Bolivia"
              width={220}
              height={70}
              className="hidden h-16 w-auto object-contain drop-shadow-lg dark:block"
              style={{ width: "auto" }}
              priority
            />
          </div>

          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma Intranet
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground xl:text-5xl leading-[1.1]">
              Sistema de
              <br />
              <span className="bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#F5061D] bg-clip-text text-transparent">
                Gestión Interna
              </span>
            </h2>
            <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
              Accede a todos los módulos de Correos de Bolivia: documentos,
              correspondencia, trámites, RRHH y más.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 max-w-sm">
            {[
              { icon: Mail, label: "Correspondencia" },
              { icon: Shield, label: "Auditoría" },
              { icon: User, label: "RRHH" },
              { icon: Lock, label: "Seguridad" },
            ].map((mod) => (
              <div
                key={mod.label}
                className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-sm transition-all hover:bg-card hover:border-[#FFB300]/30 hover:shadow-md hover:shadow-[#FFB300]/5"
              >
                <mod.icon className="h-4 w-4 text-[#FFB300] shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">{mod.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-14 pb-8 xl:px-20">
          <div className="flex items-center gap-3 text-muted-foreground/50 text-xs">
            <Shield className="h-4 w-4" />
            <span>Conexión segura — Cifrado de extremo a extremo</span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col bg-background lg:w-[45%]">

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-12">

          <div className="lg:hidden mb-8">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={160}
              height={45}
              className="h-10 w-auto object-contain dark:hidden"
              style={{ width: "auto" }}
            />
            <Image
              src="/image/LogoAmarillo.png"
              alt="Correos de Bolivia"
              width={160}
              height={45}
              className="hidden h-10 w-auto object-contain dark:block"
              style={{ width: "auto" }}
            />
          </div>

          <div className="w-full max-w-[420px]">
            <div className="hidden lg:flex justify-center mb-8">
              <Image
                src="/image/Logooriginal.png"
                alt="Correos de Bolivia"
                width={200}
                height={56}
                className="h-14 w-auto object-contain dark:hidden"
                style={{ width: "auto" }}
              />
              <Image
                src="/image/LogoAmarillo.png"
                alt="Correos de Bolivia"
                width={200}
                height={56}
                className="hidden h-14 w-auto object-contain dark:block"
                style={{ width: "auto" }}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/20 animate-pulse-glow">
              {mode === "signIn" ? (
                <form
                  noValidate
                  onSubmit={signInForm.handleSubmit(onSubmitSignIn)}
                  className="animate-fade-in"
                >
                  <FieldGroup>
                    <div className="mb-6 text-center">
                      <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent sm:text-4xl">
                        Bienvenido
                      </h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ingresa tus credenciales para acceder al sistema
                      </p>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="signin-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Correo electrónico
                      </FieldLabel>
                      <div className="relative group">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signin-email"
                          type="email"
                          autoComplete="email"
                          placeholder="tu@correos.gob.bo"
                          className="h-12 pl-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signInForm.register("email")}
                        />
                      </div>
                      <FieldError errors={[signInForm.formState.errors.email]} />
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="signin-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Contraseña
                        </FieldLabel>
                        <Link
                          href="/recuperar-contrasena"
                          className="text-xs font-medium text-[#FF8800] underline-offset-4 hover:text-[#FFB300] hover:underline transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signInForm.register("password")}
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
                      <FieldError errors={[signInForm.formState.errors.password]} />
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300"
                        disabled={isSignInPending}
                      >
                        {isSignInPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ingresando...
                          </>
                        ) : (
                          <>
                            Iniciar sesión
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </Field>

                  </FieldGroup>
                </form>
              ) : (
                <form
                  noValidate
                  onSubmit={signUpForm.handleSubmit(onSubmitSignUp)}
                  className="animate-fade-in"
                >
                  <FieldGroup>
                    <div className="mb-6 text-center">
                      <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent sm:text-4xl">
                        Crear cuenta
                      </h1>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Completa los datos para registrarte en el sistema
                      </p>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nombre completo
                      </FieldLabel>
                      <div className="relative group">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signup-name"
                          autoComplete="name"
                          placeholder="Juan Pérez"
                          className="h-12 pl-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signUpForm.register("name")}
                        />
                      </div>
                      <FieldError errors={[signUpForm.formState.errors.name]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Correo electrónico
                      </FieldLabel>
                      <div className="relative group">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder="tu@correos.gob.bo"
                          className="h-12 pl-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signUpForm.register("email")}
                        />
                      </div>
                      <FieldError errors={[signUpForm.formState.errors.email]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contraseña
                      </FieldLabel>
                      <div className="relative group">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Mínimo 8 caracteres"
                          className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signUpForm.register("password")}
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
                      <FieldError errors={[signUpForm.formState.errors.password]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="signup-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Confirmar contraseña
                      </FieldLabel>
                      <div className="relative group">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#FFB300]" />
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Repite tu contraseña"
                          className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background"
                          {...signUpForm.register("confirmPassword")}
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
                      <FieldError errors={[signUpForm.formState.errors.confirmPassword]} />
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300"
                        disabled={isSignUpPending}
                      >
                        {isSignUpPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando cuenta...
                          </>
                        ) : (
                          <>
                            Registrarse
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </Field>

                    <FieldDescription className="text-center text-sm">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        className="font-bold text-[#FF8800] underline underline-offset-4 hover:text-[#FFB300] transition-colors"
                        onClick={() => {
                          setMode("signIn")
                        }}
                      >
                        Iniciar sesión
                      </button>
                    </FieldDescription>
                  </FieldGroup>
                </form>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Agencia Boliviana de Correos. Plataforma de uso interno.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
