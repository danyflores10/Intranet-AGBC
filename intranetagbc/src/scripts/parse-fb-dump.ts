import fs from "fs";

async function parse() {
  const html = fs.readFileSync("fb_profile_dump.html", "utf-8");

  // Search for JSON blocks in script tags
  const scriptRegex = /<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const posts: any[] = [];
  const reels: any[] = [];

  // Also search for direct text / story patterns
  console.log("Searching in dump...");

  // Let's find post text snippets
  const textSnippets = html.match(/"text":"([^"]{20,500})"/g) || [];
  console.log(`Found ${textSnippets.length} text matches`);

  const uniqueTexts = new Set<string>();
  for (const s of textSnippets) {
    const clean = s.replace(/"text":"/, "").replace(/"$/, "");
    if (!clean.includes("\\n") && clean.length > 30) {
      uniqueTexts.add(clean);
    }
  }

  console.log(`Unique text count: ${uniqueTexts.size}`);
  Array.from(uniqueTexts).slice(0, 20).forEach((t, i) => console.log(`[${i+1}]`, t.slice(0, 100)));

  // Find image urls
  const imgUrls = html.match(/https:\\\/\\\/scontent[^\"]+\.jpg/gi) || [];
  console.log(`Found ${imgUrls.length} scontent images`);
}

parse();
