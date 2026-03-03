import Link from 'next/link'
import style from "./Cta.module.css"
export default function Cta() {
    return (
        <>
            <div className={"bg-f0f5f7 shadow-lg " + style['contact-area']}>
                <div className="container">
                    <div className="align-items-center gap-3 gap-sm-0 row">
                        <div className="col-lg-8 col-md-9">
                            <div className={"text-center text-sm-start " + style['contact-left-content']}>
                                <h2>Find Your Next Great Job Opportunity!</h2>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-3">
                            <div className={"text-center text-sm-end " + style['contact-btn']}>
                                <Link href="#/\" className={" btn " + style['default-btn']}>Contact Us Now</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}
