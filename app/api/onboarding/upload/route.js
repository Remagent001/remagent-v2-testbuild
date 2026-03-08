import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "/www/wwwroot/remagent-v2/uploads";

const ALLOWED = {
  resume: {
    mimes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/html", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    maxSize: 10 * 1024 * 1024, // 10MB
    dir: "resumes",
  },
  photo: {
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: 5 * 1024 * 1024, // 5MB
    dir: "photos",
  },
  video: {
    mimes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
    maxSize: 100 * 1024 * 1024, // 100MB
    dir: "videos",
  },
};

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // resume | photo | video

    if (!file || !type || !ALLOWED[type]) {
      return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
    }

    const config = ALLOWED[type];

    if (!config.mimes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (file.size > config.maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Create upload directory
    const dir = path.join(UPLOAD_DIR, config.dir, userId);
    await mkdir(dir, { recursive: true });

    // Generate safe filename
    const ext = file.name.split(".").pop().toLowerCase();
    const filename = `${type}-${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Save reference in DB
    const relativePath = `uploads/${config.dir}/${userId}/${filename}`;

    if (type === "resume") {
      await prisma.professionalProfile.update({
        where: { userId },
        data: { resume: relativePath },
      });
    } else if (type === "photo") {
      await prisma.professionalProfile.update({
        where: { userId },
        data: { photoUrl: relativePath },
      });
    } else if (type === "video") {
      await prisma.professionalProfile.update({
        where: { userId },
        data: { videoUrl: relativePath },
      });
    }

    return NextResponse.json({ success: true, path: relativePath, filename: file.name });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
