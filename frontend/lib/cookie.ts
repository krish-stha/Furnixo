"use client";
import Cookies from "js-cookie";

export type CookieUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";

  // ✅ add this (filename stored in DB)
  profile_picture?: string;
};

const cookieOptions = {
  expires: 1,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(user: CookieUser, token: string) {
  Cookies.set("furnixo_user", JSON.stringify(user), cookieOptions);
  Cookies.set("furnixo_token", token, cookieOptions);

  // notify UI listeners (header)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("furnixo_user_updated"));
  }
}

export function updateUserCookie(partial: Partial<CookieUser>) {
  const raw = Cookies.get("furnixo_user");
  if (!raw) return;

  try {
    const current = JSON.parse(raw);
    const next = { ...current, ...partial };

    Cookies.set("furnixo_user", JSON.stringify(next), cookieOptions);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("furnixo_user_updated"));
    }
  } catch {
    // ignore
  }
}

export function getToken() {
  return Cookies.get("furnixo_token");
}

export function getUser(): CookieUser | null {
  const raw = Cookies.get("furnixo_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookieUser;
  } catch {
    return null;
  }
}

export function clearAuthCookies() {
  Cookies.remove("furnixo_token", { path: "/" });
  Cookies.remove("furnixo_user", { path: "/" });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("furnixo_user_updated"));
  }
}
