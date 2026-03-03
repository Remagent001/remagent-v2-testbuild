import Section1 from "@/components/Professional/WhyRemagnet/Section1/Section1";
import Section2 from "@/components/Professional/WhyRemagnet/Section2/Section2";
import Section3 from "@/components/Professional/WhyRemagnet/Section3/Section3";
export function generateMetadata() {
  return {
    title: "Unlock New Career Opportunities with REMAGENT Professional",
    description:
      "Discover why professionals choose REMAGENT to find high-quality projects, connect with reputable clients, and grow their careers. Learn how REMAGENT supports professionals with tools and resources to succeed.",
    keywords:
      "REMAGENT Professional, connect with clients, professional projects, career growth, freelance platform, remote work for professionals, skill-based work",
    openGraph: {
      title: "Unlock New Career Opportunities with REMAGENT Professional",
      description:
        "Learn why REMAGENT is the preferred platform for professionals seeking quality work opportunities. Connect with top clients, showcase your skills, and advance your career on REMAGENT.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Unlock New Career Opportunities with REMAGENT Professional",
        },
      ],
    },
    alternates: {
      canonical: process.env.SITE_URL + "/professional/why-remagent-professional",
    },
  };
}

export default function page() {
  return (
    <>
      <Section1 />
      <Section2 />
      <Section3 />
    </>
  );
}
