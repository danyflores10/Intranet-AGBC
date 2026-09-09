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
      return <span className="text-[#002F6C]">{displayed}</span>
    }
    const before = displayed.slice(0, boliviaStart)
    const boliviaPart = displayed.slice(boliviaStart)
    return (
      <>
        <span className="text-[#002F6C]">{before}</span>
        <span className="text-[#0E5296] font-black">{boliviaPart}</span>
      </>
    )
  }

  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#002F6C] bg-[#002F6C] px-5 py-2 text-xs font-black uppercase tracking-widest text-[#FFB800] shadow-md">
        <Sparkles className="h-4 w-4 text-[#FFB800]" />
        Plataforma Intranet
      </div>
      <h2 className="text-5xl font-black tracking-tight text-[#002F6C] xl:text-6xl 2xl:text-7xl leading-[1.1] min-h-[2.6em]">
        {renderText()}
        <span
          className={`inline-block w-[5px] h-[1em] align-middle ml-1.5 rounded-sm bg-[#002F6C] transition-opacity duration-100 ${
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
    <div className={cn("flex min-h-svh bg-slate-50", className)} {...props}>
      <div className="relative hidden w-[55%] overflow-hidden bg-[#FFB800] lg:flex lg:flex-col lg:justify-between border-r-2 border-[#002F6C]/20">

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#002F6C_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        <div className="relative z-10 flex flex-1 flex-col justify-center items-center px-14 xl:px-20">
          {/* Logo */}
          <div className="mb-12 flex items-center justify-center">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={260}
              height={80}
              className="h-20 w-auto object-contain drop-shadow-md"
              style={{ width: "auto" }}
              priority
            />
          </div>

          <TypewriterTitle />

        </div>

        <div className="relative z-10 px-14 pb-8 xl:px-20">
          <div className="flex items-center gap-3 text-[#002F6C]/80 font-semibold text-xs">
            <Shield className="h-4 w-4 text-[#002F6C]" />
            <span>Conexión segura — Cifrado de extremo a extremo AGBC</span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col bg-slate-50 lg:w-[45%]">

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-12">

          <div className="lg:hidden mb-8">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={160}
              height={45}
              className="h-10 w-auto object-contain"
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
                className="h-14 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </div>

            <div
              key={shakeKey}
              className={cn(
                "rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-xl shadow-[#002F6C]/5 transition-colors",
                isLocked
                  ? "border-red-500/60 shadow-red-500/20"
                  : "border-slate-200",
                shakeClass,
              )}
            >
              {isLocked && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                    <TimerIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-700">
                      Acceso bloqueado temporalmente
                    </p>
                    <p className="text-xs text-red-600">
                      Demasiados intentos fallidos. Intente nuevamente en {formatRemaining(remainingMs)}.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-6 space-y-1 text-center">
                <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">Iniciar sesión</h1>
                <p className="text-sm text-slate-500 font-medium">
                  Ingresa tus credenciales para acceder a la plataforma
                </p>
              </div>

              <form
                onSubmit={signInForm.handleSubmit(onSubmitSignIn)}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Correo electrónico
                    </FieldLabel>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#002F6C]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@correos.gob.bo"
                        autoComplete="email"
                        disabled={isLocked}
                        className="h-12 pl-11 rounded-xl border-slate-300 bg-slate-50 text-sm font-medium transition-all focus:border-[#FFB800] focus:ring-4 focus:ring-[#FFB800]/25 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        {...signInForm.register("email")}
                      />
                    </div>
                    <FieldError errors={[signInForm.formState.errors.email]} />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Contraseña
                      </FieldLabel>
                      <Link
                        href="/recuperar-contrasena"
                        className="text-xs font-bold text-[#0E5296] hover:underline"
                        tabIndex={-1}
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#002F6C]" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLocked}
                        className="h-12 pl-11 pr-11 rounded-xl border-slate-300 bg-slate-50 text-sm font-medium transition-all focus:border-[#FFB800] focus:ring-4 focus:ring-[#FFB800]/25 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        {...signInForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
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
                      className="w-full h-12 text-base font-black rounded-xl bg-[#FFB800] hover:bg-[#E5A700] text-[#002F6C] shadow-lg shadow-[#FFB800]/30 border-2 border-[#002F6C] transition-all duration-200 hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
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
                          <ArrowRight className="ml-2 h-5 w-5 text-[#002F6C]" />
                        </>
                      )}
                    </Button>
                    {!isLocked && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
                      <p className="mt-2 text-center text-[11px] font-bold text-red-600">
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
