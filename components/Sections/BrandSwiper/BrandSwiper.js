"use client";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section1.module.css";

function BrandSwiper({ product }) {
  return (
    <div className="interface_section">
      <Swiper
        style={{
          "--swiper-navigation-color": "#fff",
          "--swiper-pagination-color": "#fff",
        }}
        slidesPerView={1}
        spaceBetween={30}
        loop={true}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          576: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3,
          },
          992: {
            slidesPerView: 5,
          },
          1200: {
            slidesPerView: 6,
          },
        }}
        pagination={{
          el: ".swiper-pagination",
          clickable: true,
        }}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        grabCursor={true}
        speed={1000}
        modules={[Autoplay, Pagination]}
      >
        {product &&
          product.map((item, key) => {
            return (
              <SwiperSlide key={key}>
                <div className={style["parner-logo"]}>
                  <a href="#">
                    <img src={item.img} alt={item.key} />
                  </a>
                </div>
              </SwiperSlide>
            );
          })}
      </Swiper>
    </div>
  );
}

export default BrandSwiper;
