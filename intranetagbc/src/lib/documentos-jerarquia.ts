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
        nombre: "Auditoría",
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
    descripcion: "Administración de recursos humanos, gestión presupuestaria, contable y activos",
    orden: 2,
    subcategorias: [
      {
        codigo: "DAF_RRHH",
        nombre: "Recursos Humanos",
        descripcion: "Administración de personal, bienestar social, inducción y reglamentos laborales",
        orden: 1,
      },
      {
        codigo: "DAF_CONTA",
        nombre: "Contabilidad Nacional e Internacional",
        descripcion: "Tesorería, recaudaciones, compras y activos fijos, presupuestos y fondo rotativo",
        orden: 2,
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
        codigo: "DC_IMC",
        nombre: "Relaciones I. M. C.",
        descripcion: "Relaciones Institucionales, Marketing y Comercial, atención de quejas y reclamos",
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
      subcategoriaNombre: "Auditoría",
      tipoDocumental,
    }
  }

  if (/legal|sumario|resoluciones.*admini|gescon/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Legal",
      tipoDocumental: /instructivo/i.test(norm) ? "Instructivos" : tipoDocumental,
    }
  }

  if (
    /personal|pasantia|refrigerio|ropa.*trabajo|fondo.*social|pasajes.*viaticos|administracion.*de.*perso/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Recursos Humanos",
      tipoDocumental,
    }
  }

  if (
    /queja|reclama|sireco|sigec|comercial|cn.*08|correspondencia|comite.*de.*reclamaciones/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Comercial",
      subcategoriaNombre: "Relaciones I. M. C.",
      tipoDocumental,
    }
  }

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

  if (
    /fondo.*rotativo|recaudacion|tributaria|vehicul|telefonia|orden.*de.*pago|cobranza|contratacion.*excepcion|contabilidad|presupuesto|tesoreria|cargos.*de.*cuenta|bienes.*y.*servicios|sabs|administrativa.*financiera/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Contabilidad Nacional e Internacional",
      tipoDocumental,
    }
  }

  if (/seguridad.*informacion/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Planificación",
      tipoDocumental,
    }
  }

  return {
    direccionNombre: "Dirección Administrativa Financiera",
    subcategoriaNombre: "Contabilidad Nacional e Internacional",
    tipoDocumental,
  }
}
