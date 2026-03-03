"use client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination"; // Import Swiper Pagination styles
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section2.module.css";

export default function Section2Swiper({ data }) {
  return (
    <>
      <Swiper
        id="how"
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
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        autoHeight={true}
        grabCursor={true}
        speed={2000}
        modules={[Autoplay, Pagination]}
      >
        {data?.length > 0 ? (
          data?.map((item, key) => (
            <SwiperSlide key={key} className="swiper-slide">
              <div className={"py-2 rounded-4  " + style["profile-card"]}>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-around align-items-center flex-column">
                    <img
                      src={item.img}
                      alt={item.title}
                      className={style["profile-image"]}
                    />
                    <div className={style["profile-title"]}>{item.title}</div>
                  </div>
                  <div className="align-items-center">
                    <div className={style["profile-description"]}>
                      {item.description}
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
    </>
  );
}
