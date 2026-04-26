import AdminShell from "@/components/admin/admin-shell";

export default function AdminOrdersPage() {
  return <AdminShell title="Đơn hàng" endpoint="/api/admin/orders" idField="id" />;
}
