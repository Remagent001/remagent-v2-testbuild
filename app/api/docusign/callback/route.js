import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getDocuSignClient, getEnvelopeStatus } from "@/lib/docusign";

// GET — DocuSign returns here after signing ceremony
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "msa" or "professional"
  const event = searchParams.get("event"); // "signing_complete", "cancel", "decline", "exception", etc.

  if (event === "signing_complete") {
    try {
      // Verify with DocuSign that the envelope is actually completed
      if (type === "msa") {
        const profile = await prisma.businessProfile.findUnique({
          where: { userId: session.user.id },
        });

        if (profile?.docusignEnvelopeId) {
          const apiClient = await getDocuSignClient();
          const status = await getEnvelopeStatus(apiClient, profile.docusignEnvelopeId);

          if (status === "completed") {
            await prisma.businessProfile.update({
              where: { userId: session.user.id },
              data: {
                agreementSigned: true,
                agreementSignedAt: new Date(),
              },
            });
          }
        }
        return redirect("/company-profile?signed=true");
      } else if (type === "professional") {
        const profile = await prisma.professionalProfile.findUnique({
          where: { userId: session.user.id },
        });

        if (profile?.docusignEnvelopeId) {
          const apiClient = await getDocuSignClient();
          const status = await getEnvelopeStatus(apiClient, profile.docusignEnvelopeId);

          if (status === "completed") {
            await prisma.professionalProfile.update({
              where: { userId: session.user.id },
              data: {
                agreementSigned: true,
                agreementSignedAt: new Date(),
              },
            });
          }
        }
        return redirect("/dashboard?signed=true");
      }
    } catch (err) {
      console.error("DocuSign callback error:", err);
    }
  }

  // For cancel, decline, or other events — redirect back
  if (type === "msa") {
    return redirect("/company-profile?signing=cancelled");
  }
  return redirect("/dashboard?signing=cancelled");
}
