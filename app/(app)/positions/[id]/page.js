export const dynamic = "force-dynamic";

import PositionFormClient from "@/components/App/PositionFormClient";

export default async function EditPositionPage({ params }) {
  const { id } = await params;
  return <PositionFormClient positionId={id} />;
}
