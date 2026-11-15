import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthStatusBar, HomeTopButton } from "../shared/layout";

export function AuthPageFrame({
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

export function AuthProgress() {
  return <div className="mb-7 h-1 w-5 rounded-full bg-[#4640DE]" />;
}

export function PasswordInput({
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
