import "dotenv/config";
import { sincronizarNoticiasAuto } from "../lib/services/news-sync-service";

async function main() {
  const res = await sincronizarNoticiasAuto();
  console.log("Sync output:", JSON.stringify(res, null, 2));
  process.exit(0);
}

main();
