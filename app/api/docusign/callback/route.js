import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getEnvelopeStatus } from "@/lib/docusign";

// GET — DocuSign returns here after signing ceremony
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "msa" or "professional"
  const event = searchParams.get("event"); // "signing_complete", "cancel", "decline", etc.

  // Always check the actual envelope status from DocuSign, regardless of event param
  try {
    if (type === "msa") {
      const profile = await prisma.businessProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (profile?.docusignEnvelopeId) {
        const status = await getEnvelopeStatus(profile.docusignEnvelopeId);
        if (status === "completed") {
          await prisma.businessProfile.update({
            where: { userId: session.user.id },
            data: { agreementSigned: true, agreementSignedAt: new Date() },
          });
          return redirect("/company-profile?signed=true");
        }
      }

      // Not completed — check if explicitly cancelled/declined
      if (event === "cancel" || event === "decline") {
        return redirect("/company-profile?signing=cancelled");
      }
      // Might still be processing — treat as signed if profile already marked
      if (profile?.agreementSigned) {
        return redirect("/company-profile?signed=true");
      }
      return redirect("/company-profile?signing=cancelled");

    } else if (type === "professional") {
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (profile?.docusignEnvelopeId) {
        const status = await getEnvelopeStatus(profile.docusignEnvelopeId);
        if (status === "completed") {
          await prisma.professionalProfile.update({
            where: { userId: session.user.id },
            data: { agreementSigned: true, agreementSignedAt: new Date() },
          });
          return redirect("/onboarding?step=13&signed=true");
        }
      }

      if (event === "cancel" || event === "decline") {
        return redirect("/onboarding?step=13&signing=cancelled");
      }
      if (profile?.agreementSigned) {
        return redirect("/onboarding?step=13&signed=true");
      }
      return redirect("/onboarding?step=13&signing=cancelled");
    }
  } catch (err) {
    console.error("DocuSign callback error:", err);
  }

  // Fallback
  if (type === "msa") {
    return redirect("/company-profile?signing=cancelled");
  }
  return redirect("/onboarding?step=13&signing=cancelled");
}
