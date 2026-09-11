import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMusicProvider } from "@/lib/music";

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid query" }, { status: 400 });
  }

  try {
    const provider = getMusicProvider();
    const results = await provider.search(parsed.data.q, 10);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[music/search] provider error", err);
    return NextResponse.json({ error: "Search temporarily unavailable" }, { status: 502 });
  }
}
