import { Check, ChevronLeft, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HomeTopButton } from "../shared/layout";
import type { CartItem, ShopProduct } from "./data";
import { cartItemKey, formatPrice, getProductById, loadCartItems, parsePrice, saveCartItems } from "./utils";

export function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartItems());
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    loadCartItems().map(cartItemKey),
  );
  const visibleItems = cartItems
    .map((item) => ({ item, product: getProductById(item.productId) }))
    .filter((entry): entry is { item: CartItem; product: ShopProduct } =>
      Boolean(entry.product),
    );
  const selectedItems = visibleItems.filter(({ item }) =>
    selectedKeys.includes(cartItemKey(item)),
  );
  const productTotal = selectedItems.reduce(
    (total, { item, product }) =>
      total + parsePrice(product.price) * item.quantity,
    0,
  );
  const deliveryFee = productTotal > 0 && productTotal < 200000 ? 3000 : 0;
  const totalPrice = productTotal + deliveryFee;
  const allSelected =
    visibleItems.length > 0 && selectedKeys.length === visibleItems.length;

  function updateCartItems(nextItems: CartItem[]) {
    setCartItems(nextItems);
    saveCartItems(nextItems);
    setSelectedKeys((currentKeys) =>
      currentKeys.filter((key) =>
        nextItems.some((item) => cartItemKey(item) === key),
      ),
    );
  }

  function updateQuantity(targetItem: CartItem, nextQuantity: number) {
    const nextItems = cartItems.map((item) =>
      cartItemKey(item) === cartItemKey(targetItem)
        ? { ...item, quantity: Math.max(1, nextQuantity) }
        : item,
    );
    updateCartItems(nextItems);
  }

  function removeItem(targetItem: CartItem) {
    updateCartItems(
      cartItems.filter((item) => cartItemKey(item) !== cartItemKey(targetItem)),
    );
  }

  function toggleItem(targetItem: CartItem) {
    const key = cartItemKey(targetItem);
    setSelectedKeys((currentKeys) =>
      currentKeys.includes(key)
        ? currentKeys.filter((itemKey) => itemKey !== key)
        : [...currentKeys, key],
    );
  }

  function toggleAll() {
    setSelectedKeys(
      allSelected ? [] : visibleItems.map(({ item }) => cartItemKey(item)),
    );
  }

  return (
    <section className="flex min-h-[calc(100dvh-44px)] flex-col bg-[#FBFAFF] px-5 pb-6 pt-1">
      <header className="relative flex h-12 items-center justify-center">
        <Link
          to="/home"
          className="absolute left-0 flex h-9 w-9 items-center justify-start"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-[13px] font-black">장바구니</h1>
        <HomeTopButton />
      </header>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-2 text-[11px] font-black text-[#4640DE]"
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              allSelected
                ? "border-[#4640DE] bg-[#4640DE] text-white"
                : "border-[#c9c4e8] bg-white"
            }`}
          >
            {allSelected && <Check size={10} />}
          </span>
          전체선택
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full bg-[#f0eefb] px-3 py-1 text-[10px] font-black text-[#777482]"
          >
            배송지
          </button>
          <button
            type="button"
            className="rounded-full bg-[#f0eefb] px-3 py-1 text-[10px] font-black text-[#777482]"
          >
            쿠폰
          </button>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0eefb] text-[#6b5cff]">
            <ShoppingCart size={28} />
          </div>
          <p className="mt-5 text-[16px] font-black">장바구니가 비어 있어요</p>
          <Link
            to="/home"
            className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#4640DE] px-6 text-[12px] font-black text-white"
          >
            쇼핑 계속하기
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-5 hide-scrollbar">
            {visibleItems.map(({ item, product }) => {
              const key = cartItemKey(item);
              const checked = selectedKeys.includes(key);
              const itemTotal = parsePrice(product.price) * item.quantity;

              return (
                <article
                  key={key}
                  className="rounded-[12px] bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleItem(item)}
                      className="flex items-center gap-2 text-[11px] font-black text-[#4640DE]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          checked
                            ? "border-[#4640DE] bg-[#4640DE] text-white"
                            : "border-[#d5d1ed] bg-white"
                        }`}
                      >
                        {checked && <Check size={10} />}
                      </span>
                      {product.brand}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="text-[10px] font-bold text-[#aaa6b5]"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-[10px] bg-[#f3f2f8] p-2">
                      <img
                        src={product.image}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-[12px] font-black leading-4 text-[#1f1d28]">
                        {product.name}
                      </h2>
                      <p className="mt-2 text-[10px] font-bold text-[#8a8695]">
                        {item.size} / 1개
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-8 items-center rounded-full bg-[#f1efff] px-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity - 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-black text-[#6b5cff]"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-[12px] font-black text-[#4640DE]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[16px] font-black text-[#6b5cff]"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[12px] font-normal">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-[12px] bg-white p-4 shadow-sm">
            <div className="space-y-2 text-[12px] font-bold text-[#777482]">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span className="font-normal text-[#1f1d28]">
                  {formatPrice(productTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span className="font-normal text-[#1f1d28]">
                  {deliveryFee === 0 ? "무료" : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#f0eef7] pt-3">
              <span className="text-[13px] font-black">결제 예정 금액</span>
              <span className="text-[17px] font-normal text-[#4640DE]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedItems.length === 0}
            className="mt-4 flex h-[54px] items-center justify-center rounded-[12px] bg-[#4640DE] text-[13px] font-black text-white disabled:bg-[#c7c2f5]"
          >
            <span className="font-normal">{formatPrice(totalPrice)}</span>
            <span className="ml-1">주문하기 / 총 {selectedItems.length}개</span>
          </button>
        </>
      )}
    </section>
  );
}
