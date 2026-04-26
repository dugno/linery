import { z } from "zod";

const adminRoleSchema = z.enum(["customer", "support", "order_manager", "catalog_manager", "content_editor", "marketing_manager", "admin", "owner"]);
const adminPermissionSchema = z.enum([
  "dashboard.read",
  "products.read",
  "products.create",
  "products.update",
  "products.archive",
  "collections.read",
  "collections.create",
  "collections.update",
  "orders.read",
  "orders.update_status",
  "orders.update_payment",
  "orders.add_internal_note",
  "discounts.read",
  "discounts.create",
  "discounts.update",
  "discounts.delete",
  "shipping.read",
  "shipping.update",
  "content.read",
  "content.create",
  "content.update",
  "content.delete",
  "media.read",
  "media.upload",
  "media.delete",
  "settings.read",
  "settings.update",
  "audit.read",
  "users.read",
  "users.manage_roles",
]);

const seoSchema = z
  .object({
    canonical: z.string().optional(),
    description: z.string().optional(),
    title: z.string().trim().min(1),
  })
  .passthrough();

const mediaAssetSchema = z
  .object({
    alt: z.string().optional(),
    height: z.number().int().positive().optional(),
    id: z.string().optional(),
    originalSrc: z.string().optional(),
    src: z.string().trim().min(1),
    width: z.number().int().positive().optional(),
  })
  .passthrough();

export const adminProductSchema = z.object({
  author: z.string().trim().optional(),
  collectionSlugs: z.array(z.string().trim().min(1)).default([]),
  comparePrice: z.number().int().nonnegative().optional(),
  condition: z.string().trim().optional(),
  contentTags: z.array(z.string().trim().min(1)).default([]),
  currency: z.literal("VND").default("VND"),
  descriptionHtml: z.string().default(""),
  href: z.string().trim().min(1),
  image: mediaAssetSchema.optional(),
  inventoryQuantity: z.number().int().min(0),
  price: z.number().int().nonnegative(),
  relatedProductSlugs: z.array(z.string().trim().min(1)).default([]),
  seo: seoSchema,
  slug: z.string().trim().min(1),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  title: z.string().trim().min(1),
  type: z.literal("product").default("product"),
});

export const adminProductPatchSchema = adminProductSchema.partial().extend({
  slug: z.string().trim().min(1).optional(),
});

export const adminCollectionSchema = z.object({
  bodyClass: z.string().optional().default(""),
  bodyId: z.string().optional().default("template-collection"),
  breadcrumbs: z.array(z.object({ href: z.string(), title: z.string() })).default([]),
  descriptionHtml: z.string().optional().default(""),
  filters: z.array(z.object({ items: z.array(z.string()), title: z.string() })).default([]),
  href: z.string().trim().min(1),
  productSlugs: z.array(z.string()).default([]),
  products: z.array(z.unknown()).default([]),
  seo: seoSchema,
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  type: z.literal("collection").default("collection"),
});

export const adminCollectionPatchSchema = adminCollectionSchema.partial();

export const adminOrderPatchSchema = z.object({
  internalNote: z.string().max(2000).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "cod_pending", "refunded"]).optional(),
  status: z.enum(["pending_payment", "confirmed", "shipping", "completed", "cancelled"]).optional(),
  trackingCode: z.string().max(120).optional(),
});

export const adminDiscountSchema = z.object({
  active: z.boolean().default(true),
  code: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()),
  expiresAt: z.string().datetime().optional(),
  minSubtotal: z.number().int().nonnegative().optional(),
  type: z.enum(["fixed", "percent"]),
  value: z.number().int().positive(),
});

export const adminDiscountPatchSchema = adminDiscountSchema.partial().extend({
  code: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()).optional(),
});

export const adminShippingRateSchema = z.object({
  active: z.boolean().default(true),
  fee: z.number().int().nonnegative(),
  label: z.string().trim().optional(),
});

export const adminContentPatchSchema = z.record(z.string(), z.unknown());
export const adminContentSchema = z
  .object({
    bodyClass: z.string().optional().default(""),
    bodyId: z.string().optional().default(""),
    contentHtml: z.string().optional().default(""),
    href: z.string().trim().min(1),
    seo: seoSchema,
    slug: z.string().trim().min(1),
    title: z.string().trim().min(1),
    type: z.string().trim().min(1),
  })
  .passthrough();
export const adminSettingsPatchSchema = z.record(z.string(), z.unknown());

export const adminUserPatchSchema = z.object({
  extraPermissions: z.array(adminPermissionSchema).optional(),
  revokedPermissions: z.array(adminPermissionSchema).optional(),
  role: adminRoleSchema.optional(),
  status: z.enum(["active", "disabled"]).optional(),
});
