"use client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import style from "./RecentPostSwiper.module.css";
import { FaRegBookmark, FaRegClock } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

export default function RecentPostSwiper({ recentpost }) {
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
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
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
        {recentpost?.length > 0 ? (
          recentpost?.map((item, key) => (
            <SwiperSlide key={key}>
              <div className={style["recent-job-box"]}>
                <div className={style.logo}>
                  <img src={item.logo} alt={item.title} />
                </div>
                <a href="#">
                  <div className={style.bookmark}>
                  <FaRegBookmark />
                  </div>
                </a>
                <div className={style.time}>
                  <span>{item.time}</span>
                </div>
                <h3>
                  <a href="#/.">{item.title}</a>
                </h3>
                <div className={style.info}>
                  <ul>
                    <li>
                    <FaRegClock />
                      {item.daysLeft}
                    </li>
                    <li>
                    <IoLocationOutline />
                      {item.location}
                    </li>
                  </ul>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <div>Not found</div>
        )}
      </Swiper>
      <div className={"d-lg-flex d-none " + style["custom-pagination"]}></div>
    </>
  );
}
