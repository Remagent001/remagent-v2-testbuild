import Section1 from "@/components/Business/Home/Section1/Section1";
import dynamic from "next/dynamic";
const Section2 = dynamic(() =>
  import("@/components/Business/Home/Section2/Section2")
);
const Section3 = dynamic(() =>
  import("@/components/Business/Home/Section3/Section3")
);
const Section4 = dynamic(() =>
  import("@/components/Business/Home/Section4/Section4")
);
const Section5 = dynamic(() =>
  import("@/components/Business/Home/Section5/Section5")
);
const Section6 = dynamic(() =>
  import("@/components/Business/Home/Section6/Section6")
);
const Section7 = dynamic(() =>
  import("@/components/Business/Home/Section7c/Section7")
);

export function generateMetadata() {
  return {
    title: "Find the Right Talent to Drive Your Business Forward | REMAGENT",
    description:
      "Discover a platform designed to meet your hiring needs effortlessly. Post jobs, manage applications, and connect with skilled professionals to drive your business forward. Simplify recruitment and find the right fit for your organization, whether you need temporary staff or long-term employees.",
    keywords:
      "hire top talent, recruitment platform, skilled professionals, job posting, find employees, temporary staff, long-term employees, recruitment solutions, business hiring",
    openGraph: {
      title: "Find the Right Talent to Drive Your Business Forward | REMAGENT",
      description:
        "Discover a platform designed to meet your hiring needs effortlessly. Post jobs, manage applications, and connect with skilled professionals to drive your business forward. Simplify recruitment and find the right fit for your organization, whether you need temporary staff or long-term employees.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Find the Right Talent to Drive Your Business Forward | REMAGENT",
        },
      ],
    },
    alternates: {
      canonical: process.env.SITE_URL + "/business",
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
      <Section6 />
      <Section7 />
    </>
  );
}
