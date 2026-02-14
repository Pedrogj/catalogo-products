import { z } from "zod";

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
};

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(60, "Máximo 60 caracteres."),
  sort_order: z.preprocess(
    toNumber,
    z.number().int("Debe ser entero").min(0, "Debe ser 0 o mayor"),
  ),
});

export type CategoryCreateValues = z.infer<typeof categoryCreateSchema>;

export const categoryEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(60, "Máximo 60 caracteres."),
  sort_order: z.preprocess(
    toNumber,
    z.number().int("Debe ser entero").min(0, "Debe ser 0 o mayor"),
  ),
  is_active: z.boolean(),
});

export type CategoryEditValues = z.infer<typeof categoryEditSchema>;
