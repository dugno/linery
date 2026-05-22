import AdminShell from "@/components/admin/admin-shell";

export default function AdminHomePage() {
  return <AdminShell title="Trang chủ" endpoint="/api/admin/home" idField="id" mode="singleton" />;
}
