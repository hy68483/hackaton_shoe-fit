import { Check, ChevronLeft, X } from "lucide-react";
import { HomeTopButton } from "../shared/layout";

export function MeasureFrame({
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

export function MeasureBackButton({ onClick }: { onClick: () => void }) {
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

export function MeasureBottomButton({
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

export function QualityMessage({
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
