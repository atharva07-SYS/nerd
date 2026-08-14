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
      const activeDraw = await db.userTopicProgress.findFirst({
        where: {
          userId,
          status: "drawn",
        },
      });

      if (!activeDraw) {
        return NextResponse.json({ error: "No active topic draw found to skip." }, { status: 400 });
      }
      targetTopicId = activeDraw.topicId;
    }

    // Reset status back to 'available'
    await db.userTopicProgress.updateMany({
      where: {
        userId,
        topicId: targetTopicId,
        status: "drawn",
      },
      data: {
        status: "available",
        drawnAt: null,
      },
    });

    return NextResponse.json({ message: "Topic returned to available pool." });
  } catch (error) {
    console.error("POST /api/draw/redraw error:", error);
    return NextResponse.json({ error: "Failed to redraw topic." }, { status: 500 });
  }
}
