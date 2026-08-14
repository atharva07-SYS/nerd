import { NextResponse } from "next/server";
import { verifyAdminGuard } from "@/lib/adminGuard";
import { db } from "@/lib/db";
import crypto from "crypto";

// GET: Fetch active Owner Passkey
export async function GET(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const config = await db.ownerConfig.findUnique({
      where: { id: "owner_config" },
    });

    const activeKey = config?.ownerKey || process.env.ADMIN_SECRET_KEY || "the-draw-owner-secret-key-32-chars-minimum";

    return NextResponse.json({
      ownerKey: activeKey,
      updatedAt: config?.updatedAt || null,
    });
  } catch (error) {
    console.error("GET /api/admin/owner-key error:", error);
    return NextResponse.json({ error: "Failed to fetch Owner Key." }, { status: 500 });
  }
}

// POST: Generate or set custom Owner Passkey
export async function POST(req: Request) {
  try {
    const auth = await verifyAdminGuard(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { customKey } = body;

    let newKey = customKey ? customKey.trim() : "";

    if (!newKey) {
      // Generate 32-character random cryptographic passkey
      newKey = `KEY_${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
    }

    if (newKey.length < 8) {
      return NextResponse.json({ error: "Owner key must be at least 8 characters long." }, { status: 400 });
    }

    const updatedConfig = await db.ownerConfig.upsert({
      where: { id: "owner_config" },
      update: { ownerKey: newKey },
      create: { id: "owner_config", ownerKey: newKey },
    });

    return NextResponse.json({
      message: "Owner Passkey updated successfully.",
      ownerKey: updatedConfig.ownerKey,
      updatedAt: updatedConfig.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/admin/owner-key error:", error);
    return NextResponse.json({ error: "Failed to update Owner Key." }, { status: 500 });
  }
}
