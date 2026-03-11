import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT — change position status (for business users)
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const position = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Allowed transitions for business users
  const allowed = {
    // Once approved, can freely move between published/private/closed
    published: ["private", "closed"],
    private: ["published", "closed"],
    closed: ["published", "private"], // reopen without re-approval (was already approved)
    // Pending with review required can be resubmitted
    pending_approval: ["resubmit"],
  };

  const validTransitions = allowed[position.status] || [];

  if (status === "resubmit") {
    // Resubmit: clear the review flag, keep as pending_approval
    if (!position.reviewRequired) {
      return NextResponse.json({ error: "Not in review state" }, { status: 400 });
    }
    await prisma.position.update({
      where: { id },
      data: {
        reviewRequired: false,
        adminNote: null,
        resubmittedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  }

  if (!validTransitions.includes(status)) {
    return NextResponse.json({
      error: `Cannot change from ${position.status} to ${status}`,
    }, { status: 400 });
  }

  // When moving between published/private, also update visibility
  const updateData = { status };
  if (status === "published") {
    updateData.visibility = "public";
  } else if (status === "private") {
    updateData.visibility = "private";
  }

  await prisma.position.update({ where: { id }, data: updateData });

  return NextResponse.json({ success: true });
}
