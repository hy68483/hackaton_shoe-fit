import { ChevronLeft, Heart, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { catalogProducts, dailyProducts, explorePosts, fitProducts, newProducts, searchableProducts, wishlistProducts } from "./data";
import { ProductCard } from "./components";

export function ExplorePage() {
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
