import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
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
      return NextResponse.json({ error: "Note not found." }, { status: 44 });
    }

    if (note.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Not your note." }, { status: 403 });
    }

    const newVisibility = note.visibility === "public" ? "private" : "public";

    const updatedNote = await db.note.update({
      where: { id: noteId },
      data: { visibility: newVisibility },
      include: { topic: true },
    });

    return NextResponse.json({
      message: `Note visibility updated to ${newVisibility}.`,
      visibility: newVisibility,
      note: {
        ...updatedNote,
        imageUrls: JSON.parse(updatedNote.imageUrls),
      },
    });
  } catch (error) {
    console.error("Toggle visibility error:", error);
    return NextResponse.json({ error: "Failed to update note visibility." }, { status: 500 });
  }
}
