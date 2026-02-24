import { z } from "zod";

export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "Máximo 80 caracteres."),
  base_price: z.coerce.number().min(0, "El precio debe ser 0 o mayor."),
  description: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
  category_id: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
  is_sold_out: z.boolean(),
});

export const productEditSchema = productCreateSchema;

export type ProductCreateValues = z.infer<typeof productCreateSchema>;
export type ProductEditValues = z.infer<typeof productEditSchema>;
