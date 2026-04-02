import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — browse published job postings for professionals
// Only shows positions where the professional has ALL required skills
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim() || "";
  const state = searchParams.get("state") || "";
  const minRate = parseFloat(searchParams.get("minRate")) || 0;
  const maxRate = parseFloat(searchParams.get("maxRate")) || 0;
  const environment = searchParams.get("environment") || "";
  const contractType = searchParams.get("contractType") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = 20;

  // Get the professional's skill IDs
  const proSkills = await prisma.userSkill.findMany({
    where: { userId: session.user.id },
    select: { skillId: true },
  });
  const proSkillIds = proSkills.map((s) => s.skillId);

  // Find all published + public positions
  const where = {
    status: "published",
    visibility: "public",
  };

  // Keyword search
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }

  // Rate filter
  if (minRate > 0) where.regularRate = { ...where.regularRate, gte: minRate };
  if (maxRate > 0) where.regularRate = { ...where.regularRate, lte: maxRate };

  // Contract type filter
  if (contractType) where.contractType = contractType;

  // Environment filter
  if (environment) {
    if (environment === "home") {
      where.environment = { workLocation: { path: "$", array_contains: "home" } };
    } else if (environment === "office") {
      where.environment = { workLocation: { path: "$", array_contains: "office" } };
    }
    // For MySQL JSON, we'll filter in memory instead
    delete where.environment;
  }

  // Get positions with their required skills
  const positions = await prisma.position.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          businessProfile: {
            select: { businessName: true, logo: true, city: true, state: true, industry: true },
          },
        },
      },
      skills: {
        include: { skill: { select: { id: true, name: true } } },
      },
      channels: {
        include: { channel: { select: { id: true, name: true } } },
      },
      positionApps: {
        include: { application: { select: { id: true, name: true } } },
      },
      environment: true,
      availability: {
        select: { day: true, startTime: true, endTime: true },
      },
      applications: {
        where: { userId: session.user.id },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check skill match for each position (but don't filter them out)
  let filtered = positions.map((pos) => {
    const requiredSkills = pos.skills.filter((s) => s.requirement === "required");
    const hasAllRequired = requiredSkills.length === 0 || requiredSkills.every((rs) => proSkillIds.includes(rs.skill.id));
    const missingSkills = requiredSkills.filter((rs) => !proSkillIds.includes(rs.skill.id)).map((rs) => rs.skill.name);
    return { ...pos, _skillMatch: hasAllRequired, _missingSkills: missingSkills };
  });

  // Environment filter (in memory since MySQL JSON queries are limited)
  if (environment) {
    filtered = filtered.filter((pos) => {
      if (!pos.environment?.workLocation) return false;
      const locs = Array.isArray(pos.environment.workLocation)
        ? pos.environment.workLocation
        : (() => { try { return JSON.parse(pos.environment.workLocation); } catch { return []; } })();
      if (environment === "home") return locs.includes("home") || locs.includes("optional");
      if (environment === "office") return locs.includes("office") || locs.includes("mix");
      if (environment === "mix") return locs.includes("mix") || locs.includes("optional");
      return true;
    });
  }

  // State filter (business location)
  if (state) {
    filtered = filtered.filter((pos) => pos.user?.businessProfile?.state === state);
  }

  // Sort: matches first, then non-matches
  filtered.sort((a, b) => (b._skillMatch ? 1 : 0) - (a._skillMatch ? 1 : 0));

  // Format response — hide company info if showCompanyName is false
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  const jobs = paginated.map((pos) => {
    const biz = pos.user?.businessProfile;
    return {
      id: pos.id,
      title: pos.title,
      description: pos.description,
      regularRate: pos.regularRate,
      contractType: pos.contractType,
      startOption: pos.startOption,
      expectedStartDate: pos.expectedStartDate,
      expectedEndDate: pos.expectedEndDate,
      timezone: pos.timezone,
      showCompanyName: pos.showCompanyName,
      company: pos.showCompanyName
        ? { name: biz?.businessName, logo: biz?.logo, city: biz?.city, state: biz?.state, industry: biz?.industry }
        : { name: null, logo: null, city: biz?.city, state: biz?.state, industry: biz?.industry },
      skills: pos.skills.map((s) => ({ ...s.skill, requirement: s.requirement })),
      channels: pos.channels.map((c) => ({ ...c.channel, requirement: c.requirement })),
      apps: pos.positionApps.map((a) => ({ ...a.application, requirement: a.requirement })),
      environment: pos.environment,
      availability: pos.availability,
      screeningQuestions: pos.screeningQuestions,
      numberOfHires: pos.numberOfHires,
      createdAt: pos.createdAt,
      alreadyApplied: pos.applications.length > 0,
      applicationStatus: pos.applications[0]?.status || null,
      skillMatch: pos._skillMatch,
      missingSkills: pos._missingSkills || [],
    };
  });

  return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit) });
}
