import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const fbLinks = [
  { index: 1, url: "https://www.facebook.com/share/p/19ywEfjBZx/" },
  { index: 2, url: "https://www.facebook.com/share/r/19SHiCD6sx/" },
  { index: 3, url: "https://www.facebook.com/share/p/1CGBgVQnNy/" },
  { index: 4, url: "https://www.facebook.com/share/p/1BpKrpg1G5/" },
  { index: 5, url: "https://www.facebook.com/share/p/1Mn6iXVRAZ/" },
  { index: 6, url: "https://www.facebook.com/share/r/1CXAzSLJFN/" },
  { index: 7, url: "https://www.facebook.com/share/p/1GWv38q8XR/" },
  { index: 8, url: "https://www.facebook.com/share/r/1BiGr7LQYY/" },
  { index: 9, url: "https://www.facebook.com/share/p/1MNWL8W8dr/" },
  { index: 10, url: "https://www.facebook.com/share/p/1DqHUMa7gX/" },
  { index: 11, url: "https://www.facebook.com/share/r/1Dk54LrC3b/" },
  { index: 12, url: "https://www.facebook.com/share/p/19MxE3AbEp/" }
];

async function fetchAndDownload() {
  const results = [];

  for (const item of fbLinks) {
    console.log(`\nFetching [${item.index}] ${item.url}...`);
    try {
      const res = await fetch(item.url, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        redirect: "follow"
      });
      const html = await res.text();

      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                         html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                        html.match(/<meta name="description" content="([^"]+)"/i);
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                       html.match(/<meta name="twitter:image" content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)" property="og:image"/i);

      let title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : `Publicación de Correos de Bolivia #${item.index}`;
      let desc = descMatch ? descMatch[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : "Publicación oficial en redes sociales de la Agencia Boliviana de Correos.";
      const rawImgUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, "&") : null;

      const filename = `fb_exact_${item.index}.jpg`;
      const localPath = `/image/facebook/${filename}`;
      const dest = path.join(targetDir, filename);

      let downloaded = false;
      if (rawImgUrl) {
        try {
          const imgRes = await fetch(rawImgUrl, {
            headers: { "User-Agent": "facebookexternalhit/1.1" }
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            fs.writeFileSync(dest, buf);
            console.log(`✓ Saved ${filename} (${buf.length} bytes)`);
            downloaded = true;
          }
        } catch (e: any) {
          console.error(`Error downloading image for item ${item.index}:`, e.message);
        }
      }

      results.push({
        index: item.index,
        url: item.url,
        isReel: item.url.includes("/r/"),
        title,
        desc,
        rawImgUrl,
        localPath: downloaded ? localPath : (rawImgUrl || localPath)
      });
    } catch (e: any) {
      console.error(`Error fetching item ${item.index}:`, e.message);
    }
  }

  fs.writeFileSync("fb_extracted_data.json", JSON.stringify(results, null, 2));
  console.log("\nDone! Saved fb_extracted_data.json");
}

fetchAndDownload();
