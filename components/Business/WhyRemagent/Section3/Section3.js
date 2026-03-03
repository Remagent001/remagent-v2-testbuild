import style from "./Section3.module.css";
export default function Section3() {
  const infoItems = [
    "80% of Professionals have a college degree",
    "Many have Master's degrees",
    "Average age is 35 years with around 15 years of work experience",
    "100% of Professionals are 'Comfortable Virtually,' meaning they are ready to work from home",
    "Located in 36 states across the U.S. and in Canada",
    "Full-time, Part-time, People with disabilities, Parents, Military affiliated, Retirees",
  ];

  return (
    <>
      <section className={style['professional-section']}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4 text-center">
              {/* Character Image with Rounded Borders */}
              <div className={style['character-container']}>
                <img
                  src="/assets/images/business/why-remagent/2.png"
                  alt="Character"
                  className={style['character-image']}
                />
              </div>
            </div>
            <div className="col-md-8">
              {/* Information List */}
              <ul className={"list-unstyled " + style['info-list']}>
                {infoItems.map((item, index) => (
                  <li key={index} className={style['info-item']}>
                    {item}
                    {/* <span className={style['arrow-icon']}>→</span> */}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
