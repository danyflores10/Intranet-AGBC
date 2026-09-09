import fs from "fs";

async function fetchNews() {
  const query = encodeURIComponent('"Agencia Boliviana de Correos" OR "Correos de Bolivia" OR "AGBC"');
  const url = `https://news.google.com/rss/search?q=${query}&hl=es-419&gl=BO&ceid=BO:es-419`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const xml = await res.text();
    console.log("RSS Status:", res.status, "XML Length:", xml.length);

    // Simple item regex
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    const items = [];
    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const block = match[1];
      const title = (block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
      const link = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "";
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "";
      const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || "";
      items.push({ title, link, pubDate, source });
    }

    console.log(`Found ${items.length} news items from Bolivian press:`);
    items.forEach((item, idx) => {
      console.log(`[${idx+1}] ${item.title} (${item.source}) - ${item.pubDate}`);
    });
  } catch (e: any) {
    console.error("Error fetching news:", e.message);
  }
}

fetchNews();
