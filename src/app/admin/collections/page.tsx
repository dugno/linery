import AdminShell from "@/components/admin/admin-shell";
import { collectionTemplate } from "@/components/admin/templates";

export default function AdminCollectionsPage() {
  return <AdminShell title="Danh mục" endpoint="/api/admin/collections" idField="slug" createTemplate={collectionTemplate} />;
}
