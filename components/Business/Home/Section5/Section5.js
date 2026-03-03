import { IoFunnelOutline } from "react-icons/io5";
import { LuMessagesSquare } from "react-icons/lu";
import style from "./Section5.module.css";
import { MdComputer } from "react-icons/md";
import { SlBadge } from "react-icons/sl";
export default function Section5() {
  return (
    <>
      <section className={"ptb-100 " + style["section-5-bg"]}>
        <div className="container">
          <div className={style["section-title"]}>
            <h2>Hiring Made Easy</h2>
            <p>
              Trusted by leading brands and startups alike, Remagent has matched
              expert freelancers with employers across North America. We know
              you don’t have time to waste searching through hundreds of
              applications to find someone with the experience and skill set you
              need. Let us do the work and narrow the results down to a select
              few—make hiring easy with Remagent.
            </p>
          </div>
          <div className="row gy-4">
            <div className="col-md-6">
              <img
                src="/assets/images/business/l-swiper/10.png"
                alt="hiring-made-easy"
                className="w-100"
              />
            </div>
            <div className="col-md-6">
              <div className={style["dreamit-icon-list"]}>
                <ul className="p-0 d-flex flex-column gap-4">
                  <li>
                    <IoFunnelOutline size={35} />{" "}
                    <span className="fw-bold">Filter and Engage</span>{" "}
                    <p className={style["description"]}>
                      Try the Remagent platform, it’s free! Set up a profile in
                      seconds and filter down our pre-screened candidates by
                      Skill Level, Experience, Language, Education Level,
                      Industry Background, Hourly Rate, and more. Then invite
                      the candidates you have down-selected to apply for your
                      role and set-up an interview.
                    </p>
                  </li>

                  <li>
                    <LuMessagesSquare size={35} />{" "}
                    <span className="fw-bold">
                      Talk to One of Our Industry Experts
                    </span>{" "}
                    <p className={style["description"]}>
                      Our recruiters can match you with qualified candidates on
                      demand. Talk to one of our experts to jumpstart the hiring
                      process.
                    </p>
                  </li>
                  <li>
                    <MdComputer size={35} />{" "}
                    <span className="fw-bold">
                      Work with Hand-Selected Talent
                    </span>{" "}
                    <p className={style["description"]}>
                      All of our freelancers are based in North America and
                      accomplished in their fields. If your business needs a
                      unique combination of skills, we can help you find the
                      right talent.
                    </p>
                  </li>
                  <li>
                    <SlBadge size={35} />{" "}
                    <span className="fw-bold">The Right Fit, Guaranteed</span>{" "}
                    <p className={style["description"]}>
                      Find employees that support your company culture, vision,
                      and goals. Remagent can help you get a perfect fit, every
                      time.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
