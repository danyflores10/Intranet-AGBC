"use client"

import { useMemo } from "react"

// Paleta institucional: tricolor Bolivia + AGBC dorados
const COLORES = [
  "#FFB300", // ámbar AGBC
  "#FF8800", // naranja AGBC
  "#C41E3A", // rojo Bolivia
  "#2E7D32", // verde Bolivia
  "#FFD54F", // dorado claro
  "#1976D2", // azul acento
  "#FFFFFF", // blanco
]

type Piece = {
  left: number
  delay: number
  duration: number
  rotStart: number
  rotEnd: number
  dx: number
  dy: number
  width: number
  height: number
  color: string
  shape: "rect" | "ribbon" | "circle"
  sway: number
}

// Generador determinístico para evitar hydration mismatch
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generarPiezas(seed: number, cantidad: number): Piece[] {
  const rand = mulberry32(seed)
  const piezas: Piece[] = []
  for (let i = 0; i < cantidad; i++) {
    const shapeRand = rand()
    const shape: Piece["shape"] = shapeRand < 0.55 ? "ribbon" : shapeRand < 0.85 ? "rect" : "circle"
    const width = shape === "ribbon" ? 4 + rand() * 4 : shape === "circle" ? 6 + rand() * 6 : 8 + rand() * 8
    const height = shape === "ribbon" ? 14 + rand() * 20 : shape === "circle" ? width : 6 + rand() * 8
    piezas.push({
      left: rand() * 100,
      delay: rand() * 0.6,
      duration: 2.2 + rand() * 2.2,
      rotStart: Math.floor(rand() * 360),
      rotEnd: Math.floor(rand() * 1080) + 360,
      dx: (rand() - 0.5) * 160,
      dy: 100 + rand() * 40,
      width,
      height,
      color: COLORES[Math.floor(rand() * COLORES.length)],
      shape,
      sway: 1 + rand() * 1.5,
    })
  }
  return piezas
}

interface Props {
  /** Llave que, al cambiar, dispara un nuevo burst */
  trigger: string | number
  /** Cantidad de piezas (default 50) */
  count?: number
}

export function ConfettiBurst({ trigger, count = 60 }: Props) {
  // Semilla determinística basada en el trigger para cada ráfaga distinta
  const seed = useMemo(() => {
    const str = String(trigger)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash) + count
  }, [trigger, count])

  const piezas = useMemo(() => generarPiezas(seed, count), [seed, count])

  return (
    <div
      key={trigger}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-20"
    >
      {piezas.map((p, i) => (
        <span
          key={i}
          className="animate-confetti-piece absolute top-0"
          style={{
            left: `${p.left}%`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.shape === "ribbon" || p.shape === "rect" ? p.color : "transparent",
            borderRadius: p.shape === "circle" ? "9999px" : p.shape === "ribbon" ? "2px" : "1px",
            boxShadow: p.shape === "circle" ? `0 0 0 2px ${p.color}` : "none",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // Variables CSS consumidas por el keyframe
            ["--confetti-rot-start" as string]: `${p.rotStart}deg`,
            ["--confetti-rot-end" as string]: `${p.rotEnd}deg`,
            ["--confetti-dx" as string]: `${p.dx}px`,
            ["--confetti-dy" as string]: `${p.dy}vh`,
          }}
        />
      ))}
    </div>
  )
}
