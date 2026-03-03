import main_banner from "@/public/assets/images/home/main.webp";
import Image from "next/image";
import style from "./Section1.module.css";

export default function Section1() {
  return (
    <section className={style["partner-section"]}>
      <Image
        src={main_banner}
        alt="Main Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        priority
        className={style["background-image"]}
      />

      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 d-lg-block d-none">
            <Image
              width={500}
              height={500}
              src="/assets/images/professionals/why-remagnet/1.png"
              alt="Partner Image"
              priority
              className={style["partner-image"]}
            />
          </div>
          <div className="col-md-6 d-flex flex-column justify-content-center align-items-start text-start">
            <h2 className={style["heading"]}>Why Choose Remagent?</h2>
            <h4 className={style["heading1"]}>
              Let Jobs Find You, Not the Other Way Around
            </h4>
            <p className={style["heading1"]}>
              At Remagent, we believe in simplifying your job search. Instead of
              scouring job boards,
            </p>
            <p className={style["heading1"]}>
              create a professional profile that showcases your skills,
              experience, and availability.From there, businesses actively
              search for talent like you, bringing the opportunitiesdirectly to
              you. No more endless job applications—just build your profile
              andlet the offers come.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
