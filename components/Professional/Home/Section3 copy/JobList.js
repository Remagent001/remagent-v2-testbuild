import Link from "next/link";
import style from "./Section3.module.css";
import dynamic from "next/dynamic";
const FaLocationDot = dynamic(() => import("react-icons/fa6").then(mod => mod.FaLocationDot), { ssr: false });
const FaRegBookmark = dynamic(() => import("react-icons/fa6").then(mod => mod.FaRegBookmark), { ssr: false });
const FaRegClock = dynamic(() => import("react-icons/fa6").then(mod => mod.FaRegClock), { ssr: false });
export const jobData = [
    {
        id: 1,
        category: ['marketing', 'writing'],
        image: "/assets/images/job/job-img-1.jpg",
        companyLogo: "/assets/images/icons/icon-2.png",
        title: "UI/UX Design Pattern For Successful Software Applications",
        company: "Solit IT Solution",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "3 Days Left",
        fulltime: true
    },
    {
        id: 2,
        category: ['design', 'health-care', 'business'],
        image: "/assets/images/job/job-img-2.jpg",
        companyLogo: "/assets/images/icons/icon-3.png",
        title: "Basic Knowledge About Hodiernal Bharat In History",
        company: "Constik Solution",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "5 Days Left",
        urgent: true,
        fulltime: true
    },
    {
        id: 3,
        category: ['service', 'health-care', 'business'],
        image: "/assets/images/job/job-img-3.jpg",
        companyLogo: "/assets/images/icons/icon-4.png",
        title: "Visual Effects For Games In Unity Beginner To Intermediate",
        company: "Medizo Health Care",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "8 Days Left",
        fulltime: true
    },
    {
        id: 4,
        category: ['design', 'marketing', 'writing'],
        image: "/assets/images/job/job-img-4.jpg",
        companyLogo: "/assets/images/icons/icon-5.png",
        title: "The Complete Accounting & Bank Financial Course 2024",
        company: "INVA Business Solution",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "4 Days Left",
        fulltime: true
    },
    {
        id: 5,
        category: ['service', 'health-care', 'business'],
        image: "/assets/images/job/job-img-5.jpg",
        companyLogo: "/assets/images/icons/icon-6.png",
        title: "The Complete Business Plan Course Includes 40 Templates",
        company: "Pufo Corporation",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "8 Days Left",
        fulltime: true
    },
    {
        id: 6,
        category: ['design', 'service', 'writing'],
        image: "/assets/images/job/job-img-6.jpg",
        companyLogo: "/assets/images/icons/icon-7.png",
        title: "Full Web Designing Course With 20 Web Template Designing",
        company: "Abaz News Magazine",
        location: "42, Malsh Street, USA",
        salary: "$120 /Month",
        daysLeft: "2 Days Left",
        urgent: true,
        fulltime: true
    }
];

export default function JobList() {
    return (
        <div id="Container" className="row justify-content-center">
            {jobData.map((job) => (
                <div key={job.id} className={`col-lg-4 col-md-6 mix ${job.category.join(' ')}`}>
                    <div className={style['single-job-card']}>
                        <div className={style['job-image']}>
                            <Link href="#"><img src={job.image} alt="Job Image" className="w-100" /></Link>
                            <Link href="#"><div className={style.bookmark}>
                                <FaRegBookmark size={18} />
                            </div></Link>
                            {job.urgent && <span className={style.urgent}>Urgent</span>}
                        </div>
                        <div className={style['job-content']}>
                            {job.fulltime && <span className={style.time}>Fulltime</span>}
                            <h2><Link href="#">{job.title}</Link></h2>
                            <div className={style.info}>
                                <ul>
                                    <li><FaRegClock size={16} />{job.daysLeft}</li>
                                    <li><FaLocationDot />{job.location}</li>
                                </ul>
                            </div>
                            <div className={style['bottom-content']}>
                                <ul className="d-flex justify-content-between">
                                    <li>
                                        <div className={style['left-content']}>
                                            <div className={style.icon}>
                                                <img src={job.companyLogo} alt="Company Logo" />
                                            </div>
                                            <span>{job.company}</span>
                                        </div>
                                    </li>
                                    <li><h3>{job.salary}</h3></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
