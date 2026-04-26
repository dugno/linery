import AdminShell from "@/components/admin/admin-shell";
import { articleTemplate } from "@/components/admin/templates";

export default function AdminArticlesPage() {
  return <AdminShell title="Bài viết" endpoint="/api/admin/articles" idField="slug" createTemplate={articleTemplate} />;
}
