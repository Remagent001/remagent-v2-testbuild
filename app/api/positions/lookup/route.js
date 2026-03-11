import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load skills and channels for the position form
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [allSkills, allChannels, allApplications, allIndustries] = await Promise.all([
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
    prisma.application.findMany({ orderBy: { name: "asc" } }),
    prisma.industry.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ allSkills, allChannels, allApplications, allIndustries });
}
