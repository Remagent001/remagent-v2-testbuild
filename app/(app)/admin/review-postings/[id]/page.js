export const dynamic = "force-dynamic";
import AdminReviewDetailClient from "@/components/App/Admin/AdminReviewDetailClient";
export default async function AdminReviewDetailPage({ params }) {
  const { id } = await params;
  return <AdminReviewDetailClient positionId={id} />;
}
