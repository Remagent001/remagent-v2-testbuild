import style from "./Section5.module.css";
export default function Section5() {
  const steps = [
    {
      stepNumber: "1",
      stepTitle: "Your Path to Better Opportunities",
      stepDescription: `At Remagent, we know how important it is for professionals like you to find the right job that matches your skills, schedule, and career goals. That’s why we’ve designed a platform that puts you in control. Whether you're looking for full-time, part-time, or freelance work in customer service, tech support, or other roles, Remagent is here to make the job search effortless and tailored to your needs.`,
    },
    {
      stepNumber: "2",
      stepTitle: "Control Your Job Search",
      stepDescription: `Forget endless applications and job boards. With Remagent, you create a detailed profile, and businesses come to you. Set your skills, experience, and hourly rate—then sit back and let employers find the right match for you.`,
    },
    {
      stepNumber: "3",
      stepTitle: "Flexible Opportunities",
      stepDescription: `No matter your availability or work style, Remagent offers flexibility. Whether you want to work remotely, part-time, or on-demand, the opportunities on our platform are designed to fit your lifestyle and schedule.`,
    },
    {
      stepNumber: "4",
      stepTitle: "Full Transparency—No Surprises",
      stepDescription: `You’ll always know what you're getting into. With Remagent, you set your own hourly rate and are paid what you deserve—no cuts or hidden fees. What you earn is yours to keep.`,
    },
    {
      stepNumber: "5",
      stepTitle: "Focus on What Matters",
      stepDescription: `Don’t waste time searching. By letting employers handle the search process, you can focus on improving your skills, building your career, and delivering great work. You’ll have the power to choose the right job for you without the hassle. <br/> Join Remagent today, and let the right opportunities find you. Build your professional profile and start getting matched with businesses who need your expertise.`,
    },
  ];

  return (
    <section className={"pb-100 " + style["steps-section"]}>
      <div className="container">
        {steps.map((step, index) => (
          <div className={style["step"]} key={index}>
            <div className={style["step-number"]}></div>
            <div className={style["step-content"]}>
              <div className={style["step-title"]}>{step.stepTitle}</div>
              <div
                className={style["step-description"]}
                dangerouslySetInnerHTML={{ __html: step.stepDescription }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
