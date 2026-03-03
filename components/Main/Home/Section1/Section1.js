import Link from "next/link";
import style from "./Section1.module.css";

export default function Section1() {
  return (
    <section className={style.hero}>
      <div className={style.heroInner}>

        {/* LEFT: Copy */}
        <div className={style.heroContent}>
          <div className={style.eyebrow}>
            <span className={style.badge}>Remote Contact Center Talent Marketplace</span>
          </div>

          <h1 className={style.title}>
            Stop Filtering Resumes.<br />
            <span className={style.highlight}>Start Selecting People.</span>
          </h1>

          <p className={style.desc}>
            Remagent is the only marketplace where employers search, filter, and
            directly invite pre-screened remote contact center professionals —
            turning weeks of recruiting into minutes.
          </p>

          <div className={style.ctas}>
            <div className={style.ctaGroup}>
              <span className={style.ctaLabel}>For Businesses</span>
              <Link href="/business" className={style.btnPrimary}>
                Search Our Talent Pool →
              </Link>
            </div>
            <div className={style.ctaGroup}>
              <span className={style.ctaLabel}>For Professionals</span>
              <Link href="/professional" className={style.btnSecondary}>
                Build My Profile →
              </Link>
            </div>
          </div>

          <div className={style.stats}>
            <div className={style.stat}>
              <span className={style.statNum}>5 min</span>
              <span className={style.statLabel}>Average time to shortlist</span>
            </div>
            <div className={style.statDivider} />
            <div className={style.stat}>
              <span className={style.statNum}>100%</span>
              <span className={style.statLabel}>Pre-screened profiles</span>
            </div>
            <div className={style.statDivider} />
            <div className={style.stat}>
              <span className={style.statNum}>Zero</span>
              <span className={style.statLabel}>Resume piles to sort through</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className={style.heroImageWrap}>
          <img
            src="https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=900&q=85"
            alt="Remote contact center professional working from home"
            className={style.heroImage}
          />
          <div className={style.floatCard1}>
            <span className={style.floatIcon}>✓</span>
            <div>
              <div className={style.floatVal}>Pre-Screened</div>
              <div className={style.floatSub}>Every profile verified</div>
            </div>
          </div>
          <div className={style.floatCard2}>
            <span className={style.floatIcon}>⚡</span>
            <div>
              <div className={style.floatVal}>Invite Instantly</div>
              <div className={style.floatSub}>No applications needed</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
