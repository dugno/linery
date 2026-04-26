import { ok } from "@/server/api-response";
import { listProvinces } from "@/server/firestore/shipping";

export const revalidate = 86400;

export async function GET() {
  return ok(listProvinces());
}
