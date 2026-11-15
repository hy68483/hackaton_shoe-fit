import { Bell, ChevronLeft, Package, Ruler, Star, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { deleteCurrentUser } from "../../api/auth";
import { clearUserLocalData, getDisplayUserName, getProfileInitials } from "../auth/utils";
import { AUTH_ACCESS_TOKEN_KEY, SIGNUP_NAME_KEY } from "../shared/storage";

export function AccountPage() {
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
