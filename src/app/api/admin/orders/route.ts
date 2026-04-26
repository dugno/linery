import { listHandler } from "@/server/admin/handlers";

export const GET = listHandler("orders", "orders.read", "createdAt");
