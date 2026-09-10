import fs from "fs"
import path from "path"
import sharp from "sharp"

const ACCESOS_DIR = path.join(process.cwd(), "public/image/accesos")
const NOTICIAS_DIR = path.join(process.cwd(), "public/image/noticias")

if (!fs.existsSync(ACCESOS_DIR)) fs.mkdirSync(ACCESOS_DIR, { recursive: true })
if (!fs.existsSync(NOTICIAS_DIR)) fs.mkdirSync(NOTICIAS_DIR, { recursive: true })

// ─────────────────────────────────────────────────────────────
// Generador de Capturas / Previsualizaciones de Sistemas (18)
// ─────────────────────────────────────────────────────────────
const SISTEMAS_UI = [
  {
    fileName: "sigec_login.jpg",
    title: "SIGEC",
    subtitle: "Sistema de Gestión y Correspondencia",
    headerColor: "#002F6C",
    accentColor: "#FFCC00",
    badge: "CORRESPONDENCIA AGBC",
    urlBar: "https://sigec.correos.gob.bo",
    type: "login",
    formTitle: "Autenticación de Servidor Público",
    icon: "📄",
  },
  {
    fileName: "zimbra_mail.jpg",
    title: "ZIMBRA MAIL",
    subtitle: "Correo Electrónico Corporativo AGBC",
    headerColor: "#1B365D",
    accentColor: "#00A3E0",
    badge: "CORREO INSTITUCIONAL",
    urlBar: "https://zimbra.correos.gob.bo",
    type: "zimbra",
    formTitle: "Iniciar Sesión en Zimbra",
    icon: "✉️",
  },
  {
    fileName: "intranet_portal.jpg",
    title: "INTRANET AGBC",
    subtitle: "Portal de Servicios al Servidor Postal",
    headerColor: "#002F6C",
    accentColor: "#FFCC00",
    badge: "PORTAL INTERNO",
    urlBar: "https://intranet.correos.gob.bo:8122",
    type: "dashboard",
    formTitle: "Panel de Control y Recursos Humanos",
    icon: "🏢",
  },
  {
    fileName: "portal_web.jpg",
    title: "CORREOS DE BOLIVIA",
    subtitle: "Portal Web Oficial al Usuario",
    headerColor: "#0E5296",
    accentColor: "#FFCC00",
    badge: "SITIO WEB OFICIAL",
    urlBar: "https://correos.gob.bo",
    type: "web",
    formTitle: "Servicios Postales, Envíos y Filatelia",
    icon: "🌐",
  },
  {
    fileName: "pagina_institucional.jpg",
    title: "PORTAL INSTITUCIONAL",
    subtitle: "Transparencia y Normativa AGBC",
    headerColor: "#002F6C",
    accentColor: "#E0B000",
    badge: "INFORMACIÓN INSTITUCIONAL",
    urlBar: "https://institucional.correos.gob.bo:8007",
    type: "web",
    formTitle: "Rendición de Cuentas y Marco Legal",
    icon: "🏛️",
  },
  {
    fileName: "sistema_facturacion.jpg",
    title: "SISTEMA DE FACTURACIÓN",
    subtitle: "Facturación Electrónica y Tributaria",
    headerColor: "#0A4C80",
    accentColor: "#10B981",
    badge: "FACTURACIÓN EN LÍNEA",
    urlBar: "http://172.65.10.55:8116",
    type: "pos",
    formTitle: "Emisión de Comprobantes y Facturas",
    icon: "🧾",
  },
  {
    fileName: "chatbot_agbc.jpg",
    title: "CHATBOT AGBC",
    subtitle: "Asistente Virtual de Consultas",
    headerColor: "#002F6C",
    accentColor: "#6366F1",
    badge: "ATENCIÓN CIUDADANA",
    urlBar: "https://chatbot.correos.gob.bo:5000",
    type: "chat",
    formTitle: "Consultas Automatizadas de Envíos",
    icon: "🤖",
  },
  {
    fileName: "siop_tracking.jpg",
    title: "SIOP - TRACKINGBO",
    subtitle: "Operaciones Postales y Rastreo",
    headerColor: "#002F6C",
    accentColor: "#F59E0B",
    badge: "RASTREO EN TIEMPO REAL",
    urlBar: "https://trackingbo.correos.gob.bo:8100",
    type: "tracking",
    formTitle: "Localizador de Paquetería y Correspondencia",
    icon: "📦",
  },
  {
    fileName: "sistema_casillas.jpg",
    title: "SISTEMA DE CASILLAS",
    subtitle: "Administración de Casilleros Postales",
    headerColor: "#1E3A8A",
    accentColor: "#3B82F6",
    badge: "CASILLAS POSTALES",
    urlBar: "https://casillas.correos.gob.bo:3001",
    type: "dashboard",
    formTitle: "Control y Asignación de Casilleros",
    icon: "📬",
  },
  {
    fileName: "verificacion_doc.jpg",
    title: "VERIFICACIÓN DOCUMENTAL",
    subtitle: "Validación de Documentos Oficiales",
    headerColor: "#0F766E",
    accentColor: "#14B8A6",
    badge: "SEGURIDAD DOCUMENTAL",
    urlBar: "http://172.65.10.55:8108",
    type: "verify",
    formTitle: "Validador de Código QR y Hash Institucional",
    icon: "🔒",
  },
  {
    fileName: "calculadora_postal.jpg",
    title: "CALCULADORA POSTAL",
    subtitle: "Cotizador de Tarifas Nacionales e Internacionales",
    headerColor: "#0E5296",
    accentColor: "#F59E0B",
    badge: "TARIFARIO POSTAL",
    urlBar: "https://postar.correos.gob.bo:8104",
    type: "calc",
    formTitle: "Calculadora de Peso, Volumen y Destino",
    icon: "⚖️",
  },
  {
    fileName: "quality_web_system.jpg",
    title: "QUALITY WEB SYSTEM",
    subtitle: "Postal Technology Centre - UPU",
    headerColor: "#004B87",
    accentColor: "#E0A800",
    badge: "UPU INTERNATIONAL",
    urlBar: "https://qcsmail.ptc.post/login.aspx",
    type: "upu",
    formTitle: "QCS Mail Login - Quality Measurement",
    icon: "🌐",
  },
  {
    fileName: "ips_web_client.jpg",
    title: "IPS WEB CLIENT",
    subtitle: "International Postal System - UPU",
    headerColor: "#004B87",
    accentColor: "#E0A800",
    badge: "UPU INTERNATIONAL",
    urlBar: "https://ips.correos.gob.bo/IPSWeb/ES",
    type: "upu",
    formTitle: "IPS Web Client - Módulos de Despacho",
    icon: "✈️",
  },
  {
    fileName: "cds_web_client.jpg",
    title: "CDS WEB CLIENT",
    subtitle: "Customs Declaration System - UPU",
    headerColor: "#004B87",
    accentColor: "#E0A800",
    badge: "DECLARACIONES ADUANERAS",
    urlBar: "https://ips.correos.gob.bo/CDS.Web/LogIn.aspx",
    type: "upu",
    formTitle: "CDS LogIn - Declaraciones CN22 / CN23",
    icon: "📋",
  },
  {
    fileName: "global_track_trace.jpg",
    title: "GLOBAL TRACK AND TRACE",
    subtitle: "UPU Global Postal Network",
    headerColor: "#004B87",
    accentColor: "#38BDF8",
    badge: "RASTREO MUNDIAL",
    urlBar: "https://globaltracktrace.ptc.post/gtt.web",
    type: "tracking",
    formTitle: "Worldwide Item Tracking System",
    icon: "🌍",
  },
  {
    fileName: "solicitud_acceso.jpg",
    title: "SOLICITUD DE ACCESO",
    subtitle: "Mesa de Permisos y Cuentas TIC",
    headerColor: "#1E293B",
    accentColor: "#38BDF8",
    badge: "FORMULARIO INTERNO",
    urlBar: "http://172.65.10.55:8128/solicitar-acceso",
    type: "form",
    formTitle: "Solicitud de Credenciales y Sistemas",
    icon: "🔑",
  },
  {
    fileName: "verificacion_marcaciones.jpg",
    title: "VERIFICACIÓN DE MARCACIONES",
    subtitle: "Control de Asistencia del Personal",
    headerColor: "#002F6C",
    accentColor: "#10B981",
    badge: "RECURSOS HUMANOS",
    urlBar: "http://172.65.10.55:8129/consulta-carnet",
    type: "form",
    formTitle: "Consulta de Marcaciones por N° de Carnet",
    icon: "⏱️",
  },
  {
    fileName: "reporte_errores.jpg",
    title: "REPORTES DE ERRORES",
    subtitle: "HelpDesk y Soporte de Sistemas",
    headerColor: "#B91C1C",
    accentColor: "#F87171",
    badge: "MESA DE AYUDA",
    urlBar: "http://172.65.10.55:8117/reportar",
    type: "form",
    formTitle: "Registro de Incidencias y Fallas Técnicas",
    icon: "🛠️",
  },
]

function generateSystemSvg(s: (typeof SISTEMAS_UI)[0]) {
  return `
  <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <!-- Fondo Ventana de Sistema -->
    <rect width="800" height="450" fill="#0F172A"/>
    
    <!-- Barra Superior de Navegador / Ventana -->
    <rect x="0" y="0" width="800" height="44" fill="#1E293B"/>
    <circle cx="24" cy="22" r="6" fill="#EF4444"/>
    <circle cx="44" cy="22" r="6" fill="#F59E0B"/>
    <circle cx="64" cy="22" r="6" fill="#10B981"/>
    
    <!-- Barra de Dirección URL -->
    <rect x="90" y="10" width="620" height="24" rx="6" fill="#0F172A" stroke="#334155" stroke-width="1"/>
    <text x="110" y="26" fill="#94A3B8" font-family="Arial, sans-serif" font-size="11" font-weight="bold">🔒 ${s.urlBar}</text>
    
    <!-- Header Institucional del Sistema -->
    <rect x="0" y="44" width="800" height="60" fill="${s.headerColor}"/>
    <line x1="0" y1="104" x2="800" y2="104" stroke="${s.accentColor}" stroke-width="3"/>
    
    <!-- Logo y Nombre en Header -->
    <text x="30" y="80" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="20" font-weight="900">${s.title}</text>
    <text x="30" y="96" fill="${s.accentColor}" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${s.subtitle.toUpperCase()}</text>
    
    <!-- Badge en Header -->
    <rect x="620" y="60" width="150" height="26" rx="6" fill="${s.accentColor}" fill-opacity="0.2" stroke="${s.accentColor}" stroke-width="1"/>
    <text x="695" y="77" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${s.badge}</text>
    
    <!-- Área de Trabajo Principal / Contenido de la Aplicación -->
    <rect x="0" y="107" width="800" height="343" fill="#F8FAFC"/>
    
    <!-- Tarjeta Central de la Interfaz -->
    <rect x="180" y="135" width="440" height="275" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.1))"/>
    
    <!-- Header de la Tarjeta -->
    <rect x="180" y="135" width="440" height="50" rx="16" fill="${s.headerColor}"/>
    <rect x="180" y="170" width="440" height="15" fill="${s.headerColor}"/>
    
    <text x="400" y="167" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${s.formTitle}</text>
    
    <!-- Campos del Formulario o Módulo -->
    <text x="215" y="215" fill="#475569" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Usuario / Código / Identificador:</text>
    <rect x="215" y="225" width="370" height="34" rx="8" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <circle cx="232" cy="242" r="6" fill="#94A3B8"/>
    <text x="248" y="247" fill="#64748B" font-family="Arial, sans-serif" font-size="11">ingrese su usuario institucional...</text>
    
    <text x="215" y="280" fill="#475569" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Contraseña o Clave de Acceso:</text>
    <rect x="215" y="290" width="370" height="34" rx="8" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="232" y="312" fill="#94A3B8" font-family="Arial, sans-serif" font-size="16">••••••••••••</text>
    
    <!-- Botón de Acción Principal -->
    <rect x="215" y="342" width="370" height="42" rx="10" fill="${s.headerColor}"/>
    <text x="400" y="368" fill="${s.accentColor}" font-family="Arial, sans-serif" font-size="13" font-weight="900" text-anchor="middle">INGRESAR AL SISTEMA OFICIAL</text>
    
    <!-- Marca de Agua / Sello de Autenticidad -->
    <text x="400" y="400" fill="#94A3B8" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">AGENCIA BOLIVIANA DE CORREOS • ESTADO PLURINACIONAL DE BOLIVIA</text>
  </svg>
  `
}

// ─────────────────────────────────────────────────────────────
// Generador de Noticias con Branding de Medios Bolivianos (12)
// ─────────────────────────────────────────────────────────────
const NOTICIAS_BOLIVIA = [
  {
    fileName: "noticia_abi_1.jpg",
    mediaName: "ABI",
    mediaSubtitle: "Agencia Boliviana de Información",
    mediaColor: "#C2185B",
    headerBar: "#880E4F",
    category: "ECONOMÍA & LOGÍSTICA",
    headline: "Correos de Bolivia y la UPU modernizan intercambio aduanero y postal",
    summary: "Se fortalece el envío de paquetería internacional con intercambio de datos electrónicos anticipados.",
    date: "La Paz, 2026",
    imageBg: "#1E293B",
  },
  {
    fileName: "noticia_larazon_2.jpg",
    mediaName: "LA RAZÓN",
    mediaSubtitle: "Edición Digital Bolivia",
    mediaColor: "#1E3A8A",
    headerBar: "#172554",
    category: "NACIONAL",
    headline: "AGBC incorpora nueva flota vehicular y automatización en centros de acopio",
    summary: "Nuevas unidades de reparto y módulos de clasificación agilizan entregas en La Paz, Cochabamba y Santa Cruz.",
    date: "La Paz, 2026",
    imageBg: "#0F172A",
  },
  {
    fileName: "noticia_unitel_3.jpg",
    mediaName: "UNITEL",
    mediaSubtitle: "Unitel Digital Noticias",
    mediaColor: "#E11D48",
    headerBar: "#9F1239",
    category: "SERVICIOS & PAÍS",
    headline: "Delivery Express: Correos lanza envíos en 24 horas para comercio electrónico",
    summary: "La tarifa especial beneficia a tiendas virtuales y emprendedores con cobertura en las 9 capitales.",
    date: "Santa Cruz, 2026",
    imageBg: "#1E1E24",
  },
  {
    fileName: "noticia_eldiario_4.jpg",
    mediaName: "EL DIARIO",
    mediaSubtitle: "Decano de la Prensa Nacional",
    mediaColor: "#B45309",
    headerBar: "#78350F",
    category: "CULTURA & FILATELIA",
    headline: "Histórica emisión de sellos postales por el Bicentenario de Bolivia",
    summary: "Colección exclusiva rinde homenaje a héroes de la independencia y riqueza natural del país.",
    date: "La Paz, 2026",
    imageBg: "#292524",
  },
  {
    fileName: "noticia_reduno_5.jpg",
    mediaName: "RED UNO",
    mediaSubtitle: "Red Uno de Bolivia",
    mediaColor: "#EA580C",
    headerBar: "#9A3412",
    category: "TECNOLOGÍA",
    headline: "TrackingBO 2.0: Rastreo en tiempo real de encomiendas desde el móvil",
    summary: "La plataforma digital permite verificar el estado y ruta de entrega mediante código QR.",
    date: "Bolivia, 2026",
    imageBg: "#1C1917",
  },
  {
    fileName: "noticia_eldeber_6.jpg",
    mediaName: "EL DEBER",
    mediaSubtitle: "Periodismo Digital",
    mediaColor: "#059669",
    headerBar: "#064E3B",
    category: "SEGURIDAD",
    headline: "Alerta ciudadana: Advierten sobre estafas con falsas subastas de paquetes",
    summary: "Autoridades de la AGBC reiteran que la entidad no remata encomiendas por WhatsApp ni redes sociales.",
    date: "Santa Cruz, 2026",
    imageBg: "#064E3B",
  },
  {
    fileName: "noticia_atb_7.jpg",
    mediaName: "ATB DIGITAL",
    mediaSubtitle: "Red Nacional ATB",
    mediaColor: "#2563EB",
    headerBar: "#1E40AF",
    category: "EMPRENDEDORES",
    headline: "Programa 'Correo Emprendedor' amplía destinos para exportación artesanal",
    summary: "Productores bolivianos acceden a envíos internacionales preferenciales a más de 190 países.",
    date: "La Paz, 2026",
    imageBg: "#1E3A8A",
  },
  {
    fileName: "noticia_bolivision_8.jpg",
    mediaName: "BOLIVISIÓN",
    mediaSubtitle: "Noticiero Al Día",
    mediaColor: "#7C3AED",
    headerBar: "#4C1D95",
    category: "SOCIEDAD",
    headline: "Inauguran modernas casillas inteligentes y horario continuo en agencias",
    summary: "Usuarios destacan la rapidez en recepción de correspondencia y atención ininterrumpida.",
    date: "Cochabamba, 2026",
    imageBg: "#2E1065",
  },
  {
    fileName: "noticia_lostiempos_9.jpg",
    mediaName: "LOS TIEMPOS",
    mediaSubtitle: "Cochabamba - Bolivia",
    mediaColor: "#0284C7",
    headerBar: "#075985",
    category: "HISTORIA",
    headline: "Exposición de filatelia exhibe cartas históricas y joyas postales",
    summary: "Muestra abierta reúne más de 5.000 piezas que narran la historia postal boliviana.",
    date: "Cochabamba, 2026",
    imageBg: "#082F49",
  },
  {
    fileName: "noticia_opinion_10.jpg",
    mediaName: "OPINIÓN",
    mediaSubtitle: "Diario de Circulación Nacional",
    mediaColor: "#D97706",
    headerBar: "#92400E",
    category: "MEDIO AMBIENTE",
    headline: "'Correos Verde': AGBC implementa sobres y empaques 100% reciclables",
    summary: "Campaña ecológica reduce la huella de carbono en la red de distribución urbana y provincial.",
    date: "Cochabamba, 2026",
    imageBg: "#451A03",
  },
  {
    fileName: "noticia_correodelsur_11.jpg",
    mediaName: "CORREO DEL SUR",
    mediaSubtitle: "Chuquisaca - Bolivia",
    mediaColor: "#4F46E5",
    headerBar: "#312E81",
    category: "GESTIÓN PÚBLICA",
    headline: "Capacitan a operadores postales en ciberseguridad y trazabilidad aduanera",
    summary: "Personal de los 9 departamentos concluye programa intensivo de modernización logística.",
    date: "Sucre, 2026",
    imageBg: "#1E1B4B",
  },
  {
    fileName: "noticia_boliviaverifica_12.jpg",
    mediaName: "BOLIVIA VERIFICA",
    mediaSubtitle: "Portal de Verificación de Noticias",
    mediaColor: "#0D9488",
    headerBar: "#134E4A",
    category: "FACT-CHECKING",
    headline: "Falso: Correos de Bolivia no remata paquetes extraviados por redes sociales",
    summary: "Se identificaron páginas apócrifas que suplantan la identidad institucional para cometer fraudes.",
    date: "Bolivia, 2026",
    imageBg: "#042F2E",
  },
]

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;"
      case ">": return "&gt;"
      case "&": return "&amp;"
      case "\'": return "&apos;"
      case "\"": return "&quot;"
      default: return c
    }
  })
}

function generateNewsSvg(n: (typeof NOTICIAS_BOLIVIA)[0]) {
  const category = escapeXml(n.category)
  const headline = escapeXml(n.headline.length > 55 ? n.headline.substring(0, 52) + "..." : n.headline)
  const summary = escapeXml(n.summary)
  const mediaName = escapeXml(n.mediaName)
  const mediaSubtitle = escapeXml(n.mediaSubtitle)
  const date = escapeXml(n.date)

  return `
  <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <!-- Fondo del Artículo de Prensa -->
    <rect width="800" height="450" fill="${n.imageBg}"/>
    
    <!-- Barra Superior del Periódico / Canal -->
    <rect x="0" y="0" width="800" height="50" fill="${n.headerBar}"/>
    <line x1="0" y1="50" x2="800" y2="50" stroke="${n.mediaColor}" stroke-width="4"/>
    
    <!-- Logo del Medio -->
    <rect x="30" y="10" width="130" height="30" rx="4" fill="${n.mediaColor}"/>
    <text x="95" y="31" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="16" font-weight="900" text-anchor="middle">${mediaName}</text>
    <text x="175" y="30" fill="#E2E8F0" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${mediaSubtitle}</text>
    <text x="770" y="30" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end">${date}</text>
    
    <!-- Banner de Categoría -->
    <rect x="40" y="75" width="180" height="24" rx="12" fill="${n.mediaColor}" fill-opacity="0.3" stroke="${n.mediaColor}" stroke-width="1.5"/>
    <text x="130" y="91" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="10" font-weight="900" text-anchor="middle">PRENSA • ${category}</text>
    
    <!-- Titular Principal del Periódico -->
    <text x="40" y="145" fill="#FFFFFF" font-family="Georgia, serif" font-size="22" font-weight="bold">
      ${headline}
    </text>
    
    <!-- Resumen de la Noticia / Bajada -->
    <rect x="40" y="175" width="720" height="65" rx="10" fill="#000000" fill-opacity="0.3" stroke="#FFFFFF" stroke-opacity="0.1"/>
    <text x="60" y="210" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="13" font-weight="normal">
      ${summary}
    </text>
    
    <!-- Gráfico Ilustrativo de Correos y Logística -->
    <rect x="40" y="260" width="720" height="150" rx="14" fill="#002F6C" stroke="#FFCC00" stroke-width="2"/>
    
    <!-- Ilustración Postal -->
    <circle cx="100" cy="335" r="35" fill="#0E5296" stroke="#FFCC00" stroke-width="3"/>
    <text x="100" y="347" font-size="30" text-anchor="middle">📦</text>
    
    <text x="165" y="325" fill="#FFCC00" font-family="Arial, sans-serif" font-size="18" font-weight="900">AGENCIA BOLIVIANA DE CORREOS</text>
    <text x="165" y="348" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Cobertura Postal Nacional en las 9 Capitales de Bolivia</text>
    <text x="165" y="370" fill="#93C5FD" font-family="Arial, sans-serif" font-size="11">Fuente oficial: ${mediaName} • Estado Plurinacional de Bolivia</text>
  </svg>
  `
}

async function main() {
  console.log("🎨 Generando 18 capturas de pantallas de sistemas...")
  for (const s of SISTEMAS_UI) {
    const svg = generateSystemSvg(s)
    const outPath = path.join(ACCESOS_DIR, s.fileName)
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(outPath)
    console.log(`  ✓ Creada captura: ${s.fileName}`)
  }

  console.log("📰 Generando 12 imágenes de noticias con periódicos de Bolivia...")
  for (const n of NOTICIAS_BOLIVIA) {
    const svg = generateNewsSvg(n)
    const outPath = path.join(NOTICIAS_DIR, n.fileName)
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(outPath)
    console.log(`  ✓ Creada noticia: ${n.fileName}`)
  }

  console.log("✅ Todas las imágenes generadas exitosamente!")
}

main().catch(console.error)
