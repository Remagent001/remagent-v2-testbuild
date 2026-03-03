"use client";
import { useEffect } from "react";
import mixitup from "mixitup";
import style from "./Section3.module.css";
export default function FilterButtons() {
  useEffect(() => {
    mixitup("#Container", {
      selectors: {
        target: ".mix"
      },
      animation: {
        duration: 300
      }
    });
  }, []);
  return (
    <>
      <div className={style['shoting-btn']}>
        <ul>
          <li><button className="filter" data-filter="all">All Categories</button></li>
          <li><button className="filter" data-filter=".design">Design</button></li>
          <li><button className="filter" data-filter=".marketing">Marketing</button></li>
          <li><button className="filter" data-filter=".service">Service</button></li>
          <li><button className="filter" data-filter=".health-care">Health Care</button></li>
          <li><button className="filter" data-filter=".writing">Writing</button></li>
          <li><button className="filter" data-filter=".business">Business</button></li>
        </ul>
      </div>
    </>
  );
}
