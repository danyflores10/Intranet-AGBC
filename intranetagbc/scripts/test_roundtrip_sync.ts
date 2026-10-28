import XLSX from 'xlsx';
import { db } from '../src/db';
import { documentos } from '../src/db/schema';
import { obtenerCodigoFamiliaCanonica, calcularVersionesCatalogo } from '../src/lib/documentos-versionador';
import { clasificarDocumento } from '../src/lib/documentos-jerarquia';
import { obtenerFechaOficialDocumento } from '../src/lib/documentos-fechas-map';

function normalizar(val?: string | null): string {
  if (!val) return "";
  return val
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function testRoundtrip() {
  console.log('=== TEST DE PARIDAD Y ROUNDTRIP EXPORTACIÓN / IMPORTACIÓN ===');
  const dbDocs = await db.select().from(documentos);
  console.log('Total documentos en BD:', dbDocs.length);

  // 1. Simular exportación a Excel
  const rows: any[][] = [
    ["AGENCIA BOLIVIANA DE CORREOS - CORREOS DE BOLIVIA (AGBC)"],
    ["CATÁLOGO GENERAL DE DOCUMENTOS, NORMATIVAS Y REGLAMENTOS OFICIALES"],
    ["Fecha de generación del reporte:", "28 de octubre de 2026"],
    ["Total Documentos Registrados:", dbDocs.length],
    [],
    [
      "Nº",
      "TÍTULO DEL DOCUMENTO",
      "DIRECCIÓN",
      "SUB-ÁREA",
      "CATEGORÍA / TIPO",
      "FECHA DE EMISIÓN / OFICIAL",
      "CÓDIGO DE FAMILIA",
      "VERSIÓN",
      "ESTADO DE VIGENCIA",
      "ESTADO DE ARCHIVO DIGITAL",
      "ENLACE AL DOCUMENTO"
    ]
  ];

  dbDocs.forEach((d, idx) => {
    const numCorrelativo = d.numeroCorrelativo || idx + 1;
    const fechaOficial = d.fechaEmision || "";
    const jerarquia = clasificarDocumento(d.archivo || d.nombreArchivo, d.titulo);
    const direccion = d.direccionId || jerarquia.direccionNombre;
    const subcategoria = d.subcategoriaId || jerarquia.subcategoriaNombre;
    const tipoDoc = d.tipoDocumental || jerarquia.tipoDocumental;
    const familiaCod = d.familiaCodigo || obtenerCodigoFamiliaCanonica(d.titulo) || "—";
    const versionStr = d.version || "v1.0";
    const vigenciaStr = d.esVigente !== false ? "Vigente" : "Histórico";
    const disponibilidadStr = d.disponibilidadArchivo === "falta_archivo" ? "FALTA PDF" : "DISPONIBLE";

    rows.push([
      numCorrelativo,
      d.titulo,
      direccion,
      subcategoria,
      tipoDoc,
      fechaOficial || "Sin fecha fija",
      familiaCod,
      versionStr,
      vigenciaStr,
      disponibilidadStr,
      d.archivo ? "Ver / Descargar Documento" : "—"
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Catálogo AGBC");

  // 2. Simular lectura e importación del archivo generado
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const readWb = XLSX.read(buffer, { type: "buffer" });
  const sheet = readWb.Sheets["Catálogo AGBC"];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Encontrar headers
  let headerRowIndex = 5;
  const headers = (rawData[headerRowIndex] || []).map(h => String(h || "").trim().toLowerCase());
  const dataRows = rawData.slice(headerRowIndex + 1);

  const colNum = headers.findIndex(h => h.includes("nº") || h.includes("n°"));
  const colTitulo = headers.findIndex(h => h.includes("título") || h.includes("titulo"));
  const colDireccion = headers.findIndex(h => h.includes("dirección") || h.includes("direccion"));
  const colSub = headers.findIndex(h => h.includes("sub-área") || h.includes("sub-area"));
  const colTipo = headers.findIndex(h => h.includes("categoría") || h.includes("categoria") || h.includes("tipo"));
  const colFecha = headers.findIndex(h => h.includes("fecha"));
  const colFamilia = headers.findIndex(h => h.includes("familia"));
  const colVersion = headers.findIndex(h => h.includes("versión") || h.includes("version"));
  const colVigencia = headers.findIndex(h => h.includes("vigencia"));
  const colCheck = headers.findIndex(h => h.includes("archivo") || h.includes("check"));

  const existingByNum = new Map<number, typeof dbDocs[0]>();
  dbDocs.forEach(d => {
    if (d.numeroCorrelativo) existingByNum.set(d.numeroCorrelativo, d);
  });

  let evaluados = 0;
  let nuevos = 0;
  let modificados = 0;
  let sinCambios = 0;
  let faltaPdf = 0;
  const diffDetails: string[] = [];

  for (const row of dataRows) {
    if (!row || !row[colTitulo]) continue;
    evaluados++;

    const num = row[colNum] ? Number(row[colNum]) : undefined;
    const titulo = String(row[colTitulo] || "").trim();
    const rawFamilia = colFamilia !== -1 ? String(row[colFamilia] || "").trim() : "";
    const rawVersion = colVersion !== -1 ? String(row[colVersion] || "").trim() : "";
    const rawVigencia = colVigencia !== -1 ? String(row[colVigencia] || "").trim() : "";
    const rawFecha = colFecha !== -1 ? String(row[colFecha] || "").trim() : "";
    const rawCheck = colCheck !== -1 ? String(row[colCheck] || "").trim() : "";

    const docExistente = num ? existingByNum.get(num) : undefined;
    if (!docExistente) {
      nuevos++;
      continue;
    }

    const diffs: string[] = [];
    if (rawVersion && docExistente.version && docExistente.version !== rawVersion) {
      diffs.push(`Versión: ${docExistente.version} ➔ ${rawVersion}`);
    }
    if (rawVigencia && docExistente.esVigente !== undefined) {
      const esVig = rawVigencia.toLowerCase().includes("vigente");
      if (docExistente.esVigente !== esVig) {
        diffs.push(`Vigencia: ${docExistente.esVigente} ➔ ${esVig}`);
      }
    }
    if (rawFamilia && rawFamilia !== "—" && docExistente.familiaCodigo && docExistente.familiaCodigo !== rawFamilia) {
      diffs.push(`Familia: ${docExistente.familiaCodigo} ➔ ${rawFamilia}`);
    }

    if (rawCheck.includes("FALTA")) faltaPdf++;

    if (diffs.length > 0) {
      modificados++;
      diffDetails.push(`Nº ${num} "${titulo}": ${diffs.join(", ")}`);
    } else {
      sinCambios++;
    }
  }

  console.log(`Resultados Roundtrip:`);
  console.log(`  Evaluados:   ${evaluados}`);
  console.log(`  Nuevos:      ${nuevos}`);
  console.log(`  Modificados: ${modificados}`);
  console.log(`  Sin Cambios: ${sinCambios}`);
  console.log(`  Falta PDF:   ${faltaPdf}`);

  if (diffDetails.length > 0) {
    console.log('Detalles de diferencias encontradas:');
    diffDetails.forEach(d => console.log('  -', d));
  }

  if (evaluados === 89 && nuevos === 0 && modificados === 0 && sinCambios === 89) {
    console.log('✅ ÉXITO TOTAL: Paridad 100% alcanzada (0 falsos cambios).');
  } else {
    console.error('❌ ADVERTENCIA: Se encontraron diferencias no deseadas.');
  }

  process.exit(0);
}

testRoundtrip().catch(console.error);

