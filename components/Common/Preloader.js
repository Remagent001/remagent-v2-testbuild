import style from "./Preloader.module.css";
export default function Preloader() {
  return (
    <>
      <div id="preloader-section">
        <div id="preloader">
          <div id="ctn-preloader" className={style["ctn-preloader"]}>
            <div className={style["animation-preloader"]}>
              <div className={style.spinner} />
              <div className={style["txt-loading"]}>
                <span
                  data-text-preloader="R"
                  className={style["letters-loading"]}
                >
                  R
                </span>
                <span
                  data-text-preloader="E"
                  className={style["letters-loading"]}
                >
                  E
                </span>
                <span
                  data-text-preloader="M"
                  className={style["letters-loading"]}
                >
                  M
                </span>
                <span
                  data-text-preloader="A"
                  className={style["letters-loading"]}
                >
                  A
                </span>
                <span
                  data-text-preloader="G"
                  className={style["letters-loading"]}
                >
                  G
                </span>
                <span
                  data-text-preloader="E"
                  className={style["letters-loading"]}
                >
                  E
                </span>
                <span
                  data-text-preloader="N"
                  className={style["letters-loading"]}
                >
                  N
                </span>
                <span
                  data-text-preloader="T"
                  className={style["letters-loading"]}
                >
                  T
                </span>
              </div>
            </div>
            <div
              className={style["loader-section"] + " " + style["section-left"]}
            />
            <div
              className={style["loader-section"] + " " + style["section-right"]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
