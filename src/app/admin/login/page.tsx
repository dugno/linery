import type { Metadata } from "next";

import AdminLoginForm from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị - Tiệm sách Quýt",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
