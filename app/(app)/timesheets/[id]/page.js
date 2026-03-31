export const dynamic = "force-dynamic";
import TimesheetDetailClient from "@/components/App/TimesheetDetailClient";

export default async function TimesheetDetailPage({ params }) {
  const { id } = await params;
  return <TimesheetDetailClient timesheetId={id} />;
}
