import React from "react";
import style from "./Section3.module.css";
import { CiPlay1 } from "react-icons/ci";
export default function Section3() {
  return (
    <>
    <section className={"pb-1 pt-50 "+style['reviews-area']}>
    <div className="container my-5">
        <div className="row align-items-center">
          {/* Left Column with Image */}
          <div className="col-lg-6 mb-4 mb-lg-0">
            <img
              src="/assets/images/professionals/image.png"
              alt="Professional Image"
              className="img-fluid rounded"
            />
          </div>
          {/* Right Column with Text Content */}
          <div className="col-lg-6">
            <div className={style["content-wrapper"]}>
              <div className={style["section-header"]}>
                <div className={style.icon}>
                  <CiPlay1 />
                </div>
                <h2 className={style["section-title"]}>Applying Made Easy</h2>
              </div>
              <p>
                At Remagent, we make it simple for professionals with call
                center experience to connect with the right employers. Our
                platform turns the recruiting cycle upside down to match you
                with opportunities that align with your skills and career goals,
                cutting down the time and hassle of job hunting. Whether you're
                looking for full-time, part-time, or remote positions, we
                publish your profile (not resume) to dozens of companies.
              </p>
              <p>
                Actively hiring and allowing them to filter attributes of the
                candidates they are looking for to find you. You can build a
                profile in about 20 minutes, and be found by a role that's
                perfect for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
     
    </>
  );
}
