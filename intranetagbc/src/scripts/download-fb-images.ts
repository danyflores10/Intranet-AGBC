import fs from "fs";
import path from "path";

const targetDir = "c:/Users/senol/.gemini/antigravity/scratch/Intranet-AGBC-main/intranetagbc/public/image/facebook";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      }
    });
    if (!res.ok) {
      console.error(`Failed to download ${url}: ${res.status}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved: ${filename} (${buffer.length} bytes)`);
    return `/image/facebook/${filename}`;
  } catch (e: any) {
    console.error(`Error downloading ${url}:`, e.message);
    return null;
  }
}

async function main() {
  const images = [
    {
      url: "https://external.flpb1-1.fna.fbcdn.net/emg1/v/t13/16877909871638484429?url=https%3a%2f%2fpxcdn.reduno.com.bo%2freduno%2f092026%2f1788837191605.webp%3fextw%3djpg%26cw%3d600%26ch%3d365&fb_obo=1&utld=reduno.com.bo&dfr=1&stp=dst-jpg_p600x600_tt6&_nc_gid=2nHQnD5ReVN8yvLPx3xkzA&_nc_oc=AdqAny0CqCLDHqMQbrelMnpUHo6zx70mPZfqH2lkdsVDoNWxWWHYehLOikYDgHwDxKA&ccb=13-1&oh=06_Q3_DAanhWKS-3pR3LIAVgp6BPO_OKcB95FZcvqoAiWAnAW9x&oe=6AA248D4&_nc_sid=867500",
      filename: "fb_delivery_express.jpg"
    },
    {
      url: "https://scontent.flpb1-1.fna.fbcdn.net/v/t51.71878-15/798785176_2012646566054697_1126016242234491437_n.jpg?stp=dst-jpg_s1000x1200_tt6&_nc_cat=105&ccb=1-7&_nc_sid=c26028&_nc_ohc=GB9Rav7AIMQQ7kNvwGKTDhP&_nc_oc=AdoEKTP67h8QiDdhDbgGFLHBf9lI6J3AcMF0dlpa9mpK6OOAwkC0oGUoz1vBqoAG5pI&_nc_zt=23&_nc_ht=scontent.flpb1-1.fna&_nc_gid=KixzTj-MckUgpvrbe9e8Bg&_nc_ss=7f289&oh=00_AQI3IAwlT2n8PDd5Fg368mATWR3vtyav271Y8t8x3Cfrdw&oe=6AA62CA1",
      filename: "fb_reel_logistica.jpg"
    },
    {
      url: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=122115910773426078",
      filename: "fb_nueva_imagen.jpg"
    },
    {
      url: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=61592782342439",
      filename: "fb_profile_avatar.jpg"
    }
  ];

  for (const img of images) {
    await downloadImage(img.url, img.filename);
  }
}

main();
