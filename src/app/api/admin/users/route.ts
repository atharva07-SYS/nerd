import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET: List all users with activity & metrics
export async function GET(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        progress: {
          select: {
            status: true,
            topic: { select: { title: true } },
          },
        },
        notes: {
          select: {
            id: true,
            visibility: true,
          },
        },
      },
    });

    const userList = users.map((u) => {
      const drawnCount = u.progress.filter((p) => p.status === "drawn").length;
      const completedCount = u.progress.filter((p) => p.status === "completed").length;
      const activeDrawTopic = u.progress.find((p) => p.status === "drawn")?.topic?.title || null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        drawnCount,
        completedCount,
        notesCount: u.notes.length,
        publicNotesCount: u.notes.filter((n) => n.visibility === "public").length,
        activeDrawTopic,
        isActive: drawnCount > 0 || completedCount > 0 || u.notes.length > 0,
      };
    });

    return NextResponse.json({ users: userList });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch user list." }, { status: 500 });
  }
}

// POST: Admin create new scholar user directly
export async function POST(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === "admin" ? "admin" : "user";

    const newUser = await db.user.create({
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

    return NextResponse.json({ user: newUser, message: "User account created successfully." }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
  }
}
