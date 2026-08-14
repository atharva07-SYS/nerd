import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Retrieve current draw state & progress summary for logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current drawn topic if any
    const currentProgress = await db.userTopicProgress.findFirst({
      where: {
        userId,
        status: "drawn",
      },
      include: {
        topic: true,
      },
    });

    // Count user statuses
    const allProgress = await db.userTopicProgress.findMany({
      where: { userId },
    });

    const completedCount = allProgress.filter((p) => p.status === "completed").length;
    const totalTopics = await db.topic.count();
    const availableCount = totalTopics - completedCount - (currentProgress ? 1 : 0);

    // Fetch user draw log history
    const drawLogs = await db.drawLog.findMany({
      where: { userId },
      orderBy: { drawnAt: "desc" },
      take: 20,
      include: {
        topic: true,
      },
    });

    return NextResponse.json({
      currentDraw: currentProgress
        ? {
            id: currentProgress.id,
            topicId: currentProgress.topicId,
            status: currentProgress.status,
            drawnAt: currentProgress.drawnAt,
            topic: currentProgress.topic,
          }
        : null,
      stats: {
        total: totalTopics,
        available: availableCount,
        drawn: currentProgress ? 1 : 0,
        completed: completedCount,
      },
      drawLogs,
    });
  } catch (error) {
    console.error("GET /api/draw error:", error);
    return NextResponse.json({ error: "Failed to fetch draw status" }, { status: 500 });
  }
}

// POST: Draw a new random topic from available pool for logged-in user
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user already has an active drawn topic
    const existingDrawn = await db.userTopicProgress.findFirst({
      where: {
        userId,
        status: "drawn",
      },
      include: {
        topic: true,
      },
    });

    // If user already has a drawn topic, return it (they must complete or redraw it)
    if (existingDrawn) {
      return NextResponse.json({
        message: "Active draw already exists",
        currentDraw: {
          id: existingDrawn.id,
          topicId: existingDrawn.topicId,
          status: existingDrawn.status,
          drawnAt: existingDrawn.drawnAt,
          topic: existingDrawn.topic,
        },
      });
    }

    // Get list of completed topic IDs for this user
    const completedOrDrawnProgress = await db.userTopicProgress.findMany({
      where: {
        userId,
        status: { in: ["completed", "drawn"] },
      },
      select: { topicId: true },
    });

    const excludeTopicIds = completedOrDrawnProgress.map((p) => p.topicId);

    // Fetch available topics for this user
    const availableTopics = await db.topic.findMany({
      where: {
        id: { notIn: excludeTopicIds },
      },
    });

    if (availableTopics.length === 0) {
      return NextResponse.json(
        { error: "No available topics left to draw! You have completed all research topics." },
        { status: 400 }
      );
    }

    // Pick truly random index
    const randomIndex = Math.floor(Math.random() * availableTopics.length);
    const selectedTopic = availableTopics[randomIndex];

    const now = new Date();

    // Upsert UserTopicProgress to 'drawn'
    const newProgress = await db.userTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: selectedTopic.id,
        },
      },
      update: {
        status: "drawn",
        drawnAt: now,
      },
      create: {
        userId,
        topicId: selectedTopic.id,
        status: "drawn",
        drawnAt: now,
      },
      include: {
        topic: true,
      },
    });

    // Add entry to DrawLog
    await db.drawLog.create({
      data: {
        userId,
        topicId: selectedTopic.id,
        drawnAt: now,
      },
    });

    return NextResponse.json({
      currentDraw: {
        id: newProgress.id,
        topicId: newProgress.topicId,
        status: newProgress.status,
        drawnAt: newProgress.drawnAt,
        topic: newProgress.topic,
      },
      remainingCount: availableTopics.length - 1,
    });
  } catch (error) {
    console.error("POST /api/draw error:", error);
    return NextResponse.json({ error: "Failed to draw random topic" }, { status: 500 });
  }
}
