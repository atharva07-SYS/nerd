import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, adminSecretKey } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, password)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // High Security Admin Secret Key Verification
    let assignedRole = "user";
    const ownerSecret = process.env.ADMIN_SECRET_KEY || "the-draw-owner-secret-key-32-chars-minimum";

    if (adminSecretKey) {
      const isMatch =
        adminSecretKey.length === ownerSecret.length &&
        crypto.timingSafeEqual(Buffer.from(adminSecretKey), Buffer.from(ownerSecret));

      if (isMatch) {
        assignedRole = "admin";
      } else {
        return NextResponse.json(
          { error: "Invalid Owner Secret Key. Admin registration denied." },
          { status: 403 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send Welcome & Authentication Email
    await sendWelcomeEmail(cleanEmail, name.trim());

    return NextResponse.json({ user, message: "User registered & authenticated successfully." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
