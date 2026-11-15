import { Link } from "react-router-dom";
import runBannerImage from "../../assets/home/run-banner.png";
import { dailyProducts, fitProducts, newProducts, rainProducts } from "./data";
import { CategoryScroller, HeroBanner, HomeHeader, ProductSection } from "./components";

export function HomePage() {
  return (
    <section className="bg-[#FBFAFF] px-4 pb-[104px] pt-[15px]">
      <HomeHeader />

      <HeroBanner />

      <CategoryScroller />

      <Link
        to="/measure"
        className="mt-[22px] block h-[183px] overflow-hidden rounded-[14px] bg-[#38325f] text-white shadow-lg shadow-[#4640DE]/18"
      >
        <div className="flex h-[64px] flex-col items-center justify-start bg-[#6860ee] px-4 pt-[18px] text-center">
          <p className="text-[21px] font-bold leading-none text-white">
            30초 촬영으로 내 발 측정받기
          </p>
          <p className="mt-1.5 text-[12px] font-normal text-white">
            발 사진 한 장으로 브랜드별 맞춤 사이즈를 추천해 드려요.
          </p>
        </div>
        <div className="relative flex h-[119px] items-center justify-center">
          <span className="absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-white/65" />
          <span className="absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-white/65" />
          <span className="absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-white/65" />
          <span className="absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-white/65" />
          <span className="inline-flex h-[52px] items-center rounded-full bg-white px-7 text-[18px] font-semibold text-[#4640DE]">
            AI 발 측정 시작하기
          </span>
        </div>
      </Link>

      <ProductSection
        title="NEW"
        products={newProducts}
        className="mt-[29px]"
      />

      <ProductSection
        title="나를 위한 맞춤 추천"
        products={fitProducts}
        compact
        className="mt-[30px]"
      />

      <section className="mt-[30px]">
        <img
          src={runBannerImage}
          alt=""
          className="h-[126px] w-full rounded-[8px] object-cover"
        />
      </section>

      <ProductSection
        title="비 오는 날에도 걱정 없이"
        subtitle="레인부츠 방수화"
        products={rainProducts}
        compact
        className="mt-[30px]"
      />

      <ProductSection
        title="매일 신기 좋은 편안한 신발"
        subtitle="데일리 스니커즈"
        products={dailyProducts}
        compact
        className="mt-[30px]"
      />
    </section>
  );
}
