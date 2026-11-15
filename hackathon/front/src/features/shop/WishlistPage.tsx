import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { TopBar } from "../shared/layout";
import { getWishlistProducts } from "./utils";
import { MiniProductCard } from "./components";

export function WishlistPage() {
  const [products, setProducts] = useState(() => getWishlistProducts());

  useEffect(() => {
    setProducts(getWishlistProducts());
  }, []);

  return (
    <section className="px-3 pb-5 pt-1">
      <TopBar title="Wishlist" />

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {["전체", "운동화", "스니커즈", "러닝화"].map((item, index) => (
          <button
            key={item}
            type="button"
            className={`h-8 shrink-0 rounded-full px-4 text-[11px] font-black ${
              index === 0
                ? "bg-[#4640DE] text-white"
                : "bg-[#f0eefb] text-[#777482]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {products.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-5">
          {products.map((product) => (
            <MiniProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[440px] flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#8b84e6]">
            <Heart size={28} />
          </div>
          <p className="mt-5 text-[16px] font-black">위시리스트가 비어 있어요</p>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8695]">
            상품의 하트 버튼을 눌러 마음에 드는 신발을 저장해 보세요.
          </p>
        </div>
      )}
    </section>
  );
}
