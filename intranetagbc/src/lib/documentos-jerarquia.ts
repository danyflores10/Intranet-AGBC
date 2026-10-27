export interface SubcategoriaDef {
  codigo: string
  nombre: string
  descripcion: string
  orden: number
}

export interface DireccionDef {
  codigo: string
  nombre: string
  descripcion: string
  orden: number
  subcategorias: SubcategoriaDef[]
}

export const ESTRUCTURA_JERARQUICA: DireccionDef[] = [
  {
    codigo: "DGE",
    nombre: "Dirección General Ejecutiva",
    descripcion: "Máxima autoridad institucional y dirección estratégica de la AGBC",
    orden: 1,
    subcategorias: [
      {
        codigo: "DGE_PLAN",
        nombre: "Planificación",
        descripcion: "Planificación estratégica, POA, estructura y diseño organizacional",
        orden: 1,
      },
      {
        codigo: "DGE_LEGAL",
        nombre: "Legal",
        descripcion: "Asesoría jurídica, procesos normativos, sumarios y contrataciones",
        orden: 2,
      },
      {
        codigo: "DGE_AUDIT",
        nombre: "Auditoria Interna",
        descripcion: "Control interno, auditoría gubernamental y evaluación de gestión",
        orden: 3,
      },
      {
        codigo: "DGE_TRANSP",
        nombre: "Transparencia",
        descripcion: "Lucha contra la corrupción, ética pública y acceso a la información",
        orden: 4,
      },
    ],
  },
  {
    codigo: "DAF",
    nombre: "Dirección Administrativa Financiera",
    descripcion: "Administración de recursos humanos, tesorería, sistemas, presupuestos, contabilidad y bienes de la institución",
    orden: 2,
    subcategorias: [
      {
        codigo: "DAF_RRHH",
        nombre: "Recursos Humanos",
        descripcion: "Administración de personal, bienestar social, inducción y reglamentos laborales",
        orden: 1,
      },
      {
        codigo: "DAF_TESO",
        nombre: "Tesorería Facturación y Cobranzas",
        descripcion: "Gestión de tesorería, recaudaciones, cobranzas, facturación y órdenes de pago",
        orden: 2,
      },
      {
        codigo: "DAF_SIST",
        nombre: "Sistemas",
        descripcion: "Sistemas de información, tecnologías, seguridad informática, redes y soporte técnico",
        orden: 3,
      },
      {
        codigo: "DAF_PRES",
        nombre: "Presupuesto y Adquisiciones",
        descripcion: "Planificación presupuestaria, contrataciones, adquisiciones y compras",
        orden: 4,
      },
      {
        codigo: "DAF_CONTA",
        nombre: "Contabilidad Nacional e Internacional",
        descripcion: "Contabilidad integrada, fondos rotativos, retenciones y cargos de cuenta",
        orden: 5,
      },
      {
        codigo: "DAF_BIENES",
        nombre: "Bienes de Uso, Bienes de Consumo y Servicios Generales",
        descripcion: "SABS, activos fijos, vehículos institucional, telefonía, uniformes y servicios generales",
        orden: 6,
      },
    ],
  },
  {
    codigo: "DO",
    nombre: "Dirección de Operaciones",
    descripcion: "Gestión logística, red postal, casillas y aseguramiento de calidad operativa",
    orden: 3,
    subcategorias: [
      {
        codigo: "DO_CALIDAD",
        nombre: "Desarrollo de Calidad",
        descripcion: "Control y aseguramiento de calidad operativa postal, casillas y seguridad",
        orden: 1,
      },
    ],
  },
  {
    codigo: "DC",
    nombre: "Dirección Comercial",
    descripcion: "Estrategia comercial, marketing, atención al cliente y relaciones institucionales",
    orden: 4,
    subcategorias: [
      {
        codigo: "DC_RIMC",
        nombre: "Relaciones Internacionales Marketing y Comunicación",
        descripcion: "Relaciones Internacionales, Marketing y Comercial, atención de quejas y reclamos",
        orden: 1,
      },
    ],
  },
]

export const TIPOS_DOCUMENTALES = [
  "Circulares",
  "Formularios",
  "Instructivos",
  "Manuales",
  "Normativas",
  "Reglamentos",
] as const

export type TipoDocumental = typeof TIPOS_DOCUMENTALES[number]

export function clasificarDocumento(archivo?: string | null, titulo?: string | null): {
  direccionNombre: string
  subcategoriaNombre: string
  tipoDocumental: string
} {
  const norm = `${archivo || ""} ${titulo || ""}`.toLowerCase()

  // 1. Tipo Documental
  let tipoDocumental = "Normativas"
  if (/reglamento/i.test(norm)) {
    tipoDocumental = "Reglamentos"
  } else if (/instructivo/i.test(norm)) {
    tipoDocumental = "Instructivos"
  } else if (/manual|procedimiento|guia/i.test(norm)) {
    tipoDocumental = "Manuales"
  } else if (/formulario|ficha|kardex|acta|recibo|matriz|notificacion|reporte/i.test(norm)) {
    tipoDocumental = "Formularios"
  } else if (/circular/i.test(norm)) {
    tipoDocumental = "Circulares"
  } else if (/politica|codigo|organigrama|catalogo|chapas/i.test(norm)) {
    tipoDocumental = "Normativas"
  }

  // 2. Dirección y Subcategoría
  if (/transparencia|denuncia|etica|declaracion.*jurada/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Transparencia",
      tipoDocumental,
    }
  }

  if (/auditoria/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Auditoria Interna",
      tipoDocumental,
    }
  }

  if (/legal|sumario|resoluciones.*admini/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Legal",
      tipoDocumental: /instructivo/i.test(norm) ? "Instructivos" : tipoDocumental,
    }
  }

  if (
    /personal|pasantia|fondo.*social|pasajes.*viaticos|administracion.*de.*perso/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Recursos Humanos",
      tipoDocumental,
    }
  }

  // DAF - Tesorería Facturación y Cobranzas
  if (/tesoreria|cobranza|recaudacion|orden.*de.*pago|facturacion/i.test(norm)) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Tesorería Facturación y Cobranzas",
      tipoDocumental,
    }
  }

  // DAF - Sistemas / Tecnologías
  if (/seguridad.*informacion|sistema.*gescon|sistema.*sireco|sistema.*senca|sigec|trackingbo|software|hardware|redes/i.test(norm)) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Sistemas",
      tipoDocumental,
    }
  }

  // DAF - Presupuesto y Adquisiciones
  if (/presupuesto|adquisicion|contratacion.*excepcion/i.test(norm)) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Presupuesto y Adquisiciones",
      tipoDocumental,
    }
  }

  // DAF - Bienes de Uso, Bienes de Consumo y Servicios Generales
  if (/bienes.*y.*servicios|bienes.*de.*uso|sabs|vehicul|telefonia|ropa.*trabajo|uniforme|refrigerio/i.test(norm)) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Bienes de Uso, Bienes de Consumo y Servicios Generales",
      tipoDocumental,
    }
  }

  // Dirección Comercial
  if (
    /queja|reclama|comercial|cn.*08|correspondencia|comite.*de.*reclamaciones|relaciones.*internacionales|marketing|comunicacion/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Comercial",
      subcategoriaNombre: "Relaciones Internacionales Marketing y Comunicación",
      tipoDocumental,
    }
  }

  // Dirección de Operaciones
  if (
    /casilla|senca|calidad|paqueteria|sellos.*postales|felcn|aduanero|rezagos|articulos.*peligrosos|chapas|llaves.*blancas|incautacion.*envio/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección de Operaciones",
      subcategoriaNombre: "Desarrollo de Calidad",
      tipoDocumental,
    }
  }

  // DGE - Planificación
  if (
    /planificacion|diagnostico|rediseno|organigrama|proceso.*organi|poa|programacion.*operaci|organizacion.*administra|aprobacion.*de.*manuales/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Planificación",
      tipoDocumental,
    }
  }

  // DAF - Contabilidad Nacional e Internacional
  if (
    /fondo.*rotativo|tributaria|contabilidad|cargos.*de.*cuenta/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Contabilidad Nacional e Internacional",
      tipoDocumental,
    }
  }

  return {
    direccionNombre: "Dirección Administrativa Financiera",
    subcategoriaNombre: "Contabilidad Nacional e Internacional",
    tipoDocumental,
  }
}
