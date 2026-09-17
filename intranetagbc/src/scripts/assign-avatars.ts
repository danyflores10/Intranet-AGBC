import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db, pool } from '../db/index';
import { personal, users, directivos } from '../db/schema';
import { eq, or } from 'drizzle-orm';

function normalizeStr(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Explicit mappings for special variations
const customAliases: Record<string, string> = {
  'brian maidana persona': 'briam maydana persona',
  'ismael jacko': 'jancko gutierres ismael',
  'mirha rafael': 'rafael juaniquina mirtha',
  'claudia aldunate r': 'claudia alejandra aldunate rocha',
  'ana balderrama': 'siles balderrama ana rosa',
  'patricia gomez': 'gomez gonzales silvia patricia',
  'emily andrea sarkey palenque': 'sharkey palenque emily andrea',
  'jheidy chavez': 'chavez gutierrez jheidy maria',
  'marco espinoza': 'marco antonio espinoza rojas',
  'lic walter ivan robles bernal': 'robles bernal walter ivan',
  'lic walter ivan robles bernal gerente general': 'robles bernal walter ivan',
  'lic abel gerson rojas penaloza': 'rojas penaloza abel gerson',
  'lic mario alberto chavez duchen': 'chavez duchen mario alberto',
  'patrick penaloza martinez': 'penaloza martinez patrick',
  'leonardo glen doria medina ochoa': 'doria medina ochoa leonardo glen',
  'sanchez santillan oscar 402529': 'sanchez santillan oscar',
  'roberto aguanta condori': 'aguanta condori roberto',
};

export async function assignAvatars() {
  console.log('🚀 Iniciando asignación de avatares a Personal, Usuarios y Directivos...');

  const avatarsBaseDir = path.join(process.cwd(), 'public', 'image', 'avatars');
  if (!fs.existsSync(avatarsBaseDir)) {
    console.error(`❌ Directorio de avatares no encontrado: ${avatarsBaseDir}`);
    return;
  }

  const filesList: Array<{ relPath: string; fileName: string; folder: string }> = [];

  function scan(dir: string, rel: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const curRel = path.join(rel, ent.name);
      if (ent.isDirectory()) {
        scan(full, curRel);
      } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(ent.name)) {
        filesList.push({
          relPath: curRel.replace(/\\/g, '/'),
          fileName: ent.name,
          folder: rel.replace(/\\/g, '/'),
        });
      }
    }
  }

  scan(avatarsBaseDir, '');
  console.log(`📁 ${filesList.length} imágenes de avatares encontradas en public/image/avatars/`);

  const allPersonal = await db.select().from(personal);
  const allUsers = await db.select().from(users);
  const allDirectivos = await db.select().from(directivos);

  let personalUpdatedCount = 0;
  let usersUpdatedCount = 0;
  let directivosUpdatedCount = 0;

  for (const f of filesList) {
    const rawName = path.parse(f.fileName).name;
    let normFile = normalizeStr(rawName);

    // Apply custom alias if present
    for (const [k, v] of Object.entries(customAliases)) {
      if (normFile.includes(k) || k.includes(normFile)) {
        normFile = v;
        break;
      }
    }

    const fileTokens = normFile.split(' ').filter(t => t.length >= 3 && !['lic', 'ing', 'dr', 'dra', 'gerente', 'general', 'encargado', 'nacional', 'distrital'].includes(t));
    const avatarUrl = `/image/avatars/${f.relPath}`;

    // Find personal matches
    const personalMatches = allPersonal.filter(p => {
      const normP = normalizeStr(p.nombre);
      if (normFile.length > 5 && (normP.includes(normFile) || normFile.includes(normP))) return true;
      const pTokens = normP.split(' ');
      let count = 0;
      for (const t of fileTokens) {
        if (pTokens.some(pt => pt === t || pt.startsWith(t) || t.startsWith(pt))) count++;
      }
      return count >= Math.min(2, fileTokens.length);
    });

    let matchedPerson: typeof personal.$inferSelect | undefined;

    if (personalMatches.length === 1) {
      matchedPerson = personalMatches[0];
    } else if (personalMatches.length > 1) {
      // Score matches
      let bestMatch = personalMatches[0];
      let bestScore = -1;
      for (const m of personalMatches) {
        const normP = normalizeStr(m.nombre);
        const pTokens = normP.split(' ');
        let score = 0;
        for (const t of fileTokens) {
          if (pTokens.includes(t)) score += 2;
          else if (pTokens.some(pt => pt.startsWith(t) || t.startsWith(pt))) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestMatch = m;
        }
      }
      matchedPerson = bestMatch;
    }

    // Update Personal & associated User
    if (matchedPerson) {
      await db.update(personal).set({ foto: avatarUrl }).where(eq(personal.id, matchedPerson.id));
      personalUpdatedCount++;

      // Find matching user by email or constructed name
      const pEmail = matchedPerson.email?.trim().toLowerCase();
      const matchedUser = allUsers.find(u => {
        const uEmailInst = u.institutionalEmail?.trim().toLowerCase();
        const uEmailPers = u.email?.trim().toLowerCase();
        const uFullName = [u.firstName, u.lastNamePaternal, u.lastNameMaternal].filter(Boolean).join(' ');
        return (
          (pEmail && uEmailInst === pEmail) ||
          (pEmail && uEmailPers === pEmail) ||
          normalizeStr(uFullName) === normalizeStr(matchedPerson!.nombre)
        );
      });

      if (matchedUser) {
        await db.update(users).set({ image: avatarUrl }).where(eq(users.id, matchedUser.id));
        usersUpdatedCount++;
      }
      console.log(`✅ [Personal & User] "${f.fileName}" -> ${matchedPerson.nombre} (${avatarUrl})`);
    }

    // Check directivos match
    const dirMatch = allDirectivos.find(d => {
      const normD = normalizeStr(d.nombre);
      if (normFile.length > 5 && (normD.includes(normFile) || normFile.includes(normD))) return true;
      const dTokens = normD.split(' ');
      let count = 0;
      for (const t of fileTokens) {
        if (dTokens.some(dt => dt === t || dt.startsWith(t) || t.startsWith(dt))) count++;
      }
      return count >= Math.min(2, fileTokens.length);
    });

    if (dirMatch) {
      await db.update(directivos).set({ foto: avatarUrl }).where(eq(directivos.id, dirMatch.id));
      directivosUpdatedCount++;
      console.log(`⭐ [Directivo] "${f.fileName}" -> ${dirMatch.nombre} (${dirMatch.cargo})`);
    }
  }

  console.log('\n=========================================');
  console.log(`🎉 Proceso completado exitosamente:`);
  console.log(`- Registros de Personal actualizados con foto: ${personalUpdatedCount}`);
  console.log(`- Registros de Usuarios actualizados con imagen de perfil: ${usersUpdatedCount}`);
  console.log(`- Registros de Directivos actualizados con foto: ${directivosUpdatedCount}`);
  console.log('=========================================\n');
}

import { fileURLToPath } from 'url';

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('assign-avatars.ts') ||
  process.argv[1].endsWith('assign-avatars.js') ||
  (import.meta.url && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
);

if (isDirectRun) {
  assignAvatars()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Error al asignar avatares:', err);
      pool.end();
      process.exit(1);
    });
}
