import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_LOGIN_ID_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_NAME_KEY,
  CART_STORAGE_KEY,
  FOOT_PROFILE_STORAGE_KEY,
  SIGNUP_LOGIN_ID_KEY,
  SIGNUP_NAME_KEY,
  WISHLIST_STORAGE_KEY,
} from "../shared/storage";

export function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function normalizeLoginId(value: string) {
  return value.trim().toLowerCase();
}

export function isEmailLike(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getSignupLoginId(value: string) {
  if (!isEmailLike(value)) {
    return value;
  }
  return value.split("@", 1)[0];
}

export function getDisplayUserName() {
  const storedName = localStorage.getItem(AUTH_USER_NAME_KEY)?.trim();
  if (storedName && !storedName.includes("�")) {
    return storedName;
  }

  const storedLoginId =
    localStorage.getItem(AUTH_LOGIN_ID_KEY) ??
    localStorage.getItem(SIGNUP_LOGIN_ID_KEY);
  const loginId = storedLoginId?.trim();

  if (!loginId) {
    return "고객";
  }

  if (isEmailLike(loginId)) {
    return loginId.split("@", 1)[0] || "고객";
  }

  return loginId;
}

export function getProfileInitials(value: string) {
  const cleaned = value.replace(/\s+/g, "").trim();

  if (!cleaned) {
    return "SF";
  }

  const ascii = cleaned.match(/[a-zA-Z0-9]/g)?.join("") ?? "";
  if (ascii) {
    return ascii.slice(0, 2).toUpperCase();
  }

  return cleaned.slice(0, 1);
}

export function clearUserLocalData() {
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_LOGIN_ID_KEY);
  localStorage.removeItem(AUTH_USER_NAME_KEY);
  localStorage.removeItem(SIGNUP_NAME_KEY);
  localStorage.removeItem(SIGNUP_LOGIN_ID_KEY);
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(FOOT_PROFILE_STORAGE_KEY);
  localStorage.removeItem(WISHLIST_STORAGE_KEY);
}
