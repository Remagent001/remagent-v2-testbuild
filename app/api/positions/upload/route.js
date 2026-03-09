import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// POST — upload a document
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title") || "";
  const positionId = formData.get("positionId");

  if (!file || !positionId) {
    return NextResponse.json({ error: "File and positionId are required" }, { status: 400 });
  }

  // Verify ownership
  const position = await prisma.position.findUnique({
    where: { id: positionId, userId: session.user.id },
  });
  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  // Save file to public/uploads/positions/
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "positions");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${positionId}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const document = await prisma.document.create({
    data: {
      positionId,
      name: file.name,
      title: title || file.name,
      file: `/uploads/positions/${safeName}`,
    },
  });

  return NextResponse.json({ success: true, document });
}

// DELETE — remove a document
export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get("docId");

  if (!docId) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { position: true },
  });

  if (!doc || doc.position.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), "public", doc.file);
    await unlink(filePath);
  } catch {}

  await prisma.document.delete({ where: { id: docId } });

  return NextResponse.json({ success: true });
}

// PATCH — toggle isDefault
export async function PATCH(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId, isDefault } = await request.json();

  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { position: true },
  });

  if (!doc || doc.position.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.document.update({
    where: { id: docId },
    data: { isDefault: !!isDefault },
  });

  return NextResponse.json({ success: true });
}
