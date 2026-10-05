import { NextRequest, NextResponse } from "next/server";
import { listPsychologists } from "@/lib/psychologists";

// Directorio público, sin auth a propósito: lo consulta gente que todavía no
// tiene cuenta. La consulta y su select seguro viven en lib/psychologists.
export async function GET(req: NextRequest) {
  const results = await listPsychologists(req.nextUrl.searchParams.get("q") ?? "");
  return NextResponse.json(results);
}
