"use client";
import { FaQuoteLeft } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section4.module.css";

export default function Section4Swiper({ data }) {
  return (
    <>
      <Swiper
        id="professional"
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
            slidesPerView: 2, 
          },
          1100: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 3,
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
            <SwiperSlide key={key}>
              <div className={style["single-reviews-card"] + " " + style.bu}>
                <div className={"d-flex gap-4 " + style["clien-info"]}>
                  <img
                    src={item.img}
                    alt={item.name}
                    className={style["single-reviews-card-image"]}
                  />
                  <div className="d-flex flex-column">
                    <h3 className="fs-4 m-0">{item.name}</h3>
                  </div>
                </div>
                <div className={style["quote"]}>
                  <FaQuoteLeft />
                </div>
                <p>{item.description}</p>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div>Not found</div>
        )}
      </Swiper>
      <div className={"d-lg-block d-none " + style["swiper-nav-container"]}>
        <button className={style["custom-prev"]} aria-label="left-button">
          <FaChevronLeft size={24} />
        </button>
        <button className={style["custom-next"]} aria-label="left-button">
          <FaChevronRight size={24} />
        </button>
      </div>
    </>
  );
}
