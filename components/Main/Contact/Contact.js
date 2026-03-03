import { MdLocationPin } from "react-icons/md";
import style from "./Contact.module.css";
import ContactForm from "./ContactForm";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";

export default function Contact() {
  return (
    <>
      <div className="contact-us-area pt-100 pb-70">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className={style["single-contact-info-box"]}>
                <div className={style["info-content"]}>
                  <div className={style.icon}>
                    <MdLocationPin />
                  </div>
                  <h3>Our location</h3>
                  <span>
                    CA 560 bush st & 20th ave, apt 5 san francisco,230909,
                    canada
                  </span>
                </div>
              </div>
              <div className={style["single-contact-info-box"]}>
                <div className={style["info-content"]}>
                  <div className={style.icon}>
                    <FaEnvelope />
                  </div>
                  <h3>Email Us</h3>
                  <a href="https://templates.hibootstrap.com/cdn-cgi/l/email-protection#167e737a7a7956717b777f7a3875797b">
                    <span
                      className="__cf_email__"
                      data-cfemail="e58d8089898aa58288848c89cb868a88"
                    >
                      [email&#160;protected]
                    </span>
                  </a>
                  <a href="https://templates.hibootstrap.com/cdn-cgi/l/email-protection#1254736a52757f737b7e3c717d7f">
                    <span
                      className="__cf_email__"
                      data-cfemail="cf89aeb78fa8a2aea6a3e1aca0a2"
                    >
                      [email&#160;protected]
                    </span>
                  </a>
                </div>
              </div>
              <div className={style["single-contact-info-box"]}>
                <div className={style["info-content"]}>
                  <div className={style.icon}>
                    <FaPhoneAlt />
                  </div>
                  <h3>Phone</h3>
                  <a href="tel:+44587154756">+44 587 154756</a>
                  <a href="tel:+55555514574">+55555514574</a>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className={style["contact-map"]}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12711295.912702927!2d-97.8942370839028!3d38.93897514662292!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54eab584e432360b%3A0x1c3bb99243deb742!2sUnited%20States!5e0!3m2!1sen!2sbd!4v1654928837073!5m2!1sen!2sbd"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="contact-form-area pb-100">
        <div className="container">
          <div className={style["section-title"]}>
            <span>SEND MESSAGE</span>
            <h2>Ready To Get Started?</h2>
          </div>
          <div className={style["contact-form"]}>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
