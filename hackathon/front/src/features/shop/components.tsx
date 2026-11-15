import { Heart, Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import shoeFitLogoImage from "../../assets/home/shoe-fit-logo.png";
import { categories, heroSlides } from "./data";
import type { ShopProduct } from "./data";
import { getProductBadgeLabel, isWishlistProduct, toggleProductWishlist } from "./utils";

export function HomeHeader() {
  return (
    <header className="flex h-[61px] items-center gap-3">
      <Link
        to="/home"
        className="flex h-[46px] w-[98px] shrink-0 items-center"
        aria-label="shoe-fit 홈"
      >
        <img
          src={shoeFitLogoImage}
          alt="shoe-fit"
          className="h-auto w-full object-contain"
        />
      </Link>
      <Link
        to="/search"
        className="relative z-10 flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f0eefb] px-4 text-left"
        aria-label="상품 검색"
      >
        <Search size={20} className="shrink-0 text-[#9d98d9]" />
        <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#aaa6c7]">
          브랜드, 상품명 검색
        </span>
      </Link>
      <Link
        to="/cart"
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#c9c0f8] text-white"
        aria-label="장바구니"
      >
        <ShoppingCart size={24} strokeWidth={2.2} />
      </Link>
    </header>
  );
}

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative -mx-4 mt-4 h-[377px] overflow-hidden bg-[#24222b]">
      {heroSlides.map((slide, index) => (
        <img
          key={`${slide.title}-blur`}
          src={slide.image}
          alt=""
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-[8px] transition-all duration-700 ease-out ${
            index === activeIndex
              ? "opacity-80"
              : index < activeIndex
                ? "opacity-0"
                : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/18" />
      <div className="absolute left-4 right-4 top-4 h-[327px] overflow-hidden rounded-[14px] bg-[#24222b] shadow-lg shadow-black/12">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.title}
            src={slide.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              index === activeIndex
                ? "translate-x-0 opacity-100"
                : index < activeIndex
                  ? "-translate-x-4 opacity-0"
                  : "translate-x-4 opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/14 to-transparent" />
        <div className="absolute bottom-[52px] left-7 right-7 text-white">
          <p className="text-[31px] font-bold leading-[1.18] tracking-normal">
            {activeSlide.title}
          </p>
          <p className="mt-4 text-[19px] font-semibold leading-7 text-white/86">
            {activeSlide.description}
          </p>
        </div>
      </div>
      <div className="absolute bottom-[28px] left-1/2 flex -translate-x-1/2 gap-2">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-8 bg-[#4640DE]" : "w-3 bg-white"
            }`}
            aria-label={`${index + 1}번째 배너 보기`}
          />
        ))}
      </div>
    </section>
  );
}

export function CategoryScroller() {
  return (
    <div className="hide-scrollbar mt-[54px] flex h-[83px] gap-3 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.label}
          type="button"
          className="flex w-[82px] shrink-0 flex-col items-center gap-2"
        >
          <span
            className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full ${
              category.image ? "bg-[#f5f3ff]" : "bg-[#c9c0f8]"
            }`}
          >
            {category.image ? (
              <img
                src={category.image}
                alt=""
                className="max-h-[44px] max-w-[64px] object-contain"
              />
            ) : (
              <span className="text-[21px] font-bold text-[#4640DE]">ALL</span>
            )}
          </span>
          <span className="text-[15px] font-semibold text-[#4640DE]">
            {category.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ProductSection({
  title,
  subtitle,
  products,
  compact = false,
  className = "",
}: {
  title: string;
  subtitle?: string;
  products: ShopProduct[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-normal text-[#191821]">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-[17px] font-normal text-[#8a8695]">
              {subtitle}
            </p>
          )}
        </div>
        <button type="button" className="text-[13px] font-normal text-[#8b8795]">
          더보기
        </button>
      </div>
      <div
        className={
          compact
            ? "hide-scrollbar flex gap-3 overflow-x-auto pb-1"
            : "grid grid-cols-2 gap-x-3 gap-y-5"
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact={compact} />
        ))}
      </div>
    </section>
  );
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: ShopProduct;
  compact?: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(() =>
    isWishlistProduct(product.id),
  );
  const badgeLabel = getProductBadgeLabel(product);

  return (
    <article className={compact ? "w-[113px] shrink-0" : "min-w-0"}>
      <Link
        to={`/products/${product.id}`}
        className={`relative flex items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2 ${
          compact ? "h-[126px]" : "h-[171px]"
        }`}
      >
        {badgeLabel && (
          <span className="absolute left-2 top-2 rounded-full bg-[#6f66ff] px-2 py-1 text-[9px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setWishlisted(toggleProductWishlist(product.id).includes(product.id));
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            setWishlisted(toggleProductWishlist(product.id).includes(product.id));
          }}
          className={`absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ${
            wishlisted ? "text-[#4640DE]" : "text-[#777482]"
          }`}
          aria-label="위시리스트 등록"
        >
          <Heart size={13} strokeWidth={1.9} fill={wishlisted ? "currentColor" : "none"} />
        </span>
      </Link>
      <p className="mt-2 text-[10px] font-normal text-[#888493]">
        {product.brand}
      </p>
      <Link
        to={`/products/${product.id}`}
        className="mt-0.5 block truncate text-[12px] font-semibold text-[#1f1d28]"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-[11px] font-normal text-[#1f1d28]">
        {product.price}
      </p>
      <div className="mt-1 flex gap-1">
        <span className="rounded-[4px] bg-[#f1efff] px-1.5 py-0.5 text-[8px] font-normal text-[#4640DE]">
          AI FIT
        </span>
        <span className="rounded-[4px] bg-[#f6f5fb] px-1.5 py-0.5 text-[8px] font-normal text-[#8a8695]">
          빠른배송
        </span>
      </div>
    </article>
  );
}

export function MiniProductCard({ product }: { product: ShopProduct }) {
  const badgeLabel = getProductBadgeLabel(product);

  return (
    <article className="min-w-0">
      <Link
        to={`/products/${product.id}`}
        className="relative flex aspect-square items-center justify-center rounded-[8px] bg-[#f3f2f8] p-2"
      >
        {badgeLabel && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#6f66ff] px-1.5 py-0.5 text-[8px] font-black text-white">
            {badgeLabel}
          </span>
        )}
        <img
          src={product.image}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </Link>
      <p className="mt-2 truncate text-[8px] font-bold text-[#888493]">
        {product.brand}
      </p>
      <h3 className="line-clamp-2 min-h-[28px] text-[10px] font-extrabold leading-[14px] text-[#1f1d28]">
        {product.name}
      </h3>
      <p className="mt-1 text-[10px] font-normal text-[#1f1d28]">
        {product.price}
      </p>
    </article>
  );
}
