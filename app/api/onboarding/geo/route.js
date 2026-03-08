import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lat, lng } = await request.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { geoLat: lat, geoLng: lng },
  });

  return NextResponse.json({ success: true });
}
