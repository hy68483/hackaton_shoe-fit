import { Check, ChevronLeft, Package, Ruler, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { getCurrentUser, login } from "../../api/auth";
import detailMainImage from "../../assets/shop/detail-main.png";
import { normalizeLoginId } from "../auth/utils";
import { AuthStatusBar } from "../shared/layout";
import { catalogProducts, productSizes, shopProducts } from "../shop/data";
import { AUTH_ACCESS_TOKEN_KEY, AUTH_LOGIN_ID_KEY, AUTH_REFRESH_TOKEN_KEY } from "../shared/storage";

export function AdminShell() {
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

export function AdminHeader({ title, backTo = "/admin/dashboard" }: { title: string; backTo?: string }) {
  return (
    <header className="relative flex h-12 items-center justify-center px-5">
      <Link to={backTo} className="absolute left-5 flex h-9 w-9 items-center justify-start" aria-label="뒤로가기">
        <ChevronLeft size={24} />
      </Link>
      <h1 className="text-[13px] font-black">{title}</h1>
    </header>
  );
}

export function AdminLoginPage() {
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

export function AdminDashboardPage() {
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

export function AdminProductCreatePage() {
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

export function AdminProductDataPage() {
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

export function AdminSizeCreatePage() {
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

export function AdminSizeEditPage() {
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

export function AdminDuplicateCheckPage() {
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

export function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[12px] font-black text-[#4640DE]">{label}</h2>
      <div className="rounded-[12px] bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}
