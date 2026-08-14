import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Reset token and new password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Look up reset token
    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    // Check token expiry
    if (resetRecord.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return NextResponse.json(
        { error: "This password reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find target user
    const user = await db.user.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Clean up reset token
    await db.passwordResetToken.deleteMany({
      where: { email: resetRecord.email },
    });

    return NextResponse.json({
      message: "Your password has been successfully updated. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
