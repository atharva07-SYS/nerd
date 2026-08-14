import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { query } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Raw SQL query string required." }, { status: 400 });
    }

    const cleanQuery = query.trim();

    let result: unknown;

    if (cleanQuery.toUpperCase().startsWith("SELECT") || cleanQuery.toUpperCase().startsWith("PRAGMA")) {
      result = await db.$queryRawUnsafe(cleanQuery);
    } else {
      const affectedRows = await db.$executeRawUnsafe(cleanQuery);
      result = { affectedRows, message: "Query executed successfully." };
    }

    return NextResponse.json({
      query: cleanQuery,
      result,
    });
  } catch (error) {
    console.error("POST /api/admin/db/query error:", error);
    const msg = error instanceof Error ? error.message : "SQL query execution failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
