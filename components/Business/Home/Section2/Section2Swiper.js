"use client";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section2.module.css";

export default function Section2Swiper({ data }) {
  return (
    <>
      <Swiper
      className="py-5"
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
            slidesPerView: 4.5,
          },
        }}
        autoplay={{
          delay: 3000,
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
          data?.map((item, key) => (
            <SwiperSlide key={key} className="col-md-4">
              <div
                className={`py-2 rounded-4 shadow ${style["custom-card"]} ${
                  style[item.className] || ""
                }`}
              >
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-around align-items-center">
                    <img src={item.img} alt={item.title} />
                  </div>
                  <div className={style["swiper-title"]}>{item.title}</div>
                  <div className={style["location-title"]}>
                    {item.description}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div>Not found</div>
        )}
      </Swiper>
      {/* Custom Navigation Buttons with React Icons */}
      <div className={"d-lg-block  " + style["swiper-nav-container"]}>
        <button className={style["custom-prev"]}>
          <FaChevronLeft size={24} /> {/* Left arrow icon */}
        </button>
        <button className={style["custom-next"]}>
          <FaChevronRight size={24} /> {/* Right arrow icon */}
        </button>
      </div>
    </>
  );
}
