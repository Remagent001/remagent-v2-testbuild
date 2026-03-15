import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSignedDocument } from "@/lib/docusign";

// GET — download signed agreement PDF
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { businessProfile: true, professionalProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the envelope ID based on role
  let envelopeId;
  if (user.role === "BUSINESS" && user.businessProfile?.docusignEnvelopeId) {
    envelopeId = user.businessProfile.docusignEnvelopeId;
  } else if (user.role === "PROFESSIONAL" && user.professionalProfile?.docusignEnvelopeId) {
    envelopeId = user.professionalProfile.docusignEnvelopeId;
  }

  if (!envelopeId) {
    return NextResponse.json({ error: "No signed agreement found" }, { status: 404 });
  }

  try {
    const pdfBuffer = await getSignedDocument(envelopeId);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"Remagent-Agreement.pdf\"",
      },
    });
  } catch (err) {
    console.error("DocuSign document download error:", err);
    return NextResponse.json({ error: "Failed to download agreement" }, { status: 500 });
  }
}
