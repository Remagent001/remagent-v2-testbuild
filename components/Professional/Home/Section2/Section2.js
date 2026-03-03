import style from "./Section2.module.css";
export default function Section2() {
  return (
    <>
      <section className={style['reviews-area']+" "+style['ptb-100']}>
        <div className="container">
          <div className={"pb-50 "+style["section-title"]}>
            <h2>Employment Made Easy</h2>
          </div>
          <div className={style["card-container"]}>
            {/* Card 1 */}
            <div className={style["custom-card"] + " " + style["blue-card"]}>
              <div className={style.icon}>
                <img src="/assets/images/professionals/1.png" alt="Build Your Profile" />
              </div>
              <h3 className={style["card-title"]}>Build Your Profile</h3>
              <p className={style["card-text"]}>
                Hire skilled professionals who specialize in troubleshooting,
                technical assistance.
              </p>
            </div>
            {/* Card 2 */}
            <div
              className={style["custom-card"] + " " + style["light-blue-card"]}
            >
              <div className={style.icon}>
              <img src="/assets/images/professionals/2.png" alt="Build Your Profile" />

              </div>
              <h3 className={style["card-title"]}>
                Get Contacted by Businesses
              </h3>
              <p className={style["card-text"]}>
                Connect with companies looking for skilled professionals in your
                area of expertise.
              </p>
            </div>
            {/* Card 3 */}
            <div className={style["custom-card"] + " " + style["purple-card"]}>
              <div className={style.icon}>
              <img src="/assets/images/professionals/3.png" alt="Build Your Profile" />

              </div>
              <h3 className={style["card-title"]}>Fill Out Some Paperwork</h3>
              <p className={style["card-text"]}>
                Complete the necessary paperwork to streamline your profile and
                get ready for opportunities.
              </p>
            </div>
            {/* Card 4 */}
            <div className={style["custom-card"] + " " + style["green-card"]}>
              <div className={style["icon"]}>
              <img src="/assets/images/professionals/4.png" alt="Build Your Profile" />

              </div>
              <h3 className={style["card-title"]}>Publish Your Profile</h3>
              <p className={style["card-text"]}>
                Make your profile visible to potential employers and start
                receiving job offers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
