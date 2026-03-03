"use client";
import { useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa"; // Import plus and minus icons
import style from "./Section4.module.css";

export default function Section4() {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleAccordionToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Data with questions and answers
  const data = [
    {
      question: "Labor Market Challenges",
      answer: `Today's labor market is more challenging than ever. Once you get through the funnel, there is still a chance that you will struggle to hire the professionals that you make offers to. The top five reasons candidates turn down offers:

      At Remagent, we have turned the process upside down. When Remagent Professionals build their profile, they identify the experience they have, the type of job they are looking for and willing to accept, if they are able to work from home or come into an office, the amount of pay they are willing to work for, and most importantly; the schedule they are willing to work.

      If you are looking for agents that will only work Monday, Wednesday, Friday, from 11:00 AM to 3:00 PM, then you will only be presented with agents that fit those criteria.`,
    },
    {
      question: "The Daily Wave – Peaks and Valleys",
      answer: `All contact centers deal with peaks and valleys in call volume leading to staffing (and cost) for Peak Busy Hour. Peak Busy Hour typically translates to the number of agents you will pay for 8 hours of work, when many of them are only needed for 2-3 hours of the day. Companies use Remagent Professionals to fill time above the required staffing level.

      Many Remagent Professionals fit the persona of stay-at-home parents, college students, or people who just need some extra income, but don't want a 9-to-5 job.

      As an example, one Remagent client only needs 5 extra Customer Support Agents to answer calls between 10:00 am and 1:00 pm, Monday through Thursday. This schedule fits perfectly for the type of Remagent Professional who drops their children off at school at 8:00 in the morning and picks them up at 3:30 PM. The extra income for working 12 hours per week is perfect for this professional to keep them busy and also work with a schedule that is perfect for them.

      The diagram depicts the peak and valley cycles in a typical contact center business. Staffing levels above the line are representative of an area where flexible staffing will ideally be utilized and below the line indicates the permanent staff component from your organization.

      Flexible staffing provides your company with the ability to staff for daily, monthly, or seasonal peaks, special projects, disaster planning, marketing campaigns, and more. Remagent can effectively manage unforeseen and planned circumstances.`,
    },
    {
      question: "On-Demand Staffing",
      answer: `In addition to daily "Peaks and Valleys," many businesses deal with monthly and annual seasonal volume, and even unanticipated volume spikes. Remagent Professionals can help fill this void as well. Remagent Professionals can be "on-call" and ready to assist with little to no notice.`,
    },
    {
      question: "Our Experts",
      answer: `Our operations team are experienced contact center professionals, not just staffing personnel. Our in-house experts are able to assist with everything from your company's technical needs to get agents working from home on your systems, to working with your Workforce Management Team to determine the right staffing model and how Remagent can fit best to optimize your workforce.`,
    },
  ];

  return (
    <section className={"pb-5 " + style["faq-section"]}>
      <div className="container">
        <div className="row gy-lg-0 gy-4">
          <div className="col-lg-12 col-md-12">
            <div className={style["faq-content"]}>
              <div
                className={"accordion " + style.accordion}
                id="accordionExampleTwo"
              >
                {data.map((item, index) => (
                  <div
                    className={"accordion-item px-4 " + style["accordion-item"]}
                    key={index}
                  >
                    <h2
                      className={
                        "accordion-header " + style["accordion-header"]
                      }
                      id={`heading${index}`}
                    >
                      <button
                        className={
                          "accordion-button " +
                          (activeIndex === index ? "" : "collapsed") +
                          " " +
                          style["accordion-button"]
                        }
                        type="button"
                        style={{ letterSpacing: 1 }}
                        onClick={() => handleAccordionToggle(index)}
                      >
                        {item.question}
                        <span className={style.icon}>
                          {activeIndex === index ? (
                            <FaMinus className="ms-2" />
                          ) : (
                            <FaPlus className="ms-2" />
                          )}
                        </span>
                      </button>
                    </h2>
                    <div
                      id={`collapse${index}`}
                      className={`accordion-collapse collapse ${
                        activeIndex === index ? "show" : ""
                      }`}
                      aria-labelledby={`heading${index}`}
                      data-bs-parent="#accordionExampleTwo"
                      style={{ transition: "height 0.3s ease" }}
                    >
                      <div
                        className={
                          "accordion-body " + style["accordion-body"]
                        }
                        style={{ letterSpacing: 1 }}
                      >
                        {item.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
