import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

const validTables = [
  "User",
  "Topic",
  "UserTopicProgress",
  "DrawLog",
  "Note",
  "PasswordResetToken",
  "OwnerConfig",
];

// GET: Fetch table row counts and raw rows for selected model
export async function GET(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { searchParams } = new URL(req.url);
    const selectedTable = searchParams.get("table") || "User";

    // Row counts for all tables
    const counts: Record<string, number> = {
      User: await db.user.count(),
      Topic: await db.topic.count(),
      UserTopicProgress: await db.userTopicProgress.count(),
      DrawLog: await db.drawLog.count(),
      Note: await db.note.count(),
      PasswordResetToken: await db.passwordResetToken.count(),
      OwnerConfig: await db.ownerConfig.count(),
    };

    let rows: unknown[] = [];

    switch (selectedTable) {
      case "User":
        rows = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
        break;
      case "Topic":
        rows = await db.topic.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }], take: 100 });
        break;
      case "UserTopicProgress":
        rows = await db.userTopicProgress.findMany({ take: 100, include: { user: { select: { email: true } }, topic: { select: { title: true } } } });
        break;
      case "DrawLog":
        rows = await db.drawLog.findMany({ orderBy: { drawnAt: "desc" }, take: 100, include: { user: { select: { email: true } }, topic: { select: { title: true } } } });
        break;
      case "Note":
        rows = await db.note.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } }, topic: { select: { title: true } } } });
        break;
      case "PasswordResetToken":
        rows = await db.passwordResetToken.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
        break;
      case "OwnerConfig":
        rows = await db.ownerConfig.findMany({ take: 10 });
        break;
      default:
        rows = await db.user.findMany({ take: 100 });
    }

    return NextResponse.json({
      tables: validTables,
      counts,
      selectedTable,
      rows,
    });
  } catch (error) {
    console.error("GET /api/admin/db error:", error);
    return NextResponse.json({ error: "Failed to fetch database table records." }, { status: 500 });
  }
}

// DELETE: Delete record by tableName and ID
export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const body = await req.json();
    const { table, id } = body;

    if (!table || !id) {
      return NextResponse.json({ error: "table name and record id required" }, { status: 400 });
    }

    switch (table) {
      case "User":
        if (id === auth.user?.id) {
          return NextResponse.json({ error: "Cannot delete logged-in owner user account." }, { status: 400 });
        }
        await db.user.delete({ where: { id } });
        break;
      case "Topic":
        await db.topic.delete({ where: { id } });
        break;
      case "UserTopicProgress":
        await db.userTopicProgress.delete({ where: { id } });
        break;
      case "DrawLog":
        await db.drawLog.delete({ where: { id } });
        break;
      case "Note":
        await db.note.delete({ where: { id } });
        break;
      case "PasswordResetToken":
        await db.passwordResetToken.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    return NextResponse.json({ message: `Record ${id} deleted from ${table} successfully.` });
  } catch (error) {
    console.error("DELETE /api/admin/db error:", error);
    return NextResponse.json({ error: "Failed to delete record." }, { status: 500 });
  }
}
