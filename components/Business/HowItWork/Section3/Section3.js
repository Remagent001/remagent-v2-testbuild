import style from "./Section3.module.css";

export default function Section3() {
  const sections = [
    {
      title: "Payments",
      description: `At the end of every week, an invoice is sent with the billable hours for each agent at their associated rate. Once approved, a single invoice will be sent for the cost of all work performed. This can be done on a weekly, bi-weekly, or monthly basis. Your company will pay Remagent, and Remagent will pay the individual agents.`,
    },
    {
      title: "Extensive Database",
      description: `As you use Remagent Professionals, you are able to provide them with ratings so that others can see how each agent performed, which can assist in making decisions for future use.`,
    },
  ];

  return (
    <section className={"pb-100 " + style["section-2-bg"]}>
      <div className="container">
        <div className="row gy-4">
          {sections.map((section, index) => (
            <div className="col-md-12" key={index}>
              <div className={style["section-2-title"]}>{section.title}</div>
              <p
                className={style["section-2-description"]}
                dangerouslySetInnerHTML={{ __html: section.description }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
