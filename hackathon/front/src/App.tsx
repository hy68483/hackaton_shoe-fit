import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  Home,
  LockKeyhole,
  Mail,
  Package,
  PartyPopper,
  Ruler,
  ScanLine,
  Search,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { deleteCurrentUser, getCurrentUser, login, signup } from "./api/auth";
import {
  analyzeMeasurementBatch,
  createMeasurementConsent,
  createMeasurementSession,
  uploadMeasurementImage,
  validateMeasurementImage,
  type MeasurementBatchShot,
  type MeasurementResultData,
} from "./api/measurements";
import { applyFootProfile } from "./api/profiles";
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
import rainAdifomImage from "./assets/home/rain-adifom.png";
import rainMidImage from "./assets/home/rain-mid.png";
import rainOriginalImage from "./assets/home/rain-original.png";
import rainPaytoImage from "./assets/home/rain-payto.png";
import recommendBondiImage from "./assets/home/recommend-bondi.png";
import recommendGelImage from "./assets/home/recommend-gel.png";
import recommendUaImage from "./assets/home/recommend-ua.png";
import recommendVomeroImage from "./assets/home/recommend-vomero.png";
import runBannerImage from "./assets/home/run-banner.png";
import shoeFitLogoImage from "./assets/home/shoe-fit-logo.png";
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
import measureGuideImage from "./assets/measure/measure-guide.png";
import measureProcessingImage from "./assets/measure/measure-processing.png";
import measureStartImage from "./assets/measure/measure-start.png";
import resultProduct1Image from "./assets/measure/result-product-1.png";
import resultProduct2Image from "./assets/measure/result-product-2.png";
import resultProduct3Image from "./assets/measure/result-product-3.png";
import resultProduct4Image from "./assets/measure/result-product-4.png";

const carriers = [
  "SKT",
  "KT",
  "LG U+",
  "SKT 알뜰폰",
  "KT 알뜰폰",
  "LG U+ 알뜰폰",
];
const SIGNUP_NAME_KEY = "shoefit.signup.name";
const SIGNUP_LOGIN_ID_KEY = "shoefit.signup.loginId";
const AUTH_ACCESS_TOKEN_KEY = "shoefit.auth.accessToken";
const AUTH_REFRESH_TOKEN_KEY = "shoefit.auth.refreshToken";
const AUTH_LOGIN_ID_KEY = "shoefit.auth.loginId";
const AUTH_USER_NAME_KEY = "shoefit.auth.userName";
const CART_STORAGE_KEY = "shoefit.cart.items";
const FOOT_PROFILE_STORAGE_KEY = "shoefit.footProfile";
const WISHLIST_STORAGE_KEY = "shoefit.wishlist.productIds";
const RECENT_SEARCH_STORAGE_KEY = "shoefit.search.recentKeywords";

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

type CartItem = {
  productId: string;
  size: string;
  quantity: number;
};

type FootProfile = {
  measuredAt: string;
  recommendedSizeMm: number;
  footLengthMm: number;
  footWidthMm: number;
  footWidthLabel: string;
  footSide?: "LEFT" | "RIGHT";
  footSideLabel: string;
  instepLabel: string;
  fitScore: number;
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

const rainProducts = [
  {
    id: "rain-adifom",
    image: rainAdifomImage,
    brand: "adidas",
    name: "아디폼 슈퍼스타 부츠",
    price: "129,000원",
    badge: "Fit For You",
  },
  {
    id: "rain-hunter",
    image: rainOriginalImage,
    brand: "헌터",
    name: "[WOMEN] 오리지날 플레이 숏 레인부츠",
    price: "149,000원",
  },
  {
    id: "rain-oz",
    image: rainMidImage,
    brand: "오즈",
    name: "토트 레인부츠 미들",
    price: "69,900원",
  },
  {
    id: "rain-payto",
    image: rainPaytoImage,
    brand: "핏플랍",
    name: "페이토 레인부츠",
    price: "89,000원",
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
  ...rainProducts,
  ...wishlistProducts,
  ...catalogProducts,
] satisfies ShopProduct[];

const shopProducts = Array.from(
  new Map(searchableProducts.map((product) => [product.id, product])).values(),
);

const detailProductOverrides: Record<string, Partial<ShopProduct>> = {
  magmax: {
    image: detailMainImage,
    detailImages: [
      detailMainImage,
      detailThumb1Image,
      detailThumb2Image,
      detailThumb3Image,
    ],
    color: "루비 레드-로열 사파이어",
    price: "239,000원",
    recommendedSize: "225",
  },
};

const productSizes = Array.from({ length: 19 }, (_, index) =>
  String(210 + index * 5),
);

const defaultCartItems: CartItem[] = [];

const measurementResultProducts = [
  {
    id: "result-1",
    image: resultProduct1Image,
    brand: "Nike",
    name: "에어맥스 포털",
    price: "129,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-2",
    image: resultProduct2Image,
    brand: "adidas",
    name: "슈퍼스타 로우",
    price: "139,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-3",
    image: resultProduct3Image,
    brand: "Asics",
    name: "젤 카야노 31",
    price: "189,000원",
    badge: "✨ Fit for You",
  },
  {
    id: "result-4",
    image: resultProduct4Image,
    brand: "Puma",
    name: "스피드캣 우먼스",
    price: "119,000원",
    badge: "✨ Fit for You",
  },
];

type MeasureStep =
  | "profile"
  | "start"
  | "paperIntro"
  | "paperChecklist"
  | "consent"
  | "guide"
  | "camera"
  | "processing"
  | "fit"
  | "result"
  | "login"
  | "denied"
  | "qualityFail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<IdentityVerificationPage />} />
      <Route path="/signup/id" element={<SignupIdPage />} />
      <Route path="/signup/password" element={<SignupPasswordPage />} />
      <Route path="/signup/complete" element={<SignupCompletePage />} />
      <Route path="/signup/options" element={<IdentityVerificationPage />} />
      <Route path="/admin/*" element={<AdminShell />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const hideBottomNav =
    location.pathname.startsWith("/measure") ||
    /^\/products\/[^/]+$/.test(location.pathname) ||
    location.pathname === "/account/foot-profile" ||
    location.pathname === "/cart";

  return (
    <main className="min-h-screen bg-[#ebe9f7] text-[#191821]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBFAFF] shadow-xl shadow-[#4640DE]/10">
        <AuthStatusBar />
        <div className={hideBottomNav ? "flex-1" : "flex-1 pb-[76px]"}>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/measure" element={<MeasurePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route
              path="/products/:productId"
              element={<ProductDetailPage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/foot-profile" element={<FootProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
          </Routes>
        </div>

        {!hideBottomNav && <BottomNav />}
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
        <MobileStatusBar light className="absolute inset-x-0 top-0 z-10" />

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

function AdminShell() {
  return (
    <main className="min-h-screen bg-[#ebe9f7] text-[#191821]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBFAFF] shadow-xl shadow-[#4640DE]/10">
        <AuthStatusBar />
        <Routes>
          <Route path="/" element={<AdminLoginPage />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/products/new" element={<AdminProductCreatePage />} />
          <Route path="/products/edit" element={<AdminProductDataPage />} />
          <Route path="/sizes/new" element={<AdminSizeCreatePage />} />
          <Route path="/sizes/edit" element={<AdminSizeEditPage />} />
          <Route path="/duplicates" element={<AdminDuplicateCheckPage />} />
        </Routes>
      </div>
    </main>
  );
}

function AdminHeader({ title, backTo = "/admin/dashboard" }: { title: string; backTo?: string }) {
  return (
    <header className="relative flex h-12 items-center justify-center px-5">
      <Link to={backTo} className="absolute left-5 flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
        <ChevronLeft size={24} />
      </Link>
      <h1 className="text-[13px] font-black">{title}</h1>
    </header>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const canLogin = adminId.trim().length > 0 && password.length > 0;

  async function submitAdminLogin() {
    if (!canLogin || submitting) return;

    try {
      setSubmitting(true);
      setLoginError("");
      const response = await login({
        login_id: normalizeLoginId(adminId),
        password,
      });
      const currentUserResponse = await getCurrentUser(response.data.access_token);
      if (currentUserResponse.data.user.role !== "ADMIN") {
        setLoginError("관리자 권한이 없는 계정입니다.");
        return;
      }
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.access_token);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.refresh_token);
      localStorage.setItem(AUTH_LOGIN_ID_KEY, normalizeLoginId(adminId));
      navigate("/admin/dashboard");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100dvh-44px)] flex-col px-7 pb-8 pt-16">
      <div className="text-center">
        <p className="text-[22px] font-black tracking-[-0.02em]">shoeFit</p>
        <p className="mt-2 text-[12px] font-bold text-[#777482]">관리자 전용</p>
      </div>
      <form className="mt-16 space-y-5" onSubmit={(event) => event.preventDefault()}>
        <label className="block">
          <span className="text-[11px] font-bold text-[#777482]">아이디</span>
          <input value={adminId} onChange={(event) => setAdminId(event.target.value)} className="mt-2 h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 text-[14px] font-bold outline-none focus:border-[#4640DE]" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold text-[#777482]">비밀번호</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 text-[14px] font-bold outline-none focus:border-[#4640DE]" />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-bold text-[#777482]">
          <input type="checkbox" className="accent-[#4640DE]" />
          로그인 상태 유지
        </label>
      </form>
      {loginError && (
        <p className="mt-auto mb-4 text-center text-[12px] font-bold text-[#ff4b64]">
          {loginError}
        </p>
      )}
      <button type="button" disabled={!canLogin || submitting} onClick={submitAdminLogin} className={`${loginError ? "" : "mt-auto"} flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white disabled:bg-[#c7c2f5]`}>
        {submitting ? "확인 중..." : "로그인하기"}
      </button>
    </section>
  );
}

function AdminDashboardPage() {
  const registeredProductCount = shopProducts.length;
  const registeredSizeCount = registeredProductCount * productSizes.length;
  const menus = [
    { to: "/admin/products/new", title: "상품 등록", description: "새 상품 등록하기", icon: Package },
    { to: "/admin/products/edit", title: "상품 데이터 수정", description: "상품명, 브랜드, 카테고리 수정", icon: Search },
    { to: "/admin/sizes/new", title: "사이즈 등록", description: "모델별 사이즈 데이터 추가", icon: Ruler },
    { to: "/admin/sizes/edit", title: "사이즈 수정", description: "기존 사이즈 치수 보정", icon: Ruler },
    { to: "/admin/duplicates", title: "중복 데이터 확인", description: "상품/사이즈 중복 검사", icon: Check },
  ];

  return (
    <section className="px-5 pb-8 pt-1">
      <AdminHeader title="대시보드" backTo="/admin/login" />
      <div className="mt-3 rounded-[14px] bg-white p-4 shadow-sm">
        <p className="text-[12px] font-bold text-[#777482]">상품 관리자</p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[22px] font-black">총 {registeredProductCount}개</p>
            <p className="mt-1 text-[11px] font-bold text-[#8a8695]">등록 상품</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-black text-[#4640DE]">{registeredSizeCount}개</p>
            <p className="mt-1 text-[10px] font-bold text-[#8a8695]">사이즈 데이터</p>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {menus.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-4 rounded-[14px] bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0eefb] text-[#4640DE]">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black">{title}</span>
              <span className="mt-1 block text-[10px] font-bold text-[#8a8695]">{description}</span>
            </span>
            <ChevronLeft size={18} className="rotate-180 text-[#aaa6c7]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function AdminProductCreatePage() {
  const [brand, setBrand] = useState("Nike");
  const [productName, setProductName] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(["250", "255", "260"]);
  const sizeOptions = ["210", "215", "220", "225", "230", "235", "240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290", "295"];

  function toggleSize(size: string) {
    setSelectedSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size]);
  }

  return (
    <section className="px-5 pb-8 pt-1">
      <AdminHeader title="브랜드 상품 등록" />
      <div className="mt-3 space-y-4">
        <AdminField label="기본 정보">
          <input value={brand} onChange={(event) => setBrand(event.target.value)} className="h-11 w-full rounded-[8px] bg-[#f5f3ff] px-4 text-[12px] font-bold outline-none" />
          <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="상품명을 입력해 주세요" className="mt-2 h-11 w-full rounded-[8px] bg-[#f5f3ff] px-4 text-[12px] font-bold outline-none placeholder:text-[#aaa6c7]" />
        </AdminField>
        <AdminField label="판매 사이즈">
          <div className="grid grid-cols-6 gap-2">
            {sizeOptions.map((size) => (
              <button key={size} type="button" onClick={() => toggleSize(size)} className={`h-8 rounded-[8px] text-[10px] font-black ${selectedSizes.includes(size) ? "bg-[#4640DE] text-white" : "bg-[#f0eefb] text-[#6b5cff]"}`}>
                {size}
              </button>
            ))}
          </div>
        </AdminField>
        <AdminField label="상품 이미지">
          <button type="button" className="flex h-[86px] w-full items-center justify-center rounded-[10px] border border-dashed border-[#aaa6e8] bg-[#fbfaff] text-[11px] font-black text-[#6b5cff]">
            + 이미지 업로드
          </button>
        </AdminField>
        <AdminField label="상세 설명">
          <textarea className="h-24 w-full resize-none rounded-[8px] bg-[#f5f3ff] p-4 text-[12px] font-bold outline-none" placeholder="상품 설명을 입력해 주세요" />
        </AdminField>
      </div>
      <button type="button" className="mt-5 flex h-[54px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white">
        상품 등록하기
      </button>
    </section>
  );
}

function AdminProductDataPage() {
  const [keyword, setKeyword] = useState("");
  const filteredProducts = catalogProducts.filter((product) => `${product.brand} ${product.name}`.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <section className="px-5 pb-8 pt-1">
      <AdminHeader title="전체 데이터 조회/수정" />
      <label className="mt-3 flex h-11 items-center gap-2 rounded-full bg-[#f0eefb] px-4">
        <Search size={15} className="text-[#8b84e6]" />
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="브랜드, 상품명 검색" className="min-w-0 flex-1 bg-transparent text-[12px] font-bold outline-none placeholder:text-[#aaa6c7]" />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {["러닝화", "스니커즈", "샌들", "부츠", "나이키", "뉴발란스"].map((chip) => (
          <button key={chip} type="button" className="rounded-full bg-[#f0eefb] px-3 py-1.5 text-[10px] font-black text-[#6b5cff]">
            {chip}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {filteredProducts.slice(0, 6).map((product) => (
          <article key={product.id} className="flex items-center gap-3 rounded-[12px] bg-white p-3 shadow-sm">
            <img src={product.image} alt="" className="h-14 w-14 rounded-[8px] bg-[#f3f2f8] object-contain p-1" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[#8a8695]">{product.brand}</p>
              <h2 className="truncate text-[12px] font-black">{product.name}</h2>
              <p className="mt-1 text-[10px] font-normal text-[#8a8695]">{product.price}</p>
            </div>
            <button type="button" className="rounded-full bg-[#f0eefb] px-3 py-1.5 text-[10px] font-black text-[#4640DE]">수정</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminSizeCreatePage() {
  return (
    <section className="px-5 pb-8 pt-1">
      <AdminHeader title="모델별 사이즈 등록" />
      <div className="mt-4 rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <img src={detailMainImage} alt="" className="h-14 w-14 rounded-[10px] bg-[#f3f2f8] object-contain p-1" />
          <div>
            <p className="text-[10px] font-bold text-[#8a8695]">Nike</p>
            <h2 className="mt-1 text-[13px] font-black">맥그맥스 나이트로 2</h2>
            <p className="mt-1 text-[10px] font-bold text-[#8a8695]">사이즈 스펙 4개 등록됨</p>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-[14px] bg-white shadow-sm">
        {["250", "255", "260", "265", "270", "280"].map((size) => (
          <div key={size} className="grid grid-cols-4 gap-2 border-b border-[#f0eef7] px-4 py-3 text-[10px] font-bold last:border-b-0">
            <span className="text-[#4640DE]">{size}</span>
            <span>길이 {Number(size) + 3}.4</span>
            <span>볼 98.0</span>
            <span>등 42.3</span>
          </div>
        ))}
      </div>
      <button type="button" className="mt-5 flex h-[48px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[12px] font-black text-white">사이즈 추가하기</button>
    </section>
  );
}

function AdminSizeEditPage() {
  const rows = ["250", "255", "260", "265", "270", "275", "280"];

  return (
    <section className="px-5 pb-8 pt-1">
      <AdminHeader title="사이즈 수정" />
      <div className="mt-4 space-y-3">
        {rows.map((size) => (
          <div key={size} className="rounded-[12px] bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-black">{size} mm</h2>
              <button type="button" className="rounded-[8px] bg-[#d8d4fb] px-3 py-1 text-[10px] font-black text-white">저장</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["길이", "발볼", "발등"].map((label, index) => (
                <label key={label} className="block">
                  <span className="text-[9px] font-bold text-[#8a8695]">{label}</span>
                  <input defaultValue={index === 0 ? Number(size) + 5 : index === 1 ? 96.0 : 43.5} className="mt-1 h-9 w-full rounded-[8px] bg-[#f5f3ff] px-2 text-[10px] font-bold outline-none" />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminDuplicateCheckPage() {
  const duplicates = [
    { name: "에어맥스 나이트로 2", original: "265mm", candidate: "265mm", diff: "0.0mm" },
    { name: "보메로 플러스 W", original: "260mm", candidate: "260.5mm", diff: "0.5mm" },
  ];

  return (
    <section className="flex min-h-[calc(100dvh-44px)] flex-col px-5 pb-8 pt-1">
      <AdminHeader title="중복 데이터 확인" />
      <div className="mt-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe8ec] text-[#ff5664]">
          <X size={30} />
        </div>
        <h1 className="mt-6 text-[17px] font-black">이미 등록된 사이즈가 있어요</h1>
        <p className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8695]">브랜드, 상품명, 사이즈 기준으로 기존 데이터를 확인해 주세요.</p>
      </div>
      <div className="mt-8 space-y-3">
        {duplicates.map((item) => (
          <article key={item.name} className="rounded-[12px] bg-white p-4 shadow-sm">
            <p className="text-[12px] font-black">{item.name}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <span className="rounded-[8px] bg-[#f5f3ff] py-2">{item.original}</span>
              <span className="rounded-[8px] bg-[#f5f3ff] py-2">{item.candidate}</span>
              <span className="rounded-[8px] bg-[#ffe8ec] py-2 text-[#ff5664]">{item.diff}</span>
            </div>
          </article>
        ))}
      </div>
      <Link to="/admin/products/new" className="mt-auto flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white">새 상품으로 등록하기</Link>
      <Link to="/admin/products/edit" className="mt-4 text-center text-[12px] font-black text-[#6b5cff]">기존 것 수정</Link>
    </section>
  );
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[12px] font-black text-[#4640DE]">{label}</h2>
      <div className="rounded-[12px] bg-white p-4 shadow-sm">{children}</div>
    </section>
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

        <form
          className="flex flex-1 flex-col px-7 pt-5"
          onSubmit={(event) => event.preventDefault()}
        >
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
                  nameError
                    ? "border-[#ff4b64]"
                    : "border-[#eceaf5] focus:border-[#4640DE]"
                }`}
                placeholder="이름"
              />
              {nameError && (
                <p className="mt-1 pl-1 text-[11px] font-semibold text-[#ff4b64]">
                  이름을 입력해 주세요.
                </p>
              )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_18px_96px] items-center gap-1.5">
              <input
                value={birthDate}
                onChange={(event) =>
                  setBirthDate(onlyDigits(event.target.value, 6))
                }
                inputMode="numeric"
                className="h-[50px] min-w-0 rounded-[8px] border border-[#eceaf5] bg-white px-3 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
                placeholder="주민번호"
              />
              <span className="text-center text-[18px] font-light text-[#1b1b1f]">
                -
              </span>
              <div className="relative flex h-[50px] min-w-0 items-center gap-1.5 overflow-hidden">
                <input
                  value={residentBackNumber}
                  onChange={(event) =>
                    setResidentBackNumber(onlyDigits(event.target.value, 7))
                  }
                  inputMode="numeric"
                  type="tel"
                  autoComplete="off"
                  className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                  aria-label="주민번호 뒤 7자리"
                />
                <div
                  className="flex h-[50px] w-[42px] shrink-0 items-center justify-center rounded-[8px] border border-[#eceaf5] bg-white text-[15px] font-semibold text-black"
                  aria-hidden="true"
                >
                  {residentBackNumber[0] ?? ""}
                </div>
                <div
                  className="flex h-[50px] min-w-0 flex-1 items-center overflow-hidden text-left text-[13px] tracking-[2px] text-[#65616b]"
                  aria-hidden="true"
                >
                  {residentBackNumber.length > 1
                    ? "•"
                        .repeat(Math.min(residentBackNumber.length - 1, 6))
                        .padEnd(6, "•")
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
              <ChevronDown
                size={19}
                strokeWidth={1.8}
                className="text-[#1d1c22]"
              />
            </button>

            <div className="relative">
              <input
                value={phone}
                onChange={(event) =>
                  setPhone(onlyDigits(event.target.value, 11))
                }
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
                  onChange={(event) =>
                    setVerificationCode(onlyDigits(event.target.value, 6))
                  }
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
                <h2 className="text-[15px] font-extrabold">
                  통신사를 선택해 주세요
                </h2>
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
  const [loginId, setLoginId] = useState(
    () => localStorage.getItem(SIGNUP_LOGIN_ID_KEY) ?? "",
  );
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

      <form
        className="flex flex-1 flex-col px-7 pt-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          className={`h-[50px] w-full rounded-[8px] border bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] ${
            isValid
              ? "border-[#34c983]"
              : "border-[#eceaf5] focus:border-[#4640DE]"
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
            localStorage.setItem(
              SIGNUP_LOGIN_ID_KEY,
              normalizeLoginId(loginId),
            );
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
  const confirmValid =
    confirmPassword.length > 0 && password === confirmPassword;
  const showPasswordError = hasPassword && !passwordValid;
  const canContinue = passwordValid && confirmValid;

  async function submitSignup() {
    if (!canContinue || submitting) return;

    const loginId = localStorage.getItem(SIGNUP_LOGIN_ID_KEY) ?? "";
    const name =
      localStorage.getItem(SIGNUP_NAME_KEY)?.trim() || getDisplayUserName();
    if (!loginId) {
      setSubmitError("아이디를 먼저 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const normalizedLoginId = normalizeLoginId(loginId);
      await signup({
        login_id: getSignupLoginId(normalizedLoginId),
        email: isEmailLike(normalizedLoginId) ? normalizedLoginId : null,
        password,
        name,
      });
      localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_LOGIN_ID_KEY);
      localStorage.removeItem(AUTH_USER_NAME_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(FOOT_PROFILE_STORAGE_KEY);
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      navigate("/signup/complete");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "회원가입에 실패했습니다.",
      );
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

      <form
        className="flex flex-1 flex-col px-7 pt-5"
        onSubmit={(event) => event.preventDefault()}
      >
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
            onToggleVisible={() =>
              setShowConfirmPassword((visible) => !visible)
            }
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
      const currentUserResponse = await getCurrentUser(response.data.access_token);
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, response.data.access_token);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.data.refresh_token);
      localStorage.setItem(AUTH_LOGIN_ID_KEY, normalizeLoginId(loginId));
      localStorage.setItem(
        AUTH_USER_NAME_KEY,
        currentUserResponse.data.user.name,
      );
      navigate("/home");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame backTo="/">
      <h1 className="px-7 pt-1 text-center text-[15px] font-extrabold tracking-normal">
        로그인
      </h1>

      <form
        className="flex flex-1 flex-col px-7 pt-8"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="mb-2 text-[12px] font-bold text-[#777482]">
          아이디
        </label>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          className="h-[50px] w-full rounded-[8px] border border-[#eceaf5] bg-white px-4 text-[15px] font-semibold text-black outline-none placeholder:text-[#b9b8c2] focus:border-[#4640DE]"
          placeholder="아이디"
        />

        <label className="mb-2 mt-4 text-[12px] font-bold text-[#777482]">
          비밀번호
        </label>
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
        <div className="relative flex h-11 items-center px-5">
          <Link
            to={backTo}
            className="flex h-9 w-9 items-center justify-start text-[#111111]"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={25} strokeWidth={1.8} />
          </Link>
          <HomeTopButton className="absolute right-5 top-1 flex h-9 w-9 items-center justify-end text-[#111111]" />
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
  return <MobileStatusBar />;
}

function MobileStatusBar({
  light: _light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return <div className={`h-11 shrink-0 bg-[#FBFAFF] ${className}`} />;
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

function getDisplayUserName() {
  const storedName = localStorage.getItem(AUTH_USER_NAME_KEY)?.trim();
  if (storedName && !storedName.includes("�")) {
    return storedName;
  }

  const storedLoginId =
    localStorage.getItem(AUTH_LOGIN_ID_KEY) ??
    localStorage.getItem(SIGNUP_LOGIN_ID_KEY);
  const loginId = storedLoginId?.trim();

  if (!loginId) {
    return "고객";
  }

  if (isEmailLike(loginId)) {
    return loginId.split("@", 1)[0] || "고객";
  }

  return loginId;
}

function getProfileInitials(value: string) {
  const cleaned = value.replace(/\s+/g, "").trim();

  if (!cleaned) {
    return "SF";
  }

  const ascii = cleaned.match(/[a-zA-Z0-9]/g)?.join("") ?? "";
  if (ascii) {
    return ascii.slice(0, 2).toUpperCase();
  }

  return cleaned.slice(0, 1);
}

function getTodayLabel() {
  return new Date()
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");
}

function createMeasuredFootProfile(): FootProfile {
  return {
    measuredAt: getTodayLabel(),
    recommendedSizeMm: 275,
    footLengthMm: 263.5,
    footWidthMm: 102,
    footWidthLabel: "보통 D",
    footSide: "RIGHT",
    footSideLabel: "오른발",
    instepLabel: "보통",
    fitScore: 96,
  };
}

function createFootProfileFromMeasurement(result: MeasurementResultData): FootProfile {
  // 신발 추천 사이즈: 발 실측 길이 기준 5mm 단위 반올림 (예: 269.8mm -> 270mm, 273.8mm -> 275mm)
  const recommendedSizeMm = Math.round(result.foot_length_mm / 5) * 5;
  const footSide = result.foot_side === "LEFT" ? "LEFT" : "RIGHT";
  const footSideLabel = footSide === "LEFT" ? "왼발" : "오른발";
  const footWidthLabel =
    result.foot_width_mm >= 105
      ? "넓은 편 E"
      : result.foot_width_mm >= 95
        ? "보통 D"
        : "좁은 편 C";
  const fitScore = result.segmentation_confidence
    ? Math.round(result.segmentation_confidence * 100)
    : 92;

  return {
    measuredAt: formatDateLabel(result.measured_at),
    recommendedSizeMm,
    footLengthMm: Number(result.foot_length_mm.toFixed(1)),
    footWidthMm: Number(result.foot_width_mm.toFixed(1)),
    footWidthLabel,
    footSide,
    footSideLabel,
    instepLabel: "보통",
    fitScore,
  };
}

function formatDateLabel(value: string) {
  return new Date(value)
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 확인하지 못했습니다."));
    };
    image.src = url;
  });
}

function loadFootProfile() {
  const rawProfile = localStorage.getItem(FOOT_PROFILE_STORAGE_KEY);

  if (!rawProfile) {
    return null;
  }

  try {
    return JSON.parse(rawProfile) as FootProfile;
  } catch {
    return null;
  }
}

function saveFootProfile(profile: FootProfile) {
  localStorage.setItem(FOOT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function hasFootProfile() {
  return loadFootProfile() !== null;
}

function clearUserLocalData() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_LOGIN_ID_KEY);
  localStorage.removeItem(AUTH_USER_NAME_KEY);
  localStorage.removeItem(SIGNUP_NAME_KEY);
  localStorage.removeItem(SIGNUP_LOGIN_ID_KEY);
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(FOOT_PROFILE_STORAGE_KEY);
  localStorage.removeItem(WISHLIST_STORAGE_KEY);
}

function getFootWidthMm(profile: FootProfile) {
  if (typeof profile.footWidthMm === "number") {
    return profile.footWidthMm;
  }

  if (profile.footWidthLabel.includes("넓은")) {
    return 108;
  }

  if (profile.footWidthLabel.includes("좁은")) {
    return 90;
  }

  return 98;
}

async function saveFootProfileToDatabase(profile: FootProfile) {
  const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return;
  }

  await applyFootProfile(accessToken, {
    foot_length_mm: profile.footLengthMm,
    foot_width_mm: getFootWidthMm(profile),
    foot_side: profile.footSide || "RIGHT",
    confidence: profile.fitScore / 100,
    measured_at: new Date().toISOString(),
  });
}

function deleteFootProfile() {
  localStorage.removeItem(FOOT_PROFILE_STORAGE_KEY);
}

function getSizeChoices(recommendedSizeMm: number) {
  return [
    { size: recommendedSizeMm - 5, label: "약간 타이트" },
    { size: recommendedSizeMm, label: "추천" },
    { size: recommendedSizeMm + 5, label: "약간 여유" },
  ];
}

function getFootProfileSummary(profile: FootProfile) {
  return [
    { label: "발 길이", value: `${profile.footLengthMm}`, unit: "mm" },
    { label: "발볼", value: profile.footWidthLabel.replace(" D", "") },
    { label: "발등", value: profile.instepLabel },
  ];
}

function getFootProfileAnalysis(profile: FootProfile) {
  const footWidthMm = getFootWidthMm(profile);
  const messages: string[] = [];

  if (footWidthMm >= 105) {
    messages.push(
      "발볼이 넓은 편이라 앞코가 좁은 신발은 압박이 있을 수 있어요.",
    );
  } else if (footWidthMm >= 95) {
    messages.push("발볼은 보통 범위라 대부분의 일반 핏 신발과 잘 맞아요.");
  } else {
    messages.push(
      "발볼이 좁은 편이라 정사이즈 착용 시 여유가 느껴질 수 있어요.",
    );
  }

  if (profile.instepLabel.includes("높")) {
    messages.push("발등이 높은 편이라 끈 조절이 가능한 신발을 추천해요.");
  } else if (profile.instepLabel.includes("낮")) {
    messages.push("발등이 낮은 편이라 발을 안정적으로 잡아주는 핏이 좋아요.");
  } else {
    messages.push("발등은 보통 범위라 기본 핏에서도 안정적인 착화가 가능해요.");
  }

  if (profile.fitScore >= 95) {
    messages.push("측정 신뢰도가 높아 추천 사이즈를 그대로 사용해도 좋아요.");
  } else if (profile.fitScore < 85) {
    messages.push("측정 신뢰도가 낮아 실제 착용 전 한 번 더 확인하는 것을 추천해요.");
  }

  messages.push(
    `${profile.recommendedSizeMm}mm 기준의 안정적인 착화감을 추천해요.`,
  );

  return messages.join(" ");
}

function getBrandSizeRows(profile: FootProfile) {
  return [
    { brand: "NIKE", size: profile.recommendedSizeMm - 5 },
    { brand: "Adidas", size: profile.recommendedSizeMm },
    { brand: "New Balance", size: profile.recommendedSizeMm },
    { brand: "Asics", size: profile.recommendedSizeMm },
    { brand: "Mizuno", size: profile.recommendedSizeMm - 5 },
  ];
}

function getProductById(productId: string) {
  const product = shopProducts.find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  return {
    ...product,
    ...detailProductOverrides[product.id],
  };
}

function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function cartItemKey(item: CartItem) {
  return `${item.productId}:${item.size}`;
}

function loadCartItems() {
  const rawItems = localStorage.getItem(CART_STORAGE_KEY);

  if (!rawItems) {
    return defaultCartItems;
  }

  try {
    const parsed = JSON.parse(rawItems) as CartItem[];
    return parsed.filter(
      (item) => getProductById(item.productId) && item.quantity > 0,
    );
  } catch {
    return defaultCartItems;
  }
}

function saveCartItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function addProductToCart(productId: string, size: string) {
  const currentItems = loadCartItems();
  const existingItem = currentItems.find(
    (item) => item.productId === productId && item.size === size,
  );
  const nextItems = existingItem
    ? currentItems.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...currentItems, { productId, size, quantity: 1 }];

  saveCartItems(nextItems);
}

function loadWishlistIds() {
  const rawItems = localStorage.getItem(WISHLIST_STORAGE_KEY);

  if (!rawItems) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(rawItems) as string[];
    return parsed.filter((productId) => getProductById(productId));
  } catch {
    return [];
  }
}

function saveWishlistIds(productIds: string[]) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
}

function toggleProductWishlist(productId: string) {
  const currentIds = loadWishlistIds();
  const nextIds = currentIds.includes(productId)
    ? currentIds.filter((item) => item !== productId)
    : [...currentIds, productId];

  saveWishlistIds(nextIds);
  return nextIds;
}

function getWishlistProducts() {
  return loadWishlistIds()
    .map((productId) => getProductById(productId))
    .filter((product): product is ShopProduct => Boolean(product));
}

function isWishlistProduct(productId: string) {
  return loadWishlistIds().includes(productId);
}

function getProductBadgeLabel(product: ShopProduct) {
  if (!product.badge || !hasFootProfile()) {
    return "";
  }

  return "✨ Fit for You";
}

function HomePage() {
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

function HomeHeader() {
  return (
    <header className="flex h-[61px] items-center gap-3">
      <Link
        to="/home"
        className="flex h-[46px] w-[98px] shrink-0 items-center"
        aria-label="shoe-fit 홈"
      >
        <img
          src={shoeFitLogoImage}
          alt="shoe-fit"
          className="h-auto w-full object-contain"
        />
      </Link>
      <Link
        to="/search"
        className="relative z-10 flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f0eefb] px-4 text-left"
        aria-label="상품 검색"
      >
        <Search size={20} className="shrink-0 text-[#9d98d9]" />
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#aaa6c7]">
          브랜드, 상품명 검색
        </span>
      </Link>
      <Link
        to="/cart"
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#c9c0f8] text-white"
        aria-label="장바구니"
      >
        <ShoppingCart size={24} strokeWidth={2.2} />
      </Link>
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
    <section className="relative -mx-4 mt-4 h-[377px] overflow-hidden bg-[#24222b]">
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
      <div className="absolute left-4 right-4 top-4 h-[327px] overflow-hidden rounded-[14px] bg-[#24222b] shadow-lg shadow-black/12">
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
        <div className="absolute bottom-[52px] left-7 right-7 text-white">
          <p className="text-[31px] font-bold leading-[1.18] tracking-normal">
            {activeSlide.title}
          </p>
          <p className="mt-4 text-[19px] font-semibold leading-7 text-white/86">
            {activeSlide.description}
          </p>
        </div>
      </div>
      <div className="absolute bottom-[28px] left-1/2 flex -translate-x-1/2 gap-2">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-8 bg-[#4640DE]" : "w-3 bg-white"
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
    <div className="hide-scrollbar mt-[54px] flex h-[83px] gap-3 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.label}
          type="button"
          className="flex w-[82px] shrink-0 flex-col items-center gap-2"
        >
          <span
            className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full ${
              category.image ? "bg-[#f5f3ff]" : "bg-[#c9c0f8]"
            }`}
          >
            {category.image ? (
              <img
                src={category.image}
                alt=""
                className="max-h-[44px] max-w-[64px] object-contain"
              />
            ) : (
              <span className="text-[21px] font-bold text-[#4640DE]">ALL</span>
            )}
          </span>
          <span className="text-[15px] font-semibold text-[#4640DE]">
            {category.label}
          </span>
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
  className = "",
}: {
  title: string;
  subtitle?: string;
  products: ShopProduct[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-normal text-[#191821]">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-[17px] font-normal text-[#8a8695]">
              {subtitle}
            </p>
          )}
        </div>
        <button type="button" className="text-[13px] font-normal text-[#8b8795]">
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
  const [wishlisted, setWishlisted] = useState(() =>
    isWishlistProduct(product.id),
  );
  const badgeLabel = getProductBadgeLabel(product);

  return (
    <article className={compact ? "w-[113px] shrink-0" : "min-w-0"}>
      <Link
        to={`/products/${product.id}`}
        className={`relative flex items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2 ${
          compact ? "h-[126px]" : "h-[171px]"
        }`}
      >
        {badgeLabel && (
          <span className="absolute left-2 top-2 rounded-full bg-[#6f66ff] px-2 py-1 text-[9px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setWishlisted(toggleProductWishlist(product.id).includes(product.id));
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            setWishlisted(toggleProductWishlist(product.id).includes(product.id));
          }}
          className={`absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ${
            wishlisted ? "text-[#4640DE]" : "text-[#777482]"
          }`}
          aria-label="위시리스트 등록"
        >
          <Heart size={13} strokeWidth={1.9} fill={wishlisted ? "currentColor" : "none"} />
        </span>
      </Link>
      <p className="mt-2 text-[10px] font-normal text-[#888493]">
        {product.brand}
      </p>
      <Link
        to={`/products/${product.id}`}
        className="mt-0.5 block truncate text-[12px] font-semibold text-[#1f1d28]"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-[11px] font-normal text-[#1f1d28]">
        {product.price}
      </p>
      <div className="mt-1 flex gap-1">
        <span className="rounded-[4px] bg-[#f1efff] px-1.5 py-0.5 text-[8px] font-normal text-[#4640DE]">
          AI FIT
        </span>
        <span className="rounded-[4px] bg-[#f6f5fb] px-1.5 py-0.5 text-[8px] font-normal text-[#8a8695]">
          빠른배송
        </span>
      </div>
    </article>
  );
}

function MiniProductCard({ product }: { product: ShopProduct }) {
  const badgeLabel = getProductBadgeLabel(product);

  return (
    <article className="min-w-0">
      <Link
        to={`/products/${product.id}`}
        className="relative flex aspect-square items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2"
      >
        {badgeLabel && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#6f66ff] px-1.5 py-0.5 text-[8px] font-black text-white">
            {badgeLabel}
          </span>
        )}
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </Link>
      <p className="mt-2 truncate text-[8px] font-bold text-[#888493]">
        {product.brand}
      </p>
      <h3 className="line-clamp-2 min-h-[28px] text-[10px] font-extrabold leading-[14px] text-[#1f1d28]">
        {product.name}
      </h3>
      <p className="mt-1 text-[10px] font-normal text-[#1f1d28]">
        {product.price}
      </p>
    </article>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <div className="flex h-11 items-center justify-between">
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
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
          <Link
            to="/cart"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]"
            aria-label="장바구니"
          >
            <ShoppingCart size={15} />
          </Link>
        </div>
      </div>
      <div className="mt-1">
        <h1 className="text-[13px] font-black text-[#1f1d28]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-[10px] font-bold text-[#8a8695]">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}

function HomeTopButton({
  className = "absolute right-0 flex h-9 w-9 items-center justify-end text-[#111111]",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const target = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) ? "/home" : "/";

  return (
    <Link
      to={target}
      className={className}
      aria-label="홈으로 이동"
    >
      <Home size={19} strokeWidth={2} className={light ? "text-white" : ""} />
    </Link>
  );
}

function MeasurePage() {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [footProfile, setFootProfile] = useState<FootProfile | null>(() =>
    loadFootProfile(),
  );
  const [step, setStep] = useState<MeasureStep>(() =>
    loadFootProfile() ? "profile" : "start",
  );
  const [paperChecks, setPaperChecks] = useState([false, false, false]);
  const [consents, setConsents] = useState([false, false, false, false]);
  const [fitPreference, setFitPreference] = useState("normal");
  const [measurementSessionId, setMeasurementSessionId] = useState("");
  const [measurementShots, setMeasurementShots] = useState<MeasurementBatchShot[]>([]);
  const [measurementError, setMeasurementError] = useState("");
  const [measurementNotice, setMeasurementNotice] = useState("");
  const [processingMessage, setProcessingMessage] = useState(
    "잠시만 기다려 주세요",
  );
  const [measurementSavedByBackend, setMeasurementSavedByBackend] =
    useState(false);
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY));
  const displayUserName = getDisplayUserName();

  useEffect(() => {
    if (step === "login" && isLoggedIn) {
      setStep("start");
    }
  }, [isLoggedIn, step]);

  const allConsentChecked = consents.every(Boolean);
  const allPaperChecked = paperChecks.every(Boolean);
  const isVariationRetake = measurementError.startsWith("촬영 간 편차");

  async function startMeasurementSession() {
    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

    if (!accessToken) {
      setStep("login");
      return;
    }

    try {
      setMeasurementError("");
      setMeasurementNotice("");
      setProcessingMessage("측정 세션을 준비하고 있어요");
      const consent = await createMeasurementConsent(accessToken);
      const session = await createMeasurementSession(
        accessToken,
        consent.data.id,
      );
      setMeasurementSessionId(session.data.session_id);
      setMeasurementShots([]);
      setStep("guide");
    } catch (error) {
      setMeasurementError(
        error instanceof Error
          ? error.message
          : "측정 세션을 생성하지 못했습니다.",
      );
    }
  }

  async function handleMeasurementImageSelected(file: File) {
    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

    if (!accessToken) {
      setStep("login");
      return;
    }

    if (!measurementSessionId) {
      setMeasurementError("측정 세션이 없습니다. 처음부터 다시 진행해 주세요.");
      setStep("qualityFail");
      return;
    }

    try {
      setMeasurementError("");
      setProcessingMessage("이미지를 업로드하고 있어요");
      setStep("processing");
      const dimensions = await getImageDimensions(file);

      const uploaded = await uploadMeasurementImage({
        accessToken,
        sessionId: measurementSessionId,
        image: file,
        clientWidth: dimensions.width,
        clientHeight: dimensions.height,
        deviceOrientation:
          dimensions.width > dimensions.height ? "landscape" : "portrait",
      });

      setProcessingMessage("측정용지와 발 상태를 검증하고 있어요");
      await validateMeasurementImage(accessToken, measurementSessionId);

      const shot: MeasurementBatchShot = {
        imageId: uploaded.data.image_id,
        pointX: Math.round(dimensions.width / 2),
        pointY: Math.round(dimensions.height / 2),
        footSide: "RIGHT",
      };
      const nextShots = [...measurementShots, shot];
      setMeasurementShots(nextShots);

      if (nextShots.length < 3) {
        setProcessingMessage(`${nextShots.length}장 검증 완료`);
        setStep("camera");
        return;
      }

      setProcessingMessage("3장의 측정값을 비교하고 있어요");
      const result = await analyzeMeasurementBatch({
        accessToken,
        sessionId: measurementSessionId,
        shots: nextShots,
      });

      if (result.data.retake_required || !result.data.result) {
        setMeasurementShots([]);
        const measuredValues = result.data.individual_measurements
          .map(
            (measurement, index) =>
              `${index + 1}차 ${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
          )
          .join(", ");
        setMeasurementError(
          `촬영 간 편차가 커요. ${measuredValues}. 같은 위치와 각도로 다시 촬영해 주세요.`,
        );
        setStep("qualityFail");
        return;
      }

      const measuredValues = result.data.individual_measurements
        .map(
          (measurement, index) =>
            `${index + 1}차 ${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
        )
        .join(", ");

      if (result.data.outlier_rejected) {
        const excludedShots = result.data.excluded_measurement_indices
          .map((index) => `${index + 1}차`)
          .join(", ");
        const acceptedValues = result.data.individual_measurements
          .filter((measurement) => measurement.accepted)
          .map(
            (measurement) =>
              `${measurement.foot_length_mm.toFixed(1)}/${measurement.foot_width_mm.toFixed(1)}mm`,
          )
          .join(", ");
        setMeasurementNotice(
          `${excludedShots} 촬영값을 제외하고 서로 가까운 두 장(${acceptedValues})으로 계산했어요.`,
        );
      } else {
        setMeasurementNotice(
          `3장 측정값: ${measuredValues}. 중앙값으로 최종 결과를 계산했어요.`,
        );
      }

      const profile = createFootProfileFromMeasurement(result.data.result);
      saveFootProfile(profile);
      setFootProfile(profile);
      setMeasurementSavedByBackend(true);
      setStep("fit");
    } catch (error) {
      setMeasurementError(
        error instanceof Error
          ? error.message
          : "발 측정 분석을 완료하지 못했습니다.",
      );
      setStep("qualityFail");
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  }

  async function completeMeasurement() {
    const profile = footProfile ?? createMeasuredFootProfile();
    saveFootProfile(profile);
    setFootProfile(profile);
    if (!measurementSavedByBackend) {
      try {
        await saveFootProfileToDatabase(profile);
      } catch (error) {
        setMeasurementError(
          error instanceof Error
            ? error.message
            : "발 프로필을 DB에 저장하지 못했습니다.",
        );
      }
    }
    setStep("result");
  }

  if (step === "login") {
    return (
      <MeasureFrame>
        <MeasureBackButton
          onClick={() => (footProfile ? setStep("profile") : setStep("start"))}
        />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eeeaff] text-[#6b5cff]">
            <LockKeyhole size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">로그인이 필요해요</h1>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-[#777482]">
            발 측정 결과를 저장하고 추천 사이즈를 확인하려면 로그인이 필요해요.
          </p>
        </div>
        <MeasureBottomButton onClick={() => navigate("/login")}>
          로그인 하기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => setStep("start")}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          나중에 할게요
        </button>
      </MeasureFrame>
    );
  }

  if (step === "denied") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("consent")} />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffecee] text-[#ff6470]">
            <ShieldAlert size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">
            동의하지 않으면
            <br />
            AI 측정을 진행할 수 없어요
          </h1>
          <p className="mt-4 rounded-[8px] bg-[#f7f5ff] px-4 py-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            수집된 이미지는 발 측정에만 사용되고 안전하게 처리됩니다.
          </p>
        </div>
        <MeasureBottomButton onClick={() => setStep("consent")}>
          동의하러 가기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => window.location.assign("/home")}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          사이즈 측정 안할래요
        </button>
      </MeasureFrame>
    );
  }

  if (step === "qualityFail") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("camera")} />
        <div className="flex flex-1 flex-col px-7 pt-24">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#777482]">
            <ScanLine size={26} />
          </div>
          <h1 className="mt-7 text-center text-[18px] font-black">
            {isVariationRetake ? (
              <>
                측정값 차이가 커요
                <br />
                세 장을 다시 촬영해 주세요
              </>
            ) : (
              <>
                측정용지를 인식하지 못했어요
                <br />
                다시 촬영할게요
              </>
            )}
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8695]">
            {measurementError || "네 개의 마커가 모두 보이도록 다시 촬영해 주세요."}
          </p>
          <div className="mt-8 space-y-3">
            {isVariationRetake ? (
              <>
                <QualityMessage success>세 장 모두 분석은 완료됐어요</QualityMessage>
                <QualityMessage>같은 자세와 거리에서 다시 촬영해 주세요</QualityMessage>
              </>
            ) : (
              <>
                <QualityMessage success>사진 밝기와 흔들림은 괜찮아요</QualityMessage>
                <QualityMessage>측정용지의 네 개 마커가 모두 보여야 해요</QualityMessage>
              </>
            )}
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("camera")}>
          재촬영 하기
        </MeasureBottomButton>
        <button
          type="button"
          onClick={() => {
            const profile = createMeasuredFootProfile();
            saveFootProfile(profile);
            setFootProfile(profile);
            setMeasurementSavedByBackend(false);
            void saveFootProfileToDatabase(profile).catch((error) => {
              setMeasurementError(
                error instanceof Error
                  ? error.message
                  : "데모 결과를 DB에 저장하지 못했습니다.",
              );
            });
            setStep("fit");
          }}
          className="mb-8 text-center text-[12px] font-bold text-[#6b5cff]"
        >
          데모 결과로 계속하기
        </button>
      </MeasureFrame>
    );
  }

  if (step === "start") {
    return (
      <MeasureFrame>
        <MeasureBackButton
          onClick={() => (footProfile ? setStep("profile") : navigate("/home"))}
        />
        <img
          src={measureStartImage}
          alt=""
          className="mx-auto mt-4 h-[300px] w-full rounded-[8px] object-cover"
        />
        <div className="px-7 pt-8 text-center">
          <h1 className="text-[18px] font-black">발 사이즈 측정</h1>
          <p className="mt-4 text-[12px] font-semibold leading-6 text-[#6b6875]">
            정확한 사이즈 추천을 위해
            <br />
            발을 촬영해 주세요.
          </p>
          {!isLoggedIn && (
            <button
              type="button"
              className="mt-6 text-[12px] font-bold text-[#6b5cff]"
              onClick={() => setStep("login")}
            >
              로그인하고 측정하기
            </button>
          )}
        </div>
        <MeasureBottomButton onClick={() => setStep("paperIntro")}>
          내 발 측정 시작
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "paperIntro") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("start")} />
        <div className="flex flex-1 flex-col px-7 pt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#4640DE]">
            <Ruler size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black leading-7">
            정확한 측정을 위해
            <br />
            전용 측정용지가 필요해요
          </h1>
          <p className="mt-4 text-[12px] font-semibold leading-6 text-[#6b6875]">
            A4 용지에 측정용지를 100% 크기로 인쇄한 뒤,
            <br />
            평평한 바닥에 놓고 한쪽 발을 올려주세요.
          </p>
          <div className="mt-8 rounded-[14px] bg-white p-4 shadow-sm">
            <div className="mx-auto flex aspect-[210/297] w-[145px] flex-col justify-between rounded-[8px] border border-[#d8d4fb] bg-[#fbfaff] p-3">
              <div className="flex justify-between">
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
              </div>
              <div className="mx-auto h-28 w-16 rounded-full border-2 border-dashed border-[#7168ff]" />
              <div className="flex justify-between">
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
                <span className="h-5 w-5 rounded-[4px] bg-[#191821]" />
              </div>
            </div>
            <a
              href="/shoe-fit-four-marker-a4.svg"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-[#f0eefb] px-4 text-[11px] font-black text-[#4640DE]"
            >
              측정용지 보기
            </a>
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("paperChecklist")}>
          측정용지 준비했어요
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "paperChecklist") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("paperIntro")} />
        <div className="px-7 pt-12">
          <h1 className="text-center text-[18px] font-black leading-7">
            촬영 전 준비 상태를
            <br />
            확인해 주세요
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-[#8a8695]">
            아래 조건을 만족해야 OpenCV가 측정용지 마커를 인식할 수 있어요.
          </p>
          <div className="mt-9 space-y-3">
            {[
              "A4 100% 크기로 인쇄했어요",
              "네 개의 검은 마커가 모두 보여요",
              "밝고 평평한 바닥에서 촬영할게요",
            ].map((label, index) => (
              <label
                key={label}
                className="flex min-h-[54px] items-center gap-3 rounded-[12px] bg-white px-4 text-[12px] font-black text-[#3b3944] shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={paperChecks[index]}
                  onChange={(event) => {
                    const next = [...paperChecks];
                    next[index] = event.target.checked;
                    setPaperChecks(next);
                  }}
                  className="h-4 w-4 accent-[#4640DE]"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-[12px] bg-[#f0eefb] p-4 text-[11px] font-bold leading-5 text-[#6b6875]">
            마커가 발에 가려지거나 종이가 구겨지면 측정이 실패할 수 있어요.
          </div>
        </div>
        <MeasureBottomButton
          disabled={!allPaperChecked}
          onClick={() => setStep("consent")}
        >
          다음
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "consent") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("paperChecklist")} />
        <div className="px-7 pt-12">
          <h1 className="text-center text-[17px] font-black leading-6">
            발 분석을 위해
            <br />
            약관에 동의해 주세요
          </h1>
          <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8695]">
            수집된 사진은 AI 분석을 위해서만 사용돼요.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "[필수] 개인정보 수집 및 이용 동의",
              "[필수] 민감 정보 처리 동의",
              "[선택] 서비스 개선용 분석 데이터 활용",
              "전체 동의하기",
            ].map((label, index) => (
              <label
                key={label}
                className="flex items-center gap-3 text-[12px] font-bold text-[#3b3944]"
              >
                <input
                  type="checkbox"
                  checked={consents[index]}
                  onChange={(event) => {
                    const next = [...consents];
                    next[index] = event.target.checked;
                    if (index === 3) {
                      next.fill(event.target.checked);
                    }
                    setConsents(next);
                  }}
                  className="h-4 w-4 accent-[#4640DE]"
                />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-[#aaa6c7]">보기</span>
              </label>
            ))}
          </div>
        </div>
        <MeasureBottomButton
          disabled={!allConsentChecked}
          onClick={startMeasurementSession}
        >
          동의하고 시작하기
        </MeasureBottomButton>
        {measurementError && (
          <p className="mx-7 mb-4 rounded-[8px] bg-[#ffe8ec] px-4 py-3 text-center text-[11px] font-bold leading-5 text-[#f05464]">
            {measurementError}
          </p>
        )}
        {!allConsentChecked && (
          <button
            type="button"
            onClick={() => setStep("denied")}
            className="mb-8 text-[12px] font-bold text-[#8a84d8]"
          >
            동의 없이 진행하기
          </button>
        )}
      </MeasureFrame>
    );
  }

  if (step === "guide") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("consent")} />
        <div className="px-7 pt-8">
          <h1 className="text-center text-[17px] font-black">촬영준비</h1>
          <img
            src={measureGuideImage}
            alt=""
            className="mt-8 h-[150px] w-full rounded-[8px] object-cover"
          />
          <p className="mt-5 text-center text-[12px] font-bold text-[#1f1d28]">
            실제 측정용지와 화면 가이드를 맞춰 주세요.
          </p>
          <div className="mt-5 space-y-3 rounded-[8px] border border-[#6b5cff] bg-[#f6f4ff] p-3">
            {[
              "A4 측정용지를 바닥에 평평하게 놓아요.",
              "발이 네 개 마커를 가리지 않게 올려요.",
              "카메라 화면에 종이와 발 전체가 모두 들어오게 촬영해요.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 text-[11px] font-bold text-[#3b3944]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6b5cff] text-[10px] text-white">
                  {index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <MeasureBottomButton onClick={() => setStep("camera")}>
          모두 읽었어요
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "camera") {
    return (
      <section className="relative flex min-h-dvh flex-col bg-[#17171d] text-white">
        <div className="relative flex h-16 items-center px-5">
          <button
            type="button"
            onClick={() => setStep("guide")}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={25} />
          </button>
          <p className="mx-auto pr-6 text-[12px] font-bold">
            발 사진 촬영 {measurementShots.length + 1}/3
          </p>
          <HomeTopButton
            light
            className="absolute right-5 top-[14px] flex h-9 w-9 items-center justify-end"
          />
        </div>
        <div className="relative mx-auto mt-7 flex h-[420px] w-[286px] items-center justify-center rounded-[18px] border border-white/12 bg-white/5">
          <div className="relative aspect-[210/297] h-[355px] rounded-[10px] border-2 border-[#7168ff] bg-[#7168ff]/8 shadow-[0_0_0_999px_rgba(0,0,0,0.26)]">
            <div className="absolute left-4 top-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute right-4 top-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute bottom-4 left-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute bottom-4 right-4 h-7 w-7 rounded-[5px] border border-white/65 bg-white/20" />
            <div className="absolute left-1/2 top-1/2 h-[190px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/70" />
            <p className="absolute inset-x-0 top-[48%] text-center text-[10px] font-black text-white/70">
              발 중앙을 맞춰주세요
            </p>
          </div>
        </div>
        <p className="mt-5 px-8 text-center text-[11px] font-semibold leading-5 text-white/70">
          {measurementShots.length > 0
            ? `${measurementShots.length}장 완료했어요. 같은 발을 조금 다른 위치에서 다시 촬영해 주세요.`
            : "실제 측정용지의 네 개 마커가 화면 가이드 안에 모두 보이게 맞춰주세요."}
        </p>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleMeasurementImageSelected(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="absolute bottom-10 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#7168ff] bg-white"
          aria-label="촬영"
        />
        <button
          type="button"
          onClick={() => setStep("qualityFail")}
          className="absolute bottom-4 right-5 text-[10px] font-bold text-white/45"
        >
          실패 예시
        </button>
      </section>
    );
  }

  if (step === "processing") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("camera")} />
        <div className="flex flex-1 flex-col items-center px-7 pt-10 text-center">
          <h1 className="text-[17px] font-black">발 영역을 분석하고 있어요.</h1>
          <p className="mt-2 text-[11px] font-semibold text-[#8a8695]">
            {processingMessage}
          </p>
          <div className="relative mt-10">
            <img
              src={measureProcessingImage}
              alt=""
              className="h-[270px] w-[185px] rounded-[12px] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-[#6b5cff] bg-white/75 text-[12px] font-black text-[#4640DE]">
                65%
              </div>
            </div>
          </div>
        </div>
      </MeasureFrame>
    );
  }

  if (step === "fit") {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => setStep("processing")} />
        <div className="flex flex-1 flex-col px-7 pt-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
            <Check size={30} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">발 분석이 완료됐어요</h1>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            착화감 선호도를 선택하면 더 정확한 사이즈를 추천해요.
          </p>
          {measurementNotice && (
            <p className="mt-5 rounded-[8px] bg-[#f0eefb] px-4 py-3 text-left text-[10px] font-semibold leading-4 text-[#5d57b7]">
              {measurementNotice}
            </p>
          )}
          <div className="mt-8 rounded-[8px] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black">착화감 선호도 조정하기</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["tight", "딱 맞게"],
                ["normal", "보통"],
                ["loose", "여유있게"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFitPreference(value)}
                  className={`h-10 rounded-[10px] text-[11px] font-black ${
                    fitPreference === value
                      ? "bg-[#4640DE] text-white"
                      : "bg-[#f0eefb] text-[#6f69d8]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <MeasureBottomButton onClick={completeMeasurement}>
          이 착화감으로 조정하기
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  if (step === "result") {
    const resultProfile = footProfile ?? createMeasuredFootProfile();
    const sizeChoices = getSizeChoices(resultProfile.recommendedSizeMm);
    const summaryItems = getFootProfileSummary(resultProfile);
    const brandRows = getBrandSizeRows(resultProfile);

    return (
      <MeasureFrame scroll>
        <MeasureBackButton onClick={() => setStep("fit")} />
        <div className="border-t-2 border-[#9d65ff]" />
        <div className="px-4 pb-[142px] pt-[50px] text-center">
          <header>
            <p className="text-[17px] font-semibold leading-6 text-[#191821]">
              <span className="text-[#4640DE]">{displayUserName}님</span>을 위한
              <br />
              최적의 사이즈
            </p>
            <p className="mt-[14px] text-[10px] font-normal text-[#8a8695]">
              AI분석 결과 당신의 발에 가장 잘 맞는 사이즈 입니다.
            </p>
            <h1 className="mt-[27px] text-[48px] font-bold leading-none text-[#4640DE]">
              {resultProfile.recommendedSizeMm}
              <span className="ml-2 align-baseline text-[17px] font-semibold">
                mm
              </span>
            </h1>
            <div className="mt-[14px] inline-flex h-[28px] items-center rounded-full bg-[#4640DE] px-5 text-[10px] font-semibold text-white">
              적합도 {resultProfile.fitScore}%
            </div>
            <button
              type="button"
              className="mx-auto mt-[8px] flex items-center justify-center gap-1 text-[9px] font-normal text-[#8a84d8]"
            >
              <span className="flex h-[10px] w-[10px] items-center justify-center rounded-full border border-[#8a84d8] text-[7px]">
                ?
              </span>
              왜 이 사이즈 인가요?
            </button>
          </header>

          <section className="mt-[41px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              착화감 선택
            </h2>
            <div className="mt-[15px] grid h-[78px] grid-cols-3 rounded-full bg-[#f5f3ff] p-0">
              {sizeChoices.map(({ size, label }) => {
                const active = size === resultProfile.recommendedSizeMm;

                return (
                  <button
                    key={size}
                    type="button"
                    className={`flex flex-col items-center justify-center rounded-full text-center transition-all ${
                      active
                        ? "bg-[#4640DE] text-white"
                        : "text-[#6b5cff]"
                    }`}
                  >
                    <span className="text-[16px] font-semibold leading-none">
                      {size}
                    </span>
                    <span className="mt-[8px] text-[9px] font-normal">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-[29px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              사이즈 분석 결과
            </h2>
            <div className="mt-[15px] grid grid-cols-3 gap-[10px]">
              {summaryItems.map((item, index) => (
                <article
                  key={item.label}
                  className="flex h-[101px] flex-col justify-between rounded-[8px] bg-[#f5f3ff] px-4 py-4"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#4640DE]">
                    {index === 0 ? (
                      <Ruler size={17} strokeWidth={1.8} />
                    ) : index === 1 ? (
                      <ScanLine size={17} strokeWidth={1.8} />
                    ) : (
                      <Sparkles size={17} strokeWidth={1.8} />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-normal text-[#8a8695]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold leading-none text-[#4640DE]">
                      {item.value}
                      {item.unit && (
                        <span className="ml-0.5 text-[9px] font-normal">
                          {item.unit}
                        </span>
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-[19px] rounded-[8px] bg-[#4640DE] px-4 py-4 text-left text-white">
            <p className="inline-flex h-[26px] items-center rounded-full bg-white px-3 text-[10px] font-semibold text-[#4640DE]">
              AI 분석
            </p>
            <p className="mt-3 text-[11px] font-normal leading-5 text-white">
              {getFootProfileAnalysis(resultProfile)}
            </p>
          </section>

          <div className="mt-[29px] h-px bg-[#4640DE]" />

          <section className="mt-[25px] text-left">
            <h2 className="text-[15px] font-semibold text-[#191821]">
              브랜드별 추천 사이즈
            </h2>
            <div className="mt-[15px] space-y-[14px] px-1">
              {brandRows.map((row) => (
                <div
                  key={row.brand}
                  className="flex items-center justify-between text-[12px] font-normal text-[#191821]"
                >
                  <span>{row.brand}</span>
                  <span className="text-[#6b6875]">{row.size}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mx-auto mt-[22px] flex flex-col items-center text-[10px] font-normal text-[#6b5cff]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[25px] leading-none shadow-sm shadow-[#4640DE]/10">
                +
              </span>
              브랜드 추가하기
            </button>
          </section>

          <section className="-mx-4 mt-[30px] bg-[#f5f3ff] px-4 py-[18px] text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-normal text-[#191821]">
                추천 상품
              </h2>
              <button
                type="button"
                className="text-[10px] font-normal text-[#8a8695]"
              >
                더보기
              </button>
            </div>
            <div className="hide-scrollbar mt-[14px] flex gap-3 overflow-x-auto">
              {measurementResultProducts.map((product) => (
                <Link
                  key={product.id}
                  to="/products"
                  className="relative h-[67px] w-[76px] shrink-0 overflow-hidden rounded-[8px] bg-white shadow-sm shadow-[#4640DE]/10"
                >
                  {product.badge && (
                    <span className="absolute left-1 top-1 z-10 rounded-full bg-[#6f66ff] px-1.5 py-0.5 text-[7px] font-normal text-white">
                      {product.badge}
                    </span>
                  )}
                  <img
                    src={product.image}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-2 py-1 text-center text-[8px] font-normal text-white">
                    {product.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] bg-[#FBFAFF] px-4 pb-7 pt-4">
            <button
              type="button"
              onClick={() => {
                saveFootProfile(resultProfile);
                void saveFootProfileToDatabase(resultProfile);
              }}
              className="flex h-[54px] w-full items-center justify-center rounded-[16px] bg-[#4640DE] text-[15px] font-normal text-white"
            >
              {resultProfile.recommendedSizeMm}mm 사이즈로 저장하기
            </button>
            <button
              type="button"
              onClick={() => setStep("start")}
              className="mt-4 text-[12px] font-normal text-[#4640DE] underline"
            >
              다시 측정하기
            </button>
          </div>
        </div>
      </MeasureFrame>
    );
  }

  if (!footProfile) {
    return (
      <MeasureFrame>
        <MeasureBackButton onClick={() => navigate("/home")} />
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
            <Ruler size={28} />
          </div>
          <h1 className="mt-7 text-[18px] font-black">
            아직 저장된 발 프로필이 없어요
          </h1>
          <p className="mt-4 text-[11px] font-semibold leading-5 text-[#8a8695]">
            발을 촬영하면 추천 사이즈와 발 프로필을 저장할 수 있어요.
          </p>
        </div>
        <MeasureBottomButton onClick={() => setStep("start")}>
          발 사이즈 측정 시작
        </MeasureBottomButton>
      </MeasureFrame>
    );
  }

  return (
    <MeasureFrame>
      <MeasureBackButton onClick={() => window.location.assign("/home")} />
      <div className="flex flex-1 flex-col px-7 pt-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ded9ff] text-[#6b5cff]">
          <UserRound size={28} />
        </div>
        <h1 className="mt-7 text-[18px] font-black">
          저장된 발 프로필이 있어요
        </h1>
        <p className="mt-4 text-[11px] font-semibold leading-5 text-[#8a8695]">
          기존 프로필로 쇼핑하거나 새로 측정할 수 있어요.
        </p>
        <div className="mt-8 rounded-[8px] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold text-[#8a8695]">
            최근 측정 사이즈
          </p>
          <p className="mt-2 text-[26px] font-black text-[#4640DE]">
            {footProfile.recommendedSizeMm}mm
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] font-bold text-[#8a8695]">
            <span>{footProfile.recommendedSizeMm}</span>
            <span>{footProfile.footWidthLabel.replace(" D", "")}</span>
            <span>{footProfile.instepLabel}</span>
            <span>{footProfile.footSideLabel || "오른발"}</span>
          </div>
        </div>
      </div>
      <MeasureBottomButton onClick={() => setStep("start")}>
        재촬영하기
      </MeasureBottomButton>
    </MeasureFrame>
  );
}

function MeasureFrame({
  children,
  scroll = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <section
      className={`relative mx-auto flex min-h-[calc(100dvh-44px)] w-full flex-col bg-[#FBFAFF] ${scroll ? "overflow-y-auto" : ""}`}
    >
      <HomeTopButton className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-end text-[#111111]" />
      {children}
    </section>
  );
}

function MeasureBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-5 top-5 z-10 flex h-9 w-9 items-center justify-start text-[#111111]"
      aria-label="뒤로가기"
    >
      <ChevronLeft size={24} />
    </button>
  );
}

function MeasureBottomButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mx-7 mt-auto mb-7 flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white disabled:bg-[#c7c2f5]"
    >
      {children}
    </button>
  );
}

function QualityMessage({
  children,
  success = false,
}: {
  children: React.ReactNode;
  success?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[8px] px-4 py-3 text-[11px] font-bold ${
        success ? "bg-[#dcf7e8] text-[#18a66b]" : "bg-[#ffe8ec] text-[#f05464]"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${success ? "bg-[#18a66b]" : "bg-[#f05464]"} text-white`}
      >
        {success ? <Check size={13} /> : <X size={13} />}
      </span>
      {children}
    </div>
  );
}

function RecommendationsPage() {
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

function AccountPage() {
  const navigate = useNavigate();
  const profileName =
    localStorage.getItem(SIGNUP_NAME_KEY)?.trim() || getDisplayUserName();
  const initials = getProfileInitials(profileName);
  const quickMenus = [
    { label: "구매 내역", icon: Package },
    { label: "주문/배송 조회", icon: Truck },
    { label: "최근 본 상품", icon: Ruler },
    { label: "즐겨찾는 브랜드", icon: Star },
  ];
  const sections = [
    { title: "배송", items: ["반품/교환 내역", "배송지 관리"] },
    { title: "앱 설정", items: ["알림 설정", "캐시 삭제"] },
    {
      title: "이용 안내",
      items: [
        "문의하기",
        "공지사항",
        "자주 묻는 질문",
        "서비스 이용약관",
        "개인정보 처리방침",
      ],
    },
    { title: "기타", items: ["동의 정보/철회 삭제", "로그아웃", "회원탈퇴"] },
  ];

  async function handleAccountMenu(item: string) {
    if (item === "로그아웃") {
      clearUserLocalData();
      navigate("/");
      return;
    }

    if (item !== "회원탈퇴") {
      return;
    }

    const confirmed = window.confirm("회원탈퇴 후 계정 정보를 복구할 수 없습니다. 탈퇴할까요?");
    if (!confirmed) {
      return;
    }

    const accessToken = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    if (accessToken) {
      try {
        await deleteCurrentUser(accessToken);
      } catch {
        // 이미 만료된 토큰이어도 로컬 세션은 정리해 앱에서 탈퇴 흐름을 완료한다.
      }
    }
    clearUserLocalData();
    navigate("/");
  }

  return (
    <section className="bg-[#FBFAFF] px-5 pb-5 pt-1">
      <header className="relative flex h-12 items-center justify-center">
        <Link
          to="/home"
          className="absolute left-0 flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-[13px] font-black">마이페이지</h1>
        <button
          type="button"
          className="absolute right-0 flex h-9 w-9 items-center justify-end"
          aria-label="알림"
        >
          <Bell size={18} />
        </button>
      </header>

      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c8c0ff] text-[18px] font-black text-white">
          {initials}
        </div>
        <p className="text-[18px] font-black">{profileName} 님</p>
      </div>

      <Link
        to="/account/foot-profile"
        className="mt-4 flex h-[54px] w-full items-center justify-center rounded-[14px] bg-[#4640DE] text-[13px] font-black text-white"
      >
        발 프로필 조회
      </Link>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quickMenus.map((menu) => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.label}
              type="button"
              className="flex h-[72px] flex-col items-center justify-center gap-2 rounded-[12px] bg-white text-[#16151b] shadow-sm"
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="text-[9px] font-bold">{menu.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-[12px] font-bold text-[#8a8695]">
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-[12px] border border-[#eceaf5] bg-white">
              {section.items.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAccountMenu(item)}
                  className={`flex h-11 w-full items-center px-4 text-left text-[12px] font-bold text-[#3c3945] ${
                    index > 0 ? "border-t border-[#f0eef7]" : ""
                  } ${item === "회원탈퇴" ? "text-[#ff5664]" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function FootProfilePage() {
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

function WishlistPage() {
  const [products, setProducts] = useState(() => getWishlistProducts());

  useEffect(() => {
    setProducts(getWishlistProducts());
  }, []);

  return (
    <section className="px-3 pb-5 pt-1">
      <TopBar title="Wishlist" />

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {["전체", "운동화", "스니커즈", "러닝화"].map((item, index) => (
          <button
            key={item}
            type="button"
            className={`h-8 shrink-0 rounded-full px-4 text-[11px] font-black ${
              index === 0
                ? "bg-[#4640DE] text-white"
                : "bg-[#f0eefb] text-[#777482]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {products.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-5">
          {products.map((product) => (
            <MiniProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[440px] flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#8b84e6]">
            <Heart size={28} />
          </div>
          <p className="mt-5 text-[16px] font-black">위시리스트가 비어 있어요</p>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            상품의 하트 버튼을 눌러 마음에 드는 신발을 저장해 보세요.
          </p>
        </div>
      )}
    </section>
  );
}

function ExplorePage() {
  const location = useLocation();
  const [keyword, setKeyword] = useState(
    () => new URLSearchParams(location.search).get("q") ?? "",
  );
  const normalizedKeyword = keyword.trim().toLowerCase();
  const hasSearch = normalizedKeyword.length > 0;
  const searchResults = useMemo(() => {
    if (!hasSearch) {
      return [];
    }

    if (
      normalizedKeyword.includes("러닝") ||
      normalizedKeyword.includes("운동")
    ) {
      return [...catalogProducts, ...fitProducts, ...newProducts];
    }
    if (
      normalizedKeyword.includes("스니커즈") ||
      normalizedKeyword.includes("데일리")
    ) {
      return dailyProducts;
    }
    if (normalizedKeyword.includes("부츠")) {
      return wishlistProducts.filter((product) =>
        product.name.includes("부츠"),
      );
    }
    if (
      normalizedKeyword.includes("샌들") ||
      normalizedKeyword.includes("슬리퍼")
    ) {
      return newProducts.filter(
        (product) =>
          product.name.includes("샌들") || product.name.includes("뮬"),
      );
    }

    return searchableProducts.filter((product) => {
      const target = [
        product.brand,
        product.name,
        product.price,
        "badge" in product ? (product.badge ?? "") : "",
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(normalizedKeyword);
    });
  }, [hasSearch, normalizedKeyword]);

  return (
    <section className="px-3 pb-5 pt-1">
      <div className="flex h-11 items-center gap-2">
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
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
                <img
                  src={post.image}
                  alt=""
                  className="aspect-[0.78/1] w-full object-cover"
                />
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
                <ProductCard
                  key={`${product.id}-${product.name}`}
                  product={product}
                />
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
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const savedSearches = localStorage.getItem(RECENT_SEARCH_STORAGE_KEY);
    if (!savedSearches) return [];

    try {
      return JSON.parse(savedSearches) as string[];
    } catch {
      return [];
    }
  });
  const popular = ["러닝화", "스니커즈", "운동화", "샌들", "로퍼"];
  const rankings = [
    "러닝화",
    "스니커즈",
    "운동화",
    "샌들",
    "로퍼",
    "부츠",
    "플랫슈즈",
    "슬립온",
    "워커",
    "등산화",
  ];

  function submitSearch(searchKeyword = keyword) {
    const normalizedKeyword = searchKeyword.trim();
    if (!normalizedKeyword) return;

    setRecentSearches((current) => {
      const nextSearches = [
        normalizedKeyword,
        ...current.filter((item) => item !== normalizedKeyword),
      ].slice(0, 6);
      localStorage.setItem(
        RECENT_SEARCH_STORAGE_KEY,
        JSON.stringify(nextSearches),
      );
      return nextSearches;
    });
    navigate(`/explore?q=${encodeURIComponent(normalizedKeyword)}`);
  }

  return (
    <section className="px-3 pb-5 pt-1">
      <form
        className="flex h-11 items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-[#bdb6ff]">
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            spellCheck={false}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-[#1f1d28] outline-none placeholder:text-[#b0acbd]"
            placeholder="오늘 가장 많이 찾는 신발은?"
            aria-label="검색어"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="flex h-6 w-6 shrink-0 items-center justify-center text-[#c0bcd0]"
              aria-label="검색어 지우기"
            >
              <X size={14} />
            </button>
          )}
        </label>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]"
          type="submit"
          aria-label="검색"
        >
          <Search size={15} />
        </button>
      </form>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] font-black">최근 검색어</h2>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY);
              setRecentSearches([]);
            }}
            className="text-[10px] font-bold text-[#8a8695]"
          >
            전체 삭제
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => submitSearch(item)}
              className="rounded-full bg-[#f4f1ff] px-3 py-2 text-[10px] font-bold text-[#5c56bd]"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[12px] font-black">오늘 뜨는</h2>
        <div className="flex flex-wrap gap-2">
          {popular.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => submitSearch(item)}
              className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#777482] shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[12px] font-black">인기</h2>
        <ol className="grid grid-cols-2 gap-x-6 gap-y-2">
          {rankings.map((item, index) => (
            <li key={item} className="text-[11px] font-semibold text-[#3b3944]">
              <button type="button" onClick={() => submitSearch(item)}>
                {index + 1}. <span className="ml-1">{item}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartItems());
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    loadCartItems().map(cartItemKey),
  );
  const visibleItems = cartItems
    .map((item) => ({ item, product: getProductById(item.productId) }))
    .filter((entry): entry is { item: CartItem; product: ShopProduct } =>
      Boolean(entry.product),
    );
  const selectedItems = visibleItems.filter(({ item }) =>
    selectedKeys.includes(cartItemKey(item)),
  );
  const productTotal = selectedItems.reduce(
    (total, { item, product }) =>
      total + parsePrice(product.price) * item.quantity,
    0,
  );
  const deliveryFee = productTotal > 0 && productTotal < 200000 ? 3000 : 0;
  const totalPrice = productTotal + deliveryFee;
  const allSelected =
    visibleItems.length > 0 && selectedKeys.length === visibleItems.length;

  function updateCartItems(nextItems: CartItem[]) {
    setCartItems(nextItems);
    saveCartItems(nextItems);
    setSelectedKeys((currentKeys) =>
      currentKeys.filter((key) =>
        nextItems.some((item) => cartItemKey(item) === key),
      ),
    );
  }

  function updateQuantity(targetItem: CartItem, nextQuantity: number) {
    const nextItems = cartItems.map((item) =>
      cartItemKey(item) === cartItemKey(targetItem)
        ? { ...item, quantity: Math.max(1, nextQuantity) }
        : item,
    );
    updateCartItems(nextItems);
  }

  function removeItem(targetItem: CartItem) {
    updateCartItems(
      cartItems.filter((item) => cartItemKey(item) !== cartItemKey(targetItem)),
    );
  }

  function toggleItem(targetItem: CartItem) {
    const key = cartItemKey(targetItem);
    setSelectedKeys((currentKeys) =>
      currentKeys.includes(key)
        ? currentKeys.filter((itemKey) => itemKey !== key)
        : [...currentKeys, key],
    );
  }

  function toggleAll() {
    setSelectedKeys(
      allSelected ? [] : visibleItems.map(({ item }) => cartItemKey(item)),
    );
  }

  return (
    <section className="flex min-h-[calc(100dvh-44px)] flex-col bg-[#FBFAFF] px-5 pb-6 pt-1">
      <header className="relative flex h-12 items-center justify-center">
        <Link
          to="/home"
          className="absolute left-0 flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-[13px] font-black">장바구니</h1>
        <HomeTopButton />
      </header>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-2 text-[11px] font-black text-[#4640DE]"
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              allSelected
                ? "border-[#4640DE] bg-[#4640DE] text-white"
                : "border-[#c9c4e8] bg-white"
            }`}
          >
            {allSelected && <Check size={10} />}
          </span>
          전체선택
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full bg-[#f0eefb] px-3 py-1 text-[10px] font-black text-[#777482]"
          >
            배송지
          </button>
          <button
            type="button"
            className="rounded-full bg-[#f0eefb] px-3 py-1 text-[10px] font-black text-[#777482]"
          >
            쿠폰
          </button>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#6b5cff]">
            <ShoppingCart size={28} />
          </div>
          <p className="mt-5 text-[16px] font-black">장바구니가 비어 있어요</p>
          <Link
            to="/home"
            className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#4640DE] px-6 text-[12px] font-black text-white"
          >
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-5 hide-scrollbar">
            {visibleItems.map(({ item, product }) => {
              const key = cartItemKey(item);
              const checked = selectedKeys.includes(key);
              const itemTotal = parsePrice(product.price) * item.quantity;

              return (
                <article
                  key={key}
                  className="rounded-[12px] bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className="flex items-center gap-2 text-[11px] font-black text-[#4640DE]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          checked
                            ? "border-[#4640DE] bg-[#4640DE] text-white"
                            : "border-[#d5d1ed] bg-white"
                        }`}
                      >
                        {checked && <Check size={10} />}
                      </span>
                      {product.brand}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="text-[10px] font-bold text-[#aaa6b5]"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-[10px] bg-[#f3f2f8] p-2">
                      <img
                        src={product.image}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-[12px] font-black leading-4 text-[#1f1d28]">
                        {product.name}
                      </h2>
                      <p className="mt-2 text-[10px] font-bold text-[#8a8695]">
                        {item.size} / 1개
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-8 items-center rounded-full bg-[#f1efff] px-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity - 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-black text-[#6b5cff]"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-[12px] font-black text-[#4640DE]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-black text-[#6b5cff]"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[12px] font-normal">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-[12px] bg-white p-4 shadow-sm">
            <div className="space-y-2 text-[12px] font-bold text-[#777482]">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span className="font-normal text-[#1f1d28]">
                  {formatPrice(productTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span className="font-normal text-[#1f1d28]">
                  {deliveryFee === 0 ? "무료" : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#f0eef7] pt-3">
              <span className="text-[13px] font-black">결제 예정 금액</span>
              <span className="text-[17px] font-normal text-[#4640DE]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedItems.length === 0}
            className="mt-4 flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white disabled:bg-[#c7c2f5]"
          >
            <span className="font-normal">{formatPrice(totalPrice)}</span>
            <span className="ml-1">주문하기 / 총 {selectedItems.length}개</span>
          </button>
        </>
      )}
    </section>
  );
}

function ProductListPage() {
  return (
    <section className="px-3 pb-5 pt-1">
      <div className="flex h-11 items-center gap-2">
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <Link
          to="/search"
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f0eefb] px-3"
        >
          <span className="truncate text-[11px] font-semibold text-[#5d5969]">
            러닝화
          </span>
          <X size={13} className="ml-auto text-[#aaa6c7]" />
        </Link>
        <Link
          to="/cart"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efeaff] text-[#8b84e6]"
          aria-label="장바구니"
        >
          <ShoppingCart size={15} />
        </Link>
      </div>

      <img
        src={listBannerImage}
        alt=""
        className="mt-1 h-[42px] w-full rounded-[6px] object-cover"
      />

      <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {["신발 랭킹", "러닝화", "농구화", "운동화", "샌들", "부츠"].map(
          (item, index) => (
            <button
              key={item}
              type="button"
              className={`h-8 shrink-0 rounded-full px-3 text-[10px] font-black ${
                index === 1
                  ? "bg-[#4640DE] text-white"
                  : "bg-[#f4f1ff] text-[#777482]"
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-[14px] font-black">
          러닝화 검색 결과 <span className="text-[#777482]">110개</span>
        </h1>
        <button type="button" className="text-[10px] font-bold text-[#8a8695]">
          추천순
        </button>
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
  const navigate = useNavigate();
  const { productId } = useParams();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const baseProduct = shopProducts.find((item) => item.id === productId);

  useEffect(() => {
    setSelectedSize(null);
    setWishlisted(productId ? isWishlistProduct(productId) : false);
  }, [productId]);

  if (!baseProduct) {
    return (
      <section className="flex min-h-[calc(100dvh-120px)] flex-col px-3 pb-24 pt-1">
        <div className="relative flex h-11 items-center justify-between">
          <Link
            to="/home"
            className="flex h-9 w-9 items-center justify-start"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
          </Link>
          <HomeTopButton />
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

  function handleAddToCart() {
    addProductToCart(product.id, activeSize);
    navigate("/cart");
  }

  return (
    <section className="px-3 pb-28 pt-1">
      <div className="relative flex h-11 items-center justify-between">
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <HomeTopButton />
      </div>

      <div className="flex h-[190px] items-center justify-center">
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
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
            <img
              src={image}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
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
            <p className="text-[11px] font-bold text-[#8a8695]">
              {product.brand}
            </p>
            <h1 className="mt-1 text-[16px] font-black text-[#1f1d28]">
              {product.name}
            </h1>
            <p className="mt-2 text-[12px] font-semibold text-[#777482]">
              {product.color ?? "AI 추천 핏 상품"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWishlisted(toggleProductWishlist(product.id).includes(product.id))}
            className={`flex h-8 w-8 items-center justify-center ${
              wishlisted ? "text-[#4640DE]" : "text-[#777482]"
            }`}
            aria-label="위시리스트 등록"
          >
            <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="mt-3 text-right text-[17px] font-normal">
          {product.price}
        </p>
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
                size === activeSize
                  ? "bg-[#4640DE] text-white"
                  : "bg-[#f0eefb] text-[#6f69d8]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-2 bg-[#FBFAFF] px-4 pb-6 pt-3 shadow-[0_-10px_28px_rgba(70,64,222,0.08)]">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d9d4ff] bg-white text-[#4640DE]"
        >
          <ShoppingCart size={20} />
        </button>
        <button
          type="button"
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#4640DE] text-[13px] font-black text-white"
        >
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
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[92px] max-w-[430px] items-start justify-center pt-2">
      <div className="grid h-[76px] w-[348px] grid-cols-5 items-center rounded-[38px] bg-[#c9c0f8] px-3 shadow-[0_-8px_20px_rgba(70,64,222,0.10)]">
        {items.map(({ to, label, icon: Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-[62px] flex-col items-center justify-center gap-1 text-[9px] font-normal ${
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
                  ? "flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#5c4cf0] shadow-lg shadow-[#4640DE]/28"
                  : "flex h-6 w-6 items-center justify-center"
              }
            >
              <Icon size={primary ? 24 : 22} strokeWidth={2.1} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default App;
