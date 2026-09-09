import fs from "fs";

const reels = [
  "https://www.facebook.com/share/r/19SHiCD6sx/",
  "https://www.facebook.com/share/r/1CXAzSLJFN/",
  "https://www.facebook.com/share/r/1BiGr7LQYY/",
  "https://www.facebook.com/share/r/1Dk54LrC3b/"
];

async function check() {
  for (const r of reels) {
    try {
      const res = await fetch(r, {
        headers: { "User-Agent": "facebookexternalhit/1.1" },
        redirect: "follow"
      });
      console.log("Original:", r, "Status:", res.status);
      const html = await res.text();
      const vidMatch = html.match(/<meta property="og:video" content="([^"]+)"/i) ||
                       html.match(/<meta property="og:video:url" content="([^"]+)"/i) ||
                       html.match(/<meta property="og:video:secure_url" content="([^"]+)"/i) ||
                       html.match(/<meta property="al:android:url" content="([^"]+)"/i);
      console.log("Video meta:", vidMatch ? vidMatch[1].slice(0, 100) : "None");
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i) ||
                             html.match(/<meta property="og:url" content="([^"]+)"/i);
      console.log("Canonical URL:", canonicalMatch ? canonicalMatch[1] : "None");
    } catch (e: any) {
      console.error("Error:", e.message);
    }
  }
}

check();
