import AdminShell from "@/components/admin/admin-shell";

export default function AdminShippingPage() {
  return <AdminShell title="Phí vận chuyển" endpoint="/api/admin/shipping-rates" idField="id" />;
}
