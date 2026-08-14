import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const fileList: File[] = [];
    if (files && files.length > 0) {
      fileList.push(...files.filter((f) => f && f.name));
    }
    if (singleFile && singleFile.name && !fileList.includes(singleFile)) {
      fileList.push(singleFile);
    }

    if (fileList.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];

    for (const file of fileList) {
      const ext = (path.extname(file.name) || "").toLowerCase();

      // Validate file extension or MIME type
      const isAllowedType =
        ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

      if (!isAllowedType) {
        return NextResponse.json(
          { error: `File type not supported (${file.name}). Please upload images or PDF files.` },
          { status: 400 }
        );
      }

      // Max size limit: 25MB
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File size exceeds 25MB limit (${file.name}).` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".pdf";
      const sanitizedName = file.name
        .replace(ext, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 30);
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}${safeExt}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls: savedUrls, message: "Upload successful" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file(s)." }, { status: 500 });
  }
}
