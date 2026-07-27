// frontend/lib/api/auth.ts
import { api } from "./axios";
import { endpoints } from "./endpoints";
import { setAuthCookies } from "@/lib/cookie";

type LoginResponse = {
  success: boolean;
  token: string;
  user: {
    _id?: string;
    id?: string;
    email: string;
    fullName: string;
    role: "user" | "admin";
  };
};

export async function loginApi(email: string, password: string) {
  const res = await api.post<LoginResponse>(endpoints.auth.login, { email, password });

  const data = res.data;
  const u: any = data.user;

  const userData = {
    id: u._id || u.id || "",
    email: u.email,
    name: u.fullName,
    fullName: u.fullName,
    role: u.role,
    // profile details — used by checkout autofill & profile panel
    countryCode: u.countryCode || "",
    phone: u.phone || "",
    address: u.address || "",
    profile_picture: u.profile_picture || undefined,
  };

  setAuthCookies(userData, data.token);

  return userData;
}

// ✅ NEW: forgot password
export async function forgotPasswordApi(email: string) {
  const res = await api.post(endpoints.auth.forgotPassword, { email });
  return res.data; // { success: true, message: "..." }
}

// ✅ NEW: reset password
// ✅ reset password (code flow: email + 6-digit code + new password)
export async function resetPasswordApi(email: string, code: string, password: string) {
  const res = await api.post(endpoints.auth.resetPassword, { email, code, password });
  return res.data; // { success: true, message: "..." }
}