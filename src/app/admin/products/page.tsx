import AdminShell from "@/components/admin/admin-shell";
import { productTemplate } from "@/components/admin/templates";

export default function AdminProductsPage() {
  return <AdminShell title="Sản phẩm" endpoint="/api/admin/products" idField="slug" createTemplate={productTemplate} />;
}
