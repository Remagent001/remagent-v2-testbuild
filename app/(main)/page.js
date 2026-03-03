import Section1 from "@/components/Main/Home/Section1/Section1";
import Section2 from "@/components/Main/Home/Section2/Section2";
import Section3 from "@/components/Main/Home/Section3/Section3";
import Section4 from "@/components/Main/Home/Section4/Section4";

export function generateMetadata() {
  return {
    title: "Remagent — The Remote Contact Center Talent Marketplace",
    description:
      "Search, filter, and directly invite pre-screened remote contact center professionals. Remagent flips traditional hiring — employers find people, not resumes.",
    keywords:
      "contact center staffing, remote agents, customer service hiring, call center recruiting, pre-screened talent, remote workforce",
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
