import Section1 from "@/components/Professional/Home/Section1/Section1";
import Section2 from "@/components/Professional/Home/Section2/Section2";
import Section3 from "@/components/Professional/Home/Section3/Section3";
import Section4 from "@/components/Professional/Home/Section4/Section4";

export function generateMetadata() {
  return {
    title: "For Contact Center Professionals — Remagent",
    description:
      "Build your profile once and let employers find you. Remagent connects remote contact center professionals with companies actively hiring — on your schedule, at your rate.",
    keywords:
      "remote contact center jobs, work from home customer service, flexible call center work, remote agent profile, contact center professional",
  };
}

export default function Page() {
  return (
    <>
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
    </>
  );
}
