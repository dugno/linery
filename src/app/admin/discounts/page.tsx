import AdminShell from "@/components/admin/admin-shell";
import { discountTemplate } from "@/components/admin/templates";

export default function AdminDiscountsPage() {
  return <AdminShell title="Mã giảm giá" endpoint="/api/admin/discount-codes" idField="code" createTemplate={discountTemplate} />;
}
