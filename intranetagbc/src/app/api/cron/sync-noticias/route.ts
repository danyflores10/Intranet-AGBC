import { NextResponse } from "next/server";
import { sincronizarNoticiasAuto } from "@/lib/services/news-sync-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await sincronizarNoticiasAuto();
  return NextResponse.json(result);
}
