import AdminShell from "@/components/admin/admin-shell";
import { blogTemplate } from "@/components/admin/templates";

export default function AdminBlogsPage() {
  return <AdminShell title="Blog" endpoint="/api/admin/blogs" idField="slug" createTemplate={blogTemplate} />;
}
