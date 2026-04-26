import AdminShell from "@/components/admin/admin-shell";

export default function AdminUsersPage() {
  return <AdminShell title="Người dùng" endpoint="/api/admin/users" idField="id" />;
}
