import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Fetch notes owned by current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all completed topics for this user
    const completedProgress = await db.userTopicProgress.findMany({
      where: { userId, status: "completed" },
      include: { topic: true },
      orderBy: { completedAt: "desc" },
    });

    // Get all user notes
    const notes = await db.note.findMany({
      where: { userId },
      include: { topic: true },
    });

    const noteMap = new Map(notes.map((n) => [n.topicId, n]));

    const completedTopicsWithNotes = completedProgress.map((p) => {
      const note = noteMap.get(p.topicId);
      let parsedUrls: string[] = [];
      if (note?.imageUrls) {
        try {
          parsedUrls = JSON.parse(note.imageUrls);
        } catch {
          parsedUrls = [note.imageUrls];
        }
      }

      return {
        progressId: p.id,
        topic: p.topic,
        completedAt: p.completedAt,
        note: note
          ? {
              id: note.id,
              imageUrls: parsedUrls,
              caption: note.caption,
              visibility: note.visibility,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ items: completedTopicsWithNotes });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Failed to fetch user notes" }, { status: 500 });
  }
}

// POST: Save or update handwritten notes for a completed topic
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { topicId, imageUrls, caption, visibility } = body;

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required." }, { status: 400 });
    }

    const safeImageUrls = Array.isArray(imageUrls) ? imageUrls : [];
    if (safeImageUrls.length === 0 && !caption) {
      return NextResponse.json({ error: "Please provide either handwritten note images or a caption summary." }, { status: 400 });
    }

    // Verify user has topic progress
    let progress = await db.userTopicProgress.findUnique({
      where: {
        userId_topicId: { userId, topicId },
      },
    });

    // If progress does not exist or is drawn, mark as completed
    if (!progress || progress.status !== "completed") {
      const now = new Date();
      progress = await db.userTopicProgress.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: { status: "completed", completedAt: now },
        create: { userId, topicId, status: "completed", completedAt: now },
      });
    }

    const cleanVisibility = visibility === "public" ? "public" : "private";
    const imageUrlsJson = JSON.stringify(safeImageUrls);

    // Save note
    const note = await db.note.upsert({
      where: {
        userId_topicId: { userId, topicId },
      },
      update: {
        imageUrls: imageUrlsJson,
        caption: caption || null,
        visibility: cleanVisibility,
      },
      create: {
        userId,
        topicId,
        imageUrls: imageUrlsJson,
        caption: caption || null,
        visibility: cleanVisibility,
      },
      include: {
        topic: true,
      },
    });

    return NextResponse.json({
      message: "Note saved successfully.",
      note: {
        ...note,
        imageUrls: JSON.parse(note.imageUrls),
      },
    });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Failed to save note." }, { status: 500 });
  }
}
