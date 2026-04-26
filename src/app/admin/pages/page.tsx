import AdminShell from "@/components/admin/admin-shell";
import { pageTemplate } from "@/components/admin/templates";

export default function AdminPagesPage() {
  return <AdminShell title="Trang nội dung" endpoint="/api/admin/pages" idField="slug" createTemplate={pageTemplate} />;
}
