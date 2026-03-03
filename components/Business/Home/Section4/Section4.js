import { FaLongArrowAltRight } from "react-icons/fa";
import style from "./Section4.module.css";
import Link from "next/link";
export default function Section4() {
  return (
    <>
      <section className={style["partner-section"]}>
        <div className="container">
          <div className={"row"}>
            <div className="col-md-6 d-flex flex-column justify-content-center align-items-start text-start">
              <h2>
                The Sourcing Partner <br />
                You Can Grow With
              </h2>
              <p className={style.lead}>
                Fast and easy access to the best resources to fit your needs.
              </p>
              <Link href={process.env.REMAGENT_URL+"/signup?u=business"} className={"btn  " + style["btn-custom"]}>
                Build My Business Profile and Search For Candidates
                <span>
                  <FaLongArrowAltRight />
                </span>
              </Link>
            </div>
            <div className="col-md-6 d-lg-block d-none">
              <div className={style["circle-background"]}></div>
              <img
                src="/assets/images/business/l-swiper/9.png"
                alt="Partner Image"
                className={style["partner-image"]}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
