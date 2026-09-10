import path from "path"
import fs from "fs"
import sharp from "sharp"

const NOTICIAS_DIR = path.join(process.cwd(), "public/image/noticias")
if (!fs.existsSync(NOTICIAS_DIR)) fs.mkdirSync(NOTICIAS_DIR, { recursive: true })

async function generateLaRazonArticleImage() {
  const svg = `
  <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <!-- Fondo de Prensa -->
    <rect width="800" height="450" fill="#0A1128"/>
    
    <!-- Cabecera Oficial La Razón -->
    <rect x="0" y="0" width="800" height="54" fill="#001F54"/>
    <line x1="0" y1="54" x2="800" y2="54" stroke="#1E88E5" stroke-width="4"/>
    
    <!-- Logo La Razón -->
    <rect x="30" y="10" width="140" height="34" rx="4" fill="#1E88E5"/>
    <text x="100" y="34" fill="#FFFFFF" font-family="Georgia, serif" font-size="20" font-weight="900" text-anchor="middle">LA RAZÓN</text>
    <text x="185" y="33" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Ciudades • La Paz - Bolivia</text>
    <text x="770" y="33" fill="#93C5FD" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end">13 de julio de 2026</text>
    
    <!-- Tag de Sección -->
    <rect x="30" y="75" width="160" height="24" rx="6" fill="#EF4444" fill-opacity="0.2" stroke="#EF4444" stroke-width="1.5"/>
    <text x="110" y="91" fill="#FCA5A5" font-family="Arial, sans-serif" font-size="10" font-weight="900" text-anchor="middle">🚨 SEGURIDAD POSTAL</text>
    
    <!-- Titular Exacto de La Razón -->
    <text x="30" y="135" fill="#FFFFFF" font-family="Georgia, serif" font-size="24" font-weight="bold">
      Correos detecta sustancias controladas en
    </text>
    <text x="30" y="165" fill="#FFFFFF" font-family="Georgia, serif" font-size="24" font-weight="bold">
      un paquete hacia Asia
    </text>
    
    <!-- Bajada / Resumen del Artículo -->
    <rect x="30" y="185" width="740" height="65" rx="8" fill="#1E293B" fill-opacity="0.6" stroke="#334155" stroke-width="1"/>
    <text x="45" y="212" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="12.5" font-weight="normal">
      Personal de la Fuerza Especial de Lucha Contra el Narcotráfico (FELCN) y de la Agencia Boliviana de Correos
    </text>
    <text x="45" y="234" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="12.5" font-weight="normal">
      (AGBC) interceptaron en la oficina central una encomienda que contenía sustancias ilícitas camufladas.
    </text>
    
    <!-- Área Fotográfica / Ilustrativa de la Noticia -->
    <rect x="30" y="265" width="740" height="155" rx="12" fill="#001F54" stroke="#1E88E5" stroke-width="2"/>
    
    <!-- Gráfico de Paquetería / Detección -->
    <circle cx="95" cy="342" r="38" fill="#0A1128" stroke="#EF4444" stroke-width="3"/>
    <text x="95" y="355" font-size="34" text-anchor="middle">📦</text>
    
    <text x="155" y="325" fill="#FFCC00" font-family="Arial, sans-serif" font-size="16" font-weight="900">OPERATIVO DE CONTROL EN CENTRO POSTAL AGBC</text>
    <text x="155" y="348" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12.5" font-weight="bold">Las pruebas de campo confirmaron que el paquete tenía como destino final el continente asiático.</text>
    <text x="155" y="372" fill="#93C5FD" font-family="Arial, sans-serif" font-size="11">Fuente original: La Razón (larazon.bo) • Sección Ciudades • Estado Plurinacional de Bolivia</text>
    <text x="155" y="392" fill="#64748B" font-family="Arial, sans-serif" font-size="10">URL: https://larazon.bo/ciudades/2026/07/13/correos-detecta-sustancias-conroladas-en-un-paquete-hacia-asia/</text>
  </svg>
  `

  const outPath = path.join(NOTICIAS_DIR, "noticia_larazon_droga_asia.jpg")
  await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toFile(outPath)
  console.log("✓ Imagen de noticia generada:", outPath)
}

generateLaRazonArticleImage().catch(console.error)
