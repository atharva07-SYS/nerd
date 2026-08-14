import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const topics = await db.topic.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });

    let progressMap: Record<string, { status: string; drawnAt?: Date | null; completedAt?: Date | null }> = {};

    if (userId) {
      const userProgress = await db.userTopicProgress.findMany({
        where: { userId },
      });

      for (const p of userProgress) {
        progressMap[p.topicId] = {
          status: p.status,
          drawnAt: p.drawnAt,
          completedAt: p.completedAt,
        };
      }
    }

    const topicsWithProgress = topics.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      userStatus: progressMap[t.id]?.status || "available",
      drawnAt: progressMap[t.id]?.drawnAt || null,
      completedAt: progressMap[t.id]?.completedAt || null,
    }));

    // Extract unique categories
    const categories = Array.from(new Set(topics.map((t) => t.category)));

    return NextResponse.json({
      topics: topicsWithProgress,
      categories,
    });
  } catch (error) {
    console.error("GET /api/topics error:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}
