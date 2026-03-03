import Image from 'next/image'
import Link from 'next/link'
import style from "./Footer.module.css"
// import dynamic from 'next/dynamic';
import { FaFacebookF, FaInstagram, FaRegCopyright } from 'react-icons/fa';
import { BsTwitterX } from 'react-icons/bs';
// const FaFacebookF = dynamic(() => import('react-icons/fa').then(mod => mod.FaFacebookF));
// const FaInstagram = dynamic(() => import('react-icons/fa').then(mod => mod.FaInstagram));
// const BsTwitterX = dynamic(() => import('react-icons/bs').then(mod => mod.BsTwitterX));
// const FaRegCopyright = dynamic(() => import('react-icons/fa').then(mod => mod.FaRegCopyright));
const currentYear = new Date().getFullYear();
export default function Footer() {
    return (
        <>
            <div className="footer-area bg-color pt-100 pb-70">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-4 col-sm-6">
                            <div className={style['single-footer-widget'] + " " + style['logo-content']}>
                                <div className={"text-center " + style['footer-logo']}>
                                    <Link href={process.env.SITE_URL}><Image width={160} height={75} src={process.env.SITE_LOGO1} alt="Image" /></Link>
                                </div>
                                <p>Lorem ipsum dolor sit amet, consec tetur adipiscing elit eiusmod tempor incididunt labore dolore magna aliqua consec tetur adipiscing elite sed do labor.</p>
                                <div className={style['social-content']}>
                                    <ul>
                                        <li>
                                            <span>Follow Us:</span>
                                        </li>
                                        <li>
                                            <Link href="#/\" target="_blank"><FaFacebookF /></Link>
                                        </li>
                                        <li>
                                            <Link href="#/\" target="_blank"><BsTwitterX /></Link>
                                        </li>
                                        <li>
                                            <Link href="#/\" target="_blank"><FaInstagram /></Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <div className={style['single-footer-widget'] + " " + style['quick-link']}>
                                <h3>For Employer</h3>
                                <ul>
                                    <li><Link href="#\">Browse Candidates</Link></li>
                                    <li><Link href="#\">Employers Dashboard</Link></li>
                                    <li><Link href="#\">Job Packages</Link></li>
                                    <li><Link href="#\">Jobs Featured</Link></li>
                                    <li><Link href="#\">Post A Job</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-2 col-sm-6">
                            <div className={style['single-footer-widget'] + " " + style['quick-link']}>
                                <h3>Company</h3>
                                <ul>
                                    <li><Link href="#\">About Us</Link></li>
                                    <li><Link href="#\">Contact Us</Link></li>
                                    <li><Link href="#\">Terms &amp; Conditions</Link></li>
                                    <li><Link href="#\">Privacy Policy</Link></li>
                                    <li><Link href="#\">Candidate Listing</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <div className={style['single-footer-widget'] + " " + style.info}>
                                <h3>Official Info</h3>
                                <ul>
                                    <li>
                                        <i className="fa-solid fa-location-dot" />
                                        <h4>Location:</h4>
                                        <span>2976 Sunrise Road, Las Vegas</span>
                                    </li>
                                    <li>
                                        <i className="fa-solid fa-envelope" />
                                        <h4>Email:</h4>
                                        <Link href="mailto:dummyemail@example.com">
                                            dummyemail@example.com
                                        </Link>
                                    </li>
                                    <li>
                                        <i className="fa-solid fa-phone" />
                                        <h4>Phone:</h4>
                                        <Link href="tel:098765432150">098765432150</Link>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={style['copy-right']}>
                <div className="container">
                    <p><FaRegCopyright /> {currentYear} <span>REMAGENT</span> Designed & Developed by <Link href="https://www.ksofttechnologies.com/" target="_blank">KSoftTechnologies</Link></p>
                </div>
            </div>
        </>
    )
}
