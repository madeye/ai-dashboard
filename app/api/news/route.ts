import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readNews } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await readNews();
  if (!data) {
    return NextResponse.json(
      { error: "no data yet, trigger POST /api/refresh" },
      { status: 404 }
    );
  }
  return NextResponse.json(data);
}
