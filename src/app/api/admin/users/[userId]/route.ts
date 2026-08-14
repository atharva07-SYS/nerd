import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";

// DELETE user account as owner
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { userId } = await params;

    // Prevent deleting self from admin panel
    if (userId === auth.user?.id) {
      return NextResponse.json(
        { error: "Action prohibited: You cannot delete your own logged-in owner account." },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: `User ${targetUser.email} deleted successfully.` });
  } catch (error) {
    console.error("DELETE /api/admin/users/[userId] error:", error);
    return NextResponse.json({ error: "Failed to delete user account." }, { status: 500 });
  }
}

// PATCH update role or info
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { role, name } = body;

    const updateData: { role?: string; name?: string } = {};

    if (role) {
      updateData.role = role === "admin" ? "admin" : "user";
    }

    if (name) {
      updateData.name = name.trim();
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ message: "User account updated.", user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/admin/users/[userId] error:", error);
    return NextResponse.json({ error: "Failed to update user info." }, { status: 500 });
  }
}
