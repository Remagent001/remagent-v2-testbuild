import Section1 from "@/components/Business/HowItWork/Section1/Section1";
import Section2 from "@/components/Business/HowItWork/Section2/Section2";
import Section3 from "@/components/Business/HowItWork/Section3/Section3";
export function generateMetadata() {
  return {
    title: "Hire Skilled Freelancers Effortlessly | REMAGENT for Business",
    description:
      "Discover how REMAGENT connects businesses with top freelance talent. Post projects, review applicants, and hire skilled professionals to complete tasks on your schedule.",
    keywords:
      "hire freelancers, freelance talent, flexible hiring, remote workforce, project-based hiring, skilled professionals, business solutions, REMAGENT for business",
    openGraph: {
      title: "Hire Skilled Freelancers Effortlessly | REMAGENT for Business",
      description:
        "Learn how REMAGENT helps businesses find and hire skilled freelance talent. Post your project, evaluate candidates, and bring in experts to drive results.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Hire Skilled Freelancers Effortlessly | REMAGENT for Business",
        },
      ],
    },
    alternates: {
      canonical: process.env.SITE_URL + "/business/how-it-works-business",
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
