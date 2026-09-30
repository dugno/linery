import AdminShell from "@/components/admin/admin-shell";
import AdminCssEditor from "@/components/admin/admin-css-editor";

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Cài đặt" endpoint="/api/admin/site-settings" idField="id" mode="singleton">
      <AdminCssEditor />
    </AdminShell>
  );
}
