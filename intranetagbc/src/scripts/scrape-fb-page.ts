import fs from "fs";

async function main() {
  const profileUrl = "https://www.facebook.com/profile.php?id=61592782342439";
  try {
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    fs.writeFileSync("fb_profile_dump.html", html);
    console.log("Saved dump, size:", html.length);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

main();
