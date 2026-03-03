import Image from "next/image";
import Link from "next/link";
import { CiPlay1 } from "react-icons/ci";
import style from "./Section1.module.css";
import { FaArrowRight } from "react-icons/fa";
export default function Section1() {
  return (
    <>
      <section className={style["slider-area"]}>
        <div className={"container-fluid px-5"}>
          <div className="d-flex justify-content-center  flex-column flex-lg-row">
            <div className="">
              <div className={style["slider-content"]}>
                <h1> Find Work that Fits Your Skill Set and Your Schedule</h1>
                <p className="m-0">
                  Register your company to browse profiles and select your best
                  candidates. Search by skills, experience, location,
                  availability, and more. The hiring process has never been
                  easier—find qualified specialists in minutes and start
                  interviewing right away.
                </p>
              </div>
              <div className={style.userOptions}>
                <Link
                  href={process.env.REMAGENT_URL + "/signup"}
                  className={style["custom-button"]}
                >
                  Build My Professional Profile And Let Businesses Search For Me
                  <span className={style["button-icon"]}>
                    <CiPlay1 />
                  </span>
                </Link>
              </div>
              <div>
                <Link
                  href={process.env.SITE_URL + "/business"}
                  className={style["icon-text-section"]}
                >
                  <div className={style["icon-circle"]}>
                    <FaArrowRight />{" "}
                  </div>
                  <div className="fs-5">
                    I meant to click the Business button to build a profile and
                    search for candidates.
                  </div>
                </Link>
              </div>

              <div className={"py-4 " + style["banner-buttons"]}>
                <div className={style["slider-button"]}>Customer Service</div>
                <div className={style["slider-button"]}>Flexible Staffing</div>
                <div className={style["slider-button"]}>
                  White Glove Specialist
                </div>
                <div className={style["slider-button"]}>
                  Your Rate, Your Schedule
                </div>
              </div>
            </div>
            <div className="d-lg-block d-none">
              <div className={style["slider-thumb"]}>
                <Image
                  src={"/assets/images/professionals/how-it-work/1.webp"}
                  quality={100}
                  alt="main_image"
                  priority
                  width={600}
                  height={700}
                  className="h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
