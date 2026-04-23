"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock, Mail, Eye, EyeOff, ArrowRight, Shield, Sparkles, TimerIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import {
  signInSchema,
  type SignInInput,
} from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

function TypewriterTitle() {
  const fullText = "Intranet de Correos de Bolivia"
  const boliviaStart = fullText.indexOf("Bolivia")
  const [charCount, setCharCount] = useState(0)
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "pauseEmpty">("typing")
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (phase === "typing") {
      if (charCount < fullText.length) {
        timeout = setTimeout(() => setCharCount((c) => c + 1), 70)
      } else {
        timeout = setTimeout(() => setPhase("pause"), 100)
      }
    } else if (phase === "pause") {
      timeout = setTimeout(() => setPhase("deleting"), 2500)
    } else if (phase === "deleting") {
      if (charCount > 0) {
        timeout = setTimeout(() => setCharCount((c) => c - 1), 35)
      } else {
        timeout = setTimeout(() => setPhase("pauseEmpty"), 100)
      }
    } else if (phase === "pauseEmpty") {
      timeout = setTimeout(() => setPhase("typing"), 800)
    }

    return () => clearTimeout(timeout)
  }, [charCount, phase])

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 530)
    return () => clearInterval(interval)
  }, [])

  const displayed = fullText.slice(0, charCount)

  const renderText = () => {
    if (charCount <= boliviaStart) {
      return <span className="text-[#FF8800]">{displayed}</span>
    }
    const before = displayed.slice(0, boliviaStart)
    const boliviaPart = displayed.slice(boliviaStart)
    return (
      <>
        <span className="text-[#FF8800]">{before}</span>
        <span className="bg-gradient-to-r from-[#C41E3A] via-[#FFB300] to-[#2E7D32] bg-clip-text text-transparent">{boliviaPart}</span>
      </>
    )
  }

  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800] backdrop-blur-sm">
        <Sparkles className="h-3.5 w-3.5" />
        Plataforma Intranet
      </div>
      <h2 className="text-5xl font-extrabold tracking-tight text-foreground xl:text-6xl 2xl:text-7xl leading-[1.1] min-h-[2.6em]">
        {renderText()}
        <span
          className={`inline-block w-[4px] h-[1em] align-middle ml-1.5 rounded-sm bg-gradient-to-b from-[#C41E3A] via-[#FFB300] to-[#2E7D32] transition-opacity duration-100 ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
        />
      </h2>
    </div>
  )
}

const LOCKOUT_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 3
const ATTEMPTS_KEY = "login:failed-attempts"
const LOCK_UNTIL_KEY = "login:lock-until"

function readNumberFromStorage(key: string): number {
  if (typeof window === "undefined") return 0
  const raw = window.localStorage.getItem(key)
  if (!raw) return 0
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function getCurrentTime(): number {
  return Date.now()
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [shakeLevel, setShakeLevel] = useState<0 | 1 | 2>(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => getCurrentTime())

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  // Rehidratar estado persistido (localStorage = sistema externo)
  useEffect(() => {
    const persistedLock = readNumberFromStorage(LOCK_UNTIL_KEY)
    const persistedAttempts = readNumberFromStorage(ATTEMPTS_KEY)
    if (persistedLock > getCurrentTime()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLockUntil(persistedLock)
      setFailedAttempts(Math.max(persistedAttempts, MAX_ATTEMPTS))
    } else {
      if (persistedLock > 0) {
        window.localStorage.removeItem(LOCK_UNTIL_KEY)
        window.localStorage.removeItem(ATTEMPTS_KEY)
      }
      setFailedAttempts(persistedAttempts)
    }
  }, [])

  // Tick para countdown + expiración del bloqueo
  useEffect(() => {
    if (!lockUntil) return
    const interval = window.setInterval(() => {
      const current = getCurrentTime()
      setNow(current)
      if (current >= lockUntil) {
        window.clearInterval(interval)
        setLockUntil(null)
        setFailedAttempts(0)
        setShakeLevel(0)
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCK_UNTIL_KEY)
          window.localStorage.removeItem(ATTEMPTS_KEY)
        }
        toast.success("Puedes intentar iniciar sesión de nuevo")
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [lockUntil])

  // Reinicia el nivel de shake después de que la animación corra
  useEffect(() => {
    if (shakeLevel === 0) return
    const duration = shakeLevel === 1 ? 650 : 950
    const timeout = window.setTimeout(() => setShakeLevel(0), duration)
    return () => window.clearTimeout(timeout)
  }, [shakeLevel, shakeKey])

  const isLocked = lockUntil !== null && now < lockUntil
  const remainingMs = isLocked && lockUntil ? lockUntil - now : 0

  function triggerShake(level: 1 | 2) {
    setShakeLevel(level)
    setShakeKey((k) => k + 1)
  }

  function registerFailedAttempt() {
    const next = failedAttempts + 1
    setFailedAttempts(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ATTEMPTS_KEY, String(next))
    }

    if (next >= MAX_ATTEMPTS) {
      const currentTime = getCurrentTime()
      const until = currentTime + LOCKOUT_MS
      setLockUntil(until)
      setNow(currentTime)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCK_UNTIL_KEY, String(until))
      }
      triggerShake(2)
      toast.error("Demasiados intentos fallidos. Espera 5 minutos antes de volver a intentar.")
    } else if (next === 2) {
      triggerShake(2)
    } else {
      triggerShake(1)
    }
  }

  function resetAttempts() {
    setFailedAttempts(0)
    setLockUntil(null)
    setShakeLevel(0)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ATTEMPTS_KEY)
      window.localStorage.removeItem(LOCK_UNTIL_KEY)
    }
  }

  async function onSubmitSignIn(values: SignInInput) {
    if (isLocked) return
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/",
      })
      if (result.error) {
        const msg = translateAuthError(result.error.message ?? INVALID_CREDENTIALS_MESSAGE)
        toast.error(msg)
        registerFailedAttempt()
        return
      }
      resetAttempts()
      toast.success("Bienvenido al sistema")
      router.replace("/")
      router.refresh()
    } catch (error) {
      const msg = extractErrorMessage(error)
      toast.error(msg)
      registerFailedAttempt()
    }
  }

  const isSignInPending = signInForm.formState.isSubmitting
  const shakeClass =
    shakeLevel === 2
      ? "animate-login-shake-hard"
      : shakeLevel === 1
        ? "animate-login-shake"
        : ""

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

          <TypewriterTitle />

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

            <div
              key={shakeKey}
              className={cn(
                "rounded-2xl border bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/20 transition-colors",
                isLocked
                  ? "border-red-500/60 shadow-red-500/20"
                  : "border-border/60 animate-pulse-glow",
                shakeClass,
              )}
            >
              {isLocked && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                    <TimerIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      Acceso bloqueado temporalmente
                    </p>
                    <p className="text-xs text-red-600/90 dark:text-red-300/80">
                      Demasiados intentos fallidos. Podrás reintentar en{" "}
                      <span className="font-mono font-bold">{formatRemaining(remainingMs)}</span>.
                    </p>
                  </div>
                </div>
              )}
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
                        disabled={isLocked}
                        className="h-12 pl-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background disabled:cursor-not-allowed disabled:opacity-60"
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
                        disabled={isLocked}
                        className="h-12 pl-11 pr-11 rounded-xl border-border/60 bg-muted/30 text-sm transition-all focus:border-[#FFB300]/50 focus:ring-[#FFB300]/20 focus:bg-background disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 hover:brightness-110 border-0 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSignInPending || isLocked}
                    >
                      {isLocked ? (
                        <>
                          <TimerIcon className="mr-2 h-4 w-4" />
                          Bloqueado — {formatRemaining(remainingMs)}
                        </>
                      ) : isSignInPending ? (
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
                    {!isLocked && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
                      <p className="mt-2 text-center text-[11px] font-semibold text-red-600 dark:text-red-400">
                        Intento {failedAttempts} de {MAX_ATTEMPTS}. Después del tercer fallo se bloqueará el acceso por 5 minutos.
                      </p>
                    )}
                  </Field>

                </FieldGroup>
              </form>
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
