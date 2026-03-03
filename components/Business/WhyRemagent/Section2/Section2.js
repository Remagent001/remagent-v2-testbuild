import style from "./Section2.module.css";
export default function Section2() {
  return (
    <>
      <section className={"pb-70 pt-70 " + style["section-2-bg"]}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className={style["section-2-title"]}>The Funnel</div>
              <p className={style["section-2-description"]}>
                We have all seen it before: "The Funnel." You post a job on a
                job board or one of the many employment sites, paying upwards of
                $500 to $1,000 for a single posting and then what? You receive
                500 applicants. You sift through the applications and resumes to
                trim it down to 200. Then you phone screen at least 100
                applicants. You then invite 50 for a Zoom interview or even a
                face-to-face and only 25 show up. You finally make 10 offers and
                hire 3 people.
              </p>
              <p className={style["section-2-description"]}>
                Remagent removes the funnel by allowing you to search our
                database of ACTIVE and experienced contact center agents that
                are looking for work in your industry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
