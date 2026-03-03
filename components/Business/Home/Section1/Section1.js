import main_banner from "@/public/assets/images/business/main.webp";
import Image from "next/image";
import Link from "next/link";
import style from "./Section1.module.css";
import { FaLongArrowAltRight } from "react-icons/fa";
import { CiPlay1 } from "react-icons/ci";
export default async function Section1() {
  return (
    <>
      <section className={style["slider-item"]}>
        <div className={style["slide-img-wrap"]}>
          <Image
            decoding="async"
            src={main_banner}
            priority
            alt="ksoft_1"
            className={style["kenburns-top"]}
          />
        </div>
        <div className={style["slider-content-wrap"]}>
          <div className="container">
            <div className={style["hero-content-wrap"]}>
              <div className={style["hero-content"]}>
                <h1 className={style["main-title"] + " " + style["custom-h1"]}>
                  Employers:{" "}
                </h1>
                <h2 className={style["main-title"]}>Find the Talent </h2>
                <h3 className={" mb-0 position-absolute " + style["sub-title"]}>
                  Your Business Needs
                </h3>
              </div>
              <div className="d-flex flex-column">
                <p
                  className={
                    "text-center text-sm-start " + style["custom-paragraph"]
                  }
                >
                  Register your company to browse profiles and select your best
                  candidates. Search by skills, experience, location,
                  availability, and more.
                </p>
                <div className={"py-4 " + style["banner-buttons"]}>
                  <div className={style["slider-button"]}>
                    Candidate First Recruiting
                  </div>
                  <div className={style["slider-button"]}>Flex Staffing</div>
                  <div className={style["slider-button"]}>On-Demand</div>
                  <div className={style["slider-button"]}>Specialized</div>
                </div>
              </div>
            </div>
            <div className={style["candidate-btn"]}>
              {/* <Link href={process.env.REMAGENT_URL + "/signup?u=business"}>
                {" "}
                <button className={"text-start " + style.businessBtn}>
                  <div className="align-items-end d-flex">
                    <span className={style["btn-name"]}>
                      Build My Business Profile and Search For Candidates
                    </span>
                    <span className="text-end">
                      <FaLongArrowAltRight className={style["btn-arrow"]} />
                    </span>
                  </div>
                </button>
              </Link> */}
              <Link
                href={process.env.REMAGENT_URL + "/signup?u=business"}
                className={style["custom-button"]}
              >
                Build My Business Profile and Search For Candidates
                <span className={style["button-icon"]}>
                  <CiPlay1 />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
