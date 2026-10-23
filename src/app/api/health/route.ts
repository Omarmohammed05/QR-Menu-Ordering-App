import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
