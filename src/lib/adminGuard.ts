import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export interface AdminGuardResult {
  authorized: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Enterprise Security Guard verifying Admin Session & Owner Secret Key
 */
export async function verifyAdminGuard(req?: Request): Promise<AdminGuardResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { authorized: false, error: "Unauthorized: Active session required.", statusCode: 401 };
  }

  // 1. Session Role Check
  if (session.user.role !== "admin") {
    return { authorized: false, error: "Forbidden: Owner / Admin clearance required.", statusCode: 403 };
  }

  // 2. Database Role Re-Verification
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "admin") {
    return { authorized: false, error: "Forbidden: Account lacks admin clearance in database.", statusCode: 403 };
  }

  // 3. Optional Secret Header Verification (if passed in request header)
  if (req) {
    const providedKey = req.headers.get("x-admin-secret-key");
    const ownerSecret = process.env.ADMIN_SECRET_KEY;

    if (providedKey && ownerSecret) {
      const isMatch =
        providedKey.length === ownerSecret.length &&
        crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(ownerSecret));

      if (!isMatch) {
        return { authorized: false, error: "Forbidden: Invalid Admin Secret Key header.", statusCode: 403 };
      }
    }
  }

  return { authorized: true, user };
}
