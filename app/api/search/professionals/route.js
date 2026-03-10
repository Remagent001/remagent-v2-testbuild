import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — search professionals with filters
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Parse filters from query params
  const keyword = searchParams.get("keyword")?.trim() || "";
  const skillIds = searchParams.getAll("skill");
  const channelIds = searchParams.getAll("channel");
  const applicationIds = searchParams.getAll("application");
  const state = searchParams.get("state") || "";
  const city = searchParams.get("city") || "";
  const minRate = parseFloat(searchParams.get("minRate")) || 0;
  const maxRate = parseFloat(searchParams.get("maxRate")) || 0;
  const lastLoginDays = parseInt(searchParams.get("lastLogin")) || 0;
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    role: "PROFESSIONAL",
    professionalProfile: { isNot: null },
  };

  // Keyword search — match on name, title, or summary
  if (keyword) {
    where.OR = [
      { firstName: { contains: keyword } },
      { lastName: { contains: keyword } },
      { professionalProfile: { title: { contains: keyword } } },
      { professionalProfile: { summary: { contains: keyword } } },
    ];
  }

  // Location filters
  if (state) {
    where.location = { ...where.location, state: { contains: state } };
  }
  if (city) {
    where.location = { ...where.location, city: { contains: city } };
  }

  // Rate filter
  if (minRate > 0 || maxRate > 0) {
    where.hourlyRate = {};
    if (minRate > 0) where.hourlyRate.regularRate = { ...where.hourlyRate.regularRate, gte: minRate };
    if (maxRate > 0) where.hourlyRate.regularRate = { ...where.hourlyRate.regularRate, lte: maxRate };
  }

  // Last login filter
  if (lastLoginDays > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lastLoginDays);
    where.lastLogin = { gte: cutoff };
  }

  // Skills filter — must have ALL selected skills
  if (skillIds.length > 0) {
    where.AND = [
      ...(where.AND || []),
      ...skillIds.map((id) => ({
        skills: { some: { skillId: id } },
      })),
    ];
  }

  // Channels filter — must have ALL selected channels
  if (channelIds.length > 0) {
    where.AND = [
      ...(where.AND || []),
      ...channelIds.map((id) => ({
        channels: { some: { channelId: id } },
      })),
    ];
  }

  // Applications filter — must have ALL selected applications
  if (applicationIds.length > 0) {
    where.AND = [
      ...(where.AND || []),
      ...applicationIds.map((id) => ({
        applications: { some: { applicationId: id } },
      })),
    ];
  }

  // Run query and count in parallel
  const [professionals, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
        lastLogin: true,
        professionalProfile: {
          select: {
            title: true,
            summary: true,
            overallExperience: true,
            photoUrl: true,
          },
        },
        location: {
          select: { city: true, state: true },
        },
        hourlyRate: {
          select: { regularRate: true },
        },
        skills: {
          select: { skill: { select: { id: true, name: true } }, experience: true },
        },
        channels: {
          select: { channel: { select: { id: true, name: true } }, experience: true },
        },
        applications: {
          select: { application: { select: { id: true, name: true } }, experience: true },
        },
        availability: {
          select: { day: true, startTime: true, endTime: true },
        },
      },
      orderBy: [
        { lastLogin: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    professionals,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
