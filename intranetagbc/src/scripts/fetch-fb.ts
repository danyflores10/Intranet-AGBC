async function fetchOg(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const html = await res.text();
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:image"/i);
    const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:title"/i);
    const ogDescMatch = html.match(/property="og:description"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:description"/i);

    return {
      url,
      title: ogTitleMatch ? ogTitleMatch[1].replace(/&amp;/g, '&') : null,
      image: ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : null,
      desc: ogDescMatch ? ogDescMatch[1].replace(/&amp;/g, '&') : null,
    };
  } catch (e: any) {
    return { url, error: e.message };
  }
}

async function main() {
  const urls = [
    "https://www.facebook.com/share/p/196w4ufyPc/",
    "https://www.facebook.com/share/r/19SHiCD6sx/",
    "https://www.facebook.com/share/p/1CGBgVQnNy/",
    "https://www.facebook.com/share/p/1Dp25iYwKv/",
    "https://www.facebook.com/profile.php?id=61592782342439",
  ];

  for (const u of urls) {
    const data = await fetchOg(u);
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
