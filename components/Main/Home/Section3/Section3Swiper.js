"use client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./Section3.module.css";
import Link from "next/link";

export default function Section3Swiper({ data }) {
  return (
    <>
      <Swiper
        className={style["custom-height"]}
        slidesPerView={3}
        spaceBetween={40}
        loop={true}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          576: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 3,
          },
          992: {
            slidesPerView: 4,
          },
          1100: {
            slidesPerView: 5,
          },
        }}
        autoplay={{
          delay: 8000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          el: `.${style["custom-pagination"]}`,
          bulletClass: `${style["custom-bullet"]}`,
          bulletActiveClass: `${style["custom-bullet-active"]}`,
        }}
        autoHeight={true}
        grabCursor={true}
        modules={[Autoplay, Pagination]}
      >
        {data?.length > 0 ? (
          data?.map((item, key) => (
            <SwiperSlide key={key}>
              <div
                className={
                  "rounded-5 shadow card border-0 " +
                  style["single-category-card"]
                }
              >
                <div className="card-body">
                  <div className="d-flex gap-2 flex-column text-center">
                    <div>
                      <img
                        src={item.image || process.env.DUMMY_IMAGE}
                        alt={item.username}
                        className={style["swiper-image"]}
                      />
                    </div>
                    <div className={style["swiper-title"]}>{item.username}</div>
                    <div className={style["sub-title"]}>
                      {item.timezone || "test"}
                    </div>
                    {item.professionalinfo && (
                      <div className={style["description"]}>
                        {item.professionalinfo.about}
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  className={
                    "card-footer text-center btn " +
                    style["custom-button"] +
                    " " +
                    style["custom-card-footer"]
                  }
                  href={process.env.REMAGENT_URL + "/login"}
                >
                  View Profile
                </Link>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div className="text-center fs-4">Not found</div>
        )}
      </Swiper>
      <div className={"d-lg-flex " + style["custom-pagination"]}></div>
    </>
  );
}
