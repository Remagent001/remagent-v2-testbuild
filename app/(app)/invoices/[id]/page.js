export const dynamic = "force-dynamic";
import InvoiceDetailClient from "@/components/App/InvoiceDetailClient";

export default async function InvoiceDetailPage({ params }) {
  const { id } = await params;
  return <InvoiceDetailClient invoiceId={id} />;
}
