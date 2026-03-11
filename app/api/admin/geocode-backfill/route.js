import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_PLACES_API_KEY || "AIzaSyD9OjFLNi_ho76XkhNb8ICF1-YdI5fhCVQ"}`
    );
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
  } catch {}
  return null;
}

// POST — backfill lat/lng for all locations missing coordinates
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find locations without coordinates
  const locations = await prisma.location.findMany({
    where: {
      latitude: null,
      OR: [
        { fullAddress: { not: null } },
        { zip: { not: null } },
      ],
    },
  });

  let updated = 0;
  for (const loc of locations) {
    const query = loc.fullAddress || `${loc.zip}, ${loc.state || "US"}`;
    const coords = await geocodeAddress(query);
    if (coords) {
      await prisma.location.update({
        where: { id: loc.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
      updated++;
    }
  }

  return NextResponse.json({ success: true, total: locations.length, updated });
}
