import React from "react";
import style from "./Section6.module.css";
export default function Section6() {
  return (
    <>
      <section className={"pb-100 "+style["section-6-bg"]}>
        <div className="container">
          <h1 className={style["main-heading"]}>
            Join Other Successful Businesses and Leading Brands
          </h1>
          <p className={style["sub-heading"]}>
            Whether you’re an established company or a small startup, Remagent
            can help you find the right talent to help your business grow.
          </p>
          <div className={style["divider"]} />
          <div>
            <h4 className={style["section-title"]}>Seize the Opportunity</h4>
            <p className={style["section-text"]}>
              Take advantage of our recruiting services and make hiring easy.
              You can save time and fill vacant positions quickly with Remagent.
            </p>
          </div>
          <div className={style["divider"]} />
          <div>
            <h4 className={style["section-title"]}>
              Find Experts in Your Industry
            </h4>
            <p className={style["section-text"]}>
              Our freelancers support businesses specializing in medical
              billing, travel, retail, marketing, tech support, collections, and
              other niche industries.
            </p>
          </div>
          <div className={style["divider"]} />
          <div>
            <h4 className={style["section-title"]}>Register Today</h4>
            <p className={style["section-text"]}>
              Creating an employer profile only takes a few minutes—register now
              and start hiring talented freelancers today!
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
