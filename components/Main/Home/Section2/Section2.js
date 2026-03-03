import style from "./Section2.module.css";

export default function Section2() {
  const filters = [
    { label: "Years of Contact Center Experience" },
    { label: "Platform Expertise (Genesys, Zendesk, Salesforce...)" },
    { label: "Channel Experience (Voice, Chat, Email, Omni)" },
    { label: "Availability — Days & Hours" },
    { label: "Pay Expectations" },
    { label: "Language Skills" },
    { label: "Industry Background (Healthcare, Retail, Financial...)" },
    { label: "Performance Ratings" },
  ];

  return (
    <section className={style.section}>
      <div className={style.inner}>

        {/* Header */}
        <div className={style.header}>
          <span className={style.label}>The Remagent Difference</span>
          <h2 className={style.title}>
            Traditional Hiring Is <span className={style.accent}>Backwards.</span>
          </h2>
          <p className={style.subtitle}>
            Most platforms make employers sift through resumes. Remagent flips
            the model — employers search and filter real people, then invite
            exactly who they want.
          </p>
        </div>

        {/* Comparison */}
        <div className={style.compare}>

          {/* Traditional */}
          <div className={style.compareCard + " " + style.traditional}>
            <div className={style.compareTag}>Traditional Hiring</div>
            <ul className={style.compareList}>
              <li className={style.compareItem + " " + style.bad}>Post a job opening</li>
              <li className={style.compareItem + " " + style.bad}>Receive 500+ resumes</li>
              <li className={style.compareItem + " " + style.bad}>Phone screen 100 candidates</li>
              <li className={style.compareItem + " " + style.bad}>Interview 50</li>
              <li className={style.compareItem + " " + style.bad}>Make 15 offers, maybe 5 accept</li>
            </ul>
            <div className={style.compareTime + " " + style.timeBad}>3–6 weeks later</div>
          </div>

          <div className={style.vsBadge}>VS</div>

          {/* Remagent */}
          <div className={style.compareCard + " " + style.remagent}>
            <div className={style.compareTag + " " + style.compareTagTeal}>Remagent</div>
            <ul className={style.compareList}>
              <li className={style.compareItem + " " + style.good}>Log in to the platform</li>
              <li className={style.compareItem + " " + style.good}>Filter pre-screened profiles</li>
              <li className={style.compareItem + " " + style.good}>See qualified candidates instantly</li>
              <li className={style.compareItem + " " + style.good}>Invite the people you want</li>
              <li className={style.compareItem + " " + style.good}>Interview only who you chose</li>
            </ul>
            <div className={style.compareTime + " " + style.timeGood}>5 minutes</div>
          </div>

        </div>

        {/* Filter attributes */}
        <div className={style.filtersWrap}>
          <p className={style.filtersTitle}>Filter on what actually matters:</p>
          <div className={style.filtersGrid}>
            {filters.map((f, i) => (
              <div key={i} className={style.filterChip}>
                <span className={style.filterCheck}>✓</span>
                {f.label}
              </div>
            ))}
          </div>
          <p className={style.filtersNote}>
            Every profile is structured data — not a resume PDF.
            Spend five minutes here and you might eliminate three weeks of recruiting.
          </p>
        </div>

      </div>
    </section>
  );
}
