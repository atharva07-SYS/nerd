import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const totalUsers = await db.user.count();
    const totalTopics = await db.topic.count();

    const activeUserProgress = await db.userTopicProgress.groupBy({
      by: ["userId"],
    });
    const activeUsersCount = activeUserProgress.length;
    const inactiveUsersCount = totalUsers - activeUsersCount;

    const totalNotes = await db.note.count();
    const publicNotes = await db.note.count({ where: { visibility: "public" } });
    const privateNotes = await db.note.count({ where: { visibility: "private" } });

    const completedProgressCount = await db.userTopicProgress.count({
      where: { status: "completed" },
    });
    const drawnProgressCount = await db.userTopicProgress.count({
      where: { status: "drawn" },
    });

    const topCompletedTopics = await db.userTopicProgress.groupBy({
      by: ["topicId"],
      where: { status: "completed" },
      _count: { topicId: true },
      orderBy: { _count: { topicId: "desc" } },
      take: 5,
    });

    const topicIds = topCompletedTopics.map((t) => t.topicId);
    const topicsMap = await db.topic.findMany({
      where: { id: { in: topicIds } },
    });

    const topRankedTopics = topCompletedTopics.map((t) => {
      const topicObj = topicsMap.find((tp) => tp.id === t.topicId);
      return {
        topicId: t.topicId,
        title: topicObj?.title || "Unknown Topic",
        category: topicObj?.category || "General",
        completedCount: t._count.topicId,
      };
    });

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsersCount,
          inactive: inactiveUsersCount,
        },
        topics: {
          masterTotal: totalTopics,
          totalCompleted: completedProgressCount,
          totalActiveDrawn: drawnProgressCount,
        },
        notes: {
          total: totalNotes,
          public: publicNotes,
          private: privateNotes,
        },
        topTopics: topRankedTopics,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats." }, { status: 500 });
  }
}
