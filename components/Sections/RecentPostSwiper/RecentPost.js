import RecentPostSwiper from "./RecentPostSwiper";
import style from "./RecentPostSwiper.module.css";
export default function RecentPost({ recentpost }) {
  return (
    <>
      <div className="job-area pb-100">
        <div className="container">
          <div className={style.title}>
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-9">
                <div className={style["section-title"] + " " + style["style2"]}>
                  <h2>Recent Job Posted</h2>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit sed
                    do eiusmod
                  </p>
                </div>
              </div>
              <div className="col-lg-4 col-md-3">
                <div className={style["browse-btn"]}>
                  <a href="#//" className={"btn " + style["default-btn"]}>
                    Browse All Jobs
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="job-slider2 owl-carousel owl-theme">
            <RecentPostSwiper recentpost={recentpost} />
          </div>
        </div>
      </div>
    </>
  );
}
