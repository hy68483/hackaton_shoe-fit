import { ChevronLeft, ShoppingCart, X } from "lucide-react";
import { Link } from "react-router-dom";
import listBannerImage from "../../assets/shop/list-banner.png";
import { catalogProducts } from "./data";
import { ProductCard } from "./components";

export function ProductListPage() {
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
