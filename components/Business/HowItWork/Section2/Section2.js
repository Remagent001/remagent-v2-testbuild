import style from "./Section2.module.css";
export default function Section2() {
  const steps = [
    {
      stepNumber: "1",
      stepTitle: "Create Your Business Profile",
      stepDescription: `It takes minutes to create your business profile. All that is needed is basic information. You can provide as much information as you would like to let candidates know about your business. Once a business profile has been created, you can search for candidates immediately.`,
    },
    {
      stepNumber: "2",
      stepTitle: "Business Contracting",
      stepDescription: `Remagent has a simple and basic master services agreement allowing you to do business through Remagent. Once signed electronically, you will be able to search for candidates and begin making offers.`,
    },
    {
      stepNumber: "3",
      stepTitle: "You Invite Who You Want To Meet",
      stepDescription: `Our platform allows Remagent clients to enter a few search criteria and be provided immediately with a list of Remagent Professionals meeting your criteria and ready to work. After that, it is simple, just select "Show Interest" in the candidates you are interested in, and they will be invited to review your job posting.`,
    },
    {
      stepNumber: "4",
      stepTitle: "Create a Job Post",
      stepDescription: `It takes less than ten minutes to create a Job Posting. The Job Posting will provide the basic information that a candidate would ask to inquire about a role. You can keep Job Posting private, allowing only candidates whom you have chosen to review the posting or you can publish the posting for all Remagent Professionals to see.`,
    },
    {
      stepNumber: "5",
      stepTitle: "Agent Contracting",
      stepDescription: `You will choose if you want to hire the candidate full-time as an employee or contract through Remagent. If you hire the candidate directly, you can follow your normal HR hiring process. If contracting through Remagent, you will agree on terms with the candidate and a contract will be produced between you and Remagent for the candidate's work. The contract will be signed electronically by all parties, and onboarding can begin.`,
    },
    {
      stepNumber: "6",
      stepTitle: "Agent Onboarding",
      stepDescription: `Once a start date is set, we can work with you to get the agent ready for onboarding, or you can handle it on your own. Most companies have a process for agreeing on and preparing the required technology setup and onboarding the Remagent Professional. This might include training, followed by a nesting period and then promoting the agent into production.`,
    },
  ];

  return (
    <section className={"pb-5 pt-50 "+style['steps-section']}>
      <div className="container">
        {steps.map((step, index) => (
          <div className={style['step']} key={index}>
            <div className={style['step-number']}>{step.stepNumber}</div>
            <div className={style['step-content']}>
              <div className={style['step-title']}>{step.stepTitle}</div>
              <div className={style['step-description']}>{step.stepDescription}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
