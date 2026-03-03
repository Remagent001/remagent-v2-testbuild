import BrandSwiper from "./BrandSwiper";
export default function Section1Swiper({ product }) {
  return (
    <>
      <div className="partner-area pt-100 pb-100">
        <div className="container">
          <div className="partner-slider owl-carousel owl-theme">
            <BrandSwiper product={product} />
          </div>
        </div>
      </div>
    </>
  );
}
