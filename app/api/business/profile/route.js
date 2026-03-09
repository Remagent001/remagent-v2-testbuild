import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load business profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profile, user, allIndustries] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { phone: true, timezone: true } }),
    prisma.industry.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ profile, user, allIndustries });
}

// PUT — save business profile
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const data = await request.json();

  await prisma.businessProfile.upsert({
    where: { userId },
    update: {
      businessName: data.businessName || null,
      industry: data.industry || null,
      website: data.website || null,
      linkedinUrl: data.linkedinUrl || null,
      fullAddress: data.fullAddress || null,
      country: data.country || null,
      state: data.state || null,
      city: data.city || null,
      zip: data.zip || null,
      phone: data.phone || null,
      otherIndustry: data.industry === "Other" ? (data.otherIndustry || null) : null,
    },
    create: {
      userId,
      businessName: data.businessName || null,
      industry: data.industry || null,
      website: data.website || null,
      linkedinUrl: data.linkedinUrl || null,
      fullAddress: data.fullAddress || null,
      country: data.country || null,
      state: data.state || null,
      city: data.city || null,
      zip: data.zip || null,
      phone: data.phone || null,
      otherIndustry: data.industry === "Other" ? (data.otherIndustry || null) : null,
    },
  });

  // Save phone and timezone to user record too
  const userUpdate = {};
  if (data.phone) userUpdate.phone = data.phone;
  if (data.timezone) userUpdate.timezone = data.timezone;
  if (Object.keys(userUpdate).length) {
    await prisma.user.update({ where: { id: userId }, data: userUpdate });
  }

  return NextResponse.json({ success: true });
}
