"use client"; // Ensure it's a client component

import CountUp from "react-countup";
import style from "./Counter.module.css";

export default function CounterSection({ counters }) {
  return (
    <div className="counters-area bg-f0f5f7 pt-100 pb-70">
      <div className="container">
        <div className={style["section-title"]}>
          <h2>Jaba Site Status Here</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod
          </p>
        </div>
        <div className="row">
          {counters.map((counter, index) => (
              <div key={index} className={`col-md-3 col-6 ${style.customCounterCol}`}>
              <div className={`${style["single-counter-item"]} ${style["style-2"]}`}>
                <div className={style.icon}>{counter.icon}</div>
                <h1>
                  <CountUp
                    start={0}
                    end={counter.value}
                    duration={2.5} // Customize animation duration here
                    separator=","
                    enableScrollSpy
                  />
                  {counter.suffix && <span className="target">{counter.suffix}</span>}
                </h1>
                <p>{counter.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
