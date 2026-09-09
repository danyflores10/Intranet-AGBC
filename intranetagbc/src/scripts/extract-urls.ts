import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";
const html = fs.readFileSync("fb_profile_dump.html", "utf-8");

const matches = html.match(/https:[^\"'<>\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
const unescaped = matches.map(m => m.replace(/\\\//g, '/').replace(/&amp;/g, '&'));
const unique = Array.from(new Set(unescaped)).filter(u => !u.includes("rsrc.php") && !u.includes("emoji.php"));

console.log(`Found ${unique.length} relevant media URLs`);

async function downloadMedia() {
  let count = 1;
  for (const u of unique) {
    try {
      const res = await fetch(u, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 5000) {
          const fn = `fb_feed_asset_${count}.jpg`;
          fs.writeFileSync(path.join(targetDir, fn), buf);
          console.log(`Saved [${count}] ${fn} (${buf.length} bytes) <- ${u.slice(0, 70)}`);
          count++;
        }
      }
    } catch (e: any) {
      // ignore
    }
  }
}

downloadMedia();
