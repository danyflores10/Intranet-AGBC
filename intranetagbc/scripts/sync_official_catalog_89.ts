import XLSX from 'xlsx';
import { db } from '../src/db';
import { documentos, documentoCategorias } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

async function sync() {
  console.log('=== INICIANDO SINCRONIZACIÓN CON CATÁLOGO OFICIAL 89 DOCS ===');
  const wb = XLSX.readFile('C:/Users/senol/.gemini/antigravity/brain/450e29d9-cd57-465f-b75c-30449ce49e62/.user_uploaded/media_1793214010315_d64f7826.xlsx');
  const ws = wb.Sheets['Catálogo AGBC'];
  const excelRows = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]).slice(6).filter(r => r && r[1]);
  console.log('Filas del catálogo oficial en Excel:', excelRows.length);

  // Mapeo canónico de familias y versiones
  const metaFamilia: Record<number, { familia: string; version: string; vigente: boolean }> = {
    // RE-SABS
    71: { familia: 'RE-SABS', version: 'v1.0', vigente: false },
    13: { familia: 'RE-SABS', version: 'v2.0', vigente: false },
    1:  { familia: 'RE-SABS', version: 'v3.0', vigente: true },

    // RE-SAP
    15: { familia: 'RE-SAP', version: 'v1.0', vigente: false },
    2:  { familia: 'RE-SAP', version: 'v2.0', vigente: true },

    // RE-SOA
    68: { familia: 'RE-SOA', version: 'v1.0', vigente: false },
    3:  { familia: 'RE-SOA', version: 'v2.0', vigente: true },

    // ETICA
    72: { familia: 'ETICA', version: 'v1.0', vigente: false },
    4:  { familia: 'ETICA', version: 'v2.0', vigente: true },
  };

  const existingDocs = await db.select().from(documentos);
  console.log('Documentos actuales en base de datos:', existingDocs.length);

  // Actualizar los 3 casos especiales con null correlativo
  for (const doc of existingDocs) {
    const t = doc.titulo.toLowerCase();
    if (doc.numeroCorrelativo === null) {
      if (t.includes('plantilla en sigec') || t.includes('sigec')) {
        await db.update(documentos).set({ numeroCorrelativo: 5 }).where(eq(documentos.id, doc.id));
        doc.numeroCorrelativo = 5;
      } else if (t.includes('transparencia y lucha contra la corrupcion') || t.includes('transparencia')) {
        await db.update(documentos).set({ numeroCorrelativo: 51 }).where(eq(documentos.id, doc.id));
        doc.numeroCorrelativo = 51;
      } else if (t.includes('organizacion administrativa') || t.includes('soa')) {
        await db.update(documentos).set({ numeroCorrelativo: 68 }).where(eq(documentos.id, doc.id));
        doc.numeroCorrelativo = 68;
      }
    }
  }

  // Ahora iterar sobre las 89 filas del Excel y actualizar por correlativo exacto
  const refreshedDocs = await db.select().from(documentos);
  const byNum = new Map<number, typeof refreshedDocs[0]>();
  refreshedDocs.forEach(d => {
    if (d.numeroCorrelativo) byNum.set(d.numeroCorrelativo, d);
  });

  for (const row of excelRows) {
    const num = Number(row[0]);
    const titulo = String(row[1] || '').trim();
    const direccion = String(row[2] || '').trim();
    const subarea = String(row[3] || '').trim();
    const tipo = String(row[4] || '').trim();
    const fecha = String(row[5] || '').trim();
    const formato = String(row[6] || '').trim().toUpperCase();
    const tamano = String(row[7] || '').trim();
    const check = String(row[9] || '').trim().toUpperCase();

    const familiaInfo = metaFamilia[num] || {
      familia: null,
      version: 'v1.0',
      vigente: true,
    };

    const disponibilidad = check === 'FALTA PDF' ? 'falta_archivo' : 'disponible';
    const match = byNum.get(num);

    if (match) {
      await db.update(documentos).set({
        numeroCorrelativo: num,
        titulo: titulo,
        tipoDocumental: tipo,
        fechaEmision: fecha,
        version: familiaInfo.version,
        esVigente: familiaInfo.vigente,
        familiaCodigo: familiaInfo.familia,
        disponibilidadArchivo: disponibilidad,
        tamano: tamano || match.tamano,
        tipoArchivo: formato || match.tipoArchivo,
        estado: 'publicado',
      }).where(eq(documentos.id, match.id));
    }
  }

  console.log('Sincronización completada con éxito.');
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
