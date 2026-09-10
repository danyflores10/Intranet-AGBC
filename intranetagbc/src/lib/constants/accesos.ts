export type AccesoDirectoData = {
  titulo: string
  descripcion?: string
  url: string
  categoria?: string
  activo?: boolean
  imagen?: string
}

export type AccesoDirectoRow = {
  clave: string
  titulo: string
  descripcion: string
  url: string
  categoria: string
  activo: boolean
  imagen: string
  updatedAt: Date
}

export const ACCESOS_DIRECTOS_GRUPO = "accesos_directos"

export const ACCESOS_DIRECTOS_DEFAULT: AccesoDirectoRow[] = [
  // ── Links Internos de Correos de Bolivia ──
  {
    clave: "default_sigec",
    titulo: "SIGEC (Correspondencia AGBC)",
    descripcion: "Sistema oficial de gestión, seguimiento y archivo de correspondencia institucional.",
    url: "https://sigec.correos.gob.bo/",
    categoria: "Links Internos",
    activo: true,
    imagen: "/image/accesos/sigec_login.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_zimbra",
    titulo: "ZIMBRA (Correo Electrónico)",
    descripcion: "Plataforma institucional de mensajería y correo corporativo de la AGBC.",
    url: "https://zimbra.correos.gob.bo/",
    categoria: "Links Internos",
    activo: true,
    imagen: "/image/accesos/zimbra_mail.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_intranet",
    titulo: "INTRANET AGBC",
    descripcion: "Portal centralizado de servicios internos, noticias y recursos humanos.",
    url: "https://intranet.correos.gob.bo:8122/",
    categoria: "Links Internos",
    activo: true,
    imagen: "/image/accesos/intranet_portal.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Públicos de Correos de Bolivia ──
  {
    clave: "default_portal",
    titulo: "Página Web Oficial",
    descripcion: "Sitio web oficial de Correos de Bolivia con información y tarifas al usuario.",
    url: "https://correos.gob.bo/",
    categoria: "Links Públicos",
    activo: true,
    imagen: "/image/accesos/portal_web.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_institucional",
    titulo: "Página Institucional",
    descripcion: "Portal de transparencia, rendición de cuentas e información de la institución.",
    url: "https://institucional.correos.gob.bo:8007/",
    categoria: "Links Públicos",
    activo: true,
    imagen: "/image/accesos/pagina_institucional.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Operativos de la Agencia Boliviana de Correos ──
  {
    clave: "default_facturacion",
    titulo: "Sistema de Facturación",
    descripcion: "Emisión de facturas electrónicas y gestión tributaria de envíos postales.",
    url: "http://172.65.10.55:8116",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/sistema_facturacion.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_chatbot",
    titulo: "Chatbot AGBC",
    descripcion: "Asistente virtual de atención automatizada y consultas ciudadanas.",
    url: "https://chatbot.correos.gob.bo:5000/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/chatbot_agbc.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_siop",
    titulo: "SIOP (Rastreo Postal)",
    descripcion: "Sistema Integrado de Operaciones Postales y trazabilidad nacional.",
    url: "https://trackingbo.correos.gob.bo:8100/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/siop_tracking.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_casillas",
    titulo: "Sistema de Casillas",
    descripcion: "Administración, asignación y cobro de casillas postales para usuarios.",
    url: "https://casillas.correos.gob.bo:3001/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/sistema_casillas.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_verificacion_doc",
    titulo: "Sistema de Verificación Documental",
    descripcion: "Validación digital de documentos, cartas y resoluciones emitidas.",
    url: "http://172.65.10.55:8108/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/verificacion_doc.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_calculadora",
    titulo: "Calculadora Postal",
    descripcion: "Cotizador en línea de tarifas nacionales e internacionales por peso y destino.",
    url: "https://postar.correos.gob.bo:8104/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/calculadora_postal.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_qcs",
    titulo: "Quality Web System (UPU)",
    descripcion: "Sistema de control de calidad y tiempos de entrega de la Unión Postal Universal.",
    url: "https://qcsmail.ptc.post/login.aspx",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/quality_web_system.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_ips",
    titulo: "IPS Web Client (UPU)",
    descripcion: "International Postal System para intercambio de despachos aduaneros.",
    url: "https://ips.correos.gob.bo/IPSWeb/ES",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/ips_web_client.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_cds",
    titulo: "CDS Web Client (UPU)",
    descripcion: "Customs Declaration System para declaraciones aduaneras postales.",
    url: "https://ips.correos.gob.bo/CDS.Web/LogIn.aspx",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/cds_web_client.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_globaltrack",
    titulo: "Global Track and Trace",
    descripcion: "Seguimiento global de paquetería internacional en la red de la UPU.",
    url: "https://globaltracktrace.ptc.post/gtt.web/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "/image/accesos/global_track_trace.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Consultas y Soporte AGBC ──
  {
    clave: "default_solicitud_acceso",
    titulo: "Solicitud de Acceso a Sistemas",
    descripcion: "Formulario interno para requerir cuentas, accesos o permisos de red.",
    url: "http://172.65.10.55:8128/solicitar-acceso",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "/image/accesos/solicitud_acceso.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_marcaciones",
    titulo: "Verificación de Marcaciones",
    descripcion: "Consulta individual de marcaciones de asistencia y horarios mediante CI.",
    url: "http://172.65.10.55:8129/consulta-carnet",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "/image/accesos/verificacion_marcaciones.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_reportes_errores",
    titulo: "Reportes de Errores en Sistemas",
    descripcion: "Mesa de ayuda y registro de incidentes técnicos para soporte informático.",
    url: "http://172.65.10.55:8117/reportar/",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "/image/accesos/reporte_errores.jpg",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
]
