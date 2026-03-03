import style from "./Section2.module.css";
export default function Section2() {
  return (
    <>
      <section className={"pb-70 pt-70 " + style["section-2-bg"]}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className={style["section-2-title"]}>
                Work On Your Own Terms
              </div>
              <p className={style["section-2-description"]}>
                Whether you want full-time employment, part-time gigs, or
                flexible, temporary positions, Remagent empowers you to choose.
                Set your own hourly rate, pick the jobs that fit your schedule,
                and control where and when you want to work. You are in charge
                of your work-life balance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
