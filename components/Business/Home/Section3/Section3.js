import style from "./Section3.module.css";
import Section2Swiper from "./Section3Swiper";
export default function Section3() {
  const data = [
    {
      id: 1,
      img: "/assets/images/business/l-swiper/6.png",
      title: "Labor market",
      description:
        "Today’s labor market is more challenging than ever.   Get past deciding which shifts fit, time off needs, and pay rates before speaking to a single candidate.",
    },
    {
      id: 2,
      img: "/assets/images/business/l-swiper/7.png",
      title: "The funnel",
      description:
        "Stop posting a Requisition to a Job Site only to be bombarded with 500 resumes that lead to 100 phone screens, 50 interviews, and maybe 15 offers and 5 new hires.   Search our pool of ready-to-work candidates that meet your criteria.",
    },
    {
      id: 3,
      img: "/assets/images/business/l-swiper/8.png",
      title: "Expertise",
      description:
        "Our operations teams are experienced contact center professionals, not just staffing personnel.  Our inhouse experts are able to assist with everything from getting agents working from home on your systems, to working with your Workforce Management Team to determine the right staffing model and how Remagent can fit best to optimize your workforce.",
    },
    {
      id: 4,
      img: "/assets/images/business/l-swiper/11.png",
      title: "On-Demand Staffing",
      description:
        "To help manage daily, monthly, and annual / seasonal volume fluctuations or “Peaks and Valleys,” many Remagent Professionals can be “on-call” and ready to assist with little to no notice.",
    },
    {
      id: 5,
      img: "/assets/images/business/l-swiper/12.png",
      title: "The Daily Wave – Peaks and Valleys",
      description:
        "All contact centers deal with peaks and valleys in call volume leading to staffing (and cost) for Peak Busy Hour.  Peak Busy Hour typically translates to the number of agents you will pay for 8 hours of work, when many of them are only needed for 2-3 hours of the day.  Companies use Remagent Professionals to fill time above core required staffing levels.",
    },
  ];

  return (
    <>
      <div className={" ptb-100 " + style["job-categories-area"]}>
        <div className="container">
          <div className={style["section-title"]}>
            <h2>We Conquer Your Biggest Hiring Problems</h2>
            <p>Fast and easy access to the best resources to fit your needs.</p>
          </div>
          <Section2Swiper data={data} />
        </div>
      </div>
    </>
  );
}
