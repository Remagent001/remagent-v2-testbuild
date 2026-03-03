import FilterButtons from "./FilterButtons";
import JobList from "./JobList";
import style from "./Section3.module.css";
export default function Section3() {
    return (
        <div className="find-job-area pb-100">
            <div className="container">
                <div className={style['section-title']}>
                    <h2>Find Your Best Jobs</h2>
                    <p>155 jobs live - 30 added today</p>
                </div>
                <FilterButtons />
                <JobList />
                <div className="text-center">
                    <a href="job-listing.html" className={"btn " + style['default-btn']}>Browse All Jobs</a>
                </div>
            </div>
        </div>
    );
}
