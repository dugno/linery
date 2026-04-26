import { z } from "zod";

export const paymentMethodSchema = z.enum(["bank_transfer", "mbbank_vietqr", "cod"]);

export const shippingAddressSchema = z.object({
  addressLine: z.string().trim().min(1).max(240),
  district: z.string().trim().min(1).max(120),
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(20).regex(/^\+?\d+$/),
  province: z.string().trim().min(1).max(120),
  ward: z.string().trim().min(1).max(120),
});

export const checkoutSchema = z.object({
  discountCode: z.string().trim().max(80).optional(),
  note: z.string().max(2000).optional(),
  paymentMethod: paymentMethodSchema,
  shippingAddress: shippingAddressSchema,
});

export const validateDiscountSchema = z.object({
  code: z.string().trim().min(1).max(80),
});
