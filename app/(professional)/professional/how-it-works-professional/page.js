import Section1 from "@/components/Professional/how-it-works/Section1/Section1";
import Section2 from "@/components/Professional/how-it-works/Section2/Section2";
export function generateMetadata() {
  return {
    title:
      "Work on Your Terms: How REMAGENT Connects Professionals with Remote Jobs",
    description:
      "Discover how REMAGENT connects skilled professionals with flexible, remote work opportunities. Learn how to create a profile, showcase your expertise, respond to job invitations, and build a career on your terms.",
    keywords:
      "REMAGENT, professional job portal, flexible work, remote work for professionals, freelance jobs, work from home, skill-based jobs, how REMAGENT works, remote opportunities",
    openGraph: {
      title:
        "Work on Your Terms: How REMAGENT Connects Professionals with Remote Jobs",
      description:
        "Discover how REMAGENT connects skilled professionals with flexible, remote work opportunities. Learn how to create a profile, showcase your expertise, respond to job invitations, and build a career on your terms.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Work on Your Terms: How REMAGENT Connects Professionals with Remote Jobs",
        },
      ],
    },
    alternates: {
      canonical:
        process.env.SITE_URL + "/professional/how-it-works-professional",
    },
  };
}
export default function page() {
  return (
    <>
      <Section1 />
      <Section2 />
    </>
  );
}
