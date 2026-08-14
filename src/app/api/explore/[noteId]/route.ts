import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const note = await db.note.findUnique({
      where: { id: noteId },
      include: {
        topic: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // Strict Privacy Check:
    // If note is private and current user is NOT the owner -> 403 Forbidden
    if (note.visibility === "private" && note.userId !== currentUserId) {
      return NextResponse.json(
        { error: "Access Restricted: This note is private." },
        { status: 403 }
      );
    }

    let parsedUrls: string[] = [];
    try {
      parsedUrls = JSON.parse(note.imageUrls);
    } catch {
      parsedUrls = [note.imageUrls];
    }

    return NextResponse.json({
      note: {
        id: note.id,
        topic: note.topic,
        authorName: note.user.name || "Anonymous Scholar",
        isOwner: note.userId === currentUserId,
        visibility: note.visibility,
        imageUrls: parsedUrls,
        caption: note.caption,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET /api/explore/[noteId] error:", error);
    return NextResponse.json({ error: "Failed to fetch note details" }, { status: 500 });
  }
}
