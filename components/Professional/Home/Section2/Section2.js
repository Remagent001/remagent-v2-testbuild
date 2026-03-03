import style from "./Section2.module.css";

const benefits = [
  {
    icon: "🎯",
    title: "You Don't Apply — You Get Invited",
    desc: "Forget submitting resumes into a void. Your profile becomes searchable by businesses actively hiring. When they like what they see, they send you the opportunity.",
  },
  {
    icon: "⏰",
    title: "Your Schedule. Your Rate.",
    desc: "Set the days and hours you're available. Set what you expect to earn. Companies filter for what matches — you only hear from businesses that fit your life.",
  },
  {
    icon: "🏠",
    title: "100% Remote. Legitimate Companies.",
    desc: "Every business on Remagent has real contact center operations that need remote talent. These are established companies — not gig postings or commission-only roles.",
  },
];

const attributes = [
  "Years of Contact Center Experience",
  "Platform Expertise (Genesys, Zendesk, Salesforce...)",
  "Channel Experience (Voice, Chat, Email, Omni)",
  "Availability — Days & Hours",
  "Pay Expectations",
  "Language Skills",
  "Industry Background (Healthcare, Retail, Financial...)",
  "Performance History",
];

export default function Section2() {
  return (
    <section className={style.section}>
      <div className={style.inner}>

        <div className={style.header}>
          <span className={style.label}>Why Remagent</span>
          <h2 className={style.title}>
            You Are More Than <span className={style.accent}>a Resume PDF.</span>
          </h2>
          <p className={style.subtitle}>
            Your Remagent profile is structured data — not a document employers
            skim and toss. Every skill, every platform, every hour you're
            available becomes a searchable filter that puts you in front of the
            right company.
          </p>
        </div>

        <div className={style.benefits}>
          {benefits.map((b, i) => (
            <div key={i} className={style.benefitCard}>
              <div className={style.benefitIcon}>{b.icon}</div>
              <h3 className={style.benefitTitle}>{b.title}</h3>
              <p className={style.benefitDesc}>{b.desc}</p>
            </div>
          ))}
        </div>

        <div className={style.attrWrap}>
          <p className={style.attrTitle}>Your profile includes everything employers actually filter on:</p>
          <div className={style.attrGrid}>
            {attributes.map((a, i) => (
              <div key={i} className={style.attrChip}>
                <span className={style.attrCheck}>✓</span> {a}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
