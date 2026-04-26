import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    let value = trimmedLine.slice(separatorIndex + 1);

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

const schemaDefinitions = {
  products: {
    required: ["slug", "href", "title", "price", "currency", "inventoryQuantity", "status", "seo"],
    fields: {
      author: "string?",
      collectionSlugs: "string[]",
      comparePrice: "number?",
      condition: "string?",
      contentTags: "string[]",
      currency: '"VND"',
      descriptionHtml: "string",
      href: "string",
      image: "MediaAsset?",
      inventoryQuantity: "number",
      price: "number",
      relatedProductSlugs: "string[]",
      seo: "SeoData",
      slug: "string",
      status: '"active" | "draft" | "archived"',
      title: "string",
      type: '"product"',
    },
  },
  collections: {
    required: ["slug", "href", "title", "seo"],
    fields: {
      breadcrumbs: "{ href: string; title: string }[]",
      descriptionHtml: "string?",
      filters: "{ title: string; items: string[] }[]",
      href: "string",
      productSlugs: "string[]",
      products: "ProductCard[]",
      seo: "SeoData",
      slug: "string",
      title: "string",
      type: '"collection"',
    },
  },
  orders: {
    required: ["orderCode", "status", "paymentStatus", "shippingAddress", "subtotal", "shippingFee", "total"],
    fields: {
      cartId: "string",
      customerId: "string?",
      discount: "number",
      discountCode: "string?",
      internalNote: "string?",
      orderAccessTokenHash: "string?",
      orderCode: "string",
      paymentMethod: '"bank_transfer" | "mbbank_vietqr" | "cod"',
      paymentStatus: '"unpaid" | "paid" | "cod_pending" | "refunded"',
      shippingAddress: "ShippingAddress",
      shippingFee: "number",
      status: '"pending_payment" | "confirmed" | "shipping" | "completed" | "cancelled"',
      subtotal: "number",
      total: "number",
      trackingCode: "string?",
    },
  },
  cartItems: {
    path: "carts/{cartId}/items/{itemId}",
    required: ["productSlug", "title", "href", "price", "currency", "quantity"],
    fields: {
      currency: '"VND"',
      href: "string",
      imageAlt: "string?",
      imageUrl: "string?",
      price: "number",
      productSlug: "string",
      quantity: "number",
      title: "string",
    },
  },
  customers: {
    required: ["uid", "email"],
    fields: {
      email: "string",
      firstName: "string?",
      lastName: "string?",
      phone: "string?",
      role: '"customer" | "admin"',
      uid: "string",
    },
  },
  discountCodes: {
    required: ["code", "active", "type", "value"],
    fields: {
      active: "boolean",
      code: "string",
      expiresAt: "Timestamp?",
      minSubtotal: "number?",
      type: '"fixed" | "percent"',
      value: "number",
    },
  },
  shippingRates: {
    required: ["fee"],
    fields: {
      active: "boolean",
      fee: "number",
      label: "string?",
    },
  },
  siteSettings: {
    path: "siteSettings/main",
    required: ["menu", "footerGroups", "contact", "stylesheets"],
    fields: {
      contact: "{ address?: string; email?: string; phone?: string }",
      footerGroups: "FooterGroup[]",
      logo: "MediaAsset?",
      menu: "NavItem[]",
      stylesheets: "string[]",
      topBanner: "{ href: string; text: string }?",
    },
  },
  contentPages: {
    collections: ["pages", "blogs", "articles"],
    required: ["slug", "href", "title", "seo"],
    fields: {
      contentHtml: "string?",
      href: "string",
      image: "MediaAsset?",
      seo: "SeoData",
      slug: "string",
      title: "string",
    },
  },
};

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const firebaseAdminModule = await import("../src/server/firebase-admin");
  const firebaseAdmin = (firebaseAdminModule as typeof firebaseAdminModule & { default?: typeof firebaseAdminModule }).default || firebaseAdminModule;
  const { FieldValue } = firebaseAdmin;
  const { db } = firebaseAdmin.getFirebaseAdmin();
  const batch = db.batch();

  for (const [id, schema] of Object.entries(schemaDefinitions)) {
    batch.set(
      db.collection("schemas").doc(id),
      {
        ...schema,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`Imported ${Object.keys(schemaDefinitions).length} schema definitions into Firestore collection "schemas".`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
