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
              width={330}
              height={329}
              src="/assets/images/professionals/how-it-work/1.png"
              alt="Partner Image"
              priority
              className={style["partner-image"]}
            />
          </div>
          <div className="col-md-6 d-flex flex-column justify-content-center align-items-start text-start">
            <h2 className={style["heading"]}>How it Works</h2>
          </div>
        </div>
      </div>
    </section>
  );
}
