import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    // Fetch all public notes
    const publicNotes = await db.note.findMany({
      where: {
        visibility: "public",
        ...(category ? { topic: { category } } : {}),
        ...(search
          ? {
              OR: [
                { caption: { contains: search } },
                { topic: { title: { contains: search } } },
                { user: { name: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        topic: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedNotes = publicNotes.map((note) => {
      let parsedUrls: string[] = [];
      try {
        parsedUrls = JSON.parse(note.imageUrls);
      } catch {
        parsedUrls = [note.imageUrls];
      }

      return {
        id: note.id,
        topic: note.topic,
        authorName: note.user.name || "Anonymous Scholar",
        imageUrls: parsedUrls,
        caption: note.caption,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    console.error("GET /api/explore error:", error);
    return NextResponse.json({ error: "Failed to fetch public feed" }, { status: 500 });
  }
}
