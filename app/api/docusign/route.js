import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createMsaEnvelope, createProfessionalEnvelope, getSigningUrl, getEnvelopeStatus } from "@/lib/docusign";

// POST — initiate DocuSign signing ceremony
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await request.json(); // "msa" or "professional"

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        businessProfile: true,
        professionalProfile: true,
        location: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const signerEmail = user.email;
    const signerName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    // For BU, use business address; for PU, use personal location
    const bizProfile = user.businessProfile;
    const address = bizProfile?.fullAddress
      || [bizProfile?.city, bizProfile?.state, bizProfile?.zip].filter(Boolean).join(", ")
      || user.location?.fullAddress
      || [user.location?.city, user.location?.state].filter(Boolean).join(", ");


    let envelopeId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3020";
    const returnUrl = `${appUrl}/api/docusign/callback?type=${type}`;

    if (type === "msa" && user.role === "BUSINESS") {
      const companyName = user.businessProfile?.businessName || "";

      if (user.businessProfile?.agreementSigned) {
        return NextResponse.json({ error: "Agreement already signed" }, { status: 400 });
      }

      // Check for existing envelope — only reuse if completed
      if (user.businessProfile?.docusignEnvelopeId) {
        try {
          const status = await getEnvelopeStatus(user.businessProfile.docusignEnvelopeId);
          if (status === "completed") {
            await prisma.businessProfile.update({
              where: { userId: user.id },
              data: { agreementSigned: true, agreementSignedAt: new Date() },
            });
            return NextResponse.json({ alreadySigned: true });
          }
        } catch {}
        // Always create a fresh envelope so latest profile data is used
        envelopeId = null;
      }

      if (!envelopeId) {
        envelopeId = await createMsaEnvelope({ signerEmail, signerName, companyName, address });
        await prisma.businessProfile.update({
          where: { userId: user.id },
          data: { docusignEnvelopeId: envelopeId },
        });
      }
    } else if (type === "professional" && user.role === "PROFESSIONAL") {
      if (user.professionalProfile?.agreementSigned) {
        return NextResponse.json({ error: "Agreement already signed" }, { status: 400 });
      }

      if (user.professionalProfile?.docusignEnvelopeId) {
        try {
          const status = await getEnvelopeStatus(user.professionalProfile.docusignEnvelopeId);
          if (status === "completed") {
            await prisma.professionalProfile.update({
              where: { userId: user.id },
              data: { agreementSigned: true, agreementSignedAt: new Date() },
            });
            return NextResponse.json({ alreadySigned: true });
          }
        } catch {}
        envelopeId = null;
      }

      if (!envelopeId) {
        envelopeId = await createProfessionalEnvelope({ signerEmail, signerName, address });
        await prisma.professionalProfile.update({
          where: { userId: user.id },
          data: { docusignEnvelopeId: envelopeId },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get the embedded signing URL
    const signingUrl = await getSigningUrl(envelopeId, { signerEmail, signerName, returnUrl });

    return NextResponse.json({ signingUrl });
  } catch (err) {
    console.error("DocuSign error:", err);
    return NextResponse.json({ error: "Failed to create signing session" }, { status: 500 });
  }
}
