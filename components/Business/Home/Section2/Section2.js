import style from "./Section2.module.css";
import Section2Swiper from "./Section2Swiper";
export default function Section2() {
  const data = [
    {
      id: 1,
      img: "/assets/images/business/l-swiper/1.png",
      title: "Tech Support",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "tech-support",
    },
    {
      id: 2,
      img: "/assets/images/business/l-swiper/2.png",
      title: "Customer Service",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "customer-service",
    },
    {
      id: 3,
      img: "/assets/images/business/l-swiper/3.png",
      title: "Debt Collection",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "debt-collection",
    },
    {
      id: 4,
      img: "/assets/images/business/l-swiper/4.png",
      title: "Seasonal/Temporary",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "seasonal-temp",
    },
    {
      id: 5,
      img: "/assets/images/business/l-swiper/5.png",
      title: "On-Demand Access",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "on-demand-access",
    },
    {
      id: 6,
      img: "/assets/images/business/l-swiper/2.png",
      title: "EcoBuild Solutions",
      description:
        "Hire skilled professionals who specialize in troubleshooting, technical assistance, and customer support for software and hardware issues.",
      className: "tech-support",
    },
  ];

  return (
    <>
      <div className={"ptb-100 "+style['section-2-bg']}>
        <div className="container">
          <div className={style["section-title"]}>
            <h2>Leverage World-Class Talent</h2>
            <p>
              Remagent takes the guesswork out of hiring and makes it easy to
              find the right talent. As an employer, you can create a job
              requisition or browse the profiles of qualified professionals in
              your industry.
            </p>
          </div>
          <Section2Swiper data={data} />
        </div>
      </div>
    </>
  );
}
