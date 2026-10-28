import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq } from "drizzle-orm"
import { calcularVersionesCatalogo, normalizarFamiliaCanonica, verificarDisponibilidadFisica } from "../lib/documentos-versionador"
import { obtenerFechaOficialDocumento } from "../lib/documentos-fechas-map"

// Lista de los 89 documentos enviada por el usuario en el Excel
const csvData = `21,Acta de Información en caso de Incautación de Envío Postal,Dirección de Operaciones,Desarrollo de Calidad,Formularios,23 de diciembre de 2019,XLSX,34.4 KB,Ver / Descargar Documento,
59,Acta de Reuniones,Dirección General Ejecutiva,Dirección General Ejecutiva,Actas,05 de septiembre de 2019,DOCX,74.9 KB,Ver / Descargar Documento,FALTA PDF
16,Catálogo de Artículos Peligrosos y Prohibidos,Dirección de Operaciones,Desarrollo de Calidad,Normativas,24 de diciembre de 2019,PDF,134.3 KB,Ver / Descargar Documento,
4,Codigo de etica,Dirección General Ejecutiva,Transparencia,Normativas,05 de febrero de 2026,PDF,11.8 MB,Ver / Descargar Documento,OK
72,Código De ética R.a. N 11.18,Dirección General Ejecutiva,Transparencia,Normativas,02 de abril de 2019,PDF,3.9 MB,Ver / Descargar Documento,OK
54,Ficha de Solicitud de Servicio Adicional en Casillas,Dirección de Operaciones,Desarrollo de Calidad,Formularios,10 de septiembre de 2019,XLSX,23.5 KB,Ver / Descargar Documento,
25,Ficha Técnica de Unidad yo Área,Dirección Administrativa Financiera,Recursos Humanos,Formularios,11 de diciembre de 2019,XLSX,33.1 KB,Ver / Descargar Documento,FALTA PDF
41,Ficha Técnica Vehicular,Dirección Administrativa Financiera,Bienes y Servicios,Formularios,24 de septiembre de 2019,XLSX,28.5 KB,Ver / Descargar Documento,FALTA PDF
26,Formulario de Denuncia por Negativa Injustificada de Acceso a la Información,Dirección General Ejecutiva,Transparencia,Formularios,11 de diciembre de 2019,XLSX,33.2 KB,Ver / Descargar Documento,
27,Formulario de Denuncia por Presuntos Actos de Corrupción,Dirección General Ejecutiva,Transparencia,Formularios,11 de diciembre de 2019,XLSX,33.1 KB,Ver / Descargar Documento,
23,Formulario de Quejas,Dirección Comercial,Relaciones I. M. C.,Formularios,23 de diciembre de 2019,XLSX,31.5 KB,Ver / Descargar Documento,
20,Formulario de Reclamación Directa,Dirección Comercial,Relaciones I. M. C.,Formularios,23 de diciembre de 2019,XLSX,32.6 KB,Ver / Descargar Documento,
18,Formulario de Rendición de Cuentas - Fondo Rotativo,Dirección Administrativa Financiera,Tesorería,Formularios,24 de diciembre de 2019,XLSX,44.6 KB,Ver / Descargar Documento,FALTA PDF
74,Formulario de Solicitud de Mantenimiento y Reparación Vehicular,Dirección Administrativa Financiera,Bienes y Servicios,Formularios,2019,XLSX,44.7 KB,Ver / Descargar Documento,FALTA PDF
22,Formulario de Solicitud de Reclamación Postal Internacional,Dirección Comercial,Relaciones I. M. C.,Formularios,23 de diciembre de 2019,XLSX,32.7 KB,Ver / Descargar Documento,
19,Formulario para la ejecución de recursos del Fondo Rotativo,Dirección Administrativa Financiera,Tesorería,Formularios,24 de diciembre de 2019,XLSX,31.0 KB,Ver / Descargar Documento,FALTA PDF
58,Formulario para la Revisión de Documentos Normativos,Dirección General Ejecutiva,Planificación,Formularios,05 de septiembre de 2019,XLSX,36.4 KB,Ver / Descargar Documento,FALTA PDF
42,Formulario Solicitud de Vehículo,Dirección Administrativa Financiera,Bienes y Servicios,Formularios,24 de septiembre de 2019,XLSX,97.3 KB,Ver / Descargar Documento,FALTA PDF
75,Formulario único De Reclamos CN-08,Dirección Comercial,Relaciones I. M. C.,Formularios,2019,DOC,113.0 KB,Ver / Descargar Documento,
53,Gestión de Cambio de Chapas,Dirección Administrativa Financiera,Bienes y Servicios,Formularios,10 de septiembre de 2019,XLSX,30.2 KB,Ver / Descargar Documento,
48,Guia De Usuario SIGEC,Dirección Administrativa Financiera,Sistemas,Guía de Usuario,21 de septiembre de 2019,PDF,9.6 MB,Ver / Descargar Documento,OK
67,Instructivo Operativo Para La Emisión De Resoluciones Administrativas,Dirección General Ejecutiva,Legal,Instructivos,13 de junio de 2019,PDF,1.0 MB,Ver / Descargar Documento,OK
55,Kardex llaves blancas,Dirección Administrativa Financiera,Bienes y Servicios,Formularios,10 de septiembre de 2019,XLSX,27.5 KB,Ver / Descargar Documento,
34,Manual de Funciones Profesional de Planificación,Dirección General Ejecutiva,Planificación,Manuales,14 de noviembre de 2019,PDF,120.3 KB,Ver / Descargar Documento,OK
14,Manual De Procesos Y Procedimientos De Pagos Con Orden De Pago Vía SIGEP,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Manuales,13 de febrero de 2020,PDF,2.7 MB,Ver / Descargar Documento,OK
8,Manual de Usuario de Sistema Contratos GESCON,Dirección Administrativa Financiera,Sistemas,Manual de Usuario,18 de septiembre de 2024,PDF,1.5 MB,Ver / Descargar Documento,OK
6,Manual de Usuario de Sistema de Casillas “SENCA”,Dirección Administrativa Financiera,Sistemas,Manual de Usuario,04 de diciembre de 2024,PDF,961.2 KB,Ver / Descargar Documento,OK
7,Manual de Usuario de Sistema de Seguimiento de Paquetería Postal para Mejora del Servicio del Control y Despacho de Envíos a Nivel Nacional “TRACKINGBO”,Dirección Administrativa Financiera,Sistemas,Manual de Usuario,,PDF,1.3 MB,Ver / Descargar Documento,OK
9,Manual de Usuario de Sistema SIRECO,Dirección Administrativa Financiera,Sistemas,Manual de Usuario,2024,PDF,2.0 MB,Ver / Descargar Documento,FALTA PDF
70,Manual Organizacional Administrativa Financiera,Dirección Administrativa Financiera,Recursos Humanos,Manuales,27 de mayo de 2019,PDF,6.7 MB,Ver / Descargar Documento,OK
43,Manual Organizacional Dirección Comercial,Dirección Comercial,Relaciones I. M. C.,Manuales,21 de septiembre de 2019,PDF,3.5 MB,Ver / Descargar Documento,OK
49,Manual Organizacional Dirección de Operaciones,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Manuales,21 de septiembre de 2019,PDF,7.1 MB,Ver / Descargar Documento,FALTA PDF
45,Manual Organizacional Unidad de Auditoría Interna,Dirección General Ejecutiva,Auditoría,Manuales,21 de septiembre de 2019,PDF,3.1 MB,Ver / Descargar Documento,OK
46,Manual Organizacional Unidad de Planificación,Dirección General Ejecutiva,Planificación,Manuales,21 de septiembre de 2019,PDF,2.9 MB,Ver / Descargar Documento,OK
44,Manual Organizacional Unidad de Transparencia y Lucha Contra la Corrupción,Dirección General Ejecutiva,Transparencia,Manuales,21 de septiembre de 2019,PDF,3.3 MB,Ver / Descargar Documento,OK
47,Manual Organizacional Unidad Legal,Dirección General Ejecutiva,Legal,Manuales,21 de septiembre de 2019,PDF,2.3 MB,Ver / Descargar Documento,OK
28,Matriz de Diagnóstico Organizacional Prospectivo,Dirección General Ejecutiva,Planificación,Formularios,11 de diciembre de 2019,XLSX,29.6 KB,Ver / Descargar Documento,OK
24,Matriz de Diagnóstico Organizacional Retrospectivo,Dirección General Ejecutiva,Planificación,Formularios,11 de diciembre de 2019,XLSX,34.8 KB,Ver / Descargar Documento,OK
56,Notificación de Evento en Casilla Postal,Dirección de Operaciones,Desarrollo de Calidad,Formularios,10 de septiembre de 2019,XLSX,24.3 KB,Ver / Descargar Documento,
80,Organigrama Institucional,Dirección Administrativa Financiera,Recursos Humanos,Normativas,21 de noviembre de 2018,PDF,1.3 MB,Ver / Descargar Documento,OK
65,Politica De Calidad,Dirección General Ejecutiva,Planificación,Normativas,13 de junio de 2019,PDF,870.2 KB,Ver / Descargar Documento,OK
66,Politica Organizacional Y De Gestion Por Procesos,Dirección General Ejecutiva,Planificación,Normativas,13 de junio de 2019,PDF,1.2 MB,Ver / Descargar Documento,OK
62,Politica Para La Seguridad De La Información Y Las Comunicaciones,Dirección Administrativa Financiera,Sistemas,Normativas,21 de agosto de 2019,PDF,4.5 MB,Ver / Descargar Documento,OK
83,Procedimiento De Cobranza R.a. 30.18,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Procedimiento,11 de octubre de 2018,PDF,2.5 MB,Ver / Descargar Documento,OK
61,"Procedimiento De Comunicación Interna, Manejo De La Correspondencia Y Material De Presentación",Dirección Comercial,Relaciones I. M. C.,Procedimiento,21 de agosto de 2019,PDF,16.5 MB,Ver / Descargar Documento,no se encuentra el pdf en el intranet
86,Procedimiento De Contratación Por Excepción R.a. 17.18,Dirección Administrativa Financiera,Contrataciones y Presupuestos,Procedimiento,24 de agosto de 2018,PDF,1.2 MB,Ver / Descargar Documento,OK
85,Procedimiento De Recaudación De Recursos Por Venta De Servicios Postales R.a. 21.18,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Procedimiento,10 de septiembre de 2018,PDF,2.5 MB,Ver / Descargar Documento,OK
60,Procedimiento Para El Control De Casillas Postales,Dirección de Operaciones,Desarrollo de Calidad,Procedimiento,04 de septiembre de 2019,PDF,14.8 MB,Ver / Descargar Documento,OK
29,Procedimiento Para El Control De Inspecciones De La FELCN Y Correspondencia Retenida,Dirección de Operaciones,Desarrollo de Calidad,Procedimiento,06 de diciembre de 2019,PDF,2.5 MB,Ver / Descargar Documento,CORREGIR - DIRECCIÓN OPERACIONES
50,Procedimiento Para El Control De Vehículos,Dirección Administrativa Financiera,Bienes y Servicios,Procedimiento,20 de septiembre de 2019,PDF,5.6 MB,Ver / Descargar Documento,OK
36,Procedimiento Para El Control Y Dotación De Sellos Postales A Las Oficinas Regionales,Dirección Comercial,Relaciones I. M. C.,Procedimiento,18 de octubre de 2019,PDF,11.0 MB,Ver / Descargar Documento,OK
32,"Procedimiento Para El Diagnóstico, Diseño Y Rediseño Organizacional",Dirección General Ejecutiva,Planificación,Procedimiento,05 de diciembre de 2019,PDF,15.1 MB,Ver / Descargar Documento,OK
39,Procedimiento Para El Manejo Y Control De La Recaudacion,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Procedimiento,14 de octubre de 2019,PDF,6.0 MB,Ver / Descargar Documento,OK
33,Procedimiento Para El Tratamiento De Denuncias A Transparencia,Dirección General Ejecutiva,Transparencia,Procedimiento,02 de diciembre de 2019,PDF,8.6 MB,Ver / Descargar Documento,OK
35,"Procedimiento Para El Uso, Mantenimiento Y Reparación De Los Equipos Escáner De Rayos X",Dirección Administrativa Financiera,Bienes y Servicios,Procedimiento,30 de octubre de 2019,PDF,12.0 MB,Ver / Descargar Documento,OK
40,Procedimiento Para La Administración Del Fondo Rotativo,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Procedimiento,08 de octubre de 2019,PDF,15.1 MB,Ver / Descargar Documento,OK
57,Procedimiento Para La Asignacion Y Control De Uso De Telefonos Y Fax,Dirección Administrativa Financiera,Bienes y Servicios,Procedimiento,09 de septiembre de 2019,PDF,18.0 MB,Ver / Descargar Documento,OK
30,Procedimiento Para La Atención Y Tratamiento De Quejas Y Reclamaciones,Dirección Comercial,Relaciones I. M. C.,Procedimiento,06 de diciembre de 2019,PDF,9.6 MB,Ver / Descargar Documento,OK
63,RA 40 Aprobación de Manuales Organizacionales,Dirección General Ejecutiva,Planificación,Manuales,08 de agosto de 2019,PDF,646.9 KB,Ver / Descargar Documento,OK
17,Recibo de Retención Tributaria,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Formularios,24 de diciembre de 2019,XLSX,25.5 KB,Ver / Descargar Documento,FALTA PDF
79,Reglamento De Administración De Recursos Del Fondo Social,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,23 de noviembre de 2018,PDF,5.0 MB,Ver / Descargar Documento,ok
89,Reglamento De Fondo Rotativo AGBC,Dirección Administrativa Financiera,Tesorería,Reglamentos,14 de mayo de 2018,PDF,6.9 MB,Ver / Descargar Documento,ok
51,Reglamento de la Unidad de Transparencia y Lucha Contra la Corrupción,Dirección General Ejecutiva,Transparencia,Reglamentos,20 de septiembre de 2019,PDF,1.7 MB,Ver / Descargar Documento,OK
12,Reglamento De Pasajes Y Viaticos,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,23 de noviembre de 2021,PDF,833.4 KB,Ver / Descargar Documento,FALTA PDF
64,Reglamento De Rezagos R.a. N 33.19,Dirección de Operaciones,Desarrollo de Calidad,Reglamentos,04 de julio de 2019,PDF,506.2 KB,Ver / Descargar Documento,OK
87,Reglamento Del Procedimiento Operativo De Control Aduanero De Los Envíos Internacionales R.a. N 16.18,Dirección de Operaciones,Desarrollo de Calidad,Reglamentos,21 de agosto de 2018,PDF,6.5 MB,Ver / Descargar Documento,OK
10,Reglamento Especifico De Proceso Sumario Agencia Boliviana De Correos,Dirección General Ejecutiva,Legal,Reglamentos Específicos,14 de enero de 2022,PDF,1.1 MB,Ver / Descargar Documento,OK
13,Reglamento Especifico del Sistema de Administración de Bienes y Servicios - RE-SABS,Dirección Administrativa Financiera,Contrataciones y Presupuestos,Reglamentos Específicos,16 de junio de 2021,PDF,4.8 MB,Ver / Descargar Documento,ok
1,Reglamento Específico del Sistema de Administracion de Bienes y Servicios (RE-SABS),Dirección Administrativa Financiera,Contrataciones y Presupuestos,Reglamentos Específicos,05 de agosto de 2026,PDF,4.1 MB,Ver / Descargar Documento,ok
71,Reglamento Especifico Del Sistema De Administración De Bienes Y Servicios R.a. N° 013 . 2019,Dirección Administrativa Financiera,Contrataciones y Presupuestos,Reglamentos Específicos,07 de mayo de 2019,PDF,7.1 MB,Ver / Descargar Documento,ok
2,Reglamento Especifico del Sistema de Administración de Personal,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos Específicos,05 de agosto de 2026,PDF,3.0 MB,Ver / Descargar Documento,ok
15,Reglamento Especifico Del Sistema De Administración De Personal RE-SAP,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos Específicos,13 de enero de 2020,PDF,15.5 MB,Ver / Descargar Documento,ok
76,Reglamento Especifico Del Sistema De Contabilidad Integrada R.a. N° 048. 2018,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Reglamentos Específicos,31 de diciembre de 2018,PDF,4.3 MB,Ver / Descargar Documento,ok
3,Reglamento Específico del Sistema de Organización Administrativa (RE-SOA),Dirección General Ejecutiva,Planificación,Reglamentos Específicos,05 de mayo de 2026,PDF,13.0 MB,Ver / Descargar Documento,OK
68,Reglamento Especifico Del Sistema De Organización Administrativa RE-SOA,Dirección General Ejecutiva,Planificación,Reglamentos Específicos,11 de junio de 2019,PDF,5.0 MB,Ver / Descargar Documento,OK
78,Reglamento Especifico Del Sistema De Presupuestos R.a. N° 41. 2018,Dirección Administrativa Financiera,Contrataciones y Presupuestos,Reglamentos Específicos,03 de diciembre de 2018,PDF,3.0 MB,Ver / Descargar Documento,ok
81,Reglamento Especifico Del Sistema De Programación De Operaciones R.a. N° 35. 2018,Dirección General Ejecutiva,Planificación,Reglamentos Específicos,12 de noviembre de 2018,PDF,3.2 MB,Ver / Descargar Documento,OK
77,Reglamento Especifico Del Sistema De Tesorería R.a. N° 047. 2018,Dirección Administrativa Financiera,Tesorería,Reglamentos Específicos,31 de diciembre de 2018,PDF,3.0 MB,Ver / Descargar Documento,ok
11,Reglamento Especifico para Cumplimiento Oportuno de la Declaración Jurada de Bienes y Rentas,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos Específicos,29 de noviembre de 2021,PDF,10.9 MB,Ver / Descargar Documento,ok
82,Reglamento Interno De Cargos De Cuenta,Dirección Administrativa Financiera,Contabilidad Nacional e Internacional,Reglamentos,22 de octubre de 2018,PDF,4.5 MB,Ver / Descargar Documento,ok
88,Reglamento Interno De Pasantia AGBC,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,29 de junio de 2018,PDF,5.8 MB,Ver / Descargar Documento,ok
52,Reglamento Interno De Personal,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,16 de septiembre de 2019,PDF,10.5 MB,Ver / Descargar Documento,ok
31,Reglamento Interno Del Comité De Reclamaciones,Dirección Comercial,Relaciones I. M. C.,Reglamentos,06 de diciembre de 2019,PDF,1.6 MB,Ver / Descargar Documento,OK
69,Reglamento Interno Para El Pago De Refrigerios R.a. N 23.19,Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,05 de junio de 2019,PDF,2.1 MB,Ver / Descargar Documento,ok
84,"Reglamento Interno Para La Adquisición, Dotación Y Uso De Ropa De Trabajo, Equipo Y Uniforme R.a. N 28.18",Dirección Administrativa Financiera,Recursos Humanos,Reglamentos,03 de octubre de 2018,PDF,1.6 MB,Ver / Descargar Documento,ok
37,Reporte Consolidado de Recaudación Diaria Regional,Dirección Administrativa Financiera,Tesorería,Formularios,16 de octubre de 2019,XLSX,28.8 KB,Ver / Descargar Documento,FALTA PDF
38,Reporte Individual de Recaudación Diaria,Dirección Administrativa Financiera,Tesorería,Formularios,16 de octubre de 2019,XLSX,49.9 KB,Ver / Descargar Documento,FALTA PDF
73,T y C de alquiler de casillas - Ficha de Asignación,Dirección de Operaciones,Desarrollo de Calidad,Formularios,2019,DOC,158.5 KB,Ver / Descargar Documento,
5,TUTORIAL Para Generar Plantilla En SIGEC,Dirección Administrativa Financiera,Sistemas,Tutorial,31 de diciembre de 2025,PDF,700.1 KB,Ver / Descargar Documento,FALTA PDF`

function normText(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
}

async function main() {
  console.log("Sincronizando metadatos de versionamiento y correlativos para los 89 documentos...")
  const docsDb = await db.select().from(documentos)
  const catsDb = await db.select().from(documentoCategorias)

  const lines = csvData.split("\n").filter(l => l.trim().length > 0)
  const excelRows: any[] = []

  for (const line of lines) {
    const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)
    if (!matches) continue
    const fields = matches.map(m => m.replace(/^,/, "").replace(/^"|"$/g, "").trim())
    excelRows.push({
      num: parseInt(fields[0], 10),
      titulo: fields[1],
      direccion: fields[2],
      subarea: fields[3],
      categoria: fields[4],
      fecha: fields[5] || "",
      formato: fields[6] || "PDF",
      tamano: fields[7] || "",
      check: fields[9] || "",
    })
  }

  // Pre-calcular versiones para los 89 ítems del catálogo oficial
  const versionados = calcularVersionesCatalogo(
    excelRows.map(r => ({
      numeroCorrelativo: r.num,
      titulo: r.titulo,
      fechaEmision: r.fecha,
      subcategoriaId: r.subarea,
    }))
  )

  const mapVersionadosPorNum = new Map<number, typeof versionados[0]>()
  for (const v of versionados) {
    if (v.item.numeroCorrelativo) {
      mapVersionadosPorNum.set(v.item.numeroCorrelativo, v)
    }
  }

  // Actualizar cada documento en base de datos
  let actualizados = 0
  for (const row of excelRows) {
    // Buscar coincidencia en DB: primero por título exacto/normalizado, o por número de archivo doc_0XX
    const normTituloRow = normText(row.titulo)
    let docEnDb = docsDb.find(d => normText(d.titulo) === normTituloRow)

    if (!docEnDb) {
      // Probar si el archivo contiene el número (ej: doc_021_... para Nº 21)
      const padNum = String(row.num).padStart(3, "0")
      docEnDb = docsDb.find(d => d.archivo?.includes(`doc_${padNum}_`))
    }

    if (!docEnDb) {
      // Probar similitud de título
      docEnDb = docsDb.find(d => {
        const dbNorm = normText(d.titulo)
        return dbNorm.includes(normTituloRow.slice(0, 25)) || normTituloRow.includes(dbNorm.slice(0, 25))
      })
    }

    if (!docEnDb) {
      console.warn(`[AVISO] No se encontró en BD el documento Nº ${row.num}: "${row.titulo}"`)
      continue
    }

    const vInfo = mapVersionadosPorNum.get(row.num)
    const ver = vInfo ? vInfo.version : "v1.0"
    const esVig = vInfo ? vInfo.esVigente : true
    const famCod = vInfo ? vInfo.familiaCodigo : normalizarFamiliaCanonica(row.titulo).replace(/\s+/g, "-")

    // Verificar si el archivo existe físicamente
    const disponibilidad = verificarDisponibilidadFisica(docEnDb.archivo)
    const esFaltaReportado = row.check.toUpperCase().includes("FALTA") || row.check.toLowerCase().includes("no se encuentra")
    const disponibilidadFinal = (!disponibilidad.disponible || esFaltaReportado) ? "falta_archivo" : "disponible"

    await db
      .update(documentos)
      .set({
        numeroCorrelativo: row.num,
        fechaEmision: row.fecha || docEnDb.fechaEmision || "Sin fecha fija",
        version: ver,
        esVigente: esVig,
        familiaCodigo: famCod,
        disponibilidadArchivo: disponibilidadFinal,
        updatedAt: new Date(),
      })
      .where(eq(documentos.id, docEnDb.id))

    actualizados++
  }

  console.log(`\n¡Sincronización completada! ${actualizados} documentos actualizados con versión, estado de vigencia, código de familia y número correlativo.`)
  process.exit(0)
}

main().catch(err => {
  console.error("Error sincronizando metadatos:", err)
  process.exit(1)
})
