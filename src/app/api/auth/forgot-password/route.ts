import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success message even if email not found to prevent user enumeration attacks
      return NextResponse.json({
        message: "If an account exists for this email, password reset instructions have been sent.",
      });
    }

    // Generate secure single-use 64-character token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    // Delete existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Create new reset token
    await db.passwordResetToken.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(cleanEmail, resetUrl);

    return NextResponse.json({
      message: "Password reset instructions sent to your email.",
      resetUrl, // Included for convenient local testing
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ error: "Failed to process password reset request." }, { status: 500 });
  }
}
