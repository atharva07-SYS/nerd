import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE: Remove a note owned by current user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await params;
    const userId = session.user.id;

    const note = await db.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (note.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Not your note." }, { status: 403 });
    }

    await db.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/notes/[noteId] error:", error);
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
}
