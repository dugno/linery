import { getFirebaseAdmin } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";
import { formatVndPrice } from "@/server/money";

const productStatuses = ["active", "draft", "archived"] as const;
const orderStatuses = ["pending_payment", "confirmed", "shipping", "completed", "cancelled"] as const;
const paymentStatuses = ["unpaid", "paid", "cod_pending", "refunded"] as const;

export type AdminDashboardSection = "lowStock" | "overview" | "recentOrders" | "statuses";

type ProductSummary = {
  inventoryQuantity?: number;
  status?: string;
  title?: string;
};

type OrderSummary = {
  createdAt?: unknown;
  orderCode?: string;
  paymentStatus?: string;
  status?: string;
  total?: number;
};

async function getQueryCount(query: FirebaseFirestore.Query) {
  const snapshot = await query.count().get();

  return snapshot.data().count;
}

export async function getAdminDashboardOverview() {
  const { db } = getFirebaseAdmin();
  const productsCollection = db.collection("products");
  const [productsCount, customersCount, activeDiscountCodes, pendingOrders, ordersSnapshot] = await Promise.all([
    getQueryCount(productsCollection),
    getQueryCount(db.collection("customers")),
    getQueryCount(db.collection("discountCodes").where("active", "==", true)),
    getQueryCount(db.collection("orders").where("status", "==", "pending_payment")),
    db.collection("orders").orderBy("createdAt", "desc").limit(100).get(),
  ]);
  const revenue = ordersSnapshot.docs
    .map((doc) => doc.data() as OrderSummary)
    .filter((order) => order.paymentStatus === "paid" || order.status === "completed")
    .reduce((total, order) => total + (typeof order.total === "number" ? order.total : 0), 0);

  return {
    counts: {
      activeDiscountCodes,
      customers: customersCount,
      ordersInSample: ordersSnapshot.size,
      products: productsCount,
    },
    pendingOrders,
    revenue,
    revenueText: formatVndPrice(revenue),
  };
}

export async function getAdminDashboardRecentOrders() {
  const { db } = getFirebaseAdmin();
  const ordersSnapshot = await db.collection("orders").orderBy("createdAt", "desc").limit(8).get();

  return ordersSnapshot.docs.map((doc) =>
    serializeFirestoreValue({
      id: doc.id,
      ...(doc.data() as OrderSummary),
    }),
  );
}

export async function getAdminDashboardLowStock() {
  const { db } = getFirebaseAdmin();
  const lowStockSnapshot = await db.collection("products").where("status", "==", "active").where("inventoryQuantity", "<=", 3).orderBy("inventoryQuantity", "asc").limit(8).get();
  const lowStockProducts = lowStockSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ProductSummary) }));

  return lowStockProducts;
}

export async function getAdminDashboardStatuses() {
  const { db } = getFirebaseAdmin();
  const productsCollection = db.collection("products");
  const ordersCollection = db.collection("orders");
  const [productStatusCountEntries, orderStatusCountEntries, paymentStatusCountEntries] = await Promise.all([
    Promise.all(productStatuses.map(async (status) => [status, await getQueryCount(productsCollection.where("status", "==", status))] as const)),
    Promise.all(orderStatuses.map(async (status) => [status, await getQueryCount(ordersCollection.where("status", "==", status))] as const)),
    Promise.all(paymentStatuses.map(async (status) => [status, await getQueryCount(ordersCollection.where("paymentStatus", "==", status))] as const)),
  ]);

  return {
    orderStatusCounts: Object.fromEntries(orderStatusCountEntries),
    paymentStatusCounts: Object.fromEntries(paymentStatusCountEntries),
    productStatusCounts: Object.fromEntries(productStatusCountEntries),
  };
}

export async function getAdminDashboard() {
  const [overview, recentOrders, lowStockProducts, statuses] = await Promise.all([
    getAdminDashboardOverview(),
    getAdminDashboardRecentOrders(),
    getAdminDashboardLowStock(),
    getAdminDashboardStatuses(),
  ]);

  return {
    counts: overview.counts,
    lowStockProducts,
    orderStatusCounts: statuses.orderStatusCounts,
    paymentStatusCounts: statuses.paymentStatusCounts,
    productStatusCounts: statuses.productStatusCounts,
    recentOrders,
    revenue: overview.revenue,
    revenueText: overview.revenueText,
  };
}
