import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

// GET: Fetch ALL notes (Public & Private) for platform owner inspection
export async function GET(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const notes = await db.note.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        topic: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formatted = notes.map((n) => {
      let urls: string[] = [];
      try {
        urls = JSON.parse(n.imageUrls);
      } catch {
        urls = [n.imageUrls];
      }

      return {
        id: n.id,
        topic: n.topic,
        user: n.user,
        visibility: n.visibility,
        imageUrls: urls,
        caption: n.caption,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    });

    return NextResponse.json({ notes: formatted });
  } catch (error) {
    console.error("GET /api/admin/notes error:", error);
    return NextResponse.json({ error: "Failed to fetch all notes." }, { status: 500 });
  }
}

// DELETE: Owner delete any note
export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "noteId query param required" }, { status: 400 });
    }

    await db.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Note deleted successfully by Admin." });
  } catch (error) {
    console.error("DELETE /api/admin/notes error:", error);
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
}
