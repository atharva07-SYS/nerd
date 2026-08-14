import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { userId } = await params;

    // Reset all status == 'drawn' to 'available' for this user
    const updated = await db.userTopicProgress.updateMany({
      where: {
        userId,
        status: "drawn",
      },
      data: {
        status: "available",
        drawnAt: null,
      },
    });

    return NextResponse.json({
      message: `Reset ${updated.count} active topic draw(s) for user.`,
    });
  } catch (error) {
    console.error("POST /api/admin/users/[userId]/reset error:", error);
    return NextResponse.json({ error: "Failed to reset active topic draw." }, { status: 500 });
  }
}
