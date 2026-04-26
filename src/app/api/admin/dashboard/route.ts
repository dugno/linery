import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { getAdminDashboard, getAdminDashboardLowStock, getAdminDashboardOverview, getAdminDashboardRecentOrders, getAdminDashboardStatuses } from "@/server/admin/dashboard";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "dashboard.read");
    const section = new URL(request.url).searchParams.get("section");

    if (section === "overview") {
      return ok(await getAdminDashboardOverview());
    }

    if (section === "recentOrders") {
      return ok(await getAdminDashboardRecentOrders());
    }

    if (section === "lowStock") {
      return ok(await getAdminDashboardLowStock());
    }

    if (section === "statuses") {
      return ok(await getAdminDashboardStatuses());
    }

    if (section) {
      throw new ApiErrorResponse("invalid_section", "Dashboard section không hợp lệ.", 400);
    }

    return ok(await getAdminDashboard());
  } catch (error) {
    return handleApiError(error);
  }
}
