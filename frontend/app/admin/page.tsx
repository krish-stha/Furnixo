// frontend/app/admin/page.tsx  (NEW FILE)
import { redirect } from "next/navigation";

export default function AdminRoot() {
  redirect("/admin/dashboard");
}