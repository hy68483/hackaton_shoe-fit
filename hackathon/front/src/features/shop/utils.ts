import { hasFootProfile } from "../measurement/profile";
import { defaultCartItems, detailProductOverrides, shopProducts } from "./data";
import type { CartItem, ShopProduct } from "./data";
import { CART_STORAGE_KEY, WISHLIST_STORAGE_KEY } from "../shared/storage";

export function getProductById(productId: string) {
  const product = shopProducts.find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  return {
    ...product,
    ...detailProductOverrides[product.id],
  };
}

export function parsePrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

export function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export function cartItemKey(item: CartItem) {
  return `${item.productId}:${item.size}`;
}

export function loadCartItems() {
  const rawItems = localStorage.getItem(CART_STORAGE_KEY);

  if (!rawItems) {
    return defaultCartItems;
  }

  try {
    const parsed = JSON.parse(rawItems) as CartItem[];
    return parsed.filter(
      (item) => getProductById(item.productId) && item.quantity > 0,
    );
  } catch {
    return defaultCartItems;
  }
}

export function saveCartItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addProductToCart(productId: string, size: string) {
  const currentItems = loadCartItems();
  const existingItem = currentItems.find(
    (item) => item.productId === productId && item.size === size,
  );
  const nextItems = existingItem
    ? currentItems.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...currentItems, { productId, size, quantity: 1 }];

  saveCartItems(nextItems);
}

export function loadWishlistIds() {
  const rawItems = localStorage.getItem(WISHLIST_STORAGE_KEY);

  if (!rawItems) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(rawItems) as string[];
    return parsed.filter((productId) => getProductById(productId));
  } catch {
    return [];
  }
}

export function saveWishlistIds(productIds: string[]) {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
}

export function toggleProductWishlist(productId: string) {
  const currentIds = loadWishlistIds();
  const nextIds = currentIds.includes(productId)
    ? currentIds.filter((item) => item !== productId)
    : [...currentIds, productId];

  saveWishlistIds(nextIds);
  return nextIds;
}

export function getWishlistProducts() {
  return loadWishlistIds()
    .map((productId) => getProductById(productId))
    .filter((product): product is ShopProduct => Boolean(product));
}

export function isWishlistProduct(productId: string) {
  return loadWishlistIds().includes(productId);
}

export function getProductBadgeLabel(product: ShopProduct) {
  if (!product.badge || !hasFootProfile()) {
    return "";
  }

  return "✨ Fit for You";
}
