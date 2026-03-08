import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "/www/wwwroot/remagent-v2/uploads";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON remove request
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.remove) {
        await prisma.businessProfile.update({
          where: { userId },
          data: { logo: null },
        });
        return NextResponse.json({ success: true });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Use JPG, PNG, GIF, or WebP." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 });
    }

    const dir = path.join(UPLOAD_DIR, "logos", userId);
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop().toLowerCase();
    const filename = `logo-${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const relativePath = `uploads/logos/${userId}/${filename}`;

    await prisma.businessProfile.upsert({
      where: { userId },
      update: { logo: relativePath },
      create: { userId, logo: relativePath },
    });

    return NextResponse.json({ success: true, path: relativePath });
  } catch (e) {
    console.error("Logo upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
