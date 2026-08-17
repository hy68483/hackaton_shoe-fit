import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Home,
  Mail,
  PartyPopper,
  Ruler,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import authStartImage from "./assets/auth-start.png";

const carriers = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

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
            onClick={verificationSent ? () => navigate("/signup/id") : requestVerificationCode}
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
  const [loginId, setLoginId] = useState("");
  const isValid = loginId.trim().length >= 5;

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
          onClick={() => navigate("/signup/password")}
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
  const hasPassword = password.length > 0;
  const passwordValid = password.length >= 8;
  const confirmValid = confirmPassword.length > 0 && password === confirmPassword;
  const showPasswordError = hasPassword && !passwordValid;
  const canContinue = passwordValid && confirmValid;

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
          onClick={() => navigate("/signup/complete")}
          disabled={!canContinue}
          className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
        >
          다음
        </button>
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
  const canLogin = loginId.trim().length > 0 && password.length > 0;

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
          onClick={() => navigate("/home")}
          disabled={!canLogin}
          className="mt-auto mb-8 flex h-[58px] w-full items-center justify-center rounded-[12px] bg-[#4640DE] text-[16px] font-bold text-white disabled:bg-[#c7c2f5]"
        >
          로그인
        </button>
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
