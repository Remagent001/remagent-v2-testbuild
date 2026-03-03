"use client";
import { useState } from "react";
import style from "./Section3.module.css";

const employerSteps = [
  {
    num: "1",
    title: "Create a Free Business Profile",
    desc: "Sign up in minutes. Tell us about your company and the types of roles you typically hire for.",
  },
  {
    num: "2",
    title: "Search & Filter Pre-Screened Talent",
    desc: "Apply filters — platform expertise, channel experience, availability, pay expectations, language, and more. Instantly see candidates who match.",
  },
  {
    num: "3",
    title: "Invite the People You Want",
    desc: "Select the candidates you like and invite them to apply for your role. No posting. No inbox full of unqualified resumes.",
  },
  {
    num: "4",
    title: "Interview & Hire",
    desc: "Meet your shortlist, make your selection, and get your new team member working — often within days, not weeks.",
  },
];

const professionalSteps = [
  {
    num: "1",
    title: "Build Your Profile",
    desc: "Tell us about your contact center experience, the platforms you know, your availability, and what pay you're looking for. Takes about 20 minutes.",
  },
  {
    num: "2",
    title: "Get Discovered",
    desc: "Your profile becomes searchable by businesses actively hiring. You don't apply — employers come to you based on your specific skills.",
  },
  {
    num: "3",
    title: "Respond to Invitations",
    desc: "When a business invites you to apply, you review the opportunity and decide if it's the right fit. You stay in control.",
  },
  {
    num: "4",
    title: "Work Remotely, On Your Terms",
    desc: "Set your own schedule and rate. Work from home for legitimate companies that need exactly your skill set.",
  },
];

export default function Section3() {
  const [tab, setTab] = useState("employers");

  const steps = tab === "employers" ? employerSteps : professionalSteps;
  const image =
    tab === "employers"
      ? "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=700&q=80"
      : "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=700&q=80";
  const imageAlt =
    tab === "employers"
      ? "Business team reviewing candidates"
      : "Professional working remotely from home";

  return (
    <section className={style.section}>
      <div className={style.inner}>

        <div className={style.header}>
          <span className={style.label}>Simple Process</span>
          <h2 className={style.title}>
            How <span className={style.accent}>Remagent</span> Works
          </h2>
          <p className={style.subtitle}>
            Whether you're hiring or looking for work, the process is fast,
            transparent, and built around your needs.
          </p>
        </div>

        <div className={style.tabs}>
          <button
            className={style.tab + (tab === "employers" ? " " + style.tabActive : "")}
            onClick={() => setTab("employers")}
          >
            For Businesses
          </button>
          <button
            className={style.tab + (tab === "professionals" ? " " + style.tabActive : "")}
            onClick={() => setTab("professionals")}
          >
            For Professionals
          </button>
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
            <img src={image} alt={imageAlt} className={style.image} />
          </div>
        </div>

      </div>
    </section>
  );
}
