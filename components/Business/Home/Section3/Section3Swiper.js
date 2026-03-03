"use client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section3.module.css";

export default function Section3Swiper({ data }) {
  return (
    <>
      <Swiper
      id="hiring"
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
          1100: {
            slidesPerView: 3,
          },
        }}
        pagination={{
          clickable: true,
          el: `.${style["custom-pagination"]}`,
          bulletClass: `${style["custom-bullet"]}`,
          bulletActiveClass: `${style["custom-bullet-active"]}`,
        }}
        autoplay={{
          delay:3000,
          disableOnInteraction: false,
        }}
        autoHeight={true}
        grabCursor={true}
        speed={2000}
        modules={[Autoplay, Pagination]}
      >
        {data?.length > 0 ? (
          data?.map((item, key) => (
            <SwiperSlide key={key}>
              <div
                className={
                  "rounded-5 shadow card " + style["single-category-card"]
                }
              >
                <div className={"card-body "+style['custom-height']}>
                  <div className="d-flex gap-2 flex-column text-center">
                    <div className="d-flex gap-2 align-items-center">
                      <img
                        src={item.img}
                        alt={item.title}
                        className={style["swiper-image"]}
                      />
                      <div className={style["swiper-title"]}>{item.title}</div>
                    </div>

                    <div className={style["description"]}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div>Not found</div>
        )}
      </Swiper>
      <div className={"d-lg-flex " + style["custom-pagination"]}></div>
    </>
  );
}
