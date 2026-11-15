import { ChevronLeft, Heart, Home, Ruler, Search, ShoppingCart, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { AUTH_ACCESS_TOKEN_KEY } from "./storage";

export function AuthStatusBar() {
  return <MobileStatusBar />;
}

export function MobileStatusBar({
  light: _light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return <div className={`h-11 shrink-0 bg-[#FBFAFF] ${className}`} />;
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
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

export function HomeTopButton({
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

export function BottomNav() {
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
