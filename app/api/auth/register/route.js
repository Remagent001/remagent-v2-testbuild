import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function detectCountry(request) {
  try {
    const hdrs = headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : hdrs.get("x-real-ip") || "";
    if (!ip || ip === "127.0.0.1" || ip === "::1") return null;
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return data.countryCode || data.country || null;
    }
  } catch {}
  return null;
}

export async function POST(request) {
  try {
    const { firstName, lastName, email, password, role } = await request.json();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!["PROFESSIONAL", "BUSINESS"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Detect country from IP (non-blocking)
    const geoCountry = await detectCountry(request);

    // Create user + role-specific profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          ...(geoCountry ? { geoCountry } : {}),
        },
      });

      // Create the role-specific profile
      if (role === "PROFESSIONAL") {
        await tx.professionalProfile.create({
          data: { userId: newUser.id },
        });
      } else {
        await tx.businessProfile.create({
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
