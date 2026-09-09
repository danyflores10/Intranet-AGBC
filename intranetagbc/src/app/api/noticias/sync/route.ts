import { NextResponse } from "next/server";
import { sincronizarNoticiasAuto } from "@/lib/services/news-sync-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await sincronizarNoticiasAuto();
    return NextResponse.json(res, { status: res.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await sincronizarNoticiasAuto();
    return NextResponse.json(res, { status: res.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
