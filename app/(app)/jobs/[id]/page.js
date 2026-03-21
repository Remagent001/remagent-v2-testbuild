export const dynamic = "force-dynamic";

import JobDetailClient from "@/components/App/JobDetailClient";

export default async function JobDetailPage({ params }) {
  const { id } = await params;
  return <JobDetailClient jobId={id} />;
}
