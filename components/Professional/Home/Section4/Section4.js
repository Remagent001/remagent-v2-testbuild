import dynamic from "next/dynamic";
import style from "./Section4.module.css";
const Section4Swiper = dynamic(() => import("./Section4Swiper"), {
  ssr: false,
});
const data = [
  {
    id: 1,
    description:
      "I have worked in call centers through University and Grad School.  While waiting for the perfect opportunity to present itself I posted my profile on Remagent.  A company asked me to assist with client services part time during the holiday and I have been working for them ever since.",
    name: "Kenton Fletcher",
    position: "Digital Marketer",
    img: "/assets/images/professionals/pro1.png",
  },
  {
    id: 2,
    description:
      "Remagent enables me to work for companies that are searching for someone with my specific skills and on my schedule.   I have provided call center services for 3 different companies and love that they work within my complex schedule.",
    name: "Jessica Bowman",
    position: "IT Specialist",
    img: "/assets/images/professionals/pro2.png",
  },
  {
    id: 3,
    description:
      "I'm a stay at home dad with a Master's Degree and I speak 3 languages.  Within a week of signing up, I began training and taking calls for the French queue of an upscale retail store.  Now, I drop my kids off at school in the morning and take calls for 4 hours a day before I need to pick them up.",
    name: "Benjamin Jackson",
    position: "President Of Sale",
    img: "/assets/images/professionals/pro3.png",
  },
];
export default function Section4() {
  return (
    <>
      <div className={" bg-f0f5f7  " + style["reviews-area"]}>
        <div className="container">
          <div className={style["section-title"]}>
            <h2>Hear from Remagent Professionals</h2>
          </div>
          <div className="reviews-slider owl-carousel owl-theme">
            <Section4Swiper data={data} />
          </div>
        </div>
      </div>
    </>
  );
}
