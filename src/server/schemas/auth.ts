import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(8).max(20).regex(/^\+?\d+$/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const recoverPasswordSchema = z.object({
  email: z.string().email(),
});
