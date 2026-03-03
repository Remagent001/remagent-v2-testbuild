"use client";
import { useState } from "react";
import {
  FaBriefcase,
  FaChartLine,
  FaAward,
  FaShieldAlt,
  FaDollarSign,
} from "react-icons/fa";
import style from "./Section3.module.css";

export default function Section3() {
  // Feature cards data array with React Icons
  const features = [
    {
      icon: <FaBriefcase />,
      title: "Tailored Job Matches",
      description:
        "With your profile fully built, we ensure that the opportunities coming your way are aligned...",
      fullDescription:
        "With your profile fully built, we ensure that the opportunities coming your way are aligned with your experience, skills, and career goals. Businesses can search for specific qualifications, ensuring a better fit between you and potential employers. This personalized matching reduces the hassle of finding the right job.",
      link: "#",
    },
    {
      icon: <FaChartLine />,
      title: "Showcase Your Value",
      description:
        "Your profile at Remagent does more than just list your previous roles—it highlights the unique value...",
      fullDescription:
        "Your profile at Remagent does more than just list your previous roles—it highlights the unique value you bring to employers. Whether it’s your language skills, customer service expertise, or experience in handling high-pressure situations, your profile makes sure businesses know exactly what makes you the best fit for their needs.",
      link: "#",
    },
    {
      icon: <FaAward />,
      title: "Focus on Long-Term Career Growth",
      description:
        "Remagent isn’t just for finding short-term gigs—it’s a platform that can help you build a lasting career...",
      fullDescription:
        "Remagent isn’t just for finding short-term gigs—it’s a platform that can help you build a lasting career. By maintaining and updating your profile, businesses can continue to reach out with new opportunities that align with your evolving skills and experience, supporting your long-term professional development.",
      link: "#",
    },
    {
      icon: <FaShieldAlt />,
      title: "Simple and Secure",
      description:
        "The platform is designed with ease and security in mind. Your personal information and job preferences...",
      fullDescription:
        "The platform is designed with ease and security in mind. Your personal information and job preferences are kept secure, and you have full control over who sees your profile and when. Remagent ensures a professional and safe environment, so you can focus on finding the right opportunities without any hassle.",
      link: "#",
    },
    {
      icon: <FaDollarSign />,
      title: "Get Paid What You’re...",
      description:
        "With Remagent, you control your earning potential. Set your own hourly rate based on your...",
      fullDescription:
        "With Remagent, you control your earning potential. Set your own hourly rate based on your experience, skills, and the value you bring. Employers seeking talent on Remagent are ready to pay for the quality of work you provide, so you won’t need to negotiate and feel underpaid for your contributions.",
      link: "#",
    },
  ];

  // State to track the expanded state of each feature card
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleLearnMoreClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index); // Toggle expanded state
  };

  return (
    <section className={style["features-section"]}>
      <div className="container">
        <div className="row g-4">
          {features.map((feature, index) => (
            <div className="col-md-4" key={index}>
              <div className={"card p-3 h-100 " + style["feature-card"]}>
                <div className={style["feature-icon"]}>{feature.icon}</div>
                <div className={style["feature-title"]}>{feature.title}</div>
                {/* Conditionally render description or fullDescription based on expandedIndex */}
                {expandedIndex === index ? (
                  <div className={style["feature-full-description"]}>
                    {feature.fullDescription}
                  </div>
                ) : (
                  <div className={style["feature-description"]}>
                    {feature.description}
                  </div>
                )}
                <a
                  href={feature.link}
                  className={style["learn-more"]}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLearnMoreClick(index);
                  }}
                >
                  {expandedIndex === index ? "Show less" : "Show more"}{" "}
                  <span className="arrow-icon">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
