import { z } from "zod";

export const createGameSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(5000),
  genre: z.string().trim().min(1).max(40),
  age_rating: z.enum(["Everyone", "10+", "13+", "16+"]).default("Everyone"),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const reportSchema = z.object({
  target_type: z.enum(["user", "game", "message", "content"]),
  target_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});
