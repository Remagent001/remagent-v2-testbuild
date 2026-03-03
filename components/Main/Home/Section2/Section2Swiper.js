"use client";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section2.module.css";

export default function Section2Swiper({ data }) {
  return (
    <>
      <Swiper
        slidesPerView={3}
        spaceBetween={40}
        loop={true}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          576: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
        }}
        autoplay={{
          delay: 8000,
          disableOnInteraction: false,
        }}
        autoHeight={true}
        grabCursor={true}
        speed={2000}
        navigation={{
          prevEl: `.${style["custom-prev"]}`,
          nextEl: `.${style["custom-next"]}`,
        }}
        modules={[Autoplay, Navigation, Pagination]}
      >
        {data?.length > 0 ? (
          data.map((item, key) => (
            <SwiperSlide key={key}>
              <div
                className={
                  "py-2 rounded-4 shadow card border-0 " +
                  style["single-category-card"]
                }
              >
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                      {item.businessinfo.image && (
                        <img
                          src={
                            item.businessinfo.image ||
                            "/assets/images/icons/icon-11.png"
                          }
                          alt={item.businessinfo.businessName || "image"}
                          className={style["job-img"]}
                        />
                      )}
                      {item.businessinfo.businessName && (
                        <div className={style["swiper-title"]}>
                          {item.businessinfo.businessName || " "}
                        </div>
                      )}
                    </div>
                    <div className="align-items-center d-flex gap-3">
                      <IoLocationSharp size={35} />
                      <div className={style["location-title"]}>
                        {item.businessinfo.fullAddress}
                      </div>
                    </div>
                    <div className="align-items-center d-flex justify-content-between">
                      <div className={style["job-post"]}>
                        Job post: <span>{item.total_positions ?? "No Post"}</span>
                      </div>
                      <div className={style["job-post"]}>
                        Industry:
                        <span>
                          {item.businessinfo?.industryname?.name
                            ? item.businessinfo.industryname.name
                            : "Nothing Found!"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div className="text-center fs-4">Not found</div>
        )}
      </Swiper>
      {data?.length > 0 && (
        <div className={"d-lg-block " + style["swiper-nav-container"]}>
          <button className={style["custom-prev"]} aria-label="left-button">
            <FaChevronLeft size={24} />
          </button>
          <button className={style["custom-next"]} aria-label="left-button">
            <FaChevronRight size={24} />
          </button>
        </div>
      )}
    </>
  );
}
