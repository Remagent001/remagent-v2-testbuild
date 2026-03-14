import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// UTC offsets in hours for our timezone values
const TZ_OFFSETS = {
  "Americas/Eastern": -5, "Americas/Central": -6, "Americas/Mountain": -7, "Americas/Pacific": -8,
  // IANA fallbacks (in case old data exists)
  "America/New_York": -5, "America/Chicago": -6, "America/Denver": -7, "America/Los_Angeles": -8,
  "America/Detroit": -5, "America/Boise": -7, "America/Phoenix": -7, "America/Anchorage": -9,
  "US/Eastern": -5, "US/Central": -6, "US/Mountain": -7, "US/Pacific": -8,
};

// Convert a time string like "09:00" to minutes since midnight in UTC, given a timezone
function toUtcMinutes(timeStr, tz) {
  const [h, m] = timeStr.split(":").map(Number);
  const localMin = h * 60 + m;
  const offset = (TZ_OFFSETS[tz] || -5) * 60; // default to Eastern
  return localMin - offset; // subtract offset to get UTC (e.g., 9AM Eastern = 9*60 - (-5*60) = 540+300 = 840 UTC min)
}

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
  const industryIds = searchParams.getAll("industry");
  const skillMode = searchParams.get("skillMode") || "and";
  const channelMode = searchParams.get("channelMode") || "and";
  const industryMode = searchParams.get("industryMode") || "and";
  const availableDays = searchParams.getAll("day");
  const dayStartParams = searchParams.getAll("dayStart"); // format: "monday:09:00"
  const dayEndParams = searchParams.getAll("dayEnd");     // format: "monday:17:00"

  // Build a map of day -> { start, end } for time-range filtering
  const dayTimeMap = {};
  dayStartParams.forEach((param) => {
    const idx = param.indexOf(":");
    const day = param.substring(0, idx);
    const time = param.substring(idx + 1);
    if (!dayTimeMap[day]) dayTimeMap[day] = {};
    dayTimeMap[day].start = time;
  });
  dayEndParams.forEach((param) => {
    const idx = param.indexOf(":");
    const day = param.substring(0, idx);
    const time = param.substring(idx + 1);
    if (!dayTimeMap[day]) dayTimeMap[day] = {};
    dayTimeMap[day].end = time;
  });
  const availMode = searchParams.get("availMode") || "overlap"; // "overlap" or "full"
  const searchTz = searchParams.get("searchTz") || "Americas/Eastern";
  const language = searchParams.get("language") || "";
  const degree = searchParams.get("degree") || "";
  const experience = searchParams.get("experience") || "";
  const environment = searchParams.get("environment") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20;

  // Build where clause
  const where = {
    role: "PROFESSIONAL",
    professionalProfile: { profileComplete: true },
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

  // Skills filter — AND (must have ALL) or OR (must have at least one)
  if (skillIds.length > 0) {
    if (skillMode === "or") {
      where.skills = { some: { skillId: { in: skillIds } } };
    } else {
      where.AND = [
        ...(where.AND || []),
        ...skillIds.map((id) => ({
          skills: { some: { skillId: id } },
        })),
      ];
    }
  }

  // Channels filter — AND or OR
  if (channelIds.length > 0) {
    if (channelMode === "or") {
      where.channels = { some: { channelId: { in: channelIds } } };
    } else {
      where.AND = [
        ...(where.AND || []),
        ...channelIds.map((id) => ({
          channels: { some: { channelId: id } },
        })),
      ];
    }
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

  // Industries filter — AND or OR
  if (industryIds.length > 0) {
    if (industryMode === "or") {
      where.industries = { some: { industryId: { in: industryIds } } };
    } else {
      where.AND = [
        ...(where.AND || []),
        ...industryIds.map((id) => ({
          industries: { some: { industryId: id } },
        })),
      ];
    }
  }

  // Availability filter — day-level in Prisma, time+timezone comparison in JS post-query
  if (availableDays.length > 0) {
    where.AND = [
      ...(where.AND || []),
      ...availableDays.map((day) => ({ availability: { some: { day } } })),
    ];
  }

  // Language filter — must speak this language
  if (language) {
    where.languages = { some: { language: { contains: language } } };
  }

  // Degree filter — must have this degree level
  if (degree) {
    where.education = { some: { degree: { contains: degree } } };
  }

  // Overall experience filter
  if (experience) {
    where.professionalProfile = {
      ...where.professionalProfile,
      isNot: null,
      overallExperience: experience,
    };
  }

  // Environment filter — work from home or office
  if (environment === "wfh") {
    where.environment = { ...where.environment, workFromHome: true };
  } else if (environment === "office") {
    where.environment = { ...where.environment, workFromOffice: true };
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
      timezone: true,
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
      industries: {
        select: { industry: { select: { id: true, name: true } }, experience: true },
      },
      availability: {
        select: { day: true, startTime: true, endTime: true },
      },
      languages: {
        select: { language: true, proficiency: true },
      },
      education: {
        select: { degree: true, institution: true, areaOfStudy: true },
      },
      environment: {
        select: { workFromHome: true, workFromOffice: true },
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

  // Apply timezone-aware availability time filter in memory
  if (availableDays.length > 0) {
    const hasTimeFilters = availableDays.some((d) => dayTimeMap[d]?.start && dayTimeMap[d]?.end);
    if (hasTimeFilters) {
      filtered = filtered.filter((pro) => {
        const proTz = pro.timezone || "Americas/Eastern";
        return availableDays.every((day) => {
          const searchTimes = dayTimeMap[day];
          if (!searchTimes?.start || !searchTimes?.end) {
            // No time filter for this day, just check day exists (already filtered by Prisma)
            return true;
          }
          // Find pro's availability for this day
          const proAvail = pro.availability?.find((a) => a.day === day);
          if (!proAvail) return false;

          // Convert both to UTC minutes for comparison
          const searchStartUtc = toUtcMinutes(searchTimes.start, searchTz);
          const searchEndUtc = toUtcMinutes(searchTimes.end, searchTz);
          const proStartUtc = toUtcMinutes(proAvail.startTime, proTz);
          const proEndUtc = toUtcMinutes(proAvail.endTime, proTz);

          if (availMode === "full") {
            // Pro must fully cover the search window
            return proStartUtc <= searchStartUtc && proEndUtc >= searchEndUtc;
          }
          // Overlap: pro.start < search.end AND pro.end > search.start
          return proStartUtc < searchEndUtc && proEndUtc > searchStartUtc;
        });
      });
    }
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
