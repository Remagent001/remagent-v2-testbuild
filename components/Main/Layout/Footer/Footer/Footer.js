import Link from "next/link";
import style from "./Footer.module.css";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaRegCopyright,
  FaYoutube,
} from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";

const currentYear = new Date().getFullYear();
export default function Footer() {
  return (
    <>
      <div className="footer-area bg-color pt-100 pb-70">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-sm-6">
              <div className={style["single-footer-widget"] + " " + style.info}>
                <h3>Support</h3>
                <ul>
                  <li className="gap-4">
                    <span>
                      <FaPhoneAlt />
                    </span>

                    <Link href={`tel:${process.env.MOBILE_NO}`}>
                      {process.env.MOBILE_NO}
                    </Link>
                  </li>
                  <li className="gap-4">
                    <span>
                      <FaEnvelope />
                    </span>
                    <Link href={`mailto:${process.env.EMAIL}`}>
                      {process.env.EMAIL}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div
                className={
                  style["single-footer-widget"] + " " + style["quick-link"]
                }
              >
                <h3>Useful links</h3>
                <ul>
                  <li>
                    <Link href={process.env.SITE_URL + "/about-us"}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/security"}>
                      Security
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/contact-us"}>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/terms-and-conditions"}>
                      Terms And Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-2 col-sm-6">
              <div
                className={
                  style["single-footer-widget"] + " " + style["quick-link"]
                }
              >
                <ul>
                  <li>
                    <Link href={process.env.SITE_URL + "/how-it-works"}>
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/investor"}>
                      Investor
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/privacy-policy"}>
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href={process.env.SITE_URL + "/copyright-policy"}>
                      Copyright Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div
                className={
                  style["single-footer-widget"] + " " + style["logo-content"]
                }
              >
                <h3>Let’s Talk</h3>
                <div className={style["social-content"]}>
                  <ul>
                    <li>
                      <Link
                        href="https://facebook.com/"
                        target="_blank"
                        aria-label="facebook"
                      >
                        <FaFacebookF />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://twitter.com/Remagent3"
                        target="_blank"
                        aria-label="twitter"
                      >
                        <BsTwitterX />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://www.instagram.com/remagentinc/"
                        target="_blank"
                        aria-label="instagram"
                      >
                        <FaInstagram />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://www.youtube.com/channel/UCXp8rb9aVHHcZAIzMmGTdWg"
                        target="_blank"
                        aria-label="youtube"
                      >
                        <FaYoutube />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={style["copy-right"]}>
        <div className="container">
          <p>
            <FaRegCopyright /> {currentYear} <span>REMAGENT</span> Designed &
            Developed by{" "}
            <Link href="https://www.ksofttechnologies.com/" target="_blank">
              KSoftTechnologies
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
