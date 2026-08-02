import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runPipeline } from "@/lib/pipeline";
import { readNews } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPipeline();
    const data = await readNews();
    return NextResponse.json({
      ok: true,
      generatedAt: data?.generatedAt ?? result.generatedAt,
      count: data?.items.length ?? result.count,
      staleSources: result.staleSources,
    });
  } catch (error) {
    console.error("[api/refresh] refresh failed:", error);
    return NextResponse.json(
      { ok: false, error: "refresh failed; the previous snapshot was preserved" },
      { status: 502 }
    );
  }
}
