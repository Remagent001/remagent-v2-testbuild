import Link from "next/link";
import style from "./Section4.module.css";

const testimonials = [
  {
    quote:
      "I worked in call centers through university and grad school. While waiting for the right opportunity, I posted my profile on Remagent. A company invited me to help with client services part-time during the holidays — and I've been with them ever since.",
    name: "Kenton F.",
    title: "Customer Service Specialist",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  },
  {
    quote:
      "Remagent lets me work for companies that are specifically looking for someone with my skills and my schedule. I've supported three different businesses and I love that they work within my availability.",
    name: "Jessica B.",
    title: "Contact Center Agent",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  },
  {
    quote:
      "I'm a stay-at-home dad with a Master's degree and I speak three languages. Within a week of signing up, I was training and taking calls for the French queue of an upscale retail brand. I drop my kids off at school and work four hours before pickup.",
    name: "Benjamin J.",
    title: "Bilingual Support Agent",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  },
];

export default function Section4() {
  return (
    <section className={style.section}>
      <div className={style.inner}>

        <div className={style.header}>
          <span className={style.label}>Real People. Real Stories.</span>
          <h2 className={style.title}>
            Hear from <span className={style.accent}>Remagent Professionals</span>
          </h2>
        </div>

        <div className={style.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={style.card}>
              <p className={style.quote}>"{t.quote}"</p>
              <div className={style.author}>
                <img src={t.img} alt={t.name} className={style.avatar} />
                <div>
                  <div className={style.name}>{t.name}</div>
                  <div className={style.role}>{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={style.cta}>
          <div className={style.ctaText}>
            <h3>Ready to find talent in minutes — not weeks?</h3>
            <p>It's free to explore. No commitment required.</p>
          </div>
          <div className={style.ctaBtns}>
            <Link href="/business" className={style.btnPrimary}>
              I'm Hiring →
            </Link>
            <Link href="/professional" className={style.btnSecondary}>
              I'm Looking for Work →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
