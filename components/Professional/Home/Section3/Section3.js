import style from "./Section3.module.css";

const steps = [
  {
    num: "1",
    title: "Build Your Profile",
    desc: "Tell us about your contact center experience, the platforms you know, your availability, and what pay you're looking for. Takes about 20 minutes.",
  },
  {
    num: "2",
    title: "Get Discovered",
    desc: "Your profile becomes searchable by businesses actively hiring. You don't apply — employers come to you based on your specific skills and availability.",
  },
  {
    num: "3",
    title: "Respond to Invitations",
    desc: "When a business invites you to apply, you review the opportunity and decide if it's the right fit. You stay in control of every step.",
  },
  {
    num: "4",
    title: "Work Remotely, On Your Terms",
    desc: "Set your own schedule and rate. Work from home for legitimate companies that need exactly your skill set — without the commute or the office politics.",
  },
];

export default function Section3() {
  return (
    <section className={style.section} id="how">
      <div className={style.inner}>

        <div className={style.header}>
          <span className={style.label}>Simple Process</span>
          <h2 className={style.title}>
            How It Works for <span className={style.accent}>Professionals</span>
          </h2>
          <p className={style.subtitle}>
            Four steps from profile to paycheck — and you're in control of every one.
          </p>
        </div>

        <div className={style.panel}>
          <div className={style.steps}>
            {steps.map((s) => (
              <div key={s.num} className={style.step}>
                <div className={style.stepNum}>{s.num}</div>
                <div className={style.stepBody}>
                  <div className={style.stepTitle}>{s.title}</div>
                  <p className={style.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={style.imageWrap}>
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80"
              alt="Professional working from home"
              className={style.image}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
