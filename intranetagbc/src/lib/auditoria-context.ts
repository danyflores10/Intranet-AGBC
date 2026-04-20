import { headers } from "next/headers"

type AuditLocation = {
  ciudad?: string
  pais?: string
  countryCode?: string
}

export type AuditRequestContext = {
  ip?: string
  ubicacion?: AuditLocation
}

const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "fly-client-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-forwarded",
] as const

function cleanValue(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : undefined
}

function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase()

  if (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost"
  ) {
    return true
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true
  }

  const ipv4Parts = normalized.split(".")

  if (ipv4Parts.length !== 4) {
    return false
  }

  const [first, second] = ipv4Parts.map((part) => Number.parseInt(part, 10))

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return false
  }

  if (first === 10) {
    return true
  }

  if (first === 192 && second === 168) {
    return true
  }

  return first === 172 && second >= 16 && second <= 31
}

function extractForwardedFor(forwarded: string | undefined): string | undefined {
  if (!forwarded) {
    return undefined
  }

  const chunks = forwarded.split(",").map((chunk) => chunk.trim()).filter(Boolean)

  for (const chunk of chunks) {
    const withoutPort = stripPortFromIpCandidate(chunk)

    if (withoutPort.length > 0) {
      return withoutPort
    }
  }

  return undefined
}

function extractForwardedHeader(forwardedHeader: string | undefined): string | undefined {
  if (!forwardedHeader) {
    return undefined
  }

  const forMatch = forwardedHeader.match(/for=(?:"?\[?)([^;\],"]+)/i)
  return cleanValue(stripPortFromIpCandidate(forMatch?.[1] ?? ""))
}

function stripPortFromIpCandidate(value: string): string {
  const trimmed = value.trim().replace(/^for=/i, "").replace(/^"|"$/g, "")

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("[")) {
    const endBracketIndex = trimmed.indexOf("]")

    if (endBracketIndex > 0) {
      return trimmed.slice(1, endBracketIndex)
    }
  }

  if (trimmed.includes(".") && trimmed.includes(":")) {
    const parts = trimmed.split(":")
    const possiblePort = parts[parts.length - 1]

    if (possiblePort && /^\d+$/.test(possiblePort)) {
      return parts.slice(0, -1).join(":")
    }
  }

  return trimmed
}

function normalizeIp(ip: string | undefined): string | undefined {
  const cleaned = cleanValue(ip)

  if (!cleaned) {
    return undefined
  }

  const normalized = cleaned
    .replace(/^::ffff:/i, "")
    .replace(/^\[|]$/g, "")
    .trim()

  return normalized.length > 0 ? normalized : undefined
}

function normalizeCountryCode(value: string | undefined): string | undefined {
  const cleaned = cleanValue(value)
  if (!cleaned) {
    return undefined
  }

  const upper = cleaned.toUpperCase()
  if (upper.length !== 2) {
    return undefined
  }

  return upper
}

export async function getAuditRequestContext(): Promise<AuditRequestContext> {
  const headerStore = await headers()

  let detectedIp: string | undefined

  for (const headerName of IP_HEADER_CANDIDATES) {
    const value = cleanValue(headerStore.get(headerName))

    if (!value) {
      continue
    }

    detectedIp = headerName === "x-forwarded-for"
      ? extractForwardedFor(value)
      : value

    if (detectedIp) {
      break
    }
  }

  if (!detectedIp) {
    detectedIp = extractForwardedHeader(cleanValue(headerStore.get("forwarded")))
  }

  const ip = normalizeIp(detectedIp)

  const countryCode = normalizeCountryCode(
    cleanValue(headerStore.get("x-vercel-ip-country")) ??
      cleanValue(headerStore.get("cf-ipcountry")),
  )

  const ciudad = cleanValue(
    cleanValue(headerStore.get("x-vercel-ip-city")) ??
      cleanValue(headerStore.get("x-appengine-city")),
  )

  const pais = cleanValue(
    cleanValue(headerStore.get("x-vercel-ip-country-name")) ??
      cleanValue(headerStore.get("x-appengine-country")),
  )

  const ubicacion: AuditLocation = {}

  if (ciudad) {
    ubicacion.ciudad = ciudad
  }

  if (pais) {
    ubicacion.pais = pais
  }

  if (countryCode) {
    ubicacion.countryCode = countryCode
  }

  if (!ubicacion.ciudad && !ubicacion.pais && !ubicacion.countryCode && ip && isPrivateOrLocalIp(ip)) {
    ubicacion.ciudad = "Red local"
    ubicacion.pais = "Entorno interno"
  }

  const hasLocation = Boolean(ubicacion.ciudad || ubicacion.pais || ubicacion.countryCode)

  return {
    ip,
    ubicacion: hasLocation ? ubicacion : undefined,
  }
}
