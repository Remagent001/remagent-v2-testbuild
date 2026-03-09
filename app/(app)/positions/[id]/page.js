export const dynamic = "force-dynamic";

import JobPostingWizard from "@/components/App/JobPosting/JobPostingWizard";

export default async function EditPositionPage({ params }) {
  const { id } = await params;
  return <JobPostingWizard positionId={id} />;
}
