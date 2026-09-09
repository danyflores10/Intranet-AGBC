import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 12 distinct, high quality images representing the Facebook posts & reels of Correos de Bolivia
const fbMediaList = [
  {
    name: "fb_alerta_estafa.jpg",
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop" // Security / Alert
  },
  {
    name: "fb_ventanilla_sabado.jpg",
    url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?q=80&w=800&auto=format&fit=crop" // Counter customer service
  },
  {
    name: "fb_flota_transporte.jpg",
    url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop" // Yellow delivery vans & trucks
  },
  {
    name: "fb_cartero_reparto.jpg",
    url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=800&auto=format&fit=crop" // Mail courier & parcels
  },
  {
    name: "fb_filatelia_coleccion.jpg",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop" // Historic stamps collection
  },
  {
    name: "fb_casillas_postales.jpg",
    url: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=800&auto=format&fit=crop" // PO Boxes lockers
  },
  {
    name: "fb_pymes_exporta.jpg",
    url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop" // Global export packages
  },
  {
    name: "fb_transmision_vivo.jpg",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop" // Live press conference
  },
  {
    name: "fb_requisitos_terceros.jpg",
    url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop" // Identification & pick up
  }
];

async function downloadAll() {
  for (const item of fbMediaList) {
    const dest = path.join(targetDir, item.name);
    try {
      const res = await fetch(item.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`Saved: ${item.name} (${buf.length} bytes)`);
      }
    } catch (e: any) {
      console.error(`Error saving ${item.name}:`, e.message);
    }
  }
}

downloadAll();
