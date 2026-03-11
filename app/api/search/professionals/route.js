import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Haversine distance in miles between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const zip = searchParams.get("zip") || "";
  const radius = parseInt(searchParams.get("radius")) || 0;
  const centerLat = parseFloat(searchParams.get("lat")) || 0;
  const centerLng = parseFloat(searchParams.get("lng")) || 0;
  const minRate = parseFloat(searchParams.get("minRate")) || 0;
  const maxRate = parseFloat(searchParams.get("maxRate")) || 0;
  const lastLoginDays = parseInt(searchParams.get("lastLogin")) || 0;
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20;

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

  // State filter — stored as 2-letter abbreviation (e.g. "CO")
  if (state) {
    where.location = { ...where.location, state };
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

  // For radius search, we need to get location coordinates too
  const locationSelect = { city: true, state: true, zip: true, latitude: true, longitude: true };

  // Run query
  const professionals = await prisma.user.findMany({
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
      location: { select: locationSelect },
      hourlyRate: { select: { regularRate: true } },
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
    take: 200, // Get more for radius filtering
  });

  // Apply radius filter in memory if zip + radius + coordinates provided
  let filtered = professionals;
  if (radius > 0 && centerLat && centerLng) {
    filtered = professionals.filter((p) => {
      if (!p.location?.latitude || !p.location?.longitude) return false;
      const dist = haversineDistance(centerLat, centerLng, p.location.latitude, p.location.longitude);
      p._distance = Math.round(dist);
      return dist <= radius;
    });
    // Sort by distance
    filtered.sort((a, b) => (a._distance || 999) - (b._distance || 999));
  }

  // Paginate
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return NextResponse.json({
    professionals: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
