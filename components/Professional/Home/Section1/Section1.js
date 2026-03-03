import Link from "next/link";
import style from "./Section1.module.css";

export default function Section1() {
  return (
    <section className={style.hero}>
      <div className={style.heroInner}>

        {/* LEFT: Copy */}
        <div className={style.heroContent}>
          <div className={style.eyebrow}>
            <span className={style.badge}>For Contact Center Professionals</span>
          </div>

          <h1 className={style.title}>
            Let Employers<br />
            <span className={style.highlight}>Come to You.</span>
          </h1>

          <p className={style.desc}>
            Build your profile once. Companies search, filter, and invite you
            directly based on your skills, platforms, availability, and pay
            expectations — no applying, no waiting, no resume black holes.
          </p>

          <div className={style.ctas}>
            <Link href="#" className={style.btnPrimary}>
              Build My Profile →
            </Link>
            <Link href="#how" className={style.btnSecondary}>
              See How It Works
            </Link>
          </div>

          <div className={style.stats}>
            <div className={style.stat}>
              <span className={style.statNum}>20 min</span>
              <span className={style.statLabel}>to build your profile</span>
            </div>
            <div className={style.statDivider} />
            <div className={style.stat}>
              <span className={style.statNum}>100%</span>
              <span className={style.statLabel}>Remote positions</span>
            </div>
            <div className={style.statDivider} />
            <div className={style.stat}>
              <span className={style.statNum}>You set</span>
              <span className={style.statLabel}>your rate & schedule</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className={style.heroImageWrap}>
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=85"
            alt="Professional working remotely from home"
            className={style.heroImage}
          />
          <div className={style.floatCard1}>
            <span className={style.floatIcon}>💼</span>
            <div>
              <div className={style.floatVal}>Employers Find You</div>
              <div className={style.floatSub}>No job hunting needed</div>
            </div>
          </div>
          <div className={style.floatCard2}>
            <span className={style.floatIcon}>⏰</span>
            <div>
              <div className={style.floatVal}>Your Schedule</div>
              <div className={style.floatSub}>You set your availability</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
