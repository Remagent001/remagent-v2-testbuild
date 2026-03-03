"use client";

import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import style from "./Contact.module.css"; // Assuming your CSS module is correctly set

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required"),
  phone_number: Yup.string()
    .trim()
    .required("Mobile Number is required")
    .matches(/^[+]?[0-9]*$/, "Mobile Number can only contain numbers")
    .min(6, "Mobile Number must be at least 6 characters long")
    .max(16, "Maximum 16 characters allowed"),

  email: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
      "Invalid Email"
    )
    .required("Email is required"),
  message: Yup.string().required("Message is required"),
  msg_subject: Yup.string().required("Subject is required"),
});

const ContactForm = () => {
  // Handle form submission
  const handleSubmit = async (values, { resetForm }) => {
    // API logic for sending email goes here
    // Example:
    // const response = await sendEmail(values);
    // if (response.success) {
    //   // Handle success
    // } else {
    //   // Handle failure
    // }
  };

  return (
    <Formik
      initialValues={{
        name: "",
        phone_number: "",
        email: "",
        message: "",
        msg_subject: "",
      }}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ isSubmitting }) => (
        <Form>
          <div className="row">
            {/* Name Field */}
            <div className="col-lg-6 col-sm-6">
              <div className={`form-group ${style["form-group"]}`}>
                <Field
                  type="text"
                  name="name"
                  placeholder="Name"
                  id="name"
                  className={`form-control ${style["form-control"]}`}
                />
                <ErrorMessage
                  name="name"
                  component="small"
                  className="text-danger"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="col-lg-6 col-sm-6">
              <div className={`form-group ${style["form-group"]}`}>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  className={`form-control ${style["form-control"]}`}
                />
                <ErrorMessage
                  name="email"
                  component="small"
                  className="text-danger"
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="col-lg-6 col-sm-6">
              <div className={`form-group ${style["form-group"]}`}>
                <Field
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  placeholder="Number"
                  className={`form-control ${style["form-control"]}`}
                />
                <ErrorMessage
                  name="phone_number"
                  component="small"
                  className="text-danger"
                />
              </div>
            </div>

            {/* Subject Field */}
            <div className="col-lg-6 col-sm-6">
              <div className={`form-group ${style["form-group"]}`}>
                <Field
                  type="text"
                  name="msg_subject"
                  id="msg_subject"
                  placeholder="Subject"
                  className={`form-control ${style["form-control"]}`}
                />
                <ErrorMessage
                  name="msg_subject"
                  component="small"
                  className="text-danger"
                />
              </div>
            </div>

            {/* Message Field */}
            <div className="col-12">
              <div className={`form-group ${style["form-group"]}`}>
                <Field
                  as="textarea"
                  name="message"
                  id="message"
                  placeholder="Message"
                  className={`form-control ${style["form-control"]}`}
                  rows={6}
                />
                <ErrorMessage
                  name="message"
                  component="small"
                  className="text-danger"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="col-lg-12 col-md-12">
              <button
                type="submit"
                className={style["default-btn"]}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ContactForm;
