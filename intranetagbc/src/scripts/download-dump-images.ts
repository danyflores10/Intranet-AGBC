import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";

async function main() {
  const html = fs.readFileSync("fb_profile_dump.html", "utf-8");

  // Regex to extract clean image URLs
  const rawUrls = html.match(/https:\\\/\\\/scontent[^\"]+\.jpg/gi) || [];
  const cleanUrls = Array.from(
    new Set(
      rawUrls.map(u => u.replace(/\\\//g, "/").replace(/&amp;/g, "&"))
    )
  );

  console.log(`Found ${cleanUrls.length} distinct scontent image URLs`);

  let index = 1;
  for (const url of cleanUrls) {
    // Only download reasonably sized images (not tiny icons)
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1",
          "Accept": "image/*"
        }
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 10000) { // greater than 10KB
          const filename = `fb_real_post_${index}.jpg`;
          fs.writeFileSync(path.join(targetDir, filename), buf);
          console.log(`Downloaded: ${filename} (${buf.length} bytes) - URL: ${url.slice(0, 80)}...`);
          index++;
        }
      }
    } catch (e: any) {
      console.error(`Error downloading ${url.slice(0, 50)}:`, e.message);
    }
  }
}

main();
