import {
  Bell,
  Camera,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  Home,
  Mail,
  PartyPopper,
  Ruler,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { login, signup } from "./api/auth";
import authStartImage from "./assets/auth-start.png";
import categoryBootsImage from "./assets/home/category-boots.png";
import categoryLoafersImage from "./assets/home/category-loafers.png";
import categoryRunningImage from "./assets/home/category-running.png";
import categorySandalsImage from "./assets/home/category-sandals.png";
import categorySneakersImage from "./assets/home/category-sneakers.png";
import dailyAuthenticImage from "./assets/home/daily-authentic.png";
import dailyItaliaImage from "./assets/home/daily-italia.png";
import dailyMexicoImage from "./assets/home/daily-mexico.png";
import dailyOldskoolImage from "./assets/home/daily-oldskool.png";
import dailySpeedcatImage from "./assets/home/daily-speedcat.png";
import heroImage1 from "./assets/home/hero-1.png";
import heroImage2 from "./assets/home/hero-2.png";
import heroImage3 from "./assets/home/hero-3.png";
import newCalmImage from "./assets/home/new-calm.png";
import newCortezImage from "./assets/home/new-cortez.png";
import newOrchidImage from "./assets/home/new-orchid.png";
import newSpeedgoatImage from "./assets/home/new-speedgoat.png";
import newVelocityImage from "./assets/home/new-velocity.png";
import newWaveImage from "./assets/home/new-wave.png";
import recommendBondiImage from "./assets/home/recommend-bondi.png";
import recommendGelImage from "./assets/home/recommend-gel.png";
import recommendUaImage from "./assets/home/recommend-ua.png";
import recommendVomeroImage from "./assets/home/recommend-vomero.png";
import runBannerImage from "./assets/home/run-banner.png";
import detailMainImage from "./assets/shop/detail-main.png";
import detailThumb1Image from "./assets/shop/detail-thumb-1.png";
import detailThumb2Image from "./assets/shop/detail-thumb-2.png";
import detailThumb3Image from "./assets/shop/detail-thumb-3.png";
import exploreHanaImage from "./assets/shop/explore-hana.png";
import exploreHyunjinImage from "./assets/shop/explore-hyunjin.png";
import exploreJaeminImage from "./assets/shop/explore-jaemin.png";
import exploreMinImage from "./assets/shop/explore-min.png";
import exploreO0808Image from "./assets/shop/explore-o0808.png";
import list1080Image from "./assets/shop/list-1080.png";
import listBannerImage from "./assets/shop/list-banner.png";
import listDeviateImage from "./assets/shop/list-deviate.png";
import listMagnifyImage from "./assets/shop/list-magnify.png";
import listMaxcourtImage from "./assets/shop/list-maxcourt.png";
import listVomeroImage from "./assets/shop/list-vomero.png";
import listVomero18Image from "./assets/shop/list-vomero18.png";
import listWaveImage from "./assets/shop/list-wave.png";
import wishAdizeroImage from "./assets/shop/wish-adizero.png";
import wishDionImage from "./assets/shop/wish-dion.png";
import wishHeritageImage from "./assets/shop/wish-heritage.png";
import wishMagmaxImage from "./assets/shop/wish-magmax.png";
import wishSuregripImage from "./assets/shop/wish-suregrip.png";

const carriers = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];
const SIGNUP_NAME_KEY = "shoefit.signup.name";
const SIGNUP_LOGIN_ID_KEY = "shoefit.signup.loginId";
const AUTH_ACCESS_TOKEN_KEY = "shoefit.auth.accessToken";
const AUTH_REFRESH_TOKEN_KEY = "shoefit.auth.refreshToken";

type ShopProduct = {
  id: string;
  image: string;
  brand: string;
  name: string;
  price: string;
  badge?: string;
  color?: string;
  detailImages?: string[];
  recommendedSize?: string;
};

const categories = [
  { label: "ALL", image: null },
  { label: "러닝화", image: categoryRunningImage },
  { label: "스니커즈", image: categorySneakersImage },
  { label: "샌들", image: categorySandalsImage },
  { label: "부츠", image: categoryBootsImage },
  { label: "로퍼", image: categoryLoafersImage },
];

const heroSlides = [
  {
    image: heroImage3,
    title: "FIND YOUR FIT",
    description: "AI 발 분석으로 찾는 가장 정확한 나만의 핏.",
  },
  {
    image: heroImage2,
    title: "내 발을 위한 새로운 기준",
    description: "AI가 분석한 발 데이터로 더 정확한 사이즈를 완성하다.",
  },
  {
    image: heroImage1,
    title: "더 나은 핏을 시작해",
    description: "AI가 찾아낸 나만의 사이즈, 더 정확하게 더 편안하게.",
  },
];

const newProducts = [
  {
    id: "cortez",
    image: newCortezImage,
    brand: "adidas",
    name: "코르테즈 텍스타일",
    price: "139,000원",
    badge: "무료배송",
  },
  {
    id: "calm",
    image: newCalmImage,
    brand: "Nike",
    name: "나이키 캄 뮬 W",
    price: "79,000원",
    badge: "AI 추천",
  },
  {
    id: "orchid",
    image: newOrchidImage,
    brand: "Taw&Toe",
    name: "오르케트로 샌들 W",
    price: "69,000원",
  },
  {
    id: "speedgoat",
    image: newSpeedgoatImage,
    brand: "HOKA",
    name: "스피드고트 6",
    price: "189,000원",
  },
  {
    id: "velocity",
    image: newVelocityImage,
    brand: "Saucony",
    name: "벨로시티 나이트로 4 AP",
    price: "159,000원",
    badge: "무료배송",
  },
  {
    id: "wave",
    image: newWaveImage,
    brand: "Mizuno",
    name: "웨이브 프로페시 LS",
    price: "219,000원",
  },
];

const fitProducts = [
  {
    id: "bondi",
    image: recommendBondiImage,
    brand: "Hoka",
    name: "본디 8",
    price: "199,000원",
  },
  {
    id: "vomero",
    image: recommendVomeroImage,
    brand: "Nike",
    name: "나이키 보메로 18",
    price: "179,000원",
  },
  {
    id: "gel",
    image: recommendGelImage,
    brand: "ASICS",
    name: "젤 카야노 31",
    price: "189,000원",
  },
  {
    id: "ua",
    image: recommendUaImage,
    brand: "UA",
    name: "UA 호버 팬텀",
    price: "159,000원",
  },
];

const dailyProducts = [
  {
    id: "authentic",
    image: dailyAuthenticImage,
    brand: "반스",
    name: "어센틱 - 데크 스웨이드",
    price: "79,000원",
  },
  {
    id: "italia",
    image: dailyItaliaImage,
    brand: "adidas",
    name: "이탈리아 70s",
    price: "159,000원",
  },
  {
    id: "speedcat",
    image: dailySpeedcatImage,
    brand: "puma",
    name: "스피드캣 고 우먼스",
    price: "119,000원",
    badge: "Fit For You",
  },
  {
    id: "oldskool",
    image: dailyOldskoolImage,
    brand: "Vans",
    name: "올드스쿨 36",
    price: "89,000원",
  },
  {
    id: "mexico",
    image: dailyMexicoImage,
    brand: "Onitsuka",
    name: "멕시코 66",
    price: "149,000원",
  },
];

const wishlistProducts = [
  {
    id: "magmax",
    image: wishMagmaxImage,
    brand: "puma",
    name: "맥그맥스 나이트로 2 우먼스",
    price: "238,000원",
    badge: "Fit For You",
  },
  {
    id: "suregrip",
    image: wishSuregripImage,
    brand: "onitsuka",
    name: "슈어그립 스니커즈",
    price: "248,000원",
    badge: "Fit For You",
  },
  {
    id: "dion",
    image: wishDionImage,
    brand: "crocs",
    name: "DION BROWN",
    price: "168,000원",
  },
  {
    id: "heritage",
    image: wishHeritageImage,
    brand: "닥터마틴",
    name: "(남성) 헤리티지 부츠",
    price: "145,000원",
  },
  {
    id: "adizero",
    image: wishAdizeroImage,
    brand: "adidas",
    name: "아디제로 보스턴 14 M",
    price: "189,000원",
  },
];

const catalogProducts = [
  {
    id: "list-wave",
    image: listWaveImage,
    brand: "adidas",
    name: "맥스코트 미드탑",
    price: "109,000원",
  },
  {
    id: "list-vomero",
    image: listVomeroImage,
    brand: "Nike",
    name: "보메로 플러스 W",
    price: "179,000원",
    badge: "Fit For You",
  },
  {
    id: "list-vomero18",
    image: listVomero18Image,
    brand: "Nike",
    name: "보메로 18 M",
    price: "189,000원",
  },
  {
    id: "list-maxcourt",
    image: listMaxcourtImage,
    brand: "Nike",
    name: "맥스코트",
    price: "98,000원",
  },
  {
    id: "list-magnify",
    image: listMagnifyImage,
    brand: "puma",
    name: "매그니파이 나이트로 4",
    price: "219,000원",
  },
  {
    id: "list-1080",
    image: list1080Image,
    brand: "New Balance",
    name: "프레쉬폼 1080",
    price: "179,000원",
  },
  {
    id: "list-deviate",
    image: listDeviateImage,
    brand: "puma",
    name: "디비에이트 나이트로",
    price: "199,000원",
  },
];

const explorePosts = [
  { id: "jaemin", image: exploreJaeminImage, author: "jaemin12", likes: 34 },
  { id: "hana", image: exploreHanaImage, author: "hana", likes: 91 },
  { id: "min", image: exploreMinImage, author: "min", likes: 46 },
  { id: "hyunjin", image: exploreHyunjinImage, author: "hyunjin", likes: 30 },
  { id: "o0808", image: exploreO0808Image, author: "o0808", likes: 22 },
];

const searchableProducts = [
  ...newProducts,
  ...fitProducts,
  ...dailyProducts,
  ...wishlistProducts,
  ...catalogProducts,
] satisfies ShopProduct[];

const shopProducts = Array.from(
  new Map(searchableProducts.map((product) => [product.id, product])).values(),
);

const detailProductOverrides: Record<string, Partial<ShopProduct>> = {
  magmax: {
    image: detailMainImage,
    detailImages: [detailMainImage, detailThumb1Image, detailThumb2Image, detailThumb3Image],
    color: "루비 레드-로열 사파이어",
    price: "239,000원",
    recommendedSize: "225",
  },
};

const productSizes = ["210", "215", "220", "225", "230"];

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/signup"
        element={<IdentityVerificationPage />}
      />
      <Route path="/signup/id" element={<SignupIdPage />} />
      <Route path="/signup/password" element={<SignupPasswordPage />} />
      <Route path="/signup/complete" element={<SignupCompletePage />} />
      <Route path="/signup/options" element={<IdentityVerificationPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

function AppShell() {
  return (
    <main className="min-h-screen bg-[#ebe9f7] text-[#191821]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBFAFF] shadow-xl shadow-[#4640DE]/10">
        <AuthStatusBar />
        <div className="flex-1 pb-[76px]">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/measure" element={<MeasurePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
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
              to="/signup"
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

function IdentityVerificationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [residentBackNumber, setResidentBackNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showCarrierSheet, setShowCarrierSheet] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const canRequestCode = useMemo(
    () =>
      name.trim().length > 0 &&
      birthDate.length === 6 &&
      residentBackNumber.length >= 1 &&
      carrier.length > 0 &&
      phone.length >= 10,
    [birthDate, carrier, name, phone, residentBackNumber],
  );
  const canConfirm = verificationSent;

  function requestVerificationCode() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    if (canRequestCode) {
      setVerificationSent(true);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7ff] text-[#111111]">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FBFAFF]">
        <AuthStatusBar />

        <div className="flex h-11 items-center px-5">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-start text-[#111111]"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={25} strokeWidth={1.8} />
          </Link>
        </div>

        <div className="px-7 pt-1">
          <div className="mb-7 h-1 w-5 rounded-full bg-[#4640DE]" />
          <h1 className="text-[17px] font-extrabold tracking-normal">
            본인 인증을 진행해 주세요
          </h1>
        </div>

        <form className="flex flex-1 flex-col px-7 pt-5" onSubmit={(event) => event.preventDefault()}>
          <div className="space-y-3">
            <div>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.trim()) setNameError(false);
                }}
                onBlur={() => setNameError(!name.trim())}
                className={`h-[50px] w-full rounded-[8px] border bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] ${
                  nameError ? "border-[#ff4b64]" : "border-[#eceaf5] focus:border-[#4640DE]"
                }`}
                placeholder="이름"
              />
              {nameError && (
                <p className="mt-1 pl-1 text-[11px] font-semibold text-[#ff4b64]">
                  이름을 입력해 주세요.
                </p>
              )}
            </div>

            <div className="grid grid-cols-[1fr_34px_1fr] items-center gap-2">
              <input
                value={birthDate}
                onChange={(event) => setBirthDate(onlyDigits(event.target.value, 6))}
                inputMode="numeric"
                className="h-[50px] rounded-[8px] border border-[#eceaf5] bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
                placeholder="주민번호"
              />
              <span className="text-center text-[22px] font-light text-[#1b1b1f]">-</span>
              <div className="relative flex h-[50px] items-center gap-2">
                <input
                  value={residentBackNumber}
                  onChange={(event) => setResidentBackNumber(onlyDigits(event.target.value, 7))}
                  inputMode="numeric"
                  type="tel"
                  autoComplete="off"
                  className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                  aria-label="주민번호 뒤 7자리"
                />
                <div
                  className="flex h-[50px] w-[44px] items-center justify-center rounded-[8px] border border-[#eceaf5] bg-white text-[15px] font-semibold text-black"
                  aria-hidden="true"
                >
                  {residentBackNumber[0] ?? ""}
                </div>
                <div
                  className="flex h-[50px] flex-1 items-center text-left tracking-[4px] text-[#65616b]"
                  aria-hidden="true"
                >
                  {residentBackNumber.length > 1
                    ? "•".repeat(Math.min(residentBackNumber.length - 1, 6)).padEnd(6, "•")
                    : "••••••"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCarrierSheet(true)}
              className="flex h-[50px] w-full items-center justify-between rounded-[8px] border border-[#eceaf5] bg-white px-4 text-left text-[15px] font-semibold text-black"
            >
              <span className={carrier ? "text-black" : "text-[#b9b8c2]"}>
                {carrier || "통신사 선택"}
              </span>
              <ChevronDown size={19} strokeWidth={1.8} className="text-[#1d1c22]" />
            </button>

            <div className="relative">
              <input
                value={phone}
                onChange={(event) => setPhone(onlyDigits(event.target.value, 11))}
                inputMode="numeric"
                className="h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 pr-[86px] text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
                placeholder="휴대폰 번호"
              />
              {canRequestCode && (
                <button
                  type="button"
                  onClick={requestVerificationCode}
                  className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-full bg-[#4640DE] px-3 text-[11px] font-bold text-white disabled:bg-[#d8d4fb]"
                >
                  {verificationSent ? "재발송" : "인증요청"}
                </button>
              )}
            </div>

            {verificationSent && (
              <div className="relative">
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(onlyDigits(event.target.value, 6))}
                  inputMode="numeric"
                  className="h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 pr-16 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
                  placeholder="인증번호 입력"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#f04452]">
                  02:32
                </span>
                <button
                  type="button"
                  className="mt-3 w-full text-center text-[12px] font-bold text-[#4640DE]"
                >
                  인증번호 재발송
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={
              verificationSent
                ? () => {
                    localStorage.setItem(SIGNUP_NAME_KEY, name.trim());
                    navigate("/signup/id");
                  }
                : requestVerificationCode
            }
            disabled={verificationSent ? !canConfirm : !canRequestCode}
            className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
          >
            {verificationSent ? "인증번호 확인" : "다음"}
          </button>
        </form>

        {showCarrierSheet && (
          <div className="absolute inset-0 z-20 flex items-end bg-black/35">
            <div className="w-full rounded-t-[18px] bg-white px-6 pb-8 pt-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold">통신사를 선택해 주세요</h2>
                <button
                  type="button"
                  onClick={() => setShowCarrierSheet(false)}
                  className="flex h-8 w-8 items-center justify-end text-black"
                  aria-label="통신사 선택 닫기"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
              <div className="space-y-1">
                {carriers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCarrier(item);
                      setShowCarrierSheet(false);
                    }}
                    className="flex h-11 w-full items-center text-left text-[14px] font-semibold text-[#17161c]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function SignupIdPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState(() => localStorage.getItem(SIGNUP_LOGIN_ID_KEY) ?? "");
  const isValid = normalizeLoginId(loginId).length >= 5;

  return (
    <AuthPageFrame backTo="/signup">
      <div className="px-7 pt-1">
        <AuthProgress />
        <h1 className="text-[15px] font-extrabold leading-6 tracking-normal">
          로그인에 사용할
          <br />
          아이디를 입력해 주세요
        </h1>
      </div>

      <form className="flex flex-1 flex-col px-7 pt-5" onSubmit={(event) => event.preventDefault()}>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          className={`h-[50px] w-full rounded-[8px] border bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] ${
            isValid ? "border-[#34c983]" : "border-[#eceaf5] focus:border-[#4640DE]"
          }`}
          placeholder="아이디"
        />
        {isValid && (
          <p className="mt-2 pl-1 text-[11px] font-bold text-[#20b875]">
            사용할 수 있는 아이디입니다.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            localStorage.setItem(SIGNUP_LOGIN_ID_KEY, normalizeLoginId(loginId));
            navigate("/signup/password");
          }}
          disabled={!isValid}
          className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
        >
          다음
        </button>
      </form>
    </AuthPageFrame>
  );
}

function SignupPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const hasPassword = password.length > 0;
  const passwordValid = password.length >= 8;
  const confirmValid = confirmPassword.length > 0 && password === confirmPassword;
  const showPasswordError = hasPassword && !passwordValid;
  const canContinue = passwordValid && confirmValid;

  async function submitSignup() {
    if (!canContinue || submitting) return;

    const loginId = localStorage.getItem(SIGNUP_LOGIN_ID_KEY) ?? "";
    const name = localStorage.getItem(SIGNUP_NAME_KEY) || "ShoeFit User";
    if (!loginId) {
      setSubmitError("아이디를 먼저 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const normalizedLoginId = normalizeLoginId(loginId);
      const response = await signup({
        login_id: getSignupLoginId(normalizedLoginId),
        email: isEmailLike(normalizedLoginId) ? normalizedLoginId : null,
        password,
        name,
      });
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.access_token);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.refresh_token);
      navigate("/signup/complete");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame backTo="/signup/id">
      <div className="px-7 pt-1">
        <AuthProgress />
        <h1 className="text-[15px] font-extrabold leading-6 tracking-normal">
          로그인에 사용할
          <br />
          비밀번호를 입력해 주세요
        </h1>
      </div>

      <form className="flex flex-1 flex-col px-7 pt-5" onSubmit={(event) => event.preventDefault()}>
        <PasswordInput
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((visible) => !visible)}
          placeholder="비밀번호"
          invalid={showPasswordError}
          valid={passwordValid}
        />
        {showPasswordError ? (
          <p className="mt-2 pl-1 text-[11px] font-bold text-[#ff4b64]">
            8자 이상 입력해 주세요.
          </p>
        ) : (
          <p className="mt-2 pl-1 text-[11px] font-bold text-[#9a98a5]">
            영문, 숫자, 특수문자 조합을 권장합니다.
          </p>
        )}

        <div className="mt-3">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((visible) => !visible)}
            placeholder="비밀번호 확인"
            invalid={confirmPassword.length > 0 && !confirmValid}
            valid={confirmValid}
          />
        </div>

        <button
          type="button"
          onClick={submitSignup}
          disabled={!canContinue || submitting}
          className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
        >
          {submitting ? "가입 중..." : "다음"}
        </button>
        {submitError && (
          <p className="-mt-6 mb-5 text-center text-[12px] font-bold text-[#ff4b64]">
            {submitError}
          </p>
        )}
      </form>
    </AuthPageFrame>
  );
}

function SignupCompletePage() {
  return (
    <AuthPageFrame backTo="/signup/password">
      <div className="flex flex-1 flex-col items-center justify-center px-7 pb-24 text-center">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0eeff] text-[#4640DE]">
          <PartyPopper size={30} strokeWidth={2.2} />
        </div>
        <h1 className="text-[19px] font-extrabold tracking-normal">
          회원가입이 완료되었어요!
        </h1>
        <p className="mt-5 text-[13px] font-semibold leading-6 text-[#4f4d5a]">
          AI 발 측정으로
          <br />
          맞춤 서비스를 추천받아 보세요.
        </p>
      </div>

      <div className="px-7 pb-8">
        <Link
          to="/login"
          className="flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white"
        >
          로그인 하기
        </Link>
      </div>
    </AuthPageFrame>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const canLogin = loginId.trim().length > 0 && password.length > 0;

  async function submitLogin() {
    if (!canLogin || submitting) return;

    try {
      setSubmitting(true);
      setLoginError("");
      const response = await login({
        login_id: normalizeLoginId(loginId),
        password,
      });
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.access_token);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.refresh_token);
      navigate("/home");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame backTo="/">
      <h1 className="px-7 pt-1 text-center text-[15px] font-extrabold tracking-normal">
        로그인
      </h1>

      <form className="flex flex-1 flex-col px-7 pt-8" onSubmit={(event) => event.preventDefault()}>
        <label className="mb-2 text-[12px] font-bold text-[#777482]">아이디</label>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          className="h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
          placeholder="아이디"
        />

        <label className="mb-2 mt-4 text-[12px] font-bold text-[#777482]">비밀번호</label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((visible) => !visible)}
          placeholder="비밀번호"
          valid={password.length > 0}
        />

        <label className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#777482]">
          <input
            checked={rememberLogin}
            onChange={(event) => setRememberLogin(event.target.checked)}
            type="checkbox"
            className="h-4 w-4 accent-[#4640DE]"
          />
          로그인 유지하기
        </label>

        <div className="mt-5 flex items-center justify-center gap-4 text-[12px] font-bold text-[#4f4d5a]">
          <Link to="/signup">회원가입</Link>
          <span className="h-3 w-px bg-[#d8d5e6]" />
          <button type="button">아이디 찾기</button>
          <span className="h-3 w-px bg-[#d8d5e6]" />
          <button type="button">비밀번호 찾기</button>
        </div>

        <button
          type="button"
          onClick={submitLogin}
          disabled={!canLogin || submitting}
          className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
        {loginError && (
          <p className="-mt-6 mb-5 text-center text-[12px] font-bold text-[#ff4b64]">
            {loginError}
          </p>
        )}
      </form>
    </AuthPageFrame>
  );
}

function AuthPageFrame({
  children,
  backTo,
}: {
  children: React.ReactNode;
  backTo: string;
}) {
  return (
    <main className="min-h-screen bg-[#f8f7ff] text-[#111111]">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#FBFAFF]">
        <AuthStatusBar />
        <div className="flex h-11 items-center px-5">
          <Link
            to={backTo}
            className="flex h-9 w-9 items-center justify-start text-[#111111]"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={25} strokeWidth={1.8} />
          </Link>
        </div>
        {children}
      </section>
    </main>
  );
}

function AuthProgress() {
  return <div className="mb-7 h-1 w-5 rounded-full bg-[#4640DE]" />;
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
  invalid = false,
  valid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder: string;
  invalid?: boolean;
  valid?: boolean;
}) {
  return (
    <div
      className={`flex h-[50px] items-center rounded-[8px] border bg-white px-4 ${
        invalid
          ? "border-[#ff4b64]"
          : valid
            ? "border-[#34c983]"
            : "border-[#eceaf5] focus-within:border-[#4640DE]"
      }`}
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={visible ? "text" : "password"}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2]"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="ml-3 flex h-8 w-8 items-center justify-center text-[#8d8a98]"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function AuthStatusBar() {
  return (
    <div className="relative flex h-11 items-center justify-between px-9 pt-2 text-[12px] font-bold text-black">
      <span>9:41</span>
      <div className="absolute left-1/2 top-[8px] h-[19px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="flex h-3 items-end gap-0.5">
          <span className="block h-1.5 w-0.5 rounded-sm bg-black" />
          <span className="block h-2 w-0.5 rounded-sm bg-black" />
          <span className="block h-2.5 w-0.5 rounded-sm bg-black" />
        </span>
        <span className="text-[10px] leading-none">⌁</span>
        <span className="h-2.5 w-5 rounded-[3px] border border-black/70 p-[1px]">
          <span className="block h-full w-3 rounded-[1px] bg-black" />
        </span>
      </div>
    </div>
  );
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function normalizeLoginId(value: string) {
  return value.trim().toLowerCase();
}

function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSignupLoginId(value: string) {
  if (!isEmailLike(value)) {
    return value;
  }
  return value.split("@", 1)[0];
}

function HomePage() {
  return (
    <section className="bg-[#FBFAFF] px-3 pb-5 pt-1">
      <HomeHeader />

      <HeroBanner />

      <CategoryScroller />

      <Link
        to="/measure"
        className="mt-3 flex h-[65px] items-center justify-between rounded-[8px] bg-[#4640DE] px-5 text-white shadow-lg shadow-[#4640DE]/18"
      >
        <div>
          <p className="text-[15px] font-extrabold leading-none">30초 촬영으로 내 발 추천받기</p>
          <p className="mt-2 text-[11px] font-semibold text-white/72">
            단 한 번 촬영으로 사이즈를 새롭게 찾아요.
          </p>
        </div>
        <span className="flex h-8 items-center rounded-full bg-white px-3 text-[11px] font-black text-[#4640DE]">
          시작하기
        </span>
      </Link>

      <ProductSection title="NEW" products={newProducts} />

      <ProductSection title="나를 위한 맞춤 추천" products={fitProducts} />

      <section className="mt-5">
        <img
          src={runBannerImage}
          alt=""
          className="h-[98px] w-full rounded-[8px] object-cover"
        />
      </section>

      <ProductSection
        title="매일 신기 좋은 편안한 신발"
        subtitle="데일리 스니커즈"
        products={dailyProducts}
        compact
      />
    </section>
  );
}

function HomeHeader() {
  return (
    <header className="flex items-center gap-3 pb-3 pt-1">
      <Link to="/home" className="shrink-0 text-[18px] font-black tracking-[-0.02em] text-[#111111]">
        shoeFit
      </Link>
      <Link
        to="/search"
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f0eefb] px-3"
      >
        <Search size={15} className="shrink-0 text-[#9d98d9]" />
        <span className="min-w-0 flex-1 text-[12px] font-semibold text-[#aaa6c7]">
          브랜드, 상품명 검색
        </span>
      </Link>
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ece9ff] text-[#8b84e6]"
        aria-label="알림"
      >
        <Bell size={15} strokeWidth={2.2} />
      </button>
    </header>
  );
}

function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[200px] overflow-hidden rounded-[8px] bg-[#24222b]">
      {heroSlides.map((slide, index) => (
        <img
          key={`${slide.title}-blur`}
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-[8px] transition-all duration-700 ease-out ${
            index === activeIndex
              ? "opacity-80"
              : index < activeIndex
                ? "opacity-0"
                : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/18" />
      <div className="absolute inset-x-3 top-3 h-[168px] overflow-hidden rounded-[12px] bg-[#24222b] shadow-lg shadow-black/12">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.title}
            src={slide.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              index === activeIndex
                ? "translate-x-0 opacity-100"
                : index < activeIndex
                  ? "-translate-x-4 opacity-0"
                  : "translate-x-4 opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/14 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-[22px] font-black leading-[1.18] tracking-normal">
            {activeSlide.title}
          </p>
          <p className="mt-2 text-[12px] font-semibold leading-5 text-white/86">
            {activeSlide.description}
          </p>
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-5 bg-[#4640DE]" : "w-1.5 bg-white"
            }`}
            aria-label={`${index + 1}번째 배너 보기`}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryScroller() {
  return (
    <div className="hide-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.label}
          type="button"
          className="flex w-[54px] shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={`flex h-[38px] w-[46px] items-center justify-center rounded-full ${
              category.image ? "bg-white" : "bg-[#efeaff]"
            }`}
          >
            {category.image ? (
              <img
                src={category.image}
                alt=""
                className="max-h-[34px] max-w-[44px] object-contain"
              />
            ) : (
              <span className="text-[12px] font-black text-[#4640DE]">ALL</span>
            )}
          </span>
          <span className="text-[10px] font-bold text-[#777482]">{category.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  products: ShopProduct[];
  compact?: boolean;
}) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-black text-[#191821]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-[12px] font-semibold text-[#8a8695]">{subtitle}</p>
          )}
        </div>
        <button type="button" className="text-[10px] font-bold text-[#8b8795]">
          더보기
        </button>
      </div>
      <div
        className={
          compact
            ? "hide-scrollbar flex gap-3 overflow-x-auto pb-1"
            : "grid grid-cols-2 gap-x-3 gap-y-5"
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  compact = false,
}: {
  product: ShopProduct;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "w-[106px] shrink-0" : "min-w-0"}>
      <Link
        to={`/products/${product.id}`}
        className="relative flex aspect-[1.12/1] items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2"
      >
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-[#6f66ff] px-2 py-1 text-[9px] font-black text-white">
            {product.badge}
          </span>
        )}
        <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
        <span
          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#777482] shadow-sm"
          aria-hidden="true"
        >
          <Heart size={13} strokeWidth={1.9} />
        </span>
      </Link>
      <p className="mt-2 text-[9px] font-bold text-[#888493]">{product.brand}</p>
      <Link
        to={`/products/${product.id}`}
        className="mt-0.5 block truncate text-[11px] font-extrabold text-[#1f1d28]"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-[11px] font-black text-[#1f1d28]">{product.price}</p>
      <div className="mt-1 flex gap-1">
        <span className="rounded-[4px] bg-[#f1efff] px-1.5 py-0.5 text-[8px] font-black text-[#4640DE]">
          AI FIT
        </span>
        <span className="rounded-[4px] bg-[#f6f5fb] px-1.5 py-0.5 text-[8px] font-bold text-[#8a8695]">
          빠른배송
        </span>
      </div>
    </article>
  );
}

function MiniProductCard({
  product,
}: {
  product: ShopProduct;
}) {
  return (
    <article className="min-w-0">
      <Link
        to={`/products/${product.id}`}
        className="relative flex aspect-square items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2"
      >
        {product.badge && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#6f66ff] px-1.5 py-0.5 text-[8px] font-black text-white">
            {product.badge}
          </span>
        )}
        <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
      </Link>
      <p className="mt-2 truncate text-[8px] font-bold text-[#888493]">{product.brand}</p>
      <h3 className="line-clamp-2 min-h-[28px] text-[10px] font-extrabold leading-[14px] text-[#1f1d28]">
        {product.name}
      </h3>
      <p className="mt-1 text-[10px] font-black text-[#1f1d28]">{product.price}</p>
    </article>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <div className="flex h-11 items-center justify-between">
        <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
          <ChevronLeft size={24} />
        </Link>
        <div className="ml-auto flex gap-2">
          <Link
            to="/search"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]"
            aria-label="검색"
          >
            <Search size={15} />
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]"
            aria-label="장바구니"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
      <div className="mt-1">
        <h1 className="text-[13px] font-black text-[#1f1d28]">{title}</h1>
        {subtitle && <p className="mt-1 text-[10px] font-bold text-[#8a8695]">{subtitle}</p>}
      </div>
    </header>
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

function WishlistPage() {
  return (
    <section className="px-3 pb-5 pt-1">
      <TopBar title="Wishlist" />

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {["전체", "운동화", "스니커즈", "러닝화"].map((item, index) => (
          <button
            key={item}
            type="button"
            className={`h-8 shrink-0 rounded-full px-4 text-[11px] font-black ${
              index === 0 ? "bg-[#4640DE] text-white" : "bg-[#f0eefb] text-[#777482]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-5">
        {wishlistProducts.map((product) => (
          <MiniProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function ExplorePage() {
  const [keyword, setKeyword] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const hasSearch = normalizedKeyword.length > 0;
  const searchResults = useMemo(() => {
    if (!hasSearch) {
      return [];
    }

    if (normalizedKeyword.includes("러닝") || normalizedKeyword.includes("운동")) {
      return [...catalogProducts, ...fitProducts, ...newProducts];
    }
    if (normalizedKeyword.includes("스니커즈") || normalizedKeyword.includes("데일리")) {
      return dailyProducts;
    }
    if (normalizedKeyword.includes("부츠")) {
      return wishlistProducts.filter((product) => product.name.includes("부츠"));
    }
    if (normalizedKeyword.includes("샌들") || normalizedKeyword.includes("슬리퍼")) {
      return newProducts.filter((product) => product.name.includes("샌들") || product.name.includes("뮬"));
    }

    return searchableProducts.filter((product) => {
      const target = [
        product.brand,
        product.name,
        product.price,
        "badge" in product ? product.badge ?? "" : "",
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(normalizedKeyword);
    });
  }, [hasSearch, normalizedKeyword]);

  return (
    <section className="px-3 pb-5 pt-1">
      <div className="flex h-11 items-center gap-2">
        <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
          <ChevronLeft size={24} />
        </Link>
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
          <Search size={14} className="shrink-0 text-[#aaa6c7]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#1f1d28] outline-none placeholder:text-[#b0acbd]"
            placeholder="상품명, 브랜드 검색"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0eefb] text-[#aaa6c7]"
              aria-label="검색어 지우기"
            >
              <X size={12} />
            </button>
          )}
        </label>
      </div>

      {!hasSearch && (
        <>
          <div className="mt-1">
            <h1 className="text-[13px] font-black text-[#1f1d28]">Explore</h1>
            <p className="mt-1 text-[10px] font-bold text-[#8a8695]">
              나에게 맞는 스타일 찾기
            </p>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {["러닝화", "스니커즈", "나이키", "puma", "부츠"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKeyword(item)}
                className="h-8 shrink-0 rounded-full bg-[#f0eefb] px-3 text-[10px] font-black text-[#5c56bd]"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {explorePosts.map((post, index) => (
              <article
                key={post.id}
                className={`overflow-hidden rounded-[8px] bg-white ${
                  index === 2 ? "mt-6" : ""
                }`}
              >
                <img src={post.image} alt="" className="aspect-[0.78/1] w-full object-cover" />
                <div className="flex items-center justify-between px-1.5 py-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff7a1a] text-[8px] font-black text-white">
                      {post.author[0]}
                    </span>
                    <span className="truncate text-[10px] font-black text-[#1f1d28]">
                      {post.author}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#8a8695]">
                    <Heart size={10} />
                    {post.likes}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {hasSearch && (
        <section className="mt-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#8a8695]">검색 결과</p>
              <h1 className="mt-1 text-[14px] font-black text-[#1f1d28]">
                {keyword}
              </h1>
            </div>
            <p className="text-[10px] font-bold text-[#8a8695]">
              {searchResults.length}개
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              {searchResults.map((product) => (
                <ProductCard key={`${product.id}-${product.name}`} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[8px] bg-white px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0eefb] text-[#8b84e6]">
                <Search size={24} />
              </div>
              <p className="mt-4 text-[15px] font-black text-[#1f1d28]">
                검색결과를 찾을 수 없습니다
              </p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-[#8a8695]">
                다른 브랜드명이나 상품명으로 다시 검색해 보세요.
              </p>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function SearchPage() {
  const popular = ["러닝화", "스니커즈", "운동화", "샌들", "로퍼"];
  const rankings = ["러닝화", "스니커즈", "운동화", "샌들", "로퍼", "부츠", "플랫슈즈", "슬립온", "워커", "등산화"];

  return (
    <section className="px-3 pb-5 pt-1">
      <div className="flex h-11 items-center gap-2">
        <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
          <ChevronLeft size={24} />
        </Link>
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
          <span className="min-w-0 flex-1 text-[11px] font-semibold text-[#b0acbd]">
            오늘 가장 많이 찾는 신발은?
          </span>
          <X size={14} className="text-[#c0bcd0]" />
        </label>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]" type="button">
          <Search size={15} />
        </button>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] font-black">최근 검색어</h2>
          <button type="button" className="text-[10px] font-bold text-[#8a8695]">전체 삭제</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["플랫슈즈", "레인부츠", "러닝화", "슬리퍼"].map((item) => (
            <span key={item} className="rounded-full bg-[#f4f1ff] px-3 py-2 text-[10px] font-bold text-[#5c56bd]">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[12px] font-black">오늘 뜨는</h2>
        <div className="flex flex-wrap gap-2">
          {popular.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#777482] shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[12px] font-black">인기</h2>
        <ol className="grid grid-cols-2 gap-x-6 gap-y-2">
          {rankings.map((item, index) => (
            <li key={item} className="text-[11px] font-semibold text-[#3b3944]">
              {index + 1}. <span className="ml-1">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

function ProductListPage() {
  return (
    <section className="px-3 pb-5 pt-1">
      <div className="flex h-11 items-center gap-2">
        <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
          <ChevronLeft size={24} />
        </Link>
        <Link to="/search" className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f0eefb] px-3">
          <span className="truncate text-[11px] font-semibold text-[#5d5969]">러닝화</span>
          <X size={13} className="ml-auto text-[#aaa6c7]" />
        </Link>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]" type="button">
          <ShoppingCart size={15} />
        </button>
      </div>

      <img src={listBannerImage} alt="" className="mt-1 h-[42px] w-full rounded-[6px] object-cover" />

      <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {["신발 랭킹", "러닝화", "농구화", "운동화", "샌들", "부츠"].map((item, index) => (
          <button
            key={item}
            type="button"
            className={`h-8 shrink-0 rounded-full px-3 text-[10px] font-black ${
              index === 1 ? "bg-[#4640DE] text-white" : "bg-[#f4f1ff] text-[#777482]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-[14px] font-black">러닝화 검색 결과 <span className="text-[#777482]">110개</span></h1>
        <button type="button" className="text-[10px] font-bold text-[#8a8695]">추천순</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">
        {catalogProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function ProductDetailPage() {
  const { productId } = useParams();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const baseProduct = shopProducts.find((item) => item.id === productId);

  useEffect(() => {
    setSelectedSize(null);
  }, [productId]);

  if (!baseProduct) {
    return (
      <section className="flex min-h-[calc(100dvh-120px)] flex-col px-3 pb-24 pt-1">
        <div className="flex h-11 items-center justify-between">
          <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-[8px] bg-white px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0eefb] text-[#8b84e6]">
            <Search size={24} />
          </div>
          <p className="mt-4 text-[15px] font-black text-[#1f1d28]">
            상품을 찾을 수 없습니다
          </p>
          <Link
            to="/home"
            className="mt-5 flex h-10 items-center justify-center rounded-full bg-[#4640DE] px-5 text-[12px] font-black text-white"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  const product = {
    ...baseProduct,
    ...detailProductOverrides[baseProduct.id],
  };
  const detailImages = product.detailImages ?? [product.image];
  const activeSize = selectedSize || product.recommendedSize || "225";

  return (
    <section className="px-3 pb-40 pt-1">
      <div className="flex h-11 items-center justify-between">
        <Link to="/home" className="flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
          <ChevronLeft size={24} />
        </Link>
      </div>

      <div className="flex h-[190px] items-center justify-center">
        <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
      </div>

      <div className="mt-1 flex justify-center gap-3">
        {detailImages.map((image, index) => (
          <button
            key={`${product.id}-${image}`}
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${
              index === 0 ? "bg-[#d9d4ff]" : "bg-[#f0eefb]"
            }`}
          >
            <img src={image} alt="" className="max-h-full max-w-full object-contain" />
          </button>
        ))}
      </div>

      <Link
        to="/measure"
        className="mx-auto mt-3 flex h-9 w-[178px] items-center justify-center rounded-full bg-[#7268f6] text-[11px] font-black text-white"
      >
        AI 발 측정으로 사이즈 추천받기
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#8a8695]">{product.brand}</p>
            <h1 className="mt-1 text-[16px] font-black text-[#1f1d28]">{product.name}</h1>
            <p className="mt-2 text-[12px] font-semibold text-[#777482]">
              {product.color ?? "AI 추천 핏 상품"}
            </p>
          </div>
          <button type="button" className="flex h-8 w-8 items-center justify-center text-[#777482]">
            <Heart size={20} />
          </button>
        </div>
        <p className="mt-3 text-right text-[17px] font-black">{product.price}</p>
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-[12px] font-black text-[#4640DE]">size</h2>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {productSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`h-9 min-w-[52px] rounded-[10px] text-[11px] font-black ${
                size === activeSize ? "bg-[#4640DE] text-white" : "bg-[#f0eefb] text-[#6f69d8]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-[84px] z-10 mx-auto flex max-w-[430px] gap-2 px-4">
        <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d9d4ff] bg-white text-[#4640DE]">
          <ShoppingCart size={20} />
        </button>
        <button type="button" className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#4640DE] text-[13px] font-black text-white">
          바로 구매하기
        </button>
      </div>
    </section>
  );
}

function BottomNav() {
  const items = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Search },
    { to: "/measure", label: "AI fit", icon: Ruler, primary: true },
    { to: "/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account", label: "My", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] px-4 pb-3">
      <div className="grid grid-cols-5 items-center rounded-[28px] bg-[#c9c0f8] px-3 py-2 shadow-[0_-8px_20px_rgba(70,64,222,0.10)]">
        {items.map(({ to, label, icon: Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-[54px] flex-col items-center justify-center gap-1 text-[9px] font-black ${
                primary
                  ? "text-white"
                  : isActive
                    ? "text-[#15131f]"
                    : "text-[#15131f]"
              }`
            }
          >
            <span
              className={
                primary
                  ? "flex h-12 w-12 items-center justify-center rounded-full bg-[#5c4cf0] shadow-lg shadow-[#4640DE]/28"
                  : "flex h-6 w-6 items-center justify-center"
              }
            >
              <Icon size={primary ? 19 : 18} strokeWidth={2.1} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default App;
