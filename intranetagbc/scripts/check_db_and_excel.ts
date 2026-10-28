import XLSX from 'xlsx';
import { db } from '../src/db';
import { documentos } from '../src/db/schema';

async function check() {
  const wb = XLSX.readFile('C:/Users/senol/.gemini/antigravity/brain/450e29d9-cd57-465f-b75c-30449ce49e62/.user_uploaded/media_1793214010315_d64f7826.xlsx');
  const ws = wb.Sheets['Catálogo AGBC'];
  const excelRows = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]).slice(6).filter(r => r && r[1]);
  console.log('Excel rows count:', excelRows.length);

  const dbDocs = await db.select().from(documentos);
  console.log('DB docs count:', dbDocs.length);

  const excelMap = new Map();
  excelRows.forEach(r => {
    excelMap.set(Number(r[0]), {
      num: Number(r[0]),
      titulo: String(r[1] || '').trim(),
      direccion: String(r[2] || '').trim(),
      subcategoria: String(r[3] || '').trim(),
      tipo: String(r[4] || '').trim(),
      fecha: String(r[5] || '').trim(),
      check: String(r[9] || '').trim(),
    });
  });

  let matchNum = 0;
  let diffs: string[] = [];

  for (const d of dbDocs) {
    const ex = excelMap.get(d.numeroCorrelativo);
    if (!ex) {
      diffs.push(`DB doc ID ${d.id} with correlativo ${d.numeroCorrelativo} ("${d.titulo}") not found in Excel!`);
    } else {
      matchNum++;
      const dTitle = (d.titulo || '').trim().toLowerCase();
      const exTitle = ex.titulo.toLowerCase();
      if (dTitle !== exTitle) {
        diffs.push(`Correlativo ${d.numeroCorrelativo}: Title mismatch: DB="${d.titulo}" vs EXCEL="${ex.titulo}"`);
      }
      if ((d.fechaEmision || '').trim() !== ex.fecha) {
        diffs.push(`Correlativo ${d.numeroCorrelativo}: Date mismatch: DB="${d.fechaEmision}" vs EXCEL="${ex.fecha}"`);
      }
    }
  }

  console.log(`Matched by correlativo: ${matchNum} / ${dbDocs.length}`);
  console.log(`Total diffs: ${diffs.length}`);
  diffs.slice(0, 20).forEach(d => console.log('  -', d));
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});

