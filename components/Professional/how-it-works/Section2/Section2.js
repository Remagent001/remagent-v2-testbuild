import dynamic from "next/dynamic";
import style from "./Section2.module.css";
const Section2Swiper = dynamic(() => import("./Section2Swiper"), {
  ssr: false,
});
export default function Section2() {
  const data = [
    {
      id: 1,
      img: "/assets/images/3d-images/create-your-profile.png",
      title: "Create Your Profile",
      description:
        "The first step is to build a profile. Don’t worry, this will not take long, and you will always be able to easily edit and update it. The system will ask you to include your experience, skills, languages spoken, and the types of roles you’re looking for. You can also set your preferred hourly rate and availability.",
    },
    {
      id: 2,
      img: "/assets/images/professionals/system.png",
      title: "Screening Interview with Remagent",
      description:
        "After you’ve created your profile, someone from the Remagent team will review your information. As part of our process, we may reach out to schedule a brief screening interview. During this call, we’ll assess your profile, answer any questions, and offer recommendations on how you can improve your chances of getting matched with and selected by the right employers. This step helps ensure your profile is as strong as possible before it goes live for businesses to view.",
    },
    {
      id: 3,
      img: "/assets/images/3d-images/let-employers-find-you.png",
      title: "Let Employers Find You",
      description:
        "Once your profile is complete and reviewed, you’re ready to go! Unlike traditional job search platforms, you won’t have to hunt for jobs. Employers looking for talent like yours will browse profiles and reach out directly with opportunities that match your skill set. All you need to do is wait for the right fit to come along.",
    },
    {
      id: 4,
      img: "/assets/images/professionals/design.png",
      title: "Respond to Job Offers",
      description:
        "When a business expresses interest in your profile, you’ll be notified via text message or email to check your inbox for the invitation to apply. You’ll be able to review the job details, including hours, pay, and job requirements, and decide if the position is a good fit for you. You will be able to request more information, video or voice call for a discussion, and also accept or decline any job offers on your terms.",
    },
    {
      id: 6,
      img: "/assets/images/3d-images/interview-and-get-startted.png",
      title: "Interview and Get Started",
      description:
        "If you accept a job offer, the employer may schedule an interview to finalize details and ensure you’re the right fit for their team. Remagent will help broker the work assignment and ensure that all parties are clear on expectations of the work. Once both parties are satisfied, you can get started! Whether it’s a short-term gig, part-time work, or a longer-term position, you’ll be able to hit the ground running quickly.",
    },
    {
      id: 7,
      img: "/assets/images/3d-images/goto-work.png",
      title: "Go To Work",
      description:
        "Once you’ve accepted a role, it’s time to get to work. Depending on the job, you might be working remotely from home or onsite at a call center or customer support location. Remagent ensures a seamless transition into your new role, with clear instructions provided by your employer. You’ll have everything you need to start confidently and contribute from day one. Plus, with the support of the Remagent platform, you can track your work hours, stay in touch with your employer, and manage your workload all in one place.",
    },
    {
      id: 8,
      img: "/assets/images/3d-images/get-paid-on-your-terms.png",
      title: "Get Paid on Your Terms",
      description:
        "Since you set your own hourly rate, you know exactly what you’ll be earning. Remagent does not take a cut from your pay—what you earn is entirely yours. Payments are handled securely through the platform, ensuring you get paid fairly and on time for every job you complete. No surprises—just the rate you set from the beginning.",
    },
    {
      id: 9,
      img: "/assets/images/3d-images/keep-building-your-profile.png",
      title: "Keep Building Your Profile",
      description:
        "The more you work, the more opportunities will come your way. As you gain experience, you can update your profile with new skills, certifications, and feedback from employers. This helps keep your profile fresh and increases your chances of being matched with higher-paying jobs that suit your growing expertise.",
    },
    {
      id: 10,
      img: "/assets/images/3d-images/enjoy-continous-opportunities.png",
      title: "Enjoy Continuous Opportunities",
      description:
        "Remagent is designed to be more than a one-time job search tool. It’s a platform that continuously matches you with businesses looking for talent like yours. As new opportunities arise, you’ll be able to respond quickly and choose the jobs that best fit your evolving career goals.",
    },
  ];

  return (
    <>
      <div className={" ptb-100 " + style["job-categories-area"]}>
        <div className="container">
          <Section2Swiper data={data} />
        </div>
      </div>
    </>
  );
}
