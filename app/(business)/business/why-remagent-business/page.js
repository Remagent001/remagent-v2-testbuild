import Section1 from '@/components/Business/WhyRemagent/Section1/Section1'
import Section2 from '@/components/Business/WhyRemagent/Section2/Section2'
import Section3 from '@/components/Business/WhyRemagent/Section3/Section3'
import Section4 from '@/components/Business/WhyRemagent/Section4/Section4'
export function generateMetadata() {
  return {
    title: "Empower Your Business with REMAGENT's Innovative Solutions",
    description:
      "Discover how REMAGENT empowers businesses with tailored solutions, innovative tools, and expert support to enhance productivity, streamline processes, and drive growth.",
    keywords:
      "business solutions, REMAGENT for business, productivity tools, business growth, enterprise solutions, business process optimization, B2B services, business support, workflow automation",
    openGraph: {
      title: "Empower Your Business with REMAGENT's Innovative Solutions",
      description:
        "Learn why leading businesses trust REMAGENT for powerful solutions that boost efficiency, streamline workflows, and fuel sustainable growth.",
      images: [
        {
          url: process.env.OG_IMAGE,
          width: process.env.OG_IMAGE_WIDTH,
          height: process.env.OG_IMAGE_HEIGHT,
          alt: "Empower Your Business with REMAGENT's Innovative Solutions",
        },
      ],
    },
    alternates: {
      canonical: process.env.SITE_URL + "/business/why-remagent-business",
    },
  };
}

export default function page() {
  return (
    <>
      <Section1/>
      <Section2/>
      <Section3/>
      <Section4/>
    </>
  )
}
