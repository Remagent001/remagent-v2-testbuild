import Section1 from "@/components/Professional/Home/Section1/Section1";
import dynamic from "next/dynamic";
const Section2 = dynamic(
  () => import("@/components/Professional/Home/Section2/Section2"),
  { ssr: false }
);
const Section3 = dynamic(
  () => import("@/components/Professional/Home/Section3/Section3"),
  { ssr: false }
);
const Section4 = dynamic(
  () => import("@/components/Professional/Home/Section4/Section4"),
  { ssr: false }
);
const Section5 = dynamic(
  () => import("@/components/Professional/Home/Section5/Section5"),
  { ssr: false }
);
export function generateMetadata() {
  return {
    title:
      "Find Freelance & Remote Work That Fits Your Lifestyle | REMAGENT Professional",
    description:
      "Connect with employers, create a profile, and work on your schedule. Showcase your skills, respond to interview requests, and start earning from home.",
    keywords:
      "flexible work, remote jobs, work from home, freelance opportunities, skill-based jobs, flexible schedule, online work",
    openGraph: {
      title:
        "Find Freelance & Remote Work That Fits Your Lifestyle | REMAGENT Professional",
      description:
        "Connect with employers, create a profile, and work on your schedule. Showcase your skills, respond to interview requests, and start earning from home.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Find Freelance & Remote Work That Fits Your Lifestyle | REMAGENT Professional",
        },
      ],
    },
    alternates: {
      canonical: process.env.SITE_URL + "/professional",
    },
  };
}

export default function Page() {
  return (
    <>
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
    </>
  );
}
