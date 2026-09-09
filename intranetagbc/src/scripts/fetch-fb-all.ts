import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const urls = [
  { url: "https://www.facebook.com/share/p/1Dp25iYwKv/", name: "fb_post_filatelica" },
  { url: "https://www.facebook.com/share/p/196w4ufyPc/", name: "fb_post_delivery" },
  { url: "https://www.facebook.com/share/r/19SHiCD6sx/", name: "fb_reel_logistica" },
  { url: "https://www.facebook.com/share/p/1CGBgVQnNy/", name: "fb_post_nueva_era" },
  { url: "https://www.facebook.com/profile.php?id=61592782342439", name: "fb_perfil_oficial" }
];

async function run() {
  for (const item of urls) {
    try {
      const res = await fetch(item.url, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        redirect: "follow"
      });
      const html = await res.text();
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                       html.match(/<meta name="twitter:image" content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)" property="og:image"/i);
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);

      console.log(`=== [${item.name}] ===`);
      console.log("Title:", titleMatch ? titleMatch[1] : "None");
      console.log("Desc:", descMatch ? descMatch[1].slice(0, 80) : "None");
      const imgUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, "&") : null;
      console.log("Image URL:", imgUrl);

      if (imgUrl) {
        const imgRes = await fetch(imgUrl, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1",
            "Accept": "image/*,*/*;q=0.8"
          }
        });
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const ext = imgUrl.includes(".png") ? ".png" : ".jpg";
          const dest = path.join(targetDir, `${item.name}${ext}`);
          fs.writeFileSync(dest, buf);
          console.log(`-> Saved: ${item.name}${ext} (${buf.length} bytes)`);
        }
      }
    } catch (e: any) {
      console.error(`Error with ${item.url}:`, e.message);
    }
  }
}

run();
