import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT — toggle visibility (public/private) without changing status
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { visibility } = await request.json();

  const position = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!["public", "private"].includes(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  await prisma.position.update({
    where: { id },
    data: { visibility },
  });

  return NextResponse.json({ success: true });
}
