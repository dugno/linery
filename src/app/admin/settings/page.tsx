import AdminShell from "@/components/admin/admin-shell";

export default function AdminSettingsPage() {
  return <AdminShell title="Cài đặt" endpoint="/api/admin/site-settings" idField="id" mode="singleton" />;
}
