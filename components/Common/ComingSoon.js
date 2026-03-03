import Link from "next/link";
import style from "./ComingSoon.module.css";
export default function ComingSoon() {
  return (
    <>
      <section className={style["coming-soon-bg"]}>
        <div className={style["coming-soon-container"]}>
          <h1 className={style["coming-soon-title"]}>Coming Soon</h1>
          <Link
            href={process.env.SITE_URL + "/"}
            className={"py-4  "+style["header-button"]}
          >
            <button className="btn">Back To Home</button>
          </Link>
        </div>
      </section>
    </>
  );
}
