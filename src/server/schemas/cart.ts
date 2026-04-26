import { z } from "zod";

export const addCartItemSchema = z.object({
  productSlug: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const updateCartNoteSchema = z.object({
  note: z.string().max(2000).optional().default(""),
});
