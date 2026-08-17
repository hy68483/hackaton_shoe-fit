import {
  Camera,
  ChevronRight,
  Mail,
  Home,
  Ruler,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import authStartImage from "./assets/auth-start.png";

const featuredProducts = [
  {
    id: "nike-pegasus-41",
    brand: "Nike",
    name: "Pegasus 41",
    price: "139,000원",
    fit: "정사이즈 추천",
  },
  {
    id: "adidas-supernova",
    brand: "Adidas",
    name: "Supernova Rise",
    price: "129,000원",
    fit: "발볼 여유",
  },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route
        path="/login"
        element={<PlaceholderPage title="기존 계정 로그인하기" />}
      />
      <Route
        path="/signup"
        element={<PlaceholderPage title="이메일로 시작하기" />}
      />
      <Route
        path="/signup/options"
        element={<PlaceholderPage title="회원가입 하기" />}
      />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

function AppShell() {
  return (
    <main className="min-h-screen bg-[#eef2f6] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#fbfcfe] shadow-xl shadow-slate-300/60">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-[#fbfcfe]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <Link to="/home" className="flex flex-col">
              <span className="text-xl font-black tracking-normal">
                ShoeFit
              </span>
              <span className="text-xs font-semibold text-slate-500">
                AI size match
              </span>
            </Link>
            <Link
              to="/measure"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white"
              aria-label="발 측정 시작"
            >
              <Camera size={19} />
            </Link>
          </div>
        </header>

        <div className="flex-1 pb-24">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/measure" element={<MeasurePage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </div>

        <BottomNav />
      </div>
    </main>
  );
}

function StartPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-zinc-950">
        <img
          src={authStartImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/18 to-[#17161b]" />
        <div className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-9 pt-3 text-[17px] font-bold">
          <span>9:41</span>
          <div className="absolute left-1/2 top-[14px] h-[36px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="flex h-4 items-end gap-0.5">
              <span className="block h-1.5 w-1 rounded-sm bg-white" />
              <span className="block h-2.5 w-1 rounded-sm bg-white" />
              <span className="block h-3.5 w-1 rounded-sm bg-white" />
            </span>
            <span className="text-[13px] leading-none">⌁</span>
            <span className="h-3 w-6 rounded-[4px] border border-white/80 p-[1px]">
              <span className="block h-full w-4 rounded-[2px] bg-white" />
            </span>
          </div>
        </div>

        <div className="relative z-10 flex min-h-dvh flex-col px-5 pb-9 pt-20">
          <div className="flex flex-1 items-center justify-center pb-20">
            <h1 className="max-w-[340px] text-center text-[37px] font-black leading-[1.18] tracking-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]">
              Finding the fit
              <br />
              that's truly yours.
            </h1>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="flex h-[61px] w-full items-center justify-center rounded-[26px] bg-[#4640DE] text-[16px] font-bold text-white shadow-lg shadow-black/15"
            >
              기존 계정 로그인하기
            </Link>
            <Link
              to="/signup"
              className="flex h-[61px] w-full items-center justify-center gap-3 rounded-[26px] bg-[#FBFAFF] text-[16px] font-bold text-[#000000] shadow-lg shadow-black/15"
              style={{ color: "#000000" }}
            >
              <Mail size={25} strokeWidth={2.2} />
              이메일로 시작하기
            </Link>
            <Link
              to="/signup/options"
              className="flex h-10 w-full items-center justify-center text-[16px] font-semibold text-white/90"
            >
              회원가입 하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#f5f6fb] text-slate-950">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6">
        <p className="text-sm font-bold text-[#4640DE]">ShoeFit</p>
        <h1 className="mt-2 text-2xl font-black tracking-normal">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          다음 단계에서 이 화면을 Figma 기준으로 이어서 구현합니다.
        </p>
        <Link
          to="/"
          className="mt-8 flex h-12 items-center justify-center rounded-[8px] bg-[#4640DE] text-sm font-bold text-white"
        >
          시작화면으로 돌아가기
        </Link>
      </section>
    </main>
  );
}

function HomePage() {
  return (
    <section className="space-y-6 px-5 py-5">
      <div className="rounded-[8px] bg-slate-950 px-5 py-6 text-white">
        <p className="text-sm font-semibold text-cyan-200">AI 맞춤 신발 추천</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-normal">
          내 발에 맞는 사이즈를 먼저 찾고 쇼핑하세요.
        </h1>
        <Link
          to="/measure"
          className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 text-sm font-bold text-slate-950"
        >
          발 측정 시작
          <ChevronRight size={17} />
        </Link>
      </div>

      <label className="flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-4">
        <Search size={18} className="text-slate-400" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
          placeholder="브랜드, 상품명 검색"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["러닝화", "스니커즈", "트레이닝", "발볼넓음"].map((item) => (
          <button
            key={item}
            type="button"
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
          >
            {item}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">추천 상품</h2>
          <Link
            to="/recommendations"
            className="text-sm font-bold text-cyan-700"
          >
            더보기
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-[8px] border border-slate-200 bg-white p-3"
            >
              <div className="aspect-square rounded-[8px] bg-gradient-to-br from-slate-100 to-cyan-100" />
              <p className="mt-3 text-xs font-bold text-slate-500">
                {product.brand}
              </p>
              <h3 className="mt-1 truncate text-sm font-black">
                {product.name}
              </h3>
              <p className="mt-1 text-sm font-bold">{product.price}</p>
              <p className="mt-2 rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                {product.fit}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function MeasurePage() {
  const steps = [
    "측정 동의",
    "촬영 이미지 업로드",
    "품질 검증",
    "AI 측정 분석",
    "사이즈 추천",
  ];

  return (
    <section className="space-y-5 px-5 py-5">
      <div>
        <p className="text-sm font-bold text-cyan-700">Foot measurement</p>
        <h1 className="mt-1 text-2xl font-black tracking-normal">
          발 촬영으로 추천 사이즈 받기
        </h1>
      </div>

      <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Camera size={28} />
        </div>
        <h2 className="mt-4 text-base font-black">촬영 영역</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          SAM/OpenCV 분석 연동 전까지는 업로드 플로우 UI만 준비합니다.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-[8px] border border-slate-200 bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
              {index + 1}
            </span>
            <span className="text-sm font-bold">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecommendationsPage() {
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
            <p className="text-sm font-bold text-slate-500">예상 추천</p>
            <p className="text-2xl font-black">260 mm</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          로그인 후 발 프로필과 상품 데이터를 기준으로 백엔드 추천 API와
          연결합니다.
        </p>
      </div>
    </section>
  );
}

function AccountPage() {
  return (
    <section className="space-y-4 px-5 py-5">
      <div>
        <p className="text-sm font-bold text-cyan-700">Account</p>
        <h1 className="mt-1 text-2xl font-black tracking-normal">마이페이지</h1>
      </div>

      <div className="rounded-[8px] border border-slate-200 bg-white p-5">
        <p className="text-sm font-bold text-slate-500">로그인 연동 예정</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          auth API 토큰 저장 방식과 화면 플로우는 다음 단계에서 연결합니다.
        </p>
      </div>
    </section>
  );
}

function BottomNav() {
  const items = [
    { to: "/home", label: "홈", icon: Home },
    { to: "/measure", label: "측정", icon: Ruler },
    { to: "/recommendations", label: "추천", icon: Sparkles },
    { to: "/account", label: "마이", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] border-t border-slate-200 bg-white px-3 pb-3 pt-2">
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-14 flex-col items-center justify-center gap-1 rounded-[8px] text-xs font-black ${
                isActive ? "bg-slate-950 text-white" : "text-slate-500"
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default App;
