import { ChevronLeft, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RECENT_SEARCH_STORAGE_KEY } from "../shared/storage";

export function SearchPage() {
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
