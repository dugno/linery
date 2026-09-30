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

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), ".env.local"));

async function main() {
  const { getFirebaseAdmin } = await import("../src/server/firebase-admin");
  const { buildSearchKeywords } = await import("../src/server/admin/search-index");

  const { db } = getFirebaseAdmin();
  const productsSnapshot = await db.collection("products").where("status", "==", "active").get();

  console.log(`Found ${productsSnapshot.size} active products`);

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (const doc of productsSnapshot.docs) {
    const product = doc.data();
    const slug = doc.id;

    const title = typeof product.title === "string" ? product.title : slug;
    const author = typeof product.author === "string" ? product.author : undefined;

    const searchDoc: Record<string, unknown> = {
      keywords: buildSearchKeywords(title, author, slug),
      title,
      type: "product",
      href: typeof product.href === "string" ? product.href : `/products/${slug}`,
    };

    if (author) searchDoc.author = author;
    if (typeof product.price === "number") searchDoc.price = String(product.price);

    if (
      product.image && typeof product.image === "object" && typeof (product.image as Record<string, unknown>).src === "string"
    ) {
      searchDoc.imageUrl = String((product.image as Record<string, unknown>).src);
    }

    batch.set(db.collection("searchIndex").doc(`product:${slug}`), searchDoc);
    count++;
    batchCount++;

    if (batchCount >= 500) {
      await batch.commit();
      console.log(`  Committed ${count} docs...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Rebuilt search index: ${count} products indexed`);
}

main().catch((error) => {
  console.error("Failed to rebuild search index:", error);
  process.exit(1);
});
