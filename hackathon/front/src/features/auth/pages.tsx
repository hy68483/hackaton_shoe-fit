import { ChevronDown, ChevronLeft, Mail, PartyPopper, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, login, signup } from "../../api/auth";
import authStartImage from "../../assets/auth-start.png";
import { getDisplayUserName, getSignupLoginId, isEmailLike, normalizeLoginId, onlyDigits } from "./utils";
import { AuthStatusBar, MobileStatusBar } from "../shared/layout";
import { AUTH_ACCESS_TOKEN_KEY, AUTH_LOGIN_ID_KEY, AUTH_REFRESH_TOKEN_KEY, AUTH_USER_NAME_KEY, CART_STORAGE_KEY, FOOT_PROFILE_STORAGE_KEY, SIGNUP_LOGIN_ID_KEY, SIGNUP_NAME_KEY, WISHLIST_STORAGE_KEY } from "../shared/storage";
import { AuthPageFrame, AuthProgress, PasswordInput } from "./components";

const carriers = [
  "SKT",
  "KT",
  "LG U+",
  "SKT 알뜰폰",
  "KT 알뜰폰",
  "LG U+ 알뜰폰",
];

export function StartPage() {
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

export function IdentityVerificationPage() {
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

export function SignupIdPage() {
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

export function SignupPasswordPage() {
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

export function SignupCompletePage() {
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

export function LoginPage() {
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
