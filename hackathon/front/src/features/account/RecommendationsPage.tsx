import { Sparkles } from "lucide-react";
import { loadFootProfile } from "../measurement/profile";

export function RecommendationsPage() {
  const footProfile = loadFootProfile();

  return (
    <section className="space-y-4 px-5 py-5">
      <div>
        <p className="text-sm font-bold text-cyan-700">Recommendation</p>
        <h1 className="mt-1 text-2xl font-black tracking-normal">
          추천 사이즈
        </h1>
      </div>

      <div className="rounded-[8px] bg-white p-5 shadow-sm shadow-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">
              {footProfile ? "내 발 프로필 기준" : "측정 필요"}
            </p>
            <p className="text-2xl font-black">
              {footProfile ? `${footProfile.recommendedSizeMm} mm` : "미측정"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {footProfile
            ? "저장된 발 프로필과 상품 데이터를 기준으로 추천 API와 연결합니다."
            : "발 사이즈 측정을 완료하면 추천 사이즈가 여기에 표시됩니다."}
        </p>
      </div>
    </section>
  );
}
