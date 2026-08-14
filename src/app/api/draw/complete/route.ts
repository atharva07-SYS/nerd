import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { topicId } = body;

    let targetTopicId = topicId;

    if (!targetTopicId) {
      // Find currently drawn topic if topicId not provided
      const activeDraw = await db.userTopicProgress.findFirst({
        where: {
          userId,
          status: "drawn",
        },
      });

      if (!activeDraw) {
        return NextResponse.json(
          { error: "No active topic draw found to mark complete." },
          { status: 400 }
        );
      }
      targetTopicId = activeDraw.topicId;
    }

    const now = new Date();

    // Update status to 'completed'
    const updatedProgress = await db.userTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: targetTopicId,
        },
      },
      update: {
        status: "completed",
        completedAt: now,
      },
      create: {
        userId,
        topicId: targetTopicId,
        status: "completed",
        completedAt: now,
      },
      include: {
        topic: true,
      },
    });

    // Update latest DrawLog entry for this topic if present
    const latestLog = await db.drawLog.findFirst({
      where: {
        userId,
        topicId: targetTopicId,
      },
      orderBy: { drawnAt: "desc" },
    });

    if (latestLog) {
      await db.drawLog.update({
        where: { id: latestLog.id },
        data: { completedAt: now },
      });
    }

    return NextResponse.json({
      message: "Topic marked complete and locked.",
      completedProgress: updatedProgress,
    });
  } catch (error) {
    console.error("POST /api/draw/complete error:", error);
    return NextResponse.json({ error: "Failed to mark topic as complete." }, { status: 500 });
  }
}
