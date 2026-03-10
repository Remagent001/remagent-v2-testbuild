export const dynamic = "force-dynamic";
import ViewProfessionalClient from "@/components/App/ViewProfessionalClient";
export default async function ViewProfessionalPage({ params }) {
  const { id } = await params;
  return <ViewProfessionalClient professionalId={id} />;
}
