import { ChevronLeft, Heart, Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HomeTopButton } from "../shared/layout";
import { detailProductOverrides, productSizes, shopProducts } from "./data";
import { addProductToCart, isWishlistProduct, toggleProductWishlist } from "./utils";

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const baseProduct = shopProducts.find((item) => item.id === productId);

  useEffect(() => {
    setSelectedSize(null);
    setWishlisted(productId ? isWishlistProduct(productId) : false);
  }, [productId]);

  if (!baseProduct) {
    return (
      <section className="flex min-h-[calc(100dvh-120px)] flex-col px-3 pb-24 pt-1">
        <div className="relative flex h-11 items-center justify-between">
          <Link
            to="/home"
            className="flex h-9 w-9 items-center justify-start"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
          </Link>
          <HomeTopButton />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-[8px] bg-white px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0eefb] text-[#8b84e6]">
            <Search size={24} />
          </div>
          <p className="mt-4 text-[15px] font-black text-[#1f1d28]">
            상품을 찾을 수 없습니다
          </p>
          <Link
            to="/home"
            className="mt-5 flex h-10 items-center justify-center rounded-full bg-[#4640DE] px-5 text-[12px] font-black text-white"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  const product = {
    ...baseProduct,
    ...detailProductOverrides[baseProduct.id],
  };
  const detailImages = product.detailImages ?? [product.image];
  const activeSize = selectedSize || product.recommendedSize || "225";

  function handleAddToCart() {
    addProductToCart(product.id, activeSize);
    navigate("/cart");
  }

  return (
    <section className="px-3 pb-28 pt-1">
      <div className="relative flex h-11 items-center justify-between">
        <Link
          to="/home"
          className="flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <HomeTopButton />
      </div>

      <div className="flex h-[190px] items-center justify-center">
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="mt-1 flex justify-center gap-3">
        {detailImages.map((image, index) => (
          <button
            key={`${product.id}-${image}`}
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${
              index === 0 ? "bg-[#d9d4ff]" : "bg-[#f0eefb]"
            }`}
          >
            <img
              src={image}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </button>
        ))}
      </div>

      <Link
        to="/measure"
        className="mx-auto mt-3 flex h-9 w-[178px] items-center justify-center rounded-full bg-[#7268f6] text-[11px] font-black text-white"
      >
        AI 발 측정으로 사이즈 추천받기
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-[#8a8695]">
              {product.brand}
            </p>
            <h1 className="mt-1 text-[16px] font-black text-[#1f1d28]">
              {product.name}
            </h1>
            <p className="mt-2 text-[12px] font-semibold text-[#777482]">
              {product.color ?? "AI 추천 핏 상품"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWishlisted(toggleProductWishlist(product.id).includes(product.id))}
            className={`flex h-8 w-8 items-center justify-center ${
              wishlisted ? "text-[#4640DE]" : "text-[#777482]"
            }`}
            aria-label="위시리스트 등록"
          >
            <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="mt-3 text-right text-[17px] font-normal">
          {product.price}
        </p>
      </div>

      <section className="mt-4">
        <h2 className="mb-3 text-[12px] font-black text-[#4640DE]">size</h2>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {productSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`h-9 min-w-[52px] rounded-[10px] text-[11px] font-black ${
                size === activeSize
                  ? "bg-[#4640DE] text-white"
                  : "bg-[#f0eefb] text-[#6f69d8]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-2 bg-[#FBFAFF] px-4 pb-6 pt-3 shadow-[0_-10px_28px_rgba(70,64,222,0.08)]">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d9d4ff] bg-white text-[#4640DE]"
        >
          <ShoppingCart size={20} />
        </button>
        <button
          type="button"
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#4640DE] text-[13px] font-black text-white"
        >
          바로 구매하기
        </button>
      </div>
    </section>
  );
}
