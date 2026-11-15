import { ChevronLeft, Ruler } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { HomeTopButton } from "../shared/layout";
import { deleteFootProfile, getBrandSizeRows, getFootProfileAnalysis, getSizeChoices, loadFootProfile } from "../measurement/profile";

export function FootProfilePage() {
  const navigate = useNavigate();
  const footProfile = loadFootProfile();

  if (!footProfile) {
    return (
      <section className="flex min-h-[calc(100dvh-44px)] flex-col bg-[#FBFAFF] px-5 pb-8 pt-1">
        <header className="relative flex h-12 items-center justify-center">
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="absolute left-0 flex h-9 w-9 items-center justify-start"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[13px] font-black">발 프로필</h1>
          <HomeTopButton />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
            <Ruler size={28} />
          </div>
          <h2 className="mt-7 text-[18px] font-black">
            아직 발 프로필이 없어요
          </h2>
          <p className="mt-4 text-[11px] font-semibold leading-5 text-[#8a8695]">
            발 사이즈 측정을 완료하면
            <br />
            추천 사이즈와 브랜드별 사이즈가 여기에 저장돼요.
          </p>
        </div>

        <Link
          to="/measure"
          className="flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white"
        >
          발 사이즈 측정하기
        </Link>
      </section>
    );
  }

  const sizeChoices = getSizeChoices(footProfile.recommendedSizeMm);
  const summaryItems = [
    { label: "발 길이", value: String(footProfile.footLengthMm), unit: "mm" },
    { label: "발볼", value: footProfile.footWidthLabel, unit: "" },
    { label: "발등", value: footProfile.instepLabel, unit: "" },
  ];
  const brandSizes = getBrandSizeRows(footProfile);

  return (
    <section className="min-h-[calc(100dvh-44px)] bg-[#FBFAFF] px-5 pb-8 pt-1">
      <header className="relative flex h-12 items-center justify-center">
        <button
          type="button"
          onClick={() => navigate("/account")}
          className="absolute left-0 flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[13px] font-black">발 프로필</h1>
        <HomeTopButton />
      </header>

      <div className="mt-4 rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a8695]">
              마지막 측정일
            </p>
            <p className="mt-1 text-[15px] font-black">
              {footProfile.measuredAt}
            </p>
          </div>
          <Link
            to="/measure"
            className="flex h-8 items-center justify-center rounded-[8px] bg-[#f4f2fb] px-3 text-[10px] font-black text-[#3d3948]"
          >
            재측정
          </Link>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#8a8695]">추천 사이즈</p>
            <p className="mt-1 text-[31px] font-black leading-none text-[#4640DE]">
              {footProfile.recommendedSizeMm}{" "}
              <span className="text-[14px]">mm</span>
            </p>
            <p className="mt-2 text-[10px] font-bold text-[#8a8695]">
              발 길이 {footProfile.footLengthMm}mm
            </p>
          </div>
          <span className="rounded-full bg-[#4640DE] px-3 py-1.5 text-[10px] font-black text-white">
            적합도 {footProfile.fitScore}%
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {summaryItems.map(({ label, value, unit }) => (
          <div key={label} className="rounded-[12px] bg-white p-3 shadow-sm">
            <Ruler size={20} className="text-[#4640DE]" />
            <p className="mt-7 text-[10px] font-bold text-[#8a8695]">{label}</p>
            <p className="mt-1 text-[18px] font-black text-[#4640DE]">
              {value} {unit && <span className="text-[10px]">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-[12px] bg-white p-3 shadow-sm">
        {sizeChoices.map(({ size, label }) => (
          <button
            key={size}
            type="button"
            className={`h-[58px] rounded-[10px] text-[11px] font-black ${
              size === footProfile.recommendedSizeMm
                ? "bg-[#4640DE] text-white"
                : "bg-[#f0eefb] text-[#6b5cff]"
            }`}
          >
            <span className="block text-[15px]">{size} mm</span>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[12px] bg-[#4640DE] p-4 text-white shadow-sm">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#4640DE]">
          AI 분석
        </p>
        <p className="mt-3 text-[11px] font-semibold leading-5 text-white/86">
          {getFootProfileAnalysis(footProfile)}
        </p>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-black">브랜드별 내 사이즈</h2>
          <button
            type="button"
            className="rounded-full bg-[#4640DE] px-3 py-1.5 text-[10px] font-black text-white"
          >
            + 브랜드 추가
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-[#eceaf5] bg-white">
          {brandSizes.map(({ brand, size }, index) => (
            <div
              key={brand}
              className={`flex h-11 items-center justify-between px-4 text-[12px] font-bold ${
                index > 0 ? "border-t border-[#f0eef7]" : ""
              }`}
            >
              <span>{brand}</span>
              <span>{size}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          deleteFootProfile();
          navigate("/account");
        }}
        className="mt-5 w-full text-center text-[12px] font-black text-[#ff5664]"
      >
        발 프로필 삭제
      </button>
    </section>
  );
}
