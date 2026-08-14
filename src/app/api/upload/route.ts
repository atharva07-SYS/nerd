import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];

    for (const file of fileList) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique filename preserving extension
      const ext = path.extname(file.name) || ".jpg";
      const sanitizedName = file.name
        .replace(ext, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 30);
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls: savedUrls, message: "Upload successful" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image(s)." }, { status: 500 });
  }
}
